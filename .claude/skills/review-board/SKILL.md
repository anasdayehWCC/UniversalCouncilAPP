---
name: review-board
description: Adversarial production review board. Dispatches persona-based agents (social worker, manager, developer, QA, a11y auditor) who test the running app via browser, debate quality and completeness, and produce a prioritized backlog for the orchestrator. Trigger with /review-board.
---

# Adversarial Production Review Board

Simulates a cross-functional product team reviewing the app. Each persona agent independently tests the running app, critiques it from their perspective, and reports findings with confidence scores. The orchestrator then synthesizes, deduplicates, and writes a prioritized backlog.

**Announce:** "Launching the production review board..."

**Inspired by:** Anthropic's competing-hypotheses pattern — agents actively challenge each other's assumptions, and only findings that survive scrutiny make it to the backlog.

## When to Use

- After a round of development (post-orchestrate) to find gaps
- Before a demo or UAT to catch issues
- Periodically to maintain production quality
- When you want a "fresh eyes" audit of the current state

## Core Principles

1. **Adversarial by design** — personas are incentivized to find problems, not confirm success
2. **Evidence-based** — every finding must reference a specific route, component, or behavior
3. **Confidence-scored** — findings below 70/100 confidence are filtered out
4. **Backlog-first** — output is a structured task list, not a report to read and forget
5. **No code changes** — this skill only produces the backlog; `/orchestrate` acts on it

---

## Phase 1: PREPARE — Ensure the App Is Testable

Before dispatching agents, verify the app can be tested:

```bash
# Check if dev server is running
curl -s http://localhost:3000 > /dev/null 2>&1 && echo "Dev server running" || echo "Dev server not running"
```

If not running, tell the user:
> "The dev server needs to be running for browser-based testing. Start it with `pnpm --filter universal-app dev` in another terminal, then re-run `/review-board`."

Also read key context:
```
1. docs/product-vision.md             — what premium means, design principles, prioritisation
2. minute-main/docs/user_journeys.md  — persona definitions and expected flows
3. ROADMAP_social_care.md             — what should exist
4. docs/production-backlog.md          — existing known issues (avoid duplicates)
```

---

## Phase 2: DISPATCH — Launch Persona Agents

Dispatch **5 persona agents in parallel**, each with Chrome DevTools MCP access to test the running app at `http://localhost:3000`.

Each agent gets:
- Their persona identity and mandate
- The user journeys relevant to their role
- Instructions to navigate the app, test flows, and report findings
- The confidence scoring rubric

### Agent Dispatch Template

Launch ALL agents in a single message for parallel execution:

```
Agent({
  description: "[Persona]: Review as [role]",
  prompt: "You are [PERSONA NAME], [ROLE DESCRIPTION].

## Your Identity & Mandate
[Persona background, goals, pain points from user_journeys.md]

## Your Mission
Test the Universal Council App at http://localhost:3000 from YOUR perspective.
You are looking for problems — things that would frustrate you, block your work,
or fail to meet your needs. Be critical. Be specific. Be adversarial.

## How to Test
Use the Chrome DevTools MCP tools to:
1. Navigate to http://localhost:3000 using mcp__chrome-devtools__navigate_page
2. Take snapshots with mcp__chrome-devtools__take_snapshot to understand page structure
3. Click through your key workflows using mcp__chrome-devtools__click
4. Take screenshots with mcp__chrome-devtools__take_screenshot to document issues
5. Check console for errors with mcp__chrome-devtools__list_console_messages
6. Test responsive behavior with mcp__chrome-devtools__resize_page

## Workflows to Test
[List 3-5 specific user journeys for this persona from user_journeys.md]

## What to Look For (in priority order)
1. **Broken functionality** — flows that don't work, features that crash, data that doesn't persist
2. **Design quality** — does it look premium? Is spacing consistent? Does it feel calm and trustworthy?
   Reference the design principles in docs/product-vision.md. Ask: would a social worker trust this?
3. **Missing features** — things your persona needs that don't exist yet
4. **Confusing UX** — unclear labels, dead ends, too many clicks, cognitive overload
5. **Mobile experience** — test at 375px. Is it usable with a thumb?
6. **Error handling** — what happens when things go wrong? Are messages helpful?
7. **Performance** — slow loads, janky animations, layout shifts
8. **Accessibility** — contrast, keyboard nav, screen reader (important but lower priority
   than broken functionality — flag it, but don't fill your report with minor a11y issues
   when the feature itself doesn't work)

## Report Format
For EACH finding, use this exact format:

FINDING: [short title]
Confidence: [0-100] (how certain you are this is a real issue)
Category: [bug | ux | feature | refinement | a11y | performance | security]
Severity: [critical | high | medium | low]
Route: [/path where found]
Evidence: [what you observed — be specific]
Expected: [what should happen instead]
Screenshot: [reference if you took one]

Report at least 5 findings. Be thorough but honest with confidence scores.
A genuine medium-confidence finding is more valuable than a padded high-confidence one."
})
```

### The Five Personas

**1. Sarah — Social Worker (Field Practitioner)**
- Tests: SW1 (capture & triage), SW2 (minute editor), offline indicators
- Focus: Can I record, review, and export a note with minimal friction?
- Pain points: Too many clicks, confusing forms, fear of data loss

**2. David — Team Manager**
- Tests: TM1 (supervision & review), dashboard, review queue
- Focus: Can I see my team's work, review notes, and approve quickly?
- Pain points: No visibility, slow approvals, can't find what needs attention

**3. Priya — Digital Admin**
- Tests: Admin1 (config & onboarding), admin console, module management
- Focus: Can I configure tenants, manage modules, and see audit logs?
- Pain points: Hard-coded settings, no preview of changes, missing audit trail

**4. Dev — Senior Developer**
- Tests: Code quality signals visible in UI, error boundaries, console errors
- Focus: Are there runtime errors, broken imports, hydration mismatches, dead code?
- Pain points: Console errors, 404s, unhandled promise rejections, poor error messages

**5. Alex — QA / Accessibility Auditor**
- Tests: Keyboard navigation, screen reader compatibility, contrast, tap targets
- Focus: Does the app meet WCAG 2.2 AA? Can I navigate without a mouse?
- Pain points: Missing focus indicators, low contrast, no skip links, tiny tap targets

---

## Phase 3: SYNTHESIZE — Collect and Validate Findings

After all agents report back:

### 3a. Collect all findings

Parse each agent's report and extract all FINDING blocks.

### 3b. Filter by confidence

Remove findings with confidence < 70. These are likely noise or speculation.

### 3c. Cross-validate (adversarial step)

For findings with confidence 70-85, launch a quick validation agent:

```
Agent({
  description: "Validate finding: [title]",
  prompt: "A reviewer reported this issue:
    [paste finding]
    
    Navigate to [route] using Chrome DevTools MCP and verify whether this
    issue actually exists. Report:
    - CONFIRMED (with your own evidence) or
    - REJECTED (with why it's not actually an issue)
    
    Be skeptical. Only confirm if you can reproduce it."
})
```

Findings 85+ confidence pass without validation.

### 3d. Deduplicate

- Merge findings that describe the same issue from different personas
- Keep the highest-confidence version
- Note which personas independently found it (stronger signal)

### 3e. Prioritize

**Primary sort: impact category** (from `docs/product-vision.md` prioritisation guidance):
1. Ship-blockers (broken features, mock-only data, data loss risks) → always CRITICAL
2. Core user flow gaps (record/review/export can't be completed) → HIGH minimum
3. Integration gaps (frontend built but no backend, or vice versa) → HIGH
4. Design/UX quality (looks broken, inconsistent, or untrustworthy) → MEDIUM-HIGH
5. Polish/compliance (a11y edge cases, minor token issues) → MEDIUM-LOW

**Secondary sort:** number of personas who found it (cross-persona findings are higher signal), then confidence score.

**Rebalancing rule:** If more than 40% of confirmed findings are category 5 (polish/compliance), the review board is focused too narrowly. Re-examine whether the review missed functional or design issues by checking: can each persona actually complete their core workflow end-to-end?

---

## Phase 4: WRITE BACKLOG — Produce Structured Output

Write findings to `docs/production-backlog.md`:

```markdown
## [YYYY-MM-DD] Review Board Findings

**Reviewers:** Sarah (SW), David (TM), Priya (Admin), Dev, Alex (QA)
**App state:** [git commit hash]
**Findings:** X confirmed (Y filtered out)

### Critical

| # | Category | Description | Route | Found By | Confidence |
|---|----------|-------------|-------|----------|------------|
| 1 | bug      | ...         | /...  | Sarah, Dev | 95       |

### High

| # | Category | Description | Route | Found By | Confidence |
|---|----------|-------------|-------|----------|------------|
| 2 | ux       | ...         | /...  | David    | 88         |

### Medium

...
```

If the file already exists, append the new section. Do NOT overwrite previous findings.

---

## Phase 5: REPORT — Summarize to User

Present a concise summary:

```
Review Board Complete
━━━━━━━━━━━━━━━━━━━━
Personas: 5 dispatched
Raw findings: X
After filtering (confidence ≥ 70): Y
After validation: Z confirmed

Critical: N items
High: N items  
Medium: N items

Top 3 issues:
1. [title] — found by [personas] — [route]
2. [title] — found by [personas] — [route]
3. [title] — found by [personas] — [route]

Backlog written to: docs/production-backlog.md
Run /orchestrate to action these items.
```

---

## Safety Rails

- **Read-only** — this skill never modifies application code
- **Max 5 persona agents** — more adds cost without proportional value
- **Max 3 validation agents** — only for medium-confidence findings
- **Honest scoring** — never inflate confidence to make the report look better
- **No false urgency** — only mark "critical" if the app is broken or data is at risk
