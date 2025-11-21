from __future__ import annotations

from pathlib import Path
from typing import Optional

from common.config.loader import ConfigNotFoundError, load_tenant_config


def is_module_enabled(module_id: str, tenant_id: Optional[str], base_dir: str | Path = "config") -> bool:
    """
    Returns True if the module is enabled for the given tenant config.
    If tenant_id is None or config is missing, default to True to avoid accidental outages.
    """
    if tenant_id is None:
        return True
    try:
        cfg = load_tenant_config(tenant_id, base_dir=base_dir)
    except ConfigNotFoundError:
        return True
    for module in cfg.modules:
        if module.id == module_id:
            return module.enabled
    return True
