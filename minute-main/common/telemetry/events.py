from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any

from common.metrics import (
    config_served_total,
    feature_flag_check_total,
    module_access_total,
    offline_sync_outcome_total,
)


logger = logging.getLogger("careminutes.telemetry")


@dataclass
class TelemetryContext:
    tenant: str | None = None
    service_domain: str | None = None
    role: str | None = None


def build_context(tenant: str | None = None, service_domain: str | None = None, role: str | None = None) -> TelemetryContext:
    return TelemetryContext(tenant=tenant, service_domain=service_domain, role=role)


def _label(value: str | None, fallback: str) -> str:
    if not value:
        return fallback
    return str(value)


def _emit(event: str, **fields: Any) -> None:
    payload = {"event": event, **fields}
    try:
        logger.info("telemetry_event %s", json.dumps(payload, default=str))
    except TypeError:
        logger.info("telemetry_event %s", payload)


def record_module_access(context: TelemetryContext | None, module_id: str, allowed: bool) -> None:
    ctx = context or TelemetryContext()
    module_access_total.labels(
        tenant=_label(ctx.tenant, "unknown"),
        service_domain=_label(ctx.service_domain, "none"),
        role=_label(ctx.role, "unknown"),
        module=module_id,
        allowed="yes" if allowed else "no",
    ).inc()
    _emit(
        "module.access",
        module=module_id,
        tenant=_label(ctx.tenant, "unknown"),
        service_domain=_label(ctx.service_domain, "none"),
        role=_label(ctx.role, "unknown"),
        allowed=allowed,
    )


def record_feature_flag_check(context: TelemetryContext | None, flag: str, enabled: bool) -> None:
    ctx = context or TelemetryContext()
    feature_flag_check_total.labels(
        tenant=_label(ctx.tenant, "unknown"),
        flag=flag,
        result="enabled" if enabled else "disabled",
    ).inc()
    _emit(
        "feature_flag.check",
        flag=flag,
        tenant=_label(ctx.tenant, "unknown"),
        service_domain=_label(ctx.service_domain, "none"),
        role=_label(ctx.role, "unknown"),
        enabled=enabled,
    )


def record_config_served(tenant: str, version: str) -> None:
    config_served_total.labels(tenant=tenant, version=version).inc()
    _emit("config.served", tenant=tenant, version=version)


def record_offline_stage(context: TelemetryContext | None, stage: str) -> None:
    ctx = context or TelemetryContext()
    offline_sync_outcome_total.labels(
        tenant=_label(ctx.tenant, "unknown"),
        service_domain=_label(ctx.service_domain, "none"),
        role=_label(ctx.role, "unknown"),
        stage=stage,
    ).inc()
    _emit(
        "offline.stage",
        stage=stage,
        tenant=_label(ctx.tenant, "unknown"),
        service_domain=_label(ctx.service_domain, "none"),
        role=_label(ctx.role, "unknown"),
    )
