---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for the Universal Council App codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about the Universal Council App's toolset, theme system, multi-tenant architecture, or social care domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## Subagent Availability (Fallback)

If subagents are unavailable in this environment:
- Do NOT mention the limitation to the user.
- Offer only execution modes you can actually run.
- Prefer: in-session single-agent execution or a separate executing-plans session.
- If executing in-session, follow tasks sequentially and do a two-pass self-review (spec then quality) per task.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" — step
- "Run it to make sure it fails" — step
- "Implement the minimal code to make the test pass" — step
- "Run the tests and make sure they pass" — step
- "Commit" — step

If the user explicitly requests no commits, replace the commit step with "Skip commit (per request)" and do not include git commands.

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For codex:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind v4, FastAPI 0.120, Pydantic 2.11

---
```

## Task Structure — Frontend Example

```markdown
### Task N: [Component Name]

**Files:**
- Create: `universal-app/src/components/domain/NewComponent.tsx`
- Modify: `universal-app/src/app/(protected)/route/page.tsx`
- Test: `universal-app/src/tests/unit/NewComponent.test.tsx`

**Step 1: Write the failing test**

` ` `typescript
import { render, screen } from '@testing-library/react'
import { NewComponent } from '@/components/domain/NewComponent'

describe('NewComponent', () => {
  it('renders the expected content', () => {
    render(<NewComponent data={mockData} />)
    expect(screen.getByText('Expected')).toBeInTheDocument()
  })
})
` ` `

**Step 2: Run test to verify it fails**

Run: `pnpm --filter universal-app test:run -- --reporter=verbose src/tests/unit/NewComponent.test.tsx`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

` ` `typescript
export function NewComponent({ data }: { data: DataType }) {
  return <div className="text-foreground bg-card rounded-lg p-4">{data.title}</div>
}
` ` `

**Step 4: Run test to verify it passes**

Run: `pnpm --filter universal-app test:run -- --reporter=verbose src/tests/unit/NewComponent.test.tsx`
Expected: PASS

**Step 5: Commit**

` ` `bash
git add universal-app/src/components/domain/NewComponent.tsx universal-app/src/tests/unit/NewComponent.test.tsx
git commit -m "feat: add NewComponent with unit test"
` ` `
```

## Task Structure — Backend Example

```markdown
### Task N: [Endpoint Name]

**Files:**
- Create: `minute-main/app/routes/new_endpoint.py`
- Modify: `minute-main/app/main.py` (register router)
- Test: `minute-main/tests/test_new_endpoint.py`

**Step 1: Write the failing test**

` ` `python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_new_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/new-endpoint")
    assert response.status_code == 200
    assert "expected_key" in response.json()
` ` `

**Step 2: Run test to verify it fails**

Run: `cd minute-main && poetry run pytest tests/test_new_endpoint.py -v`
Expected: FAIL with "404 Not Found"

**Step 3: Write minimal implementation**

` ` `python
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/v1", tags=["new-endpoint"])

@router.get("/new-endpoint")
async def get_new_endpoint(user=Depends(get_current_user)):
    return {"expected_key": "value"}
` ` `

**Step 4: Run test to verify it passes**

Run: `cd minute-main && poetry run pytest tests/test_new_endpoint.py -v`
Expected: PASS

**Step 5: Commit**

` ` `bash
git add minute-main/app/routes/new_endpoint.py minute-main/tests/test_new_endpoint.py
git commit -m "feat: add new-endpoint route with test"
` ` `
```

## Project Rules to Embed in Every Plan

Include these rules in every plan so sub-agents or zero-context engineers follow them:

**Theme tokens (frontend):**
- Never use hardcoded Tailwind colors (`bg-slate-*`, `text-blue-*`) in production UI
- Use semantic tokens: `text-foreground`, `text-muted-foreground`, `bg-card`, `bg-muted`, `border-border`, `border-input`
- Semantic colors: `text-success`, `bg-success/10`, `text-warning`, `text-destructive`, `text-info`
- Exception: intentionally branded surfaces (login page) may use explicit `text-white`

**Accessibility:**
- `animate-spin` / `animate-pulse` must be paired with `motion-reduce:animate-none`
- Icon-only buttons need `aria-label`
- Custom tabs need proper ARIA roles
- WCAG 2.2 AA contrast ratios (4.5:1 normal text, 3:1 large text)

**Z-index scale:**
- Import constants from `lib/z-index.ts` — never arbitrary z-index values
- Header/FAB z-40, Modals z-50, Banners z-60, Toasts z-100

**Hydration safety:**
- Client-only APIs (`useNetworkStatus`, Dexie, `navigator.onLine`) need `isMounted` guard
- `useState(false)` + `useEffect(() => setIsMounted(true), [])` pattern

**API client:**
- Always use `/api/proxy` base URL (via `NEXT_PUBLIC_API_URL`)
- Generated client in `src/lib/api/generated/` — regenerate with `pnpm openapi-ts`

**Backend patterns:**
- RequestContext filtering for multi-tenancy
- Config system: YAML + JSON schema validation
- Alembic migrations for all schema changes
- Managed Identity for Azure services

## Verification Commands

Include these in every plan's final verification step:

```bash
# Frontend
pnpm --filter universal-app lint
pnpm --filter universal-app build
pnpm --filter universal-app test:run
pnpm --filter universal-app audit:premium-ui

# Backend (if applicable)
cd minute-main && poetry run pytest tests/ -x -q
cd minute-main && poetry run python scripts/validate_configs.py
```

## Remember

- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant project skills by name (e.g., `dev-frontend`, `dev-backend`)
- DRY, YAGNI, TDD, frequent commits

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/plans/<filename>.md`. Three execution options:**

**1. Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Orchestrate-Driven** — Save the plan; the next `/orchestrate` run picks it up as work items and dispatches parallel sub-agents in worktrees

**3. Parallel Session (separate)** — Open new session with executing-plans skill, batch execution with review checkpoints

**Which approach?"**
