# Universal Council App – Architecture & Development Plan

## 1. Executive Summary
- **Goal:** Build a universal, configuration‑driven council app (web + mobile) that supports multiple councils, departments, and roles from a single codebase, without spawning sub‑apps.
- **Non‑goals:** Deep backend design, vendor lock‑in to a specific IdP or API shape, or bespoke branding per council beyond accessible design tokens.
- **Success criteria:**
  - New council or department can be onboarded by config (JSON/YAML + flags) without code forks.
  - Role‑aware UX (social workers, managers, admins) on Windows desktop (Edge/Chrome) and mobile (iOS/Android) using React Native + React Native Web.
  - WCAG 2.2 AA accessibility, UK GDPR‑compliant data boundaries, and observable, reliable behavior (SLOs defined).

## 2. Assumptions & Open Questions
### 2.1 Working assumptions
- Councils will share core domain concepts (cases, visits, notes, tasks) but differ in workflows, templates, and policies.
- Auth will be Entra ID (or similar OIDC) with council‑managed tenants; app trusts tokens and does role/domain enforcement.
- There may be multiple backend systems (case management, documents, tasks), so app must be API‑agnostic and able to integrate with REST/GraphQL facades.
- Offline needs focus on **capture and review**, not full case management.

### 2.2 Open questions (for stakeholders)
- Tenant & hosting:
  - Is each council a separate Azure subscription/tenant, or will one shared instance serve multiple councils?
  - Is any council prohibited from cloud hosting (requiring on‑prem or sovereign cloud)?
- Data domains:
  - What canonical identifiers exist (case ID, person ID) and which systems own them?
  - Are there cross‑council shared services (e.g., regional safeguarding) that need cross‑tenant views?
- UX & devices:
  - What proportion of social workers use locked‑down Windows laptops vs corporate mobiles vs BYOD?
  - Are there minimum device/OS baselines we can assume for PWA and React Native support?
- Security & governance:
  - Must every action be authorised per‑role per‑department, or are there “superuser” roles?
  - What are retention rules for transcripts/notes across departments (children vs adults vs housing)?
- Delivery:
  - What CI/CD stack is preferred (GitHub Actions, Azure DevOps, etc.)?
  - Will councils accept shared release trains, or require independent change cadences?

## 3. Problem Decomposition & Capability Map
Core capabilities:
- **Tenant & department management:** council → department → team, with per‑tenant config & flags.
- **AuthN/AuthZ & RBAC:** OIDC login, role + domain claims, policy evaluation.
- **Config & policy‑as‑code:** declarative JSON/YAML for tenant settings, features, navigation, and templates.
- **Plugin feature modules:** opt‑in capability bundles (e.g., “Transcription”, “Case notes”, “Tasks”) that register routes, components, and permissions.
- **UI shell & navigation:** React Native + RN Web shell that loads plugins, applies design tokens, and renders role‑aware menus.
- **Offline & performance:** PWA service worker, IndexedDB/SQLite for local queues, background sync, performance budgets.
- **Observability & governance:** logging, metrics, traces, audit log hooks, config change history.

Cross‑cutting concerns:
- Accessibility, internationalisation, theming, data residency, privacy, and deployment/environment controls.

## 4. Architecture Overview
### 4.1 Multi‑tenant model
Conceptual hierarchy:
```text
Platform
 ├─ Tenant (Council)
 │   ├─ Departments (Adults, Children, Housing, Transport…)
 │   │   ├─ Teams (e.g. Duty & Assessment)
 │   │   └─ Feature modules (Transcription, Case Notes, Tasks…)
 │   └─ Tenant config (design tokens, flags, policies)
 └─ Users
     ├─ Roles (SocialWorker, Manager, Admin, QA)
     └─ Memberships (tenant + department + team)
```

Isolation strategy:
- Logically isolate per tenant via tenant ID in config and API calls; physical isolation via separate backend deployments where policy requires.
- Department‑level isolation via feature/permission flags; avoid cross‑department data in the client by default.

### 4.2 Configuration‑driven extensibility
- Tenant config (see `packages/core/config/schema/tenant.schema.json`) defines:
  - Enabled modules, navigation entries, default routes.
  - Department‑level templates, features, and policies.
  - Design tokens (chosen from a safe palette), locale & i18n settings.
- Flags (see `packages/core/flags/flags.example.yml`) provide env‑specific controls:
  - Enable/disable modules per environment (dev/uat/prod).
  - Gradual roll‑out of high‑risk features (offline, batch processing).
- Plugin modules (see §6) declare capabilities; registry loads them based on tenant config and flags.

### 4.3 UI composition (React Native + RN Web)
- Shared UI in `packages/ui` uses React Native primitives and Design Tokens (`packages/ui/tokens/tokens.json`).
- Entry shells:
  - `apps/mobile/App.tsx` – React Native mobile shell.
  - `apps/web/App.tsx` – React Native Web shell for browsers.
- Navigation:
  - Single unified router per app that reads the plugin registry and tenant config to produce the menu and routes.
  - Role‑aware routing: navigation items filtered at runtime using role/permissions.
- Accessibility:
  - All components pull from token set (spacing, typography, color) that is pre‑validated for AA contrast.

### 4.4 Data access abstraction
- A small data access layer (DAL) mediates calls:
  - Interfaces like `CaseGateway`, `TranscriptionGateway`, `TaskGateway`.
  - Implementations per environment (e.g., REST, GraphQL, mock).
- Apps depend on interfaces, not concrete backends, enabling migrations or side‑by‑side experiments.

### 4.5 AuthN/AuthZ, auditing, PII boundaries
- AuthN:
  - Rely on Entra ID (OIDC); apps receive an ID/access token and tenant/domain claims.
  - Tokens are stored in secure storage (Keychain/Keystore, secure cookies or memory on web).
- AuthZ:
  - Policy evaluation in a shared module (e.g., `can(user, action, resource, context)`), driven by tenant config and role mappings.
  - Plugins declare required permissions up front.
- Auditing:
  - Each sensitive action emits an audit event (user, tenant, resource, action, timestamp, device).
- PII boundaries:
  - UI keeps PII to a minimum; redaction helpers for logs and telemetry.
  - Clear separation between content data (case notes) and operational meta (metrics/logs).

### 4.6 Performance & offline strategy
- PWA:
  - Service worker caches app shell, assets, and selected API responses.
  - IndexedDB/SQLite queue for offline submissions (e.g., recordings, notes).
  - Background sync strategy with progressive backoff.
- Budgets:
  - Aim for <100KB critical CSS/JS for first paint; module/route code‑splitting per plugin.

### 4.7 Observability
- Logging: structured logs with tenant/department/user IDs and correlation IDs (no raw PII).
- Metrics: per‑tenant/per‑module: latency, error rate, offline queue size, usage.
- Tracing: distributed tracing via trace IDs propagated through DAL calls.
- SLOs: define P95 latency and error budgets per key workflow (login, capture, sync, view).

## 5. Tenancy & Config (schemata)
- Tenants: JSON config validating against `tenant.schema.json`, including:
  - `id`, `name`, `defaultLocale`, `designTokens`, `enabledModules`, department configs.
- Flags: environment/tenant scoped YAML (`flags.example.yml`) controlling module availability and risky features.
- i18n: Config includes supported locales and content keys; UI uses translation hooks with type‑safe keys.

## 6. Plugin Interface
- Minimal plugin shape (see `packages/core/plugins/registry.ts`):
  - `id`, `routes` (path, component ID, required permissions), `meta` (title, icon, category).
  - Optional `onRegister(config)` to perform setup and `telemetry` hooks (names of events).
- Plugins are pure front‑end modules; any backend coupling goes via DAL interfaces.

## 7. Accessibility Plan
- Tokens encoded in `packages/ui/tokens/tokens.json` with:
  - Typography scale, spacing scale, and color roles (surface, text, accent).
- Guards:
  - A11y tests assert presence of mandatory tokens and simple invariants (e.g., minimum font size, no pure #fff text on #fff bg).
  - ESLint/Stylelint rules to prevent ad‑hoc colors outside token set.
  - Manual + automated audits (axe, Lighthouse) baked into CI.

## 8. Security & Privacy
- Threat model:
  - Stolen device, compromised token, misconfigured tenant config, plugin misuse.
- Mitigations:
  - Short‑lived tokens + refresh, secure storage, device attestation where available.
  - Minimal local storage of PII; ability to remote‑wipe cache.
  - Config validation and code review on new plugins.
  - Hooks to feed DPIA/records of processing activities from config (e.g., per‑module PII categories).

## 9. Delivery & Governance (Monorepo)
### 9.1 Layout (Nx/Turborepo‑style)
```text
apps/
  web/        # React Native Web shell
  mobile/     # React Native shell
packages/
  core/       # config, plugins, flags, DAL interfaces
  ui/         # components, tokens, layout primitives
  feature-*/  # optional feature modules (e.g., transcription)
docs/
  architecture.md
```

### 9.2 CI & release
- CI pipelines enforce:
  - Lint, type‑check, unit tests, and a11y/token checks.
  - Contract tests for DAL and plugin registry.
  - Controlled promotion from dev → uat → prod via environment‑specific flags.
- Governance:
  - CODEOWNERS per package (core, ui, each feature module).
  - Release trains (e.g., fortnightly) with emergency patch channels for security issues.

## 10. Testing Strategy (with examples)
- Unit:
  - Config validation against JSON Schema.
  - Plugin registry behaviors (registration, filtering by tenant).
  - Token constraints (presence of required keys, safe defaults).
- Contract:
  - DAL interfaces tested with mocked backends per environment.
- E2E:
  - Role‑based navigation, offline capture/sync, and feature flag toggling per tenant.
- Sample tests included in:
  - `packages/core/config/__tests__/tenant.schema.test.ts`
  - `packages/core/plugins/__tests__/registry.spec.ts`
  - `packages/ui/__tests__/tokens.a11y.spec.ts`

## 11. Migration & Roadmap
- Phase 0: Define tenant schema & plugin registry; wire basic shells (web/mobile) showing mock modules for bi‑borough.
- Phase 1: Implement DAL, auth integration (Entra), and initial modules (transcription, notes) with config‑driven navigation.
- Phase 2: Add offline capture, background sync, and observability.
- Phase 3: Pilot with Westminster/RBKC (limited teams), gather feedback, iterate templates and policies.
- Phase 4: Generalise for additional councils; formalise onboarding process and documentation.

## 12. References (non‑exhaustive)
- GOV.UK Service Manual – https://www.gov.uk/service-manual
- WCAG 2.2 – https://www.w3.org/TR/WCAG22/
- GOV.UK Design System – https://design-system.service.gov.uk/
- OpenAI Codex/Codex‑Max planning guidance – https://cookbook.openai.com/articles/codex_exec_plans

---
## Appendix: Review Notes
- Refined architecture to emphasise plugin/tenant config and DAL over any specific backend; kept visual branding secondary to accessibility tokens.
- Simplified plugin interface to be framework‑agnostic and minimise coupling, while allowing telemetry and config hooks. 
