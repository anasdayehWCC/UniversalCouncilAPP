---
name: dev-backend
description: Context loader for backend development in minute-main. Loads project conventions, API patterns, and service architecture. Use when starting backend work.
user-invocable: false
---

# Backend Development Context

Loaded by orchestrator sub-agents working on `minute-main/`. Provides project-specific conventions.

## Architecture

- **API**: FastAPI 0.120.x + Pydantic 2.11 + SQLModel
- **DB**: PostgreSQL via SQLAlchemy 2.0 + asyncpg, migrations via Alembic
- **Worker**: Ray 2.47 for async job processing (transcription, LLM, export, translation)
- **Queue**: Abstracted (SQS default, Azure Service Bus adapter)
- **Storage**: Abstracted (S3 default, Azure Blob adapter)
- **Auth**: Entra ID JWT validation (JWKS cache, kid rotation)
- **Python**: 3.14, managed with Poetry

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `backend/api/routes/` | FastAPI route handlers |
| `backend/api/dependencies/` | Request context, auth middleware |
| `backend/main.py` | App entry point |
| `common/database/` | SQLModel definitions, Postgres init |
| `common/services/` | Business logic (queue, storage, transcription, export, retention) |
| `common/templates/` | Domain-specific minute templates |
| `common/config/` | Tenant/domain config models, loader, validator |
| `worker/` | Ray actors and job processing |
| `worker/exporters/` | DOCX/PDF generation |
| `alembic/versions/` | Database migrations |
| `config/` | Tenant YAML configs |
| `tests/` | pytest test suite |

## Key Patterns

### Request Context
Every API route gets `RequestContext` with `org_id`, `domain_id`, `role`. All queries filter by org/domain.

### Config System
- Tenant configs in `config/*.yaml` validated against JSON schema
- Config loader in `common/config/loader.py` with caching
- CI validates configs via `scripts/validate_configs.py`

### Queue/Storage Abstraction
- Services use abstract interfaces (`QueueService`, `StorageService`)
- Implementations selected by env var (`QUEUE_SERVICE_NAME`, `STORAGE_SERVICE_NAME`)
- Local dev: `noop` queue, `local` storage

### Worker Jobs
- Ray actors process: transcription, minute generation, export, translation, chat
- Retry with DLQ for failed jobs
- Idempotency via Redis

### Database Migrations
- Always create Alembic migration for schema changes
- Run: `cd minute-main && poetry run alembic revision --autogenerate -m "description"`
- Test: `cd minute-main && poetry run alembic upgrade head`

## Testing Commands

```bash
cd minute-main
poetry run pytest tests/ -x -q                    # Full suite
poetry run pytest tests/test_health.py -v          # Smoke test
poetry run python scripts/validate_configs.py      # Config validation
poetry run ruff check .                            # Linting
```

## Key Rules from AGENTS.md

- Delete blobs FIRST, then database records (retention cleanup)
- Use Managed Identity for Azure services (no stored tokens)
- Token budgets per domain for LLM/STT calls
- Circuit breaker pattern for external service calls
- Structured JSON logging with trace IDs
- Private endpoints for all Azure services in prod
