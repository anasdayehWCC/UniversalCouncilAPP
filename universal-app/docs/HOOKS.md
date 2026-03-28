# Custom Hooks Documentation

> React hooks for the Universal Council App frontend.

## Overview

Custom hooks are located in `src/hooks/` and provide reusable stateful logic for:

- Authentication & authorization
- Data fetching & caching
- Audio recording & transcription
- Theme & accessibility
- Offline support
- Feature flags

## Authentication Hooks

### useAuth

Main authentication hook using MSAL (Azure Entra ID).

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const {
    // State
    isAuthenticated,
    isLoading,
    accessToken,
    account,
    idTokenClaims,
    error,
    
    // Actions
    login,
    logout,
    getToken
  } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  
  if (!isAuthenticated) {
    return <button onClick={login}>Sign In</button>;
  }

  return (
    <div>
      <p>Welcome, {idTokenClaims?.name}</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

#### Types

```typescript
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  account: AccountInfo | null;
  idTokenClaims: IdTokenClaims | null;
  inProgress: InteractionStatus;
  error: Error | null;
}

interface IdTokenClaims {
  email?: string;
  preferred_username?: string;
  name?: string;
  oid?: string;           // Object ID
  tid?: string;           // Tenant ID
  organisation_id?: string;
  roles?: string[];
  groups?: string[];
}

interface AuthActions {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
}
```

### useRoleGuard

Protect components based on user roles.

```typescript
import { useRoleGuard } from '@/hooks/useRoleGuard';

function AdminPanel() {
  const { hasAccess, isLoading } = useRoleGuard({
    requiredRoles: ['admin', 'manager'],
    requireAll: false  // any role matches
  });

  if (isLoading) return <Skeleton />;
  if (!hasAccess) return <AccessDenied />;
  
  return <AdminContent />;
}
```

## Recording & Audio Hooks

### useRecorder

Full audio recording with offline queue integration.

```typescript
import { useRecorder } from '@/hooks/useRecorder';

function RecordingPage() {
  const {
    // State
    state,              // 'idle' | 'recording' | 'paused' | 'stopped'
    duration,           // seconds
    formattedDuration,  // "02:30"
    audioLevel,         // real-time level data
    waveformData,
    devices,            // available audio devices
    permission,
    error,
    isSaving,
    
    // Controls
    start,
    stop,
    pause,
    resume,
    cancel,
    requestPermission,
    selectDevice,
    saveToQueue
  } = useRecorder({
    quality: 'high',
    autoSave: true
  });

  return (
    <div>
      <AudioVisualizer data={audioLevel} />
      <p>{formattedDuration}</p>
      
      {state === 'idle' && (
        <button onClick={start}>Start Recording</button>
      )}
      {state === 'recording' && (
        <>
          <button onClick={pause}>Pause</button>
          <button onClick={stop}>Stop</button>
        </>
      )}
      {state === 'paused' && (
        <button onClick={resume}>Resume</button>
      )}
      {state === 'stopped' && (
        <button onClick={() => saveToQueue({ case_reference: 'SW-001' })}>
          Save
        </button>
      )}
    </div>
  );
}
```

#### Types

```typescript
interface UseRecorderState {
  state: RecordingState;           // 'idle' | 'recording' | 'paused' | 'stopped'
  duration: number;
  formattedDuration: string;
  audioLevel: AudioLevelData;
  waveformData: WaveformData | null;
  devices: AudioDevice[];
  selectedDeviceId: string;
  permission: AudioPermissionStatus;
  error: RecorderError | null;
  metadata: RecordingMetadata | null;
  completedRecording: CompletedRecording | null;
  isSaving: boolean;
  autoSave: boolean;
}

interface UseRecorderControls {
  start: () => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  requestPermission: () => Promise<AudioPermissionStatus>;
  refreshDevices: () => Promise<void>;
  selectDevice: (deviceId: string) => void;
  saveToQueue: (caseMetadata?: CaseMetadata) => Promise<number | null>;
}
```

### useTranscription

Manage transcription data with playback sync and editing.

```typescript
import { useTranscription } from '@/hooks/useTranscription';

function TranscriptViewer({ recordingId }: { recordingId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const {
    transcription,
    isLoading,
    error,
    filteredSegments,
    syncedSegments,
    activeSegmentIndex,
    searchQuery,
    searchResults,
    
    // Actions
    loadTranscription,
    search,
    clearSearch,
    seekTo,
    filterBySpeaker,
    startEditing,
    saveEdit
  } = useTranscription({
    audioRef,
    autoScroll: true
  });

  useEffect(() => {
    loadTranscription(recordingId);
  }, [recordingId, loadTranscription]);

  return (
    <div>
      <audio ref={audioRef} />
      <SearchInput value={searchQuery} onChange={search} />
      
      {syncedSegments.map((segment, index) => (
        <Segment
          key={segment.id}
          segment={segment}
          isActive={index === activeSegmentIndex}
          onClick={() => seekTo(segment.startTime)}
        />
      ))}
    </div>
  );
}
```

## Theme & UI Hooks

### useTheme

Full theme context access.

```typescript
import { useTheme } from '@/hooks/useTheme';

function ThemeDemo() {
  const {
    colorMode,           // 'light' | 'dark' | 'system'
    resolvedColorMode,   // 'light' | 'dark'
    isDark,
    councilId,
    councilName,
    theme,
    
    setColorMode,
    toggleColorMode,
    setCouncilId
  } = useTheme();

  return (
    <div>
      <p>Current: {colorMode} (resolved: {resolvedColorMode})</p>
      <button onClick={toggleColorMode}>Toggle Theme</button>
      <select onChange={(e) => setCouncilId(e.target.value)}>
        <option value="default">Default</option>
        <option value="wcc">Westminster</option>
        <option value="rbkc">Kensington & Chelsea</option>
      </select>
    </div>
  );
}
```

### useColorMode

Simplified color mode access.

```typescript
import { useColorMode } from '@/hooks/useTheme';

function DarkModeToggle() {
  const { isDark, toggleColorMode, isSystemMode } = useColorMode();
  
  return (
    <button onClick={toggleColorMode}>
      {isDark ? '🌙' : '☀️'}
      {isSystemMode && ' (System)'}
    </button>
  );
}
```

### useResponsive

Responsive design utilities.

```typescript
import { useResponsive, useIsMobile, useBreakpoint } from '@/hooks/useResponsive';

function ResponsiveLayout({ children }) {
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint(); // 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  
  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {children}
    </div>
  );
}
```

### usePrefersReducedMotion

Respect reduced motion preferences.

```typescript
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

function AnimatedComponent() {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  return (
    <motion.div
      animate={{ x: 100 }}
      transition={{ 
        duration: prefersReducedMotion ? 0 : 0.3 
      }}
    />
  );
}
```

## Feature Flag Hooks

### useFeatures

Check feature availability.

```typescript
import { useFeatureEnabled, useAllFeatures } from '@/hooks/useFeatures';

function AIFeature() {
  const { isEnabled, track } = useFeatureEnabled('ai_insights');
  
  if (!isEnabled) return null;
  
  return (
    <button onClick={() => {
      track(); // Track feature usage
      openAIPanel();
    }}>
      AI Insights
    </button>
  );
}

function FeatureList() {
  const { enabledFeatures, hasAIFeatures, hasIntegrations } = useAllFeatures();
  // ...
}
```

### useFeatureVariant

A/B testing with variants.

```typescript
import { useFeatureVariant } from '@/hooks/useFeatures';

function ExperimentComponent() {
  const variant = useFeatureVariant('onboarding_flow'); // 'control' | 'variant_a'
  
  switch (variant) {
    case 'variant_a':
      return <NewOnboarding />;
    default:
      return <StandardOnboarding />;
  }
}
```

## Data & State Hooks

### useApiQuery

Data fetching with caching (see [API.md](./API.md) for details).

```typescript
import { useApiQuery } from '@/lib/useApiQuery';

const { data, isLoading, error, refetch } = useApiQuery(
  'key',
  () => apiClient.get('/endpoint'),
  { staleTime: 60000 }
);
```

### useOptimisticMutation

Optimistic updates with rollback.

```typescript
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';

function FavoriteButton({ itemId, isFavorited }) {
  const { mutate, isPending } = useOptimisticMutation({
    mutationFn: () => apiClient.post(`/api/favorites/${itemId}`),
    optimisticData: { isFavorited: !isFavorited },
    rollbackOnError: true
  });

  return (
    <button onClick={mutate} disabled={isPending}>
      {isFavorited ? '★' : '☆'}
    </button>
  );
}
```

### useSyncManager

Manage offline sync operations.

```typescript
import { useSyncManager } from '@/hooks/useSyncManager';

function SyncStatus() {
  const {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    sync,
    clearPending
  } = useSyncManager();

  return (
    <div>
      {!isOnline && <span>Offline</span>}
      {pendingCount > 0 && (
        <span>{pendingCount} items pending</span>
      )}
      <button onClick={sync} disabled={isSyncing}>
        Sync Now
      </button>
    </div>
  );
}
```

## Navigation & Routing Hooks

### useNavigation

Module-aware navigation.

```typescript
import { useNavigation } from '@/hooks/useNavigation';

function Sidebar() {
  const { 
    items,
    activeItem,
    navigate,
    canAccess
  } = useNavigation();

  return (
    <nav>
      {items.map(item => (
        <NavItem
          key={item.href}
          item={item}
          active={activeItem?.href === item.href}
          onClick={() => navigate(item.href)}
        />
      ))}
    </nav>
  );
}
```

### useShortcuts

Keyboard shortcuts.

```typescript
import { useShortcuts } from '@/hooks/useShortcuts';

function App() {
  useShortcuts([
    { key: 'k', meta: true, handler: openSearch },
    { key: 'n', meta: true, handler: newRecording },
    { key: 'Escape', handler: closeModal }
  ]);

  return <AppContent />;
}
```

## Analytics & Monitoring Hooks

### useAnalytics

Unified analytics tracking.

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function RecordingComplete() {
  const { track, identify } = useAnalytics();

  const handleComplete = () => {
    track('recording_completed', {
      duration: 120,
      templateId: 'visit-note',
      hasTranscript: true
    });
  };

  useEffect(() => {
    identify({ role: user.role, council: user.councilId });
  }, [user]);

  return <button onClick={handleComplete}>Complete</button>;
}
```

### useWebVitals

Core Web Vitals monitoring.

```typescript
import { useWebVitals } from '@/hooks/useWebVitals';

function PerformanceMonitor() {
  const vitals = useWebVitals();
  
  useEffect(() => {
    if (vitals.CLS > 0.1) {
      console.warn('High CLS detected');
    }
  }, [vitals.CLS]);
}
```

## Accessibility Hooks

### useAccessibility

A11y utilities.

```typescript
import { useAccessibility } from '@/hooks/useAccessibility';

function AccessibleComponent() {
  const {
    announceToScreenReader,
    focusFirst,
    trapFocus,
    restoreFocus
  } = useAccessibility();

  const openModal = () => {
    trapFocus(modalRef.current);
    announceToScreenReader('Dialog opened');
  };

  const closeModal = () => {
    restoreFocus();
    announceToScreenReader('Dialog closed');
  };
}
```

## Domain-Specific Hooks

### useMinutes

Minutes management.

```typescript
import { useMinutes } from '@/hooks/useMinutes';

const {
  minutes,
  isLoading,
  createMinute,
  updateMinute,
  deleteMinute,
  exportMinute
} = useMinutes({ caseReference: 'SW-001' });
```

### useReview

Review workflow operations.

```typescript
import { useReview } from '@/hooks/useReview';

const {
  queue,
  currentItem,
  approve,
  reject,
  requestChanges,
  isSubmitting
} = useReview();
```

### useTemplates

Template management.

```typescript
import { useTemplates } from '@/hooks/useTemplates';

const {
  templates,
  selectedTemplate,
  selectTemplate,
  applyTemplate
} = useTemplates({ serviceDomain: 'children' });
```

### useWorkflow

State machine for workflow management.

```typescript
import { useWorkflow } from '@/hooks/useWorkflow';

const {
  state,
  transitions,
  canTransition,
  transition,
  history
} = useWorkflow({
  initialState: 'draft',
  config: minuteWorkflowConfig
});

// Check if transition is valid
if (canTransition('submit_for_review')) {
  transition('submit_for_review', { reviewerId: 'user-123' });
}
```

## Best Practices

### 1. Composition Over Complexity

```typescript
// ✅ Good - compose simple hooks
function RecordingWithAuth() {
  const { isAuthenticated } = useAuth();
  const recorder = useRecorder();
  
  if (!isAuthenticated) return <LoginPrompt />;
  return <Recorder {...recorder} />;
}

// ❌ Avoid - monolithic hook
function useMegaRecordingHook() {
  // Everything mixed together
}
```

### 2. Cleanup Effects

```typescript
// ✅ Good - proper cleanup
function useRecording() {
  useEffect(() => {
    const cleanup = setupRecording();
    return cleanup; // Always return cleanup
  }, []);
}
```

### 3. Memoize Callbacks

```typescript
// ✅ Good - stable references
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// ❌ Avoid - new function every render
const handleClick = () => doSomething(id);
```

### 4. Handle Loading States

```typescript
// ✅ Good - explicit loading handling
function DataComponent() {
  const { data, isLoading, error } = useData();
  
  if (isLoading) return <Skeleton variant="data" />;
  if (error) return <ErrorDisplay error={error} />;
  if (!data) return <EmptyState />;
  
  return <DataView data={data} />;
}
```

### 5. Type Your Hooks

```typescript
// ✅ Good - explicit return type
interface UseCounterReturn {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

function useCounter(initial = 0): UseCounterReturn {
  const [count, setCount] = useState(initial);
  // ...
}
```

## Hook Index

| Hook | Category | Description |
|------|----------|-------------|
| `useAuth` | Auth | MSAL authentication |
| `useRoleGuard` | Auth | Role-based access |
| `useRecorder` | Audio | Audio recording |
| `useTranscription` | Audio | Transcript management |
| `useTheme` | UI | Theme context |
| `useColorMode` | UI | Dark/light mode |
| `useResponsive` | UI | Responsive utilities |
| `useFeatureEnabled` | Features | Feature flags |
| `useApiQuery` | Data | Data fetching |
| `useOptimisticMutation` | Data | Optimistic updates |
| `useSyncManager` | Offline | Sync management |
| `useNavigation` | Navigation | Module-aware nav |
| `useShortcuts` | Interaction | Keyboard shortcuts |
| `useAnalytics` | Analytics | Event tracking |
| `useWebVitals` | Performance | Core Web Vitals |
| `useAccessibility` | A11y | A11y utilities |
| `useMinutes` | Domain | Minutes CRUD |
| `useReview` | Domain | Review workflow |
| `useTemplates` | Domain | Template management |
| `useWorkflow` | Domain | State machine |
