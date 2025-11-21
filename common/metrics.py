from prometheus_client import Counter, Histogram

transcription_latency_seconds = Histogram(
    "transcription_latency_seconds",
    "End-to-end transcription latency",
    labelnames=["service", "mode"],
)

minute_generation_latency_seconds = Histogram(
    "minute_generation_latency_seconds",
    "LLM minute generation latency",
)

export_latency_seconds = Histogram(
    "export_latency_seconds",
    "Export generation latency",
    labelnames=["format"],
)

export_status_total = Counter(
    "export_status_total",
    "Export completion counts",
    labelnames=["status", "format"],
)

transcription_mode_total = Counter(
    "transcription_mode_total",
    "Transcription requests by mode and adapter",
    labelnames=["mode", "service"],
)

offline_sync_total = Counter(
    "offline_sync_total",
    "Offline capture progression",
    labelnames=["stage"],
)

offline_sync_outcome_total = Counter(
    "offline_sync_outcome_total",
    "Offline capture progression tagged by tenant/domain/role",
    labelnames=["tenant", "service_domain", "role", "stage"],
)

llm_path_total = Counter(
    "llm_path_total",
    "LLM usage split fast vs best",
    labelnames=["path"],
)

llm_tokens_total = Counter(
    "llm_tokens_total",
    "Estimated tokens used by domain",
    labelnames=["domain", "model"],
)

module_access_total = Counter(
    "module_access_total",
    "Module accesses per tenant/domain/role",
    labelnames=["tenant", "service_domain", "role", "module", "allowed"],
)

feature_flag_check_total = Counter(
    "feature_flag_check_total",
    "Feature flag checks",
    labelnames=["tenant", "flag", "result"],
)

config_served_total = Counter(
    "config_served_total",
    "Tenant config responses",
    labelnames=["tenant", "version"],
)
