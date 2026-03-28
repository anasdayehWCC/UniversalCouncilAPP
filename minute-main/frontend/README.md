# Minute Frontend (Legacy Reference)

`minute-main/frontend/` is frozen as a migration reference only.

- Do not use this directory for new frontend development.
- Do not treat it as an active workspace, CI target, or source of truth.
- The canonical web frontend is `../universal-app/`.
- The canonical JS workflow is the root pnpm workspace (`pnpm install`, `pnpm dev:web`, `pnpm build:web`, `pnpm openapi:web`).
- Keep this directory available for parity comparison until all required flows have either landed in `universal-app/` or been assigned to a planned migration phase.
