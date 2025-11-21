from pathlib import Path

from common.config.loader import load_all_configs


def main():
    base = Path(__file__).parent.parent / "config"
    configs = load_all_configs(base)
    print(f"Validated {len(configs)} tenant config(s) in {base}")


if __name__ == "__main__":
    main()
