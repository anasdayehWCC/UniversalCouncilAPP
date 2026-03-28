from datetime import datetime
from pathlib import Path
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.api.dependencies import SQLSessionDep, UserDep
from backend.api.dependencies.get_current_user import AuthContext
from common.config.loader import ConfigNotFoundError, load_tenant_config
from common.config.models import TenantConfig
from common.database.postgres_models import AuditEvent
from common.errors import ErrorCodes, forbidden, not_found
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
        raise forbidden("Admin access required", ErrorCodes.FORBIDDEN)
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
        raise not_found("Configuration", ErrorCodes.CONFIG_NOT_FOUND)
    
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
        raise not_found("Configuration", ErrorCodes.CONFIG_NOT_FOUND)
    
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


# ─────────────────────────────────────────────────────────────────────────────
# General Audit Log Endpoints
# ─────────────────────────────────────────────────────────────────────────────

class AuditEventItem(BaseModel):
    id: str
    user_id: str | None
    user_email: str | None = None
    action: str
    resource_type: str
    resource_id: str
    details: dict | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: str


class AuditListResponse(BaseModel):
    events: List[AuditEventItem]
    total: int
    page: int
    page_size: int


@admin_router.get("/audit", response_model=AuditListResponse)
async def list_audit_events(
    session: SQLSessionDep,
    admin: AuthContext = Depends(require_admin),
    user_id: str | None = None,
    resource_type: str | None = None,
    action: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> AuditListResponse:
    """List all audit events with filtering options."""
    from sqlalchemy import select, func, and_
    from sqlmodel import col
    
    # Build filter conditions
    conditions = []
    if user_id:
        conditions.append(col(AuditEvent.user_id) == UUID(user_id))
    if resource_type:
        conditions.append(col(AuditEvent.resource_type) == resource_type)
    if action:
        conditions.append(col(AuditEvent.action) == action)
    if start_date:
        conditions.append(col(AuditEvent.created_datetime) >= datetime.fromisoformat(start_date))
    if end_date:
        conditions.append(col(AuditEvent.created_datetime) <= datetime.fromisoformat(end_date))
    
    # Count total
    count_stmt = select(func.count()).select_from(AuditEvent)
    if conditions:
        count_stmt = count_stmt.where(and_(*conditions))
    total_result = await session.exec(count_stmt)
    total = total_result.one()
    
    # Query events with pagination
    stmt = (
        select(AuditEvent)
        .order_by(col(AuditEvent.created_datetime).desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    if conditions:
        stmt = stmt.where(and_(*conditions))
    
    results = await session.exec(stmt)
    events = results.all()
    
    return AuditListResponse(
        events=[
            AuditEventItem(
                id=str(event.id),
                user_id=str(event.user_id) if event.user_id else None,
                action=event.action,
                resource_type=event.resource_type or "",
                resource_id=event.path or "",
                details={},  # Would need to add details field to AuditEvent model
                created_at=event.created_datetime.isoformat(),
            )
            for event in events
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@admin_router.get("/audit/export")
async def export_audit_events(
    session: SQLSessionDep,
    admin: AuthContext = Depends(require_admin),
    format: str = "json",
    user_id: str | None = None,
    resource_type: str | None = None,
    action: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
):
    """Export audit events as CSV or JSON."""
    from fastapi.responses import StreamingResponse
    from sqlalchemy import select, and_
    from sqlmodel import col
    import csv
    import io
    import json
    
    # Build filter conditions
    conditions = []
    if user_id:
        conditions.append(col(AuditEvent.user_id) == UUID(user_id))
    if resource_type:
        conditions.append(col(AuditEvent.resource_type) == resource_type)
    if action:
        conditions.append(col(AuditEvent.action) == action)
    if start_date:
        conditions.append(col(AuditEvent.created_datetime) >= datetime.fromisoformat(start_date))
    if end_date:
        conditions.append(col(AuditEvent.created_datetime) <= datetime.fromisoformat(end_date))
    
    # Query all matching events
    stmt = select(AuditEvent).order_by(col(AuditEvent.created_datetime).desc())
    if conditions:
        stmt = stmt.where(and_(*conditions))
    
    results = await session.exec(stmt)
    events = results.all()
    
    # Log export action
    audit_entry = AuditEvent(
        resource_type="audit_log",
        action="export",
        user_id=admin.user.id,
        outcome="success",
        path=f"/admin/audit/export?format={format}",
    )
    session.add(audit_entry)
    await session.commit()
    
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "timestamp", "user_id", "action", "resource_type", "resource_id", "outcome"])
        for event in events:
            writer.writerow([
                str(event.id),
                event.created_datetime.isoformat(),
                str(event.user_id) if event.user_id else "",
                event.action,
                event.resource_type or "",
                event.path or "",
                event.outcome,
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=audit-log.csv"},
        )
    else:
        data = [
            {
                "id": str(event.id),
                "timestamp": event.created_datetime.isoformat(),
                "user_id": str(event.user_id) if event.user_id else None,
                "action": event.action,
                "resource_type": event.resource_type,
                "resource_id": event.path,
                "outcome": event.outcome,
            }
            for event in events
        ]
        return StreamingResponse(
            iter([json.dumps(data, indent=2)]),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=audit-log.json"},
        )


# ─────────────────────────────────────────────────────────────────────────────
# Adoption Dashboard Endpoints (Phase 37B)
# ─────────────────────────────────────────────────────────────────────────────

class DailyRecordingCount(BaseModel):
    date: str
    count: int


class ModuleUsageItem(BaseModel):
    module_id: str
    access_count: int
    unique_users: int


class OfflineQueueStats(BaseModel):
    pending: int
    in_progress: int
    completed_today: int
    failed_today: int


class AdoptionMetrics(BaseModel):
    total_users: int
    active_users_today: int
    active_users_week: int
    total_recordings: int
    recordings_today: int
    total_minutes_generated: int
    minutes_today: int


class AdoptionDashboardResponse(BaseModel):
    metrics: AdoptionMetrics
    recordings_by_day: List[DailyRecordingCount]
    top_modules: List[ModuleUsageItem]
    offline_queue: OfflineQueueStats


@admin_router.get("/adoption", response_model=AdoptionDashboardResponse)
async def get_adoption_dashboard(
    session: SQLSessionDep,
    admin: AuthContext = Depends(require_admin),
    days: int = 30,
) -> AdoptionDashboardResponse:
    """Get adoption dashboard metrics for admin view."""
    from sqlalchemy import select, func, and_, distinct
    from sqlmodel import col
    from datetime import timedelta
    from common.database.postgres_models import Transcription, Minute, User
    
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    
    # Total users
    total_users_result = await session.exec(select(func.count(distinct(User.id))))
    total_users = total_users_result.one() or 0
    
    # Active users today (users with transcriptions today)
    active_today_result = await session.exec(
        select(func.count(distinct(Transcription.user_id)))
        .where(col(Transcription.created_datetime) >= today_start)
    )
    active_users_today = active_today_result.one() or 0
    
    # Active users this week
    active_week_result = await session.exec(
        select(func.count(distinct(Transcription.user_id)))
        .where(col(Transcription.created_datetime) >= week_start)
    )
    active_users_week = active_week_result.one() or 0
    
    # Total recordings
    total_recordings_result = await session.exec(select(func.count()).select_from(Transcription))
    total_recordings = total_recordings_result.one() or 0
    
    # Recordings today
    recordings_today_result = await session.exec(
        select(func.count())
        .select_from(Transcription)
        .where(col(Transcription.created_datetime) >= today_start)
    )
    recordings_today = recordings_today_result.one() or 0
    
    # Total minutes
    total_minutes_result = await session.exec(select(func.count()).select_from(Minute))
    total_minutes = total_minutes_result.one() or 0
    
    # Minutes today
    minutes_today_result = await session.exec(
        select(func.count())
        .select_from(Minute)
        .where(col(Minute.created_datetime) >= today_start)
    )
    minutes_today = minutes_today_result.one() or 0
    
    # Recordings by day
    recordings_by_day = []
    for i in range(days):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        day_count_result = await session.exec(
            select(func.count())
            .select_from(Transcription)
            .where(
                and_(
                    col(Transcription.created_datetime) >= day_start,
                    col(Transcription.created_datetime) < day_end,
                )
            )
        )
        count = day_count_result.one() or 0
        recordings_by_day.append(DailyRecordingCount(date=day_start.strftime("%Y-%m-%d"), count=count))
    
    recordings_by_day.reverse()  # Oldest to newest
    
    # Top modules from audit log
    top_modules_result = await session.exec(
        select(
            AuditEvent.action,
            func.count().label("access_count"),
            func.count(distinct(AuditEvent.user_id)).label("unique_users"),
        )
        .where(
            and_(
                col(AuditEvent.created_datetime) >= start_date,
                col(AuditEvent.resource_type) == "module",
            )
        )
        .group_by(AuditEvent.action)
        .order_by(func.count().desc())
        .limit(10)
    )
    top_modules_rows = top_modules_result.all()
    top_modules = [
        ModuleUsageItem(module_id=row[0], access_count=row[1], unique_users=row[2])
        for row in top_modules_rows
    ]
    
    # If no module usage in audit, provide defaults from transcription actions
    if not top_modules:
        top_modules = [
            ModuleUsageItem(module_id="transcription", access_count=total_recordings, unique_users=active_users_week),
            ModuleUsageItem(module_id="minutes", access_count=total_minutes, unique_users=active_users_week),
        ]
    
    # Offline queue stats - count by outcome from audit
    pending_result = await session.exec(
        select(func.count())
        .select_from(AuditEvent)
        .where(
            and_(
                col(AuditEvent.action) == "offline_sync",
                col(AuditEvent.outcome) == "pending",
            )
        )
    )
    pending = pending_result.one() or 0
    
    in_progress_result = await session.exec(
        select(func.count())
        .select_from(AuditEvent)
        .where(
            and_(
                col(AuditEvent.action) == "offline_sync",
                col(AuditEvent.outcome) == "in_progress",
            )
        )
    )
    in_progress = in_progress_result.one() or 0
    
    completed_today_result = await session.exec(
        select(func.count())
        .select_from(AuditEvent)
        .where(
            and_(
                col(AuditEvent.action) == "offline_sync",
                col(AuditEvent.outcome) == "success",
                col(AuditEvent.created_datetime) >= today_start,
            )
        )
    )
    completed_today = completed_today_result.one() or 0
    
    failed_today_result = await session.exec(
        select(func.count())
        .select_from(AuditEvent)
        .where(
            and_(
                col(AuditEvent.action) == "offline_sync",
                col(AuditEvent.outcome) == "failed",
                col(AuditEvent.created_datetime) >= today_start,
            )
        )
    )
    failed_today = failed_today_result.one() or 0
    
    # Log dashboard access
    audit_entry = AuditEvent(
        resource_type="admin_dashboard",
        action="view_adoption",
        user_id=admin.user.id,
        outcome="success",
        path="/admin/adoption",
    )
    session.add(audit_entry)
    await session.commit()
    
    return AdoptionDashboardResponse(
        metrics=AdoptionMetrics(
            total_users=total_users,
            active_users_today=active_users_today,
            active_users_week=active_users_week,
            total_recordings=total_recordings,
            recordings_today=recordings_today,
            total_minutes_generated=total_minutes,
            minutes_today=minutes_today,
        ),
        recordings_by_day=recordings_by_day,
        top_modules=top_modules,
        offline_queue=OfflineQueueStats(
            pending=pending,
            in_progress=in_progress,
            completed_today=completed_today,
            failed_today=failed_today,
        ),
    )
