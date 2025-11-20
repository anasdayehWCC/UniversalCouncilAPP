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
1) Read AGENTS and Roadmap before edits; obey local-only fake-JWT and dev-preview gating.
2) Always web-search when uncertain or selecting services/models/policies (AGENTS rule 26).
3) Work phase-by-phase (see “Plan of Work”). After each phase:
   - Update **Progress** checklist (with timestamps).
   - Run required tests; fix failures before advancing.
   - Update `CHANGELOG.md` per AGENTS rule 27.
4) Use compaction-friendly notes: summarise context into this file’s Progress section after major hops or >4h runtime.
5) Spillover tasks (>24h) get a “handover” summary appended to Progress.

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

## Concrete Steps & Commands (per phase, repeatable)
- Install deps: `docker compose up --build` (local stack), `npm install`/`npm run dev` (frontend), `npm run openapi-ts` (regenerate client), `make test` (backend/worker tests).
- Lint/format: follow repo defaults (`ruff`, `npm lint`, `npm format` if present).
- Frontend preview: `ENVIRONMENT=local npm run dev` with dev JWT; `DEV_PREVIEW_MODE=on` only in local.
- Migrations: create Alembic revision (`alembic revision --autogenerate -m "<msg>"`), apply locally `alembic upgrade head`.
- Tests per change: backend unit, worker integration, Playwright for offline/relabel/export as added.

## Progress (update inline)
- [ ] Phase 1 Identity/RBAC
- [ ] Phase 1.5 Premium UI & Council Theming
- [ ] Phase 2 Infra/Secrets
- [ ] Phase 3 Case Context
- [ ] Phase 4 Offline/PWA + fast/economy toggle
- [ ] Phase 5 Diarization quality/relabel
- [ ] Phase 6 Templates (children/adults)
- [ ] Phase 7 Evidence UX
- [ ] Phase 8 Exports + M365
- [ ] Phase 9 Security/Privacy/Governance
- [ ] Phase 10 Observability/SLOs
- [ ] Phase 11 Scale/Cost
- [ ] Phase 12 Testing gates
- [ ] Phase 13 IaC/Pipelines
- [ ] Phase 14 Pilot/Rollout

## Validation & Acceptance
- Per-phase exit criteria in Roadmap; all tests green; citations present when web lookups inform decisions; CHANGELOG updated for every change.

## Blockers & Decisions Log
- Record any blocking issues, proposed mitigations, and owner; keep minimal to preserve compaction.
