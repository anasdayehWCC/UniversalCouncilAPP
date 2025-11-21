import logging
from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, Header, HTTPException, Request
from jwt import PyJWKClient
from jwt.exceptions import PyJWTError
from sqlalchemy.orm import selectinload
from sqlmodel import select

from backend.api.dependencies.get_session import SQLSessionDep
from common.database.postgres_models import Organisation, Role, ServiceDomain, User, UserOrgRole
from common.settings import get_settings

settings = get_settings()

logger = logging.getLogger(__name__)

LOCAL_DEV_ORG_NAME = "Local Dev Council"
LOCAL_DEV_DOMAIN_NAME = "Children's Social Care"
LOCAL_DEV_ROLE_NAME = "developer"

# Cache for JWKS Clients keyed by tenant
_jwks_clients: dict[str, PyJWKClient] = {}


@dataclass
class AuthContext:
    user: User
    organisation: Organisation
    service_domain: ServiceDomain | None
    role: Role
    claims: dict
    token: str

    def __getattr__(self, item: str):
        """Delegate unknown attributes to the User instance for backwards compatibility."""
        return getattr(self.user, item)

    @property
    def organisation_id(self) -> UUID:
        return self.organisation.id

    @property
    def service_domain_id(self) -> UUID | None:  # pragma: no cover - trivial
        return self.service_domain.id if self.service_domain else None


def get_jwks_client(tenant_id: str) -> PyJWKClient:
    """Get or create JWKS client for the given tenant, caching keys for rotation handling."""
    if tenant_id not in _jwks_clients:
        jwks_url = f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"
        _jwks_clients[tenant_id] = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_clients[tenant_id]


def _parse_uuid(value: str | None) -> UUID | None:
    if not value:
        return None
    try:
        return UUID(str(value))
    except ValueError:
        return None


async def _ensure_local_seed_entities(session: SQLSessionDep) -> tuple[Organisation, ServiceDomain, Role]:
    """Create minimal org/domain/role rows for local dev if they do not exist."""
    org = (await session.exec(select(Organisation).where(Organisation.name == LOCAL_DEV_ORG_NAME))).first()
    if not org:
        org = Organisation(name=LOCAL_DEV_ORG_NAME)
        session.add(org)
        await session.commit()
        await session.refresh(org)

    domain = (
        await session.exec(
            select(ServiceDomain)
            .where(ServiceDomain.name == LOCAL_DEV_DOMAIN_NAME)
            .where(ServiceDomain.organisation_id == org.id)
        )
    ).first()
    if not domain:
        domain = ServiceDomain(name=LOCAL_DEV_DOMAIN_NAME, organisation_id=org.id)
        session.add(domain)
        await session.commit()
        await session.refresh(domain)

    role = (await session.exec(select(Role).where(Role.name == LOCAL_DEV_ROLE_NAME))).first()
    if not role:
        role = Role(name=LOCAL_DEV_ROLE_NAME, description="Local developer role")
        session.add(role)
        await session.commit()
        await session.refresh(role)

    return org, domain, role


async def get_current_user(
    session: SQLSessionDep,
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
    x_amzn_oidc_accesstoken: Annotated[str | None, Header()] = None,
) -> AuthContext:
    """
    Decode and validate JWTs against Entra ID JWKS.

    - Non-local environments: signature + issuer + audience validation.
    - Local dev: optional fake JWT when no header is supplied (guarded by DISABLE_LOCAL_FAKE_JWT).
    - Returns an AuthContext that carries org/domain/role for downstream RLS enforcement.
    """

    token_str = authorization or x_amzn_oidc_accesstoken

    # Handle dev-preview-token explicitly for local dev
    if token_str == "Bearer dev-preview-token" and settings.ENVIRONMENT in ["local", "integration-test"]:
        token_str = None

    # Local dev convenience path
    if not token_str and settings.ENVIRONMENT in ["local", "integration-test"] and not settings.DISABLE_LOCAL_FAKE_JWT:
        seed_claims = {
            "sub": "90429234-4031-7077-b9ba-60d1af121245",
            "aud": settings.AZURE_API_AUDIENCE or settings.AZURE_CLIENT_ID or "api://minute-local",
            "preferred_username": "local.dev@minute.test",
            "email": "local.dev@minute.test",
            "roles": [LOCAL_DEV_ROLE_NAME],
            "organisation_id": "00000000-0000-0000-0000-000000000001",
            "service_domain_id": "00000000-0000-0000-0000-000000000002",
        }
        token_str = jwt.encode(seed_claims, "local-secret", algorithm="HS256")

    if not token_str:
        logger.info("No authorization header provided")
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = token_str.replace("Bearer ", "")

    try:
        # Local/test environments may skip verification unless explicitly disabled
        if settings.ENVIRONMENT in ["local", "integration-test"] and not settings.DISABLE_LOCAL_FAKE_JWT:
            payload = jwt.decode(token, options={"verify_signature": False, "verify_exp": False})
        else:
            tenant_id = settings.AZURE_TENANT_ID
            audience = settings.AZURE_API_AUDIENCE or settings.AZURE_CLIENT_ID
            if not tenant_id or not audience:
                logger.error("Auth config missing: AZURE_TENANT_ID and AZURE_CLIENT_ID are required")
                raise HTTPException(status_code=401, detail="Auth configuration missing")

            issuer = f"https://login.microsoftonline.com/{tenant_id}/v2.0"
            jwks_client = get_jwks_client(tenant_id)
            signing_key = jwks_client.get_signing_key_from_jwt(token)

            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=audience,
                issuer=issuer,
                options={"verify_exp": True},
            )

        email = payload.get("preferred_username") or payload.get("email") or payload.get("upn")
        if not email:
            raise HTTPException(status_code=401, detail="Token missing email claim")

        role_claims = payload.get("roles") or payload.get("groups") or []
        if isinstance(role_claims, str):
            role_claims = [role_claims]
        if not role_claims:
            raise HTTPException(status_code=403, detail="Token missing role claims")

        organisation_id = _parse_uuid(payload.get("organisation_id") or payload.get("org_id"))
        service_domain_id = _parse_uuid(
            payload.get("service_domain_id") or payload.get("domain_id") or payload.get("serviceDomainId")
        )

        # Upsert user
        statement = select(User).where(User.email == email)
        user = (await session.exec(statement)).first()
        if not user:
            user = User(email=email)
            session.add(user)
            await session.commit()
            await session.refresh(user)

        # Load org-role assignments; eager load relationships for filtering
        org_roles_stmt = select(UserOrgRole).where(UserOrgRole.user_id == user.id).options(
            selectinload(UserOrgRole.role),
            selectinload(UserOrgRole.organisation),
            selectinload(UserOrgRole.service_domain),
        )
        org_roles = (await session.exec(org_roles_stmt)).all()

        # For local dev, auto-seed a minimal assignment if missing
        if not org_roles and settings.ENVIRONMENT in ["local", "integration-test"] and not settings.DISABLE_LOCAL_FAKE_JWT:
            org, domain, role = await _ensure_local_seed_entities(session)
            uor = UserOrgRole(user_id=user.id, organisation_id=org.id, service_domain_id=domain.id, role_id=role.id)
            session.add(uor)
            await session.commit()
            org_roles = (await session.exec(org_roles_stmt)).all()

        matching_assignment: UserOrgRole | None = None
        for assignment in org_roles:
            role_match = assignment.role and assignment.role.name in role_claims
            org_match = organisation_id is None or assignment.organisation_id == organisation_id
            domain_match = service_domain_id is None or assignment.service_domain_id == service_domain_id
            if role_match and org_match and domain_match:
                matching_assignment = assignment
                break

        if not matching_assignment:
            raise HTTPException(status_code=403, detail="User is not authorised for this organisation/domain/role")

        auth_context = AuthContext(
            user=user,
            organisation=matching_assignment.organisation,
            service_domain=matching_assignment.service_domain,
            role=matching_assignment.role,
            claims=payload,
            token=token,
        )
        request.state.auth_context = auth_context
        return auth_context

    except PyJWTError as e:
        logger.error(f"JWT Validation failed: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException:
        # FastAPI will re-raise HTTPException as is
        raise
    except Exception:
        logger.exception("Failed to authenticate user")
        raise HTTPException(
            status_code=401,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


UserDep = Annotated[AuthContext, Depends(get_current_user)]
