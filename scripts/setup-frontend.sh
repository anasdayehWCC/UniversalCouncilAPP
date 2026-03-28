#!/usr/bin/env bash
set -euo pipefail

# Resolve repo root based on this script location
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"

export NPM_CONFIG_CACHE=${NPM_CONFIG_CACHE:-"$ROOT/.npm-cache"}
mkdir -p "$NPM_CONFIG_CACHE"

cd "$ROOT"

echo "[setup-frontend] Installing workspaces..."
pnpm install

if [ "${RUN_OPENAPI_TS:-0}" != "0" ]; then
  echo "[setup-frontend] Regenerating OpenAPI client..."
  pnpm openapi:web
fi

echo "[setup-frontend] Building frontend (Next.js)..."
pnpm build:web

echo "[setup-frontend] Done. Start dev server with scripts/dev-frontend.sh"
