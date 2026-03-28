# ADR 002: Direct Local Workflow and Legacy Docker Decommission

**Status:** Accepted  
**Date:** 2026-03-28

**Context:**  
The repository has consolidated around a root `pnpm` workspace, `universal-app/` as the canonical web shell, and `minute-main/backend` plus `minute-main/worker` as the social-care backend boundary. The remaining Dockerfiles, Compose files, and image-build workflows reflect historical deployment and local-development patterns, but they now create drift in docs, CI language, and onboarding. They also conflict with the current developer preference to avoid Docker for normal local work.

**Decision:**  
We will treat direct local processes as the canonical developer workflow:

1. `pnpm dev:web` from the repo root for the web frontend.
2. `poetry run uvicorn backend.main:app --reload --port 8080` in `minute-main` for the backend.
3. Local PostgreSQL on the developer machine as the default non-Docker database dependency.
4. `QUEUE_SERVICE_NAME=noop` and `STORAGE_SERVICE_NAME=local` as the default local profile for day-to-day frontend and backend work.

Dockerfiles, Compose files, and image-build workflows remain only as legacy infrastructure until they are either deleted, archived, or replaced by a non-Docker deployment model.

**Consequences:**  

- Root and backend docs must stop presenting Docker Compose as the default local path.
- CI and helper scripts must prefer root `pnpm` commands and Poetry-based direct process checks.
- Docker-based workflows must be clearly labeled as legacy to prevent new work from depending on them.
- The Ray-based worker can remain temporarily isolated behind an optional Poetry dependency group, but it must not block the canonical Python 3.14 backend development path.
