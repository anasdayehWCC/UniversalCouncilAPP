from pathlib import Path

import pytest

from common.config.loader import ConfigNotFoundError, load_tenant_config


def test_load_existing_tenant():
    cfg = load_tenant_config("pilot_children", base_dir=Path(__file__).parent.parent / "config")
    assert cfg.id == "pilot_children" or cfg.name.lower().startswith("westminster")
    assert any(m.id == "transcription" for m in cfg.modules)
    assert cfg.version
    assert cfg.defaultLocale == "en-GB"


def test_missing_tenant_raises():
    with pytest.raises(ConfigNotFoundError):
        load_tenant_config("does_not_exist", base_dir=Path(__file__).parent.parent / "config")
