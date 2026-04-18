# Agent & Working Rules

This file is a frontend-local supplement for `universal-app/`. The root [`AGENTS.md`](../AGENTS.md) remains the repo-wide source of truth, and the root [`CHANGELOG.md`](../CHANGELOG.md) is the only authoritative changelog.

## Ground Rules
- **Use MCP semantic search first**: run `claude_context_local.index_directory` once per session, then use `claude_context_local.search_code` to explore. Avoid random `grep` unless search misses something.
- **Roadmap driven**: always open the root `ROADMAP_social_care.md` (canonical, consolidated), pick the earliest phase whose exit criteria are not met, and work that before moving on.
- **Changelog discipline**: any behavioural/UI/schema change must land in the root `CHANGELOG.md` with phase tags and testing notes.
- **Docs follow code**: when adding patterns or flows, document intended use plus one anti‑pattern.
- **Layering**: keep shared config in `src/config`, mock/demo data in `src/data`, context in `src/context`, and UI-only components in `src/components`. Do not couple UI to hard-coded domains outside config.
- **Demo data state**: use the `DemoContext` `meetings` state plus `addMeeting` / `updateMeetingStatus` helpers for anything that mutates or reads meeting data; avoid importing `MEETINGS` directly in UI.

  - ✅ Example: `const { meetings, addMeeting } = useDemo(); addMeeting(newMeeting);`
- 🚫 Anti-pattern: `import { MEETINGS } from '@/config/personas'` and mutating the array directly; always go through DemoContext helpers.
- **Testing**: prefer `npm run lint` for quick checks. Add focused UI checks (Playwright) only when a phase changes flows.
- **Extension hygiene**: Grammarly and similar DOM-altering extensions inject `data-gr-*` attributes that cause hydration mismatch warnings. When verifying SSR/React hydration, use an extension-free profile or incognito; Root layout now suppresses these warnings but keep browsers clean to avoid noisy consoles.
- **UX stance**: purposeful, council-facing UI; lean on domain theme tokens set via `ThemeSetter`; avoid generic grey-on-grey.
- **Typography consistency**: login hero uses the same scale as dashboard headers (h1 3xl/4xl/5xl); keep future hero titles aligned to that ladder.
- **Login theming**: keep the persona hero/cards driven by `ThemeSetter` tokens (e.g. `config.theme.*`, `--primary-soft`, `--login-panel-*`), and never add a new Tailwind grey/sky utility there so each council’s palette automatically refreshes the login screen.
- **Avoid scope clashes**: if a future sub-phase owns a file, defer overlapping work into a new future phase entry instead of editing it.

## Frontend anti-patterns (login & persona UI)
- **Never hard-code colours or gradients on the login hero/cards.** Always pull from `config.theme`, `ThemeSetter` tokens (`--primary`, `--accent`, `--login-*`) or shared helpers before introducing a new HEX/Tailwind grey class; check `src/app/login/page.tsx`, `src/components/ui/BackgroundGradient.tsx`, and `src/components/ThemeSetter.tsx` first.
- **Do not duplicate persona/domain copy.** Role names, function labels, domains, and pilot text should come from `src/config/personas.ts` or `src/config/domains.ts`; avoid re-typing strings in the UI and keep logic centralized.
- **Reuse shared UI primitives.** Instead of creating new “glass” variants, extend `GlassCard`, `Badge`, or other token-driven components (see `src/components/ui/GlassCard.tsx`) rather than copy/pasting styles.
- **Respect motion preferences.** If you add animation to the persona screen, gate it with `usePrefersReducedMotion` so we don’t violate the `prefers-reduced-motion` setting.

## Default Workflow
1) Re-index + read the roadmap.
2) Restate phase exit criteria before coding.
3) Implement minimal changes to meet the exit.
4) Update roadmap, changelog, and any touched docs.
5) Run relevant checks and note results.

## Infrastructure Components

### API Client (`src/lib/api-client.ts`)
Typed HTTP client for backend communication with automatic retry, interceptors, and auth.

```typescript
import { apiClient } from '@/lib/api-client';

// GET request
const data = await apiClient.get<Meeting[]>('/api/meetings');

// POST with body
const result = await apiClient.post<Meeting>('/api/meetings', { title: 'New' });

// With options
const data = await apiClient.get<Meeting[]>('/api/meetings', {
  params: { domain: 'social-care' },
  timeout: 10000,
});
```

### Data Fetching Hooks (`src/lib/useApiQuery.ts`)
React hooks for data fetching with caching, loading states, and error handling.

```typescript
import { useApiQuery, useApiMutation } from '@/lib/useApiQuery';

// Query with caching
const { data, isLoading, error, refetch } = useApiQuery(
  'meetings',
  () => apiClient.get<Meeting[]>('/api/meetings'),
  { staleTime: 30000 }
);

// Mutation with cache invalidation
const { mutate, isLoading } = useApiMutation(
  (data: CreateMeeting) => apiClient.post('/api/meetings', data),
  { invalidateKeys: ['meetings'] }
);
```

### Error Handling
- **ErrorBoundary**: Wraps app in `layout.tsx`; catches React errors with fallback UI
- **Toast notifications**: Use `useToast()` hook for user feedback
- **API errors**: Use `getErrorMessage(error)` for user-friendly messages

```typescript
import { useToast } from '@/components/Toast';

const { success, error } = useToast();
success('Meeting saved!');
error('Failed to save meeting');
```

### API Proxy (`src/app/api/proxy/[...path]/route.ts`)
Forwards requests to the minute-main backend. Configure `BACKEND_URL` env var.

**Usage**: Request `/api/proxy/meetings` → forwards to `BACKEND_URL/meetings`

### Loading States (`src/components/ui/skeleton.tsx`)
Use skeleton components for loading states:
- `<Skeleton />` - Basic skeleton
- `<SkeletonCard />` - Card placeholder
- `<SkeletonList count={5} />` - List placeholder
- `<SkeletonDashboard />` - Full dashboard skeleton
