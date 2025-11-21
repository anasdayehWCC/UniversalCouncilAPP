from pathlib import Path
from typing import List, Optional

from pydantic import BaseModel, Field, validator


class ModuleConfig(BaseModel):
    id: str = Field(..., description="Module identifier, e.g. transcription, minutes")
    enabled: bool = Field(default=True)
    departments: Optional[List[str]] = Field(
        default=None, description="Optional list of service_domain ids this module applies to"
    )


class TenantConfig(BaseModel):
    id: str = Field(..., description="Stable tenant/council identifier")
    name: str
    defaultLocale: str = Field(..., regex=r"^[a-z]{2}-[A-Z]{2}$")
    designTokens: dict | None = Field(default=None)
    modules: List[ModuleConfig]

    @validator("modules", pre=True)
    def ensure_modules(cls, value):
        if value is None:
            raise ValueError("modules must be provided")
        return value


def list_candidate_files(base_dir: Path, tenant_id: str) -> list[Path]:
    return [
        base_dir / f"{tenant_id}.yaml",
        base_dir / f"{tenant_id}.yml",
        base_dir / f"{tenant_id}.json",
    ]
