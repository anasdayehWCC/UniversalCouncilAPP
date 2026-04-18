# Project Learnings

- Trigger: Tweaking universal-app dev-server performance or addressing slow hot reloads.
  Rule: Use Turbopack defaults by running `next dev` and `next build` without polling env vars or `--webpack` flags unless explicitly required.
  Verify: `universal-app/package.json` has `dev` set to `next dev` and `build` set to `next build`; no polling env vars are present.
- Trigger: Turbopack fails to resolve workspace modules in the monorepo.
  Rule: Set `turbopack.root` to the monorepo root in `universal-app/next.config.ts`.
  Verify: `turbopack.root` points to the repo root and Turbopack no longer errors about missing `next/package.json`.
- Trigger: Setting up API client for universal-app to communicate with minute-main backend.
  Rule: Always use `/api/proxy` as the base URL (via `NEXT_PUBLIC_API_URL` env var) to route through Next.js API proxy, never point directly to backend URL.
  Verify: `.env.local` contains `NEXT_PUBLIC_API_URL=/api/proxy` and `lib/api-client.ts` defaults to `/api/proxy`.
- Trigger: Adding route-specific error handling in Next.js 16 App Router.
  Rule: Create `error.tsx` files in route directories for granular error isolation; use for high-risk routes (record, minutes, admin) with custom recovery UX.
  Verify: Check for `error.tsx` files in critical route directories; verify they export default error component with `reset` function.
- Trigger: Optimizing bundle size and lazy loading heavy components.
  Rule: Add heavy packages to `experimental.optimizePackageImports` in next.config.ts and create lazy loading wrappers with proper loading skeletons for admin panels, charts, and export components.
  Verify: Check bundle analysis output; admin components should be in separate chunks loaded on-demand.
- Trigger: Fixing accessibility violations for icon-only buttons.
  Rule: All icon-only buttons must have explicit `aria-label` props describing their action; never rely on icon alone for accessibility.
  Verify: Search for `<Button.*size="icon"` patterns and ensure each has `aria-label` attribute.
- Trigger: Implementing distributed retention cleanup with storage deletion retries.
  Rule: Delete blobs FIRST, then database records only on confirmed success; use PostgreSQL advisory locks for distributed locking; retry transient storage errors with backoff.
  Verify: Check `retention_service.py` for blob-first deletion order and verify orphaned record logging when blob deletion fails.
- Trigger: Replacing hardcoded colors to support dark mode and theming.
  Rule: Never use hardcoded Tailwind colors (bg-slate-*, text-blue-*, etc.) in production UI unless the component is an intentionally branded shell surface. Use CSS variable-based tokens: `text-foreground`, `text-muted-foreground`, `bg-card`, `bg-muted`, `border-border`, `border-input`. For semantic colors use `text-success`, `bg-success/10`, `text-warning`, `text-destructive`, `text-info`.
  Verify: Grep for `text-slate-|bg-slate-|text-blue-|bg-blue-|text-green-|bg-green-` and ensure all matches are either tokenized or intentionally branded and theme-aware.
- Trigger: Using ProgressBar component with custom colors.
  Rule: Use the `variant` prop (`success`, `warning`, `error`, `info`, `default`) instead of `color="#hex"` prop. The variant system uses CSS variables that respect theming.
  Verify: Search for `<ProgressBar.*color=` and replace with appropriate `variant` prop.
- Trigger: Z-index conflicts between header, modals, and FAB.
  Rule: Use centralized z-index scale from `lib/z-index.ts`. Header uses z-40, FAB uses z-40, modals use z-50, toasts use z-100. Never use arbitrary z-index values.
  Verify: Check `lib/z-index.ts` exists and components import ZINDEX constants instead of hardcoded values.
- Trigger: Adding animations (animate-spin, animate-pulse) for loading/processing states.
  Rule: Always pair `animate-spin` or `animate-pulse` with `motion-reduce:animate-none` for users who prefer reduced motion. For conditional animations in `cn()`, include both classes: `isLoading && 'animate-spin motion-reduce:animate-none'`.
  Verify: Grep for `animate-spin|animate-pulse` and ensure all instances have corresponding `motion-reduce:animate-none`.
- Trigger: Components using client-only hooks (useNetworkStatus, useSyncManager, navigator.onLine, IndexedDB/Dexie queries) cause hydration mismatch.
  Rule: Add `const [isMounted, setIsMounted] = useState(false)` with `useEffect(() => { setIsMounted(true) }, [])` pattern. Gate rendering with `if (!isMounted) return null` or include `isMounted &&` in conditional logic.
  Verify: Check components using client-only APIs have mounted state and don't render client-specific content until `isMounted` is true.
- Trigger: useSyncManager shows "Cannot sync - Authentication required" toast.
  Rule: Pass access token to `useSyncManager(accessToken)` by getting it from `const { accessToken } = useAuth()`. Without the token, sync operations will fail.
  Verify: All useSyncManager calls that use syncAll() have accessToken passed from useAuth().
- Trigger: Enabling dark/light mode toggle for the universal-app.
  Rule: ThemeProvider (`src/providers/ThemeProvider.tsx`) must be wrapped around content in `layout.tsx`, ThemeSetter only handles brand/tenant colors, and `ThemeToggle` should route through shared theme state. Use `useColorMode()` from `src/hooks/useTheme.ts`, keep `.dark` as the canonical selector for `dark:` utilities, and expose a durable `/settings` surface for account-scoped appearance changes.
  Verify: layout.tsx wraps content with ThemeProvider; AppShell header includes ThemeToggle and a visible settings shortcut; the root shell uses semantic tokens and `.dark` classes rather than hardcoded dark backgrounds.
- Trigger: Creating fixed-position notification banners (like ResilienceBanner).
  Rule: Use Dynamic Island pattern (centered pill at top with z-60) instead of full-width banners (z-100) that block header. Banner should be expandable/collapsible with auto-collapse after 5 seconds. Position with `fixed top-2 left-1/2 -translate-x-1/2 z-[60]` to avoid overlapping header.
  Verify: Banner doesn't overlap header (z-50); uses pointer-events-none on container with pointer-events-auto on content; has dismiss button.
- Trigger: Sidebar instability (profile section falls below visible area).
  Rule: The shell should own the viewport with `h-[100dvh]` and `min-h-0` children, the header should use `--shell-header-height`, and banners should dock below the header safe area instead of covering it.
  Verify: AppShell keeps the sidebar and main content inside one `100dvh` contract; route content scrolls internally; the resilience banner never overlaps the header.

# Automation Infrastructure

- Trigger: Starting a development session or wanting to advance the project.
  Rule: Use `/orchestrate` to launch the development orchestrator. It reads the roadmap, identifies independent work, dispatches parallel sub-agents in worktrees, reviews output, and creates PRs. Use `/roadmap-status` for a quick check of what's done vs remaining.
  Verify: Orchestrator creates feature branches (never commits to main), dispatches max 5 sub-agents, and produces a PR with CHANGELOG updates.
- Trigger: Sub-agents working on frontend code in universal-app.
  Rule: The `dev-frontend` skill is auto-loaded as context. Sub-agents must follow theme token rules, accessibility patterns, z-index scale, and hydration safety patterns documented in that skill.
  Verify: Sub-agent output passes `pnpm --filter universal-app audit:premium-ui` and `pnpm --filter universal-app lint`.
- Trigger: Editing .tsx/.ts files in universal-app components or routes.
  Rule: PostToolUse hooks automatically check for hardcoded color tokens and accessibility issues (missing motion-reduce, missing aria-labels). PreToolUse hooks block edits to .env files, lock files, and generated API client code.
  Verify: Hooks are defined in `.claude/settings.json`; scripts are in `.claude/hooks/`.
- Trigger: Wanting to find gaps, UX issues, or missing features from a stakeholder perspective.
  Rule: Use `/review-board` to launch 5 adversarial persona agents (social worker, manager, admin, developer, a11y auditor) that test the running app via Chrome DevTools, report findings with confidence scores, and write a prioritized backlog to `docs/production-backlog.md`. The orchestrator reads this backlog during its ASSESS phase.
  Verify: Dev server is running at localhost:3000 before dispatch; findings below 70 confidence are filtered; backlog file is appended not overwritten.
- Trigger: Sub-agent discovers a task outside its assigned scope during orchestration.
  Rule: Report it in the "Discovered Tasks" section of the agent report using the format: `DISCOVERED: [category] [severity] / Description / Location / Suggested action`. The orchestrator collects these and appends them to `docs/production-backlog.md`.
  Verify: Sub-agent briefs include the discovered tasks protocol; orchestrator Phase 7c writes discoveries to backlog.
- Trigger: Hook commands in `.claude/settings.json` fail with "no such file or directory".
  Rule: Always use absolute paths for hook commands (e.g., `python3 /absolute/path/.claude/hooks/script.py`), not relative paths. Hooks execute relative to CWD, which may be a subdirectory when agents or the user work inside `universal-app/`.
  Verify: All `command` fields in `.claude/settings.json` hooks use absolute paths or `$PROJECT_ROOT`-relative expansion.
- Trigger: Creating route-level error boundaries in Next.js 16 App Router.
  Rule: Detail routes (`/[id]/error.tsx`) should detect 404 patterns in the error message and show friendlier "not found" messaging with a link back to the parent list route, not just home.
  Verify: Detail-route error boundaries check `error.message` for 404/not-found and render contextual "Back to [list]" links.
- Trigger: Running the a11y audit script (`audit:a11y`).
  Rule: The script at `universal-app/scripts/audit-a11y-ci.mjs` checks hardcoded colors, motion-reduce, and aria-labels. Files with intentional branded colors must be added to `HARDCODED_COLOR_ALLOWLIST` in the script. CI workflow at `.github/workflows/a11y.yml` runs both this and the premium UI audit.
  Verify: `node universal-app/scripts/audit-a11y-ci.mjs` exits 0; new components use semantic tokens.
- Trigger: Review board finds admin state is all ephemeral in-memory mock data.
  Rule: All admin hooks (`useAdmin`, `useReview`) use `useState` with `MOCK_*` seed data and no API calls. Every write mutates only local React state. A page refresh silently discards all changes. Do not ship admin features without a persistence layer.
  Verify: Search `useAdmin.ts` and `useReview.ts` for actual API calls (`fetch`, `api-client`); if none exist, the feature is mock-only.
- Trigger: Review queue "Review Note" button links to the wrong route.
  Rule: `PendingReviews.tsx` line 115 links to `/my-notes/${item.id}` (worker's personal view) instead of `/review-queue/${item.id}` (manager approval view). This breaks the core manager approval flow.
  Verify: Check that `PendingReviews.tsx` action button href uses `/review-queue/` prefix, not `/my-notes/`.
- Trigger: Multiple components independently calling `useNetworkStatus()`.
  Rule: `useNetworkStatus` creates its own `setInterval` per caller. Three components (ResilienceBanner, ConnectivityIndicator, record/page.tsx) each poll the backend independently. Lift network status into a shared context/provider so only one polling loop runs.
  Verify: Grep for `useNetworkStatus()` calls; there should be exactly one (in a provider), not per-component.
- Trigger: Login page or other intentionally branded dark surfaces using semantic tokens like `text-foreground`.
  Rule: On branded dark surfaces with hardcoded dark backgrounds, do not use theme-adaptive semantic tokens for text. Use explicit `text-white` or `text-white/[opacity]` since the background doesn't change with theme mode. `text-foreground` produces dark-on-dark in light mode.
  Verify: Check branded dark surfaces (login, hero sections) for `text-foreground` or `text-muted-foreground` usage; all text should use explicit light values.
- Trigger: Naming variables in Next.js page/layout files.
  Rule: Never name a variable `module` in Next.js page/layout files; the `@next/next/no-assign-module-variable` lint rule flags it. Use `targetModule`, `matchedModule`, or similar.
  Verify: `pnpm lint` reports zero `no-assign-module-variable` errors in new code.
- Trigger: Starting creative work — designing new features, components, APIs, or modifying existing behavior.
  Rule: Use `/brainstorming` before writing any code. It walks through a structured dialogue: one question at a time, 2-3 approaches with tradeoffs, then design in 200-300 word sections with incremental validation. Saves the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md` and offers handoff to `/writing-plans` for implementation.
  Verify: Design document exists in `docs/plans/` before implementation begins; design covers architecture, components, data flow, error handling, and testing.
- Trigger: Having a spec or validated design and needing to plan multi-step implementation.
  Rule: Use `/writing-plans` to create detailed implementation plans with bite-sized tasks (2-5 minutes each: write failing test, run, implement, run, commit). Plans include exact file paths, complete code, project-specific rules (theme tokens, a11y, z-index), and validation commands. Saved to `docs/plans/YYYY-MM-DD-<feature-name>.md`. Execution via `executing-plans` skill or `/orchestrate`.
  Verify: Plan file exists in `docs/plans/`; each task has exact file paths, test commands with expected output, and a commit step.
- Trigger: Running multiple `/orchestrate` sessions concurrently (e.g., in parallel chat windows).
  Rule: The orchestrator reads `.claude/orchestrator-claims.json` during ASSESS to check for tasks claimed by other sessions. It writes claims after user approval in IDENTIFY (before dispatching agents) and releases them after PR creation in Phase 8. Claims older than 2 hours are treated as stale from crashed sessions.
  Verify: `.claude/orchestrator-claims.json` exists with `{"claimed":[]}` when no orchestrator is active; concurrent sessions do not dispatch overlapping tasks.
