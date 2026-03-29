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
