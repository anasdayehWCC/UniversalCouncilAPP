from __future__ import annotations

from pathlib import Path
from typing import Optional

from common.config.loader import ConfigNotFoundError, load_tenant_config
from common.telemetry.events import TelemetryContext, record_feature_flag_check


def is_module_enabled(
    module_id: str,
    tenant_id: Optional[str],
    base_dir: str | Path = "config",
    telemetry_context: TelemetryContext | None = None,
) -> bool:
    """
    Returns True if the module is enabled for the given tenant config.
    If tenant_id is None or config is missing, default to True to avoid accidental outages.
    """
    if tenant_id is None:
        if telemetry_context:
            record_feature_flag_check(telemetry_context, f"module:{module_id}", True)
        return True
    try:
        cfg = load_tenant_config(tenant_id, base_dir=base_dir)
    except ConfigNotFoundError:
        if telemetry_context:
            record_feature_flag_check(telemetry_context, f"module:{module_id}", True)
        return True
    for module in cfg.modules:
        if module.id == module_id:
            if telemetry_context:
                record_feature_flag_check(telemetry_context, f"module:{module_id}", module.enabled)
            return module.enabled
    if telemetry_context:
        record_feature_flag_check(telemetry_context, f"module:{module_id}", True)
    return True
