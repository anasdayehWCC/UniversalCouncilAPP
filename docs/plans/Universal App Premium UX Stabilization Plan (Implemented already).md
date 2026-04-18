# Universal App Premium UX Stabilization Plan

## Summary
**Design direction chosen:** `Restrained Premium` — Apple-like calm, precision, and motion, but tuned for public-service trust, accessibility, and low cognitive load.

### UX Snapshot
- The app already has a strong foundation: tenant theming, a persistent shell, semantic tokens, and several well-built route concepts.
- The current UI feels **assembled rather than authored** because page routes are still composing their own heroes, rails, chips, and viewport rules instead of using one shell grammar.
- The highest-friction screens are `/templates`, `/record`, `/my-notes/[id]`, the manager home/review surfaces, and the persona switcher.
- The core visual problem is **hierarchy inflation**: too many pills, too many highlighted surfaces, too many competing focal points.
- The core technical problem is **layout and surface drift**: `ShellPage` exists, but high-traffic routes bypass it; overlays and side rails still create their own positioning contracts.
- The core product problem is **interaction quality drift**: hover-only preview, fixed assistant rails, `alert/confirm`, leftover raw colors, and mixed shell/navigation patterns undermine the premium feel.

## Root Causes and Design Principles
### Root Causes
- `AppShell`, `ShellPage`, `ThemeProvider`, and the token system exist, but routes still ship bespoke layout logic and duplicate page architecture.
- `Card` is overloaded as page hero, dashboard tile, form panel, preview rail, and empty state container, so the surface hierarchy is inconsistent.
- Overlays are not governed by one dock model: `ResilienceBanner`, `ConnectivityIndicator`, fixed right rails, dialogs, and sticky headers still compete in separate stacking contexts.
- The token migration is incomplete; repo inspection still shows raw color classes, raw gradients, hardcoded white panels, and legacy gray text in planner/review/insights/settings-related components.
- Multiple shell/navigation implementations (`AppShell`, `MainNav`, page-local sticky headers) are drifting apart instead of enforcing one contract.
- Primary flows still contain demo-grade interactions (`alert`, `confirm`, `console.log`, hover-to-preview, placeholder actions), which immediately lowers perceived product quality.

### Chosen Apple-Inspired Principles
- **Deference:** content and task completion lead; decorative chrome recedes.
- **Clarity:** typography, spacing, and action hierarchy do the heavy lifting, not badge accumulation.
- **Depth:** depth comes from restrained layer separation and meaningful motion, not repeated blur, glow, and competing elevated panels.

## Implementation Changes
### 1. Shell and Layout Contract
- Make `src/components/layout/AppShell.tsx` and `src/components/layout/ShellPage.tsx` the only approved page containers for authenticated routes.
- Replace route-level viewport math with one shell rule: `100dvh` shell, fixed header, scroll only inside the content region, `min-h-0` on all scroll ancestors.
- Merge the current shell split into one canonical header/sidebar model; `MainNav` patterns that still diverge must be absorbed into `AppShell` or retired.
- Create shell primitives for `PageHeader`, `PageSection`, `FilterBar`, `MetricStrip`, and `InspectorPanel`; routes stop hand-rolling their own hero bars and stat rails.
- Replace arbitrary/fixed side offsets like `mr-80` and fixed right rails with shell-managed inspector slots that participate in layout instead of floating outside it.

### 2. Surface System and Visual Grammar
- Refactor `Card` usage into a small, explicit surface taxonomy: `HeroSurface`, `PrimaryPanel`, `SecondaryPanel`, `ListRow`, `InspectorSurface`, and `EmptyState`.
- Keep glass effects only where they communicate layer separation; remove decorative glass from routine content cards.
- Demote `info-rail` from a reusable catch-all pattern to one tightly defined status/metric cluster style; most pages should show fewer, higher-value chips.
- Normalize button hierarchy so each screen has one clear primary action, one secondary path, and restrained utility actions.
- Introduce a typography ladder for persona entry, page headers, section labels, list rows, and inspectors so routes stop improvising type scale.
- Finish the semantic-token migration and add a regression check that blocks new raw `gray/slate/white/amber/red/emerald` utilities in shared UI unless explicitly allowlisted.

### 3. Overlay, Banner, and Stacking System
- Replace the current “floating things everywhere” model with one overlay dock owned by the shell.
- Keep the dynamic-island concept, but treat it as a compact **status capsule** below the header safe area, not as a separate banner system.
- Rebuild `ResilienceBanner` and `ConnectivityIndicator` under one overlay contract with one z-index map, one safe-area policy, and one collapse/expand behavior.
- Remove fixed assistant rails from route code; the AI assistant becomes a contextual inspector that docks inline on wide screens and becomes a sheet on narrower ones.
- Standardize dialogs, sheets, toasts, quick actions, and floating monitors on the shared z-index scale; remove remaining `z-[9999]`-style escapes outside dev-only tooling.
- Replace browser-native `alert/confirm` flows with product-grade confirmation dialogs and non-blocking feedback.

### 4. Critical Journey Redesigns
- **Persona switcher/login:** make selection feel deliberate and premium with stronger active-state semantics, less generic card repetition, better council context framing, and less hardcoded dark styling.
- **Practitioner dashboard/home:** reduce hero and chip noise, make the recording action dominant, convert utility cards into clearer task lanes, and align recent activity rows with one reusable list pattern.
- **Templates:** remove hover-only preview as a primary interaction; use explicit selection with a stable inspector. Unify grid/list modes so they express the same information hierarchy instead of two different products.
- **Record:** redesign around a single recording stage with strong focus, higher contrast, fewer simultaneous controls, clearer online/offline states, and a calmer pre-record metadata step.
- **My Notes detail:** collapse the stacked header bars into one coherent page header, move the AI assistant into a contextual inspector, and simplify summary/transcript/tasks switching.
- **Manager/review/insights:** replace “dashboard card soup” with a calmer executive review model: summary strip, prioritized queue, and secondary analytics beneath. Alerts must never obscure the working headline.

### 5. Production-Readiness Hardening
- Audit all high-traffic components for token drift, spacing drift, and duplicated patterns, starting with planner, review, insights, templates, notifications, recording, and minute editor surfaces.
- Remove demo-grade logging and placeholder interactions from user-facing flows; keep diagnostics behind dev-only tooling.
- Ensure every primary interaction respects reduced motion, keyboard access, visible focus, and color-independent status cues.
- Add a visual style allowlist for intentional branded surfaces such as the sidebar and selected tenant-specific hero accents, so “premium” does not become “everything glows.”
- Update `minute-main/docs/user_journeys.md`, `ROADMAP_social_care.md`, `CHANGELOG.md`, and the architecture documentation with the new shell grammar, overlay policy, and surface taxonomy.

## Test and Validation
- Add Playwright coverage for the five critical journeys: persona selection, dashboard, template selection, record flow, and note detail with AI inspector.
- Add layout assertions proving the header remains visible, the sidebar height stays stable, and overlays never cover primary navigation.
- Add theme regression coverage for light/dark/system across the shell and the main role routes.
- Add a static audit step that fails on new raw color classes, arbitrary z-index escapes, fixed right rails, or browser-native `alert/confirm` in production UI.
- Run route-by-route visual review at mobile, tablet, laptop, and large desktop breakpoints before implementation is considered complete.

## Assumptions and Defaults
- The redesign happens only in `universal-app/`; legacy frontends remain untouched.
- “Apple-like” means disciplined hierarchy, motion restraint, and tactile polish, not literal iOS mimicry.
- The AI assistant remains a persistent capability, but not a permanently fixed sidebar.
- The dynamic-island/status capsule remains, but only as a shell-owned status affordance below the header.
- Priority order for implementation: shell/overlay contract first, surface taxonomy second, critical journeys third, secondary/admin parity fourth.

## Reference Standards
- Apple’s design themes of **deference, clarity, and depth** from the iOS transition guidance: [Apple UI Transition Guide](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/TransitionGuide/)
- Apple accessibility guidance on reducing motion, simplifying interactions, spacing controls, and avoiding complexity: [Apple HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- Next.js App Router guidance that shared layouts remain interactive while route segments load: [Next.js layouts and loading](https://nextjs.org/docs/app)
- Tailwind guidance for `.dark` variants and `@theme`-driven design tokens: [Tailwind dark mode](https://tailwindcss.com/docs/dark-mode) and [Tailwind theme variables](https://tailwindcss.com/docs/theme)
- MDN guidance on stacking contexts and sticky behavior relative to scroll ancestors: [MDN stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context) and [MDN positioning](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Positioning)
