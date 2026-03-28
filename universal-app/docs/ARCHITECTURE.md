# System Architecture

> Comprehensive architecture documentation for the Universal Council App.

## Table of Contents

- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Directory Structure](#directory-structure)
- [Design Patterns](#design-patterns)
- [State Management](#state-management)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)

---

## System Overview

The Universal Council App is a **multi-tenant SaaS platform** for UK local government social care that enables recording, transcription, and management of case meeting minutes.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        UNIVERSAL COUNCIL APP                                │
│                     Multi-Tenant SaaS Platform                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌───────────┐  │
│   │    WCC      │    │    RBKC     │    │  Bi-Borough │    │  Future   │  │
│   │  Children   │    │   Adults    │    │   Housing   │    │  Tenants  │  │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └─────┬─────┘  │
│          │                  │                  │                  │        │
│          └──────────────────┼──────────────────┼──────────────────┘        │
│                             │                                              │
│                    ┌────────▼────────┐                                     │
│                    │  Tenant Config  │                                     │
│                    │  & Module Reg.  │                                     │
│                    └────────┬────────┘                                     │
│                             │                                              │
│   ┌─────────────────────────┼─────────────────────────┐                   │
│   │                         │                         │                   │
│   ▼                         ▼                         ▼                   │
│ ┌───────┐            ┌───────────┐            ┌────────────┐              │
│ │Capture│──────────▶│Transcribe │──────────▶│   Review    │              │
│ │Record │            │ & Generate│            │  & Approve  │              │
│ └───────┘            └───────────┘            └────────────┘              │
│                             │                         │                   │
│                             ▼                         ▼                   │
│                      ┌───────────┐            ┌────────────┐              │
│                      │  Minutes  │            │  Publish   │              │
│                      │  Storage  │──────────▶│  & Export  │              │
│                      └───────────┘            └────────────┘              │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                │
│                        Next.js 16 + React 19 + TypeScript                   │
│ ┌──────────────────────────────────────────────────────────────────────┐  │
│ │                           App Router Pages                            │  │
│ │  /record  /minutes  /review-queue  /admin  /insights  /templates     │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│ │   UI        │ │  Features   │ │   Layout    │ │   Mobile/PWA        │  │
│ │ Primitives  │ │  Components │ │  Wrappers   │ │   Components        │  │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘  │
│ ┌──────────────────────────────────────────────────────────────────────┐  │
│ │              Custom Hooks + Context Providers                         │  │
│ │  useAuth │ useRecorder │ useTranscription │ useDomain │ useTheme     │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────────────────────┐  │
│ │                      Library Layer                                    │  │
│ │ API Client │ Offline Queue │ Storage │ Audio │ Themes │ Workflow     │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│                              API PROXY LAYER                               │
│                        Next.js API Routes (/api/*)                         │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────┐   │
│ │ /api/proxy/*     │ │ /api/demos/*     │ │ Authentication Handler   │   │
│ │ Backend Proxy    │ │ Demo Data API    │ │ MSAL Integration         │   │
│ └──────────────────┘ └──────────────────┘ └──────────────────────────┘   │
├────────────────────────────────────────────────────────────────────────────┤
│                              BACKEND LAYER                                 │
│                         minute-main (FastAPI + Python)                     │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│ │  Auth API   │ │Transcription│ │  Minutes    │ │    Templates        │  │
│ │             │ │    API      │ │    API      │ │       API           │  │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘  │
│ ┌──────────────────────────────────────────────────────────────────────┐  │
│ │              Background Worker (Ray/Celery)                           │  │
│ │  Transcription │ LLM Processing │ Export Jobs │ Retention Cleanup    │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│                              STORAGE LAYER                                 │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐    │
│ │  PostgreSQL  │ │    Redis     │ │ Azure Blob   │ │   IndexedDB    │    │
│ │  (Primary)   │ │   (Cache)    │ │  (Audio/Docs)│ │  (PWA Offline) │    │
│ └──────────────┘ └──────────────┘ └──────────────┘ └────────────────┘    │
├────────────────────────────────────────────────────────────────────────────┤
│                           EXTERNAL SERVICES                                │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│ │ Azure Entra │ │ Azure Speech│ │ Azure OpenAI│ │ SharePoint/Graph    │  │
│ │     ID      │ │  Services   │ │     LLM     │ │    Integration      │  │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘  │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                          │
│ │   Sentry    │ │   PostHog   │ │App Insights │                          │
│ │   (Errors)  │ │ (Analytics) │ │ (APM)       │                          │
│ └─────────────┘ └─────────────┘ └─────────────┘                          │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
universal-app/
│
├── public/                          # Static assets (PWA, icons)
│   ├── sw.js                        # Service worker for offline
│   ├── manifest.json                # PWA manifest
│   └── icons/                       # App icons
│
├── src/
│   ├── app/                         # ═══ NEXT.JS APP ROUTER ═══
│   │   ├── layout.tsx               # Root layout with providers
│   │   ├── page.tsx                 # Dashboard home page
│   │   ├── globals.css              # Global styles
│   │   │
│   │   ├── api/                     # API route handlers
│   │   │   ├── proxy/[...path]/     # Backend proxy route
│   │   │   └── demos/personas/      # Demo data endpoint
│   │   │
│   │   ├── admin/                   # Admin panel pages
│   │   ├── capture/                 # Recording capture flow
│   │   ├── insights/                # Analytics dashboard
│   │   ├── login/                   # Login page
│   │   ├── minutes/                 # Minutes management
│   │   ├── my-notes/                # Personal notes
│   │   ├── record/                  # Recording page
│   │   ├── review-queue/            # Manager review queue
│   │   ├── templates/               # Template management
│   │   └── upload/                  # File upload
│   │
│   ├── components/                  # ═══ REACT COMPONENTS ═══
│   │   ├── ui/                      # Base UI primitives (Radix-based)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MobileNav.tsx
│   │   │
│   │   ├── recording/               # Recording UI components
│   │   ├── transcription/           # Transcript viewer
│   │   ├── minutes/                 # Minutes editor
│   │   ├── review/                  # Review workflow
│   │   ├── charts/                  # Data visualizations
│   │   ├── templates/               # Template components
│   │   ├── notifications/           # Notification UI
│   │   ├── mobile/                  # Mobile-specific (FAB, sheets)
│   │   ├── skeletons/               # Loading skeletons
│   │   └── ...
│   │
│   ├── hooks/                       # ═══ CUSTOM HOOKS ═══
│   │   ├── useAuth.ts               # Authentication hook
│   │   ├── useRecorder.ts           # Audio recording
│   │   ├── useTranscription.ts      # Transcription state
│   │   ├── useDomain.ts             # Domain/tenant context
│   │   ├── useTheme.ts              # Theme management
│   │   ├── useOffline.ts            # Offline detection
│   │   ├── useOptimistic*.ts        # Optimistic updates
│   │   └── ...
│   │
│   ├── lib/                         # ═══ UTILITY LIBRARIES ═══
│   │   ├── api/                     # API client modules
│   │   │   ├── client.ts            # OpenAPI client config
│   │   │   ├── generated/           # Auto-generated types
│   │   │   └── index.ts
│   │   │
│   │   ├── api-client.ts            # Low-level HTTP client
│   │   ├── api-errors.ts            # Error classes
│   │   ├── useApiQuery.ts           # React Query hooks
│   │   │
│   │   ├── auth/                    # MSAL configuration
│   │   ├── audio/                   # Audio recording utils
│   │   ├── offline-queue.ts         # Offline queue (Dexie)
│   │   ├── storage-adapter.ts       # IndexedDB adapter
│   │   │
│   │   ├── tenant/                  # Multi-tenant system
│   │   ├── themes/                  # Theme definitions
│   │   ├── modules/                 # Module registry
│   │   ├── features/                # Feature flags
│   │   ├── workflow/                # Approval workflow
│   │   ├── export/                  # Document export
│   │   ├── notifications/           # Push notifications
│   │   ├── sharepoint/              # SharePoint integration
│   │   └── ...
│   │
│   ├── providers/                   # ═══ CONTEXT PROVIDERS ═══
│   │   ├── AuthProvider.tsx         # MSAL authentication
│   │   ├── ThemeProvider.tsx        # Theme & dark mode
│   │   ├── DomainProvider.tsx       # Service domain
│   │   ├── NotificationProvider.tsx # Toast notifications
│   │   ├── NavigationProvider.tsx   # Navigation state
│   │   └── PostHogProvider.tsx      # Analytics
│   │
│   ├── context/                     # ═══ REACT CONTEXTS ═══
│   │   └── DemoContext.tsx          # Demo mode state
│   │
│   ├── config/                      # ═══ CONFIGURATION ═══
│   │   ├── domains.ts               # Service domains
│   │   ├── personas.ts              # Demo personas
│   │   └── navigation.ts            # Nav configuration
│   │
│   ├── types/                       # ═══ TYPESCRIPT TYPES ═══
│   │   ├── demo.ts                  # Demo types
│   │   ├── admin.ts                 # Admin types
│   │   └── flags.ts                 # Feature flags
│   │
│   └── tests/                       # ═══ TEST FILES ═══
│       └── ...
│
├── docs/                            # Documentation
├── scripts/                         # Build scripts
│
├── next.config.ts                   # Next.js configuration
├── tailwind.config.ts               # Tailwind CSS
├── tsconfig.json                    # TypeScript config
├── vitest.config.ts                 # Unit test config
├── playwright.config.ts             # E2E test config
└── package.json                     # Dependencies
```

---

## Design Patterns

### 1. Provider Pattern (Compositae Root)

All cross-cutting concerns are wrapped in providers:

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider>
          <NotificationProvider>
            <DomainProvider>
              <FeatureProvider>
                {children}
              </FeatureProvider>
            </DomainProvider>
          </NotificationProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
```

### 2. Module System Pattern

Features are encapsulated as modules that can be enabled per tenant:

```
┌────────────────────────────────────────────────────────────────────┐
│                       MODULE REGISTRY                              │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │ ai_insights  │  │  sharepoint  │  │   smart_capture        │   │
│  │  Module      │  │    Module    │  │      Module            │   │
│  ├──────────────┤  ├──────────────┤  ├────────────────────────┤   │
│  │ routes: [...]│  │ routes: [...]│  │ routes: [...]          │   │
│  │ roles: [mgr] │  │ roles: [all] │  │ roles: [sw]            │   │
│  │ flags: [...]│  │ flags: [...]│  │ flags: [smartCapture]  │   │
│  └──────────────┘  └──────────────┘  └────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │         ModuleGuard           │
              │  <ModuleGuard module="ai">    │
              │    <AIInsightsPanel />        │
              │  </ModuleGuard>               │
              └───────────────────────────────┘
```

### 3. Optimistic Update Pattern

UI updates immediately, then reconciles with server:

```typescript
// hooks/useOptimisticMutation.ts
function useOptimisticMutation<T>(options: MutationOptions<T>) {
  return {
    mutate: async (data: T) => {
      // 1. Store previous state
      const previous = queryCache.get(key);
      
      // 2. Optimistically update UI
      queryCache.set(key, optimisticValue);
      
      try {
        // 3. Execute actual mutation
        const result = await apiClient.post(endpoint, data);
        
        // 4. Update with real data
        queryCache.set(key, result);
      } catch (error) {
        // 5. Rollback on failure
        queryCache.set(key, previous);
        throw error;
      }
    }
  };
}
```

### 4. Repository Pattern (Data Access)

API calls are abstracted through typed clients:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Component Layer                             │
│  useTranscription() ← hook provides data + actions              │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                     Query/Mutation Layer                        │
│  useApiQuery() ← caching, refetching, loading states            │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                     API Client Layer                            │
│  apiClient.get/post ← retry, auth, error transform              │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                     Transport Layer                             │
│  fetch() → /api/proxy → Backend API                             │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Strategy Pattern (Multi-Tenant)

Tenant-specific behavior is driven by configuration:

```typescript
// Tenant configuration drives behavior
interface TenantConfig {
  id: TenantId;
  branding: BrandingConfig;     // Colors, logos, labels
  modules: ModuleId[];          // Enabled features
  roles: RoleConfig[];          // Permission mappings
  integrations: Integration[];  // External systems
}

// Components read from tenant context
function Header() {
  const { branding, modules } = useTenant();
  
  return (
    <header style={{ background: branding.theme.gradient }}>
      <Logo src={branding.logo.url} />
      {modules.includes('ai_insights') && <AIButton />}
    </header>
  );
}
```

### 6. State Machine Pattern (Workflow)

Meeting approval follows a defined state machine:

```
┌────────┐  submit   ┌───────────┐  assign   ┌───────────┐
│ draft  │──────────▶│ submitted │──────────▶│ in_review │
└───┬────┘           └───────────┘           └─────┬─────┘
    │                                              │
    │ withdraw                    ┌────────────────┼────────────────┐
    │                             │                │                │
    ▼                             ▼                ▼                ▼
┌────────┐                  ┌──────────┐    ┌───────────┐    ┌─────────┐
│(deleted)│                 │ approved │    │  changes  │    │rejected │
└─────────┘                 │          │    │ requested │    │         │
                            └────┬─────┘    └─────┬─────┘    └─────────┘
                                 │                │
                                 │  resubmit      │
                                 │◀───────────────┘
                                 ▼
                            ┌───────────┐
                            │ published │
                            └───────────┘
```

---

## State Management

The app uses a **hybrid state management** approach:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     STATE MANAGEMENT LAYERS                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    SERVER STATE                               │  │
│  │            (TanStack Query / useApiQuery)                     │  │
│  │  • API responses with caching                                 │  │
│  │  • Background refetching                                      │  │
│  │  • Optimistic updates                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    GLOBAL STATE                               │  │
│  │               (Context Providers)                             │  │
│  │  • Auth state (AuthProvider)                                  │  │
│  │  • Theme (ThemeProvider)                                      │  │
│  │  • Domain (DomainProvider)                                    │  │
│  │  • Demo data (DemoContext)                                    │  │
│  │  • Features (FeatureProvider)                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    LOCAL/UI STATE                             │  │
│  │                (useState, useReducer)                         │  │
│  │  • Form inputs                                                │  │
│  │  • Modal open/close                                           │  │
│  │  • Filter selections                                          │  │
│  │  • Component-specific state                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   PERSISTENT STATE                            │  │
│  │          (IndexedDB via Dexie + localStorage)                 │  │
│  │  • Offline queue (recordings, sync ops)                       │  │
│  │  • User preferences                                           │  │
│  │  • Feature flag overrides                                     │  │
│  │  • Auth tokens                                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Server State (TanStack Query Pattern)

```typescript
// Centralized server state with caching
function MeetingList() {
  const { data, isLoading, error, refetch } = useApiQuery(
    'meetings',
    () => apiClient.get<Meeting[]>('/api/proxy/api/v1/meetings'),
    {
      staleTime: 30000,        // Fresh for 30 seconds
      cacheTime: 300000,       // Cached for 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true
    }
  );
  // ...
}
```

### Global State (Context Pattern)

```typescript
// Provider hierarchy
<AuthProvider>           // isAuthenticated, user, login, logout
  <ThemeProvider>        // theme, colorMode, setTheme
    <DomainProvider>     // domain, switchDomain
      <DemoProvider>     // meetings, personas, addMeeting
        <FeatureProvider> // isEnabled, variant
          {children}
        </FeatureProvider>
      </DemoProvider>
    </DomainProvider>
  </ThemeProvider>
</AuthProvider>
```

### Persistent State (IndexedDB)

```typescript
// Offline-first storage with Dexie
class AppDatabase extends Dexie {
  recordings!: Table<OfflineRecording>;
  syncOperations!: Table<SyncOperation>;
  
  constructor() {
    super('UniversalAppDB');
    this.version(1).stores({
      recordings: '++id, status, createdAt, case_reference',
      syncOperations: '++id, type, status, priority, createdAt'
    });
  }
}
```

---

## Data Flow

### Recording to Published Minute

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          USER JOURNEY                                    │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────┐                                                              
│  1. RECORD  │  Social worker records home visit                           
│             │                                                              
│  ┌───────┐  │     ┌────────────────────────────────────────────────┐     
│  │ Mic   │  │────▶│ MediaRecorder API → Blob → IndexedDB (offline) │     
│  │ Audio │  │     └─────────────────────────┬──────────────────────┘     
│  └───────┘  │                               │                              
└─────────────┘                               │ Network available?           
                                              │                              
                              ┌───────────────┴───────────────┐              
                              │                               │              
                          No (Queue)                      Yes (Upload)       
                              │                               │              
                              ▼                               ▼              
                    ┌─────────────────┐            ┌─────────────────┐      
                    │  Offline Queue  │            │   POST /api/    │      
                    │   (IndexedDB)   │───────────▶│   recordings    │      
                    └─────────────────┘  Sync      └────────┬────────┘      
                                                           │               
┌─────────────┐                                            │               
│ 2.TRANSCRIBE│  Backend processes audio                   │               
│             │                                            ▼               
│  ┌───────┐  │     ┌─────────────────────────────────────────────────┐   
│  │Azure  │  │◀────│ Worker: Audio → Azure Speech → Raw Transcript  │   
│  │Speech │  │     └─────────────────────────────────────────────────┘   
│  └───────┘  │                               │                           
└─────────────┘                               │                           
                                              ▼                           
┌─────────────┐     ┌─────────────────────────────────────────────────┐   
│ 3. GENERATE │     │ Worker: Transcript → Azure OpenAI → Structured │   
│             │     │         Minutes with sections, actions, risks  │   
│  ┌───────┐  │     └─────────────────────────────────────────────────┘   
│  │Azure  │  │                               │                           
│  │OpenAI │  │                               │                           
│  └───────┘  │                               ▼                           
└─────────────┘                    ┌─────────────────────┐                
                                   │   Minutes Entity    │                
                                   │   status: "draft"   │                
┌─────────────┐                    └──────────┬──────────┘                
│  4. REVIEW  │                               │                           
│             │                               │ Submit for review         
│  ┌───────┐  │                               ▼                           
│  │Manager│  │     ┌─────────────────────────────────────────────────┐   
│  │ Queue │  │◀────│ Workflow: draft → submitted → in_review →       │   
│  └───────┘  │     │           approved/changes_requested            │   
└─────────────┘     └──────────────────────────┬──────────────────────┘   
                                               │                          
┌─────────────┐                                │ Approved                 
│ 5. PUBLISH  │                                ▼                          
│             │     ┌─────────────────────────────────────────────────┐   
│  ┌───────┐  │     │ Export: Generate Word/PDF → SharePoint/Mosaic   │   
│  │ Share │  │────▶│ Status: "published"                             │   
│  │ Point │  │     └─────────────────────────────────────────────────┘   
│  └───────┘  │                                                           
└─────────────┘                                                           
```

### API Request Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REQUEST FLOW                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────┐                                                  │
│  │   Component       │                                                  │
│  │   useApiQuery()   │                                                  │
│  └─────────┬─────────┘                                                  │
│            │                                                            │
│            ▼                                                            │
│  ┌───────────────────┐  Check cache  ┌─────────────────────────────┐  │
│  │   Query Cache     │◀─────────────▶│ Return cached if fresh      │  │
│  │                   │               │ Otherwise fetch             │  │
│  └─────────┬─────────┘               └─────────────────────────────┘  │
│            │ Cache miss or stale                                       │
│            ▼                                                            │
│  ┌───────────────────┐                                                  │
│  │   apiClient       │                                                  │
│  │   .get/post()     │                                                  │
│  └─────────┬─────────┘                                                  │
│            │                                                            │
│            ▼                                                            │
│  ┌───────────────────┐  ┌─────────────────────────────────────────┐   │
│  │ Request           │  │ • Add Authorization: Bearer <token>     │   │
│  │ Interceptor       │──│ • Add X-Request-ID                      │   │
│  │                   │  │ • Add tenant headers                    │   │
│  └─────────┬─────────┘  └─────────────────────────────────────────┘   │
│            │                                                            │
│            ▼                                                            │
│  ┌───────────────────┐                                                  │
│  │ fetch()           │                                                  │
│  │ /api/proxy/...    │                                                  │
│  └─────────┬─────────┘                                                  │
│            │                                                            │
│            ▼                                                            │
│  ┌───────────────────┐  ┌─────────────────────────────────────────┐   │
│  │ API Proxy Route   │  │ • Forward headers                       │   │
│  │ (Next.js server)  │──│ • Transform URLs                        │   │
│  │                   │  │ • Handle multipart                      │   │
│  └─────────┬─────────┘  └─────────────────────────────────────────┘   │
│            │                                                            │
│            ▼                                                            │
│  ┌───────────────────┐                                                  │
│  │ Backend API       │                                                  │
│  │ (minute-main)     │                                                  │
│  └─────────┬─────────┘                                                  │
│            │                                                            │
│            ▼ Response                                                   │
│  ┌───────────────────┐  ┌─────────────────────────────────────────┐   │
│  │ Response          │  │ • Transform to ApiError on failure      │   │
│  │ Interceptor       │──│ • Extract rate limit headers            │   │
│  │                   │  │ • Parse JSON/text body                  │   │
│  └─────────┬─────────┘  └─────────────────────────────────────────┘   │
│            │                                                            │
│            ▼                                                            │
│  ┌───────────────────┐  ┌─────────────────────────────────────────┐   │
│  │ Retry Logic       │  │ On 429, 5xx: exponential backoff retry  │   │
│  │                   │──│ Max 3 attempts: 1s → 2s → 4s            │   │
│  │                   │  │ On network error: queue for offline     │   │
│  └─────────┬─────────┘  └─────────────────────────────────────────┘   │
│            │                                                            │
│            ▼                                                            │
│  ┌───────────────────┐                                                  │
│  │   Component       │                                                  │
│  │   data/error      │                                                  │
│  └───────────────────┘                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ AUTHENTICATION (Azure Entra ID / MSAL)                           │  │
│  │ • OAuth 2.0 + OpenID Connect                                     │  │
│  │ • Token refresh with idle timeout                                │  │
│  │ • Demo mode bypass for development                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ AUTHORIZATION (Role-Based Access Control)                        │  │
│  │ • Roles: social_worker, manager, admin, housing_officer          │  │
│  │ • Domain-scoped (children, adults, housing, corporate)           │  │
│  │ • Module-level permissions                                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ DATA PROTECTION                                                  │  │
│  │ • HTTPS/TLS for all traffic                                      │  │
│  │ • No PII in logs (Sentry/PostHog)                                │  │
│  │ • Tenant data isolation                                          │  │
│  │ • Secure cookie storage (httpOnly, secure, sameSite)             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ INPUT VALIDATION                                                 │  │
│  │ • Pydantic models on backend                                     │  │
│  │ • Zod/TypeScript on frontend                                     │  │
│  │ • CSRF protection via tokens                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ API SECURITY                                                     │  │
│  │ • Rate limiting (100 req/min general, 10 req/min uploads)        │  │
│  │ • Request ID tracing                                             │  │
│  │ • CORS configuration                                             │  │
│  │ • Content-Type validation                                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework with App Router |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | v4 | Utility-first CSS |
| Radix UI | Latest | Accessible primitives |
| Framer Motion | Latest | Animations |
| MSAL | 3.x | Azure AD authentication |
| PostHog | Latest | Analytics & feature flags |
| Sentry | Latest | Error tracking |

## Project Structure

```
universal-app/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   ├── admin/        # Admin routes
│   │   ├── api/          # API routes
│   │   ├── capture/      # Recording capture
│   │   ├── minutes/      # Minutes management
│   │   ├── record/       # Recording page
│   │   ├── review-queue/ # Manager review
│   │   └── templates/    # Template management
│   │
│   ├── components/       # React components
│   │   ├── ui/           # Base primitives
│   │   ├── layout/       # Layout components
│   │   ├── recording/    # Recording UI
│   │   ├── transcription/# Transcript viewer
│   │   ├── minutes/      # Minutes editor
│   │   ├── charts/       # Data visualization
│   │   └── mobile/       # Mobile-specific
│   │
│   ├── hooks/            # Custom React hooks
│   │
│   ├── lib/              # Utility libraries
│   │   ├── api/          # API client
│   │   ├── audio/        # Audio recording
│   │   ├── auth/         # MSAL configuration
│   │   ├── features/     # Feature flags
│   │   ├── offline-queue.ts # Offline sync
│   │   ├── themes/       # Theme system
│   │   └── transcription/# Transcript utils
│   │
│   ├── providers/        # Context providers
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── QueryProvider.tsx
│   │
│   ├── context/          # React contexts
│   ├── config/           # Configuration
│   ├── types/            # TypeScript types
│   └── tests/            # Test files
│
├── public/               # Static assets
│   ├── sw.js             # Service worker
│   └── manifest.json     # PWA manifest
│
├── docs/                 # Documentation
├── scripts/              # Build scripts
└── next.config.ts        # Next.js config
```

## Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                    Pages (App Router)                │
│  /record  /minutes  /review-queue  /admin  /api     │
├─────────────────────────────────────────────────────┤
│                    Components                        │
│  UI Primitives │ Feature Components │ Layout        │
├─────────────────────────────────────────────────────┤
│                    Hooks                             │
│  useAuth │ useRecorder │ useTranscription │ ...     │
├─────────────────────────────────────────────────────┤
│                    Providers                         │
│  Auth │ Theme │ Query │ Features │ Domain           │
├─────────────────────────────────────────────────────┤
│                    Libraries                         │
│  API Client │ Audio │ Offline Queue │ Themes        │
├─────────────────────────────────────────────────────┤
│                    External Services                 │
│  minute-main API │ Azure AD │ PostHog │ Sentry     │
└─────────────────────────────────────────────────────┘
```

## Core Concepts

### 1. Server vs Client Components

```tsx
// Server Component (default)
// - No 'use client' directive
// - Can be async
// - No hooks, state, or browser APIs
async function ServerPage() {
  const data = await fetchData(); // Direct fetch
  return <DataView data={data} />;
}

// Client Component
// - Has 'use client' directive
// - Hooks, state, event handlers
'use client';
function ClientComponent() {
  const [state, setState] = useState();
  return <button onClick={() => setState(...)}>Click</button>;
}
```

### 2. Multi-Tenancy

The app supports multiple councils with distinct branding:

```typescript
// Tenant configuration
interface TenantConfig {
  councilId: CouncilId;           // 'wcc' | 'rbkc' | 'default'
  serviceDomain: ServiceDomain;   // 'children' | 'adults' | 'housing'
  branding: CouncilBranding;      // Colors, logo, name
  modules: EnabledModule[];       // Active features
  roles: RoleConfig[];            // Permission mappings
}

// Usage
const { councilId, serviceDomain } = useTenant();
const modules = useModules(councilId);
```

### 3. Module System

Features are organized as modules that can be enabled/disabled per tenant:

```typescript
// Module definition
interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType;
  routes: Route[];
  requiredRoles: Role[];
  featureFlags: string[];
}

// Module registry
const moduleRegistry = new Map<string, Module>([
  ['ai_insights', aiInsightsModule],
  ['sharepoint_export', sharepointModule],
  ['batch_processing', batchModule],
]);

// Conditional rendering
<ModuleGuard module="ai_insights">
  <AIInsightsPanel />
</ModuleGuard>
```

### 4. Offline-First Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Recording     │────▶│  Offline Queue  │
│   Component     │     │   (IndexedDB)   │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    Sync Manager         │
                    │ (Background sync when   │
                    │  connectivity restored) │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    Backend API          │
                    │   (minute-main)         │
                    └─────────────────────────┘
```

```typescript
// Queue recording for offline sync
import { queueRecording } from '@/lib/offline-queue';

const recordingId = await queueRecording(audioBlob, {
  case_reference: 'SW-2026-001',
  template_name: 'visit-note'
});

// Sync manager handles upload when online
const { isSyncing, pendingCount, sync } = useSyncManager();
```

### 5. Theme System

OKLCH color system with CSS variables:

```typescript
// Theme structure
interface ThemeDefinition {
  colors: ColorPalette;       // OKLCH colors
  semantic: SemanticPalette;  // Mapped tokens
  glass: GlassTokens;         // Glass morphism
  gradients: GradientTokens;
  shadows: ShadowTokens;
}

// Theme application
function ThemeSetter() {
  const { theme, resolvedColorMode } = useTheme();
  
  useEffect(() => {
    const cssVars = themeToCSSVariables(theme, resolvedColorMode);
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [theme, resolvedColorMode]);
}
```

## Data Flow

### API Data Flow

```
Component ──▶ useApiQuery ──▶ apiClient ──▶ Backend API
    │              │              │
    │              ▼              │
    │         Cache Layer         │
    │              │              │
    ◀──────── Response ◀──────────┘
```

### State Management

```
┌────────────────────────────────────────────────┐
│                   Providers                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │   Auth   │ │  Theme   │ │   Features   │   │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│       │            │              │            │
│  ┌────▼────────────▼──────────────▼───────┐   │
│  │            Context Values               │   │
│  └────────────────────────────────────────┘   │
└────────────────────┬───────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │   Custom Hooks        │
         │  useAuth, useTheme,   │
         │  useFeatures, etc.    │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │     Components        │
         └───────────────────────┘
```

## Authentication Flow

```
  User              App                 Azure AD           Backend
   │                 │                      │                  │
   │  Click Login    │                      │                  │
   │────────────────▶│                      │                  │
   │                 │  MSAL Redirect       │                  │
   │                 │─────────────────────▶│                  │
   │                 │                      │                  │
   │                 │◀────── ID Token ─────│                  │
   │                 │                      │                  │
   │                 │  Get Access Token    │                  │
   │                 │─────────────────────▶│                  │
   │                 │                      │                  │
   │                 │◀─── Access Token ────│                  │
   │                 │                      │                  │
   │                 │  API Request + Token │                  │
   │                 │────────────────────────────────────────▶│
   │                 │                      │                  │
   │                 │◀───────────── Response ─────────────────│
   │  Content        │                      │                  │
   │◀────────────────│                      │                  │
```

## Feature Flag System

```typescript
// Flag definition
interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  defaultValue: boolean;
  tags: string[];
  rolloutPercentage?: number;
  targetRoles?: string[];
}

// PostHog integration
const { isEnabled } = useFeatureEnabled('new_editor');

// A/B testing
const variant = useFeatureVariant('onboarding_experiment');
// 'control' | 'variant_a' | 'variant_b'
```

## Error Handling

### Boundary Strategy

```tsx
// Root error boundary
function RootLayout({ children }) {
  return (
    <ErrorBoundary
      fallback={<FullPageError />}
      onError={(error) => Sentry.captureException(error)}
    >
      {children}
    </ErrorBoundary>
  );
}

// Component-level boundaries
function FeatureSection() {
  return (
    <ErrorBoundary fallback={<FeatureError />}>
      <RiskyComponent />
    </ErrorBoundary>
  );
}
```

### Error Types

```typescript
// API errors
try {
  await apiClient.get('/api/data');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isUnauthorized) redirect('/login');
    if (error.isNotFound) return <NotFound />;
    if (error.isServerError) showRetryPrompt();
  }
  if (error instanceof NetworkError) {
    queueForRetry();
  }
}
```

## Performance Optimization

### Code Splitting

```typescript
// Dynamic imports
const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { loading: () => <Skeleton /> }
);

// Route-based splitting (automatic in App Router)
// Each route segment is a separate chunk
```

### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Council Logo"
  width={200}
  height={60}
  priority  // LCP image
/>
```

### Caching Strategy

```typescript
// API query caching
useApiQuery('key', fetcher, {
  staleTime: 60000,      // Fresh for 60s
  cacheTime: 300000,     // Keep in cache 5min
  refetchOnWindowFocus: false
});

// Service worker caching (sw.js)
// - App shell cached
// - API responses cached with network-first
// - Static assets cached with cache-first
```

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// Component test
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});

// Hook test
import { renderHook } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

test('increments counter', () => {
  const { result } = renderHook(() => useCounter());
  act(() => result.current.increment());
  expect(result.current.count).toBe(1);
});
```

### E2E Tests (Playwright)

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './src/tests/e2e',
  use: { baseURL: 'http://localhost:3000' }
});

// Recording flow test
test('can record and submit', async ({ page }) => {
  await page.goto('/record');
  await page.click('[data-testid="start-recording"]');
  await page.waitForTimeout(3000);
  await page.click('[data-testid="stop-recording"]');
  await page.click('[data-testid="submit"]');
  await expect(page).toHaveURL(/\/minutes\//);
});
```

## Observability

### Sentry Integration

```typescript
// Error tracking
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1
});

// Manual error capture
Sentry.captureException(error, {
  tags: { feature: 'recording' },
  extra: { recordingId }
});
```

### PostHog Analytics

```typescript
// Event tracking
posthog.capture('recording_completed', {
  duration: 120,
  templateId: 'visit-note'
});

// User identification
posthog.identify(userId, {
  role: 'social-worker',
  council: 'wcc'
});
```

### Web Vitals

```typescript
// Core Web Vitals monitoring
import { useWebVitals } from '@/hooks/useWebVitals';

function PerformanceDebug() {
  const { LCP, FID, CLS, TTFB, FCP } = useWebVitals();
  
  // Report to analytics
  useEffect(() => {
    if (LCP) posthog.capture('web_vital', { metric: 'LCP', value: LCP });
  }, [LCP]);
}
```

## Security

### Authentication

- Azure Entra ID (MSAL) for authentication
- Access tokens for API authorization
- Secure token storage (memory, not localStorage)
- Automatic token refresh

### Authorization

```typescript
// Role-based access
<AuthGate requiredRoles={['admin']}>
  <AdminPanel />
</AuthGate>

// Module-based access
<ModuleGuard module="sharepoint_export">
  <SharePointExport />
</ModuleGuard>
```

### Content Security

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
];
```

## Build & Deploy

### Development

```bash
npm run dev          # Start dev server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript check
npm run test         # Run tests
```

### Production Build

```bash
npm run build        # Production build
npm run start        # Start production server
npm run analyze      # Bundle analysis
```

### Environment Variables

```env
# Required
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_AZURE_CLIENT_ID=xxx
NEXT_PUBLIC_AZURE_TENANT_ID=xxx

# Optional
NEXT_PUBLIC_POSTHOG_KEY=xxx
NEXT_PUBLIC_SENTRY_DSN=xxx
NEXT_PUBLIC_DEMO_MODE=false
```

## Related Documentation

- [API.md](./API.md) - API client documentation
- [HOOKS.md](./HOOKS.md) - Custom hooks reference
- [COMPONENTS.md](./COMPONENTS.md) - Component library
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Quick start guide
