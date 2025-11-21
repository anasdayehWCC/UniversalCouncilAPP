from datetime import datetime
from pathlib import Path
from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from backend.api.dependencies import SQLSessionDep, UserDep
from backend.api.dependencies.get_current_user import AuthContext
from common.config.loader import ConfigNotFoundError, load_tenant_config
from common.config.models import TenantConfig
from common.database.postgres_models import AuditEvent
from common.telemetry.events import _emit

admin_router = APIRouter(tags=["Admin"], prefix="/admin")


class AccessCheckResponse(BaseModel):
    hasAccess: bool
    role: str | None = None


class ConfigListItem(BaseModel):
    id: str
    name: str
    version: str
    lastModified: str


class ConfigListResponse(BaseModel):
    configs: List[ConfigListItem]


class AuditEntryResponse(BaseModel):
    id: str
    timestamp: str
    user: str
    action: str
    outcome: str


class ConfigAuditResponse(BaseModel):
    entries: List[AuditEntryResponse]


class ConfigVersionItem(BaseModel):
    version: str
    timestamp: str
    author: str
    changes: List[str]


class ConfigHistoryResponse(BaseModel):
    configName: str
    versions: List[ConfigVersionItem]


def check_admin_role(auth: AuthContext | None) -> bool:
    """Check if user has admin role based on email or explicit role assignment."""
    if not auth or not auth.user:
        return False
    
    # Check if role is admin
    if auth.role and auth.role.name == "admin":
        return True
    
    # In dev mode, allow admin@careminutes.local
    if auth.user.email == "admin@careminutes.local":
        return True
    
    # Fallback: check email pattern
    return "admin" in auth.user.email.lower()


async def require_admin(
    session: SQLSessionDep,
    auth: AuthContext = Depends(UserDep),
) -> AuthContext:
    """Dependency to require admin role."""
    if not check_admin_role(auth):
        raise HTTPException(status_code=403, detail="Admin access required")
    return auth


@admin_router.get("/check-access", response_model=AccessCheckResponse)
async def check_admin_access(
    session: SQLSessionDep,
    auth: AuthContext = Depends(UserDep),
) -> AccessCheckResponse:
    """Check if current user has admin access."""
    has_access = check_admin_role(auth)
    return AccessCheckResponse(
        hasAccess=has_access,
        role="admin" if has_access else None,
    )


@admin_router.get("/configs", response_model=ConfigListResponse)
async def list_configs(
    session: SQLSessionDep,
    admin: AuthContext = Depends(require_admin),
) -> ConfigListResponse:
    """List all available tenant configurations."""
    config_dir = Path("config")
    
    if not config_dir.exists():
        return ConfigListResponse(configs=[])
    
    configs = []
    for file_path in config_dir.glob("*.yaml"):
        try:
            tenant_id = file_path.stem
            config = load_tenant_config(tenant_id)
            
            configs.append(
                ConfigListItem(
                    id=config.id,
                    name=config.name,
                    version=config.version,
                    lastModified=datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                )
            )
        except Exception:
            continue
    
    # Log admin access
    audit_entry = AuditEvent(
        resource_type="config",
        action="admin_list_configs",
        user_id=admin.user.id,
        organisation_id=None,
        service_domain_id=None,
        path="/admin/configs",
        outcome="success",
    )
    session.add(audit_entry)
    await session.commit()
    
    _emit(
        "admin.config.list",
        user=admin.user.email,
        config_count=len(configs),
    )
    
    return ConfigListResponse(configs=configs)


@admin_router.get("/configs/{tenant_id}", response_model=TenantConfig)
async def get_config_detail(
    tenant_id: str,
    session: SQLSessionDep,
    admin: AuthContext = Depends(require_admin),
) -> TenantConfig:
    """Get detailed configuration for a specific tenant."""
    try:
        config = load_tenant_config(tenant_id)
    except ConfigNotFoundError:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    # Log admin access
    audit_entry = AuditEvent(
        resource_type="config",
        action="admin_view_config",
        user_id=admin.user.id,
        organisation_id=None,
        service_domain_id=None,
        path=f"/admin/configs/{tenant_id}",
        outcome="success",
    )
    session.add(audit_entry)
    await session.commit()
    
    _emit(
        "admin.config.view",
        user=admin.user.email,
        tenant=tenant_id,
        version=config.version,
    )
    
    return config


@admin_router.get("/configs/{tenant_id}/audit", response_model=ConfigAuditResponse)
async def get_config_audit(
    tenant_id: str,
    session: SQLSessionDep,
    admin: AuthContext = Depends(require_admin),
) -> ConfigAuditResponse:
    """Get audit trail for a specific tenant configuration."""
    from sqlalchemy import select
    from sqlmodel import col
    
    # Query audit events related to this config
    stmt = (
        select(AuditEvent)
        .where(
            col(AuditEvent.resource_type) == "config",
            col(AuditEvent.path).contains(tenant_id),
        )
        .order_by(col(AuditEvent.created_datetime).desc())
        .limit(50)
    )
    
    results = await session.exec(stmt)
    events = results.all()
    
    entries = [
        AuditEntryResponse(
            id=str(event.id),
            timestamp=event.created_datetime.isoformat(),
            user=f"user-{event.user_id}" if event.user_id else "system",
            action=event.action,
            outcome=event.outcome,
        )
        for event in events
    ]
    
    return ConfigAuditResponse(entries=entries)


@admin_router.get("/configs/{tenant_id}/history", response_model=ConfigHistoryResponse)
async def get_config_history(
    tenant_id: str,
    session: SQLSessionDep,
    admin: AuthContext = Depends(require_admin),
) -> ConfigHistoryResponse:
    """Get version history for a specific tenant configuration."""
    try:
        config = load_tenant_config(tenant_id)
    except ConfigNotFoundError:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    # For MVP, return current version only
    # In production, this would query git history or version control system
    versions = [
        ConfigVersionItem(
            version=config.version,
            timestamp=datetime.now().isoformat(),
            author="system",
            changes=["Current configuration"],
        )
    ]
    
    # Log admin access
    audit_entry = AuditEvent(
        resource_type="config",
        action="admin_view_config_history",
        user_id=admin.user.id,
        organisation_id=None,
        service_domain_id=None,
        path=f"/admin/configs/{tenant_id}/history",
        outcome="success",
    )
    session.add(audit_entry)
    await session.commit()
    
    _emit(
        "admin.config.history",
        user=admin.user.email,
        tenant=tenant_id,
    )
    
    return ConfigHistoryResponse(
        configName=config.name,
        versions=versions,
    )
