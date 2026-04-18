# Production Backlog

Tasks discovered by the review board (`/review-board`) and by sub-agents during orchestration runs (`/orchestrate`). The orchestrator reads this file during its ASSESS phase and incorporates high-priority items into work selection.

## Format

Each section is dated and sourced. Items are sorted by severity within each section.

| Column | Values |
|--------|--------|
| Category | bug, ux, feature, refinement, a11y, performance, security, test, docs |
| Severity | critical, high, medium, low |
| Confidence | 0-100 (findings below 70 are filtered out) |
| Status | open, in-progress, resolved, wont-fix |

---

<!-- Review board and orchestrator findings will be appended below -->

## 2026-04-16 Review Board Findings

**Reviewers:** Sarah (SW), David (TM), Priya (Admin), Alex (A11y), Dev
**App state:** commit 776f51e on `feature/orchestrate-2026-04-16`
**Findings:** 50 confirmed from 5 agents (all ≥70 confidence)

### Critical

| # | Category | Description | Route | Found By | Confidence | Status |
|---|----------|-------------|-------|----------|------------|--------|
| 1 | security | Consent recorded only in localStorage, not attached to recording — no defensible audit trail for GDPR | /record | Sarah | 90 | resolved |
| 2 | feature | All admin state is ephemeral in-memory mock data — page refresh silently discards all config changes | /admin | Priya | 98 | open |
| 3 | security | Audit log is in-memory, not tamper-evident — Math.random IDs, client-side CSV export, lost on refresh | /admin/audit | Priya | 97 | open |
| 4 | feature | No tenant/department onboarding workflow — adding departments requires code changes and redeployment | /admin | Priya | 95 | open |
| 5 | bug | "Review Note" button in PendingReviews links to /my-notes/[id] (worker view) instead of /review-queue/[id] (approval view) | /review-queue | David | 97 | resolved |
| 6 | a11y | Header search input has no label — screen readers announce unlabelled edit field (WCAG 1.3.1, 3.3.2) | All routes | Alex | 99 | resolved |
| 7 | a11y | Admin feature-flag toggles are non-interactive divs — no keyboard support (WCAG 2.1.1) | /admin | Alex | 99 | resolved |

### High

| # | Category | Description | Route | Found By | Confidence | Status |
|---|----------|-------------|-------|----------|------------|--------|
| 8 | ux | Consent is a one-time browser flag, not per-recording — GDPR requires per-interaction consent | /record | Sarah | 92 | resolved |
| 9 | feature | Export button on note detail does nothing — no onClick handler, CMS integrations disabled by default | /my-notes/[id] | Sarah | 94 | resolved |
| 10 | ux | No sync/saved indicator visible during or after recording when online — fear of data loss | /record | Sarah | 85 | resolved |
| 11 | ux | Record button requires scrolling past metadata form on mobile — form competes with primary action | /record | Sarah | 88 | resolved |
| 12 | bug | "Reject" and "Request Changes" both map to same `flagged` status — destroys audit trail distinction | /review-queue/[id] | David | 95 | resolved |
| 13 | feature | No per-worker compliance breakdown on manager dashboard — flying blind on team health | / | David | 92 | resolved |
| 14 | ux | Team Insights behind aiInsights flag with no lightweight fallback for basic compliance numbers | /insights | David | 90 | open |
| 15 | ux | Review queue has no sort controls — can't sort by oldest/priority/overdue | /review-queue | David | 88 | resolved |
| 16 | security | Module enable fires with no confirmation dialog; audit log missing tenantId field | /admin/modules | Priya | 92 | resolved |
| 17 | ux | Module settings shown as read-only raw JSON — no edit capability for non-developers | /admin/modules | Priya | 95 | resolved |
| 18 | feature | Template editor/duplication are stub placeholders — only delete works | /admin/templates | Priya | 96 | open |
| 19 | security | Bulk-delete button in UserTable has no onClick handler and no confirmation dialog | /admin/users | Priya | 89 | open |
| 20 | a11y | Duplicate competing skip links — one in layout.tsx, one in AppShell.tsx (WCAG 2.4.1) | All routes | Alex | 98 | resolved |
| 21 | a11y | Review-queue tab bar missing role="tablist", role="tab", aria-selected (WCAG 4.1.2) | /review-queue | Alex | 97 | resolved |
| 22 | a11y | UserTable checkboxes (select-all and per-row) have no accessible labels (WCAG 1.3.1) | /admin/users | Alex | 96 | resolved |
| 23 | a11y | SortableList drag-and-drop has no keyboard alternative — pointer-only (WCAG 2.1.1) | /admin | Alex | 95 | resolved |
| 24 | a11y | SharePoint browser search input and icon buttons unlabelled (WCAG 1.3.1, 1.1.1) | SharePoint modal | Alex | 98 | resolved |
| 25 | a11y | RecordingTimer Framer Motion animations ignore prefers-reduced-motion (WCAG 2.3.3) | /record | Alex | 85 | resolved |
| 26 | a11y | DeviceSelector custom dropdown lacks ARIA combobox/listbox semantics, no Escape handler (WCAG 4.1.2) | /record | Alex | 90 | resolved |
| 27 | a11y | Admin Organisation Name input has no programmatic label (WCAG 1.3.1, 3.3.2) | /admin | Alex | 99 | resolved |

### Medium

| # | Category | Description | Route | Found By | Confidence | Status |
|---|----------|-------------|-------|----------|------------|--------|
| 28 | bug | "Meeting not found" renders bare div outside shell — no navigation back | /my-notes/[id] | Sarah | 91 | resolved |
| 29 | ux | Mobile sidebar has no visible close button — dismiss only by tapping overlay | All routes | Sarah | 80 | resolved |
| 30 | ux | Consent checkbox too small for touch (16px, no padding) — fails 44px target | /record | Sarah | 78 | resolved |
| 31 | ux | ChangesRequested tab loses original return reason, timestamp, and cycle count | /review-queue | David | 85 | resolved |
| 32 | ux | No badge count for pending items on sidebar "Review Queue" nav item | All routes | David | 82 | resolved |
| 33 | bug | Bulk Export button on review queue is non-functional stub (no onClick) | /review-queue | David | 80 | resolved |
| 34 | ux | Role guard shows blank page during hydration — no loading skeleton for admin | /admin | Priya | 88 | resolved |
| 35 | ux | Manager sees misleading read-only user list with interactive checkboxes but no edit power | /admin/users | Priya | 85 | open |
| 36 | bug | Organisation Name field uses defaultValue with no Save — edits silently discarded | /admin | Priya | 90 | resolved |
| 37 | a11y | AIEditSidebar textarea label not programmatically associated (WCAG 1.3.1) | /my-notes/[id] | Alex | 95 | resolved |
| 38 | a11y | Login persona badge text contrast unvalidated for dynamic palette (WCAG 1.4.3) | /login | Alex | 75 | resolved |
| 39 | a11y | RecordingMetadata compact toggle missing aria-expanded state (WCAG 4.1.2) | /record | Alex | 90 | resolved |

### Low

| # | Category | Description | Route | Found By | Confidence | Status |
|---|----------|-------------|-------|----------|------------|--------|
| 40 | ux | CTA labels not domain-specific — housing officer and children's SW see same text | / | Sarah | 72 | open |
| 41 | bug | useNetworkStatus health check timeout is a no-op — Promise.race against already-resolved Response | All routes | Dev | 97 | resolved |
| 42 | bug | Authorization guard on /record fires AFTER consent screen — unauthorized users briefly see consent UI | /record | Dev | 92 | resolved |
| 43 | performance | Three independent useNetworkStatus instances poll backend simultaneously (3x fetch every 10-30s) | All routes | Dev | 95 | resolved |
| 44 | bug | window.location.href in AppShell "Switch persona" causes full page reload instead of client navigation | All routes | Dev | 96 | resolved |
| 45 | performance | Continuous polling interval re-created on every state transition — potential interval storm | All routes | Dev | 88 | resolved |
| 46 | refinement | Hardcoded Tailwind colors in minutes/page.tsx, FeatureToggle, dates/format.ts, minutes/types.ts | Multiple | Dev | 90 | resolved |
| 47 | a11y | Duplicate skip-to-content links — SkipLinks in layout.tsx AND raw anchor in AppShell.tsx | All routes | Dev, Alex | 95 | resolved |
| 48 | bug | DemoContext API hydration can race with localStorage hydration — flash of wrong user | All routes | Dev | 80 | resolved |
| 49 | performance | console.log calls in DemoContext survive Turbopack production builds (Terser config doesn't apply) | All routes | Dev | 85 | resolved |
| 50 | bug | Dead "Forgot Password?" link on login page navigates to # with no handler | /login | Dev | 99 | resolved |

## 2026-04-18 Orchestration Run 4 — Discovered Tasks

| # | Category | Severity | Description | Location | Source Agent |
|---|----------|----------|-------------|----------|-------------|
| 51 | data | low | Demo MEETINGS seed data uses 2024 dates — all time-relative metrics (this week/month, overdue) show zero | universal-app/src/config/personas.ts | Agent 2 (compliance widget) |
| 52 | bug | medium | Priority Reviews "Review" button on home page links to /my-notes/ instead of /review-queue/ | universal-app/src/app/page.tsx:296 | Agent 2 (compliance widget) | resolved |
| 53 | a11y | medium | ModuleToggle CATEGORY_CONFIG uses hardcoded bg-purple-100/text-purple-700 and bg-amber-100/text-amber-700 | universal-app/src/components/admin/ModuleToggle.tsx:34-35 | Agent 3 (module settings) | resolved |
| 54 | a11y | medium | Login page header area uses text-muted-foreground on dark surface — poor contrast in light mode | universal-app/src/app/login/page.tsx:64,68,72,81 | Agent 4 (login contrast) | resolved |
| 55 | refinement | low | Login page gradient uses hardcoded from-slate-900/950 — evaluate for token migration or add to allowlist | universal-app/src/app/login/page.tsx:43,134,153 | Agent 4 (login contrast) |
| 56 | refinement | low | No Switch UI primitive in components/ui/ — custom toggle built inline in ModuleSettingsForm | universal-app/src/components/ui/ | Agent 3 (module settings) |
