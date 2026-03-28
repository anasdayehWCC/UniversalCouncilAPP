# Persona & Role Matrix (Demo Scope)

Purpose: keep the demo tight and believable. Each role only sees what matches their day-to-day remit. Use this as a guardrail when adding pages or nav items.

| Persona (role) | Domain | Nav visibility | Data scope | Page behaviours |
| --- | --- | --- | --- | --- |
| Sarah (social_worker) | Children (WCC) | Home, My Notes, Smart Capture, Upload, Templates | Westminster Children’s Social Care domain, aligning with People First co-produced support; no cross-domain toggle. | Insights hidden; Review/Approvals hidden; Smart Capture/Upload enabled unless Priya toggles them off. |
| Nina (social_worker) | Adults (RBKC) | Home, My Notes, Smart Capture, Upload, Templates | RBKC Adults domain focused on hospital discharge/reablement under the Outstanding-rated integrated care framework. | Insights hidden; review queue hidden; Smart Capture/Upload available unless Priya disables Smart Capture. |
| David (manager) | Adults (RBKC) | Home, Team Notes, Review Queue, Team Insights, Users & Teams | RBKC Adults managers maintain approvals/reablement oversight for the Outstanding-rated service. | Dashboard counts and priority list stay within RBKC adults; Team Insights gated by `aiInsights`; approvals monitor high-risk flagging. |
| Marcus (housing_officer) | Housing (RBKC) | Home, My Notes, Smart Capture, Upload, Templates | RBKC Housing pilot domain; no cross-domain toggle. | Uses practitioner dashboard variant; Smart Capture/Templates gated by `smartCapture` / `housingPilot`. |
| Priya (admin) | Corporate | Configuration, Modules, Analytics, Users & Teams | Bi‑borough Digital & Innovation directorate overseeing Westminster & RBKC, with module toggles for housing/AI pilots. | Admin toggles gate Smart Capture, AI Insights, Housing Pilot; nav hides disabled modules immediately; analytics surface bi‑borough telemetry. |

Feature flags (Admin → DemoContext):
- `smartCapture`: hides nav/record page; record renders disabled state with CTA.
- `aiInsights`: hides Insights nav; Insights page shows disabled hero + snapshot.
- `housingPilot`: hides housing templates; Templates page shows pilot-off notice.

Rules of thumb
- Social workers never see team approvals, global scope, or cross-domain data.
- Managers see approvals and team metrics, but stay within their domain unless explicitly widened.
- Admin can see everything and is the only role that can toggle modules.
