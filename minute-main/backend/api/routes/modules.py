from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select

from backend.api.dependencies import SQLSessionDep
from backend.api.dependencies.get_current_user import AuthContext, get_current_user
from common.config.loader import load_tenant_config, ConfigNotFoundError
from common.config.models import ModuleConfig
from common.database.postgres_models import UserOrgRole
from common.settings import get_settings

settings = get_settings()

modules_router = APIRouter(tags=["Modules"])


class NavItem(BaseModel):
    label: str
    href: str
    icon: str
    fab: Optional[bool] = None
    roles: Optional[list[str]] = None


class ModuleManifest(BaseModel):
    id: str
    label: str
    icon: Optional[str] = None
    routes: list[str]
    enabled: bool = True
    feature_flags: Optional[list[str]] = None
    permissions: Optional[list[str]] = None
    dependencies: Optional[list[str]] = None


class ModuleResponse(BaseModel):
    tenant_id: str
    service_domain: str
    role: str
    modules: list[ModuleManifest]
    navigation: list[NavItem]


# Static registry describing canonical module manifests; merged with tenant config overrides
MODULE_REGISTRY: dict[str, ModuleManifest] = {
    "recordings": ModuleManifest(
        id="recordings",
        label="Recordings",
        icon="Mic",
        routes=["/new", "/capture", "/recordings"],
    ),
    "transcription": ModuleManifest(
        id="transcription",
        label="Transcriptions",
        icon="Waveform",
        routes=["/transcriptions"],
    ),
    "minutes": ModuleManifest(
        id="minutes",
        label="Minutes",
        icon="FileText",
        routes=["/transcriptions/[transcriptionId]"],
        dependencies=["transcription"],
    ),
    "templates": ModuleManifest(
        id="templates",
        label="Templates",
        icon="Notebook",
        routes=["/templates"],
    ),
    "tasks": ModuleManifest(
        id="tasks",
        label="Tasks",
        icon="CheckSquare",
        routes=["/tasks"],
    ),
    "insights": ModuleManifest(
        id="insights",
        label="Insights",
        icon="BarChart3",
        routes=["/insights"],
    ),
    "admin": ModuleManifest(
        id="admin",
        label="Admin",
        icon="Shield",
        routes=["/admin"],
        permissions=["admin"],
    ),
}


@modules_router.get("/modules", response_model=ModuleResponse)
async def get_user_modules(
    current_user: AuthContext = Depends(get_current_user),
    session: SQLSessionDep = None,
) -> ModuleResponse:
    """
    Returns modules (as manifests) and navigation items for the current user's service_domain and role.

    Filters by:
    - user.service_domain_id (from UserOrgRole table)
    - user.role (from UserOrgRole table)
    - tenant config (config/*.yaml)

    Response fields:
    - modules: list of ModuleManifest (id, label, icon, routes, deps, feature_flags)
    - navigation: list of NavItem (label, href, icon, fab, roles)
    - tenant_id/service_domain/role: context of the current user
    """
    # Query UserOrgRole to get user's service_domain and role
    stmt = select(UserOrgRole).where(UserOrgRole.user_id == current_user.id)
    result = await session.execute(stmt)
    user_role = result.scalar_one_or_none()

    if not user_role or not user_role.service_domain_id:
        # No role assigned, return empty
        return ModuleResponse(
            tenant_id=settings.TENANT_CONFIG_ID or "unknown",
            service_domain="unknown",
            role="unknown",
            modules=[],
            navigation=[],
        )

    tenant_id = settings.TENANT_CONFIG_ID or str(user_role.organisation_id) or "unknown"

    try:
        config = load_tenant_config(tenant_id)
    except ConfigNotFoundError:
        # Fallback to default navigation if config not found
        return _get_default_navigation(user_role)

    # Extract domain name and role from relationships
    service_domain_name = user_role.service_domain.name if user_role.service_domain else "unknown"
    role_name = getattr(user_role.role, "name", None) or str(user_role.role or "unknown")

    enabled_modules = _filter_modules(config.modules, service_domain_name)
    manifests = [_merge_manifest(mod_cfg, role_name) for mod_cfg in enabled_modules]

    # Filter navigation items by role
    nav_items: list[NavItem] = []
    if getattr(config, "navigation", None):
        for nav in config.navigation:
            allowed_roles = nav.roles or []
            if not allowed_roles or role_name in allowed_roles:
                nav_items.append(
                    NavItem(
                        label=nav.label,
                        href=nav.href,
                        icon=nav.icon or "Square",
                        fab=nav.fab,
                        roles=allowed_roles,
                    )
                )

    return ModuleResponse(
        tenant_id=config.id,
        service_domain=service_domain_name,
        role=role_name,
        modules=manifests,
        navigation=nav_items if nav_items else _get_default_nav_items(),
    )


def _get_default_navigation(user_role: UserOrgRole) -> ModuleResponse:
    """Fallback navigation when config not found"""
    service_domain_name = user_role.service_domain.name if user_role.service_domain else "unknown"
    role_name = getattr(user_role.role, "name", None) or str(user_role.role or "unknown")

    return ModuleResponse(
        tenant_id=settings.TENANT_CONFIG_ID or "unknown",
        service_domain=service_domain_name,
        role=role_name,
        modules=[MODULE_REGISTRY["recordings"], MODULE_REGISTRY["minutes"], MODULE_REGISTRY["templates"]],
        navigation=_get_default_nav_items(),
    )


def _get_default_nav_items() -> list[NavItem]:
    """Default navigation items"""
    return [
        NavItem(label="Home", href="/", icon="LayoutDashboard"),
        NavItem(label="Cases", href="/cases", icon="Users"),
        NavItem(label="Record", href="/record", icon="Mic", fab=True),
        NavItem(label="Notes", href="/transcriptions", icon="FileText"),
    ]


def _filter_modules(modules: list[ModuleConfig], service_domain_name: str) -> list[ModuleConfig]:
    active: list[ModuleConfig] = []
    for mod in modules:
        if not mod.enabled:
            continue
        if mod.departments and service_domain_name not in mod.departments:
            continue
        active.append(mod)
    return active


def _merge_manifest(mod_cfg: ModuleConfig, role_name: str) -> ModuleManifest:
    base = MODULE_REGISTRY.get(
        mod_cfg.id,
        ModuleManifest(id=mod_cfg.id, label=mod_cfg.label or mod_cfg.id.title(), routes=mod_cfg.routes or []),
    )
    return ModuleManifest(
        id=mod_cfg.id,
        label=mod_cfg.label or base.label,
        icon=mod_cfg.icon or base.icon,
        routes=mod_cfg.routes or base.routes,
        enabled=mod_cfg.enabled,
        feature_flags=mod_cfg.feature_flags or base.feature_flags,
        permissions=base.permissions,
        dependencies=mod_cfg.dependencies or base.dependencies,
    )
