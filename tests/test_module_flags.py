from pathlib import Path

from common.config.access import is_module_enabled
from common.config.loader import load_tenant_config


def test_is_module_enabled_defaults_true_when_missing_tenant():
    assert is_module_enabled("minutes", tenant_id=None)
    assert is_module_enabled("minutes", tenant_id="does_not_exist")


def test_is_module_enabled_respects_module_flag(tmp_path: Path):
    cfg_path = tmp_path / "tenant_a.yaml"
    cfg_path.write_text(
        """
id: tenant_a
name: Tenant A
version: "1.0.0"
defaultLocale: en-GB
modules:
  - id: minutes
    enabled: false
"""
    )
    assert not is_module_enabled("minutes", tenant_id="tenant_a", base_dir=tmp_path)
    # other module defaults to enabled if not present
    assert is_module_enabled("transcription", tenant_id="tenant_a", base_dir=tmp_path)


def test_config_loader_round_trip_has_new_fields():
    cfg = load_tenant_config("pilot_children", base_dir=Path(__file__).parent.parent / "config")
    assert cfg.version
    for module in cfg.modules:
        assert module.enabled is not None
