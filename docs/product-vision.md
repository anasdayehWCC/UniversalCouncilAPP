# Universal Council App — Product Vision

## What It Is

A mobile-first platform that replaces pen-and-paper note-taking for UK council social workers. One app, many departments — configurable per council, per team, per use case. Not a meeting recorder. A professional case tool that happens to capture audio.

The core loop: **capture → transcribe → structure → review → export**. Everything else supports this loop or lets administrators configure it without writing code.

## Who It's For

**Social workers (primary user):**
Stressed, always on the move — home visits, schools, court. They need to capture conversations fast and produce compliant case notes without spending hours at a desk typing them up. Success = they prefer this to pen and paper and feel their data is safe.

**Team managers:**
Overseeing 6-8 social workers. Need visibility into caseload, a review queue that doesn't require switching between windows, and a dashboard that shows who needs support. Success = they spot problems before they escalate.

**Council IT/digital admins:**
Need to onboard departments via configuration, not code changes. Module toggles, branding, role management, audit trails — all through a console. Success = new department live in under a day with zero developer involvement.

## What Premium Means

- **Fast**: 3 taps to start recording. Transcription within minutes, not hours. Page loads under 2 seconds.
- **Calm**: Clean, uncluttered UI. No walls of text, no enterprise dashboard clutter. White space is a feature, not a waste.
- **Trustworthy**: Offline-first. Data never lost. Clear status indicators at every step (recording, syncing, processing, ready). If something fails, the user knows immediately and knows what to do.
- **Beautiful**: Intentional typography, consistent spacing, fluid animations (with motion-reduce). Not "government app grey" — professional and modern while being accessible. Think Notion meets GOV.UK.
- **Adaptive**: Works on a phone in a car park, works on a laptop in the office. Dark mode, high contrast, screen reader compatible. Mobile is the primary viewport, not an afterthought.

## What Done Looks Like

1. A social worker can record, review, edit, and export a case note end-to-end — including offline
2. A manager can review, approve, and track team compliance from a single dashboard
3. An admin can onboard a new department and configure modules with zero code changes
4. All three feel fast, beautiful, and trustworthy — not like a prototype

## Design Principles

**Substance over decoration.** Every element earns its place. No decorative borders, no gratuitous shadows, no visual noise. If removing something doesn't hurt usability, remove it.

**Information density done right.** Show what matters at a glance. Use progressive disclosure for details. A dashboard that shows 3 clear numbers beats one that shows 20 ambiguous charts.

**Consistent rhythm.** Use the spacing scale. Align to the grid. Respect the type hierarchy. When something feels "off," it's usually inconsistent spacing or weight, not missing colour.

**Motion with purpose.** Animate to communicate state changes (recording started, sync complete, error occurred), not to impress. Always respect `prefers-reduced-motion`. A fade-in that takes 150ms is better than a bounce that takes 500ms.

**Mobile-first, always.** Design for 375px first. Desktop is the luxury viewport, not the default. If it doesn't work with a thumb on a 5.8" screen, it doesn't work.

**Calm confidence.** The app should feel like a trusted tool, not a demanding system. Notifications are informational, not alarming. Errors are helpful, not accusatory. Empty states are inviting, not bare.

## Prioritisation Guidance for Agents

When deciding what to work on, use this priority order:

1. **Ship-blockers** — Features that are broken, mock-only, or prevent real usage (e.g., admin state not persisted, templates can't be edited, core flows broken)
2. **Core user flows** — End-to-end paths real users execute daily (record → transcribe → review → export)
3. **Integration completeness** — Frontend built but no backend, or vice versa
4. **Design & UX quality** — Does it look premium? Is it intuitive? Does it match the design principles above?
5. **Housekeeping** — Refactoring, file organisation, stale code cleanup, technical debt
6. **Polish & compliance** — Accessibility edge cases, theme token migration, lint cleanup

Never prioritise category 6 when categories 1-3 have open items. A functioning app with a few aria-label gaps ships; a perfectly compliant app with mock backends doesn't.

## How to Use This Document

- **Orchestrator**: Read this during ASSESS to inform prioritisation. Include the "What Premium Means" section in every agent brief.
- **Review board**: Assess findings against this vision. "Does this make the app more trustworthy/fast/calm?" ranks higher than "is this WCAG compliant?"
- **Sub-agents**: Read the design principles before making UI decisions. When in doubt, choose calm over clever, fast over feature-rich.
- **Brainstorming**: Start every design session by checking the proposed feature against "What Done Looks Like."
