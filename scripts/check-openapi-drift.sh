#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
export NPM_CONFIG_CACHE=${NPM_CONFIG_CACHE:-"$ROOT/.npm-cache"}
mkdir -p "$NPM_CONFIG_CACHE"

cd "$ROOT"

TARGETS=(
  "universal-app/src/lib/api/generated"
)
SNAPSHOT_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$SNAPSHOT_DIR"
}
trap cleanup EXIT

restore_targets() {
  for f in "${TARGETS[@]}"; do
    rm -rf "$ROOT/$f"
    mkdir -p "$ROOT/$f"
    cp -R "$SNAPSHOT_DIR/$f/." "$ROOT/$f/"
  done
}

echo "[check-openapi-drift] Snapshotting generated files to preserve local edits..."
for f in "${TARGETS[@]}"; do
  mkdir -p "$SNAPSHOT_DIR/$f"
  cp -R "$ROOT/$f/." "$SNAPSHOT_DIR/$f/"
done

echo "[check-openapi-drift] Generating OpenAPI client..."
pnpm openapi:web >/dev/null

echo "[check-openapi-drift] Checking for drift..."
dirty=0
for f in "${TARGETS[@]}"; do
  if ! diff -ru "$SNAPSHOT_DIR/$f" "$ROOT/$f" >/dev/null; then
    echo "[check-openapi-drift] Drift detected in $f"
    dirty=1
  fi
done

echo "[check-openapi-drift] Restoring original generated files to keep workspace unchanged..."
restore_targets

if [ "$dirty" -ne 0 ]; then
  echo "[check-openapi-drift] FAIL: OpenAPI generation produces changes. Please commit spec-aligned outputs." >&2
  exit 1
fi

echo "[check-openapi-drift] PASS: no drift"
