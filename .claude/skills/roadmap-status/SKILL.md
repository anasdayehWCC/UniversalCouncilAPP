---
name: roadmap-status
description: Quick status check of the Universal Council App roadmap — what's done, in progress, and remaining. Use /roadmap-status to get a current snapshot.
---

# Roadmap Status Checker

Scan the roadmap, changelog, and git history to produce a concise status table.

**Announce:** "Checking roadmap status..."

## Workflow

1. Read `ROADMAP_social_care.md` — extract all phases and their status markers (✅, ⏳, status notes)
2. Read `CHANGELOG.md` (last 300 lines) — cross-reference recent completions
3. Run `git log --oneline -20` — check for recent phase-related commits
4. Read `docs/architecture.md` — check for architecture alignment notes

## Output Format

```
Phase | Status | Summary | Next Action
------|--------|---------|------------
1     | ✅ Done | Identity/Entra | —
...
38    | ❌ Not Started | Real-time collaboration (yjs) | Needs yjs integration
39    | ❌ Not Started | Advanced search | Needs Azure Cognitive Search
```

Then summarize:
- **Completed phases**: X/41
- **Partial phases**: list with what remains
- **Not started phases**: list with dependencies
- **Recommended next batch**: 3-5 independent items for `/orchestrate`

Keep output under 100 lines. Focus on actionable next steps.
