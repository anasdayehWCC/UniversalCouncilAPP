from fastapi import APIRouter, HTTPException

from common.config.loader import ConfigNotFoundError, load_tenant_config
from common.config.models import TenantConfig

config_router = APIRouter(tags=["Config"])


@config_router.get("/config/{tenant_id}", response_model=TenantConfig)
async def get_tenant_config(tenant_id: str) -> TenantConfig:
    try:
        return load_tenant_config(tenant_id)
    except ConfigNotFoundError:
        raise HTTPException(status_code=404, detail="Tenant config not found")
