# Component Library Documentation

> UI component library for the Universal Council App.

## Overview

Components are located in `src/components/` with the following structure:

```
components/
├── ui/              # Base UI primitives (Button, Input, Card, etc.)
├── layout/          # Layout components (Sidebar, Header, etc.)
├── charts/          # Data visualization
├── recording/       # Recording UI components
├── transcription/   # Transcript viewer components
├── minutes/         # Minutes editor components
├── review/          # Review queue components
├── admin/           # Admin panel components
├── templates/       # Template management
├── mobile/          # Mobile-specific components
├── skeletons/       # Loading skeletons
└── ...
```

## Base UI Components

### Button

Versatile button with multiple variants.

```tsx
import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Link Style</Button>
<Button variant="glass">Glass Effect</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><IconPlus /></Button>

// States
<Button disabled>Disabled</Button>
<Button loading>Loading...</Button>
```

#### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link' | 'glass';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}
```

### Card

Container with optional header and footer.

```tsx
import { Card } from '@/components/ui/card';

<Card>
  <Card.Header>
    <Card.Title>Meeting Minutes</Card.Title>
    <Card.Description>March 28, 2026</Card.Description>
  </Card.Header>
  <Card.Content>
    <p>Content goes here...</p>
  </Card.Content>
  <Card.Footer>
    <Button>Save</Button>
  </Card.Footer>
</Card>

// Glass variant
<Card variant="glass">
  <Card.Content>Glassmorphism style</Card.Content>
</Card>
```

### Input

Form input with label and error states.

```tsx
import { Input } from '@/components/ui/input';
import { EnhancedInput } from '@/components/ui/EnhancedInput';

// Basic
<Input placeholder="Enter text..." />

// With type
<Input type="email" placeholder="email@example.com" />
<Input type="password" />
<Input type="search" />

// Enhanced with label and error
<EnhancedInput
  label="Case Reference"
  placeholder="SW-2026-001"
  error="Invalid format"
  helperText="Format: XX-YYYY-NNN"
/>
```

### Select

Dropdown selection.

```tsx
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <span>{value || 'Select option...'}</span>
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Tabs

Tab navigation.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <OverviewPanel />
  </TabsContent>
  <TabsContent value="details">
    <DetailsPanel />
  </TabsContent>
  <TabsContent value="history">
    <HistoryPanel />
  </TabsContent>
</Tabs>
```

### Badge

Status and category indicators.

```tsx
import { Badge } from '@/components/ui/badge';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="success">Approved</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Rejected</Badge>
```

### Skeleton

Loading placeholders.

```tsx
import { Skeleton } from '@/components/ui/skeleton';

// Basic shapes
<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-4 w-full" />
<Skeleton className="h-12 w-12 rounded-full" />

// Card skeleton
function CardSkeleton() {
  return (
    <Card>
      <Card.Header>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </Card.Header>
      <Card.Content>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </Card.Content>
    </Card>
  );
}
```

### Progress

Progress indicators.

```tsx
import { ProgressBar } from '@/components/ui/ProgressBar';

<ProgressBar value={75} max={100} />
<ProgressBar value={50} variant="success" />
<ProgressBar value={25} showLabel />
<ProgressBar indeterminate /> // Loading state
```

## Feature Components

### ThemeSetter

Apply theme tokens to the application.

```tsx
import { ThemeSetter } from '@/components/ThemeSetter';

// In layout
function RootLayout({ children }) {
  return (
    <>
      <ThemeSetter />
      {children}
    </>
  );
}
```

### AuthGate

Protect routes with authentication.

```tsx
import { AuthGate } from '@/components/AuthGate';

<AuthGate
  fallback={<LoginPage />}
  loadingFallback={<FullPageLoader />}
>
  <ProtectedContent />
</AuthGate>
```

### ModuleGuard

Conditionally render based on module/feature availability.

```tsx
import { ModuleGuard } from '@/components/ModuleGuard';

<ModuleGuard module="ai_insights" fallback={<UpgradePrompt />}>
  <AIInsightsPanel />
</ModuleGuard>
```

### ErrorBoundary

Catch and display errors gracefully.

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <p>Something went wrong: {error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
>
  <ComponentThatMightError />
</ErrorBoundary>
```

### ConnectivityIndicator

Show network status.

```tsx
import { ConnectivityIndicator } from '@/components/ConnectivityIndicator';

function AppHeader() {
  return (
    <header>
      <Logo />
      <ConnectivityIndicator />
    </header>
  );
}
```

### ResilienceBanner

Offline status with sync actions.

```tsx
import { ResilienceBanner } from '@/components/ResilienceBanner';

function AppLayout() {
  return (
    <>
      <ResilienceBanner />
      <MainContent />
    </>
  );
}
```

### Toast

Notification toasts.

```tsx
import { Toast, useToast } from '@/components/Toast';

function MyComponent() {
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      toast({
        title: 'Saved',
        description: 'Your changes have been saved.',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
}
```

## Recording Components

### Recording Page Components

```tsx
import { AudioVisualizer } from '@/components/recording/AudioVisualizer';
import { RecordingControls } from '@/components/recording/RecordingControls';
import { DeviceSelector } from '@/components/recording/DeviceSelector';
import { RecordingTimer } from '@/components/recording/RecordingTimer';

function RecordingPage() {
  const recorder = useRecorder();

  return (
    <div>
      <DeviceSelector
        devices={recorder.devices}
        selected={recorder.selectedDeviceId}
        onSelect={recorder.selectDevice}
      />
      
      <AudioVisualizer
        audioLevel={recorder.audioLevel}
        waveform={recorder.waveformData}
        isRecording={recorder.state === 'recording'}
      />
      
      <RecordingTimer duration={recorder.duration} />
      
      <RecordingControls
        state={recorder.state}
        onStart={recorder.start}
        onPause={recorder.pause}
        onResume={recorder.resume}
        onStop={recorder.stop}
        onCancel={recorder.cancel}
      />
    </div>
  );
}
```

## Transcription Components

### TranscriptPlayer

Synchronized transcript with audio playback.

```tsx
import { TranscriptPlayer } from '@/components/TranscriptPlayer';

<TranscriptPlayer
  transcription={transcription}
  audioUrl={audioUrl}
  onSegmentClick={(segment) => seekTo(segment.startTime)}
  highlightQuery={searchQuery}
  activeSpeakers={filteredSpeakers}
/>
```

### Transcript Viewer Components

```tsx
import {
  TranscriptSegment,
  TranscriptSearch,
  SpeakerFilter,
  TranscriptEditor
} from '@/components/transcription';

<div className="transcript-view">
  <TranscriptSearch
    query={searchQuery}
    onSearch={search}
    results={searchResults}
    currentIndex={currentSearchIndex}
    onNavigate={goToSearchResult}
  />
  
  <SpeakerFilter
    speakers={speakers}
    selected={selectedSpeakers}
    onToggle={toggleSpeakerFilter}
  />
  
  {segments.map(segment => (
    <TranscriptSegment
      key={segment.id}
      segment={segment}
      speaker={getSpeaker(segment.speakerId)}
      isActive={segment.id === activeSegmentId}
      isEditing={segment.id === editingSegmentId}
      onEdit={() => startEditing(segment.id)}
      onSave={(text) => saveEdit(segment.id, text)}
      onClick={() => seekTo(segment.startTime)}
    />
  ))}
</div>
```

## Minutes Components

### MeetingCard

Summary card for meetings.

```tsx
import { MeetingCard } from '@/components/MeetingCard';

<MeetingCard
  meeting={{
    id: 'mtg-123',
    title: 'Home Visit - Smith Family',
    date: new Date(),
    duration: 1800,
    status: 'completed',
    caseReference: 'SW-2026-001'
  }}
  onClick={() => navigate(`/minutes/${meeting.id}`)}
/>
```

### Minutes Editor

```tsx
import { MinutesEditor } from '@/components/minutes/MinutesEditor';

<MinutesEditor
  minute={minute}
  template={template}
  onSave={handleSave}
  onExport={handleExport}
  readOnly={status === 'approved'}
/>
```

## Admin Components

### Admin Dashboard

```tsx
import {
  AdminDashboard,
  UserManagement,
  ModuleSettings,
  AuditLog
} from '@/components/admin';

function AdminPage() {
  return (
    <AdminDashboard>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="modules">
          <ModuleSettings />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLog />
        </TabsContent>
      </Tabs>
    </AdminDashboard>
  );
}
```

## Charts & Visualizations

### Chart Components

```tsx
import {
  BarChart,
  LineChart,
  PieChart,
  AreaChart
} from '@/components/charts';

<LineChart
  data={timeSeriesData}
  xKey="date"
  yKey="count"
  color="var(--primary)"
  showGrid
  showTooltip
/>

<BarChart
  data={categoryData}
  xKey="category"
  yKey="value"
  colors={['var(--primary)', 'var(--secondary)']}
  stacked
/>

<PieChart
  data={distributionData}
  valueKey="percentage"
  labelKey="name"
  donut
  showLegend
/>
```

## Mobile Components

### Mobile-Specific Components

```tsx
import {
  BottomSheet,
  SwipeableCard,
  PullToRefresh,
  FloatingActionButton
} from '@/components/mobile';

// Bottom sheet modal
<BottomSheet
  open={isOpen}
  onClose={() => setIsOpen(false)}
  snapPoints={[0.25, 0.5, 0.9]}
>
  <SheetContent />
</BottomSheet>

// FAB
<FloatingActionButton
  icon={<PlusIcon />}
  onClick={handleNew}
  position="bottom-right"
/>

// Pull to refresh
<PullToRefresh onRefresh={refetch}>
  <ListContent />
</PullToRefresh>
```

## Layout Components

### App Shell

```tsx
import { AppShell, Sidebar, Header, MainContent } from '@/components/layout';

function AppLayout({ children }) {
  return (
    <AppShell>
      <Sidebar />
      <div className="flex-1">
        <Header />
        <MainContent>{children}</MainContent>
      </div>
    </AppShell>
  );
}
```

### Navigation

```tsx
import { Navigation, NavItem, NavGroup } from '@/components/navigation';

<Navigation>
  <NavGroup label="Main">
    <NavItem href="/" icon={<HomeIcon />}>Home</NavItem>
    <NavItem href="/record" icon={<MicIcon />}>Record</NavItem>
    <NavItem href="/minutes" icon={<FileIcon />}>Minutes</NavItem>
  </NavGroup>
  <NavGroup label="Admin">
    <NavItem href="/admin" icon={<SettingsIcon />}>Settings</NavItem>
  </NavGroup>
</Navigation>
```

## Loading Skeletons

Pre-built loading states for common patterns.

```tsx
import {
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
  TranscriptSkeleton,
  DashboardSkeleton
} from '@/components/skeletons';

// Use while loading data
function MeetingsList() {
  const { data, isLoading } = useMeetings();
  
  if (isLoading) {
    return <ListSkeleton count={5} />;
  }
  
  return <MeetingList meetings={data} />;
}
```

## FlagGate

Feature flag conditional rendering.

```tsx
import { FlagGate } from '@/components/ui/flag-gate';

<FlagGate
  flag="new_feature"
  fallback={<OldFeature />}
>
  <NewFeature />
</FlagGate>

// With loading state
<FlagGate
  flag="beta_feature"
  loadingFallback={<Skeleton />}
  fallback={<ComingSoon />}
>
  <BetaFeature />
</FlagGate>
```

## Styling Guidelines

### Theme Tokens

Use CSS variables from ThemeSetter:

```css
/* Primary colors */
var(--primary)
var(--primary-foreground)

/* Semantic colors */
var(--background)
var(--foreground)
var(--muted)
var(--muted-foreground)
var(--accent)
var(--accent-foreground)

/* Status colors */
var(--success)
var(--warning)
var(--destructive)

/* Glass tokens */
var(--glass-bg)
var(--glass-border)
var(--glass-shadow)
```

### Glass Morphism

```tsx
// Apply glass effect
<div className="bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
  <Card variant="glass">
    Content
  </Card>
</div>
```

### Dark Mode

Components automatically adapt to dark mode. Use semantic tokens:

```tsx
// ✅ Good - uses theme tokens
<div className="bg-background text-foreground border-border" />

// ❌ Avoid - hardcoded colors
<div className="bg-white text-black border-gray-200" />
```

## Best Practices

### 1. Use Composition

```tsx
// ✅ Good - composable
<Card>
  <Card.Header>
    <Card.Title>{title}</Card.Title>
  </Card.Header>
  <Card.Content>{children}</Card.Content>
</Card>

// ❌ Avoid - monolithic props
<Card title={title} content={children} hasHeader />
```

### 2. Forward Refs

```tsx
// ✅ Good - allows ref forwarding
const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  return <button ref={ref} {...props} />;
});
```

### 3. Spread Props

```tsx
// ✅ Good - accepts standard HTML attributes
function Input({ label, ...props }: InputProps) {
  return (
    <div>
      <label>{label}</label>
      <input {...props} />
    </div>
  );
}
```

### 4. Accessible by Default

```tsx
// ✅ Good - accessible
<Button aria-label="Close dialog">
  <XIcon aria-hidden />
</Button>

// Include focus states
<button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
```

### 5. Loading States

```tsx
// ✅ Good - shows loading state
<Button loading={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>
```

## Component Index

| Component | Category | Description |
|-----------|----------|-------------|
| `Button` | UI | Clickable button |
| `Card` | UI | Content container |
| `Input` | UI | Text input |
| `Select` | UI | Dropdown selector |
| `Tabs` | UI | Tab navigation |
| `Badge` | UI | Status indicator |
| `Skeleton` | UI | Loading placeholder |
| `ProgressBar` | UI | Progress indicator |
| `ThemeSetter` | Feature | Theme application |
| `AuthGate` | Feature | Auth protection |
| `ModuleGuard` | Feature | Feature gating |
| `ErrorBoundary` | Feature | Error handling |
| `ConnectivityIndicator` | Feature | Network status |
| `Toast` | Feature | Notifications |
| `TranscriptPlayer` | Transcription | Audio sync viewer |
| `MeetingCard` | Minutes | Meeting summary |
| `MinutesEditor` | Minutes | Rich editor |
| `BarChart` | Charts | Bar visualization |
| `LineChart` | Charts | Line visualization |
| `BottomSheet` | Mobile | Modal sheet |
| `FloatingActionButton` | Mobile | FAB |
| `Navigation` | Layout | Nav menu |
| `Sidebar` | Layout | Side navigation |
