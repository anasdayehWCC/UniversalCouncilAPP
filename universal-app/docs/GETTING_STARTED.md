# Getting Started

> Quick start guide for developing with the Universal Council App frontend.

## Prerequisites

- **Node.js** 20.9.0+ (see `.nvmrc`)
- **npm** 10.x+
- **Git**

## Quick Setup

```bash
# 1. Navigate to universal-app
cd universal-app

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Configuration

Create `.env.local` from `.env.example`:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8080

# Azure AD (for production auth)
NEXT_PUBLIC_AZURE_CLIENT_ID=your-client-id
NEXT_PUBLIC_AZURE_TENANT_ID=your-tenant-id

# Demo mode (bypasses Azure AD)
NEXT_PUBLIC_DEMO_MODE=true

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Demo Mode

For local development without Azure AD:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

This provides a mock user with full access.

## Project Structure

```
universal-app/
├── src/
│   ├── app/          # Pages (Next.js App Router)
│   ├── components/   # React components
│   ├── hooks/        # Custom hooks
│   ├── lib/          # Utilities & services
│   ├── providers/    # Context providers
│   └── types/        # TypeScript types
├── public/           # Static assets
└── docs/             # Documentation
```

## Development Workflow

### 1. Creating a New Page

```bash
# Create a new route
mkdir -p src/app/my-feature
touch src/app/my-feature/page.tsx
```

```tsx
// src/app/my-feature/page.tsx
export default function MyFeaturePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">My Feature</h1>
    </main>
  );
}
```

### 2. Creating a Component

```bash
mkdir -p src/components/my-component
touch src/components/my-component/MyComponent.tsx
touch src/components/my-component/index.ts
```

```tsx
// src/components/my-component/MyComponent.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p>Count: {count}</p>
      <Button onClick={() => setCount(c => c + 1)}>Increment</Button>
      <Button variant="secondary" onClick={onAction}>Action</Button>
    </div>
  );
}
```

```tsx
// src/components/my-component/index.ts
export { MyComponent } from './MyComponent';
```

### 3. Creating a Custom Hook

```tsx
// src/hooks/useMyData.ts
'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface MyData {
  id: string;
  name: string;
}

export function useMyData() {
  const [data, setData] = useState<MyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<MyData[]>('/api/my-data');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, fetchData };
}
```

### 4. Using the API Client

```tsx
import { apiClient } from '@/lib/api-client';

// GET request
const items = await apiClient.get<Item[]>('/api/items');

// POST request
const newItem = await apiClient.post<Item>('/api/items', {
  body: { name: 'New Item' }
});

// With query params
const filtered = await apiClient.get<Item[]>('/api/items', {
  params: { status: 'active', limit: 10 }
});
```

### 5. Using Hooks

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useApiQuery } from '@/lib/useApiQuery';

function MyPage() {
  // Authentication
  const { isAuthenticated, login, logout } = useAuth();

  // Theme
  const { isDark, toggleColorMode } = useTheme();

  // Data fetching
  const { data, isLoading, error, refetch } = useApiQuery(
    'my-data',
    () => apiClient.get('/api/my-data')
  );

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;

  return <DataView data={data} />;
}
```

## Common Patterns

### Protected Routes

```tsx
// src/app/admin/page.tsx
import { AuthGate } from '@/components/AuthGate';

export default function AdminPage() {
  return (
    <AuthGate requiredRoles={['admin']}>
      <AdminContent />
    </AuthGate>
  );
}
```

### Feature Flags

```tsx
import { useFeatureEnabled } from '@/hooks/useFeatures';
import { FlagGate } from '@/components/ui/flag-gate';

// Hook approach
function MyComponent() {
  const { isEnabled } = useFeatureEnabled('new_feature');
  if (!isEnabled) return null;
  return <NewFeature />;
}

// Component approach
function MyPage() {
  return (
    <FlagGate flag="new_feature" fallback={<OldFeature />}>
      <NewFeature />
    </FlagGate>
  );
}
```

### Loading States

```tsx
import { Skeleton } from '@/components/ui/skeleton';

function DataList() {
  const { data, isLoading } = useData();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return <List items={data} />;
}
```

### Error Handling

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function MyPage() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="p-4 text-center">
          <p className="text-red-500">{error.message}</p>
          <Button onClick={reset}>Try Again</Button>
        </div>
      )}
    >
      <RiskyComponent />
    </ErrorBoundary>
  );
}
```

### Responsive Design

```tsx
import { useIsMobile, useBreakpoint } from '@/hooks/useResponsive';

function ResponsiveComponent() {
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();

  return (
    <div className={isMobile ? 'p-2' : 'p-8'}>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}

// Or with Tailwind classes
function TailwindResponsive() {
  return (
    <div className="p-2 md:p-4 lg:p-8">
      <div className="flex flex-col md:flex-row gap-4">
        <Sidebar className="hidden md:block" />
        <Content />
      </div>
    </div>
  );
}
```

### Dark Mode

```tsx
import { useColorMode } from '@/hooks/useTheme';

function DarkModeToggle() {
  const { isDark, toggleColorMode } = useColorMode();

  return (
    <button onClick={toggleColorMode}>
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}

// Use semantic colors that auto-adapt
function AutoThemedCard() {
  return (
    <div className="bg-background text-foreground border-border">
      Content automatically themes
    </div>
  );
}
```

## Available Scripts

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Building
npm run build        # Production build
npm run start        # Start production server

# Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run typecheck    # TypeScript check

# Testing
npm run test         # Run Vitest tests
npm run test:watch   # Watch mode
npm run test:e2e     # Playwright E2E tests

# API
npm run openapi-ts   # Regenerate API client from OpenAPI spec
```

## Styling with Tailwind v4

### Theme Tokens

Use CSS variables for colors:

```tsx
// ✅ Good - uses theme tokens
<div className="bg-primary text-primary-foreground" />
<div className="bg-background text-foreground border-border" />
<div className="text-muted-foreground" />

// ❌ Avoid - hardcoded colors
<div className="bg-blue-500 text-white" />
```

### Glass Morphism

```tsx
<div className="bg-white/20 backdrop-blur-md border border-white/30 shadow-lg rounded-xl">
  Premium glass effect
</div>

// Or use the glass Button variant
<Button variant="glass">Glass Button</Button>
```

### Responsive Utilities

```tsx
// Mobile-first approach
<div className="p-2 sm:p-4 md:p-6 lg:p-8" />

// Hide/show based on breakpoint
<Sidebar className="hidden md:block" />
<MobileNav className="md:hidden" />
```

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `MyComponent.tsx` |
| Hook | camelCase, `use` prefix | `useMyHook.ts` |
| Utility | camelCase | `formatDate.ts` |
| Type | PascalCase | `types.ts` (inside: `MyType`) |
| Page | `page.tsx` | `app/my-route/page.tsx` |
| Layout | `layout.tsx` | `app/my-route/layout.tsx` |
| API Route | `route.ts` | `app/api/my-api/route.ts` |

## Import Aliases

Use the `@/` alias for imports:

```tsx
// ✅ Good - uses alias
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';

// ❌ Avoid - relative imports from far
import { Button } from '../../../components/ui/button';
```

## Debugging Tips

### React DevTools

Install [React DevTools](https://react.dev/learn/react-developer-tools) for component inspection.

### Network Debugging

```tsx
// Enable API logging
apiClient.addResponseInterceptor((response) => {
  console.log(`API ${response.status}: ${response.url}`);
  return response;
});
```

### PostHog Debug Mode

```tsx
// In browser console
posthog.debug();
```

## Getting Help

1. Check existing documentation:
   - [API.md](./API.md) - API client usage
   - [HOOKS.md](./HOOKS.md) - Custom hooks
   - [COMPONENTS.md](./COMPONENTS.md) - Component library
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture overview

2. Review the codebase:
   - Look at similar implementations
   - Check existing patterns in `src/`

3. Ask questions:
   - Create an issue on GitHub
   - Check team Slack channels

## Next Steps

1. ✅ Set up your environment
2. ✅ Run the development server
3. 📖 Read the [Architecture](./ARCHITECTURE.md) doc
4. 🔨 Start building!

### Recommended Reading Order

1. [GETTING_STARTED.md](./GETTING_STARTED.md) (this file)
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand the structure
3. [API.md](./API.md) - Learn the API patterns
4. [HOOKS.md](./HOOKS.md) - Know available hooks
5. [COMPONENTS.md](./COMPONENTS.md) - Use the component library
