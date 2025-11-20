import logging
from typing import Annotated

import httpx
import jwt
from fastapi import Depends, Header, HTTPException
from jwt import PyJWKClient
from jwt.exceptions import PyJWTError
from sqlmodel import select

from backend.api.dependencies.get_session import SQLSessionDep
from common.auth import parse_auth_token
from common.database.postgres_models import User
from common.settings import get_settings

settings = get_settings()

logger = logging.getLogger(__name__)

# Cache for JWKS Client
_jwks_client = None


def get_jwks_client(tenant_id: str) -> PyJWKClient:
    """Get or create JWKS client."""
    global _jwks_client
    if _jwks_client is None:
        jwks_url = f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_client


async def get_current_user(
    session: SQLSessionDep,
    authorization: Annotated[str | None, Header()] = None,
    x_amzn_oidc_accesstoken: Annotated[str | None, Header()] = None,
) -> User:
    """
    Called on every endpoint to decode JWT passed in every request.
    Validates against Entra ID JWKS using PyJWT.
    Supports local dev bypass.
    """
    # Support both standard Authorization header and AWS ALB header (legacy/compat)
    token_str = authorization or x_amzn_oidc_accesstoken

    if not token_str:
        # For local dev without auth header, inject a mock token
        if settings.ENVIRONMENT in ["local", "integration-test"]:
            jwt_dict = {
                "sub": "90429234-4031-7077-b9ba-60d1af121245",
                "aud": "account",
                "email_verified": "true",
                "preferred_username": "test@test.co.uk",
                "email": "test@test.co.uk",
                "username": "test@test.co.uk",
                "exp": 1727262399,
                "iss": "https://cognito-idp.eu-west-2.amazonaws.com/eu-west-2_example",
                "realm_access": {"roles": ["minute"]},
            }
            # We encode it but won't verify signature in local mode
            token_str = jwt.encode(jwt_dict, "secret", algorithm="HS256")
        else:
            logger.info("No authorization header provided")
            raise HTTPException(
                status_code=401,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )

    token = token_str.replace("Bearer ", "")

    try:
        # Local Dev Bypass: Skip signature verification
        if settings.ENVIRONMENT in ["local", "integration-test"]:
            payload = jwt.decode(token, options={"verify_signature": False})
        else:
            # Production / Cloud Dev: Validate against Entra ID
            tenant_id = settings.AZURE_TENANT_ID if hasattr(settings, "AZURE_TENANT_ID") else "common"
            audience = settings.AZURE_CLIENT_ID if hasattr(settings, "AZURE_CLIENT_ID") else "api://minute"
            issuer = f"https://login.microsoftonline.com/{tenant_id}/v2.0"

            # 1. Get Signing Key
            jwks_client = get_jwks_client(tenant_id)
            signing_key = jwks_client.get_signing_key_from_jwt(token)

            # 2. Verify Token
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=audience,
                issuer=issuer,
                options={"verify_exp": True}
            )
        
        email = payload.get("preferred_username") or payload.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Token missing email claim")

        # Try to find existing user
        statement = select(User).where(User.email == email)
        user = (await session.exec(statement)).first()

        if not user:
            # Create new user if doesn't exist
            user = User(email=email)
            session.add(user)
            await session.commit()
            await session.refresh(user)
            
        # TODO: Extract roles from payload.get("roles") and sync with DB UserOrgRole

        return user

    except PyJWTError as e:
        logger.error(f"JWT Validation failed: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        logger.exception("Failed to authenticate user")
        raise HTTPException(
            status_code=401,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


UserDep = Annotated[User, Depends(get_current_user)]
