# Universal Council App Foundations (Bi‑Borough & Beyond)

> Guiding document for evolving the current Minute-based solution into a reusable, configuration‑driven, universal council app without spawning “mini‑apps” or cloning the codebase per department or council.

## 1. Goals, Non‑Goals, Success Criteria

### 1.1 Goals
- Single shared platform for Westminster & RBKC (and future councils) that:
  - Serves multiple departments (Children’s, Adults, Housing, Transport, etc.) from one codebase.
  - Adapts behaviour and navigation based on **tenant + service domain + role**, not hard‑coded routes or forks.
  - Supports **Windows desktop (Edge/Chrome)** and **mobile (PWA + native RN shell)** with a consistent, accessible UX.
- Design system and layout are **accessibility‑first** (WCAG 2.2 AA), not branding‑first; theming is about readability, spacing, and focus states – not arbitrary colours.
- Foundation is **configurable and extensible** (config/flags/plugins) so new departments/features can be added mostly by config + templates instead of bespoke code.

### 1.2 Non‑Goals
- Not optimising backend internals (FastAPI, DB tuning) here beyond what is needed for front‑end assumptions.
- Not creating separate “apps” for each council/department; no repo forks or per‑council branches.
- Not designing every possible feature (e.g., full case management) – focus is on platform capabilities and composition.

### 1.3 Success criteria
- A new department (e.g., Housing) can be enabled by:
  - Adding a `config/<tenant>_<domain>.yaml` file.
  - Adding templates and module config – but **no new routes/components hard‑wired to that domain**.
- Social workers and managers on both councils see:
  - The same core IA and visual language.
  - Different tasks/templates/navigation **only where domain or role requires**.
- Adding a new functional area (e.g., “Tasks”) is done as a plugin module, not by editing every page.

---

## 2. Where We Are Today (Semantic Codebase View)

### 2.1 Strengths already in `minute-main`
- **Multi‑tenant domain model**: `Organisation`, `ServiceDomain`, `Role`, `UserOrgRole`, and `Case` exist and are wired through `Transcription`, `Minute`, `Recording`, retention policies, and audit events (`common/database/postgres_models.py`).
- **Service‑domain templates**: `ServiceDomainTemplate` mapping, social‑care templates in `common/templates/social_care/`, and a pilot config (`config/pilot_children.yaml`) already express “Children, Westminster” as configuration, not code.
- **Offline & PWA foundations**:
  - Dexie‑based offline queue (`frontend/lib/db.ts`, `frontend/lib/offline-queue.ts`) with background sync (`use-sync-manager.ts`).
  - Service worker built via Next.js/Workbox (`frontend/public/sw.js`), plus `/capture` flow and queued uploads.
- **Case context & PII**: `Case` table with encrypted DOB, `Transcription`/`Minute` link to `case_id` and `case_reference`, and `RetentionPolicy` + `AuditEvent` tables for governance.
- **Bi‑borough tailoring hooks**: `config/pilot_children.yaml` includes organisation, service_domain, templates, SharePoint paths, Planner details, and roles – a strong starting point for “config‑as‑tenant‑profile”.

### 2.2 Gaps vs universal‑app vision
- **Front‑end composition**:
  - Current Next.js app is largely built as a single monolith; routes are specific to transcription/minutes rather than generic “modules” mounted via config.
  - There is no pluggable module/registry concept in the live app (we only scaffolded one at repo root); the goal is to treat Minute as the **first feature pack** running inside the universal shell, not a separate product.
- **Role/domain‑aware IA**:
  - Navigation doesn’t yet adapt strongly by `service_domain` or `role`; we rely mostly on data scoping, not UX scoping.
- **Cross‑platform story**:
  - UX is optimised for browser; React Native / RN Web shells are not part of the deployed app yet.
- **Config governance**:
  - `config/pilot_children.yaml` is a single pilot profile, not a schema‑validated, versioned config system for all tenants/departments.
- **Design system**:
  - We use Tailwind/Next components but don’t yet have a shared, token‑driven design system across web + potential RN, with documented accessibility guarantees.

---

## 3. Foundational Design Principles

1. **Tenant/domain first, feature second**: The primary axes are Tenant (council) → ServiceDomain (Children, Adults, Housing…) → Role (SocialWorker, Manager, Admin). All modules must respect these axes in routing, data access, and visibility.
2. **Config > Code forks**: Differences between departments or councils should be represented in validated configuration (JSON/YAML, DB tables) rather than branching code, whenever possible.
3. **Plugins, not mini‑apps**: Each feature area (Transcription, Case Notes, Tasks, Insights) is a plugin module the shell mounts; plugins declare routes, permissions, and config hooks, but are delivered in a single app bundle.
4. **Accessibility as a hard constraint**: Design tokens and components must be provably at least WCAG 2.2 AA; we embrace token guardrails and linting, not “design by exception”. citeturn0search0turn0search2turn0search11
5. **Cross‑platform mindset**: Any new UI primitive must be expressible both in web (Next/RN Web) and mobile (React Native), to avoid divergence between “web version” and “mobile app”.
6. **Observability everywhere**: Modules and config changes must emit structured events/metrics so we can understand adoption and safety per tenant/domain.
7. **Avoid the twin pitfalls**: We must not (a) build a beautiful but **social‑care‑only** app that is hard to adapt for other departments, nor (b) build a purely **generic universal shell** that fails to meet social workers’ real needs; every feature should be both **social‑care‑tailored** and **config/module‑driven** so it can be reused.

---

## 8. Repository Layout & Consolidation Plan

### 8.1 Current state

- Root of repo:
  - `apps/web`, `apps/mobile` – thin shells that read from `packages/core/plugins/registry` and list modules.
  - `packages/core`, `packages/ui` – universal config/flags/plugins and UI tokens/components.
  - `docs/architecture.md` – canonical universal council app architecture.
- `minute-main/`:
  - Production **backend, worker, and Next.js frontend** for social care.
  - `minute-main/packages/core` and `minute-main/packages/ui` – legacy placeholders (now empty) kept only to avoid churn while we wire everything to the shared `packages/*` tree.
  - `minute-main/docs/*` – Minute-specific architecture, foundations, and journeys.

This means the “universal shell” scaffolding and the “real” app coexist; to avoid drift or copy‑pasting per department, we need a clear consolidation path.

### 8.2 Guiding decisions

1. **Minute-main is the canonical product codebase** (backend + social-care-first web UI).  
2. **Root `apps/*` and `packages/*` are universal-shell packages**, not a separate app to fork; they should eventually be consumed by `minute-main` rather than duplicated.  
3. **There must be exactly one architecture doc for the universal shell** (`docs/architecture.md`), with this file and `minute-main/docs/architecture.md` describing how Minute plugs into it.

### 8.3 Structural refactors (phased)

- **R1 — Package de-duplication**
  - Treat `packages/core` and `packages/ui` as the **single source of truth** for:
    - Tenant schema, flags, and plugin registry.
    - UI tokens and primitive components.
  - Update the Next.js frontend under `minute-main/frontend` to import from `packages/core` and `packages/ui` (via workspace aliases) instead of its own copies.
  - Once the imports are switched and tests pass, remove or reduce `minute-main/packages/core` and `minute-main/packages/ui` to thin re-exports or delete them entirely.

- **R2 — One module registry, many shells**
  - Ensure both:
    - `minute-main/frontend` (social-care app), and
    - `apps/web` / `apps/mobile` (universal shells)
    consume the same `packages/core/plugins/registry` and `TenantConfig` schema.
  - Keep `apps/web` and `apps/mobile` as minimal shells used for experiments and, later, for RN Web/native deployments; they should **never** reimplement business logic that already lives in `minute-main`.

- **R3 — Naming and docs alignment**
  - Keep the `minute-main` directory name for now (to avoid churn), but treat it in docs as **“Minute platform (social-care-first)”** rather than something that can never support other departments.
  - Rely on `TenantConfig` (org/service_domain/role) and module flags to switch from “Children’s social care” to future departments, instead of creating new top-level apps per domain.
  - If we later decide to rename `minute-main` (e.g., to `platform/`), capture that as a dedicated migration phase with CI and deploy checks.

### 8.4 How this supports our goals

- Social workers remain the first users: all concrete flows (capture, review, exports) are implemented in `minute-main` against real back-end services.  
- The universal shell packages (`packages/*`, `apps/*`, `docs/architecture.md`) stay **ahead of the curve** as design/architecture guides, while `minute-main` converges toward them instead of diverging.  
- Adding a new department later is primarily:
  - a new config file + templates,  
  - optional new feature modules,  
  - and UI copy changes driven by `TenantConfig` and the module registry—**not** a new app folder or a forked codebase.

---

## 4. Target Architecture for This App

### 4.1 Conceptual layering
```text
apps/
  web-shell     # Next.js/RN-Web shell for browsers
  mobile-shell  # RN app shell for iOS/Android
packages/
  domain/       # Organisation, ServiceDomain, Case, Minute, Transcription types
  config/       # Tenant + domain configs, flags, schema + validators
  plugins/      # Feature modules (transcription, notes, tasks, admin)
  ui/           # Token-driven components, layout primitives, typography
  infra-client/ # DAL adapters (REST/GraphQL, M365, storage)
backend/
  api/          # FastAPI, using same domain types; modules aligned with front-end plugins
  worker/       # Long-running jobs (transcription, exports, analytics)
```

The **current Minute backend and worker** already align reasonably with `domain/` and `infra-client/` responsibilities; the main missing pieces are a **pluginised front‑end shell** and a formal **config/flags package**.

### 4.2 Tenant & department configuration
- Move from ad‑hoc YAMLs like `config/pilot_children.yaml` to schema‑checked configs (building on `tenant.schema.json` and service‑domain tables):
  - Tenant‑level: organisation metadata, allowed service domains, default locale & time zone, and default modules.
  - Domain‑level: enabled templates, SharePoint/Planner paths, lexicon hints, and feature flags (e.g., enable offline capture, batch transcription, insights).
  - Role‑level: which modules and routes appear in navigation, which actions are enabled (e.g., managers can approve summaries, social workers cannot change retention).
- These configs live under `config/` and/or in dedicated DB tables with version tags, so changes are auditable and promotable through environments.

### 4.3 Plugin/module system for this app
- Each feature module is a self‑contained package exposing:
  - A set of routes (path + component) and menu items.
  - Required permissions (e.g., `transcription:read`, `minute:approve`).
  - Any DAL contracts it needs (e.g., `TranscriptionGateway`).
- The web shell reads the tenant config, determines which modules should be active for the current `(tenant, service_domain, role)`, and mounts only those routes.
- For existing features:
  - **Transcription module** wraps current flows: upload, capture, offline queue, transcript review, speaker relabel, feedback.
  - **Minutes module** wraps template selection, minute authoring, evidence views, and exports.
  - **Admin module** provides config editing for templates, service domains, retention policies, and role mapping (later).

### 4.4 UI & navigation model
- Replace ad‑hoc sidebar/header nav with a **navigation model derived from config**:
  - `NavigationItem = { path, label, moduleId, roles, serviceDomains }`.
  - In code, we filter by the current user’s roles + service_domain and by module enablement flags to render the final nav.
- Use a consistent layout skeleton for both desktop and mobile:
  - **Desktop**: persistent sidebar + top header; content area; “case context” chips.
  - **Mobile**: tab bar for primary modules, with stacked screens and large touch targets (44×44+). citeturn0search3turn0search9

### 4.5 Design tokens & accessibility
- Introduce a central token set (colors, typography, spacing, motion) with explicit accessibility metadata (contrast pairs, focus rings, target sizes), inspired by recent guidance on accessibility‑first design systems. 
- For bi‑borough:
  - WCC/RBKC logos and minor accent adjustments can come from token overrides, but base palette/tokens remain fixed to protect readability.
  - For different departments, prefer **iconography and text labels** over colour to signal context (e.g., “Children’s” vs “Adults”), avoiding confusing colour semantics.

### 4.6 Offline, performance & reliability
- Consolidate existing offline queue + PWA into a **generic offline engine** module:
  - Abstract offline queues (recordings, notes, tasks) under a unified interface.
  - Let each plugin declare which operations are safely queueable and how to reconcile conflicts.
- Define performance budgets:
  - Time‑to‑interactive for main shell; max weight for initial module bundle.
  - Strict limits on module bundle size; heavy features lazy‑load behind route boundaries.

### 4.7 Observability & governance
- Ensure each plugin logs structured events with tenant/domain/role/resource; retain alignment with existing `AuditEvent` model.
- Expose per‑tenant dashboards: adoption of modules, offline queue health, failure/error rates; use them to guide rollout decisions and cost management.

---

## 5. Ideal Development Approach (Foundations‑First)

1. **Stabilise domain & config layer**:
   - Finalise domain types (`Organisation`, `ServiceDomain`, `Case`, `Minute`, `Transcription`) as shared interfaces in a `domain` package.
   - Turn `config/pilot_children.yaml` and similar files into convincing examples of tenant/domain config driven by a `tenant` schema.
2. **Introduce a plugin‑aware shell** (web first):
   - Build a minimal plugin registry (as scaffolded at repo root) inside `minute-main` and adapt key routes to be module‑aware (starting with Transcription + Minutes).
   - Keep this backwards‑compatible initially by auto‑registering existing modules.
3. **Design system & tokens**:
   - Consolidate colour/typography/spacing into a token file and migrate core components to use tokens only, enforcing AA contrast via tests and linting.
4. **Role/domain navigation**:
   - Replace hand‑crafted menus with a config‑driven nav builder that uses `UserOrgRole` and `ServiceDomain` information; verify via end‑to‑end tests for a Children’s social worker vs manager vs admin.
5. **Progressively layer RN/RN‑Web**:
   - For the first release, keep Next.js for web but start extracting UI primitives into RN‑compatible components; a lightweight RN shell can host the same modules for mobile, consuming the same config.

---

## 6. Concrete Next Steps:

1. **Config systemisation (short‑term)**:
   - Introduce a small `config` library that can load and validate tenant/domain YAML/JSON into typed objects and expose them to both backend and frontend.
2. **Transcription/Minutes as first‑class modules**:
   - Wrap existing flows into explicit modules with declared routes and permissions; make navigation and access checks consume these declarations.
3. **Minimal design‑system pass**:
   - Define core tokens inside the existing Next.js app and refactor a small set of shared components (buttons, cards, chips, typography) to use them.
4. **Domain‑aware navigation**:
   - Implement role/service_domain‑filtered navigation for the bi‑borough pilot, driven by config + roles; prove we can add “Adults” or “Housing” nav entries by config only.
5. **Document and socialise the model**:
   - Use this file, `ROADMAP_social_care.md`, and the root `docs/architecture.md` to align the internal team and external partners on the platform ethos: one app, many departments, config‑driven.

---

## 7. Gap Map & Phase Crosswalk (Phases 15–19)

### 7.1 Evidence of current state (code/doc pointers)
- Config loading/validation: `common/config/loader.py`, `common/config/models.py`, `scripts/validate_configs.py`, tests `tests/test_config_loader.py` and `tests/test_config_all.py`, fallback config `frontend/lib/config/fallback.ts`, pilot config `config/pilot_children.yaml`.
- Module registry (frontend): `frontend/lib/modules.ts` (transcription/minutes/notes/admin with department filtering), tenant fetcher `frontend/lib/config/client.ts`, hook `frontend/lib/config/useTenantConfig.ts`.
- Offline/PWA & capture: `frontend/public/sw.js`, `frontend/lib/db.ts`, `frontend/lib/offline-queue.ts`, capture flow under `frontend/app/capture/`.
- Templates & domain mapping: `common/templates/social_care/`, template metadata tests `tests/test_templates.py`, service-domain mapping migration in `alembic/versions`, API surface via `/templates`.
- Governance & security: audit/retention logic in `common/services/`, migrations in `alembic/versions`, security header/rate-limit tests `tests/test_security_headers.py`.
- Exports & M365: worker exporters in `worker/exporters/`, orchestrator `common/services/export_handler_service.py`, API routes in `backend/api/routes/minutes.py`, storage adapters in `common/services/storage_services/`.

### 7.2 Gaps vs target universal app
- Config governance/versioning and schema publishing not formalised; promotion path undecided.
- Backend module/feature flag contracts not exposed; navigation not fully config-driven (needs labels/icons/permissions metadata).
- Design system lacks token set + a11y guarantees; RN-Web compatibility not yet addressed.
- Cross-platform shell absent (RN/Expo) and shared UI kit not extracted.
- Telemetry/admin: no per-module structured events/dashboards; no admin UI for config/versioning/audit.

### 7.3 Phase crosswalk to close gaps
- **16A**: add schema/version tags, nav metadata, feature flags, retention defaults; enforce via CI.
- **16B**: surface module/flag entitlements in API/context; gate sensitive routes; add contract tests.
- **16C**: drive nav/routes from module registry + config; add Playwright smoke for enable/disable.
- **17A/17B**: tokenised design system + a11y lint/CI; keep UI changes isolated from backend/config.
- **18A/18B**: extract shared UI kit and build RN/Expo shell on the same config/module registry.
- **19A/19B**: module/config telemetry + dashboards; admin console for config versioning/audit.

### 7.4 Landing zone checklist (post-architecture doc)
- `docs/architecture.md` published and linked from README/Roadmap; keep in sync with this gap map.
- Owners + review cadence recorded (monthly or per release) with PR label `area:architecture`.
- Track CI signals: config validation pass rate, nav/module toggle E2E status, a11y CI status, RN shell smoke once added.
- Changes touching config/module/nav/design-system add a short note back to this section.

## 8. Multilingual shell snapshot (Phase 20)
- **Config-first languages.** `TenantConfig.languages` now captures the default locale, allowed target languages, and an `autoTranslate` flag; schema + docs updated, and `config/pilot_children.yaml` enables EN→PL/AR/UK auto-translation so we can trial EAL support without forking code.
- **Service abstraction.** `TranslationService` (Azure Translator wrapper) plus `TranslationHandlerService` manage translation jobs, store results in `Transcription.translations` JSONB, and publish new `TaskType.TRANSLATION` jobs to the existing LLM queue—no new infrastructure required.
- **Queue + worker wiring.** Ray transcription actors auto-enqueue translations post-transcription when `autoTranslate=true`, ensuring “Record → Keep safe → Use Later” stays true even if staff never click a button.
- **API + settings.** `GET/POST /transcriptions/{id}/translations` expose translation status/results with the same org/role scoping, and `.env.example` documents `AZURE_TRANSLATOR_*` so councils can plug their own credentials or stay in pass-through mode.
- **Shell UX.** The new `Translations` tab mirrors the Magic Notes cards shown in the discovery screenshots: gradient hero reminding users of the flow, config-driven selector/status cards, inline retry CTA, accessible textarea for ready translations, and shared `@ui/*` primitives so RN/Web shells stay in sync.
- **Platform guardrails.** The translation service follows Microsoft’s request limits (≤50k characters per call, multiple languages per request) and multi-target guidance so we stay within Azure Translator SLA/cost envelopes.【turn0search0】 The same service can scale to 100+ languages as described in Azure’s Translator overview, so other departments/councils can light up EAL support without touching code.【turn0search1】
- **Next tasks.** Fold translation surfacing into capture/export flows, add per-language telemetry, and let admins manage language packs from the config console rather than editing YAML by hand.

---

## Appendix: Review Notes
- This document leans on existing strengths in `minute-main` (multi‑org/domain modelling, templates, offline queue, audit/retention) and avoids proposing a full rewrite; instead, it positions a plugin/config layer and design system on top.
- It explicitly de‑prioritises visual “re‑branding per council” and instead emphasises token‑driven accessibility and domain/role‑based navigation.
- It assumes RN/RN‑Web as a long‑term convergence path without forcing immediate migration away from the current Next.js stack, which would be risky and costly in the short term.
