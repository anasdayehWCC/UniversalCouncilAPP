# 2026-04-17 Auth Gating and Network Status Regressions

## Status

Implemented on `feature/orchestrate-2026-04-16`.

## Problem

Three regressions were introduced in the auth/network changes against `main`:

1. `/record` could still render for signed-out users because authorization was inferred from the fallback persona role instead of authenticated session state.
2. `AppShell` mounted a second floating `ConnectivityIndicator`, duplicating both UI and announcements already provided at the root layout.
3. `NetworkStatusProvider` was introduced as the shared polling source, but `/record` and `OfflineFallback` still imported the low-level `useNetworkStatus` hook directly, causing duplicate `/healthcheck` polling on recorder routes.

## Implemented Changes

### Auth guard semantics

- Updated `universal-app/src/hooks/useRoleGuard.ts` so `isAuthorized` now requires all of:
  - `isSessionHydrated === true`
  - `isAuthenticated === true`
  - `role` is in the allowed-role list
- Redirects now branch by state:
  - unauthenticated users: `router.replace('/login')`
  - authenticated but unauthorized users: `router.replace('/')`

### Shell redirect and duplicate connectivity UI

- Updated `universal-app/src/components/layout/AppShell.tsx` to use `router.replace('/login')` for automatic auth redirects.
- Removed the shell-local `ConnectivityIndicator` so the single root-level indicator in `universal-app/src/app/layout.tsx` remains the only floating connectivity control.

### Recorder route gating and polling consolidation

- Refactored `universal-app/src/app/record/page.tsx` into:
  - outer `RecordPage` guard wrapper
  - inner `AuthorizedRecordPage` recorder implementation
- The outer wrapper returns `null` until `useRoleGuard(ALLOWED_ROLES)` reports both ready and authorized, preventing unauthorized first paint and avoiding recorder hook initialization for rejected sessions.
- Switched recorder route network access from the low-level hook to the provider consumer:
  - `universal-app/src/app/record/page.tsx`
  - `universal-app/src/components/OfflineFallback.tsx`
- Cleaned the stale provider comment in `universal-app/src/providers/NetworkStatusProvider.tsx` so it no longer describes a standalone-hook fallback that no longer exists.

## Regression Coverage Added

- `universal-app/src/tests/unit/hooks/useRoleGuard.test.tsx`
  - added signed-out fallback-persona case asserting `replace('/login')`
- `universal-app/src/tests/integration/app-shell-session-hydration.test.tsx`
  - asserts unauthenticated hydration redirects with `replace('/login')`
  - asserts `AppShell` itself no longer renders a connectivity indicator
- `universal-app/src/tests/integration/record-page-guard.test.tsx`
  - signed-out fallback worker redirects to `/login` without recorder UI
  - authenticated manager redirects to `/` without recorder UI
  - authenticated social worker sees the consent screen
  - `/api/proxy/healthcheck` is called once per mount, proving recorder routes no longer start a second polling loop

## Verification

- Passed:
  - `pnpm --filter universal-app exec vitest run src/tests/unit/hooks/useRoleGuard.test.tsx src/tests/integration/app-shell-session-hydration.test.tsx src/tests/integration/record-page-guard.test.tsx src/tests/unit/hooks/useNetworkStatus.test.tsx`
  - `pnpm --filter universal-app build`
- Environment updated:
  - `pnpm --filter universal-app exec playwright install`
- Still unresolved in this workspace:
  - `pnpm --filter universal-app exec playwright test src/tests/e2e/login.spec.ts -g "Protected Routes"`
  - after browser install, the protected-route Playwright run still failed to produce a stable browser-level result in this session and was stopped after hanging in the harness/bootstrap path

## Follow-up

- Re-run the protected-route Playwright slice in a clean local session and capture the first concrete browser failure before changing app code again.
