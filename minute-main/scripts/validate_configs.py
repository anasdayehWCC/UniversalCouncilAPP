from pathlib import Path
import sys

from pydantic import ValidationError

from common.config.loader import load_all_configs


def main() -> None:
    base = Path(__file__).parent.parent / "config"
    try:
        configs = load_all_configs(base)
    except ValidationError as exc:  # surface schema issues early in CI
        print(f"Config validation failed: {exc}", file=sys.stderr)
        sys.exit(1)

    if not configs:
        print(f"No tenant configs found in {base}", file=sys.stderr)
        sys.exit(1)

    print(f"Validated {len(configs)} tenant config(s) against TenantConfig schema in {base}")


if __name__ == "__main__":
    main()
