# Project Learnings

- Trigger: Tweaking universal-app dev-server performance or addressing slow hot reloads.
  Rule: Use Turbopack defaults by running `next dev` and `next build` without polling env vars or `--webpack` flags unless explicitly required.
  Verify: `universal-app/package.json` has `dev` set to `next dev` and `build` set to `next build`; no polling env vars are present.
- Trigger: Turbopack fails to resolve workspace modules in the monorepo.
  Rule: Set `turbopack.root` to the monorepo root in `universal-app/next.config.ts`.
  Verify: `turbopack.root` points to the repo root and Turbopack no longer errors about missing `next/package.json`.
