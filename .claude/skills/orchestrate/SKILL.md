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
1. ROADMAP_social_care.md          — all phases and requirements
2. CHANGELOG.md (last 200 lines)   — what's been done recently
3. git log --oneline -30            — recent commit history
4. CLAUDE.md                        — project rules and patterns
5. AGENTS.md                        — development guardrails
6. docs/production-backlog.md       — tasks discovered by review board and sub-agents
```

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

---

## Phase 2: IDENTIFY — Select Independent Work Items

From the status table, find work items that satisfy ALL of:

1. Status is "Not Started" or "Partial"
2. No dependency on another incomplete phase
3. Touches different files/directories than other selected items
4. Can be completed in a single focused session

**Independence rules** (critical for parallel safety):
- Frontend-only tasks can run parallel to backend-only tasks
- Different route directories (`src/app/X/` vs `src/app/Y/`) can run in parallel
- Component work in different folders can run in parallel
- Config/schema work should NOT run parallel to route work that reads config
- Database migration tasks must run sequentially, never in parallel

Select **3-5 items** maximum. Prefer a mix of frontend and backend.

If the user specified a focus area (e.g., `/orchestrate phase 38`), prioritize that area but still find parallel work in other areas.

Present selected items to user for approval before dispatching.

---

## Phase 3: PLAN — Write Sub-Agent Briefs

For each approved work item, write a detailed brief containing:

### Brief Template

```markdown
## Task: [Phase X — Short Title]

### What to Build
[Specific requirements from ROADMAP_social_care.md, quoted or paraphrased]

### Files to Create/Modify
- Create: `exact/path/to/new-file.tsx`
- Modify: `exact/path/to/existing-file.tsx` (lines ~X-Y)
- Test: `exact/path/to/test-file.test.ts`

### Project Rules That Apply
[Copy relevant rules from CLAUDE.md, e.g.:]
- Use semantic tokens (text-foreground, bg-card) not hardcoded colors
- Pair animate-spin with motion-reduce:animate-none
- Icon buttons need aria-label
- Use ZINDEX constants from lib/z-index.ts

### How to Test
- Run: `pnpm --filter universal-app lint`
- Run: `pnpm --filter universal-app test:run`
- Run: `pnpm --filter universal-app build`
- [Any specific test commands]

### Scope Boundary
DO NOT modify files outside these directories: [list]
DO NOT add new dependencies without noting them in your report
DO NOT modify CHANGELOG.md or CLAUDE.md (orchestrator handles this)

### Report Format
When done, report:
1. What you implemented (with file paths)
2. Test results (paste output)
3. Any learnings (trigger/rule/verify format)
4. Any concerns or deviations from the brief
5. **Discovered tasks** (IMPORTANT — see below)

### Discovered Tasks Protocol
While working, you may notice things OUTSIDE your assigned scope that need attention:
- A missing feature referenced by your code
- A bug in an adjacent component
- An accessibility gap in a related page
- A TODO comment that should be tracked
- An integration point that doesn't exist yet
- A test that should exist but doesn't

For EACH discovery, report it in this exact format:
  DISCOVERED: [category] [severity]
  Description: [what's missing or broken]
  Location: [file path or route, if known]
  Suggested action: [what should be done]

Categories: bug, feature, refinement, a11y, performance, security, test, docs
Severity: critical, high, medium, low

DO NOT fix these yourself — just report them. The orchestrator collects
them into the production backlog for future runs.
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

Launch a review agent per completed task:

```
Agent({
  description: "Review spec compliance for [task]",
  subagent_type: "senior-code-reviewer",
  prompt: "Review whether this implementation matches its spec.
    
    SPEC: [paste the original brief]
    
    AGENT REPORT: [paste agent's report]
    
    BRANCH: [branch name from worktree]
    
    Check the actual code on this branch. Verify:
    - All requirements met (nothing missing)
    - No extra unneeded work (YAGNI)
    - Theme tokens used (no hardcoded colors)
    - Accessibility rules followed (aria-labels, motion-reduce)
    - Tests exist and are meaningful
    
    Report: ✅ Compliant or ❌ Issues: [list with file:line refs]"
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

### 5c. Fix issues

If reviewers found issues, dispatch fix agents targeting specific problems.
Do NOT proceed to integration with open issues.

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
