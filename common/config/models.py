from pathlib import Path
from typing import List, Optional

from pydantic import BaseModel, Field, validator


class ModuleConfig(BaseModel):
    id: str = Field(..., description="Module identifier, e.g. transcription, minutes")
    enabled: bool = Field(default=True)
    label: Optional[str] = Field(default=None, description="Display label for navigation")
    icon: Optional[str] = Field(default=None, description="Optional icon name for navigation")
    feature_flags: Optional[List[str]] = Field(
        default=None, description="Optional feature flag identifiers required for this module"
    )
    departments: Optional[List[str]] = Field(
        default=None, description="Optional list of service_domain ids this module applies to"
    )


class TenantConfig(BaseModel):
    id: str = Field(..., description="Stable tenant/council identifier")
    name: str
    version: str = Field(..., description="Config version tag, e.g. 1.0.0")
    defaultLocale: str = Field(..., pattern=r"^[a-z]{2}-[A-Z]{2}$")
    designTokens: dict | None = Field(default=None)
    retentionDaysDefault: Optional[int] = Field(
        default=None, description="Default retention in days for recordings/transcriptions/minutes"
    )
    sharepoint_library_path: Optional[str] = Field(default=None, description="Default SharePoint library path")
    planner: dict | None = Field(default=None, description="Optional Planner plan/bucket ids")
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
