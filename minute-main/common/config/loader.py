from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Optional

import yaml

from common.config.models import TenantConfig, list_candidate_files


class ConfigNotFoundError(FileNotFoundError):
    pass


def _load_raw(path: Path) -> dict:
    if path.suffix in {".yaml", ".yml"}:
        return yaml.safe_load(path.read_text())
    if path.suffix == ".json":
        return json.loads(path.read_text())
    raise ValueError(f"Unsupported config file type: {path}")


@lru_cache(maxsize=16)
def load_tenant_config(tenant_id: str, base_dir: str | Path = "config") -> TenantConfig:
    base = Path(base_dir)
    for candidate in list_candidate_files(base, tenant_id):
        if candidate.exists():
            data = _load_raw(candidate)
            return TenantConfig(**data)
    raise ConfigNotFoundError(f"No config found for tenant '{tenant_id}' in {base}")


def load_all_configs(base_dir: str | Path = "config") -> list[TenantConfig]:
    base = Path(base_dir)
    out: list[TenantConfig] = []
    for path in base.glob("*.y*ml"):
        out.append(TenantConfig(**_load_raw(path)))
    for path in base.glob("*.json"):
        out.append(TenantConfig(**_load_raw(path)))
    return out
