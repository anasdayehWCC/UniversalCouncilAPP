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
