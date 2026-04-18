---
name: orchestrate
description: Development orchestrator that reads the roadmap, identifies independent work items, dispatches parallel sub-agents in worktrees, reviews output, and creates PRs. Trigger with /orchestrate or /orchestrate [phase/area].
---

# Development Orchestrator

Autonomous development driver for the Universal Council App. Reads the roadmap, identifies what's done vs remaining, selects independent parallelizable work, dispatches sub-agents in isolated worktrees, reviews/critiques their output, merges, and creates a PR.

**Announce:** "Running the development orchestrator..."

## When to Use

- User wants to advance the project toward production readiness
- User triggers `/orchestrate` (optionally with a phase number or area focus)
- User wants to parallelize independent development tasks

## Core Principles

1. **Never commit directly to main** — always create PRs
2. **Sub-agents must be independent** — no agent depends on another's output
3. **Learning loop is mandatory** — every agent reports learnings
4. **Review before merge** — orchestrator critiques all sub-agent work
5. **Document everything** — CHANGELOG, CLAUDE.md, session notes updated

---

## Phase 1: ASSESS — Build the Status Map

Read these files to understand current state:

```
1. docs/product-vision.md           — what the app is, who it's for, what premium means
2. ROADMAP_social_care.md           — all phases and requirements
3. CHANGELOG.md (last 200 lines)    — what's been done recently
4. git log --oneline -30             — recent commit history
5. CLAUDE.md                         — project rules and patterns
6. AGENTS.md                         — development guardrails
7. docs/production-backlog.md        — tasks discovered by review board and sub-agents
8. .claude/orchestrator-claims.json  — tasks claimed by concurrent sessions
```

**Read `docs/product-vision.md` FIRST.** It defines what "done" looks like and the prioritisation guidance. Every decision in this run should be informed by it.

Build a status table with columns: `Phase | Status | Key Remaining Work | Dependencies`

**Backlog integration**: If `docs/production-backlog.md` exists, read it and incorporate
high-priority backlog items (severity: critical or high) into the work selection.
Backlog items are prioritized alongside roadmap phases — a critical backlog bug
outranks a low-priority roadmap feature.

Status values:
- **Done** — mentioned as completed in CHANGELOG or roadmap status notes
- **Partial** — some work done but gaps remain
- **Not Started** — no evidence of implementation

Present this table to the user as a quick summary.

**Claims check**: Read `.claude/orchestrator-claims.json`. If `claimed` is non-empty, report which tasks are already claimed by another session and exclude them from work selection. If a claim has a `claimedAt` timestamp older than 2 hours, treat it as stale (the claiming session likely crashed) — remove stale claims and note this in the summary.

**Housekeeping scan**: Alongside feature work, look for systemic issues:
- Scattered utility files that should be consolidated
- Duplicate component patterns that should be extracted to the shared UI kit
- Stale branches or worktrees from previous runs
- `console.log` statements left from debugging
- TODO/FIXME comments that should be tracked in the backlog
- File/folder organisation that drifts from the documented conventions

If housekeeping items are found, note them in the status summary. Every 3rd orchestration run, allocate one work package specifically to cleanup — a real senior developer tidies as they go.

---

## Phase 2: IDENTIFY — Select Work Packages

### Prioritisation Matrix (mandatory — follow this order)

Read `docs/product-vision.md` section "Prioritisation Guidance for Agents" and apply it:

1. **Ship-blockers** — Features that are broken, mock-only, or prevent real usage (e.g., admin state not persisted, templates can't be edited, core flows broken). If ANY ship-blockers exist, at least one work package MUST address one.
2. **Core user flows** — End-to-end paths real users execute daily (record → transcribe → review → export)
3. **Integration completeness** — Frontend built but no backend, or backend built but no UI
4. **Design & UX quality** — Does the app look premium? Is it intuitive? Does it match the design principles?
5. **Housekeeping** — Refactoring, file organisation, stale code cleanup, technical debt (every 3rd run)
6. **Polish & compliance** — Accessibility edge cases, theme token migration, lint cleanup

**NEVER prioritise category 6 when categories 1-3 have open items.** A functioning app with a few aria-label gaps ships; a perfectly compliant app with mock backends doesn't.

### Task Batching — Work Packages, Not Individual Tickets

Group tasks into **work packages**, not individual tickets. A work package is:
- 3-5 related tasks in the same domain area
- OR 2-3 tasks that share code paths or UI context
- Assigned to ONE agent who handles all of them in sequence within one session

**Why**: One agent with deep context builds more coherent, higher-quality code than 5 agents each making one isolated change. Context loading is expensive — reuse it.

**Batch by domain area**, not by file independence:
- **Recording domain**: capture, playback, offline sync, waveform, status indicators
- **Review domain**: queue, approval, annotations, manager dashboard, compliance
- **Admin domain**: modules, tenants, roles, audit trail, config persistence
- **Notes/Minutes domain**: editing, templates, export, versioning, AI generation
- **Platform domain**: auth, theme, config, API client, shared hooks, providers

One work package per domain area per run. **Max 3 work packages** — beyond 3, review quality drops and merge complexity rises.

### Independence Rules (for parallel safety)

- Different domain areas can run in parallel (recording + admin = safe)
- Frontend-only and backend-only work can run in parallel
- Config/schema work should NOT run parallel to route work that reads config
- Database migration tasks must run sequentially, never in parallel
- If two work packages touch the same shared file (layout, providers, hooks), run them sequentially

### Selection Process

1. Scan the status table for open items in priority categories 1-3
2. Group related items into domain-based work packages (3-5 tasks each)
3. Select up to 3 independent work packages from different domains
4. If the user specified a focus area (e.g., `/orchestrate admin persistence`), prioritise that domain but still find parallel work in other domains

Present selected work packages to user for approval before dispatching. For each package, explain:
- Which priority category it addresses (1-6)
- Why these tasks belong together
- What "done" looks like for this package (functional outcome, not just lint passing)

**Write claims**: After the user approves the selected items, immediately write them to `.claude/orchestrator-claims.json` before dispatching any agents:

```bash
cat > .claude/orchestrator-claims.json << 'CLAIMS'
{
  "claimed": [
    {"task": "[exact task description from roadmap]", "claimedAt": "YYYY-MM-DDTHH:MM:SSZ"},
    {"task": "[exact task description from roadmap]", "claimedAt": "YYYY-MM-DDTHH:MM:SSZ"}
  ]
}
CLAIMS
```

This prevents a concurrent `/orchestrate` session from selecting the same work items.

---

## Phase 3: PLAN — Write Sub-Agent Briefs

For each approved work package, write a detailed brief. Each brief covers the FULL work package (3-5 related tasks), not a single ticket. The agent handles them in sequence within one session.

### Brief Template

```markdown
## Work Package: [Domain Area — Short Description]

### Tasks in This Package
1. [Task description] — [priority category from product-vision.md]
2. [Task description]
3. [Task description]
Handle these in sequence. They share context and code paths — that's why they're bundled.

### Product Context
[WHY these tasks matter — what user problem they solve, from docs/product-vision.md]
[Which of the four "What Done Looks Like" goals this advances]
[What "premium" means for this specific feature area]

### Design Intent
[What the affected UI should LOOK and FEEL like — reference the design principles in product-vision.md]
[Name 1-2 existing components in the codebase that are good visual reference points]
[If the feature has UI: "Test it visually — open the browser, navigate to the affected route,
and verify it looks intentional and premium before reporting success."]

### Files to Create/Modify
- Create: `exact/path/to/new-file.tsx`
- Modify: `exact/path/to/existing-file.tsx` (lines ~X-Y)
- Test: `exact/path/to/test-file.test.ts`

### Similar Code to Reference
[Point to 1-2 existing files that follow the pattern this work should follow]
[E.g., "See src/components/review/ReviewQueue.tsx for how list views are structured"]
[E.g., "See minute-main/app/routes/minutes.py for the API contract pattern"]

### Project Rules That Apply
[Copy relevant rules from CLAUDE.md:]
- Use semantic tokens (text-foreground, bg-card) not hardcoded colors
- Pair animate-spin with motion-reduce:animate-none
- Icon buttons need aria-label
- Use ZINDEX constants from lib/z-index.ts
- [Add any domain-specific rules]

### Success Criteria
Beyond lint and build passing, this work package is done when:
- [ ] [Functional outcome — e.g., "Manager can approve a note without switching windows"]
- [ ] [Integration check — e.g., "Form submission persists to backend, not just local state"]
- [ ] [Visual check — e.g., "Dashboard looks clean at 375px and 1440px viewports"]
- [ ] [Edge case — e.g., "Handles empty state gracefully with helpful messaging"]

### How to Test
```bash
# Code quality
pnpm --filter universal-app lint
pnpm --filter universal-app build
pnpm --filter universal-app test:run

# Visual verification (mandatory for UI changes)
# Start dev server, open affected routes, check:
# - Does it look right at desktop and mobile viewports?
# - Do loading and error states render properly?
# - Does it match the design principles in product-vision.md?

# Backend (if applicable)
cd minute-main && poetry run pytest tests/ -x -q
```

### Scope Boundary
DO NOT modify files outside these directories: [list]
DO NOT add new dependencies without noting them in your report
DO NOT modify CHANGELOG.md or CLAUDE.md (orchestrator handles this)
If you find the backend API doesn't exist yet for a frontend feature, note it as a
discovered task — do NOT build a mock that hides the gap.

### Report Format
When done, report:
1. What you implemented (with file paths) — per task in the package
2. Test results (paste lint, build, test output)
3. Visual verification: did you check affected routes in the browser? What did you see?
4. Any learnings (trigger/rule/verify format)
5. Any concerns or deviations from the brief
6. **Discovered tasks** (IMPORTANT — see below)

### Discovered Tasks Protocol
While working, you may notice things OUTSIDE your assigned scope that need attention:
- A missing feature or API endpoint referenced by your code
- A bug in an adjacent component
- A visual/design issue on a related page
- An integration point that doesn't exist yet (frontend expects API that's not built)
- File organisation issues (duplicate patterns, scattered utils, stale code)
- A test that should exist but doesn't

For EACH discovery, report it in this exact format:
  DISCOVERED: [category] [severity]
  Description: [what's missing or broken]
  Location: [file path or route, if known]
  Suggested action: [what should be done]

Categories: bug, feature, refinement, a11y, performance, security, test, docs, housekeeping
Severity: critical, high, medium, low

DO NOT fix these yourself unless they are trivially small AND within your scope boundary.
The orchestrator collects discoveries into the production backlog for future runs.
```

---

## Phase 4: DISPATCH — Launch Sub-Agents

### 4a. Create integration branch

```bash
git checkout -b feature/orchestrate-YYYY-MM-DD main
```

### 4b. Dispatch agents in parallel

For each brief, dispatch using the Agent tool with `isolation: "worktree"`:

```
Agent({
  description: "Implement [Phase X task name]",
  subagent_type: "[appropriate type]",
  isolation: "worktree",
  prompt: "[full brief from Phase 3]"
})
```

**Agent type selection:**
- Frontend route/component work → `ui-engineer`
- Backend API/service work → `python-backend-engineer`
- TypeScript library/utility work → `ts-coder`
- Cross-cutting concerns → `general-purpose`

**Launch ALL independent agents in a single message** so they run concurrently.

### 4c. Wait for completion

All agents run in parallel. When each completes, it returns:
- A summary of what it did
- The worktree path and branch name (if changes were made)
- Or confirmation the worktree was cleaned up (if no changes)

---

## Phase 5: REVIEW — Critique Sub-Agent Output

For each agent that made changes:

### 5a. Spec compliance check

Launch a review agent per completed work package (not per individual task — one reviewer per package):

```
Agent({
  description: "Review [domain area] work package",
  subagent_type: "senior-code-reviewer",
  prompt: "Review whether this work package matches its spec and the product vision.
    
    PRODUCT VISION: [paste the 'What Premium Means' section from docs/product-vision.md]
    
    WORK PACKAGE SPEC: [paste the original brief]
    
    AGENT REPORT: [paste agent's report]
    
    BRANCH: [branch name from worktree]
    
    Check the actual code on this branch. Verify:
    1. FUNCTIONAL: All tasks in the package completed, features work end-to-end
    2. PRODUCT FIT: Does this advance the product vision? Does it feel premium?
    3. INTEGRATION: Are backend/frontend contracts aligned? Any mock data hiding a gap?
    4. DESIGN QUALITY: Theme tokens used, spacing consistent, mobile considered
    5. CODE QUALITY: No extra unneeded work (YAGNI), tests meaningful, no dead code
    6. ACCESSIBILITY: aria-labels, motion-reduce, contrast — but ONLY flag if genuinely broken
    
    Weight your review: functional completeness (40%), product fit (25%), integration (20%),
    code quality (10%), accessibility (5%). Do NOT spend the review on minor lint issues
    if the feature doesn't actually work.
    
    Report: ✅ Ship-ready or ❌ Issues: [list with file:line refs, sorted by weight]"
})
```

### 5b. Cross-agent conflict check

After all reviews complete, check for conflicts:

```bash
# For each agent branch, check for overlapping file changes
git diff --name-only main...[branch1]
git diff --name-only main...[branch2]
# Look for any files appearing in multiple branches
```

If conflicts exist: resolve them manually or dispatch a fix agent.

### 5c. Visual checkpoint (mandatory for UI changes)

After merging agent branches into the integration branch, start the dev server and actually look at the app:

```bash
pnpm --filter universal-app dev &
# Wait for server to be ready
```

For each route affected by the work packages:
1. Open `http://localhost:3000` in Chrome (via Chrome DevTools MCP or browser)
2. Navigate to the affected routes
3. Check at desktop (1440px) and mobile (375px) viewports
4. Ask yourself: **Does this look like something a social worker would trust?**
   - Is the spacing consistent? Is it readable? Is it calm?
   - Do loading states render properly or flash empty?
   - Does it match the existing design language or stick out?
5. Check dark mode if the feature touches themed surfaces

If something looks wrong — broken layout, misaligned elements, jarring visual inconsistency — this is a **higher priority fix** than lint warnings. Dispatch a fix agent with specific visual instructions.

Do NOT merge visually broken work just because lint passes.

### 5d. Fix issues

If reviewers or the visual checkpoint found issues, dispatch fix agents targeting specific problems.
Do NOT proceed to integration with open issues.
Fix agents should receive the review feedback AND the visual context (what looked wrong and why).

---

## Phase 6: INTEGRATE — Merge and Validate

### 6a. Merge branches

```bash
git checkout feature/orchestrate-YYYY-MM-DD
git merge [branch1] --no-edit
git merge [branch2] --no-edit
# ... for each agent branch
```

### 6b. Run full validation suite

```bash
# Frontend
pnpm --filter universal-app lint
pnpm --filter universal-app build
pnpm --filter universal-app test:run
pnpm --filter universal-app audit:premium-ui

# Backend (if backend changes)
cd minute-main && poetry run pytest tests/ -x -q

# Config validation (if config changes)
cd minute-main && poetry run python scripts/validate_configs.py
```

### 6c. Fix any failures

If validation fails, diagnose and fix. Run a targeted agent if needed.

---

## Phase 7: DOCUMENT — Update Project Records

### 7a. CHANGELOG.md

Add a dated entry at the top with:
- Section per phase/feature implemented
- List of what was added/fixed/changed
- Note that it was orchestrator-driven with parallel sub-agents

### 7b. CLAUDE.md

Add any new learnings from sub-agent reports in trigger/rule/verify format.
Only add genuinely new, non-obvious patterns.

### 7c. Production backlog

Collect all "DISCOVERED:" items from sub-agent reports and append them to
`docs/production-backlog.md`. Use this format:

```markdown
### [YYYY-MM-DD] Discovered during orchestration run

| # | Category | Severity | Description | Location | Source Agent |
|---|----------|----------|-------------|----------|-------------|
| N | bug      | high     | ...         | src/...  | Agent 2     |
```

Deduplicate against existing backlog entries. Skip items already addressed.

### 7d. Session notes

Update `.claude/notes/` with:
- What the orchestrator did this run
- Which phases were advanced
- Any issues encountered and how they were resolved
- Follow-up items for the next run

---

## Phase 8: PR — Create Pull Request

```bash
git push -u origin feature/orchestrate-YYYY-MM-DD
```

Create PR using:

```bash
gh pr create --title "[Orchestrate] Phase X, Y, Z — [summary]" --body "$(cat <<'EOF'
## Summary
- **Phase X**: [what was done]
- **Phase Y**: [what was done]
- **Phase Z**: [what was done]

## Sub-agents dispatched
- Agent 1: [task] — [result]
- Agent 2: [task] — [result]
- Agent 3: [task] — [result]

## Validation
- [ ] ESLint: passed
- [ ] Build: passed
- [ ] Unit tests: passed
- [ ] Premium UI audit: passed
- [ ] Backend tests: passed (if applicable)

## Learnings captured
- [any new CLAUDE.md entries]

## Next orchestration targets
- [phases that could be tackled next]

🤖 Generated with [Claude Code](https://claude.com/claude-code) Development Orchestrator
EOF
)"
```

### Release claims

After the PR is created (or if the run is aborted at any point), clear the claims file:

```bash
echo '{"claimed":[]}' > .claude/orchestrator-claims.json
```

Claims are released after PRs are open, not after merge. The ROADMAP status markers and CHANGELOG serve as the durable done signal.

---

## Repeat Pattern

After creating the PR, tell the user:
- What was accomplished
- What the PR contains
- What phases could be targeted next
- They can trigger `/orchestrate` again to advance further

---

## Safety Rails

- **Max 5 sub-agents per run** — more causes merge complexity
- **Never force-push** — only create new branches/PRs
- **Never skip review** — even if agents report success
- **Never merge to main** — only create PRs
- **Stop on ambiguity** — if requirements are unclear, ask the user
- **Respect scope** — only work on approved items
- **Preserve working state** — if integration fails, keep branches for manual resolution
- **Claim before dispatch** — always write `.claude/orchestrator-claims.json` before launching sub-agents; release claims after PR creation or run abort
