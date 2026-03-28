# Frontend Parity Matrix

Current source-of-truth split after consolidation:

| Capability | `universal-app/` | `minute-main/frontend/` | Notes |
|---|---|---|---|
| Capture / record / upload | Present (`/capture`, `/record`, `/upload`) | Present (`/capture`, `/new/*`) | Web capture exists in both; new work belongs in `universal-app/`. |
| Minutes workspace | Present (`/minutes`, `/minutes/[id]`) | Partial (`/recordings/[id]`) | Legacy route model differs; keep for migration comparison only. |
| Templates | Present (`/templates`, `/templates/new`, `/templates/[id]`) | Present | Functional overlap exists. |
| Review queue | Present (`/review-queue`, `/review-queue/[id]`) | Indirect in transcription flow | `universal-app/` has a dedicated review surface. |
| Insights | Present (`/insights`, `/insights/dashboard`) | Present (`/insights`) | Capability exists in both. |
| Admin shell | Present (`/admin`, `/admin/users`, `/admin/modules`, `/admin/templates`, `/admin/settings`, `/admin/audit`) | Partial (`/admin/configs`, `/admin/modules`, `/admin/audit`, `/admin/adoption`) | Config/adoption screens still need explicit migration or retirement decisions. |
| PWA / offline queue | Present (`public/sw.js`, `src/lib/offline-queue.ts`) | Present (`public/sw.js`, `lib/offline-queue.ts`) | `universal-app/` is the canonical implementation target. |
| Typed backend client | Present (`src/lib/api/generated`) | Present (`lib/client/*`) | Ownership now belongs to `universal-app/`. |
| Transcription detail flow | Components exist under `src/components/transcription` | Present (`/transcriptions`, `/transcriptions/[id]`) | Dedicated route parity is incomplete in `universal-app/`. |
| Tasks | No dedicated route found | Present (`/tasks`) | Needs either migration into `universal-app/` or explicit de-scope. |
| Settings / support / privacy / demo | No equivalent route found | Present | Needs product decision before deleting legacy app. |

Immediate migration gate:

- Keep `minute-main/frontend/` read-only until transcription detail, tasks, admin config/adoption, and legacy utility routes are either migrated or explicitly retired.
- Treat this matrix as the working checklist for eventual archival or deletion of `minute-main/frontend/`.
