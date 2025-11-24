from pathlib import Path

from common.config.loader import load_all_configs


def test_all_configs_validate():
    configs = load_all_configs(Path(__file__).parent.parent / "config")
    assert configs, "No configs loaded"
    for cfg in configs:
        assert cfg.id
        assert cfg.modules
        assert cfg.version
