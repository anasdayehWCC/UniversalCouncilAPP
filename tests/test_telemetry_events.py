from common.metrics import feature_flag_check_total, module_access_total
from common.telemetry.events import build_context, record_feature_flag_check, record_module_access


def test_record_module_access_increments_counter():
    ctx = build_context(tenant="tenant", service_domain="domain", role="role")
    metric = module_access_total.labels("tenant", "domain", "role", "minutes", "yes")
    before = metric._value.get()
    record_module_access(ctx, "minutes", True)
    assert metric._value.get() == before + 1


def test_record_feature_flag_check_labels():
    ctx = build_context(tenant="tenant", service_domain="domain", role="role")
    metric = feature_flag_check_total.labels("tenant", "flag:test", "enabled")
    before = metric._value.get()
    record_feature_flag_check(ctx, "flag:test", True)
    assert metric._value.get() == before + 1
