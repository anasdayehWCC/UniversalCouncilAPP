# Minute Platform Architecture

_Phase 15A deliverable — authored 2025-11-21_

## 1. Executive Summary

- Single codebase for bi-borough social care (extends to other councils/domains) running **Next.js (App Router) frontend**, **FastAPI backend**, and **Ray-based worker**.
- Core flows: offline/online audio capture → queue → STT (Azure/AWS) → dialogue with diarization → LLM minute generation via domain templates → exports (docx/pdf, SharePoint/Planner hooks) with audit, retention, and observability baked in.
- Configuration-first: tenant + service-domain configs (`config/*.yaml` via `common/config/loader.py`) inform module/navigation selection (`frontend/lib/modules.ts`) and domain assets/templates.
- Governance: audit trail, retention jobs, security headers/HSTS, rate limits, org/domain scoping enforced in API; metrics via Prometheus endpoints; KEDA autoscale manifests available.
- Roadmap alignment: Phases 15–19 focus on documentation alignment, config/schema hardening, module surfacing, design-system accessibility, cross-platform shell, and governance/admin.

## 2. Assumptions & Open Questions

- Identity: Entra ID already wired; confirm production tenant IDs and audience/issuer values per environment.
- M365: SharePoint/Planner integration exists in worker exporters—validate managed identity vs app secret for production.
- Config promotion: today configs are files; need decision on promotion path (PR-based vs admin UI) and version tagging (planned in Phase 16A/19B).
- Module set: current registry includes transcription/minutes/notes/admin; confirm future “tasks/insights” modules and permissions taxonomy.
- Mobile: PWA exists; RN/Expo shell planned—confirm device management requirements and offline storage policy for mobile (Phase 18B).
- Performance budgets: agree TTI and bundle size budgets to guide token/design-system choices (Phase 17A).

## 3. Capability Map

- **Identity & Context**: Entra JWT validation; org/service-domain/role set on request context; frontend MSAL + dev preview.
- **Capture**: Web/PWA `/capture` with Dexie offline queue (`frontend/lib/db.ts`, `/offline-queue.ts`), background sync, fast vs economy path flag.
- **Transcription**: Azure Speech (realtime + batch) and AWS adapters (`common/services/transcription_services/*`), diarization, phrase lists, feedback endpoints.
- **Minutes**: Template-driven generation (`common/templates/*`, including `social_care/`), evidence timestamp links, speaker relabel UI.
- **Exports**: docx/pdf exporters + SharePoint/Planner via `common/services/export_handler_service.py`, worker exporters.
- **Security/Gov**: Audit middleware/table, retention policies, security headers/HSTS, origin checks, rate limits.
- **Observability**: JSON logging with trace IDs, Prom metrics `/metrics`, health endpoints, trace propagation to worker; KEDA sample for autoscale.
- **Config & Modules**: Config loader/validator (`common/config/loader.py`, tests in `tests/test_config_*`); module registry on frontend (`frontend/lib/modules.ts`) with tenant-aware navigation.

## 4. Architecture Overview

- Clients: Next.js App Router web/PWA; offline queue via Dexie + service worker (`frontend/public/sw.js`).
- API layer: FastAPI (`backend/api/*`) handling auth, case/minute/transcription/export, config endpoint `/config/{tenant_id}`.
- Worker: Ray (`worker/worker_service.py`) processing STT, LLM, exports; interacts with storage/queues.
- Data & Infra: Postgres (models in `common/database/postgres_models.py`), storage adapters (S3/Azure in `common/services/storage_services/`), queue adapters (SQS/Azure Service Bus).
- Control planes: Metrics and health endpoints; CI/CD with GitHub Actions; Terraform/KEDA samples in `infra/`.
- Reference diagram: `minute_architecture_diagram.png` (update when infra changes).

ASCII flow (current):
```
Web/PWA (capture/offline) ──► API (/recordings, /transcriptions, /minutes)
  │      ▲                          │
  │      │ offline sync queue       │
  ▼      └───────────────▶ Storage (blob) ─▶ Queue (SQS/ASB) ─▶ Worker (Ray)
  Replay/export UI ◄────── Metrics/Audit ◄─────────────── DB (Postgres)
```

## 5. Tenancy & Config

- Source: `config/*.yaml` (e.g., `config/pilot_children.yaml`) loaded via `common/config/loader.py` and validated by Pydantic models in `common/config/models.py`; fallback config in `frontend/lib/config/fallback.ts`.
- Frontend consumption: `frontend/lib/config/client.ts` fetches `/config/{tenant_id}`; `frontend/lib/modules.ts` filters modules by tenant/service_domain.
- Next steps (Phase 16): add schema/version tags, feature flags, retention defaults, nav metadata, and CI enforcement; surface entitlements in API responses without breaking existing clients.

## 6. Plugin / Module Interface

- Current registry: transcription, minutes, notes, admin declared in `frontend/lib/modules.ts`.
- Modules expose routes and optional permissions; filtering by service domain already supported.
- Gaps: no backend module contracts; nav/routes not fully config-driven; need module metadata (labels/icons/permissions) and flag enforcement (Phase 16B/16C).

## 7. Accessibility & Design System

- Present: theming via `frontend/components/theme-provider.tsx` and `frontend/components/org-theme-setter.tsx`; Tailwind tokens in `frontend/app/globals.css`.
- Gaps: centralized token set with WCAG 2.2 AA guarantees, lint/a11y CI, RN-Web alignment (to be delivered in Phase 17A/17B).

## 8. Security, Privacy, Compliance

- Controls in place: audit middleware/table, retention policies, security headers + HSTS, origin checks, per-path rate limits, PII minimisation in case context, signed URLs for evidence playback, dev-preview safeguards.
- Identity: Entra JWT verification with org/domain scoping; dev fake-JWT only in local with guard rails.
- Data residency: UK-only regions enforced in infra scripts; storage lifecycle for recordings.

## 9. Delivery & Governance

- CI: GitHub Actions for lint/test/build/deploy; config validation workflow; blue/green deploy workflow for ACA.
- IaC: Terraform scaffolding + KEDA autoscale samples; guard script for UK regions.
- Change control: changelog required per AGENTS; audit events for sensitive operations; feature flags handled via config and env.

## 10. Testing Strategy

- Existing: backend unit/integration (`tests/`), export/cost/security header tests, config loader tests, health check smoke; Playwright stub for exports.
- Needed: contract tests for module/flag enforcement (Phase 16B), nav/module toggling E2E (Phase 16C), a11y regression suite (Phase 17B), mobile shell smoke (Phase 18B).

## 11. Migration & Roadmap Crosswalk

- **Phase 15A (this doc)**: establish target architecture and open questions.
- **Phase 15B**: gap map in `docs/universal_council_app_foundations.md` with evidence and landing zone.
- **Phase 16**: config/schema hardening, backend surfacing, frontend nav/module consumption.
- **Phase 17**: tokenized design system + a11y gates.
- **Phase 18**: shared UI kit extraction and RN/Expo shell using the same config/module registry.
- **Phase 19**: module telemetry + admin console for config/versioning/audit.

## 12. References

- `docs/universal_council_app_foundations.md` (foundations/gaps)
- `minute_architecture_diagram.png` (to refresh when infra changes)
- `minute-main/ROADMAP_social_care.md` (phase detail) and `PLANS.md` (exec plan)
- Key code paths: `frontend/lib/modules.ts`, `frontend/lib/config/*`, `frontend/lib/db.ts`, `frontend/public/sw.js`, `backend/api/routes/config.py`, `common/services/*`, `worker/`
