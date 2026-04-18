---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design in small sections (200-300 words), checking after each section whether it looks right so far.

## The Process

**Understanding the idea:**
- Check the current project state first:
  - `docs/product-vision.md` — what the app is, who it's for, what premium means, design principles
  - `ROADMAP_social_care.md` — what's planned and what's done
  - `CHANGELOG.md` (last 200 lines) — recent work
  - `git log --oneline -20` — recent commits
  - `docs/production-backlog.md` — known gaps and bugs
  - `CLAUDE.md` — project rules and patterns
- Before exploring approaches, check the proposed feature against `docs/product-vision.md`:
  - Does it advance one of the "What Done Looks Like" goals?
  - Does it align with the design principles?
  - Where does it sit in the prioritisation matrix?
- Ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible, but open-ended is fine too
- Only one question per message — if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria

**Exploring approaches:**
- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why
- For frontend features, note that designs must account for:
  - Theme tokens (`text-foreground`, `bg-card`, `text-muted-foreground`) — never hardcoded Tailwind colors
  - Accessibility (motion-reduce on animations, aria-labels on icon buttons, WCAG 2.2 AA contrast)
  - Z-index scale from `lib/z-index.ts` (Header z-40, Modals z-50, Banners z-60, Toasts z-100)
  - Hydration safety (`isMounted` guard for client-only APIs like `useNetworkStatus`, Dexie, `navigator.onLine`)
  - API proxy pattern (always `/api/proxy`, never direct backend URLs)
- For backend features, note:
  - Config-driven patterns (YAML + JSON schema validation)
  - Service abstractions (queue/storage providers for Azure and local dev)
  - Alembic migration requirements for schema changes
  - RequestContext filtering pattern for multi-tenancy

**Presenting the design:**
- Once you believe you understand what you're building, present the design
- Break it into sections of 200-300 words
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

## After the Design

**Documentation:**
- Write the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Commit the design document to git

**Implementation (if continuing):**
- Ask: "Ready to set up for implementation?"
- Use `/writing-plans` to create a detailed implementation plan from the design
- Or use `/orchestrate` if the work can be parallelized across sub-agents

## Key Principles

- **One question at a time** — Don't overwhelm with multiple questions
- **Multiple choice preferred** — Easier to answer than open-ended when possible
- **YAGNI ruthlessly** — Remove unnecessary features from all designs
- **Explore alternatives** — Always propose 2-3 approaches before settling
- **Incremental validation** — Present design in sections, validate each
- **Be flexible** — Go back and clarify when something doesn't make sense
