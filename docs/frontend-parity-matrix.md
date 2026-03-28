# Frontend Parity Matrix

Current source-of-truth split after consolidation:

| Capability | `universal-app/` | `minute-main/frontend/` | Decision | Notes |
|---|---|---|---|---|
| Capture / record / upload | Present (`/capture`, `/record`, `/upload`) | Present (`/capture`, `/new/*`) | Keep | New work belongs in `universal-app/`. |
| Minutes workspace | Present (`/minutes`, `/minutes/[id]`, `/my-notes`, `/my-notes/[id]`) | Partial (`/recordings/[id]`, `/transcriptions/[id]`) | Keep | The modern shell uses minutes and notes views instead of legacy route names. |
| Templates | Present (`/templates`, `/templates/new`, `/templates/[id]`) | Present | Keep | Functional overlap exists; only `universal-app` is active. |
| Review queue | Present (`/review-queue`, `/review-queue/[id]`) | Indirect in transcription flow | Keep | `universal-app/` has the canonical manager review surface. |
| Insights | Present (`/insights`, `/insights/dashboard`) | Present (`/insights`) | Keep | Capability exists in both; `universal-app` owns the active experience. |
| Admin shell | Present (`/admin`, `/admin/users`, `/admin/modules`, `/admin/templates`, `/admin/settings`, `/admin/audit`) | Partial (`/admin/configs`, `/admin/modules`, `/admin/audit`, `/admin/adoption`) | Migrate selectively | Legacy config/adoption surfaces are not active in `universal-app`; use `/admin/settings` and `/admin/modules` for current admin workflows. |
| PWA / offline queue | Present (`public/sw.js`, `src/lib/offline-queue.ts`) | Present (`public/sw.js`, `lib/offline-queue.ts`) | Keep | `universal-app/` is the canonical implementation target. |
| Typed backend client | Present (`src/lib/api/generated`) | Present (`lib/client/*`) | Keep | Ownership belongs to `universal-app/`. |
| Transcription detail flow | Served through notes/minutes/review flows | Present (`/transcriptions`, `/transcriptions/[id]`) | Retire legacy route shape | Do not recreate `/transcriptions/*` in the active shell unless a genuinely missing workflow appears. |
| Tasks | Task extraction and minute-level tasks exist; no dedicated route | Present (`/tasks`) | Migrate only if a distinct worklist is required | The active shell should not advertise `/tasks` until a real modern worklist is implemented. |
| Settings / support / privacy / demo | No active equivalent route | Present | Retire or re-scope deliberately | Keep out of the production shell unless there is a concrete legal or support requirement. |

Immediate migration gate:

- Keep `minute-main/frontend/` read-only until the remaining legacy-only capabilities are either migrated into modern `universal-app` information architecture or explicitly retired.
- Treat this matrix as the working checklist for eventual archival or deletion of `minute-main/frontend/`.
