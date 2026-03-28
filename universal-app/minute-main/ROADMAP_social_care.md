# Roadmap — Social Care Minute Platform

Legend: `[ ]` todo · `[~]` in progress · `[x]` done  
Work phases are ordered; always pick the earliest incomplete phase.

## Phase 01 – Governance & Guardrails `[x]`

- `[x]` Add a durable agent rules doc (`AGENTS.md`) so contributors know how to work.
- `[x]` Introduce a repo-wide changelog and link it from docs.
- `[x]` Signpost where roadmap/instructions live in the codebase.
  **Exit:** A newcomer can locate instructions + roadmap in one hop and knows how to log changes. (Met 2025-11-25)

## Phase 02 – Domain-Aware Theming & Nav Clarity `[x]`

- `[x]` Use ThemeSetter tokens for nav active/hover states instead of brittle class strings.
- `[x]` Show the active domain in the header (name + color pill) to anchor context.
- `[x]` Remove Tailwind-unsafe dynamic classes in `AppShell` and rely on CSS vars/inline styles.
- `[x]` Ensure theme updates when switching persona/domain.
  **Exit:** Nav + header reflect the selected domain/role with consistent colours; no dynamic Tailwind classnames. (Met 2025-11-25)

## Phase 03 – Recording/Upload Fidelity `[x]`

- `[x]` Simulate async upload states with success + error messaging.
- `[x]` Surface chosen processing mode (fast/economy) into note metadata.
- `[x]` Add a newly uploaded item into the minutes list for demo continuity.
  **Exit:** Upload flow feels real, produces visible note entries, and communicates outcome. (Met 2025-11-25)

## Phase 04 – Review Queue & Risk Surfacing `[x]`

- `[x]` Build manager review queue with filters for flagged/high-risk items.
- `[x]` Add risk badges to meeting cards and queue rows.
- `[x]` Provide quick actions (approve/return) and record action timestamps.
  **Exit:** Manager can triage queue items with risk visibility and basic actions using mock data. (Met 2025-11-25)

## Phase 05 – Quality & Lint Debt `[x]`

- `[x]` Newly discovered from Phase 02: resolve eslint failures (impure Math.random in capture page, `any` types in insights/templates, unused imports/components across pages) so `npm run lint` passes.
- `[x]` Replace `<img>` usage in shared components with `next/image` where sensible to silence Next.js LCP warnings.
  **Exit:** `npm run lint` passes cleanly; no Next.js image warnings in shared UI. (Met 2025-11-25)

## Phase 06 – Meeting Freshness & Ordering `[x]`

- `[x]` Ensure meeting lists (dashboard, My Notes, review queue) are consistently sorted by most recent activity (uploadedAt/submittedAt/date).
- `[x]` Display submitted/uploaded timestamps where helpful to anchor recency.
- `[x]` Keep risk/mode badges intact after sorting.
  **Exit:** All meeting views show newest-first ordering with clear recency cues. (Met 2025-11-25)

## Phase 07 – Recording-to-Note Continuity `[x]`

- `[x]` When saving a recording, create a processing meeting entry in shared state (domain-aware template, processing mode default fast).
- `[x]` Provide post-recording success panel with navigation to the created note.
- `[x]` Avoid duplicate creations across repeated stop/resume interactions.
  **Exit:** Recording flow produces a visible note entry and gives the user a link to it without backend calls. (Met 2025-11-25)

## Phase 08 – Accessibility & Keyboard Support `[x]`

- `[x]` Add skip link and main landmark for keyboard users.
- `[x]` Provide aria-labels on icon-only controls (review queue actions, meeting card menu, recording controls).
- `[x]` Make upload dropzone keyboard-activatable.
  **Exit:** Core navigation/actions are operable via keyboard with clear labels. (Met 2025-11-25)

## Phase 09 – Insight Data Realism `[x]`

- `[x]` Replace hardcoded insight stats with derived counts from mock data (meetings, statuses).
- `[x]` Add domain filter toggle to insights to reflect current persona domain.
- `[x]` Show risk distribution pill using meeting riskScore aggregation.
  **Exit:** Insights page reflects live mock data per domain instead of static numbers. (Met 2025-11-25)

## Phase 10 – Persona Login & Tenant Branding `[x]`

- `[x]` Add persona selection/login screen with avatar cards and keyboard support.
- `[x]` Wire persona switch to shared context and redirect into the app.
- `[x]` Refresh domain theming to Westminster (#211551/#9D581F) and RBKC (#014363/#A2CDE0) plus rename recording to “Smart Capture”.
  **Exit:** Users can pick personas from a dedicated screen, and branding updates across the shell. (Met 2025-11-25)

## Phase 11 – Team Activity From Live Data `[x]`

- `[x]` Replace static team activity list on insights with counts derived from meeting submitters.
- `[x]` Show per-role breakdown (social worker / manager / admin) using current personas.
- `[x]` Add tooltip showing last submittedAt per user.
  **Exit:** Team activity reflects live mock data with role-aware counts and recency cues. (Met 2025-11-25)

## Phase 12 – Manager/Priya Experience Polish `[x]`

- `[x]` Newly discovered: round out manager dashboard with quick approval bulk actions and SLA timers.
- `[x]` Priya needs module toggle persistence (mock) and visual diff for brand/theme previews.
- `[x]` Add generated avatars (stable prompt) for Nina/David/Sarah with consistent sizing.
  **Exit:** Role dashboards feel complete and demo-ready with visual assets and quick actions. (Met 2025-11-25)

If new work is discovered during any phase, add it as a bullet under the next appropriate phase with the prefix “Newly discovered from Phase X”.

## Phase 13 – Gemini UI Integration `[x]`

- `[x]` Implement `GlassCard` component with advanced visual effects.
- `[x]` Update Dashboard, Insights, and Admin pages to use `GlassCard`.
- `[x]` Enhance typography with `Space Grotesk` font.
- `[x]` Add staggered animations and background gradients.
- `[x]` Create `EnhancedInput` component for AI interactions.
- `[x]` Newly discovered from Phase 10: refine persona login hero with dark gradient background and glass persona cards to match the Gemini-inspired shell.
- `[x]` Newly discovered from Phase 13: suppress Grammarly-driven hydration mismatch warnings (`data-gr-*` attributes) by guarding `html/body` hydration and documenting extension hygiene in `AGENTS.md`.
  **Exit:** UI reflects a premium, modern aesthetic inspired by Gemini design language. (Met 2025-11-25)
