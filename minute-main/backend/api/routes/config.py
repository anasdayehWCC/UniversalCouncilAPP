from fastapi import APIRouter, HTTPException

from backend.api.dependencies import SQLSessionDep
from common.config.loader import ConfigNotFoundError, load_tenant_config
from common.config.models import TenantConfig
from common.database.postgres_models import AuditEvent
from common.telemetry.events import record_config_served

config_router = APIRouter(tags=["Config"])


@config_router.get("/config/{tenant_id}", response_model=TenantConfig)
async def get_tenant_config(tenant_id: str, session: SQLSessionDep) -> TenantConfig:
    try:
        config = load_tenant_config(tenant_id)
    except ConfigNotFoundError:
        raise HTTPException(status_code=404, detail="Tenant config not found")
    record_config_served(tenant_id, config.version)
    audit_entry = AuditEvent(
        resource_type="config",
        action="config_served",
        organisation_id=None,
        service_domain_id=None,
        user_id=None,
        path=f"/config/{tenant_id}",
        outcome="success",
    )
    session.add(audit_entry)
    await session.commit()
    return config
