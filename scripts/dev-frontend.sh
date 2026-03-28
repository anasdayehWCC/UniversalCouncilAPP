#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
export NPM_CONFIG_CACHE=${NPM_CONFIG_CACHE:-"$ROOT/.npm-cache"}
mkdir -p "$NPM_CONFIG_CACHE"

cd "$ROOT"

if [ ! -d "$ROOT/node_modules" ]; then
  echo "[dev-frontend] node_modules missing; installing workspaces first..."
  pnpm install
fi

echo "[dev-frontend] Starting Next.js dev server (universal-app workspace)..."
pnpm dev:web
