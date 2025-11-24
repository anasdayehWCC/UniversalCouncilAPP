from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.api.dependencies import SQLSessionDep
from backend.api.dependencies.get_current_user import AuthContext, get_current_user
from common.config.loader import load_tenant_config, ConfigNotFoundError
from common.database.postgres_models import UserOrgRole
from sqlalchemy import select

modules_router = APIRouter(tags=["Modules"])


class NavItem(BaseModel):
    label: str
    href: str
    icon: str
    fab: Optional[bool] = None
    roles: Optional[list[str]] = None


class ModuleResponse(BaseModel):
    service_domain: str
    role: str
    modules: list[str]
    nav_items: list[NavItem]


@modules_router.get("/modules", response_model=ModuleResponse)
async def get_user_modules(
    current_user: AuthContext = Depends(get_current_user),
    session: SQLSessionDep = None,
) -> ModuleResponse:
    """
    Returns modules and navigation items for the current user's service_domain and role.
    
    Filters by:
    - user.service_domain_id (from UserOrgRole table)
    - user.role (from UserOrgRole table)
    - tenant config (from config/{tenant}_{domain}.yaml)
    
    Returns:
    - modules: List of enabled module IDs
    - nav_items: List of navigation items with labels, hrefs, icons
    - service_domain: Current user's domain
    - role: Current user's role
    """
    # Query UserOrgRole to get user's service_domain and role
    stmt = select(UserOrgRole).where(UserOrgRole.user_id == current_user.user_id)
    result = await session.execute(stmt)
    user_role = result.scalar_one_or_none()
    
    if not user_role or not user_role.service_domain_id:
        # No role assigned, return empty
        return ModuleResponse(
            service_domain="unknown",
            role="unknown",
            modules=[],
            nav_items=[]
        )
    
    # Load tenant config (default to "westminster" if not specified)
    tenant_id = str(user_role.organisation_id) if user_role.organisation_id else "westminster"
    
    try:
        config = load_tenant_config(tenant_id)
    except ConfigNotFoundError:
        # Fallback to default navigation if config not found
        return _get_default_navigation(user_role)
    
    # Extract domain name from service_domain relationship
    service_domain_name = user_role.service_domain.name if user_role.service_domain else "unknown"
    role_name = user_role.role if user_role.role else "unknown"
    
    # Filter modules by domain/role from config
    # For now, return all config modules (future: filter by domain-specific config file)
    modules = [m.get("id") for m in config.modules] if hasattr(config, "modules") and config.modules else []
    
    # Filter navigation items by role
    nav_items = []
    if hasattr(config, "navigation") and config.navigation:
        for nav in config.navigation:
            # Check if nav item is allowed for this role
            allowed_roles = nav.get("roles", [])
            if not allowed_roles or role_name in allowed_roles:
                nav_items.append(NavItem(
                    label=nav["label"],
                    href=nav["href"],
                    icon=nav["icon"],
                    fab=nav.get("fab"),
                    roles=allowed_roles
                ))
    
    return ModuleResponse(
        service_domain=service_domain_name,
        role=role_name,
        modules=modules,
        nav_items=nav_items if nav_items else _get_default_nav_items()
    )


def _get_default_navigation(user_role: UserOrgRole) -> ModuleResponse:
    """Fallback navigation when config not found"""
    service_domain_name = user_role.service_domain.name if user_role.service_domain else "unknown"
    role_name = user_role.role if user_role.role else "unknown"
    
    return ModuleResponse(
        service_domain=service_domain_name,
        role=role_name,
        modules=["recordings", "minutes", "templates"],
        nav_items=_get_default_nav_items()
    )


def _get_default_nav_items() -> list[NavItem]:
    """Default navigation items"""
    return [
        NavItem(label="Home", href="/", icon="LayoutDashboard"),
        NavItem(label="Cases", href="/cases", icon="Users"),
        NavItem(label="Record", href="/record", icon="Mic", fab=True),
        NavItem(label="Notes", href="/transcriptions", icon="FileText"),
    ]
