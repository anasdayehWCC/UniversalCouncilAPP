---
name: dev-frontend
description: Context loader for frontend development in universal-app. Loads project conventions, component patterns, and theme rules before implementation. Use when starting frontend work.
user-invocable: false
---

# Frontend Development Context

Loaded automatically by orchestrator sub-agents working on `universal-app/`. Provides project-specific conventions that override generic patterns.

## Architecture

- **Framework**: Next.js 16 App Router + React 19 + TypeScript 5
- **Styling**: Tailwind CSS v4 with semantic CSS variable tokens
- **State**: Zustand (global), TanStack Query (server), Immer (immutable updates)
- **Offline**: Dexie (IndexedDB) with service worker background sync
- **Auth**: Azure MSAL (@azure/msal-react)
- **Build**: Turbopack (default), pnpm 10.28

## File Conventions

| Type | Location | Pattern |
|------|----------|---------|
| Routes | `src/app/{route}/page.tsx` | App Router with layout.tsx for shared UI |
| Components | `src/components/{domain}/` | Domain-grouped (admin, charts, minutes, recording, etc.) |
| UI Primitives | `src/components/ui/` | Radix-based, CVA variants |
| Hooks | `src/hooks/` | `use{Name}.ts` |
| Types | `src/types/` | Shared TypeScript types |
| Lib/Utils | `src/lib/` | API client, theme, z-index, modules, validation |
| Providers | `src/providers/` | React context providers |
| Tests | `src/tests/unit/`, `src/tests/integration/`, `src/tests/e2e/` | Vitest (unit), Playwright (e2e) |

## Layout System

- `AppShell` — owns the viewport (`h-[100dvh]`), renders sidebar + header + main area
- `ShellPage` — wraps individual route content with consistent padding/headers
- Header uses `--shell-header-height` CSS variable
- Sidebar is collapsible, brand-colored
- Banners dock below header using Dynamic Island pattern (z-60)

## Theme Token Rules (CRITICAL)

**Never use hardcoded Tailwind colors in production UI.**

| Instead of | Use |
|-----------|-----|
| `text-slate-900/700` | `text-foreground` |
| `text-slate-600/500` | `text-muted-foreground` |
| `bg-white` | `bg-card` or `bg-background` |
| `bg-slate-50/100` | `bg-muted` |
| `border-slate-200` | `border-border` |
| `text-blue-600` | `text-primary` or `text-info` |
| `text-green-600` | `text-success` |
| `text-red-600` | `text-destructive` |
| `bg-blue-50` | `bg-info/10` |
| `bg-green-50` | `bg-success/10` |
| `bg-red-50` | `bg-destructive/10` |

## Accessibility Rules

1. All `animate-spin` / `animate-pulse` must have `motion-reduce:animate-none`
2. All icon-only buttons must have `aria-label`
3. Custom tab UIs need `role="tablist"`, `role="tab"`, `aria-selected`, `role="tabpanel"`
4. Filter buttons need `aria-pressed`
5. WCAG 2.2 AA contrast required

## Z-Index Scale

Import from `lib/z-index.ts`:
- Header: z-40
- FAB: z-40
- Modals: z-50
- Banners: z-60
- Toasts: z-100

## Hydration Safety

Components using client-only APIs (useNetworkStatus, Dexie, navigator.onLine) must:
```tsx
const [isMounted, setIsMounted] = useState(false)
useEffect(() => { setIsMounted(true) }, [])
if (!isMounted) return null
```

## Testing Commands

```bash
pnpm --filter universal-app lint          # ESLint
pnpm --filter universal-app build         # Production build
pnpm --filter universal-app test:run      # Vitest unit tests
pnpm --filter universal-app audit:premium-ui  # Premium UI audit
pnpm --filter universal-app test:e2e      # Playwright e2e
```

## API Client

- Base URL: `/api/proxy` (Next.js proxy to backend)
- Generated client in `src/lib/api/generated/` — regenerate with `pnpm openapi-ts`
- TanStack Query for data fetching with optimistic updates
