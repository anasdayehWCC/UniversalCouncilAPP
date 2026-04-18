# Universal Council App — Architecture

_Phase 15A deliverable — authored April 2026_

## 1. Executive Summary

The Universal Council App is a multi-tenant, configuration-driven SaaS platform built as a modular monolith. It enables UK councils (initially Westminster City Council and Royal Borough of Kensington & Chelsea) to capture, transcribe, generate structured meeting minutes, and export documents with audit and governance controls. The app serves social care (children's and adults' services) as the first vertical, with capacity to extend to housing, transport, and other departments through configuration, not code forks.

**Core user flows:** offline-first audio capture (PWA + mobile) → async transcription (Azure Speech/AWS) → LLM-driven minute generation (domain-specific templates) → export to Word/PDF/SharePoint + Planner task creation → full audit trail and retention lifecycle.

**Tech stack:** Frontend (Next.js 16 + React 19, App Router, Tailwind CSS v4, Dexie offline) + Backend (FastAPI) + Worker (Ray-based async processing) + Postgres + Azure/AWS cloud services (UK-only regions).

---

## 2. Architecture Overview

### 2.1 Conceptual Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Layer (Web + PWA)                      │
│  ┌──────────────────┐  ┌───────────────────────┐  ┌──────────┐   │
│  │  Next.js Router  │  │  Module Registry      │  │ Dexie    │   │
│  │  (App Router)    │  │  (Tenant Config)      │  │ Offline  │   │
│  │                  │  │                       │  │ Queue    │   │
│  └──────────────────┘  └───────────────────────┘  └──────────┘   │
│           ↓                      ↓                       ↓          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Service Worker + Background Sync              │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (FastAPI)                            │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Auth Middleware │  │  Routes      │  │  Rate Limiting   │   │
│  │  (Entra JWT)     │  │  (REST)      │  │  + CORS          │   │
│  └──────────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           ↓                        ↓
┌──────────────────────┐   ┌──────────────────────┐
│  Data Layer          │   │  Queue Services      │
│  ┌────────────────┐  │   │  ┌────────────────┐  │
│  │ Postgres Models│──┼───│──│ SQS / Azure SB │  │
│  │ (SQLModel)     │  │   │  └────────────────┘  │
│  └────────────────┘  │   └──────────────────────┘
└──────────────────────┘           ↓
           ↓              ┌──────────────────────┐
┌──────────────────────┐  │  Worker (Ray)        │
│ Storage Services     │  │  ┌────────────────┐  │
│ ┌────────────────┐   │  │  │ Transcription  │  │
│ │ S3 / Azure Blob│   │  │  │ LLM Processing │  │
│ │ Retention Jobs │   │  │  │ Exports        │  │
│ └────────────────┘   │  │  │ Translation    │  │
└──────────────────────┘  │  └────────────────┘  │
                          └──────────────────────┘
```

### 2.2 Component Map

| Component | Technology | Purpose | Key Files |
|-----------|-----------|---------|-----------|
| **Frontend** | Next.js 16, React 19, App Router | Web/PWA UI for capture, review, export | `universal-app/src/app/`, `src/components/`, `src/lib/` |
| **API** | FastAPI 0.120.x, Pydantic 2.11 | REST endpoints for recordings, transcriptions, minutes, config | `minute-main/backend/api/routes/` |
| **Worker** | Ray 2.47, Python async | Long-running jobs: transcription, LLM, exports, translations | `minute-main/worker/`, `ray_receive_service.py` |
| **Data** | Postgres (SQLModel) | Domain models: org, domain, user, case, minute, transcription, audit, retention | `minute-main/common/database/postgres_models.py` |
| **Storage** | S3/Azure Blob abstraction | Raw audio, transcripts, exports (with lifecycle policies) | `minute-main/common/services/storage_services/` |
| **Queues** | SQS/Azure Service Bus abstraction | Task dispatch and retry | `minute-main/common/services/queue_services/` |
| **Config** | YAML files + DB tables | Tenant, service domain, role, module, and feature flag configs | `config/*.yaml`, `common/config/loader.py` |
| **Observability** | Sentry, PostHog, Prometheus, JSON logs | Error tracking, analytics, metrics, trace propagation | `backend/instrumentation.ts`, service middleware |

---

## 3. Data Flow

### 3.1 End-to-End Capture → Export

```
Social Worker                Frontend                Backend               Worker              Exports
      │                         │                         │                   │                    │
      │ Start Recording          │                         │                   │                    │
      ├──────────────────────────>│                         │                   │                    │
      │ (Offline Queue if no net) │                         │                   │                    │
      │                           │                         │                   │                    │
      │ End Recording, Save Meta  │                         │                   │                    │
      ├──────────────────────────>│ Queue Recording Blob     │                   │                    │
      │ (IndexedDB + Service Worker)  (Dexie + metadata)    │                   │                    │
      │                           │                         │                   │                    │
      │ [Auto-sync when online]   │                         │                   │                    │
      │                           │ POST /recordings        │                   │                    │
      │                           │ (chunked upload)        │                   │                    │
      │                           ├────────────────────────>│ Store blob        │                    │
      │                           │ Return recording_id     │ Enqueue transcription job  │         │
      │                           │<────────────────────────┤                   │                    │
      │ Poll status               │                         │                   │                    │
      │                           │ GET /recordings/{id}    │                   │                    │
      │                           │ (polling)               │                   │                    │
      │                           │<────────────────────────┤                   │                    │
      │                           │                         │ Dequeue & process │                    │
      │                           │                         ├──────────────────>│ Azure Speech STT  │
      │                           │                         │                   │ (realtime/batch)  │
      │                           │                         │                   │ Diarization       │
      │                           │                         │<──────────────────┤ Dialogue + times  │
      │                           │                         │ Store transcript  │                    │
      │                           │                         │ Enqueue LLM job   │                    │
      │                           │                         │                   │                    │
      │                           │                         │                   │ OpenAI (LLM)     │
      │                           │                         │                   │ Template fill     │
      │                           │                         │                   │ Citations extract │
      │                           │                         │<──────────────────┤ Store minute      │
      │                           │                         │                   │ Enqueue export    │
      │                           │ GET /minutes/{id}       │                   │                    │
      │ View Minute + Edit       │<────────────────────────┤                   │                    │
      ├──────────────────────────>│                         │                   │                    │
      │                           │ PATCH /minutes/{id}     │                   │                    │
      │ Approve & Export          │ Update content, export  │                   │                    │
      ├──────────────────────────>│ target                  │                   │                    │
      │                           ├────────────────────────>│                   │ docx/pdf export   │
      │                           │                         │                   │ SharePoint upload │
      │                           │                         │                   │ Planner tasks     │
      │                           │                         │<──────────────────┤ Return SAS URL    │
      │ Download / View in Teams   │<────────────────────────┤ Audit log entry   │                    │
      │ or SharePoint             │ File link + metadata    │                    │                    │
      │                           │                         │                   │                    │
```

**Key Lifecycle Events:**
1. **Offline Queue Enqueue:** Recording saved to IndexedDB when captured offline; service worker tracks pending uploads
2. **Upload & Transcription:** Chunked upload to blob storage; backend enqueues transcription task to Ray worker
3. **Transcription → Minute:** Ray worker transcribes (Azure Speech batch for economy, realtime for fast), stores dialogue, then enqueues LLM minute generation
4. **Minute Generation:** LLM fills template (domain-specific), extracts citations with timestamps, stores JSON
5. **Export & Integration:** Exporter creates docx/PDF, uploads to SharePoint, creates Planner tasks; audit event logged
6. **Retention:** Background job purges recordings after N days, transcripts after M, based on retention policy

---

## 4. Tenancy Model

### 4.1 Core Concepts

- **Organisation (Tenant):** Single WCC or RBKC deployment; one Postgres instance, one Azure subscription
- **ServiceDomain:** Department within an organisation (Children's Social Care, Adults, Housing, etc.)
- **User Role:** Permission level (Social Worker, Manager, Quality Assurance, Admin)
- **UserOrgRole:** Junction table linking user → organisation → domain → role

### 4.2 Configuration Flow

**Static Config (YAML):**
```yaml
# config/pilot_children.yaml
organisation:
  name: Westminster City Council
  servicedomains:
    - id: children
      name: Children's Services
      templates: [home_visit, supervision, care_assessment]
      retention_days: 2555  # ~7 years
      sharepoint_root: /sites/ClldrensServices

roles:
  - id: social_worker
    permissions: [read:own, write:own, capture:record]
    modules: [transcription, minutes, offline]
  - id: manager
    permissions: [read:team, approve:team, export:pdf]
    modules: [transcription, minutes, review_queue]
```

**Dynamic Config (API + DB):**
- Backend endpoint `GET /config/{tenant_id}` serves merged YAML + DB overrides (feature flags, per-domain module states)
- Frontend fetches at login; cached with TTL; re-fetches on domain switch
- Module registry consumes config; drives navigation, route availability, feature flag state

### 4.3 Module Registry System

**Module Definition** (in `universal-app/src/lib/modules/core-modules.ts`):
```typescript
{
  id: 'transcription',
  name: 'Transcription',
  description: 'Capture, transcribe, and review audio',
  routes: [
    { path: '/record', label: 'Record', auth: { requiresAuth: true, allowedRoles: ['social_worker', 'manager'] } },
    { path: '/my-notes', label: 'My Notes', auth: { requiresAuth: true } }
  ],
  availableDomains: 'all',
  defaultStatus: 'enabled'
}
```

**Registry Consumption:**
- Frontend: Renders nav items from `useTenantConfig().getNavigation()` filtered by role/domain
- API: `GET /api/modules?domain=children&role=social_worker` returns only applicable modules
- Anti-pattern: never client-side hide/show modules; all filtering server-side

---

## 5. Plugin/Module System

### 5.1 Module Lifecycle

1. **Register:** Module declares routes, permissions, dependencies (Phase 16A/16B)
2. **Fetch Config:** Backend API returns module entitlements per tenant/domain/role
3. **Mount Routes:** Frontend conditionally renders routes if module enabled + user has permission
4. **Emit Events:** Module lifecycle hooks fire on enable/disable (for cache invalidation, telemetry)

### 5.2 Current Modules

| Module | Capture | Status | Routes | Deps |
|--------|---------|--------|--------|------|
| **Transcription** | ✓ | Core | `/record`, `/my-notes`, `/transcriptions/{id}` | None |
| **Minutes** | ✓ | Core | `/minutes/{id}`, `/review-queue` | Transcription |
| **Templates** | ✓ | Core | `/templates` (admin) | None |
| **Admin** | ✓ | Enabled | `/admin/*` (users, modules, settings) | None |
| **Insights** | ✓ | Beta | `/insights` (time saved, adoption) | None |

### 5.3 Future Modules (Phase 22+)

- **Tasks:** Extract, assign, sync to Planner
- **Collab:** Comments, threaded discussions, co-editing (CRDT)
- **Search:** Full-text + semantic retrieval
- **Integrations:** Mosaic, Liquid Logic syncs

---

## 6. Security & Governance

### 6.1 Identity & Authentication

- **Provider:** Azure Entra ID (via MSAL on frontend, JWKS validation on backend)
- **Frontend:** MSAL with redirect + silent token refresh; auth context provider
- **Backend:** FastAPI middleware decodes JWT, verifies signature (JWKS cache with kid rotation), extracts `org_id`, `domain_id`, `role_id` claims
- **Local Dev:** `ENVIRONMENT=local` allows baked JWT bypass; disabled in prod via `DISABLE_LOCAL_FAKE_JWT=true`

### 6.2 Access Control & Audit

- **Request Context:** Every request carries org/domain/role; enforced via context propagation into SQLModel queries
- **Row-Level Scoping:** Queries filter by `organisation_id`, `service_domain_id`, `user_id` (principle of least privilege)
- **Audit Events:** All state changes logged to `AuditEvent` table (user, action, resource, timestamp, outcome)
- **Retention:** Background job purges records per policy (e.g., 2555 days for children's, shorter for draft notes)

### 6.3 Data Protection

- **Encryption at Rest:** Postgres column-level encryption for case DOB, case reference (pgcrypto)
- **TLS in Transit:** App Gateway + Managed Identity for internal services
- **PII Minimisation:** Frontend UI hints against free-text names; backend redacts in logs
- **Evidence Access:** Signed, time-limited SAS URLs for audio/export playback

---

## 7. Offline Architecture

### 7.1 Offline Queue (Dexie + Service Worker)

```
On capture (offline or online):
  ├─ Save Blob → IndexedDB (OfflineRecording table)
  ├─ Metadata → IndexedDB (QueueMeta: case_ref, template, domain)
  ├─ Fast/Economy flag stored (affects queue priority)
  └─ Service Worker tracks queue via notification

On reconnect:
  ├─ Service Worker detects online (navigator.onLine, XHR test)
  ├─ Iterates pending recordings (IndexedDB query)
  ├─ Chunked upload to `/api/recordings` with exponential backoff
  ├─ On success: update local status, clear from queue
  ├─ On 409 conflict: mark as duplicate (backend detects idempotency key)
  └─ On error: retry with backoff; surface status to UI
```

**Key Files:**
- `universal-app/src/lib/offline-queue.ts` — Queue ops (add, list, retry, sync)
- `universal-app/src/lib/storage-adapter.ts` — Dexie schema + methods
- `universal-app/public/sw.js` — Service worker (caching + background sync)

### 7.2 Status Visibility

- UI banner shows: "1 pending upload", "Syncing…", or "Sync complete" (green check)
- Each recording card shows status: Pending, Uploading, Synced, Failed (with retry button)
- On device reboot: queue persists in IndexedDB; auto-resumes sync on next open

---

## 8. Quality & Performance

### 8.1 Transcription Excellence

- **Diarization:** Azure Speech v3.2 automatic speaker separation + timestamps
- **Speaker Relabel UI:** Bulk apply (e.g., "Speaker 1 → Social Worker"); persisted in `Transcription.dialogue` JSON
- **Lexicon Feedback:** Worker collects corrections; nightly job updates phrase lists per domain
- **Batch vs Realtime:** 
  - **Fast path** (realtime STT): ≤30 min SLA for ≤60 min audio
  - **Economy path** (batch STT): ≤24h SLA; cheaper per minute; user choice at capture time

### 8.2 Minute Generation

- **Domain Templates:** `common/templates/social_care/` includes home_visit, supervision, care_assessment, lac_review, etc.
- **Evidence Citations:** LLM-extracted timestamps for each statement; UI clickable to seek audio
- **Cost Controls:** Token budgets per domain; gpt-4o-mini for drafts, gpt-4o for final; Azure batch API for non-urgent
- **Quality Checks:** Hallucination detection; minimum word-count gating; fallback "insufficient audio" notice

### 8.3 Performance Budgets

- **TTI (Time to Interactive):** ≤2.5s for `/record` on 4G
- **LCP (Largest Contentful Paint):** ≤2s
- **CLS (Cumulative Layout Shift):** <0.1
- **Module Bundle Size:** Max 50KB gzipped per module (lazy-loaded)

---

## 9. Testing Strategy

### 9.1 Unit Tests

- **Backend:** FastAPI route handlers + dependencies (auth context, org/domain scoping), template logic, exporters
- **Frontend:** Module registry, tenant config loading, offline queue ops, theme/a11y token contracts
- **Tools:** Python pytest, Vitest for JS/TS

### 9.2 Integration Tests

- **Auth Flow:** Entra JWT validation, org/domain isolation
- **E2E Recording→Minute→Export:** Mocked Azure Speech/OpenAI; real Postgres; validates workflow
- **Offline Sync:** Service worker + Dexie + chunked upload; device reboot scenario

### 9.3 Quality Gates

- **CI Checks:** Lint, unit/integration tests, build (Turbopack), type safety
- **E2E Smoke:** Playwright for critical journeys: /record → /my-notes → /minutes/{id} → export
- **A11y Audit:** Axe/Pa11y on core pages; WCAG AA baseline screenshots (Phase 17B)
- **Code Coverage:** Target 75% for new code; enforce on PR merge

---

## 10. Accessibility (WCAG 2.2 AA)

### 10.1 Token-Based Design System

- **Color Tokens:** OKLCH scale with AA contrast pairs (measured + enforced in CI)
- **Typography:** Inter (body) + Outfit (headings); min 16px body, 1.5 line-height
- **Spacing:** 8px grid (4, 8, 12, 16, 24, 32, etc.)
- **Motion:** Framer Motion easing; respects `prefers-reduced-motion`
- **Focus:** 3px outline, high contrast (typically cyan on dark)

### 10.2 Component Compliance

- **Buttons:** Min 44×44px touch target, focus-visible ring
- **Forms:** Associated labels, ARIA descriptions for complex fields (e.g., case selector), error announcements
- **Modals:** Focus trap, aria-modal, ESC key, initial focus management
- **Navigation:** Skip links, semantic HTML, ARIA landmarks

### 10.3 Mobile & Responsive

- **Breakpoints:** Mobile (0–576px), Tablet (577–992px), Desktop (993+)
- **Touch Targets:** Min 44×44px on mobile; consistent spacing
- **One-Handed Use:** Critical actions (record/pause/save) in thumb zone
- **Screen Readers:** VoiceOver (iOS), TalkBack (Android), NVDA (Windows)

---

## 11. Infrastructure & Deployment

### 11.1 Hosting (UK-Only)

- **Region:** Azure UK South (primary), Azure UK West (DR standby)
- **Services:** Container Apps (API/worker), Postgres Flexible Server, Storage Account, Service Bus, Key Vault, Application Gateway
- **Networking:** Private endpoints for all services; no public internet except App Gateway
- **Secrets:** Managed Identity for app → services; no connection strings in code

### 11.2 Local Development

- **Setup:** `pnpm install` (root), `poetry install` (minute-main), local Postgres (via Docker or MacBook native)
- **Frontend:** `pnpm --filter universal-app dev` (Next.js dev server, ENVIRONMENT=local bypass)
- **Backend:** `poetry run uvicorn backend.main:app --reload --port 8080`
- **Worker (optional):** `poetry run python -m worker.main` (local Ray cluster)
- **Database:** Local Postgres; Alembic migrations run on startup via `backend/main.py`

### 11.3 CI/CD Pipeline

- **GitHub Actions:** Lint → Test → Build → Deploy
- **Build:** Docker images pushed to ACR (API, worker); Next.js build to static assets
- **Deploy:** Blue/green via ACA revisions; smoke tests before traffic cutover
- **Config Validation:** `scripts/validate_configs.py` runs on PR (fail on schema drift)

---

## 12. Cost Model & Fast vs Economy

### 12.1 Cost Drivers

| Service | Fast Path | Economy Path | Notes |
|---------|-----------|--------------|-------|
| **Azure Speech STT** | Realtime (≤30 min SLA) | Batch (≤24h SLA) | Batch ~60% cheaper per minute |
| **OpenAI LLM** | gpt-4o (best quality) | gpt-4o-mini + batch API | Batch 50% cheaper, 24h turnaround |
| **Transcription** | Per-minute | Aggregated (batch) | Multiple files batched = lower per-file cost |

### 12.2 User Choice

- **At Capture:** "How urgent?" dropdown (Fast = real-time cost; Economy = 24h, cheaper)
- **At Review:** Manager can re-export with faster settings if needed (idempotency key prevents duplicate charges)
- **Tenant Controls:** Admin can set per-domain defaults, role-based overrides, per-month budgets with alerts

---

## 13. Observability

### 13.1 Logging

- **JSON structured logs** with trace IDs (propagated to worker Ray tasks)
- **Log levels:** DEBUG (local only), INFO (events), WARNING (degraded), ERROR (failures)
- **Redaction:** PII redacted; free-text notes truncated in logs
- **Sentry integration:** Error tracking with session replay (5% sample in prod)

### 13.2 Metrics & Dashboards

- **Prometheus endpoints:** `GET /metrics` exposes:
  - Transcription latency (p50, p95, p99)
  - Queue depth + age
  - Export success rate
  - Offline sync success rate (% of uploads succeeding within 2h)
  - Per-domain token spend (Speech minutes, LLM tokens)
- **Dashboards:** Azure Monitor or Grafana showing SLO attainment, cost trends, module adoption

### 13.3 Trace Propagation

- **Backend → Worker:** FastAPI middleware injects trace ID into queue messages; Ray actor reads it
- **Frontend → Backend:** XHR includes `X-Trace-ID` header (generated or from `window.__traceId__`)

---

## 14. Delivery & Roadmap Alignment

### 14.1 Phase Dependencies

| Phase | Name | Depends On | Delivers |
|-------|------|-----------|----------|
| **15A** | *This doc* | — | Architecture; open questions |
| **15B** | Foundations gap map | 15A | Evidence of current state; phase-to-gap crosswalk |
| **16** | Config + Module platformisation | 15A/15B | Schema + API + frontend consumption |
| **17** | Design system + a11y | 16 | Tokens + token contract; a11y CI gates |
| **18** | Cross-platform shell + RN | 17 | Shared UI kit; RN/Expo shell using same config/modules |
| **19** | Telemetry + Admin console | 18 | Module/config observability; admin UI for config changes |

### 14.2 Definition of Done

For each phase:
- ✅ Code changes (with tests)
- ✅ Documentation (README, ADR if architectural)
- ✅ E2E smoke tests passing
- ✅ Changelog updated
- ✅ Open questions raised as issues or next-phase tasks

---

## 15. Open Questions & Risks

**As of April 2026:**

### Architecture

1. **Config Promotion Path** (Phase 16): Should tenant config changes come via PR + CI validation, or admin UI + immediate deployment? Recommend hybrid: dry-run validation in UI, then PR for promotion to prod.

2. **Module Telemetry Granularity** (Phase 19A): How deep should we track module usage? Recommend: module load + feature flag check + error events; avoid per-interaction overhead.

3. **RN/Expo Data Sharing** (Phase 18): How do we share auth tokens, config, and offline queue state between web and native shells on the same device? Recommend: secure keychain + shared SQLite for offline queue (MMKV on Android).

### Performance & Scale

4. **Bundle Size Creep** (Phase 16–19): As modules grow, will lazy loading alone meet budget? Recommend: aggressive module boundaries; shared primitives in `packages/ui`; weekly bundle audits.

5. **Offline Queue Growth**: Can IndexedDB handle multi-GB queues on low-end devices? Recommend: per-recording compression; periodic cleanup of succeeded items; alert if queue > 500MB.

### Security & Compliance

6. **Config Versioning & Rollback** (Phase 21): How do we safely roll back config changes (e.g., if a template breaks)? Recommend: date-stamped config versions in git; CI guardrails on breaking schema changes; admin UI shows diff + rollback button.

7. **PII in Logs & Traces** (Phase 10–19): How aggressive should redaction be? Current: case_ref hashed, names truncated. Future: LLM-based PII detection on error messages (Phase 29).

### DevEx & Ops

8. **Local Dev Parity** (Onboarding): Current setup (local Postgres + poetry + pnpm) is manual. Recommend: Docker Compose fallback; GitHub Codespaces config; setup script validation.

9. **IaC Testing**: We have Terraform scaffolding; should we test IaC in CI? Recommend: `terraform plan` + `checkov` scanning on PR; deploy to `dev` environment automatically on merge.

---

## 16. Key Code Paths & References

### Frontend (`universal-app/`)
- **Auth:** `src/lib/auth/` (MSAL, token refresh)
- **Config:** `src/lib/tenant/` (TenantConfig types, loader, defaults)
- **Modules:** `src/lib/modules/` (registry, definitions, query)
- **Offline:** `src/lib/offline-queue.ts`, `src/lib/storage-adapter.ts`
- **Theme:** `src/lib/themes/`, `src/components/theme-provider.tsx`

### Backend (`minute-main/backend/`)
- **Auth Context:** `backend/api/dependencies/get_current_user.py`
- **Routes:** `backend/api/routes/` (recordings, transcriptions, minutes, config, modules, etc.)
- **Request Context:** Propagated via FastAPI Depends; carries org, domain, role, user_id

### Common (`minute-main/common/`)
- **Models:** `common/database/postgres_models.py` (SQLModel ORM)
- **Services:** `common/services/` (storage, queues, transcription, exports, retention, audit)
- **Config:** `common/config/loader.py`, `common/config/models.py`
- **Templates:** `common/templates/` (SimpleTemplate, domain-specific in `social_care/`)

### Worker (`minute-main/worker/`)
- **Main Loop:** `worker/worker_service.py` (Ray actor initialization)
- **Job Processing:** `worker/ray_receive_service.py` (STT, LLM, exports)
- **Exporters:** `worker/exporters/` (docx, PDF, SharePoint, Planner)

---

## 17. Architecture Decision Records (ADRs)

See `docs/adr/` for detailed decisions. Key ADRs:

1. **001 — Modular Monolith + Platform Alignment:** Root `packages/*` = Platform; `minute-main` = Social Care Product; no repo forks.
2. **002 — Config-First Tenancy:** Behaviour driven by YAML config + DB tables, not hard-coded role/domain switches.
3. **003 — Offline-First PWA:** IndexedDB + service worker + background sync as first-class pattern, not bolted-on.
4. **004 — Module Registry for Navigation:** All routing and nav driven by registry; no hardcoded role-based conditionals in components.

---

## 18. References & External Docs

- **Roadmap:** `minute-main/ROADMAP_social_care.md` (phases 15–40, detailed requirements, tech debt)
- **Foundations:** `minute-main/docs/universal_council_app_foundations.md` (platform vision, repo layout)
- **User Journeys:** `minute-main/docs/user_journeys.md` (personas: social worker, manager, QA, admin; flows)
- **AGENTS Rules:** `/AGENTS.md` (development rules, architecture patterns, no forks)
- **API Docs:** OpenAPI spec auto-generated from FastAPI routes; accessible at `/docs` (local dev)

---

**Last updated:** April 2026  
**Phase:** 15A (Documentation)  
**Status:** Approved for implementation of Phase 16 (Config + Module Platformisation)
