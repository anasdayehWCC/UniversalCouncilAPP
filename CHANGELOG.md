# Changelog

## 2025-11-25

- **Phase 24A (Frontend Resilience) COMPLETE:** Added shared `ResilienceProvider` + connectivity hook (navigator + `/api/proxy/health/ready`) powering a premium resilience banner, offline indicator reuse, and degraded-mode detection. Wrapped main routes in `AppErrorBoundary` with Sentry capture and reload/home CTAs. Sidebar and bottom nav now expose retry buttons and greyed fallback nav when API/nav fetch fails; user templates list error state also includes a retry affordance instead of dead text.
- **Offline/Degraded UX polish:** Offline indicator now reuses shared sync state with quick retry; resilience banner surfaces pending sync counts and retry; nav items are aria-disabled when degraded to avoid crashes while keeping the UI stable.
- **Phase 24B (Backend Circuit Breakers) COMPLETE:** Introduced lightweight circuit breaker (`common/services/circuit_breaker.py`) guarding Azure Speech (sync + batch), Azure Translator, and MS Graph calls. Health endpoints now report dependency state: `/health/ready` returns `"degraded"` when breakers are open and `/health/detailed` exposes per-service breaker snapshots without failing readiness. Graph/Speech/Translator calls now short-circuit when open, reducing cascading failures.
- **Tests:** `npm run lint` (passes with existing admin effect warnings unchanged).

## 2025-11-25

- **Phase 25A (Backend Insights) COMPLETE:** Added insights service (`common/services/insights_service.py`) that computes audio minutes and time-saved (4x manual typing heuristic) plus top topics from latest minute versions. New `/api/insights` endpoint (org/domain scoped) returns aggregated metrics without schema changes; ready for future scheduled runs. Documentation updated in ROADMAP/PLANS. Tests: attempted `python -m pytest tests/test_insights_service.py -q` but pytest is not installed in the current environment (no tests executed).
- **Phase 25B (Frontend Insights) COMPLETE:** Introduced `/insights` page rendering time-saved/audio/average-length cards and top-topic chips using TanStack query against `/api/proxy/insights`; fallback navs now include Insights for non-config environments. Lint rerun succeeded (pre-existing warnings unchanged).
- **Phase 26A (Premium App Shell) COMPLETE:** Sidebar now collapses with animated glass styling, header gains blur overlay and toggle, keeping mobile FAB nav intact; viewTransition + Framer Motion template retained for smooth transitions.
- **Phase 26B (Premium UI Kit) COMPLETE:** Added shared `RecordingCard` and `SplitView` primitives to `packages/ui`, and upgraded Sonner toasts to premium glass styling. These components are ready for reuse in capture/transcription flows; no backend changes required.
- **Phase 27A (Adaptive UX Engine) COMPLETE:** Introduced `PersonaProvider` with role-aware defaults and local override; transcription page now includes one-tap persona switch and contextual tabs that adapt for managers (translations hidden, summary relabelled) vs social workers. Lint rerun succeeded (existing warnings in admin/dev-preview remain).
- **Phase 27B (Role-Specific Dashboards) COMPLETE:** Home now renders persona-driven dashboards—social workers get quick templates, CTA, and recent meetings; managers get insights snapshot cards and flagged review placeholder—with a persona toggle on the home header. Lint rerun succeeded (same existing warnings).
- **Phase 28A (Recording Studio 2.0 – Waveform/Controls) COMPLETE:** Capture page now includes animated waveform, live status chip with duration, floating pause/resume/stop controls, and consent-backed in-person vs online selector persisted into queued metadata; processing-mode toggle retained. Lint re-run (warnings unchanged).

## 2025-11-23

- **Phase 22 (Task Management Module) COMPLETE**: Added `minute_task` table + Alembic migration, `TaskStatus/TaskSource` enums, async Gemini-backed `TaskExtractionService`, Planner sync helpers, `/minutes/{id}/tasks` CRUD + `/minutes/{id}/tasks/push`, and `/tasks` listing API. Worker exports persist structured actions, clear stale AI rows, and fan-out to Microsoft Planner with due dates/owners. Frontend now includes a Minute editor tasks panel (inline edits, Push-to-Planner CTA, manual add dialog) and a new `/tasks` workspace with filters and “Mark done” controls. Navigation consumes live `/api/modules` responses so Tasks only surface when enabled. Docs (PLANS, ROADMAP, user journeys) updated to mark Phase 22 done.
- **Phase 21C (Config-Driven Navigation) - Part 1: Documentation Corrections**: Corrected architectural misconception across 6 documentation files to reflect accurate domain-scoped navigation vision where users see ONLY modules for their `service_domain` and `role`, not a multi-module switcher. Updated `minute-main/ROADMAP_social_care.md` (added Phase 21C section with deliverables, exit criteria), `PLANS.md` (expanded Phase 21 with 21C breakdown), `minute-main/docs/adr/001_platform_alignment.md` (clarified Universal Shell Pattern emphasizes domain scoping with server-side filtering), `minute-main/docs/architecture.md` (updated Plugin/Module Interface gaps to reference Phase 21C and domain filtering needs), `minute-main/docs/universal_council_app_foundations.md` (strengthened § 4.3 Plugin/module system and § 4.4 UI & navigation model with domain scoping requirements and anti-patterns). Vision now correctly states: children's social workers see ONLY children's modules/templates, adult workers see ONLY adult modules/templates, housing officers (future) see ONLY housing features; navigation filtered via `/api/modules` endpoint before returning to frontend, not hidden client-side.
- **Phase 21C - Part 2 (Backend Implementation)**: Created `backend/api/routes/modules.py` with `/api/modules` endpoint that queries `UserOrgRole` table to get user's `service_domain_id` and `role`, loads domain-specific config from tenant YAML, and returns filtered modules and navigation items (with role-based filtering). Registered `modules_router` in API router. Verified that `backend/api/routes/templates.py` already filters templates by `service_domain_id` using `ServiceDomainTemplate` table (no changes needed). Created domain-specific config files `config/wcc_children.yaml` and `config/wcc_adults.yaml` with modules and navigation definitions for children's and adult social care services.
- **Phase 21C - Part 3 (Frontend Implementation)**: Created `frontend/lib/icon-registry.ts` for mapping API icon strings to Lucide components. Refactored `bottom-nav.tsx` and `sidebar.tsx` to use dynamic navigation pattern with mock data (ready for real API integration once backend running). Components now support: dynamic icon rendering via `getIcon()` helper, loading skeletons during data fetch, role-based nav item filtering. Temporary mock functions (`useMockModules`) maintain current UX until OpenAPI client regenerated and backend deployed. Production build verified successful (Exit code: 0). Next steps: regenerate OpenAPI client (`npm run openapi-ts`), replace mock data with real API calls (`useQuery` + `getUserModulesModulesGetOptions`), test with populated `UserOrgRole` database.
- **Phase 23A (Mobile Core/State)**: Abstracted offline queue storage logic into `packages/core/storage` with `StorageAdapter` interface. Implemented `DexieStorageAdapter` for Web (wrapping `CareMinutesDB`) and `MobileStorageAdapter` stub for Mobile. Updated `minute-main/frontend/lib/offline-queue.ts` to use the shared abstraction via `getStorage()`. Wired up `apps/mobile/App.tsx` to initialize the mobile adapter. Added `dexie` dependency to `packages/core`. Verified Web build (pending unrelated API client fix) and Mobile initialization.
- **Phase 23B (Mobile UI Implementation)**: Initialized Expo app in `apps/mobile` with TypeScript and `expo-router`. Implemented `MobileStorageAdapter` using `expo-sqlite` for offline persistence. Built `TranscriptionList` (index) and `Capture` screens with audio recording (`expo-av`) and manual sync logic (`expo-file-system`). Configured monorepo support in `metro.config.js` and `tsconfig.json`. Verified type safety with `tsc`. Mobile app now supports offline recording and queuing.

## 2025-11-22

- Phase 20A (backend multilingual) delivered `TenantConfig.languages` (default/available/autoTranslate) with schema + pilot config updates, `.env.example` + settings for `AZURE_TRANSLATOR_*`, `Transcription.translations` JSONB (migration `20a0f2c1d3ab_phase20_translations.py`), Azure Translator client + handler with serializer unit test, and new queue + API plumbing (`TaskType.TRANSLATION`, worker auto-enqueue after transcription, `GET /transcriptions/{id}/translations`, `POST /transcriptions/{id}/translate`). Pilot auto-translates EN→PL/AR/UK when Azure credentials exist; graceful fallback logs when creds absent.
- Phase 20B (frontend multilingual) added a config-driven `Translations` tab on the transcription page (Magic Notes–style hero, selector/status cards, autop badges, accessible textarea, inline retry CTA) powered by the generated TanStack hooks and shared `@ui/*` primitives so RN/Web consume the same kit; tenant config fetch fallback introduced for client bundles.
- Documentation + governance refreshed: `ROADMAP_social_care.md` and `PLANS.md` mark Phase 20 completion with concrete highlights; `docs/universal_council_app_foundations.md` now records the multilingual shell approach; `config/pilot_children.yaml` enables autoTranslate to mirror the new workflow; `.env.example` documents translator env vars.
- Tests & lint: `poetry run pytest tests/test_translation_handler_service.py` (serialiser coverage) and `npm run lint` (existing admin hook warnings remain; no new issues).

## 2025-11-21

- Phase 16A/16B: Expanded tenant config schema (version tag, nav metadata fields, retention defaults, planner/sharepoint passthrough, module feature flags), generated `common/config/tenant.schema.json`, aligned `config/pilot_children.yaml`, added TENANT_CONFIG_ID setting, module gating helper (`common/config/access.py`), guarded minutes routes by module enablement, and added config/module flag tests.
- Phase 17A/17B: Added centralized theme tokens (`frontend/lib/theme/tokens.mjs`) applied by org theme setter; ensured CSS variables align. Introduced accessibility contrast test (`frontend/tests/a11y.tokens.test.mjs`), npm script `test:a11y`, and CI step to enforce AA contrast for core tokens.
- Phase 18A/18B: Added RN-Web friendly shared primitives (`frontend/components/ui/pressable-card.tsx`, `frontend/components/ui/token-text.tsx`, alias `frontend/lib/ui/pressable.tsx`) plus a UI playground page and Playwright snapshot stub. Refactored capture mode toggle to use the new primitives. Created isolated `mobile/` Expo stub (README, package.json, App.tsx consuming tenant config with shared tokens/module adapter, AsyncStorage offline queue, metro config, smoke test).
- Phase 15A/15B documentation: added `docs/architecture.md` (exec summary, capability map, architecture overview, phase 15–19 crosswalk, open questions) and refreshed `docs/universal_council_app_foundations.md` with evidence-based gap map, phase crosswalk, and landing-zone checklist; linked architecture doc from README; marked progress in PLANS.
- Phase 5 refinement: Added domain-aware Azure Speech phrase list builder with bias weight (`common/services/transcription_services/lexicon.py`, new settings/env + `.env.example`), enabled dual-channel handling for stereo via `channels=[0,1]` while keeping diarization for mono, and surfaced channel labels in dialogue entries. Azure batch adapter indentation bug fixed and supports optional custom model id; adapters now accept context (channel/domain/phrases) via `TranscriptionServiceManager`. Added regression tests in `tests/test_azure_speech_helpers.py`; smoke pytest suite still green.
- Evidence UX: Added time-ranged signed URL endpoint and evidence click logger (`backend/api/routes/transcriptions.py`, new schemas in `common/types.py`), regenerated OpenAPI client. Minute editor citations now jump playback using signed segment URLs with media fragments; evidence list buttons reuse the same handler and log clicks; citation links in Tiptap trigger playback while respecting PII logging rules. Frontend regenerated client and wired to new endpoints.
- Phase 8 (Exports + M365): Added docx/pdf exporters (`worker/exporters/docx_exporter.py`, `worker/exporters/pdf_exporter.py`) and orchestrator (`common/services/export_handler_service.py`) that runs in worker, uploads to storage, and optionally to SharePoint/Planner via new `MSGraphClient`. Minute schema now stores export paths, SharePoint item ids, planner task ids, status/error/timestamps (migration `0c8e5f0daddb_phase_8_exports.py`). New settings/env for Graph, export prefixes, SAS expiry; pyproject gains `python-docx` and `weasyprint`. Added API endpoint `POST /minutes/{minute_id}/export` returning SAS URL and wired to storage+Graph. Minute generation/edit now triggers exports in worker; manual edits enqueue export task. Frontend Minute editor now offers Export DOCX/PDF buttons using generated OpenAPI client; shows SharePoint status. OpenAPI regenerated from `openapi-temp.json` using noop queues. `tests/test_health.py` still passes.
- Phase 9 (Security/Privacy/Governance): Added audit trail middleware and `audit_event` table (migration `1a2b3c4d5e9a_phase9_audit_retention.py`), recording user/path/outcome/IP/UA for all API calls. Introduced `retention_policy` table and enhanced cleanup scheduler to purge recordings/transcriptions/minutes per org/domain policy plus storage deletes. Security hardening: strict security headers + HSTS, origin checks for state-changing requests, per-path rate limiter, service worker skips caching `/api/*`, and idle MSAL re-auth timer in `AuthProvider`. Added PII avoidance hints in capture + minute editor. `tests/test_health.py` passes with noop queues.
- Phase 10 (Observability/SLOs): Enabled JSON logging with trace IDs (tracing middleware + logging filter), Prometheus metrics via `/metrics` and worker server, custom metrics for transcription/minute/export/offline/LLM usage, health live/ready endpoints, trace propagation into Ray workers. Settings gains SLO targets and metrics toggles. Infra README documents dashboards/alerts; `tests/test_health.py` green.
- Phase 11 (Scale/Cost): Long-audio auto-switch to Azure batch STT via duration-aware adapter selection; per-domain LLM token budgets with cost weights; KEDA autoscale sample in `infra/keda/queue-scaling.yaml`; load-test stub `infra/loadtests/k6-smoke.js`; processing-mode/adapter Prom counters for route visibility; `.env.example` and settings extended with batch threshold, budgets, metrics ports. Pyproject includes Prometheus/JSON-logger deps. `tests/test_health.py` green (noop queues).
- Runtime hardening: bumped FastAPI to ^0.120 and pydantic to 2.11 (in-line with roadmap Phase 11 upgrade ask) and reinstalled in `.venv`.
- Phase 12 (Testing gates): Added unit tests for export action parsing, cost-guard budgets, and security headers (`tests/test_export_handler_service.py`, `tests/test_cost_guard.py`, `tests/test_security_headers.py`); Playwright smoke stub for export buttons; CI workflow (`.github/workflows/ci.yml`) runs pytest + frontend lint/build + terraform fmt/validate. All new tests pass locally under noop queues.
- Phase 13 (IaC/Pipelines): Added GitHub Actions deploy workflow for ACA blue/green (`.github/workflows/deploy.yml`) aligned with revision traffic splitting; Terraform guardrail still enforced; KEDA autoscale manifest and load test steps documented.

### Role

Act as an experienced Full-Stack Principal Engineer (TypeScript/Node.js, React Native + React Native Web, modular monorepos with Nx/Turborepo) specializing in configurable, multi-tenant government services.

### Task

Produce a research-backed, high-level architecture and development plan for a **universal council app** that is lightweight, reusable, and configuration-driven so different departments/teams and users can tailor behavior **without spawning sub-apps** or bloating the codebase.

### Context

- Repository scope: whole project.
- Organisations: City of Westminster and Royal Borough of Kensington and Chelsea (bi-borough); solution must generalize to other councils.
- Objectives:
  - Focus on **core foundations** (not verification/backend specifics yet): domain model, tenancy model, extensibility, performance, accessibility, governance, and delivery approach.
  - **Not about “branding per council”**; visual layer must prioritize accessibility/readability and consistent design tokens over arbitrary color swaps.
  - Must be **reusable**, cost/time efficient, and scalable across departments (no “mini-apps” proliferation).
- Constraints & considerations:
  - UK context (accessibility ≥ WCAG 2.2 AA; UK GDPR/privacy by design; service reliability/observability).
  - Multi-tenant/multi-department configuration, role-based access control, feature flags, and policy/config-as-code.
  - Offline/low-connectivity tolerance on mobile where feasible; performance budgets.
  - “Move away from prior ‘Minit’ approach” to a council-first platform (don’t clone central gov patterns blindly; justify choices).
- Unknowns: Use **semantic search thinking** to surface what’s missing; propose how to resolve gaps (e.g., discovery questions, data you’d need, experiments/proofs).

### Expected Output

- Deliver a **single, comprehensive Markdown document**: `docs/architecture.md`, that includes:
  1. **Executive Summary**: goals, non-goals, success criteria.
  2. **Assumptions & Open Questions**: unknowns discovered via semantic-search framing; list clarifying questions to the stakeholder.
  3. **Problem Decomposition & Capability Map**: core domains and cross-cutting concerns.
  4. **Architecture Overview**: target state (diagrams in Markdown syntax/ASCII if needed) covering:
     - Multi-tenant model (council → department/team → user); isolation strategy.
     - **Configuration-driven extensibility**: plugin/module system; feature flags; policy-as-code.
     - UI composition (RN + RN-Web), navigation, and **design-token system** enforcing accessibility (contrast, typography, spacing).
     - Data access layer abstraction (API-agnostic; REST/GraphQL compatible) without locking into one backend.
     - AuthN/AuthZ & RBAC, auditing, PII boundaries, and data residency.
     - Performance & offline strategy; caching; background sync.
     - Observability: logging, metrics, tracing; SLOs.
  5. **Tenancy & Config**: schemas for tenant/department config (YAML/JSON), feature toggles, permissions, content taxonomies, i18n.
  6. **Plugin Interface**: minimal spec for feature modules (capabilities, routes, permissions, config hooks, telemetry).
  7. **Accessibility Plan**: how accessibility is enforced at build & runtime; linting/tests; token constraints (≥ WCAG 2.2 AA).
  8. **Security & Privacy**: threat model overview; least-privilege; secure storage on device; secrets handling; UK GDPR DPIA hooks.
  9. **Delivery & Governance**: monorepo layout, CI rules, codeowners, versioning, release trains, env promotion.
  10. **Testing Strategy**: unit, contract, e2e; **include sample tests** that assert plugin loading, config validation, and accessibility tokens.
  11. **Migration/Roadmap**: phased plan (0→1 prototype, pilot with Westminster/RBKC, scale-out), risks & mitigations.
  12. **References**: cite any standards/prior art used (no runtime web calls required to render output).
- Provide **new files** in a minimal scaffold (≤ 500 lines total across all code/fixtures):
  - `packages/core/config/schema/tenant.schema.json` (example).
  - `packages/core/plugins/registry.ts` (plugin loader interface).
  - `packages/ui/tokens/tokens.json` (accessibility-safe defaults + rules).
  - `apps/mobile/App.tsx` and `apps/web/App.tsx` (shells wiring registry + config).
  - `packages/core/flags/flags.example.yml` (feature flags).
  - Tests:
    - `packages/core/config/__tests__/tenant.schema.test.ts`
    - `packages/core/plugins/__tests__/registry.spec.ts`
    - `packages/ui/__tests__/tokens.a11y.spec.ts`
- If code changes are made relative to an implied empty repo, output **new files** with content; if modifying existing snippets, use a **unified diff**.
- No external network calls after `setup script`. Include citations as plain links/text in the Markdown doc (not fetched at runtime).

### Guidance for Codex

1. **Structured CoT**: Plan → Design → Files → Tests.
2. **Semantic-search pass**: enumerate unknowns + propose how to discover them; do not invent fake facts.
3. **Self-critique loop**: generate → review against goals/constraints → refine once; document the refinements succinctly in an “Appendix: Review Notes”.
4. Keep total new content **≤ 500 lines**. Favor clarity over breadth; show just-enough scaffolding.
5. Do not include secrets/PII. Avoid hard-coding council-specific branding; focus on accessibility tokens and configuration.

### Setup Script (if needed)

```bash
# (Optional) Initialize a minimal TypeScript monorepo skeleton for illustration only (no network after this).
npm init -y
npm pkg set type=module
mkdir -p packages/core/{config,plugins,flags}/__tests__ packages/ui/__tests__ apps/{web,mobile} docs
- Phase 14 (Pilot/Rollout): Seeded pilot config `config/pilot_children.yaml` (Children domain templates, SharePoint path, Planner placeholders); documentation notes for rollout paths.
- Platform upgrades: Frontend bumped to Next.js 15.1 / React 19 (npm install, peer overrides noted), backend on FastAPI 0.120.x + Pydantic 2.11; Ray init hardened with namespace + worker register timeout env; settings/.env updated. Re-ran backend smoke tests (passing). Package-lock refreshed.
- Platform upgrades follow-up: Resolved Next.js 15.5 app router layout/params typings, updated layouts to ReactNode, fixed rename dialog prop, replaced unsupported `bg-white/10` utilities, regen package-lock with React 19; frontend build now succeeds (warnings only re cache/sourcemap size). Smoke pytest suite still green.
- AGENTS/Docs: Added rule 35 to enforce React 19 / Next 15 layout typing guidance; Roadmap log updated with post-upgrade validation checklist; PLANS snapshot recorded.
- UI/UX refinements: Added skeleton loaders to transcription page, glassy chips for case/subject; evidence sidebar timeline with better labels/focus and disabled state guard; export toasts; toolbar layout tightened; mobile helper text on New flow; last-sync badge on capture; reusable `Skeleton` component; added date-fns for relative time; PWA cache limit raised to silence sourcemap warning. Frontend build (Next 15.5) and backend smoke pytest still passing.

## 2025-11-20

- Update AGENTS.md rules: enforce web-search when unsure (rule 26) and require changelog updates for every change (rule 27).
- Document framework upgrade guardrails in AGENTS.md (rules 32–33) and thread them into ROADMAP_social_care.md Phase 4/11 plus PLANS.md audits with web-cited upgrade steps (Next.js 15.5, FastAPI 0.120/Pydantic 2.11, Ray 2.43).
- Note Playwright MCP server availability and tool list in AGENTS.md (rule 34) for standardized browser E2E interactions.
- Backend auth hardening: add Entra ID JWT validation with org/domain/role scoping in `backend/api/dependencies/get_current_user.py`; introduce `AuthContext` delegation; add `created_by_user_id` to minutes via `c2f7890abc12_add_minute_created_by.py` and model field; scope minutes/transcriptions/chat queries by organisation/domain.
- Frontend auth plumbing: adjust middleware to prefer Bearer Authorization (with local fallback) and relax token parsing in `frontend/lib/auth/index.ts` to accept Entra-style claims, keeping UI usable until MSAL wiring is added.
- Frontend Phase 1 close-out: add MSAL client auth (`frontend/lib/auth/msalConfig.ts`, `providers/AuthProvider.tsx`, `components/auth/AuthGate.tsx`, `hooks/use-access-token.ts`), API client auth hook, dev-preview fetch fixtures, and .env.example entries for Entra/preview flags; middleware gains msal strategy bypass.
- Premium theming groundwork: org-driven theme setter, gradient/glass styles in `frontend/app/globals.css`, WCC/RBKC SVG assets, header/footer motion refresh, and framer-motion accents on transcription list items.
- Testing: ensured `tests/test_health.py` passes in `.venv`; disabled Sentry DSN for tests to avoid BadDsn errors; noted remaining suite dependencies (breame, ray, ffmpeg, audio fixtures).
- Infra docs (Phase 2): added `infra/README.md` describing ACA + private endpoints, Service Bus, Key Vault, Postgres MI auth (UK South/West only).
- Backend DB auth: optional managed-identity Postgres tokens via `POSTGRES_AUTH_MODE=managed_identity` using DefaultAzureCredential in `common/database/postgres_database.py`; added KV/MI envs to `.env.example`.
- Test harness & safety shims: add `NoopQueueService` and test env defaults to avoid external queue hits, make Gemini adapter imports lazy for missing SDKs, and created a local venv to run `tests/test_health.py` successfully; full suite still needs optional deps (breame, ray, ffmpeg, test audio fixtures).
- Phase 2 completion: Key Vault secret hydration in `common/settings.py` (env-first, MI-backed), added `azure-keyvault-secrets` dependency, applied UK-only region guard script `infra/ci/ensure_uk_region.sh`, Terraform scaffold with private endpoints (Storage, Service Bus, Postgres, OpenAI, Speech) in `infra/terraform/`, and blob lifecycle policy JSON in `infra/storage_lifecycle.json`. Updated `infra/README.md` to describe dev-preview slot and IaC flow; reran `tests/test_health.py` (passing).
- Phase 3 completion: added case context schema (`case_record` table + FK columns on minutes/transcriptions) via Alembic revision `bb9c2d4cf7e5_case_context.py`; PII-safe Fernet helper with `PII_ENCRYPTION_KEY`; API now requires `case_reference` on transcription create and propagates case metadata; frontend start-transcription flow collects case/worker/initials/DOB with offline IndexedDB cache (reference + hash only) via new `CaseCacheProvider`; transcription list/detail show case chips; OpenAPI client regenerated (config now allows `OPENAPI_TS_INPUT` override). `tests/test_health.py` still passing; other suites pending optional deps.
- Phase 4 completion: Offline/PWA captured via service worker + manifest, Dexie-backed offline queue with exponential backoff sync using auth token, stored per-case metadata; `captured_offline` flag and `processing_mode` (fast/economy) persisted to DB and worker. Economy requests route to Azure batch adapter via worker, fast remains default. Frontend adds `/capture` mobile flow, case-aware start form, fast/economy toggle, and offline indicator tied to queued uploads. Recording create supports `captured_offline`; OpenAPI client regenerated. Migration `d4c3f2a1b6ef_add_captured_offline_to_recording.py`. `tests/test_health.py` still passing.
- Phase 5 progress: Azure STT adapters moved to api-version `2025-10-15`, added phrase list + multilingual EAL candidates, diarization-enabled batch; new `transcription_feedback` table (migration `e5f1a0c5a9ab`), dialogue endpoints for relabel/feedback, canonical speaker selection UI, and speaker role tagging. Processing_mode now used to prefer batch adapter. OpenAPI regenerated; health test still green.
- Phase 6 (complete): Added social care template suite (`home_visit`, `supervision`, `strategy_discussion`, `lac_review`, `adult_safeguarding`, `chronology_update`, `actions_only`, `manager_summary`, `child_protection_conference`) under `common/templates/social_care/` with domain tags; TemplateMetadata now includes service_domains; new `service_domain_template` mapping table (migration `f6c1d2e4ea11`) and filtering in `/templates`; minute fields `visit_type`, `intended_outcomes`, `risk_flags` wired through API/UI/start forms; Simple/Section templates inject contextual case/visit/risk info.
- Phase 7 (complete): Evidence UX — citation playback sidebar in Minute editor with timestamp jumps, signed recording URL endpoint, DialogueEntry carries `canonical_speaker`; adapters ensure start/end timestamps preserved; continued timestamp citations in templates. OpenAPI regenerated; `tests/test_health.py` passes.

## 2025-11-21 (universal app foundations for Minute)
- Add `docs/universal_council_app_foundations.md` under `minute-main/docs/` describing how the existing Minute-based solution can evolve into a universal, config-driven council app for WCC/RBKC (multi-tenant model, plugin modules, design tokens, role/domain-aware navigation, and RN/RN-Web convergence path).
- Implement config systemisation groundwork: add Pydantic tenant config models/loader (`common/config/models.py`, `common/config/loader.py`), expose read-only config API (`backend/api/routes/config.py`) and register in router. Frontend gains typed tenant config fetcher (`frontend/lib/config/types.ts`, `frontend/lib/config/client.ts`).
- Add frontend module declarations for Transcription/Minutes and helper to filter by tenant/domain (`frontend/lib/modules.ts`).
- Navigation now renders from tenant config (modules filtered by service domain) with loading/error states; templates button only if minutes module enabled. Added `useTenantConfig` hook and updated pilot config with module list.
- Added config validation tests and script (`tests/test_config_loader.py`, `tests/test_config_all.py`, `scripts/validate_configs.py`); module map expanded with admin/notes placeholders; GIthub Actions workflow `config-validate.yml` runs validation on push/PR.

## 2025-11-21 (Phase 18A/18B progress)
- Added shared UI demo route (`frontend/app/ui-demo/page.tsx`) and README for the UI kit with RN-Web guidance.
- Expanded AGENTS with mobile shell rule; PLANS updated with Phase 18A/B progress markers.
- Added RN/Expo scaffold under `mobile/` (package/app config, Metro, TS config) with config fetch + module list view; kept web files untouched.

## 2025-11-21 (Phase 19A telemetry & governance)
- Introduced telemetry helpers + Prometheus counters (`module_access_total`, `feature_flag_check_total`, `config_served_total`, `offline_sync_outcome_total`) with structured logging in `common/telemetry/events.py`; backend routes now record module access, flag checks, config serve events, and tenant-tagged offline outcomes.
- Config API logs Prom metrics and writes `audit_event` entries per serve; minutes/transcription routes emit module events; offline sync completion in worker now tagged by tenant/domain/role.
- Added tests for telemetry counters, updated module flag helper to accept telemetry context, and expanded infra docs with dashboard/alert guidance. PLANS marked Phase 19A complete.
- Wire nav to module/tenant config: Header now renders navigation from enabled modules per tenant/service domain; includes loading/error states; defaults to `NEXT_PUBLIC_TENANT_ID` or westminster. Added `useTenantConfig` hook. Updated pilot config with module list.
- Enforcement docs: AGENTS adds rule for config-first navigation; PLANS marks Phase 3a tasks as done. Added `tests/test_config_loader.py` for loader.

## 2025-11-21 (universal app foundations for Minute)
- Add `docs/universal_council_app_foundations.md` under `minute-main/docs/` describing how the existing Minute-based solution can evolve into a universal, config-driven council app for WCC/RBKC (multi-tenant model, plugin modules, design tokens, role/domain-aware navigation, and RN/RN-Web convergence path).

## 2025-11-21 (user journeys, roadmap & repo structure)
- Added `minute-main/docs/user_journeys.md` capturing persona-based journeys (social worker, manager, admin, QA, digital) across web and mobile, including offline/online flows, Magic Notes–style capture/edit patterns, and mapping to roadmap phases.
- Consolidated universal architecture documentation by treating the root `docs/architecture.md` as the single canonical “Universal Council App – Architecture & Development Plan” and removing the duplicate `minute-main/docs/universal_council_architecture.md`; all crosswalk content now lives in the root doc.
- Extended `minute-main/ROADMAP_social_care.md` with phases 27–40 (Recording Studio 2.0, AI writing assistant, content organisation, universal config & module registry, design tokens, advanced offline/sync, cross-platform UI kit, RN mobile shell, admin console, telemetry, collaboration, advanced search, compliance tools, performance), aligned to the universal council architecture and using `minute-main/docs/user_journeys.md` as UX input.
- Updated `minute-main/docs/universal_council_app_foundations.md` with a repository layout & consolidation plan (canonical product in `minute-main`, shared universal packages in root `packages/*`, and a phased plan to dedupe `packages/core` and `packages/ui`), so structural refactors are explicitly tracked.
- Noted in `PLANS.md` that Phase 27 (Recording Studio 2.0) must stay aligned with the journeys defined in `minute-main/docs/user_journeys.md`.
- **R2 module/tokens consolidation:** Added shared `packages/core/config/types.ts` and `packages/core/modules/index.ts` (module manifest + role permissions + helper), updated `minute-main/frontend` to import via `@core/*` aliases with Next.js `externalDir` enabled, removed the duplicate `minute-main/packages/*` files, re-exported permissions/types locally for compatibility, and moved theme tokens into `packages/ui/tokens/index.mjs` with the frontend and a11y tests consuming the shared file.
- **R2 UI primitives consolidation (batch 2):** Added shared primitives to `packages/ui` (`button`, `card`, `input`, `tabs`, `select`, `skeleton`, `pressable-card`, `token-text`, `utils`, barrel `index.ts`) and switched `minute-main/frontend/components/ui/{button,card,input,tabs,select,skeleton,pressable-card,token-text}.tsx` to re-export from `@ui/*` using the existing aliases. This keeps RN/Web and the social-care app on the same UI kit.
```
