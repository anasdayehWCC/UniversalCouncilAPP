# 2026-03-28 Dev Server Performance

Summary:
- Switched universal-app dev and build scripts to Turbopack defaults to reduce startup and hot-reload latency.
- Set `turbopack.root` to the monorepo root to fix workspace resolution errors.

Decisions:
- Remove polling-based watch env vars in dev on macOS to use native file watching.
- Remove explicit `--webpack` flags from default scripts so Turbopack is the baseline.
- Define Turbopack's root directory explicitly to include workspace packages.

Follow-ups:
- Optional: verify dev startup log indicates Turbopack and compare hot-reload latency.
- Run `pnpm --filter universal-app build` to confirm Turbopack resolves `next` and workspace modules.
