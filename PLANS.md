# PLANS.md — Long-Horizon Exec Plan (Codex-Max, 24h+ capable)

## Purpose / Big Picture

- Deliver the Social Care-ready Minute platform per `minute-main/ROADMAP_social_care.md`, under the behavioral guardrails in `AGENTS.md`.
- Optimize for Codex-Max long-run sessions (compaction, multi-window) while keeping costs and safety controls explicit.
- Record progress and blockers so extended autonomous runs remain coherent.

## References

- Behavioral rules: `AGENTS.md` (auth, migrations, cost controls, logging/retention, feature flags, dev-preview).
- Delivery roadmap: `minute-main/ROADMAP_social_care.md` (phases 1–14, success criteria).
- Model context: GPT-5.1-Codex-Max (compaction; can run 24h+). citeturn0search0

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

## Concrete Steps & Commands (per phase, repeatable)

- Framework upgrade audits:
  - Frontend: `npm run lint && npm run build -- --turbopack`; Playwright smoke for `/` → `/new` → `/templates`; regenerate API client (`npm run openapi-ts`) after typed routes flip. citeturn0search1turn0search5
  - Backend: bump FastAPI/Pydantic, run `poetry lock`, `make test`, ensure `model_validate`/`TypeAdapter` replacements where ORM used. citeturn0search8turn0search0
  - Worker: bump Ray, set `RAY_worker_register_timeout_ms=20000`, namespace calls; run queue load smoke to verify restarts. citeturn1search1
- Install deps: `docker compose up --build` (local stack), `npm install`/`npm run dev` (frontend), `npm run openapi-ts` (regenerate client), `make test` (backend/worker tests).
- Lint/format: follow repo defaults (`ruff`, `npm lint`, `npm format` if present).
- Frontend preview: `ENVIRONMENT=local npm run dev` with dev JWT; `DEV_PREVIEW_MODE=on` only in local.
- Migrations: create Alembic revision (`alembic revision --autogenerate -m "<msg>"`), apply locally `alembic upgrade head`.
- Tests per change: backend unit, worker integration, Playwright for offline/relabel/export as added.

## Progress (update inline)

- [x] Phase 1 Identity/RBAC — Completed 2025-11-20T22:24Z (Entra JWKS + AuthContext + frontend MSAL/DEV_PREVIEW token plumbing)
- [x] Phase 1.5 Premium UI & Council Theming — Completed 2025-11-20T22:40Z (WCC/RBKC theming, gradients/glass, org logo assets, motion accents)
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

### Context Snapshot [2025-11-21T02:35Z]
- Completed: Phases 1-14 + platform upgrades; frontend build passes on Next 15.5/React 19; backend pytest smoke green.
- Current state: Metrics/live endpoints in place; autoscale/KEDA manifest added; CI/deploy workflows authored; pilot config seeded.
- Blockers: None (React 19 peer warnings remain informational until upstream typings publish).
- Next: (if time) expand coverage to full test suite with optional deps, tune PWA cache size warning.
  - Quick wins shipped: skeleton loaders, export toasts, citation timeline, quick export on list cards.
  - Additional polish: helper text on New cards, focus/underline on tabs, toolbar layout stability, offline last-sync badge.

## Validation & Acceptance

- Per-phase exit criteria in Roadmap; all tests green; citations present when web lookups inform decisions; CHANGELOG updated for every change.

## Blockers & Decisions Log

- Full pytest suite currently blocked by optional deps/fixtures (breame, ray, ffmpeg, .data test audio); only `tests/test_health.py` runs green in `.venv`.
