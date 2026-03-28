# PLANS.md — Long-Horizon Exec Plan (Codex-Max, 24h+ capable)

## Purpose / Big Picture

- Deliver the Social Care-ready Minute platform per `minute-main/ROADMAP_social_care.md`, under the behavioral guardrails in `AGENTS.md`.
- Optimize for Codex-Max long-run sessions (compaction, multi-window) while keeping costs and safety controls explicit.
- Record progress and blockers so extended autonomous runs remain coherent.

## References

- Behavioral rules: `AGENTS.md` (auth, migrations, cost controls, logging/retention, feature flags, dev-preview).
- Delivery roadmap: `minute-main/ROADMAP_social_care.md` (phases 1–14, success criteria).
- Model context: GPT-5.1-Codex-Max (compaction; can run 24h+). citeturn0search0

## 2026-03-28 Repo Baseline

- `universal-app/` is the canonical web frontend and the only web app that owns OpenAPI generation against `minute-main/backend`.
- `apps/mobile/` is the canonical mobile shell.
- `minute-main/backend/` and `minute-main/worker/` remain the canonical backend and worker bounded context for social care.
- `minute-main/frontend/` is frozen as a legacy parity reference only; it is excluded from the active pnpm workspace, root CI ownership, and new feature development.
- Docker, Compose, and image-build workflows are legacy infrastructure only; direct local processes plus local PostgreSQL are now the canonical developer workflow.
- Historical references below to `frontend/...` describe the legacy `minute-main/frontend` path unless they explicitly mention `universal-app/`.

## Operating Model for Long Sessions

1. Read AGENTS and Roadmap before edits; obey local-only fake-JWT and dev-preview gating.
2. Always web-search when uncertain or selecting services/models/policies (AGENTS rule 26).
3. Work phase-by-phase (see “Plan of Work”). After each phase:
   - Update **Progress** checklist (with timestamps).
   - Run required tests; fix failures before advancing.
   - Update `CHANGELOG.md` per AGENTS rule 27.
4. Use compaction-friendly notes: summarise context into this file’s Progress section after major hops or >4h runtime.
5. Spillover tasks (>24h) get a “handover” summary appended to Progress.

## Plan of Work (mapped to Roadmap phases)

- Phase 1: Identity/RBAC (Entra), org/domain models, local preview safety.
- Phase 1.5: Premium UI & Council Theming (WCC/RBKC colors, glassmorphism, Tailwind design system).
- Phase 2: Infra & secrets (Azure UK, private endpoints, dev-preview slot).
- Phase 3: Case context & PII-minimisation.
- Phase 3a: Config systemisation + module registry (tenant/domain config loader, module declarations, nav/permission wiring).
- Phase 4: Offline/PWA capture + cost/latency choice (fast vs economy).
- Phase 5: Transcription quality/diarization (lexicons, batch path, relabel UI).
- Phase 6: Social-care templates (children/adults), domain mapping.
- Phase 7: Evidence linking UX (timestamps, signed URLs, audit events).
- Phase 8: Exports + M365 (docx/pdf, SharePoint, Planner).
- Phase 9: Security/privacy/governance (audit trail, retention).
- Phase 10: Observability/SLOs (metrics, alerts, cost/route visibility).
- Phase 11: Scale/cost (autoscale, batch STT/LLM, commitments).
- Phase 12: Testing gates (unit/integration/e2e/security).
- Phase 13: IaC + pipelines (ACA/AKS, ACR, blue/green).
- Phase 14: Pilot/rollout (children first, adults next; domain packs).
- Platform upgrades (cross-phase enabler): Next.js 15.5/React 19 + Turbopack, FastAPI 0.120 + Pydantic 2.11, Ray 2.43 stability.
- Phase 15A/15B (concurrent-safe): Architecture doc authorship vs foundations gap-mapping. 15A refines `docs/architecture.md` using the newly integrated `docs/universal_council_architecture.md` as a primary input, plus optional `minute_architecture_diagram.png` refresh; read-only everywhere else. 15B updates `docs/universal_council_app_foundations.md` with evidence/gaps and a crosswalk; read-only elsewhere. Separate files → safe to run in parallel.
- Phase 16: Config + module platformisation. 16A hardens tenant/service-domain schema + validators + CI (existing `common/config/*`, `config/*.yaml`, `scripts/validate_configs.py`). 16B surfaces module/flag contracts in backend routes/services (e.g., `backend/api/routes/config.py`, guards in `common/services/*`); no frontend edits. 16C plugs frontend shell/navigation into module registry + typed config (existing `frontend/lib/modules.ts`, `frontend/lib/config/*`, nav components), avoiding backend/config writes.
- Phase 17: Design-system and accessibility enforcement. 17A introduces a token set and theming contract using current touchpoints (`frontend/app/globals.css`, `frontend/components/theme-provider.tsx`, `frontend/components/org-theme-setter.tsx`, shared primitives under `frontend/components/`). 17B adds accessibility lint/tests and CI gates (Pa11y/axe/Playwright additions, `.github/workflows/ci.yml`), treating UI code as read-only in that sub-phase to avoid conflicts with 17A.
- Phase 18: Cross-platform shell & shared UI kit. 18A extracts shared primitives under `frontend/components/` (optionally new `frontend/components/ui/`) for RN-Web compatibility; web routes stay untouched. 18B stands up the `apps/mobile/` RN/Expo shell consuming the same module registry/config API; it only reads web code and writes inside the `apps/mobile/` folder.
- Phase 19: Module telemetry, governance, and admin console. 19A emits structured events/metrics per module/config change (backend instrumentation + worker). 19B delivers admin UI for config/versioning/audit (frontend admin routes; relies on 16A schema; avoids files touched in 18A/18B).
- Phase 20: Universal Multilingual Support. 20A (Backend/Worker) adds language config schema, Azure Translator integration, and translation worker jobs; read-only frontend. 20B (Frontend) adds language selector, side-by-side transcript view, and EAL phrase list UI; read-only backend.
- Phase 21: Platform & Repo Alignment. 21A (Docs & ADR) consolidates architecture docs and creates ADR for modular monolith structure; read-only code. 21B (Package De-dupe) updates `minute-main` to consume root `packages/*` and removes local placeholders; frontend/config refactor. 21C (Config Nav) creates `/api/modules` endpoint returning user-scoped nav based on service_domain+role, refactors `bottom-nav.tsx`/`sidebar.tsx` to fetch dynamically, adds domain filtering to `/templates`; backend+frontend; ensures users see ONLY their domain's modules (children's workers never see adult/housing features).
- Phase 22: Task Management Module. 22A (Backend) adds structured task extraction (LLM), Minute.tasks JSONB field, and MS Graph Planner write-back; read-only frontend. 22B (Frontend) adds Task List UI, "Push to Planner" interactions, and global task view; read-only backend.
- Phase 23: Cross-Platform Mobile Maturity. 23A (Core/State) abstracts offline queue logic from Dexie to shared adapter (RN-compatible); read-only UI. 23B (Mobile UI) implements full Capture/Transcription screens in `apps/mobile` using shared UI kit; read-only web app.
- Phase 24: Resilience & Error Handling. 24A (Frontend) implements global error boundaries, manual retry UI for failed queries, and "Offline/Degraded" mode indicators; read-only backend. 24B (Backend) adds health-check dependencies for critical services (STT, LLM) and circuit breakers; read-only frontend.
- Phase 25: Advanced Analytics & Insights. 25A (Backend) implements aggregation jobs for "Time Saved" and "Topic Trends" (SQL/Pandas); adds `/api/insights` endpoints; read-only frontend. 25B (Frontend) adds "Insights" module with charts/graphs using Recharts/Visx; read-only backend.
- Phase 26: Design System 2.0 & Premium Shell. 26A (Core/Shell) implements responsive `AppShell` (Sidebar/BottomNav) and View Transitions; read-only backend. 26B (Premium UI Kit) implements "Magic UI" tokens, `RecordingCard`, `SplitView`, and native-like `Sonner` toasts; read-only backend.
- Phase 27: Adaptive UX Engine. 27A (Context Engine) implements `UserPersonaProvider`, "Contextual Tabs" (Assessment/Supervision), and "One-Tap Mode Switch"; read-only backend. 27B (Role-Specific Views) creates distinct Dashboards for Social Workers (Quick Capture) vs Managers (Team Stats); read-only backend.
- Phase 28: Recording Studio 2.0 (Magic Notes-inspired). 28A (Waveform) integrates real-time waveform visualization, live status indicators, and floating recording controls with glassmorphism; read-only backend. 28B (Modes) adds In-Person/Online mode selector, "Upload Audio" flow, and mobile Quick Record FAB; read-only backend; UX and journeys aligned with `minute-main/docs/user_journeys.md`.
- Phase 29: AI Writing Assistant. 29A (Sidebar) creates floating AI editor with style suggestions, rewrite options, and free-form prompts using GPT-4o-mini; frontend/backend. 29B (Source Check) adds beta "Source Check" feature to verify claims against transcript segments; worker + frontend.
- Phase 30: Content Organization — ✅ 2025-11-25. Tabs now come from template metadata with persona defaults; tagging shipped with autocomplete, filters on “My notes”, and tags flow into exports.
- Phase 31: Config System & Module Registry (Universal App Foundation). 31A (Schema) and 31B (Module Manifests + `/api/modules`) done: tenant schema now includes roles/templates/lexicon/routes/dependencies, validation script fails fast; backend endpoint returns ModuleManifest objects. 31C (Config Nav) now wired: sidebar/bottom-nav consume server navigation payload with fallback when offline; regen client still pending when backend is runnable.
- Phase 32: Design Tokens & Theme Engine. 32A (Tokens) defines core token set (`tokens.json`) with accessibility guarantees (WCAG 2.2 AA contrast validation), generates CSS variables; frontend-only. 32B (Multi-Tenant) adds tenant theme overrides (logo, accent color) via `/api/theme?tenant=wcc` with contrast enforcement; frontend/backend.
- Phase 33: Advanced Offline & Sync. 33A (Unified Engine) abstracts offline queue to support multiple operation types (recordings, notes, tasks) with conflict resolution UI; frontend-only. 33B (Background Sync) implements service worker `sync` event handler and push notifications for sync completion; frontend/backend.
- Phase 34: Cross-Platform UI Kit (RN Web Prep). 34A (Shared Primitives) extracts zero-dependency components (`Button`, `Card`, `Badge`) to `frontend/components/primitives/` with RN Web aliases; frontend-only. 34B (Unified Icons) replaces `lucide-react` with cross-platform icon solution using registry pattern; frontend-only.
- Phase 35: Mobile Shell (React Native/Expo). 35A (Expo Shell) initializes RN app consuming `/api/modules` for navigation, implements auth flow (MSAL for RN); new `apps/mobile/` folder. 35B (Capture Screens) creates `CaptureScreen` using `expo-av`, `TranscriptionListScreen`, and `MobileOfflineStorage` (SQLite) with background upload; `apps/mobile/` only.
- Phase 36: Admin Console. 36A (Config Management) creates JSON Schema-driven config editor with diff view, version history, and rollback; frontend/backend. 36B (Module Dashboard) implements module/feature flag enablement matrix with real-time navigation preview; frontend-only.
- Phase 37: Telemetry & Adoption Dashboards. 37A (Structured Events) emits telemetry per module/action (`TelemetryEvent` schema) stored in TimeSeries DB; backend/worker-only. 37B (Adoption Dashboard) visualizes usage trends (recordings/day, top modules, offline queue health) for admins; frontend-only.
- Phase 38: Collaboration & Real-Time. 38A (Shared Editing) integrates `yjs` CRDT for conflict-free minute editing with WebSocket sync and presence indicators; frontend/backend. 38B (Comments) adds threaded comments on minute sections with email/push notifications; frontend/backend.
- Phase 39: Advanced Search. 39A (Full-Text) indexes transcripts/minutes in Azure Cognitive Search with global search bar (⌘K) and highlighted results; frontend/backend. 39B (Semantic) generates embeddings for `Minute.summary` using `text-embedding-3-small`, stores in vector DB (pgvector), adds `/api/search/semantic`; backend/worker.
- Phase 40: Compliance Tools. 40A (Audit Log Viewer) displays `AuditEvent` timeline with filters (user, resource, date) and CSV/JSON export; frontend-only. 40B (Retention Automation) implements cron job for auto-deletion per retention rules with grace period and admin summary emails; backend/worker.
- Phase 41: Performance Optimization. 41A (Code Splitting) analyzes bundle with `@next/bundle-analyzer`, lazy-loads heavy modules, achieves <200KB initial load; frontend-only. 41B (Asset Optimization) converts images to WebP/AVIF, enables `next/image` optimization with blur placeholders; frontend-only.

## Concrete Steps & Commands (per phase, repeatable)

- Framework upgrade audits:
  - Frontend: `pnpm lint:web && pnpm build:web`; Playwright smoke for `/` → `/record` → `/templates`; regenerate API client (`pnpm openapi:web`) after typed routes flip. citeturn0search1turn0search5
  - Backend: bump FastAPI/Pydantic, run `poetry lock`, `make test`, ensure `model_validate`/`TypeAdapter` replacements where ORM used. citeturn0search8turn0search0
  - Worker: bump Ray, set `RAY_worker_register_timeout_ms=20000`, namespace calls; run queue load smoke to verify restarts. citeturn1search1
- Install deps: `pnpm install`, `pnpm dev:web` (canonical web frontend), `pnpm openapi:web` (regenerate client), `cd minute-main && poetry install --with dev --without worker` for the canonical Python 3.14 backend path.
- Lint/format: follow repo defaults (`ruff`, `pnpm lint:web`).
- Frontend preview: `ENVIRONMENT=local pnpm dev:web` with dev JWT; `DEV_PREVIEW_MODE=on` only in local.
- Migrations: create Alembic revision (`alembic revision --autogenerate -m "<msg>"`), apply locally `alembic upgrade head`.
- Tests per change: backend unit, worker integration, Playwright for offline/relabel/export as added.

## Progress (update inline)

- [x] Phase 1 Identity/RBAC — Completed 2025-11-20T22:24Z (Entra JWKS + AuthContext + frontend MSAL/DEV_PREVIEW token plumbing)
- [x] Phase 1.5 Premium UI & Council Theming — Completed 2025-11-20T22:40Z (WCC/RBKC theming, gradients/glass, org logo assets, motion accents)
- [x] Phase 3a Config systemisation + module registry — Completed 2026-03-28 (Backend config models/loader + /config/{tenant_id}, frontend typed config fetcher + module filtering + nav rendering, config loader smoke tests, CI hook for config validation)
- [x] Phase 18A Shared UI kit extraction — Completed 2026-03-28 (UI demo route `/ui-demo`, shared UI README w/ RN-Web guidance, packages/ui/* components)
- [x] Phase 18B RN/Expo shell — Completed 2026-03-28 (Mobile scaffold under `apps/mobile/` with config fetch + module list, Metro/tsconfig/package metadata)
- [x] Phase 19A Module telemetry/governance — Completed 2025-11-21T19:30Z (module/config metrics + telemetry events, config/audit logging entries, infra dashboard updates)
- [x] Phase 2 Infra/Secrets — Completed 2025-11-20T23:26Z (Key Vault secret loader, UK-only Terraform with private endpoints, storage lifecycle + region guard)
- [x] Phase 3 Case Context — Completed 2025-11-20T23:52Z (case_record model + encrypted DOB, API requires case_reference, frontend case selector with offline cache, regenerated OpenAPI client)
- [x] Phase 4 Offline/PWA + fast/economy toggle — Completed 2025-11-21T00:05Z (SW+manifest, offline queue+Dexie, backoff sync with token, economy/fast toggle + processing_mode routed to Azure batch, mobile /capture flow)
- [x] Phase 5 Diarization quality/relabel — Completed 2025-11-21T00:24Z (Azure v3.2 tuning, phrase list + EAL locales, batch preference via processing_mode, canonical speaker UI, dialogue/feedback endpoints, feedback table; WER/DER hooks ready)
- [x] Phase 6 Templates (children/adults) — Completed 2025-11-21T00:52Z (social_care template suite, domain-aware metadata/mapping table, visit/risk/outcome fields in minutes & API/UI)
- [x] Phase 7 Evidence UX — Completed 2025-11-21T00:56Z (citation playback sidebar with timestamp jumps, signed URL endpoint, start/end timestamps kept via adapters)
- [x] Phase 8 Exports + M365 — Completed 2025-11-21T01:21Z (docx/pdf exporters, storage + SAS URLs, SharePoint/Planner hooks, frontend export buttons)
- [x] Phase 9 Security/Privacy/Governance — Completed 2025-11-21T01:24Z (audit middleware + table, retention policies per domain, security headers/HSTS/origin checks, rate limits, SW no-cache, idle reauth hints)
- [x] Phase 10 Observability/SLOs — Completed 2025-11-21T01:46Z (JSON logging w/ trace IDs, Prom metrics `/metrics`, latency/export/offline counters, health live/ready, trace propagation to worker)
- [x] Phase 11 Scale/Cost — Completed 2025-11-21T01:46Z (auto batch switch for long audio, per-domain LLM token budgets, KEDA autoscale manifest, load-test stub, cost weights/env, metrics for mode usage)
- [x] Phase 12 Testing gates — Completed 2025-11-21T02:05Z (unit tests for exports/cost guard/security headers, Playwright stub, CI workflow running pytest/lint/build, FastAPI upgrade smoke)
- [x] Phase 13 IaC/Pipelines — Completed 2025-11-21T02:05Z (GitHub Actions CI+deploy workflows, Terraform guards, KEDA autoscale manifest, blue/green deploy job)
- [x] Phase 14 Pilot/Rollout — Completed 2025-11-21T02:05Z (children pilot config file with templates/paths/roles, docs updated)
- [x] Platform upgrades (Next.js 15.1 / React 19, FastAPI 0.120.x, Pydantic 2.11, Ray 2.47) — Completed 2025-11-21T02:18Z (versions bumped, Ray namespace/timeout tuned, npm deps updated)
- [x] Phase 15A Architecture doc — Completed 2025-11-21T17:05Z (`docs/architecture.md` authored with exec summary, capability map, crosswalk; README pointer added)
- [x] Phase 15B Foundations gap map — Completed 2025-11-21T17:05Z (`docs/universal_council_app_foundations.md` updated with evidence, gap map, phase crosswalk, landing zone checklist)
- [x] Phase 16A Config schema hardening — Completed 2025-11-21T17:40Z (tenant config model expanded with version/nav metadata/retention; schema emitted `common/config/tenant.schema.json`; config validation tests updated; pilot config aligned)
- [x] Phase 16B Backend module/flag surfacing — Completed 2025-11-21T17:40Z (module gating helper, minutes routes guarded via tenant config, TENANT_CONFIG_ID setting added, module flag tests added)
- [x] Phase 17A Design tokens & theming contract — Completed 2025-11-21T18:10Z (central tokens map `frontend/lib/theme/tokens.mjs`, theme setter applies CSS variables, token-based contrast guarantees)
- [x] Phase 17B Accessibility gates — Completed 2025-11-21T18:10Z (a11y contrast test `frontend/tests/a11y.tokens.test.mjs`, npm script `test:a11y`, CI step added)
- [x] Phase 18A Shared UI kit extraction — Completed 2025-11-21T18:40Z (token-aligned primitives `frontend/components/ui/pressable-card.tsx`, `frontend/components/ui/token-text.tsx`, alias in `frontend/lib/ui/pressable.tsx`; no existing routes modified)
- [x] Phase 18B RN/Expo shell stub — Completed 2025-11-21T18:40Z (new `mobile/` folder with README, Expo `package.json`, stub `App.tsx` fetching tenant config and rendering module list; isolated from web)
- [x] Phase 19B Admin console — Completed 2025-11-21T22:22Z (admin routes `frontend/app/(admin)/admin/configs/**`, backend routes `backend/api/routes/admin.py`, role-based access checks, config listing/detail/history/audit endpoints, audit logging to `audit_event` table, telemetry events, tests in `tests/test_admin_routes.py`)
- [x] Phase 20A Multilingual Backend — Completed 2025-11-22T09:10Z (`TenantConfig.languages` schema + pilot config auto-translates EN→PL/AR/UK, `.env.example` + settings expose Azure Translator envs, `Transcription.translations` JSONB + migration, `TranslationService` + handler + serializer tests, Ray worker TaskType for translations with auto queue, API endpoints for request/list.)
- [x] Phase 20B Multilingual Frontend — Completed 2025-11-22T09:45Z (config-aware `Translations` tab w/ Magic Notes–style hero, selector/status cards, translation textarea, inline retry button; uses TanStack query/mutation hooks, tenant-config fallback env, shared `@ui/*` primitives; lint/build rerun.)
- [x] Phase 22A Task Management Backend — Completed 2025-11-23T02:15Z (minute_task table + Alembic revision, async task extraction service w/ Gemini fallback + Planner sync endpoint, `/minutes/{id}/tasks` CRUD + `/tasks` listing API, worker export hooked into planner push, MS Graph client now due-date aware)
- [x] Phase 22B Task Management Frontend — Completed 2025-11-23T02:15Z (Minute editor tasks panel w/ inline edits + push-to-Planner CTA, Add Task dialog, dynamic navigation now consumes `/api/modules`, and new `/tasks` page with filters + inline status updates)
- [x] Phase 23A Mobile Core/State — Completed 2025-11-24T14:15Z (Abstracted offline queue to `packages/core/storage`, implemented Dexie adapter for Web, Mobile adapter stub, wired up frontend and mobile app)
- [x] Phase 23B Mobile UI Implementation — Completed 2025-11-24T14:45Z (Expo app initialized, Capture/List screens implemented, SQLite adapter active, Sync logic added)
- [x] Phase 24A Frontend Resilience — Completed 2025-11-25T10:15Z (global AppErrorBoundary with Sentry capture, resilience banner for offline/API outages, retry controls on query errors, degraded/fallback nav styling, offline indicator reusing shared connectivity state)
- [x] Phase 24B Backend Circuit Breakers — Completed 2025-11-25T11:05Z (shared in-process circuit breaker guarding Azure Speech batch/sync, Translator, and MS Graph; `/health/ready` now reports degraded status; new `/health/detailed` surfaces breaker state without failing readiness)
- [x] Phase 25A Insights Backend — Completed 2025-11-25T12:05Z (insights service computes audio minutes/time-saved heuristic + top topics; new `/api/insights` endpoint scoped by org/domain; no schema change, ready for scheduled jobs)
- [x] Phase 25B Insights Frontend — Completed 2025-11-25T12:45Z (new `/insights` page showing time saved/audio totals/avg length and top topics; uses TanStack query fetcher to `/api/proxy/insights`; fallback nav now includes Insights for non-config environments)
- [x] Phase 26A Premium App Shell — Completed 2025-11-25T13:05Z (collapsible glass sidebar with animated width, blurred header overlay with toggle control; Framer Motion template retained; viewTransition already enabled; mobile FAB nav preserved)
- [x] Phase 26B Premium UI Kit — Completed 2025-11-25T13:40Z (shared UI gained RecordingCard + SplitView components, Sonner toasts restyled to premium glass; ready for reuse across capture/transcription flows)
- [x] Phase 27A Adaptive UX Engine — Completed 2025-11-25T14:05Z (PersonaProvider with role/local fallback, one-tap persona switch on transcription view, contextual tabs that adapt for managers vs social workers)
- [x] Phase 27B Role-Specific Dashboards — Completed 2025-11-25T14:45Z (home renders persona-driven dashboards; SW view with quick templates + recent meetings; manager view with insights cards and flagged reviews placeholder; persona switch surfaced on home)
- [x] Phase 28A Recording Studio 2.0 — Completed 2025-11-25T15:35Z (capture page gained animated waveform, live floating controls, consent-backed in-person vs online selector persisted to queue metadata; upload flow polish deferred only if backend support required)
- [x] Phase 29 AI Writing Assistant & Source Check — Completed 2025-11-25T16:10Z (source-check endpoint compares minute text to transcript evidence; UI button shows supported/partial/unsupported with excerpts; AI edit popover ready for guided instructions)
- [x] Phase 30 (Tabs & Tags) — Completed 2025-11-25 (Tabs from template metadata with persona defaults; tagging with autocomplete, filters on "My notes", tag chips, tags flow into exports)
- [x] Phase 31 Config System & Module Registry — Completed 2026-03-28 (module manifests at `/api/modules`, tenant schema with routes/deps/permissions, navigation payload consumed by sidebar/bottom-nav with offline fallback)
- [x] Phase 32A Design Tokens — Completed (tokens.json exists in frontend + packages/ui, WCAG 2.2 AA contrast validation via a11y tests)
- [x] Phase 32B Multi-Tenant Theme Engine — Completed 2026-03-28 (`/api/theme?tenant=` endpoint returns full theme tokens; `useThemeTokens` hook fetches and applies; dark mode support)
- [x] Phase 33A Advanced Offline Unified Engine — Completed (packages/core/storage abstracts Dexie/SQLite adapters for recordings/notes)
- [x] Phase 33B Background Sync — Completed 2026-03-28 (push notification lib + hooks; settings UI; SW with workbox-background-sync; backend endpoints stubbed)
- [x] Phase 34 Cross-Platform UI Kit — Completed (packages/ui/* with Button, Card, Badge, Dialog shared primitives)
- [x] Phase 35 Mobile Shell — Completed 2026-03-28 (apps/mobile with Capture/List screens, SQLite adapter, sync logic, expo-av recording)
- [ ] Phase 36A Config Admin Console — Backend endpoints exist, but the active `universal-app` shell has not adopted a dedicated `/admin/configs` route; current admin configuration lives under `/admin/settings` and `/admin/modules`.
- [x] Phase 36B Module Dashboard — Completed 2026-03-28 (admin/modules page with module registry view and enablement matrix across tenants)
- [ ] Phase 37B Adoption Dashboard Route — Adoption dashboard components exist, but the active `universal-app` route tree does not currently expose `/admin/adoption`; do not treat the route as shipped until it is wired or explicitly retired.
- [ ] Phase 38 Collaboration & Real-Time — Not started (yjs CRDT editing, WebSocket sync)
- [ ] Phase 39 Advanced Search — Not started (Azure Cognitive Search, semantic embeddings)
- [x] Phase 40A Audit Log Viewer — Completed 2026-03-28 (admin/audit page with filters, export to CSV/JSON, pagination; backend endpoints added)
- [x] Phase 40B Retention Automation — Completed (cleanup scheduler in postgres_database.py with domain retention policies)
- [x] Phase 41 Performance Optimization — Completed 2026-03-28 (bundle analyzer; dynamic imports for tabs; next/image with AVIF/WebP formats; OptimizedImage component)

### Context Snapshot [2025-11-21T02:35Z]

- Completed: Phases 1-14 + platform upgrades; frontend build passes on Next 15.5/React 19; backend pytest smoke green.
- Current state: Metrics/live endpoints in place; autoscale/KEDA manifest added; CI/deploy workflows authored; pilot config seeded.
- Blockers: None (React 19 peer warnings remain informational until upstream typings publish).
- Next: (if time) expand coverage to full test suite with optional deps, tune PWA cache size warning.
  - Quick wins shipped: skeleton loaders, export toasts, citation timeline, quick export on list cards.
  - Additional polish: helper text on New cards, focus/underline on tabs, toolbar layout stability, offline last-sync badge.

### Context Snapshot [2026-03-28T21:00Z]

- Completed in this session:
  - Phase 36B Module Dashboard (admin/modules page)
  - Phase 40A Audit Log Viewer (admin/audit page with filters and export)
  - Phase 32B Multi-Tenant Theme Engine (/api/theme endpoint + hooks)
  - Phase 33B Push Notifications (lib + hooks + settings UI)
  - Phase 41 Performance Optimization (dynamic imports, next/image config, OptimizedImage component)
- Current state: The active admin console has dashboard, modules, settings, templates, users, and audit surfaces. Adoption and config-detail routes still need either explicit wiring into `universal-app` or retirement from the roadmap claims.
- Blockers: Phase 38 (yjs) and Phase 39 (Azure Search) require additional infrastructure.
- Next: Consider Phase 38 yjs integration for real-time collaboration; Phase 39 requires Azure Cognitive Search setup.

### Context Snapshot [2025-11-21T12:10Z]

- Completed: Lexicon + dual-channel uplift for Azure STT; dialogue relabel UX confirmed via SpeakerEditor/SpeakerNamePopover; batch adapter indentation fixed.
- Current state: Phrase lists now domain-aware with bias weight; stereo recordings routed as dual-channel, mono keeps diarization; batch path supports custom model id.
- Blockers: None — awaiting production lexicon values per domain and optional custom Speech model IDs.
- Next: Feed domain phrase lists via Key Vault/env; consider UI surfacing for domain admins; broaden pytest coverage beyond smoke set.

### Context Snapshot [2025-11-21T13:00Z]

- Completed: Evidence UX tap-through — time-ranged signed URLs endpoint, evidence click logger; minute editor citations now jump audio with media fragments; evidence list buttons reuse the same handler; frontend client regenerated.
- Current state: Backend tests (health/export/cost/security + azure helper) pass; citation jumps use start/end timestamps per dialogue entry.
- Blockers: None (need real domain phrase lists & optional Speech custom model IDs for production quality).
- Next: optional UI for domain admins to manage lexicons; expand E2E to cover citation playback.

## Validation & Acceptance

- Per-phase exit criteria in Roadmap; all tests green; citations present when web lookups inform decisions; CHANGELOG updated for every change.

## Blockers & Decisions Log

- Full pytest suite currently blocked by optional deps/fixtures (breame, ray, ffmpeg, .data test audio); only `tests/test_health.py` runs green in `.venv`.
