# User Journeys & UX Flows — Universal Council App

> Source-of-truth for how real people move through the Minute-based universal council app across web and mobile. Social care is the first vertical, but these journeys are designed to stay valid as we add other departments (housing, SEND, etc.) via config and modules.

# User Journeys & Personas

## Personas

### 1. Sarah — The Social Worker
- **Role:** Frontline practitioner in Children’s Services.
- **Context:** Always on the move (home visits, schools, court). Uses a laptop in the office/car and a mobile phone for quick checks.
- **Goals:** Spend less time typing notes, more time with families. Needs accurate records but hates "admin".
- **Pain Points:** Double entry (notebook -> system), fear of losing data, complex forms.
- **Emotions:** Stressed by caseload, anxious about compliance, relieved when tech "just works".

### 2. David — The Team Manager
- **Role:** Manages a team of 6-8 social workers.
- **Context:** Office-based but often in meetings.
- **Goals:** Ensure team compliance, quality assurance of notes, quick approvals.
- **Pain Points:** Chasing overdue notes, reading poorly written records, lack of visibility.
- **Emotions:** Protective of team, frustrated by bottlenecks.

### 3. Priya — The Digital Admin
- **Role:** IT/Digital lead for the Council.
- **Context:** Manages software configuration and user access.
- **Goals:** Enable new departments without code changes, ensure security/governance.
- **Pain Points:** Vendor lock-in, hard-coded changes, managing multiple disparate apps.

---

## Journeys

### SW1: Capture & Triage (The "Magic Note" Flow)
**Goal:** Capture a conversation securely and offload the mental burden of remembering details.

1.  **Start:** Sarah finishes a home visit. She opens the app on her phone (or laptop in the car).
2.  **Action:** Taps the big "Record" button.
3.  **Context:** She selects "In-Person Visit" (vs Online).
4.  **Capture:** The app records audio. She sees a reassuring waveform.
5.  **Finish:** She taps "Stop". The app immediately says "Safe & Uploaded".
6.  **Triage:** She can add a quick title (e.g., "Visit to Smith Family") or tag it "Urgent".
7.  **Outcome:** She closes the app, knowing the data is safe. The backend starts transcription and diarization.

### SW2: Deep Work (Minute Editor)
**Goal:** Turn the raw recording into a professional case note.

1.  **Start:** Sarah is back at her desk. She opens the "Minutes" tab.
2.  **Selection:** She sees the "Smith Family" recording is "Ready". She clicks it.
3.  **Template:** She selects the "Statutory Visit" template.
4.  **Drafting:** The AI pre-fills the template sections (Purpose, Observations, Analysis, Plan) based on the transcript.
5.  **Refining:**
    - She reads the "Analysis" section. It's good but misses a nuance.
    - She highlights a sentence and clicks "Edit with AI" -> "Make more strengths-based".
    - She verifies a quote by clicking the timestamp; the audio plays from that exact moment.
6.  **Finalize:** She marks it as "Complete" and clicks "Export to Case System" (or "Push to Planner").

### TM1: Supervision & Review
**Goal:** Review and approve team notes efficiently.

1.  **Start:** David logs in. His dashboard shows "3 Notes Awaiting Approval".
2.  **Review:** He opens Sarah's "Smith Family" note.
3.  **Comment:** He highlights a section in the "Plan" and adds a comment: "Please clarify the timeline for the referral."
4.  **Action:** He marks the note as "Changes Requested".
5.  **Outcome:** Sarah gets a notification. She fixes it, and David approves it later.

### Admin1: Config & Onboarding
**Goal:** Enable a new "Housing" department pilot.

1.  **Start:** Priya opens the Admin Console.
2.  **Config:** She creates a new Tenant Config for "Housing Pilot".
3.  **Modules:** She enables "Transcription", "Minutes", and "Tasks". She disables "Care Assessment" templates.
4.  **Theming:** She uploads the Housing department logo and sets the accent color to Teal.
5.  **Deploy:** She saves the config.
6.  **Outcome:** Housing staff log in and see a Teal-themed app with only the relevant modules and templates. No code was deployed.


## 1. Personas & Channels

### 1.1 Core personas

- **Social Worker (field practitioner)** – spends much of the week on visits and calls; primary user of capture and review flows on both phone and laptop.
- **Manager / Practice Lead** – reviews notes, signs off minutes, monitors workload and quality; mostly desktop/laptop but occasionally mobile.
- **Admin / Configuration Owner** – manages templates, modules, and tenant configuration; largely desktop/laptop, no capture on mobile.
- **QA / Audit / Safeguarding** – spot-checks notes for quality and compliance; heavy use of search, filters, and evidence links.
- **Digital / IT / Super Admin** – owns tenants, environments, and module rollout; uses admin console and telemetry dashboards.

### 1.2 Channels & touchpoints

- **Mobile phone (PWA + RN shell)** – used during or immediately after visits; must handle intermittent or no connectivity.
- **Laptop / desktop (web)** – used before and after contact to prepare, review, edit, export, and manage tasks.
- **Notifications & email** – “Your note is ready”, follow-up reminders, QA feedback.
- **Case management system / M365** – downstream systems where exports and tasks land (SharePoint, Planner, case notes).

---

## 2. Universal Journeys (All Roles)

These journeys exist for every persona and are reused across departments via config-driven navigation and modules.

### 2.1 Sign-in and context selection

**Journey map**

- **Before sign-in**
  - Actions: User opens the council shortcut (desktop) or app icon (mobile).
  - Thoughts: “I hope this just logs me in with my council account.”
  - Pain points: Multiple logins, confusion about environments or tenants.
  - Opportunities: Clear “Council / Department” labelling, SSO, quick environment indicator.
- **Sign-in**
  - Actions: Entra login, consent, redirect back.
  - Thoughts: “Am I in the right tenant and team?”
  - Pain points: Being dropped into a generic home page with no case or department context.
  - Opportunities: Immediately surface tenant name, department (e.g. “Children’s Social Care”), and role.
- **Landing**
  - Actions: User lands on a role-aware home screen (see §6).
  - Thoughts: “Can I quickly see what I need to do today?”
  - Opportunities: Show “My notes / My tasks / Quick record” cards, not a blank dashboard.

**User flow (web + mobile)**

1. User navigates to the universal council app URL or opens the mobile app.
2. If not authenticated, app redirects to council Entra login.
3. On return, app resolves `tenant` and `serviceDomain` from claims/config and loads a **role-specific home**:
   - Social worker: “My notes”, “Record”, “Upload audio” cards.
   - Manager: “Team notes”, “Flagged reviews”, “Insights”.
   - Admin: “Config & templates”, “Users & teams”.
4. Top-of-screen context chip shows `[Council] · [Department] · [Team]`; clicking lets the user switch (subject to permissions).

### 2.2 Device continuity & offline awareness

**Journey map**

- **Start on one device**
  - Social worker begins recording or reviewing on phone.
  - Thoughts: “If the signal drops, I don’t want to lose this.”
  - Pain points: Unclear whether the recording is safely stored; anxiety about closing the app.
  - Opportunities: Explicit “Saved locally / Upload pending / Synced” states, matching the “Record → Keep safe → Use later” mental model.
- **Continue on another**
  - User later opens laptop to review, edit, and export.
  - Pain points: Not seeing offline-captured work appear; confusion about upload progress.
  - Opportunities: Timeline of notes with clear status chips (“Uploading 50%”, “Processing”, “Ready to review”).

**User flow**

1. Capture views (mobile/web) always write to an offline queue first, with a visible status banner.
2. When connectivity is available, background sync promotes items; the list and detail screens show the same states across devices.
3. When a note is ready, user gets a subtle toast in-app and, optionally, an email notification: “Your Magic Note–style summary is ready for [Case/Visit].”

### 2.3 Appearance and account continuity

**Journey map**

- **Open settings**
  - Actions: User opens the appearance shortcut in the header or the `/settings` route.
  - Thoughts: “I want this account to stay light or dark the way I left it.”
  - Pain points: Shared devices, mixed visual states, no durable place to change theme.
  - Opportunities: One account-scoped appearance setting, clear source/sync state, live preview.
- **Change theme**
  - Actions: User switches between light, dark, and system.
  - Thoughts: “The whole shell should update immediately.”
  - Pain points: Only some cards changing, or a toggle that only works until reload.
  - Opportunities: One shared theme provider, `.dark` as the canonical selector, and a quick toggle that updates all surfaces.
- **Switch persona**
  - Actions: The user switches persona or account on a shared browser.
  - Thoughts: “My settings should follow the account, not the machine.”
  - Opportunities: Theme preference rehydrates from the signed-in user record, with local cache used only as a bootstrap/fallback.

**User flow**

1. User opens `/settings` from the header or user menu.
2. They choose `Light`, `Dark`, or `System` and see the preview update immediately.
3. The preference is saved locally first, then synced to the signed-in account when the backend is reachable.
4. If the user changes persona, the app switches to that persona’s stored appearance preference instead of reusing the previous one.

### 2.4 Shell contract and resilience overlays

**Journey map**

- **Header stability**
  - Actions: User opens long pages such as notes, minutes, or capture flows.
  - Pain points: Header being pushed off-screen or the page growing indefinitely.
  - Opportunities: One shell viewport contract, sticky header, and route content that scrolls inside the shell instead of redefining viewport math.
- **Sync banner**
  - Actions: Connectivity or sync state changes.
  - Pain points: Banners covering the header or blocking primary navigation.
  - Opportunities: Compact top-docked banner with expand/collapse controls that sits below the header safe area.

**User flow**

1. Shell renders at `100dvh` and keeps the header fixed in the layout.
2. Route content scrolls inside the main content area instead of changing the overall page height.
3. Resilience banner appears in a docked overlay below the header and can be expanded or dismissed without hiding primary navigation.
4. Contextual assistant tools dock through the page shell as inspector panels; they must not use fixed rails that force route-level margin hacks.
5. Selection-heavy journeys such as templates rely on explicit selection with a stable preview panel, not hover-only preview behavior.

---

## 3. Social Worker Journeys (Children’s & Adults Social Care)

### SW1 — In-person home visit (mobile, offline-first)

**Journey map**

- **Before the visit**
  - Actions: Review case on laptop, glance at prior notes, confirm address and participants.
  - Thoughts: “What do I need to cover, and what’s changed since last time?”
  - Pain points: Flipping between windows, trying to keep prompts and statutory headings in mind.
  - Opportunities: Quick “visit brief” on mobile (last note summary + key risks + agenda).
- **Arrival & consent**
  - Actions: Open app on phone, tap **Record**, choose **In person**.
  - Thoughts: “Have I clearly asked for permission to record?”
  - Pain points: Remembering to ask, documenting consent.
  - Opportunities: Modal showing **In person / Online or hybrid** with “Get permission before recording” note and one-tap consent status.
- **During the visit**
  - Actions: Tap **Start**, keep the phone unobtrusive; optionally pause.
  - Thoughts: “Is this definitely recording? Will this work offline?”
  - Pain points: Poor signal, battery anxiety, cognitive load from UI noise.
  - Opportunities: Big single-purpose screen with timer, waveform, and offline/online indicator (mirroring the Magic Notes recording screens).
- **After the visit (still mobile)**
  - Actions: Tap **Save**; choose case and meeting type; add quick tags.
  - Thoughts: “Is it safely stored? Do I need to stay online?”
  - Pain points: Fear of losing audio before it syncs.
  - Opportunities: Clear “Saved on this device” then “Uploading…” then “Processing…” states; “Keep device unlocked” hint if needed.
- **Later (laptop)**
  - Actions: Open web app; click the new “Care assessment” note with status “Drafting your note…”; then review the finished minute.
  - Opportunities: Tabbed layout (“Summary”, “Recording & transcript”, “Care assessment”, “Supervision”, “Care review”), AI edit sidebar, and one-click exports.

**User flow — mobile (offline-first)**

1. From home screen, tap the prominent **Record** card.
2. Modal appears: **In person** vs **Online or hybrid** with “Get permission before recording” text and subtle illustrations.
3. After choosing **In person**, app shows a simple consent confirmation (checkbox or quick “Permission confirmed” button).
4. The recording screen displays:
   - Timer and waveform.
   - Large **Pause** and **Save** buttons.
   - Offline/online badge (“Offline – will upload later” / “Online – saving to cloud”).
5. On **Save**, app:
   - Queues the recording locally with meeting metadata.
   - Shows “Keep safe” state (e.g., banner: “Saved on this device. Will upload when you’re online.”).
6. When back online, the sync banner switches to “Uploading 50% → 100% → Processing recording”.

**User flow — laptop (review & export)**

1. From **My notes**, the new visit appears at the top with a status chip (“Drafting…”, then “Ready to review”).
2. Clicking the note opens a layout similar to Magic Notes:
   - Left: structured summary with headings (Overview, Managing risk, Actions).
   - Tabs for alternate templates (e.g. General, Care assessment, Supervision).
   - Right: “Edit with AI” sidebar with quick actions (change tone, fix spelling, rewrite section).
3. The user edits in-place, asks AI to rephrase or tighten sections, and confirms.
4. Finally, they export to Word/PDF and push to SharePoint/Planner in one click.

### SW2 — Online or hybrid meeting (laptop-first, optional phone support)

**Journey map**

- **Before call**
  - Actions: Open the app on laptop, schedule or prepare a recording.
  - Opportunities: “Record virtual meeting” option with clear instructions (e.g., join call, then press record).
- **During call**
  - Actions: Use web mic capture or meeting integration; monitor that recording is active.
  - Pain points: Losing focus due to complex UI; wondering if the call is being captured.
  - Opportunities: Simple overlay/indicator: “Recording in progress – 00:04”.
- **After call**
  - Actions: Same review + edit + export flow as SW1.

**User flow — web**

1. From home screen, click **Create report** or **Record**, then select **Online or hybrid**.
2. Modal shows instructions and emphasises consent; user confirms.
3. App either:
   - Opens a recording bar pinned to the bottom of the screen while the worker uses the meeting tab, or
   - Shows a dedicated recording page with minimal controls.
4. After **Save**, the rest of the flow mirrors SW1: queue → transcription → minute → AI edits → export.

### SW3 — Upload existing audio and generate a note

**User flow — web**

1. From **My notes**, click the **Upload audio** card.
2. Drag-and-drop (or choose) a file; select case, template, and processing mode (fast/economy).
3. App shows upload progress and then “Drafting your note…” state in the notes list.
4. When complete, worker reviews and edits the output exactly as in SW1/SW2.

### SW4 — Follow-up actions and task management

**User flow — web**

1. Inside a note, worker opens the **Tasks** tab which now shows structured cards with owner chips (“Social worker”, “Manager”), due dates, and status pills (“To do”, “In progress”, “Done”).
2. They confirm or edit each task inline (description, owner, due date). The “Push to Planner” CTA shows sync state per task (spinner, success tick, or retry) and inherits the tenant’s Planner plan/bucket from config.
3. From **My tasks** (`/tasks`), worker sees cross-note tasks with filters (case, status, due date), inline “Mark done” controls, and planner-link badges when downstream sync has completed.

---

## 4. Manager & QA Journeys

### M1 — Manager review and sign-off

**Journey map**

- **Before review**
  - Actions: Manager opens app on laptop, sees “For review” queue.
  - Pain points: Too many channels (email, case system, shared drives).
  - Opportunities: Single “Review queue” with filters and status chips.
- **During review**
  - Actions: Open note; scan summary; drill into transcript sections as needed.
  - Opportunities: Contextual tabs (“Summary”, “Care assessment”, “Supervision”) and evidence links that jump to audio at the right timestamp.
- **After review**
  - Actions: Approve, request changes, or flag for QA.

**User flow — web**

1. Manager lands on a home screen with a **For review** panel and counts per domain.
2. Clicking a note opens the same layout as the worker, but with:
   - Review actions (approve / request changes / flag).
   - Comment threads at paragraph or section level.
3. Manager can leave comments that notify the original worker and are visible alongside the note.

### M2 — QA / audit spot check

**User flow — web**

1. QA persona uses advanced search (Phase 38) to find notes by domain, template, risk, or tags.
2. Within a note, QA can:
   - Jump between summary statements and source transcript segments.
   - Run “Source check” (Phase 28) on sensitive paragraphs to confirm alignment with evidence.
3. Findings are recorded as comments or QA flags and may feed into training/feedback loops.

---

## 5. Admin / Configuration / Telemetry Journeys

### A1 — Configure a new department or module

**User flow — web**

1. Admin opens the **Admin** module (Phase 19B) and selects **Departments & modules**.
2. They choose a template pack (e.g. “Adults social care”) or start from a base config.
3. Through a wizard, they define:
   - Department name and IDs.
   - Enabled modules (Transcription, Notes, Tasks, Insights).
   - Default templates and export destinations.
4. Changes are versioned, require approval, and are logged in the audit trail.

### A2 — Monitoring adoption and health

**User flow — web**

1. Admin opens **Insights / Telemetry** (Phases 24 & 36).
2. Dashboards display metrics per tenant/domain: recordings/day, offline queue health, export failures, AI usage.
3. From these views, they can spot underused features or departments needing support and adjust configuration or training.

---

## 6. Role-Specific Home Screens (Universal Shell)

These home screens are intentionally similar to the Magic Notes UI (large primary cards, clean typography) while remaining council-branded and accessible.

- **Social Worker dashboard**
  - Primary cards: **Create report**, **Record**, **Upload audio**.
  - Secondary sections: recent notes with status chips; “For follow-up” tasks; offline items waiting to sync.
- **Manager / QA dashboard**
  - Primary cards: **Review queue**, **Insights**, **Cases at risk**.
  - Secondary sections: team activity timeline; flagged notes; QA sampling tools.
- **Admin dashboard**
  - Primary cards: **Config & tenants**, **Templates**, **Users & teams**.
  - Secondary sections: config change log, feature flag status, telemetry snapshots.

Navigation and shell layout (sidebar / bottom nav) come from the module registry and tenant config, so adding a new department or feature module changes dashboards primarily via configuration rather than bespoke routing code.

---

## 7. Mapping Journeys to Roadmap Phases

This section ties journeys to concrete delivery phases, so we can see how UX intent, architecture, and implementation line up.

- **SW1/SW2/SW3** depend on:
  - Phase 4 (Offline/PWA capture) – capture flows and offline queue.
  - Phase 5 (Diarization) – speaker labels and timestamps powering evidence links.
  - Phase 6 (Templates) – social care templates including assessment/supervision/review sections.
  - Phase 7 (Evidence UX) – citation jumps between minutes and transcripts.
  - Phase 8 (Exports) – SharePoint/Planner integration.
  - Phases 22, 25, 27, 28, 29, 32, 33, 34 – mobile maturity, premium shell, recording studio UX, AI writing assistant, contextual tabs, advanced offline, cross-platform UI kit, and RN shell.
- **M1/M2** depend on:
  - Phases 19, 24, 28, 29, 36, 38, 39 – admin console, insights, source check, content organisation, telemetry dashboards, search, and compliance tools.
- **Admin journeys (A1/A2)** depend on:
  - Phases 16, 19, 20, 21, 24, 30, 35, 36, 39 – config system, admin console, multilingual support, tasks, insights, universal module registry, admin dashboards, telemetry, and governance tools.

This document should be kept in sync with:

- `minute-main/ROADMAP_social_care.md` (phases 1–40).
- `PLANS.md` (exec plan and progress).
- `minute-main/docs/architecture.md` and `minute-main/docs/universal_council_architecture.md` (structural architecture).
