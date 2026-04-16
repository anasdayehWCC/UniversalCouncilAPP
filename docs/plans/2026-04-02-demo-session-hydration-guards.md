# Demo Session Hydration and Guard Regression Implementation Plan

> **For codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore persisted demo persona/auth state before guard and shell redirects run so refreshes and deep links stay on the correct protected route.

**Architecture:** Keep SSR-safe default state in `DemoProvider`, but introduce an explicit client-only hydration phase via `isSessionHydrated`. Route guards and shell redirects wait for hydration, then decide whether to render or redirect. Tests cover provider restoration, guard timing, shell redirect timing, and browser refresh behavior.

**Tech Stack:** Next.js app router, React 19, Vitest, Testing Library, Playwright

---

### Task 1: Add a hydration-ready contract to the demo session provider

**Files:**
- Modify: `universal-app/src/context/DemoContext.tsx`
- Test: `universal-app/src/tests/unit/context/DemoContext.test.tsx`

**Step 1: Write the failing provider regression test**

Verify that a persisted `currentUserId`, `isAuthenticated`, and `demo_feature_flags` restore into the real `DemoProvider`, and that the restored persona is re-resolved against API persona data.

**Step 2: Run the provider test to verify it fails**

Run: `pnpm --filter universal-app exec vitest run src/tests/unit/context/DemoContext.test.tsx`

Expected: FAIL because `DemoContext` does not expose hydration readiness and does not preserve the persisted persona/auth contract.

**Step 3: Implement the provider hydration fix**

- Add `isSessionHydrated` to `DemoContextType`
- Keep SSR-safe default state
- Restore `currentUser`, `role`, `domain`, `isAuthenticated`, `featureFlags`, and `personaHistory` together in the mount reconciliation
- Track restored user ID in a ref and re-resolve that persona when `/api/demos/personas` returns fresher persona data
- Keep `switchUser` and `signOut` aligned with the same single source of truth

**Step 4: Re-run the provider test**

Run: `pnpm --filter universal-app exec vitest run src/tests/unit/context/DemoContext.test.tsx`

Expected: PASS

### Task 2: Delay role redirects until the session is hydrated

**Files:**
- Modify: `universal-app/src/hooks/useRoleGuard.ts`
- Modify: `universal-app/src/app/admin/layout.tsx`
- Modify: `universal-app/src/app/review-queue/page.tsx`
- Modify: `universal-app/src/app/review-queue/[id]/page.tsx`
- Modify: `universal-app/src/app/insights/page.tsx`
- Modify: `universal-app/src/app/insights/dashboard/page.tsx`
- Modify: `universal-app/src/app/record/page.tsx`
- Test: `universal-app/src/tests/unit/hooks/useRoleGuard.test.tsx`

**Step 1: Write the failing guard regression test**

Verify that unauthorized redirects happen only after hydration, and authorized persisted sessions do not redirect.

**Step 2: Run the guard test to verify it fails**

Run: `pnpm --filter universal-app exec vitest run src/tests/unit/hooks/useRoleGuard.test.tsx`

Expected: FAIL because `useRoleGuard` returns nothing and redirects immediately on the default role.

**Step 3: Implement the guard contract**

- Return `{ isReady, isAuthorized }` from `useRoleGuard`
- Redirect only when `isSessionHydrated === true` and the role is unauthorized
- Update each guard consumer to return `null` until ready/authorized so protected UI never flashes

**Step 4: Re-run the guard test**

Run: `pnpm --filter universal-app exec vitest run src/tests/unit/hooks/useRoleGuard.test.tsx`

Expected: PASS

### Task 3: Gate the shell login redirect on hydration

**Files:**
- Modify: `universal-app/src/components/layout/AppShell.tsx`
- Test: `universal-app/src/tests/integration/app-shell-session-hydration.test.tsx`

**Step 1: Write the failing shell regression test**

Verify that authenticated persisted sessions are not bounced to `/login`, and unauthenticated sessions are redirected after hydration completes.

**Step 2: Run the shell test to verify it fails**

Run: `pnpm --filter universal-app exec vitest run src/tests/integration/app-shell-session-hydration.test.tsx`

Expected: FAIL because the shell redirect runs without waiting for hydration.

**Step 3: Implement the shell redirect fix**

- Switch the shell redirect to `router.replace('/login')`
- Wait for `isSessionHydrated` before redirecting
- Render a neutral loading shell for non-login routes until hydration completes

**Step 4: Re-run the shell test**

Run: `pnpm --filter universal-app exec vitest run src/tests/integration/app-shell-session-hydration.test.tsx`

Expected: PASS

### Task 4: Add browser-level regression coverage and docs

**Files:**
- Modify: `universal-app/src/tests/e2e/login.spec.ts`
- Modify: `CHANGELOG.md`
- Create: `docs/plans/2026-04-02-demo-session-hydration-guards.md`

**Step 1: Add Playwright refresh/deep-link regressions**

- Persist manager session and verify `/review-queue` survives reload
- Persist admin session and verify `/admin` survives reload
- Persist unauthenticated state and verify `/insights` redirects to `/login`

**Step 2: Update docs**

- Record the implementation in the root changelog
- Save this plan artifact under `docs/plans/`

**Step 3: Run the focused browser regression**

Run: `pnpm --filter universal-app exec playwright test src/tests/e2e/login.spec.ts`

Expected: PASS or a reproducible environment-specific failure to triage

### Task 5: Full verification

**Files:**
- Verify only

**Step 1: Run focused unit/integration verification**

Run: `pnpm --filter universal-app exec vitest run src/tests/unit/context/DemoContext.test.tsx src/tests/unit/hooks/useRoleGuard.test.tsx src/tests/integration/app-shell-session-hydration.test.tsx`

Expected: PASS

**Step 2: Run the broader app test suite**

Run: `pnpm --filter universal-app test:run`

Expected: Existing unrelated failures may remain; if so, document them separately from this change.

**Step 3: Run build and lint verification**

Run: `pnpm --filter universal-app build`

Run: `pnpm lint:web`

Expected: PASS, or clearly identified pre-existing failures outside this change
