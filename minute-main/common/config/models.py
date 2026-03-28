from pathlib import Path
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


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
    routes: Optional[List[str]] = Field(
        default=None, description="Optional list of routes exposed by this module (used by manifests)"
    )
    dependencies: Optional[List[str]] = Field(
        default=None, description="Optional list of module ids this module depends on"
    )


class LanguageConfig(BaseModel):
    default: str = Field(..., description="Default language code (e.g. en)")
    available: List[str] = Field(default_factory=list, description="List of languages that can be requested")
    autoTranslate: bool = Field(
        default=False, description="When true, automatically request translations after transcription completes"
    )


class NavigationItem(BaseModel):
    label: str = Field(..., description="Navigation label")
    href: str = Field(..., description="Target href for the navigation item")
    icon: Optional[str] = Field(default=None, description="Optional icon name for navigation")
    fab: bool = Field(default=False, description="Whether to render as a floating action button on mobile")
    roles: Optional[List[str]] = Field(
        default=None, description="Optional list of roles allowed to see this navigation item"
    )


class TenantConfig(BaseModel):
    id: str = Field(..., description="Stable tenant/council identifier")
    name: str
    version: str = Field(..., description="Config version tag, e.g. 1.0.0")
    defaultLocale: str = Field(..., pattern=r"^[a-z]{2}-[A-Z]{2}$")
    organisation: str | None = Field(default=None, description="Human-readable organisation/council name")
    service_domain: str | None = Field(default=None, description="Primary service domain for this config")
    roles: List[str] | None = Field(default=None, description="List of allowed roles for this tenant")
    templates: List[str] | None = Field(default=None, description="List of template ids enabled for this tenant")
    lexicon: List[str] | None = Field(default=None, description="List of domain-specific lexicon entries")
    designTokens: dict | None = Field(default=None)
    retentionDaysDefault: Optional[int] = Field(
        default=None, description="Default retention in days for recordings/transcriptions/minutes"
    )
    sharepoint_library_path: Optional[str] = Field(default=None, description="Default SharePoint library path")
    planner: dict | None = Field(default=None, description="Optional Planner plan/bucket ids")
    languages: LanguageConfig | None = Field(
        default=None, description="Language/translation configuration for the tenant"
    )
    navigation: List[NavigationItem] | None = Field(default=None, description="Optional navigation overrides")
    modules: List[ModuleConfig]

    @field_validator("modules", mode="before")
    @classmethod
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
