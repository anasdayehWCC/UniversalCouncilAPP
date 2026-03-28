#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
export NPM_CONFIG_CACHE=${NPM_CONFIG_CACHE:-"$ROOT/.npm-cache"}
mkdir -p "$NPM_CONFIG_CACHE"

cd "$ROOT"

TARGETS=(
  "universal-app/src/lib/api/generated"
)

echo "[check-openapi-drift] Generating OpenAPI client..."
pnpm openapi:web >/dev/null

echo "[check-openapi-drift] Checking for drift..."
dirty=0
for f in "${TARGETS[@]}"; do
  if ! git diff --quiet -- "$f"; then
    echo "[check-openapi-drift] Drift detected in $f"
    dirty=1
  fi
done

echo "[check-openapi-drift] Reverting generated files to keep workspace clean..."
git checkout -- "${TARGETS[@]}" >/dev/null 2>&1 || true

if [ "$dirty" -ne 0 ]; then
  echo "[check-openapi-drift] FAIL: OpenAPI generation produces changes. Please commit spec-aligned outputs." >&2
  exit 1
fi

echo "[check-openapi-drift] PASS: no drift"
