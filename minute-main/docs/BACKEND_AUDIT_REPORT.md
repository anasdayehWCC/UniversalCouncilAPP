# Backend Architecture Audit Report / minute-main

**Date:** 28 March 2026  
**Auditor:** AI Assistant  
**Scope:** `/minute-main/backend`, `/minute-main/common`, `/minute-main/worker`

---

## Executive Summary

The minute-main backend is a well-architected FastAPI-based application providing AI-powered meeting transcription, minute generation, and export services for social care contexts. It follows clean architecture principles with distinct layers for API, business logic, and infrastructure.

### Overall Health Score: **7.5/10**

| Area | Score | Status |
|------|-------|--------|
| API Routes | 8/10 | ✅ Well developed |
| Database Models | 8/10 | ✅ Mature schema |
| Services Layer | 7/10 | ⚠️ Good but sync/async mixed |
| Worker System | 7/10 | ⚠️ Ray-based, functional |
| Configuration | 8/10 | ✅ Multi-tenant ready |
| Observability | 8/10 | ✅ Prometheus + Sentry |
| Security | 7/10 | ⚠️ Good foundations, auth hardening needed |
| Testing Coverage | 6/10 | ⚠️ Needs expansion |

---

## 1. Project Structure Overview

```
minute-main/
├── backend/                    # FastAPI application
│   ├── main.py                 # App entry, middleware, routes
│   ├── api/
│   │   ├── routes/             # 14 route modules
│   │   ├── dependencies/       # DI (auth, sessions)
│   │   └── middleware/         # Audit, security, tracing
│   └── utils/
├── common/                     # Shared business logic
│   ├── config/                 # Multi-tenant configuration
│   ├── database/               # SQLModel ORM
│   ├── services/               # Business services
│   ├── llm/                    # AI/LLM integration
│   ├── templates/              # Minute templates
│   ├── security/               # Encryption
│   └── telemetry/              # Events/metrics
├── worker/                     # Ray-based async workers
│   ├── main.py                 # Worker entry
│   ├── worker_service.py       # Ray orchestration
│   └── exporters/              # DOCX/PDF generation
└── alembic/versions/           # 27 migrations
```

---

## 2. Backend Entry Point (`backend/main.py`)

### Purpose
FastAPI application bootstrap with comprehensive middleware stack.

### Development Score: **8/10**

### Key Features
- **Lifespan management** with cleanup scheduler initialization
- **Sentry integration** with environment-specific sampling
- **CORS** locked to APP_URL
- **Security middleware stack:**
  - Rate limiting (120 req/60s on protected paths)
  - Origin checking
  - Security headers
  - Audit logging (skips health endpoints)
  - Distributed tracing
- **Prometheus metrics** exposed at `/metrics`
- **Local development support** with mock storage service

### Issues & Improvements
| Issue | Severity | Recommendation |
|-------|----------|----------------|
| Rate limit is per-IP only | Medium | Add per-user rate limiting |
| No circuit breaker on startup | Low | Add health checks before lifespan completes |
| CORS single origin | Low | Support multiple origins via config |

---

## 3. API Routes Analysis (`backend/api/routes/`)

### Route Summary

| Route File | Endpoints | Score | Notes |
|------------|-----------|-------|-------|
| `health.py` | 1 | 9/10 | Simple health check |
| `transcriptions.py` | 8 | 8/10 | Full CRUD, pagination, offline sync |
| `minutes.py` | 6 | 8/10 | Generation, source-check, tasks |
| `users.py` | 2 | 8/10 | Profile, retention settings |
| `admin.py` | 4 | 7/10 | Config management, audit logs |
| `config.py` | 1 | 8/10 | Tenant config serving |
| `modules.py` | 1 | 7/10 | Module manifest for UI |
| `templates.py` | 4 | 7/10 | Template CRUD |
| `tasks.py` | 1 | 7/10 | Task listing |
| `insights.py` | 1 | 7/10 | Analytics metrics |
| `chat.py` | 2 | 6/10 | Interactive LLM chat |
| `minute_tags.py` | 2 | 7/10 | Tag management |
| `theme.py` | 1 | 6/10 | Theme tokens |

**Total: 14 route modules, ~34 endpoints**

### Route Architecture Patterns

**Positive:**
- Consistent use of `SQLSessionDep` and `UserDep` dependencies
- Module-level access checks (`ensure_minutes_module_enabled`)
- Telemetry context propagation
- Proper error code enums (`ErrorCodes`)

**Areas for Improvement:**
- Some routes mix sync/async patterns
- Missing rate limiting on `/chat` endpoints
- No API versioning (e.g., `/api/v1/`)

---

## 4. Database Models (`common/database/postgres_models.py`)

### Development Score: **8/10**

### Entity Count: **20+ models**

### Core Entities

| Model | Purpose | Relationships |
|-------|---------|---------------|
| `Organisation` | Multi-tenant root | → ServiceDomain, Users |
| `ServiceDomain` | Department/team within org | → Templates, Users |
| `User` | System users | → Transcriptions, OrgRoles |
| `UserOrgRole` | RBAC junction | → User, Org, Domain, Role |
| `Role` | Permission roles | → Users |
| `Recording` | Audio files | → Transcription |
| `Transcription` | Speech-to-text results | → Minutes, Recordings, Case |
| `Minute` | Generated meeting notes | → MinuteVersions, Tasks |
| `MinuteVersion` | Version history | → Hallucinations |
| `MinuteTask` | Action items | → Minute |
| `Case` | Subject/case context | → Transcriptions, Minutes |
| `UserTemplate` | Custom templates | → Questions, Minutes |
| `Chat` | Interactive LLM sessions | → Transcription |
| `TranscriptionFeedback` | Quality feedback | → Transcription |
| `RetentionPolicy` | Data retention rules | → Org, Domain |
| `AuditEvent` | Compliance logging | All entities |
| `Hallucination` | LLM accuracy tracking | → MinuteVersion |

### Design Patterns
- **BaseTableMixin**: UUID PKs with `gen_random_uuid()`
- **Created/Updated timestamps**: Timezone-aware
- **Soft deletes**: Via `ondelete="SET NULL"` for references
- **JSONB columns**: For `dialogue_entries`, `tags`, `planner_task_ids`
- **Enums**: `JobStatus`, `ExportStatus`, `TaskStatus`, `ContentSource`

### Issues & Improvements
| Issue | Severity | Recommendation |
|-------|----------|----------------|
| No indexed FKs in some tables | Medium | Add explicit indexes on foreign keys |
| Computed field `strict_data_retention` | Low | Consider materialized column |
| Legacy `minute_versions` JSONB | Medium | Complete migration to `MinuteVersion` table |
| Missing soft delete for `User` | Low | Add `deleted_at` timestamp |

### Migration Count: **27 Alembic migrations** (healthy evolution)

---

## 5. Services Layer (`common/services/`)

### Development Score: **7/10**

### Service Inventory

| Service | Purpose | Score | Notes |
|---------|---------|-------|-------|
| `TranscriptionHandlerService` | STT orchestration | 7/10 | Sync DB calls in async context |
| `MinuteHandlerService` | LLM minute generation | 7/10 | Good but sync sessions |
| `ExportHandlerService` | DOCX/PDF + SharePoint | 8/10 | Clean worker integration |
| `TranslationHandlerService` | Multi-language support | 7/10 | Azure Translator integration |
| `TaskExtractionService` | Action item extraction | 7/10 | LLM-based parsing |
| `InsightsService` | Analytics computation | 6/10 | Basic metrics only |
| `TemplateManager` | Template registry | 8/10 | Auto-discovery pattern |
| `MSGraphClient` | SharePoint/Planner | 7/10 | Token handling needed |
| `PostHogClient` | Product analytics | 7/10 | Standard integration |
| `CircuitBreaker` | Fault tolerance | 6/10 | Basic implementation |

### Storage Services (`storage_services/`)

| Service | Backend | Score |
|---------|---------|-------|
| `S3StorageService` | AWS S3 | 8/10 |
| `AzureBlobStorageService` | Azure Blob | 8/10 |
| `LocalStorageService` | Filesystem | 7/10 |

### Queue Services (`queue_services/`)

| Service | Backend | Score |
|---------|---------|-------|
| `SQSQueueService` | AWS SQS | 7/10 |
| `AzureServiceBusQueueService` | Azure Service Bus | 8/10 |
| `NoopQueueService` | In-memory (testing) | 6/10 |

### Transcription Services (`transcription_services/`)

| Adapter | Backend | Type | Score |
|---------|---------|------|-------|
| `AzureSpeechAdapter` | Azure Speech | Sync | 8/10 |
| `AzureBatchTranscriptionAdapter` | Azure Batch | Async | 8/10 |
| `AWSTranscribeAdapter` | AWS Transcribe | Async | 7/10 |

### Key Issues
1. **Mixed sync/async**: `SessionLocal()` used in async handlers
2. **Missing retry logic** in some service methods
3. **No connection pooling** for MSGraph client

---

## 6. Worker System (`worker/`)

### Development Score: **7/10**

### Architecture
- **Ray-based distributed processing**
- Separate actors for transcription and LLM work
- Graceful shutdown with signal handling
- Prometheus metrics server

### Components

| Component | Purpose | Score |
|-----------|---------|-------|
| `WorkerService` | Main orchestrator | 7/10 |
| `RayTranscriptionService` | STT actor | 7/10 |
| `RayLlmService` | Minute generation actor | 7/10 |
| `SignalHandler` | Graceful shutdown | 7/10 |
| `HasBeenStopped` | Coordination actor | 6/10 |

### Exporters

| Exporter | Format | Library | Score |
|----------|--------|---------|-------|
| `docx_exporter.py` | DOCX | python-docx | 7/10 |
| `pdf_exporter.py` | PDF | WeasyPrint | 7/10 |

### Configuration
- `MAX_TRANSCRIPTION_PROCESSES`: Parallel STT workers
- `MAX_LLM_PROCESSES`: Parallel minute generation
- `RAY_NAMESPACE`: Worker isolation
- `RAY_DASHBOARD_HOST`: Monitoring UI

### Issues & Improvements
| Issue | Severity | Recommendation |
|-------|----------|----------------|
| Ray dashboard on 127.0.0.1 by default | Low | Make configurable for k8s |
| No worker health endpoint | Medium | Add `/health` to worker metrics port |
| Single retry on actor failure | Medium | Add exponential backoff |

---

## 7. Configuration System (`common/config/`)

### Development Score: **8/10**

### Multi-Tenant Configuration

**TenantConfig Model:**
```python
- id: str                    # Tenant identifier
- name: str                  # Display name
- version: str               # Config version
- defaultLocale: str         # e.g., "en-GB"
- organisation: str          # Parent org name
- service_domain: str        # Primary domain
- roles: list[str]           # Allowed roles
- templates: list[str]       # Enabled templates
- lexicon: list[str]         # Domain vocabulary
- designTokens: dict         # UI theming
- modules: list[ModuleConfig] # Feature gating
- languages: LanguageConfig  # Translation config
- navigation: list[NavItem]  # UI nav overrides
```

**ModuleConfig:**
```python
- id: str                    # Module identifier
- enabled: bool              # Feature flag
- label: str                 # Display label
- icon: str                  # UI icon
- feature_flags: list[str]   # Additional flags
- departments: list[str]     # Domain restrictions
- routes: list[str]          # Exposed routes
- dependencies: list[str]    # Module dependencies
```

### Config Files (in `/config/`)
- `pilot_children.yaml`
- `wcc_adults.yaml`
- `wcc_children.yaml`
- `wcc_housing.yaml`

### Access Control (`access.py`)
- `is_module_enabled()` function with telemetry
- Graceful fallback when config missing

---

## 8. LLM Integration (`common/llm/`)

### Development Score: **7/10**

### Supported Providers

| Provider | Model Types | Score |
|----------|-------------|-------|
| Azure OpenAI | GPT-4, GPT-4o-mini | 8/10 |
| Google Gemini | gemini-2.5-flash, gemini-2.5-flash-lite | 7/10 |

### Configuration
```python
FAST_LLM_PROVIDER: "gemini"          # Low-complexity tasks
FAST_LLM_MODEL_NAME: "gemini-2.5-flash-lite"
BEST_LLM_PROVIDER: "gemini"          # High-complexity tasks
BEST_LLM_MODEL_NAME: "gemini-2.5-flash"
```

### ChatBot Class
- Retry logic with exponential backoff (6 attempts)
- Structured output support via Pydantic
- Hallucination detection (optional)
- Message history tracking

### Cost Controls
- `LLM_TOKEN_BUDGETS_PER_DOMAIN`: Daily token limits
- `LLM_MODEL_COST_WEIGHTS`: Relative pricing
- `check_and_record_tokens()`: Budget enforcement

---

## 9. Security Architecture

### Development Score: **7/10**

### Authentication
- **Entra ID / Azure AD JWT** validation
- **JWKS caching** for key rotation
- **Local dev bypass** (guarded by `DISABLE_LOCAL_FAKE_JWT`)
- **AuthContext dataclass** with org/domain/role

### Middleware Stack
1. `TracingMiddleware` - Distributed tracing
2. `OriginCheckMiddleware` - CORS enforcement
3. `SecurityHeadersMiddleware` - HTTP security headers
4. `SimpleRateLimitMiddleware` - Request throttling
5. `AuditMiddleware` - Compliance logging

### Encryption
- **Fernet encryption** for PII (e.g., `subject_dob_ciphertext`)
- **Key Vault integration** for secrets in production

### Issues & Improvements
| Issue | Severity | Recommendation |
|-------|----------|----------------|
| No CSRF protection | Medium | Add CSRF tokens for state-changing ops |
| Rate limit per-IP only | Medium | Add user-based rate limiting |
| API keys in settings | Low | Validate secret rotation procedures |
| No request signing | Low | Consider HMAC for webhook callbacks |

---

## 10. Observability

### Development Score: **8/10**

### Prometheus Metrics

| Metric | Type | Labels |
|--------|------|--------|
| `transcription_latency_seconds` | Histogram | service, mode |
| `minute_generation_latency_seconds` | Histogram | - |
| `export_latency_seconds` | Histogram | format |
| `export_status_total` | Counter | status, format |
| `transcription_mode_total` | Counter | mode, service |
| `offline_sync_total` | Counter | stage |
| `llm_path_total` | Counter | path |
| `llm_tokens_total` | Counter | domain, model |
| `module_access_total` | Counter | tenant, domain, role, module |
| `feature_flag_check_total` | Counter | tenant, flag, result |
| `config_served_total` | Counter | tenant, version |

### Sentry Integration
- Environment-specific sampling
- Transaction tracing
- Profile lifecycle in non-prod

### Telemetry Events
- Structured JSON logging
- `_emit()` helper for event bus
- Context propagation (tenant, domain, role)

---

## 11. Dependencies & Versions

### Core Framework
| Package | Version | Status |
|---------|---------|--------|
| Python | 3.14.x | ✅ Current |
| FastAPI | ^0.120.0 | ✅ Latest |
| SQLModel | ^0.0.24 | ✅ Current |
| SQLAlchemy | ^2.0.42 | ✅ Current |
| Pydantic | ^2.11.0 | ✅ Current |

### Database & Storage
| Package | Version | Purpose |
|---------|---------|---------|
| asyncpg | ^0.30.0 | Async PostgreSQL |
| psycopg2-binary | ^2.9.9 | Sync PostgreSQL |
| alembic | ^1.13.3 | Migrations |
| boto3 | ^1.35.3 | AWS S3 |
| azure-storage-blob | ^12.26.0 | Azure Blob |
| azure-servicebus | ^7.14.2 | Azure Queues |

### LLM & AI
| Package | Version | Purpose |
|---------|---------|---------|
| openai | ^1.42.0 | Azure OpenAI |
| google-genai | ^1.10.0 | Gemini |

### Worker
| Package | Version | Purpose |
|---------|---------|---------|
| ray | ^2.47.1 | Distributed processing |
| ffmpeg-python | ^0.2.0 | Audio processing |

### Export
| Package | Version | Purpose |
|---------|---------|---------|
| python-docx | ^1.1.2 | DOCX generation |
| weasyprint | ^62.3 | PDF generation |
| mistune | ^3.1.3 | Markdown parsing |

### Observability
| Package | Version | Purpose |
|---------|---------|---------|
| sentry-sdk | ^2.18.0 | Error tracking |
| prometheus-client | ^0.21.0 | Metrics |
| prometheus-fastapi-instrumentator | ^7.0.0 | HTTP metrics |

---

## 12. Recommendations Summary

### Critical (Address Immediately)
1. **Migrate sync DB calls to async** in service layer
2. **Add API versioning** (`/api/v1/`) before breaking changes
3. **Implement CSRF protection** for state-changing operations

### High Priority
4. Add comprehensive **integration tests** for worker flows
5. Implement **user-based rate limiting** (not just IP)
6. Add **health checks** for worker processes
7. Complete **legacy minute_versions JSONB migration**

### Medium Priority
8. Add **connection pooling** for MSGraph client
9. Implement **circuit breaker** patterns more broadly
10. Add **foreign key indexes** to improve query performance
11. Create **API documentation** (OpenAPI is auto-generated but needs descriptions)

### Low Priority
12. Support **multiple CORS origins** via config
13. Add **soft delete** for User model
14. Implement **request signing** for webhooks

---

## 13. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         FASTAPI BACKEND                          │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Tracing  │→ │ Origin   │→ │ Security │→ │ RateLimit│→ ...    │
│  │ Middleware│  │ Check    │  │ Headers  │  │          │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
├──────────────────────────────────────────────────────────────────┤
│  API ROUTES:                                                     │
│  /transcriptions  /minutes  /users  /admin  /config  /modules   │
│  /templates  /tasks  /insights  /chat  /theme  /health          │
├──────────────────────────────────────────────────────────────────┤
│  DEPENDENCIES:  SQLSessionDep  │  UserDep (AuthContext)         │
└──────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                       COMMON SERVICES                            │
├──────────────────────────────────────────────────────────────────┤
│  TranscriptionHandler │ MinuteHandler │ ExportHandler            │
│  TranslationHandler   │ TaskExtraction │ InsightsService         │
│  TemplateManager      │ MSGraphClient  │ PostHogClient           │
├──────────────────────────────────────────────────────────────────┤
│  STORAGE:  S3  │  Azure Blob  │  Local                          │
│  QUEUES:   SQS │  Azure Service Bus  │  Noop                    │
│  LLM:      Azure OpenAI  │  Google Gemini                        │
└──────────────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────────┐
│    PostgreSQL DB      │   │      RAY WORKERS          │
├───────────────────────┤   ├───────────────────────────┤
│ · Organisation        │   │ RayTranscriptionService   │
│ · ServiceDomain       │   │ RayLlmService             │
│ · User / UserOrgRole  │   │ ─────────────────────────│
│ · Recording           │   │ Exporters:                │
│ · Transcription       │   │ · DOCX (python-docx)      │
│ · Minute / Version    │   │ · PDF (WeasyPrint)        │
│ · MinuteTask          │   └───────────────────────────┘
│ · Case                │             │
│ · AuditEvent          │             ▼
│ · RetentionPolicy     │   ┌───────────────────────────┐
└───────────────────────┘   │    EXTERNAL SERVICES      │
                            ├───────────────────────────┤
                            │ · Azure Speech (STT)      │
                            │ · Azure Translator        │
                            │ · SharePoint/OneDrive     │
                            │ · MS Planner              │
                            │ · Sentry                  │
                            │ · PostHog                 │
                            └───────────────────────────┘
```

---

## 14. File Inventory Summary

### Backend (`/backend/`)
| File | Lines | Purpose |
|------|-------|---------|
| `main.py` | ~110 | App entry, middleware |
| `api/routes/__init__.py` | 30 | Route registration |
| `api/routes/*.py` (14 files) | ~1500 | Endpoint implementations |
| `api/dependencies/` | ~200 | Auth, session injection |
| `api/middleware/` | ~150 | Security, audit, tracing |
| `utils/` | ~30 | Helper functions |

### Common (`/common/`)
| Directory | Files | Purpose |
|-----------|-------|---------|
| `config/` | 4 | Multi-tenant configuration |
| `database/` | 2 | ORM models, DB utilities |
| `services/` | 15+ | Business logic services |
| `llm/` | 3 | AI/LLM integration |
| `templates/` | 10+ | Minute templates |
| `audio/` | 3 | FFmpeg, speaker ID |
| `security/` | 1 | Encryption |
| `telemetry/` | 1 | Events, metrics |

### Worker (`/worker/`)
| File | Purpose |
|------|---------|
| `main.py` | Entry point |
| `worker_service.py` | Ray orchestration |
| `ray_receive_service.py` | Actor definitions |
| `signal_handler.py` | Graceful shutdown |
| `healthcheck.py` | Worker health |
| `exporters/*.py` | DOCX/PDF generation |

---

**Report Generated:** 28 March 2026  
**Next Review:** 28 June 2026

