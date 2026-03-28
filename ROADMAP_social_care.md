# Minute → Social Care Production Blueprint (Adults & Children, WCC/RBKC)

Purpose: A detailed, non-hand-wavy build plan to take the current Minute codebase to a production-ready, UK-hosted, role-aware transcription+minutes tool for children’s and adults’ social care, while keeping it configurable for future directorates (housing, transport, etc.) without forks or needing to extensively refine it. Every section lists what exists, what’s missing, and concrete edits with file paths.

## Ultimate Goal & Requirements (ground truth)

Must-have for MVP (Children’s social care pilot)

- Choice at capture time between “fast/now” (low latency, higher cost) and “economy/batched” (processed off-peak, lower cost).
- Clear SLA promises per path (e.g., fast ≤ 30 min end‑to‑end for ≤60 min audio; economy ≤ 24h).
- Mobile-first capture with robust offline mode and auto-sync when online.
- High-quality diarization: speaker separation, relabel to roles (child, parent/carer, social worker, interpreter), timestamps on every segment.
- Configurable, co-designed templates for social-care artifacts (home visits, supervisions, strategy discussions, pathway plans, looked-after-children reviews, chronologies) – no plain text dump.
- Evidence linking: every summary/action references transcript timestamps; reviewer can open the exact audio/text.
- UK-only hosting under council control; private networking.
- Entra ID SSO, role-based access per org/service domain; audit trail of all access/exports.
- Export to Word/PDF in council formats; push to OneDrive/SharePoint; minimal clicks.
- Manager views: instant structured variants (manager summary, actions-only, chronology update).
- Cost-aware, predictable use of Azure Speech/OpenAI with fallbacks and budgets.
- Good UX: low cognitive load, minimal windows; clear status of uploads/processing.

### The 20 Specific Requirements (Must-Haves & Roadmap)

1.  **Mobile-first capture**: Robust offline mode, auto-sync on network return.
2.  **High-quality diarization**: Auto-separating speakers, user relabeling (child, parent, SW), timestamped segments.
3.  **Configurable templates**: Co-designed with social workers (visits, supervisions, etc.), not text dumps.
4.  **Structured summaries**: Variants for manager summary, case chronology updates, actions only.
5.  **Multilingual support**: Translation assistant for EAL families (optional/roadmap).
6.  **Evidence linking**: Templates refer back to transcript timestamps; clickable verification.
7.  **Tenant-controlled hosting**: UK-only hosting (Azure UK South).
8.  **Entra ID SSO**: Seamless login for council staff.
9.  **Granular RBAC**: Role-based access control per org/service domain.
10. **Complete audit trail**: Logging all access, exports, and actions.
11. **DPIA & Governance**: Security and privacy by design.
12. **Export to Word/PDF**: Correct fields, forms, headings, metadata.
13. **Microsoft 365 Integration**: One-click export to OneDrive/SharePoint.
14. **Task extraction**: Export identified tasks to Planner/To-Do (roadmap).
15. **Cost performance**: Value for money, batch processing for non-urgent items.
16. **Accuracy**: High fidelity in transcription and summarization.
17. **Governance**: Compliance with social care standards.
18. **Integration**: Seamless workflow with existing council tools.
19. **Value**: Tangible time savings for practitioners.
20. **User Journey/UX**: Avoid "15 windows open", intuitive flow.

Roadmap / optional (still design for now)

- Multilingual support / translation assistant for EAL families.
- Task extraction → Planner/To Do.
- Insights across multiple sessions (cross-meeting trends).
- Additional directorates (housing, transport) via domain configs and templates.
- Redaction mode for wider sharing; PI redaction.
- Automated QA/quality scores on transcripts/diarization.
- Edge/offline STT option (Azure Speech container or Whisper) for sites with zero connectivity; not default because of device/GPU needs.

Assumptions/constraints

- Hosting on Azure UK South/West only; no data leaves UK. No internet egress for services except to Azure Speech/OpenAI and M365 Graph.
- Identity provider is Entra ID (WCC/RBKC tenant); device mix includes council-managed iOS/Android phones with intermittent connectivity.
- MVP domain focus: Children’s social care; Adults follows the same patterns with different templates/prompts/lexicons.
- Principle: “One codebase, many domains” via config (org/domain/role claims) rather than branching code.

## 2026-03-28 Repository Consolidation Baseline

- `universal-app/` is now the canonical web frontend for ongoing work.
- `apps/mobile/` is the canonical mobile app.
- `minute-main/backend/` and `minute-main/worker/` remain the production backend and worker bounded context.
- `minute-main/frontend/` is frozen as a legacy migration reference and should not receive new feature work.
- Historical references below to `frontend/...` describe the legacy `minute-main/frontend` path unless they explicitly point at `universal-app/`.

Vagueness watchlist (keep honest)

- Ensure “domain-aware UX” means UI copy, templates, export targets, retention, and lexicons are all domain-driven config—not just template lists.
- Offline mode must be proven with device reboot and multi-file queue, not just cached shell.
- Evidence linking must include clickable timestamps and access logging; not just citations in text.
- SharePoint/Planner integration must use Managed Identity (no stored tokens) and be retryable.
- Cost controls must specify token/audio caps per domain and degrade gracefully.
- “Fast vs economy” promise must be backed by measured STT/LLM SLAs and actual Azure batch vs realtime price difference; defaults documented per role/domain.

## 0. Baseline Assessment (what’s here today)

- Backend: FastAPI (`backend/`), auth expects Cognito-style JWT in header (`backend/api/dependencies/get_current_user.py`). DB: Postgres models in `common/database/postgres_models.py`; migrations via Alembic. Queues abstracted; SQS default, Azure Service Bus adapter present (`common/services/queue_services/azure_service_bus.py`). Storage abstraction for S3/Azure Blob (`common/services/storage_services/`).
- Worker: Ray-based async processors (`worker/worker_service.py`) handling transcription + LLM minute generation; templates discovered from `common/templates/` (default: cabinet, planning, care assessment v2, general, executive summary).
- Transcription: Supports Azure Speech (sync, batch) and AWS Transcribe (`common/services/transcription_services/*`). Diarization flag on for Azure; dialogue entries created with timestamps; speaker relabeling is LLM-based heuristic (`common/audio/speakers.py`, `generate_speaker_predictions.py`).
- Frontend: Next.js app router (`frontend/app/...`), upload/record start points at `/new/*`, minutes list at `/recordings` & `/transcriptions`. No PWA/offline, no speaker relabel UI, no evidence view. API client generated via Hey API.
- Observability: Sentry/PostHog optional in code but not wired with prod settings. Logging basic.
- Security/gov: No Entra, no RBAC roles, no audit trail, no retention, no private endpoints defined, no DPIA hooks.
- Exports: Text minutes only; no docx/PDF pipeline, no M365 integration.
- Testing: Unit/e2e tests exist mainly for queues/templates; no coverage for auth, offline, exports, RBAC (`tests/`).
- Infra: Docker Compose only; no Terraform/Bicep; defaults to LocalStack/SQS.
- UX: Recording flows are desktop-biased; no mobile layout guidance or accessibility review.
- Dev auth path: Frontend middleware injects a baked JWT when `ENVIRONMENT=local`; backend also fabricates a JWT in local/integration-test modes. Browsing UI locally requires Postgres + backend up; if backend is down there is no mock API, so pages that fetch will error.

## Guiding Design Decisions (do before coding)

1. Single tenant per deployment, but multi-organisation + multi-service-domain inside the data model. Use claims to select domain-specific templates/UI.
2. Configuration-first: service-domain registry stored in DB and cached; no environment-variable proliferation for domains.
3. Offline-first capture as a first-class flow; do not assume always-on connectivity.
4. Evidence traceability mandatory: every generated section links back to transcript timestamps; audit logs for all access.
5. Security-by-default: private endpoints, managed identity, least privilege, no shared keys in code.
6. Observability-first: tracing/metrics/logging wired before feature rollout; every queue/source has IDs for correlation.
7. UX parity desktop/mobile: design capture and review for one-handed phone use; WCAG-AA accessible.
8. Backward compatibility: default templates and AWS adapters kept for now, but Azure is the opinionated target for prod.
9. Roll-forward not rollback: blue/green deployments with quick disablement via feature flags (templates, offline sync, exports).
10. Cost knobs visible: users can opt into batched STT/LLM; operators can set per-domain budgets, throttles, and commitment tiers.

## Roadmap Phases (deep detail)

### Phase 1 — Identity, Tenancy, Roles (enable domain-aware UX)

**Objective:** Replace Cognito stub with Entra ID, model org/service domains/roles, and enforce isolation.

Current gaps

- Token parsing is hardcoded to Cognito example (`backend/api/dependencies/get_current_user.py`).
- No org/service domain model; `User` only has email.
- No RBAC hooks in queries or templates.

Actions

1. Data model
   - Add tables (`common/database/postgres_models.py` + Alembic): `organisation`, `service_domain`, `role`, `user_org_role` (user_id, org_id, domain_id, role). Add `minute.org_id`, `minute.domain_id`, `minute.case_ref`, `minute.created_by` FKs; same for `transcription` and `recording`.
   - Migration files under `alembic/versions/` with backfill script for existing data (assign default org/domain).
2. Auth
   - Implement Entra validation with JWKS cache (kid rotation) in `backend/api/dependencies/get_current_user.py`; read `AUDIENCE`, `TENANT_ID`, `ISSUER` from env. Use `python-jose` to decode and validate JWT signature against keys from `https://login.microsoftonline.com/{TENANT_ID}/v2.0/.well-known/openid-configuration`.
   - Map Entra group/role claims → internal `role` rows; fail closed if no role.
   - Preserve local preview: keep `ENVIRONMENT=local` path with generated JWT for UI-only browsing; hard-error if that path is used when ENV is not local; add `DISABLE_LOCAL_FAKE_JWT` override for prod safety.
3. Context propagation
   - Add a `RequestContext` object resolved per request carrying `org_id`, `domain_id`, `role`; ensure every query in API routes filters by org/domain (minutes, transcriptions, templates, user-templates).
4. Frontend
   - Consume ID token from Entra (MSAL) and pass bearer token through `universal-app/src/lib/api-client.ts` plus the generated client surface under `universal-app/src/lib/api/generated/`; surface role/domain in global state/provider.
   - Add `DEV_PREVIEW_MODE` that serves fixture JSON (Next.js route handlers or MSW) for list/detail pages when backend is unreachable so UI can be navigated without Postgres/Azure. Ensure middleware allows this mode without token when env=local and flag set.
5. Tests
   - Unit tests for token validation (happy/expired/issuer mismatch) and RLS filters. Integration test hitting a protected endpoint with a test Entra token.

Exit: All API responses are scoped by org+domain; requests without Entra token are 401; role claim missing → 403; tests green.

### Phase 1.5 — Premium UI & Council Theming (WCC & RBKC)

**Objective:** Transform the generic "gov-style" UI into a premium, responsive, and council-branded experience that adapts to the active tenant.

**Branding Source of Truth:**

- **Westminster City Council (WCC):**
  - Primary: Dark Blue `#004B65`, Green `#7CAE22`
  - Accents: Teal `#3BA08D`, Orange `#F28E00`, Pink `#C75D92`
  - Style: Vibrant, "ActiveWestminster" feel, leaf motifs.
- **Royal Borough of Kensington and Chelsea (RBKC):**
  - Primary: Astronaut Blue `#273971`, Regent St Blue `#A2CDE0`
  - Style: Elegant, crest-based, high contrast.

**Actions:**

1. **Design System Overhaul (Tailwind):**
   - Define a semantic color system in `frontend/app/globals.css` using Tailwind v4's `@theme` directive and CSS variables (e.g., `--primary`, `--secondary`, `--accent`).
   - Implement a `ThemeProvider` that injects these CSS variables based on the user's `organisation_id`.
   - Replace generic "gov-gray" backgrounds with subtle gradients and "glassmorphism" cards to elevate the aesthetic.
2. **Component Refinement:**
   - **Sidebar/Navigation:** Collapsible, brand-colored gradient backgrounds, high-quality iconography (Lucide React).
   - **Cards & Lists:** Remove heavy borders; use soft shadows (`shadow-lg`, `shadow-xl`) and rounded corners (`rounded-2xl`) for a modern feel.
   - **Typography:** Switch to premium sans-serif fonts (e.g., Inter or specific council fonts if licensed); ensure high readability and WCAG AA contrast.
3. **Tenant-Specific Assets:**
   - Use logos for WCC and RBKC in `frontend/public/assets/orgs/`.
   - Dynamically load the correct logo in the `Header` and `Sidebar` based on the active session.
4. **Micro-Interactions:**
   - Add subtle animations (framer-motion) for page transitions, list item entry, and button hovers.
   - Ensure "loading" states are skeleton screens matching the brand layout, not just spinners.

**Exit:** UI automatically switches theme based on login; WCC users see WCC colors/logos; RBKC users see RBKC colors/logos; interface feels "premium app" not "database admin".

### Phase 2 — Environment, Secrets, Networking (UK-only, least privilege)

**Objective:** Make deployments UK-only, private, and secret-managed.

Actions

1. Infra decisions (document in `infra/README.md` addendum): Azure Container Apps for API/worker; Azure Cache for Redis (optional), Azure Postgres Flexible Server, Azure Storage (Blob + Queues/Service Bus), Azure Key Vault, App Gateway WAF, Log Analytics.
2. Private networking: Enable private endpoints for Postgres, Blob, Service Bus, OpenAI, Speech. Use VNet Integration for ACA. Disallow public network on cognitive services.
3. Secrets: Move all secrets to Key Vault; app/worker use Managed Identity. Remove `.env` reliance in prod; keep `.env.example` for local only. Update `common/settings.py` to allow MSI-based Postgres auth and Key Vault secret loading.
4. Regions: enforce `UK South/West` in IaC. Add guardrail check in CI to fail if region not UK.\*
5. Lifecycle policies: Configure Blob lifecycle (auto-delete raw recordings after retention), versioning off for recordings, on for templates.
6. Dev/preview toggle: in IaC and app config, keep a `dev-preview` slot that allows test JWT + mock data; explicitly disable in prod/subscriptions to avoid accidental exposure.

Exit: IaC plan produces private endpoints; no hardcoded secrets; local dev still works via .env and LocalStack.

### Phase 3 — Data & Case Context (tie minutes to cases securely)

**Objective:** Make every minute/transcription link to a case/person context with minimal PII exposure.

Actions

1. Extend models: add `case_reference`, `worker_team`, `subject_initials`, `subject_dob` (nullable, encrypted at rest) to minutes/transcriptions; PG row-level encryption not needed if column-level encryption via pgcrypto or application-level envelope.
2. Add `case_id` foreign key table (`case` with minimal fields) to allow linkage without exposing full names in transcripts; enforce org/domain ownership.
3. API: update create-minute/transcription endpoints to require `case_reference` and domain; validate domain membership of user.
4. Frontend: add case selector (search) on `/new/*` pages; cache recent cases offline (IndexedDB) without PII (store reference + hash).
5. Auditing: log case_id in audit trail (Phase 11).

Exit: All new minutes/transcriptions must carry case_reference; DB constraints enforce org/domain; UI cannot submit without case reference.

### Phase 4 — Offline-first Mobile Capture

**Objective:** Practitioners can capture audio on mobile with no network and auto-sync later.

Actions 0) Framework upgrade prerequisite

- Upgrade frontend to Next.js 15.5 + React 19 and switch builds to Turbopack/typed routes (`next build --turbopack`, `next dev --turbo`) to reduce bundle times and enable stable App Router caching needed for PWA. Audit: run `npm run lint`, `npm run build -- --turbopack`, Playwright smoke for `/new` + `/capture`, and regenerate API client after typed-route adoption. citeturn0search1turn0search5

1. PWA foundation
   - Add service worker + manifest in `frontend/public/`, register in `frontend/app/layout.tsx`; cache app shell, fonts, icons.
   - Use `workbox-background-sync` or custom queue for failed POSTs to `/api/recordings`.
2. Local storage design
   - Create `frontend/lib/offline-queue.ts` to persist pending uploads (IndexedDB). Fields: temp file blob path, filename, size, created_at, case_ref, domain_id, template_choice, notes.
   - Encrypt at rest in browser? Keep minimal PII: avoid names; store hashed case ref; warn if user adds free text.
3. Capture UI
   - New route `/capture` built for touch: start/pause/stop, level meter, timer, local save indicator; allow attaching quick tags (e.g., “home visit”, “strategy discussion”).
4. Background sync
   - On connectivity regain, chunked upload via existing backend upload endpoint. Add exponential backoff and retry counters; surface per-item status.
5. Backend compatibility
   - Ensure upload endpoint accepts resumable/chunked uploads (add to `backend/api/routes/recordings.py` if absent) and returns job id immediately. Store “captured_offline” flag.
6. Tests
   - Playwright E2E: go offline → record → queue → restore network → auto-upload success/duplicate handling.
7. User choice for cost/latency
   - When enqueuing offline items, allow user to pick `fast` (realtime STT queue) or `economy` (batch STT queue). Persist choice with the job; default per role/domain can be set in admin config.
8. Dev preview safety
   - Provide a dummy recorder and local blob stub when `DEV_PREVIEW_MODE` is on, so developers can navigate capture flow without microphone permissions or backend; ensure clearly marked and disabled in prod builds.

Exit: Flight-tested offline flow on iOS/Android browsers; no data loss after device reboot; uploads resume automatically with correct metadata.

### Phase 5 — Transcription Quality & Diarization Excellence

**Objective:** High-accuracy diarization with relabel, timestamps, and local lexicons.

Actions

1. Azure Speech tuning
   - In `common/services/transcription_services/azure.py`, add custom pronunciation lexicons for local names/places; set `language= en-GB` and multi-locale candidates for EAL scenarios.
   - Enable channel-aware processing: if stereo detected (`common/audio/ffmpeg.py`), split to dual-channel diarization.
   - Use Speech v3.2 endpoints for both realtime and batch to access current diarization/features; keep API version configurable per environment.
2. Resilience
   - Implement retry/backoff around Azure HTTP 429/5xx (tenacity already for start; add for polling if needed). Capture content filter errors; fall back to batch adapter when long audio.
3. Speaker relabel workflow
   - API: expose dialogue entries with timestamps and current speaker labels; endpoint `/transcriptions/{id}/dialogue` (read/write) adding “canonical_speaker” field.
   - Frontend: build relabel UI on transcription view with bulk apply (e.g., set Speaker 1 → “Social Worker”, Speaker 2 → “Mother”). Persist back via PATCH.
4. Quality loop
   - Add feedback endpoint `/transcriptions/{id}/feedback` to store corrections; nightly job updates lexicon/common phrases per domain; store WER/DER metrics for sampled jobs.
5. Privacy
   - Do not store raw audio longer than retention; redact in logs. Ensure transcription text marked “sensitive”.
6. Batch/economy path for cost
   - Implement secondary queue + worker path that aggregates low-priority jobs into Azure Speech **Batch Transcription** (Speech v3.2 REST API).
   - Workflow: Upload audio to Blob Storage -> Generate SAS -> POST to `transcriptions:transcribe` -> Poll status -> Download JSON.
   - Use `contentContainerUrl` to submit multiple blobs together to cut per-hour cost ($0.36/hr vs $1/hr for realtime); diarization remains available in batch. Expose admin control for which roles/domains default to batch.
   - Add SLA guardrail: if batch job not complete within 24h, auto-promote to fast path and alert.

Exit: Users can relabel speakers; citations carry timestamps; diarization accuracy improves after feedback; retries prevent failed jobs.

### Phase 6 — Template System for Social Care

**Objective:** Provide domain-specific, configurable templates for Children & Adults with minimal future rework.

Actions

1. Template registry
   - Add `common/templates/social_care/` with modules: `home_visit.py`, `supervision.py`, `strategy_discussion.py`, `lac_review.py`, `child_protection_conference.py`, `adult_safeguarding.py`, `chronology_update.py`, `actions_only.py`, `manager_summary.py` implementing `SimpleTemplate` or `SectionTemplate`.
   - Register in `common/templates/__init__.py` and ensure `TemplateManager.get_template_metadata()` surfaces domain tags.
2. Domain mapping
   - Create mapping table `service_domain_template` in DB to allow enable/disable per domain; expose via `/templates` endpoint filtering by domain/role.
3. Agenda capture
   - Extend minute creation request (API + frontend) to accept `visit_type`, `intended_outcomes`, `risk_flags`; store on minute; pass to template prompt via `common/templates/types.py` agenda handling.
4. Prompt tuning
   - For each template, include required sections, reading age, and evidencing style (e.g., timestamped bullet with child voice). Keep hallucination check on for critical templates.
5. Manager variants
   - Implement templates that collapse to actions-only and manager summary; expose quick-generate buttons in UI.
6. Edge cases
   - Handle short transcripts by gating on `MIN_WORD_COUNT_FOR_SUMMARY` per template; show fallback “insufficient audio” notice.

Exit: Template list is domain- and role-filtered; generation produces structured, timestamp-cited minutes matching social-care forms; actions-only + manager summary available.

### Phase 7 — Evidence Linking & Review UX

**Objective:** Every statement traceable to transcript time; reviewers can drill down quickly.

Actions

1. Ensure timestamps
   - Verify Azure adapter populates `start_time/end_time` per phrase; if missing, derive using offset/duration when available.
2. Citations
   - Use `common/templates/citations.py` to append `[start-end]` references; extend to embed absolute timestamps (HH:MM:SS) in export.
3. UI changes
   - Transcription view: side-by-side timeline; clicking citation jumps playback to timestamp (use `<audio>` with URL presigned by storage service).
   - Minute viewer: hover to reveal transcript snippet; include “open evidence” link.
4. API
   - Add signed URL generation endpoint for time-limited access; hide raw blob path from client.
5. Audit hooks: record every evidence click in audit trail (Phase 11).

Exit: Minutes show citations; reviewers can open audio/text at cited time; audit log captures review actions.

### Phase 8 — Exports & Microsoft 365 Integration

**Objective:** One-click export to Word/PDF and M365 (SharePoint/OneDrive; Planner tasks).

Actions

1. Exporter module
   - Add `worker/exporters/docx_exporter.py` using python-docx; include cover metadata (case, visit date, participants, domain), citation footnotes, and embedded ISO8601 timestamps. PDF via WeasyPrint or ReportLab wrapper `pdf_exporter.py`.
2. Worker pipeline
   - Extend `common/services/minute_handler_service.py` to call exporter after minute generation; store blob keys for docx/pdf; update DB columns.
3. API endpoints
   - `/minutes/{id}/export?format=docx|pdf` returning SAS URL; enforce org/domain; log download.
4. Graph integration
   - Add service `common/services/msgraph_client.py` using Managed Identity; upload exports to configured SharePoint library path per domain; store file IDs.
   - Planner: parse `actions` section and create tasks assigned to Entra users; store planner task IDs in DB.
5. Frontend
   - Export buttons with status; show destination (e.g., “Saved to SharePoint: Adults/Visits/2025/”).

Exit: DOCX/PDF artifacts available; SharePoint uploads succeed; Planner tasks created from actions; audit records downloads/uploads.

### Phase 9 — Security, Privacy, Governance by Design

**Objective:** Meet council governance (DPIA) from day one.

Actions

1. Audit trail
   - Add middleware in FastAPI to log user, action, resource, case_id, timestamp, IP/device, outcome; store in `audit_event` table.
2. Retention & deletion
   - Background job via `common/database/postgres_database.init_cleanup_scheduler` to purge audio after N days, transcripts after M days, minutes after X (per domain policy). Configurable in DB.
3. Access controls
   - Enforce least privilege claims; add per-minute ACLs (owner, team, domain). Deny cross-domain access.
4. PII minimisation
   - Frontend hints to avoid PII in free text; redact PII in exports optionally (LLM pass with redaction prompt).
5. Device hardening
   - Force HTTPS, HSTS; disable service worker cache for sensitive endpoints; add idle timeout and re-auth triggers using MSAL refresh.
6. Pen test readiness
   - Add security headers via FastAPI middleware; CSRF protection for state-changing requests from web; enable rate limits on upload/auth endpoints.

Exit: DPIA checklist items mapped to controls; retention job proven; pen test findings (simulated) resolved.

### Phase 10 — Observability & SLOs

**Objective:** Measure and keep the system healthy.

Actions

1. Structured logging
   - Update backend/worker to log JSON with trace IDs; propagate trace headers to worker (Ray) tasks.
2. Metrics
   - Expose Prometheus/OTel metrics: transcription latency, queue depth, error rates, export success, offline sync success. Add health endpoints (`/health/live`, `/health/ready`).
3. SLOs
   - Define targets: P95 transcription + minute gen for 60-min audio < 15 min; export success > 99%; offline sync success > 99% within 2h of reconnect.
4. Alerts
   - Create Log Analytics alerts for queue backlog, 5xx, auth failures, storage errors.
5. Cost/route visibility
   - Track fast vs batch path selection, Speech batch job durations, LLM model mix (gpt-4o vs gpt-4o-mini vs batch), and per-domain token/audio spend; surface dashboards for ops and product to tune defaults.

Exit: Dashboards present; alarms firing to on-call; SLOs calculated.

### Phase 11 — Performance, Scale, Cost Controls

**Objective:** Handle long recordings and keep spend predictable.

Actions 0) Runtime upgrades and stability hardening

- Backend: bump FastAPI to ^0.120.x and Pydantic to 2.11 for faster schema builds and security fixes; rerun `poetry lock`, execute full API test suite, and verify `model_validate/from_attributes` paths. citeturn0search8turn0search0
- Worker: bump Ray to ^2.43 and configure longer worker register timeouts plus namespace isolation in `worker/worker_service.py`; run `ray up` smoke and queue load test to ensure actor restarts continue to work. citeturn1search1

1. Worker autoscale: configure ACA/KEDA triggers on queue depth for transcription & LLM queues.
2. Long audio path: automatically switch to Azure batch transcription for >60 min (`TRANSCRIPTION_SERVICES` order) and skip LLM until transcript ready; use batch pricing (cheaper than realtime) and submit via `contentContainerUrl` when multiple files are queued.
3. Storage costs: enable gzip for transcripts; configure blob lifecycle; avoid double copies.
4. LLM cost caps: set per-domain token budgets; short model for quick summaries, best model only for final minutes; use Azure OpenAI **Batch API** for non-urgent minute generation to reduce per-token price; prefer `gpt-4o-mini` for drafts and `gpt-4o` only where quality demands.
5. Commitments: evaluate Speech commitment tiers once monthly volume known; set per-domain throttle to avoid overruns.
6. Load tests: k6/gatling against upload→queue→worker for 50 concurrent users; measure memory/CPU.

Exit: Autoscaling rules applied; cost guardrails documented; load test report stored.

### Phase 12 — Testing & Quality Gates

**Objective:** Comprehensive automated coverage for new capabilities.

Actions

1. Unit: add tests for new templates, queue adapters, exporters, auth validator, audit middleware.
2. Integration: mock Azure Speech/OpenAI/Graph with recorded fixtures; end-to-end transcription → minute → export using sample audio.
3. Frontend: Playwright flows for offline capture, speaker relabel, export to SharePoint.
4. Security: dependency scanning, secret scanning, SAST; add to CI.
5. Gates: block merge on failing tests/coverage < threshold.

Exit: CI green with new suites; merge blocked on regressions.

### Phase 13 — Deployment Architecture & Pipelines

**Objective:** Repeatable deployment with environment parity.

Actions

1. IaC: author Terraform/Bicep in new `infra/` directory (or reuse council standard) covering VNet, ACA, Postgres, Key Vault, Storage, Service Bus, OpenAI, Cognitive Services, App Gateway, Log Analytics. Add dev/uat/prod workspaces.
2. CI/CD: GitHub Actions/Azure DevOps with jobs: lint/test, build Docker images, push to ACR, run migrations, deploy via ACA revisions. Generate frontend OpenAPI client in pipeline (run `npm run openapi-ts`).
3. Blue/green: use ACA revisions and traffic splitting; run smoke tests before cutover.

Exit: One-click pipeline from main → dev → uat → prod with approvals; rollback tested.

### Phase 14 — Pilot & Rollout (Children’s first)

**Objective:** Controlled pilot then scale.

Actions

1. Seed domain config: import Children’s templates, lexicons, role mappings, SharePoint paths.
2. Train small cohort; collect diarization relabel feedback and export pain points; iterate lexicon and templates weekly.
3. Expand to Adults after hardened; then add “domain pack” pattern for other services (housing/transport) with their own templates and SharePoint libraries without code changes.

Exit: Successful pilot sign-off; backlog of tweaks captured; Adults rollout scheduled.

### Phase 15 — Architecture Documentation & Foundations Crosswalk (split for concurrency)

**Concurrent-safe grouping:** 15A and 15B run in parallel; they write to different docs.

#### Phase 15A — Architecture doc (new docs/architecture.md)

- **Objective:** Produce the authoritative `docs/architecture.md` (target defined in CHANGELOG) covering exec summary, assumptions, capability map, plugin/nav/tenant model, accessibility, testing, delivery, and migration plan.
- **Write scope:** `docs/architecture.md` file plus optional refreshed `minute_architecture_diagram.png` and a short pointer in `README.md`. All code is **read-only**.
- **Dependencies:** None; uses current repo state, `docs/universal_council_app_foundations.md`, and the newly integrated `docs/universal_council_architecture.md` as inputs.
- **Actions:**
  1. Capture current architecture from code (backend/worker paths, queues, storage, offline queue, module registry) and note deviations from `docs/universal_council_app_foundations.md`.
  2. Draft sections per CHANGELOG spec, incorporating the "Universal Council" vision from `docs/universal_council_architecture.md`; embed ASCII diagram or reference `minute_architecture_diagram.png`; list open questions and risks.
  3. Add crosswalk to roadmap phases (15–19) and how they deliver the target architecture.
- **Exit:** `docs/architecture.md` exists with all required sections, cross-links to universal foundations doc, and dated open-questions list.

#### Phase 15B — Universal foundations gap map (`docs/universal_council_app_foundations.md`)

- **Objective:** Update the foundations doc with present-state evidence, gaps vs target architecture, and a phase-to-gap crosswalk.
- **Write scope:** `docs/universal_council_app_foundations.md` only. Code and configs are **read-only**.
- **Dependencies:** None; can run in parallel with 15A because it only edits this doc; align terminology during handoff review.
- **Actions:**
  1. Inventory what already exists (config loader, module registry, offline queue, templates, audit/retention) with code pointers.
  2. Record gaps that require Phases 16–19 (plugin shell, config schema/versioning, tokenised design system, RN shell, module telemetry).
  3. Add “landing zone” checklist for when architecture doc is published (links, owners, review cadence).
- **Exit:** Foundations doc now has a gap list + crosswalk to phases 16–19 and a review cadence note; no code touched.

### Phase 16 — Config + Module Platformisation

#### Phase 16A — Tenant/service-domain schema hardening (backend + configs)

- **Objective:** Turn tenant/service-domain config into a schema-validated, versioned contract consumed by all services.
- **Write scope:** existing config loader/validator surfaces: `common/config/models.py`, `common/config/loader.py`, `scripts/validate_configs.py`, `tests/test_config_loader.py`, `tests/test_config_all.py`, `config/*.yaml`. Frontend is **read-only** in this sub-phase.
- **Dependencies:** Needs 15A/15B outputs only for terminology; otherwise none.
- **Actions:**
  1. Extend config schema with nav/module metadata, feature flags, design tokens reference, SharePoint/Planner targets, retention defaults, and version tag.
  2. Emit JSON Schema (under `common/config/`) and wire CI (`config-validate.yml`) to enforce it; add fixture for Adults/Housing domains without touching frontend.
  3. Add migration/loader shim to populate DB tables or cached registry from the configs; keep API backward compatible.
- **Exit:** Schema + validator enforce new fields; configs carry versions; CI fails on drift; backend can serve expanded config without changing frontend.

#### Phase 16B — Backend module/flag surfacing

- **Objective:** Expose module/feature entitlements from config through API and service layer without touching web UI.
- **Write scope:** `backend/api/routes/config.py`, request context/dependencies, and service-layer guards in `common/services/*`; backend tests in `tests/`. Frontend is **read-only**; config files only adjusted if needed for fixtures from 16A.
- **Dependencies:** 16A schema finalized.
- **Actions:**
  1. Add module/flag fields to config response models; ensure per-request context carries module/feature entitlements.
  2. Gate sensitive routes (exports, admin, offline queue controls) by module flags; add audit events on flag-controlled paths.
  3. Add contract tests ensuring disabled modules return 403/404 and enabled paths behave unchanged.
- **Exit:** Backend enforces module/flag contracts; API docs/OpenAPI regenerated; tests cover enable/disable behavior.

#### Phase 16C — Frontend shell plugs into module registry

- **Objective:** Drive navigation and route mounting purely from module registry + service domain/role, matching backend config.
- **Write scope:** `frontend/lib/modules.ts`, `frontend/lib/config/*`, and nav/layout components under `frontend/app/**`. Backend/config files are **read-only**.
- **Dependencies:** 16A schema + 16B API fields available.
- **Actions:**
  1. Update module registry to consume new config fields (nav labels, icons, permissions, domains); add loading/error states.
  2. Refactor sidebar/header/tab navigation to render from registry; prevent routes for disabled modules from rendering or prefetching.
  3. Add Playwright smoke ensuring module enable/disable changes nav without backend write conflicts; keep exports/sync flows untouched.
- **Exit:** Navigation/route exposure is config-driven; disabled modules disappear without code edits; frontend tests cover enable/disable.

### Phase 17 — Design System & Accessibility Enforcement

#### Phase 17A — Token set + theming contract

- **Objective:** Introduce an accessibility-first token set and migrate shared primitives to use it.
- **Write scope:** existing theming touchpoints `frontend/app/globals.css`, `frontend/components/theme-provider.tsx`, `frontend/components/org-theme-setter.tsx`, and shared primitives under `frontend/components/` (buttons, cards, chips, typography). Tests/CI are **read-only** in this sub-phase to avoid clashes with 17B.
- **Dependencies:** 16C nav refactor complete (to avoid double-touching layouts).
- **Actions:**
  1. Define core tokens (color, spacing, typography, motion) with WCAG 2.2 AA pairs; allow tenant/domain overrides via config references only (no inline colors).
  2. Migrate primitives to tokens; remove stray Tailwind inline hex codes; keep domain branding via token overrides.
  3. Document token usage in `frontend/theme/README.md` and map tokens to config fields for future RN/Web reuse.
- **Exit:** Core UI uses tokenized variables; no hard-coded colors remain in shared primitives; docs describe override rules.

#### Phase 17B — Accessibility lint/tests & CI gate

- **Objective:** Add automated AA enforcement.
- **Write scope:** Accessibility tooling config (`package.json` scripts, Playwright/Pa11y/axe configs), `.github/workflows/ci.yml` additions, new tests under `frontend/tests/` or `frontend/__tests__/`. UI components stay **read-only** in this sub-phase to avoid conflicts with 17A.
- **Dependencies:** 17A tokens landed; uses their contrast map.
- **Actions:**
  1. Add automated a11y run for core pages (capture, transcriptions, minutes, exports) in CI; store baseline snapshots.
  2. Add lint rule to block non-token colors and low-contrast pairs; enforce minimum tap target sizes.
  3. Document remediation workflow (when failing snapshot -> file issue -> token tweak vs component tweak).
- **Exit:** CI fails on contrast/tap-target regressions; a11y report artifacts generated; remediation guidance recorded.

### Phase 18 — Cross-Platform Shell & Shared UI Kit

#### Phase 18A — Shared UI kit extraction (web-first, RN-Web compatible)

- **Objective:** Extract reusable, platform-neutral primitives to prepare for RN shell without regressing web.
- **Write scope:** shared primitives under `frontend/components/` (optionally moved into a new `frontend/components/ui/`), plus supporting styles in `frontend/app/globals.css`. Mobile/RN files are **read-only**.
- **Dependencies:** Tokens (17A) complete; nav refactor (16C) in place.
- **Actions:**
  1. Identify primitives used across capture/transcription/minute pages; refactor to platform-neutral props (no DOM-only APIs).
  2. Add RN-Web compatibility shims where needed (e.g., pressable abstraction); keep current Next.js routes intact.
  3. Add Storybook/Chromatic (or local equivalent) stories for shared components to catch regressions.
- **Exit:** Shared primitives live in one place, tokenised, and free of browser-only dependencies; web builds still pass.

#### Phase 18B — React Native/Expo shell (mobile)

- **Objective:** Stand up a minimal RN/Expo shell consuming the same module registry + config API.
- **Write scope:** `apps/mobile/` directory, RN/Expo app bootstrap, module registry adapter. Web/frontend files are **read-only** to avoid conflicts with 18A.
- **Dependencies:** 16C registry contract stable; 18A shared kit available for reuse.
- **Actions:**
  1. Scaffold RN/Expo app in `apps/mobile/` with auth + config fetch + module list view; reuse shared tokens; stub screens for transcription/minute modules.
  2. Add offline queue adapter mapping to mobile storage (e.g., MMKV/AsyncStorage) without touching web Dexie code.
  3. Add minimal detox/E2E smoke to ensure config loads and nav renders per module.
- **Exit:** RN shell builds and renders module-driven nav; shares tokens/config; no changes to web app required.

### Phase 19 — Module Telemetry, Governance, and Admin Console

#### Phase 19A — Telemetry + governance for modules/config

- **Objective:** Instrument module usage and config changes with auditability.
- **Write scope:** Backend/worker instrumentation (`common/services/*`, `worker/*`), audit/metrics models, dashboards described in `infra/README.md`. Frontend/admin UI is **read-only** here.
- **Dependencies:** 16B backend module surfacing complete.
- **Actions:**
  1. Emit structured events for module loads, feature-flag checks, config version served, and offline queue outcomes tagged by tenant/domain/role.
  2. Extend audit log to capture config publishes and admin actions; add Prom metrics for module adoption and failure rates.
  3. Document dashboard/alert targets for SLOs per module in `infra/README.md`.
- **Exit:** Metrics and audit events exist for module/config operations; dashboards/alerts documented; no frontend changes yet.

#### Phase 19B — Admin console for config/versioning/audit

- **Objective:** Provide a guarded UI for config changes with audit trails.
- **Write scope:** Frontend admin routes/components (e.g., `frontend/app/(admin)/**`), and any paired admin API endpoints if required. Telemetry/backends from 19A are **read-only**.
- **Dependencies:** 19A events available; 16A schema and 16B API fields in place.
- **Actions:**
  1. Build admin surfaces to view config versions, diff, and promote between environments; respect module/role-based access.
  2. Wire approvals/audit logging to 19A events; ensure edits write back to repo or storage bucket (decide mechanism, not both).
  3. Add E2E tests ensuring unauthorized roles cannot access admin routes; ensure concurrency safety by limiting file writes to config storage only.
- **Exit:** Admin UI allows controlled config changes with audit; unauthorized access blocked; E2E passes.

### Phase 20 — Universal Multilingual Support

#### Phase 20A — Backend translation services & config

- **Status:** ✅ Completed 2025-11-22.
- **What shipped:**
  - `TenantConfig.languages` now captures `default`, `available`, and `autoTranslate` flags (schema + docs updated, pilot config set to auto-translate English→Polish/Arabic/Ukrainian).
  - Added `TranslationService` (Azure Translator client with retry + graceful fallback) and `TranslationHandlerService` to create/track translation jobs per language.
  - `Transcription` model stores a `translations` JSONB map; Alembic revision `20a0f2c1d3ab_phase20_translations.py` backfills column.
  - Worker queue gained new `TaskType.TRANSLATION`; Ray LLM actor now processes translation jobs alongside minutes/edits, with auto-queue triggered after successful transcription when `autoTranslate=true`.
  - Backend exposes `POST /transcriptions/{id}/translate` (manual request, multi-language payload, optional force) and `GET /transcriptions/{id}/translations` (status list). Access control matches transcription ownership, telemetry + audit wired.
  - Settings + `.env.example` gained `AZURE_TRANSLATOR_KEY/REGION/ENDPOINT`; defaults keep behaviour no-op if credentials absent (we return source text and warn).
  - Tests: lightweight serializer coverage (`tests/test_translation_handler_service.py`) to guarantee JobStatus parsing + ISO handling; worker/unit smoke tests rerun locally.
- **Next checks:** add queue depth metrics + Azure Translator credential rotation, wire admin UI so tenant owners can update allowed languages without code change.

#### Phase 20B — Frontend translation UI

- **Status:** ✅ Completed 2025-11-22.
- **What shipped:**
  - Added `Translations` tab to the transcription page with a hero card riffing on the Magic Notes “Record → Keep safe → Use later” storyline (glassmorphism + gradient) so social workers immediately understand the flow.
  - Built `TranslationsTab` client component using the generated TanStack query hooks. It:
    - Fetches translation statuses with polling while jobs are queued/in progress.
    - Reads tenant language config (via `useTenantConfig`) so the selector + status cards are entirely config-driven.
    - Shows premium status chips (Queued/Translating/Ready/Needs attention), error messaging, and autop badges per language.
    - Provides a dropdown + CTA to request/regenerate translations; handles optimistic states and surfaces mutation errors inline.
    - Displays completed translations in an accessible textarea ready for copy/paste or export.
  - UI primitives come from the shared `@ui/*` kit so RN/Web shells share the design tokens; skeleton + badges preserve AA contrast.
  - `DEFAULT_TENANT_CONFIG_ID` env fallback added for client config fetches so white-labelling remains config-first.
  - Frontend lint + build rerun (existing admin hook warnings noted); ensures React Query + MSAL contexts unaffected.
- **Next checks:** extend translation view into the capture flow (e.g., quick share as PDF/email), add Playwright smoke to cover translation polling.

### Phase 21 — Platform & Repo Alignment (Universal Council App)

**Objective:** Align the repository structure with the "Universal Council App" vision, treating `minute-main` as the Social Care bounded context and root `packages/*` as the shared platform.

**Actions:**

1. **Documentation Consolidation:**

   - Merge `minute-main/docs/universal_council_app_foundations.md` and any root docs into a single canonical `docs/architecture.md` (or `docs/universal_foundation.md`).
   - Create an ADR (`docs/adr/001_platform_alignment.md`) formalizing the "Modular Monolith" structure: Root = Platform, `minute-main` = Social Care Product.

2. **Package De-duplication:**

   - Verify root `packages/core` and `packages/ui` contain the latest shared logic/components.
   - Update `minute-main/frontend` to consume root `packages/*` (via workspace aliases or relative paths) instead of localized copies.
   - Delete/deprecate `minute-main/packages/*` placeholders.

3. **Boundary Enforcement:**
   - Ensure `TenantConfig` and Module Registry types live in `packages/core`.
   - Ensure UI tokens and primitives live in `packages/ui`.
   - `minute-main` should only contain social-care specific logic, templates, and routes.

**Exit:** Repo structure matches the architecture diagram; `minute-main` imports from root packages; no duplicate "core" or "ui" folders inside `minute-main`.

### Phase 22 — Task Management Module

#### Phase 22A — Backend task extraction & Planner integration

- **Objective:** Structured task extraction and management with Planner sync.
- **Write scope:** `common/database/postgres_models.py`, `backend/api/routes/tasks.py`, `worker/task_extractor.py`, `common/services/msgraph_client.py`. Frontend is **read-only**.
- **Dependencies:** Phase 16B module flags.
- **Actions:**
  1. Add `tasks` JSONB column to `Minute` model (or new `Task` table if complex queries needed) via migration.
  2. Implement LLM task extraction step in `worker/` to parse actions into structured data (owner, due date, description).
  3. Enhance `MSGraphClient` to support creating Planner tasks with rich metadata and returning IDs.
  4. Add API `GET /minutes/{id}/tasks` and `PATCH /minutes/{id}/tasks` to update task status/details.
- **Exit:** Tasks are extracted as structured data; API supports CRUD; Planner integration handles rich tasks.

_Status 23 Nov 2025:_ `minute_task` table, SQLModel, and `/minutes/{id}/tasks` API endpoints are live. Worker exports now call `TaskExtractionService` to persist structured tasks and fan-out to Microsoft Planner using the tenant's Planner config. Remaining work: upgrade extraction from regex heuristics to the planned LLM prompt set, enrich owner/due-date inference with case metadata, and expose Planner sync state/overrides.

#### Phase 22B — Frontend task UI & module

- **Objective:** Dedicated task management UI and Planner export interactions.
- **Write scope:** `frontend/lib/modules.ts`, `frontend/app/tasks/`, `frontend/components/minutes/`. Backend is **read-only**.
- **Dependencies:** Phase 22A API.
- **Actions:**
  1. Register "Tasks" module in `frontend/lib/modules.ts`.
  2. Build "Tasks" tab in Minute view to list/edit extracted tasks.
  3. Implement "Push to Planner" button that sends structured tasks and updates UI with Planner links.
  4. (Optional) Global "My Tasks" page if `Task` table was chosen in 22A.
- **Exit:** Users can review/edit tasks before export; Planner export is granular; Tasks module appears in nav if enabled.

### Phase 23 — Cross-Platform Mobile Maturity

- [x] **Phase 23A: Mobile Core/State** (Abstract offline queue logic from Dexie to shared adapter; support RN-compatible storage) and Mobile (AsyncStorage/MMKV).
- **Write scope:** Refactor `frontend/lib/offline-queue.ts` into a shared adapter pattern; move core types to `common/types.ts` (if shared package exists) or ensure portability. UI components **read-only**.
- **Dependencies:** Phase 18A shared UI.
- **Actions:**
  1. Define `OfflineStorage` interface.
  2. Implement `WebOfflineStorage` (wrapping existing Dexie logic) and `MobileOfflineStorage` (stub for RN).
  3. Refactor `useOfflineQueue` hook to use the injected storage adapter.
- **Exit:** Offline logic is decoupled from browser-specific APIs; web app functions unchanged.

#### Phase 23B — Mobile UI implementation

- [x] **Phase 23B: Mobile UI Implementation** (Expo app, Capture screen, Offline Sync)

- **Objective:** Build functional Capture and Transcription screens in RN shell.
- **Write scope:** `apps/mobile/`. Web app **read-only**.
- **Dependencies:** Phase 23A shared logic, Phase 18B shell.
- **Actions:**
  1. Implement `CaptureScreen` using `expo-av` and shared UI tokens.
  2. Implement `TranscriptionListScreen` fetching from API.
  3. Wire up `MobileOfflineStorage` to handle offline recordings.
  4. Add background upload task (using `expo-background-fetch` or similar).
- **Exit:** Mobile app can record, list transcriptions, and sync offline data; matches PWA feature set.

### Phase 24 — Resilience & Error Handling

#### Phase 24A — Frontend Resilience

- **Objective:** Improve user experience during partial outages or network failures.
- **Write scope:** `frontend/app/`, `frontend/components/ui/`, `frontend/lib/api/`. Backend is **read-only**.
- **Dependencies:** Phase 16C module flags (to degrade gracefully).
- **Actions:**
  1. Implement global `ErrorBoundary` components wrapping main routes.
  2. Add manual "Retry" buttons to `useQuery` error states (currently just shows text).
  3. Add "Offline Mode" banner when `navigator.onLine` is false or API is unreachable.
  4. Implement "Degraded Mode" UI where disabled/failing modules are hidden or grayed out instead of crashing the page.
- **Exit:** UI handles 404/500 errors gracefully; users can retry actions; offline state is clear.

#### Phase 24B — Backend Circuit Breakers

- **Objective:** Prevent cascading failures and provide health status for dependencies.
- **Write scope:** `backend/api/dependencies/`, `common/services/`. Frontend is **read-only**.
- **Dependencies:** Phase 19A telemetry.
- **Actions:**
  1. Implement circuit breaker pattern for external calls (Azure Speech, LLM, Graph).
  2. Add detailed health checks (`/health/detailed`) reporting status of downstream services.
  3. Return "Degraded" status in config/health endpoints if non-critical services are down.
- **Exit:** Backend fails fast on external outages; health endpoints reflect dependency status.

### Phase 25 — Advanced Analytics & Insights

#### Phase 25A — Backend Insights Aggregation

- **Objective:** Calculate and serve usage insights (time saved, top topics).
- **Write scope:** `worker/analytics.py`, `backend/api/routes/insights.py`, `common/database/postgres_models.py`. Frontend is **read-only**.
- **Dependencies:** Phase 19A telemetry.
- **Actions:**
  1. Create aggregation jobs (SQL or Pandas in worker) to calculate "Time Saved" (audio duration vs manual typing est).
  2. Implement "Topic Trends" extraction from minute summaries.
  3. Add `/api/insights` endpoints to serve aggregated data per tenant/domain.
- **Exit:** API serves calculated insights; aggregation jobs run on schedule.

#### Phase 25B — Frontend Insights Module

- **Objective:** Visualize insights for users/admins.
- **Write scope:** `frontend/app/insights/`, `frontend/components/charts/`. Backend is \*\*read-only`.

```
  1. Register "Insights" module.
  2. Implement "Dashboard" view with charts (using Recharts or Visx) showing usage trends and time saved.
  3. Add "My Impact" widget to Home page.
- **Exit:** Users can see value metrics; Admins can see adoption trends.

### Phase 26 — Design System 2.0 & Premium Shell

#### Phase 26A — Core App Shell & Motion
- **Objective:** Create a responsive, app-like shell with seamless transitions (inspired by Magic Notes).
- **Write scope:** `frontend/components/layout/`, `frontend/app/template.tsx`, `next.config.js`. Backend is **read-only**.
- **Dependencies:** Phase 14 (Next.js 15).
- **Actions:**
  1. Enable `experimental: { viewTransition: true }` in `next.config.js`.
  2. Create `AppShell` component:
     - **Desktop:** Collapsible Sidebar with "Glass" aesthetic.
     - **Mobile:** Bottom Navigation Bar with floating "Record" action button.
  3. Implement `template.tsx` using Framer Motion for smooth "push/pop" page transitions.
  4. Refactor `Header` to be a transparent, blur-backed overlay.
- **Exit:** App feels like a native mobile app; navigation is responsive; page transitions are smooth.

#### Phase 26B — Premium UI Kit (Magic UI)
- **Objective:** Elevate the visual design to match "Apple/Google" premium standards.
- **Write scope:** `frontend/app/globals.css`, `frontend/components/ui/`. Backend is **read-only**.
- **Dependencies:** Phase 26A.
- **Actions:**
  1. Upgrade `globals.css` with "Magic UI" tokens:
     - **Cards:** Clean white/dark backgrounds, soft diffuse shadows (`box-shadow: 0 4px 24px rgba(0,0,0,0.06)`).
     - **Typography:** Inter (Body) + Outfit (Headings), optimized for readability.
  2. Create `RecordingCard` component: prominent status indicator, waveform visualization, and "Save/Pause" controls.
  3. Create `SplitView` component for Desktop: Transcript on left, "Edit with AI" sidebar on right.
  4. Style `Sonner` toasts to look like native OS notifications.
- **Exit:** UI matches the "Magic Notes" aesthetic; interactions are fluid.

### Phase 27 — Adaptive UX Engine

#### Phase 27A — Context Engine & Tabs
- **Objective:** Instantly adapt the UI based on user role and content type.
- **Write scope:** `frontend/providers/UserPersonaProvider.tsx`, `frontend/components/layout/`. Backend is **read-only**.
- **Dependencies:** Phase 26A.
- **Actions:**
  1. Create `UserPersonaProvider` to manage `currentPersona` (Social Worker, Manager).
  2. Implement "Contextual Tabs" for Minute view (as seen in Magic Notes):
     - **Tabs:** "General", "Care Assessment", "Supervision", "Care Review".
  3. Implement "One-Tap Mode Switch": Toggle between "In-Person" and "Online" recording modes.
- **Exit:** App adapts navigation and layout based on logged-in user role and task.

#### Phase 27B — Role-Specific Dashboards
- **Objective:** Provide tailored home screens for different user needs.
- **Write scope:** `frontend/app/page.tsx`, `frontend/components/dashboards/`. Backend is **read-only**.
- **Dependencies:** Phase 27A.
- **Actions:**
  1. Create `DashboardSocialWorker`:
     - **Focus:** "Recent Meetings" (Card list), "Quick Record" (Floating button).
  2. Create `DashboardManager`:
     - **Focus:** "Team Activity" (Charts), "Flagged Reviews".
  3. Update `app/page.tsx` to render the correct dashboard component.
- **Exit:** Social workers see tools; Managers see insights; seamless switching.

### Phase 28 — Recording Studio 2.0 (Magic Notes–inspired)

**Objective:** Upgrade capture UX on web and mobile to match (and exceed) the simplicity of the Magic Notes recording experience while keeping the offline‑first guarantees we already have.

Actions

1. **Waveform & status indicators**
   - Add real‑time waveform visualisation and clear “Recording / Paused / Saved” states to `/capture` and the main web recording flows.
   - Ensure offline/online badges are consistent with the journeys in `docs/user_journeys.md` (Record → Keep safe → Use later).
2. **Mode selector & consent**
   - Introduce an explicit “In person” vs “Online or hybrid” chooser before recording (modal style), with a short “Get permission before recording” note and optional consent capture.
   - Persist chosen mode on the recording/minute so templates and analytics can distinguish in‑person vs virtual contacts.
3. **Quick actions on home**
   - On the dashboard, add prominent cards for “Create report”, “Record”, and “Upload audio” that mirror the Magic Notes layout but use our premium theming.
   - On mobile, add a floating “Quick record” button or bottom‑nav primary action.
4. **Upload flow**
   - Refine the “Upload audio” journey to feel as integrated as live recording (same metadata form, status chips, and outcomes).

Exit: A social worker can see at a glance whether the app is recording, paused, or saved; the capture flows feel deliberate and calm on both phone and laptop; in‑person vs virtual meetings are clearly labelled throughout.

### Phase 29 — AI Writing Assistant & Source Check

**Objective:** Provide an inline AI assistant that helps practitioners tidy and adapt text while keeping a strong link back to evidence in the transcript.

Actions

1. **Edit with AI sidebar**
   - Add a persistent “Edit with AI” sidebar to the minute editor with quick actions (change writing style, fix spelling, shorten/expand, simplify language).
   - Use a cost‑aware model mix (gpt‑4o‑mini by default, with a fast vs premium option) and enforce token budgets per tenant/domain.
2. **Free‑form prompt box**
   - Allow the worker to describe a change (“Make this section more strengths‑based”, “Rewrite in plain English”), with responses previewed before being applied to the document.
3. **Source check (beta)**
   - Implement an optional “Source check” button for a paragraph or section that:
     - Retrieves candidate transcript segments by timestamp/template anchors.
     - Asks a verification model to confirm whether the statement is supported, partially supported, or unsupported.
     - Surfaces results inline with clear, non‑legalistic language.
4. **Governance controls**
   - Log all AI edits and source checks in the audit trail; allow tenants to enable/disable or limit these features by role/domain.

Exit: Practitioners can safely lean on AI to tidy and adapt text without losing sight of the underlying conversation; QA can quickly check the evidencing quality of key sections.

### Phase 30 — Content Organisation (Tabs & Tags)

**Objective:** Organise content so long notes stay navigable, and cross‑meeting retrieval (by tag, template, or topic) becomes effortless.

Actions

1. **Contextual tabs**
   - Drive the tab structure in the minute editor (e.g., Summary, Recording & transcript, Care assessment, Supervision, Care review) from `ServiceDomainTemplate` metadata.
   - Allow templates to declare their own domain‑specific tabs and default landing tab per role (worker vs manager).
2. **Tagging system**
   - Add a `tags` JSONB field to `Minute` (or a dedicated `Tag` table if needed) and UI for adding/removing tags with autocomplete (e.g., “transition”, “placement breakdown”, “domestic abuse”).
   - Expose filters by tag, template, and domain on the “My notes” and manager review screens.
3. **List and search integration**
   - Ensure tags appear in the note list chips and search facets; allow combining tag filters with date, case, and domain filters.

Exit: Long notes are split into meaningful sections; social workers and managers can quickly jump to relevant parts and retrieve notes by topic or tag.

- **Status 2025-11-25:** Tabs now come from template metadata with persona-specific defaults; tag autocomplete + filters shipped on “My notes”; exports include tags. Remaining: none.

### Phase 31 — Config System & Module Registry (Universal App Foundation)

**Objective:** Finalise the universal module/tenant configuration system so Minute becomes one set of feature modules within a reusable council app platform.

Actions

1. **Tenant schema and versioning**
   - Extend `tenant.schema.json` with module/navigation/feature flag definitions and a version field.
   - Add CI validation that checks all tenant configs against the schema and blocks merges on breaking changes.
2. **Module manifests & API**
   - Introduce a `ModuleManifest` type describing routes, permissions, icons, and dependencies for each module (Transcription, Minutes, Tasks, Insights, Admin).
   - Expose `/api/modules` so both the existing Next app and the universal shells (`apps/web`, `apps/mobile`) can render nav from the same source of truth.
3. **Config‑driven navigation**
   - Replace hard‑coded navigation (e.g., in Sidebar) with a config‑driven renderer that filters modules by tenant, domain, and role.
   - Ensure tests cover module enable/disable, per‑role nav differences, and backwards compatibility with existing routes.

Exit: Adding a new department or module is primarily a config/schema change plus templates, not a series of hard‑coded nav and routing edits; both Minute and the universal app shells consume the same module registry.

### Phase 32 — Design Tokens & Theme Engine

**Objective:** Strengthen the design system so multiple councils and departments can share accessible tokens and lightweight branding, and the universal shells inherit the same look‑and‑feel.

Actions

1. **Token source of truth**
   - Consolidate color, typography, spacing, and motion tokens into a `tokens.json` (or equivalent) and generate CSS variables (and RN equivalents) from it.
   - Add tests to guarantee WCAG 2.2 AA contrast for core token pairs and minimum font sizes.
2. **Tenant theme overrides**
   - Allow tenant configs to specify logos and limited accent choices, with automatic contrast checking.
   - Provide a preview mode for admins to test a new theme before promoting it.
3. **Docs and examples**
   - Update design system documentation to show how tokens map to council branding, with examples for WCC/RBKC and a “vanilla” council.

Exit: All UI surfaces (Minute web app, universal web shell, mobile shell) share the same accessible token base, making it cheap to support new councils or adjust branding without redesigning entire flows.

### Phase 33 — Advanced Offline & Sync

**Objective:** Generalise offline support so it covers recordings, notes, tasks, and other future operations, with clear conflict handling and user feedback.

Actions

1. **Unified offline engine**
   - Evolve the offline queue into a generic engine that can handle multiple operation types (recordings, note edits, task updates), with per‑operation retry and backoff policies.
   - Provide a small, consistent status component (e.g., “1 item pending”, “Sync complete”) reusable across pages.
2. **Background sync & notifications**
   - Use service worker `sync` where supported to resume uploads in the background.
   - Optionally send push notifications (or email) when long‑running jobs complete (“Your note is ready to review”).
3. **Conflict resolution**
   - Design simple flows for conflict scenarios (e.g., edits made both offline and online), starting with “pick latest” and moving to merge strategies where safe.

Exit: Offline behaviour feels predictable and robust; social workers trust that “Record → Keep safe → Use later” always holds, even during device restarts or network flakiness.

### Phase 34 — Cross‑Platform UI Kit (RN Web Preparation)

**Objective:** Extract a shared UI kit that can power both Next (web) and React Native (mobile) without duplicating styling or behaviour.

Actions

1. **Shared primitives**
   - Move low‑level components (`Button`, `Card`, `Badge`, layout primitives) into a cross‑platform‑friendly location (e.g., `frontend/components/primitives/` or `packages/ui`), using token‑based styles only.
   - Avoid DOM‑only APIs in shared primitives; provide RN‑Web shims where needed.
2. **Icon strategy**
   - Introduce a small icon registry abstraction instead of importing `lucide-react` directly everywhere; provide a compatible RN implementation.
3. **Stories & visual tests**
   - Add stories or a simple demo page to exercise shared primitives, catching regressions in CI.

Exit: Most UI work happens on reusable primitives that function across web and RN‑Web; adding new screens does not require re‑implementing components per platform.

### Phase 35 — Mobile Shell (React Native / Expo)

**Objective:** Deliver a first‑class mobile app that consumes the same module registry and config as the web app, giving social workers a high‑quality, native‑feeling experience.

Actions

1. **Expo shell based on modules**
   - Extend the existing `apps/mobile` shell to authenticate against Entra, fetch tenant config and module manifests, and render a bottom‑nav layout with module‑driven screens.
2. **Core screens**
   - Implement `CaptureScreen`, `TranscriptionListScreen`, and a lightweight `NoteDetailScreen` aligned with journeys SW1–SW3.
   - Reuse shared primitives and tokens from Phase 34; avoid mobile‑only styles where possible.
3. **Mobile offline storage**
   - Use SQLite/AsyncStorage (or MMKV) for the offline queue on mobile, reusing the unified offline engine behaviour and statuses.

Exit: Social workers can live primarily in the mobile app while keeping the laptop for deep editing and exports; the same module registry and config drive both.

### Phase 36 — Admin Console (Config & Modules)

**Objective:** Give councils a safe, auditable way to configure tenants, departments, templates, and modules without requiring code changes.

Actions

1. **Config management UI**
   - Extend the admin console to present tenant configs as JSON Schema–driven forms with diff views and version history.
   - Support draft, review, and approval flows before changes go live.
2. **Module dashboard**
   - Provide a matrix view of modules vs tenants/departments, with toggle controls gated by appropriate permissions.
   - Show real‑time preview of nav changes for the selected role/domain.

Exit: Digital and IT teams can manage configuration and modules through a web UI layered on top of the same schema and registry, with full audit coverage.

### Phase 37 — Telemetry & Adoption Dashboards

**Objective:** Make it easy to see whether the app is delivering value (time saved, adoption, offline health) and guide future roadmap decisions.

Actions

1. **Structured telemetry events**
   - Emit events per module/action (e.g., `recording_started`, `note_approved`, `export_sharepoint_success`) with tenant/domain/role context.
   - Store in a time‑series store or warehouse suitable for dashboarding.
2. **Adoption dashboards**
   - Build dashboards for admins and product leads showing usage patterns, offline queue health, task completion rates, and feature adoption by role/domain.
   - Link from admin console and provide export options (CSV/PDF).

Exit: Councils and the product team can see where the app is used heavily, which features land well, and where training or UX changes are needed.

### Phase 38 — Collaboration & Real‑Time

**Objective:** Support collaborative editing and discussion around notes without losing auditability or simplicity.

Actions

1. **Shared editing**
   - Add optional real‑time co‑editing to the minute editor using CRDTs (e.g., yjs) and WebSocket sync, with presence indicators for who is viewing/editing.
2. **Comments and discussions**
   - Introduce threaded comments at paragraph or section level, with email/push notifications for mentions or replies.
   - Ensure comments are included in the audit trail and can be exported for QA.

Exit: Multiple practitioners can safely work on the same note without overwriting each other; managers and QA can leave targeted feedback inside the context of the note.

### Phase 39 — Advanced Search (Full‑Text + Semantic)

**Objective:** Make it effortless to find the right note, snippet, or topic across many meetings, while respecting tenancy and domain boundaries.

Actions

1. **Full‑text search**
   - Index transcripts and minutes in a search engine (e.g., Azure Cognitive Search) with filters for tenant, domain, case, template, and tags.
   - Add a global search bar (keyboard shortcut friendly) and search results view with highlighted matches.
2. **Semantic search**
   - Generate embeddings for `Minute.summary` and key transcript segments; store in a vector index scoped by tenant/domain.
   - Provide semantic search endpoints and UI that suggest related notes or similar cases while keeping PII boundaries intact.

Exit: Social workers, managers, and QA can quickly retrieve relevant notes and evidence even in large deployments; search remains safe and tenant‑scoped.

### Phase 40 — Compliance Tools

**Objective:** Provide tooling that helps councils meet DPIA and audit requirements without manual spreadsheet work.

Actions

1. **Audit log viewer**
   - Surface a UI over the existing `AuditEvent` table with filters by user, resource, action, and date range.
   - Allow exports to CSV/JSON for DPIA reviews and investigations.
2. **Retention automation reporting**
   - Extend retention jobs to produce periodic summary reports (e.g., “N recordings aged out this week”) and send to admins.
   - Provide dry‑run and grace‑period modes where deletions are queued for review.

Exit: Councils can demonstrate compliance and respond to investigations using built‑in tools rather than ad‑hoc queries and manual collation.

### Phase 41 — Performance & Perceived Speed

**Objective:** Keep the app feeling fast and responsive even as we add modules, councils, and features.

Actions

1. **Bundle optimisation**
   - Use bundle analysis to identify heavy modules; implement route‑level code splitting and lazy‑loading where appropriate.
   - Ensure the initial load for key flows (home, new recording, note detail) stays within agreed budgets.
2. **Asset optimisation**
   - Optimise images and static assets (e.g., use WebP/AVIF and `next/image` equivalents where applicable).
   - Tune loading skeletons and transitions so perceived performance stays high, especially on low‑spec council devices.

Exit: The universal council app continues to feel “Apple/Google‑grade” even as it grows; social workers on older devices are not penalised by new features.

## Cross-domain Reuse Strategy (future-proofing)

### Framework Upgrade Log (per AGENTS rule 32)
- 2025-11-21: Frontend bumped to Next.js 15.1 + React 19 (App Router) with ESLint 9 compatibility; backend on FastAPI 0.120.x + Pydantic 2.11; Ray 2.47 with namespace + register timeout hardening. Tests: npm install (frontend) and pytest smoke (backend). Sources: Next.js 15.1 release notes, React 19 support statements, FastAPI 0.120 changelog. citeturn0search4turn0search0
- Validation checklist post-upgrade: ensure App Router layouts use `ReactNode` props, route params typed as plain objects, rebuild OpenAPI client after API changes, run `npm run build` (or `next build --no-lint` locally) plus backend pytest smoke; resolve peer warnings for React 19 asap.
- Added UI polish tasks: skeleton loaders for transcription/summary tabs, timeline-style evidence list, export toasts, and navigation chips to maintain premium branding while improving perceived performance.

- Domain registry in DB drives: available templates, SharePoint paths, retention, feature flags, lexicons. No code changes to add a domain—just config + templates.
- Frontend theme and copy driven by domain config pulled at login; avoid domain-specific components.
- Export destinations and task routing are per domain; Planner buckets configurable.

## Immediate Next Tasks (day 0–5)

1. Approve design decisions (principles above).
2. Model changes: author Alembic migration for org/domain/role/case tables; update API/worker models.
3. Implement Entra token validation and hook into frontend MSAL.
4. Sketch PWA/service worker baseline and offline queue library.
5. Draft first two social-care templates (home_visit, strategy_discussion) and wire domain filtering.

## Verification Checklist before UAT

- Entra login works end-to-end; role/domain claims enforced on lists and exports.
- Offline capture: record offline, reconnect, transcript generated with correct case/domain, minutes produced.
- Diarization: relabel UI updates stored transcript; citations in minutes reflect updated labels.
- Exports: docx/pdf generated; SharePoint upload and Planner task creation succeed with audit entries.
- Retention jobs remove old audio; audit trail shows access events.

---

Maintain this file as the single source roadmap; update per phase completion with links to PRs, test evidence, and open risks.
```
