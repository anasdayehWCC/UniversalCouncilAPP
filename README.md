# Universal Council App (monorepo)

A multi-tenant, department-aware platform for council services. The same codebase serves multiple departments (Children's Social Care, Adult Social Care, Housing, etc.) with navigation, templates, and behavior driven by configuration rather than code forks.

The root repository is the only local git context. `universal-app/` is the canonical web frontend, `apps/mobile/` is the canonical mobile app, and `minute-main/frontend/` is a frozen legacy reference used only for parity checks and migration planning. Docker files still exist for legacy infrastructure, but Docker is not the canonical local development workflow anymore.

## Repository Structure

| Path | Purpose | Status |
|------|---------|--------|
| `universal-app/` | **Production Next.js 16/React 19 web app** | ✅ **Canonical Frontend** |
| `minute-main/backend/` | FastAPI backend | ✅ Production |
| `minute-main/worker/` | Ray background workers | ✅ Production |
| `apps/mobile/` | React Native/Expo mobile app | ✅ Canonical |
| `packages/core/` | Shared TypeScript (config, modules, storage) | ✅ Shared |
| `packages/ui/` | Shared UI components | ✅ Shared |
| `config/` | Tenant/department YAML configs | ✅ Production |
| `minute-main/frontend/` | Legacy web frontend (read-only reference) | 🧊 Frozen |

## Multi-Tenant Configuration

Add a new department without code changes:

```yaml
# config/wcc_housing.yaml
id: "wcc_housing"
name: "Westminster Housing Services"
service_domain: "housing"
modules:
  - id: "recordings"
    enabled: true
    label: "Property Visits"
navigation:
  - label: "Properties"
    href: "/cases"
    icon: "Building2"
    roles: ["housing_officer"]
retentionDaysDefault: 1095
```

## Quick Start

### Install JavaScript dependencies
```bash
pnpm install
```

### Run web frontend (universal-app)
```bash
pnpm dev:web
```

`pnpm dev:web` now uses the webpack dev server by default because Next.js 16.2.x Turbopack is currently unstable in this repo and can panic or degrade badly during route compilation. If you need to reproduce Turbopack-specific behavior, use:

```bash
pnpm dev:web:turbo
```

### Lint, test, and build web frontend
```bash
pnpm lint:web
pnpm test:web
pnpm build:web
```

### Mobile (Expo)
```bash
pnpm dev:mobile
pnpm typecheck:mobile
```

### Backend / worker (Poetry, direct local workflow)
```bash
cd minute-main
poetry install --with dev --without worker
QUEUE_SERVICE_NAME=noop STORAGE_SERVICE_NAME=local poetry run uvicorn backend.main:app --reload --port 8080
```

```bash
cd minute-main
poetry run pytest tests/test_health.py tests/test_export_handler_service.py tests/test_cost_guard.py tests/test_security_headers.py
```

### Worker runtime (legacy Ray path, not required for day-to-day web development)
```bash
cd minute-main
poetry install --with dev,worker
QUEUE_SERVICE_NAME=noop STORAGE_SERVICE_NAME=local poetry run python worker/main.py
```

### Local Postgres
Use a locally installed PostgreSQL instance on the MacBook as the canonical non-Docker database dependency. Docker Compose is legacy-only and should not be the default setup path for new work.

### Backend smoke tests
```bash
cd minute-main
poetry run pytest tests/test_health.py tests/test_export_handler_service.py tests/test_cost_guard.py tests/test_security_headers.py
```

## Scripts
- `scripts/setup-frontend.sh` — install the root pnpm workspace and run the canonical web build
- `scripts/dev-frontend.sh` — start the canonical web frontend from the root workspace
- `scripts/check-openapi-drift.sh` — regenerate the `universal-app` OpenAPI client and check for drift without discarding local edits

## Regenerating API Client
```bash
# Uses the static backend spec by default:
pnpm openapi:web

# Override input when needed:
OPENAPI_TS_INPUT=./minute-main/openapi-temp.json pnpm openapi:web
```

## Key Documentation
- `AGENTS.md` — AI/Codex coding rules and architecture guardrails
- `CHANGELOG.md` — canonical change log for the root repository
- `PLANS.md` — Long-horizon execution plan with phases 1-41
- `ROADMAP_social_care.md` — Social care delivery roadmap
- `docs/frontend-parity-matrix.md` — migration view between `universal-app` and the frozen `minute-main/frontend`, with keep/migrate/retire decisions
- `minute-main/docs/universal_council_app_foundations.md` — Multi-tenant architecture guide
- `minute-main/docs/architecture.md` — Technical architecture

## Conventions
- Do not run `npm install` inside sub-packages; use `pnpm install` from the repo root
- Treat `minute-main/frontend` as migration-only and exclude it from new development, CI ownership, and primary setup docs
- Treat Dockerfiles, Compose files, and image-build workflows as legacy infrastructure until they are removed or archived
- Navigation is config-driven via `/api/modules` endpoint
- Users see ONLY modules for their `service_domain` and `role`
- No council/department-specific code forks allowed
- Follow AGENTS.md for all development
