# UI/UX Comprehensive Redesign — Implementation Plan

> **For codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve all identified visual inconsistencies, layout failures, and UX anti-patterns across the MinutePlatform application to bring it to production-grade quality.

**Architecture:** All fixes operate within the existing Next.js App Router + Tailwind CSS + CSS-variable token system. No new libraries are introduced. Changes target component-level issues (card theming, icon consistency, AI panel layout) and page-level issues (insights metrics, review queue density, persona selector differentiation).

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, OKLCH CSS variables, Radix UI primitives, Framer Motion (existing), TypeScript.

---

## Issue Index (from Screenshot Analysis)

| # | Issue | Severity | Affected Screens |
|---|-------|----------|-----------------|
| A | Dark cards on light background — My Notes page | Critical | my-notes |
| B | Icon style inconsistency on Home action cards | High | home |
| C | AI Assistant panel: backdrop blur blocks content; panel too wide | High | my-notes/[id] |
| D | Insights metrics: floating icon+badge layout is confusing | High | insights |
| E | Review Queue: badge overload + harsh "Overdue" styling | Medium | review-queue |
| F | Persona selector: all cards look identical | Medium | login |
| G | Header breadcrumb truncation (ellipsis mid-word) | Medium | global |
| H | Recording page: waveform area is empty dead space | Medium | record |
| I | Typography: all-caps section labels feel disconnected | Low | multiple |
| J | Empty-state zeros in Insights look unfinished | Low | insights |

---

## Task 1: Fix My Notes Card Theming (Issue A)

**Root Cause:** `MeetingCard` component or my-notes page uses a dark card background (`bg-slate-900` or similar hardcoded color) that clashes with the light content area and purple hero header.

**Files:**
- Read: `universal-app/src/components/MeetingCard.tsx`
- Read: `universal-app/src/app/my-notes/page.tsx`
- Modify: `universal-app/src/components/MeetingCard.tsx`

**Step 1: Read current MeetingCard implementation**

```bash
cat universal-app/src/components/MeetingCard.tsx
```

**Step 2: Identify the dark background source**

Look for any of:
- `bg-slate-900`, `bg-gray-900`, `bg-zinc-900`, `bg-[#0d0d0d]`, `bg-neutral-900`
- `dark:` prefixed classes applied unconditionally
- CSS class that references dark-specific backgrounds without `dark:` guard

**Step 3: Replace hardcoded dark backgrounds with theme tokens**

Replace all occurrences of hardcoded dark card colors with:
```tsx
// Card wrapper
className="bg-card border border-border rounded-xl ..."

// Card hover state
className="... hover:bg-card/80 hover:shadow-card-hover transition-all"

// Status/tag badges - ensure they use semantic tokens
// 'Ready For Review' → variant="success"
// 'Risk: high' → variant="destructive"
// 'Draft' → variant="secondary"
// 'Economy' → variant="outline"
```

**Step 4: Ensure card list on my-notes page has correct background**

In `src/app/my-notes/page.tsx`, the grid container should NOT have a dark background:
```tsx
// Remove any: bg-slate-900, bg-dark, bg-zinc-900
// Grid should be transparent (inherits page background)
<div className="grid lg:grid-cols-2 gap-4">
```

**Step 5: Verify in both light and dark mode**

The cards should:
- Light mode: white/near-white cards with subtle border
- Dark mode: dark-surface card that matches dark layout
- NOT appear dark when the rest of the page is light

**Step 6: Commit**
```bash
git add universal-app/src/components/MeetingCard.tsx universal-app/src/app/my-notes/page.tsx
git commit -m "fix: use theme tokens for MeetingCard background — remove hardcoded dark colors"
```

---

## Task 2: Unify Home Page Action Card Icons (Issue B)

**Root Cause:** "New Recording" uses a filled teal circular icon while "Upload Audio" and "My Notes" use outline light-green icons — different fill styles, different colors, different icon weights.

**Files:**
- Read: `universal-app/src/app/page.tsx`
- Modify: `universal-app/src/app/page.tsx`

**Step 1: Identify the three action card icon implementations**

In `page.tsx`, find the Practitioner home view action cards:
- New Recording card → currently uses a filled teal `bg-primary` circle
- Upload Audio card → currently uses an outline/light icon
- My Notes card → currently uses an outline/light icon

**Step 2: Design a unified icon treatment**

All three action cards should use the SAME visual pattern. Choose one of:

**Option A — Filled circle with icon (current New Recording style):**
```tsx
// Apply to all three
<div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
  <MicrophoneIcon className="w-7 h-7 text-primary" />
</div>
```

**Option B — Gradient pill (more distinctive):**
```tsx
<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 ring-1 ring-primary/20">
  <MicrophoneIcon className="w-7 h-7 text-primary" />
</div>
```

Apply the SAME treatment consistently to all three cards. Use these colors:
- New Recording: `text-primary` (dominant action — most prominent)
- Upload Audio: `text-accent` (secondary action)
- My Notes: `text-muted-foreground` (tertiary)

**Step 3: Add visual hierarchy between the three cards**

The "New Recording" card should be visually primary:
```tsx
// New Recording — elevated treatment
<div className="group relative bg-card border-2 border-primary/30 rounded-2xl p-6 hover:border-primary/60 hover:shadow-elevated transition-all cursor-pointer">

// Upload Audio — standard
<div className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-card-hover transition-all cursor-pointer">

// My Notes — standard
<div className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-card-hover transition-all cursor-pointer">
```

**Step 4: Commit**
```bash
git add universal-app/src/app/page.tsx
git commit -m "fix: unify home action card icon treatment and add visual hierarchy"
```

---

## Task 3: Fix AI Assistant Panel (Issue C)

**Root Cause:** The AI panel uses a heavy `backdrop-blur` that obscures the main content; the panel is too wide (~40% of viewport); the action buttons look like empty outlined boxes.

**Files:**
- Read: `universal-app/src/app/my-notes/[id]/page.tsx`
- Read: (find AI Assistant panel component — likely inline or a separate file)
- Modify: AI panel component/section

**Step 1: Find the AI panel implementation**
```bash
grep -r "AI ASSISTANT\|AI Assistant\|Edit with AI\|Quick Actions" universal-app/src/app/my-notes/ --include="*.tsx" -l
grep -r "AI ASSISTANT\|Edit with AI" universal-app/src/components/ --include="*.tsx" -l
```

**Step 2: Reduce panel width**

Current: ~40% of viewport (too wide, obscures content)
Target: Fixed 320px max, slides in from right, does NOT use backdrop-blur on main content

```tsx
// Panel wrapper — change from overlay to sidebar
<aside className="
  fixed right-0 top-[var(--header-height)] bottom-0
  w-80 max-w-[320px]          // Fixed width, not percentage
  bg-card border-l border-border
  shadow-xl
  z-40
  flex flex-col
  overflow-y-auto
">
```

**Step 3: Remove the backdrop-blur overlay on main content**

The main content area should NOT be blurred when the AI panel is open. Instead, shift the main content:
```tsx
// Main content wrapper when AI panel is open
<main className={cn(
  "transition-all duration-300",
  isAIPanelOpen ? "mr-80" : "mr-0"  // Push content, not overlay
)}>
```

**Step 4: Redesign AI action buttons**

Current: plain outlined rectangles (looks unfinished)
Target: clickable chips with icon + label:

```tsx
// Quick action button
<button className="
  flex items-center gap-2 w-full px-3 py-2.5
  rounded-lg border border-border
  bg-muted/50 hover:bg-muted
  text-sm text-foreground
  transition-colors text-left
  group
">
  <StarIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
  <span>Make more professional</span>
</button>
```

**Step 5: Fix section headers**

Current: `QUICK ACTIONS` in all-caps small text (disconnected)
Target: Clean section labels with visual separator:

```tsx
<div className="px-4 py-2">
  <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-2">
    Quick Actions
  </p>
  {/* buttons */}
</div>
<div className="h-px bg-border mx-4" />
<div className="px-4 py-2">
  <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-2">
    Social Care Specific
  </p>
```

**Step 6: Fix the custom instruction textarea**

Add a proper label and reduce visual weight:
```tsx
<div className="p-4">
  <label className="text-xs font-medium text-muted-foreground block mb-2">
    Custom instruction
  </label>
  <textarea
    placeholder="e.g. 'Rewrite this to focus on the child's voice'"
    className="w-full min-h-[80px] px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
  />
</div>
```

**Step 7: Commit**
```bash
git add universal-app/src/app/my-notes/
git commit -m "fix: AI assistant panel — reduce width, remove backdrop blur, polish action buttons"
```

---

## Task 4: Redesign Insights Metrics Layout (Issue D)

**Root Cause:** The metrics section uses floating icons with small pills/badges floating ABOVE them. This creates a confusing layout where the badge count and the metric label are separated by the icon, reversing natural reading order.

**Files:**
- Read: `universal-app/src/app/insights/page.tsx`
- Read: `universal-app/src/components/insights/InsightsDashboard.tsx`
- Modify: both files as needed

**Step 1: Read current metrics layout**
```bash
cat universal-app/src/components/insights/InsightsDashboard.tsx | head -100
```

**Step 2: Redesign metric cards with correct hierarchy**

Current: `[badge above] → [icon] → [label below]` (confusing)
Target: Standard metric card pattern:

```tsx
// Metric card — correct hierarchy
<div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2">
  {/* Top row: icon + trend/change badge */}
  <div className="flex items-center justify-between">
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
      <DocumentIcon className="w-5 h-5 text-primary" />
    </div>
    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
      {trend}
    </span>
  </div>
  {/* Big number */}
  <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
  {/* Label */}
  <p className="text-sm text-muted-foreground">{label}</p>
</div>
```

**Step 3: Make the metrics grid consistent 4-column**

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <MetricCard icon={DocumentIcon} value={totalNotes} label="Total Notes" color="primary" />
  <MetricCard icon={ClockIcon} value={avgDuration} label="Avg. Duration" color="accent" />
  <MetricCard icon={CheckCircleIcon} value={readyForReview} label="Ready for Review" color="success" />
  <MetricCard icon={ExclamationIcon} value={highRiskItems} label="High Risk Items" color="destructive" />
</div>
```

**Step 4: Fix Risk Distribution section**

Current: inline text + badge mix, hard to scan
Target: horizontal bar visualization:

```tsx
<div className="bg-card border border-border rounded-xl p-5">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-semibold text-foreground">Risk Distribution</h3>
    <span className="text-xs text-muted-foreground">Scope: {scope}</span>
  </div>
  <div className="space-y-2">
    {[
      { label: 'High', count: highCount, color: 'bg-destructive' },
      { label: 'Medium', count: medCount, color: 'bg-warning' },
      { label: 'Low', count: lowCount, color: 'bg-success' },
      { label: 'None', count: noneCount, color: 'bg-muted' },
    ].map(({ label, count, color }) => (
      <div key={label} className="flex items-center gap-3">
        <span className="w-12 text-xs text-muted-foreground text-right">{label}</span>
        <div className="flex-1 bg-muted rounded-full h-2">
          <div className={cn("h-2 rounded-full", color)} style={{ width: `${(count/total)*100}%` }} />
        </div>
        <span className="w-6 text-xs font-medium text-foreground text-right">{count}</span>
      </div>
    ))}
  </div>
</div>
```

**Step 5: Fix empty state (zeros)**

When all values are 0, show a purposeful empty state rather than bare zeros:
```tsx
{totalNotes === 0 && (
  <div className="col-span-4 flex flex-col items-center py-12 text-center">
    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
      <ChartBarIcon className="w-6 h-6 text-muted-foreground" />
    </div>
    <p className="text-sm font-medium text-foreground">No data yet</p>
    <p className="text-xs text-muted-foreground mt-1">Metrics will appear once notes are submitted</p>
  </div>
)}
```

**Step 6: Commit**
```bash
git add universal-app/src/app/insights/ universal-app/src/components/insights/
git commit -m "fix: insights metrics — redesign card layout, add risk distribution bars, fix empty state"
```

---

## Task 5: Clean Up Review Queue (Issue E)

**Root Cause:** Too many badges stacked on one card creates visual noise. The "Overdue by 11742h" badge uses a harsh red that is alarming out of proportion. The tab navigation is very plain.

**Files:**
- Read: `universal-app/src/app/review-queue/page.tsx`
- Read: `universal-app/src/components/review/ReviewQueue.tsx`
- Modify: both

**Step 1: Fix the "Overdue" badge styling**

Current: bright red `Overdue by 11742h`
Target: A calmer, more informative treatment:

```tsx
// Instead of a solid red badge
<span className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
  <ClockIcon className="w-3 h-3" />
  Overdue · {formatOverdue(hours)}   // e.g. "Overdue · 489d" not raw hours
</span>
```

Add a `formatOverdue(hours: number): string` helper:
```ts
function formatOverdue(hours: number): string {
  if (hours < 24) return `${hours}h`
  if (hours < 168) return `${Math.floor(hours / 24)}d`
  return `${Math.floor(hours / 168)}wk`
}
```

**Step 2: Reduce badge density on review cards**

Current: 5–6 badges per card (Ready for Review, Risk: high, Economy, Overdue, template tag, meeting type)
Target: Max 3 badges visible, with overflow indicator:

```tsx
// Show max 3 tags, collapse rest
const visibleTags = tags.slice(0, 3)
const hiddenCount = tags.length - 3

<div className="flex flex-wrap gap-1.5">
  {visibleTags.map(tag => <Badge key={tag} variant={tagVariant(tag)}>{tag}</Badge>)}
  {hiddenCount > 0 && (
    <Badge variant="outline" className="text-muted-foreground">+{hiddenCount}</Badge>
  )}
</div>
```

**Step 3: Improve tab navigation styling**

Current: plain outline tabs
Target: Pill tabs with count badges:

```tsx
<div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
  {['Pending Review', 'Changes Requested', 'Approved History'].map(tab => (
    <button
      key={tab}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
        activeTab === tab
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {tab}
      {counts[tab] > 0 && (
        <span className={cn(
          "text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center",
          activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
        )}>
          {counts[tab]}
        </span>
      )}
    </button>
  ))}
</div>
```

**Step 4: Commit**
```bash
git add universal-app/src/app/review-queue/ universal-app/src/components/review/
git commit -m "fix: review queue — humanize overdue label, reduce badge density, polish tab nav"
```

---

## Task 6: Differentiate Persona Selector Cards (Issue F)

**Root Cause:** All six persona cards use an identical card structure and dark background, making it hard to distinguish roles at a glance. The role type (PRACTITIONER, TEAM MANAGER, etc.) badge at the bottom is the only differentiator but all use the same styling.

**Files:**
- Read: `universal-app/src/app/login/page.tsx`
- Modify: `universal-app/src/app/login/page.tsx`

**Step 1: Assign role-based color accents**

Define a color map per role type:
```tsx
const ROLE_COLORS = {
  practitioner: { accent: 'border-blue-500/40 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-300', dot: 'bg-blue-400' },
  team_manager: { accent: 'border-amber-500/40 bg-amber-500/5', badge: 'bg-amber-500/20 text-amber-300', dot: 'bg-amber-400' },
  admin: { accent: 'border-purple-500/40 bg-purple-500/5', badge: 'bg-purple-500/20 text-purple-300', dot: 'bg-purple-400' },
  housing_officer: { accent: 'border-teal-500/40 bg-teal-500/5', badge: 'bg-teal-500/20 text-teal-300', dot: 'bg-teal-400' },
} as const
```

**Step 2: Apply role color to card border and badge**

```tsx
<div className={cn(
  "relative rounded-2xl border-2 p-6 cursor-pointer transition-all",
  "hover:scale-[1.02] hover:shadow-elevated",
  ROLE_COLORS[persona.roleType].accent,
  isActive && "ring-2 ring-white/40 shadow-elevated"
)}>
  {/* Role type pill — top-right corner */}
  <span className={cn(
    "absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full",
    ROLE_COLORS[persona.roleType].badge
  )}>
    {persona.roleType.replace('_', ' ').toUpperCase()}
  </span>

  {/* Avatar */}
  <img className="w-16 h-16 rounded-full mx-auto mb-3 ring-2 ring-white/20" />

  {/* Name + title */}
  <h3 className="text-center font-semibold text-white">{persona.name}</h3>
  <p className="text-center text-xs text-slate-400 mt-0.5">{persona.title}</p>
  <p className="text-center text-xs text-slate-500 mt-1">{persona.department}</p>

  {/* Domain tags — bottom */}
  <div className="flex flex-wrap justify-center gap-1 mt-4">
    {persona.domains.map(d => (
      <span key={d} className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">{d}</span>
    ))}
  </div>

  {/* Active indicator */}
  {isActive && (
    <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
      <span className={cn("w-2 h-2 rounded-full animate-pulse", ROLE_COLORS[persona.roleType].dot)} />
      <span className="text-xs text-slate-400">Active</span>
    </div>
  )}
</div>
```

**Step 3: Improve "Skip for now" button visibility**

```tsx
<button className="
  mt-8 px-6 py-3 rounded-xl
  border border-white/20 bg-white/5
  text-sm text-slate-300
  hover:bg-white/10 hover:text-white
  transition-all backdrop-blur-sm
">
  Skip for now — continue as {activePersona.name} →
</button>
```

**Step 4: Commit**
```bash
git add universal-app/src/app/login/page.tsx
git commit -m "fix: persona selector — role-based color accents, improve card differentiation"
```

---

## Task 7: Fix Header Breadcrumb Truncation (Issue G)

**Root Cause:** The header breadcrumb trail truncates mid-word ("Children's Social Ca...") because it's constrained by the center-positioning and the pending/status pill. The truncation happens at an awkward character boundary.

**Files:**
- Read: `universal-app/src/components/layout/AppShell.tsx`
- Modify: `universal-app/src/components/layout/AppShell.tsx`

**Step 1: Find the breadcrumb implementation in AppShell**

Look for: `Westminster City Council`, `Children's Social Care`, breadcrumb, or breadcrumb-related JSX in AppShell.tsx.

**Step 2: Fix truncation with proper ellipsis and tooltip**

The breadcrumb items should truncate gracefully with `truncate` class and a tooltip:

```tsx
// Each breadcrumb segment
<span
  title={fullLabel}  // Native tooltip on hover
  className="truncate max-w-[160px] text-sm text-muted-foreground hover:text-foreground transition-colors"
>
  {fullLabel}
</span>
```

**Step 3: Restructure header to prevent breadcrumb squeezing**

The header should use a 3-column grid (left: logo+breadcrumb, center: status pill, right: actions):

```tsx
<header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center gap-4 px-4 sticky top-0 z-40">
  {/* Left: Logo + nav breadcrumb */}
  <div className="flex items-center gap-3 min-w-0 flex-1">
    <Logo />
    <nav className="hidden sm:flex items-center gap-1 min-w-0">
      <BreadcrumbItem label={councilName} maxWidth="max-w-[140px]" />
      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
      <BreadcrumbItem label={domainName} maxWidth="max-w-[140px]" />
    </nav>
  </div>

  {/* Center: Status pill — shrink-0 so it never squeezes */}
  <div className="shrink-0">
    <PendingPill />
  </div>

  {/* Right: Search + actions */}
  <div className="flex items-center gap-2 shrink-0">
    <SearchBar />
    <ThemeToggle />
    <NotificationsButton />
    <SwitchPersonaButton />
  </div>
</header>
```

**Step 4: Commit**
```bash
git add universal-app/src/components/layout/AppShell.tsx
git commit -m "fix: header breadcrumb — prevent mid-word truncation, add tooltips, fix layout"
```

---

## Task 8: Improve Recording Page Layout (Issue H)

**Root Cause:** The waveform visualizer occupies a large rectangular area that shows mostly empty space when not recording. The microphone button is the primary action but doesn't command the visual hierarchy it deserves.

**Files:**
- Read: `universal-app/src/app/record/page.tsx`
- Read: `universal-app/src/app/record/components/RecordingControls.tsx`
- Modify: `universal-app/src/app/record/page.tsx`

**Step 1: Redesign the pre-recording state layout**

Current: Timer → Large empty waveform box → Red mic button
Target: Centered mic-first layout with circular waveform visualization:

```tsx
// Pre-recording centered layout
<div className="flex flex-col items-center justify-center flex-1 gap-8 py-12">

  {/* Circular mic button with pulsing ring animation */}
  <div className="relative">
    {/* Outer pulse ring — visible when recording */}
    {isRecording && (
      <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
    )}
    <button
      onClick={toggleRecording}
      className={cn(
        "relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-elevated",
        isRecording
          ? "bg-destructive hover:bg-destructive/90 scale-110"
          : "bg-primary hover:bg-primary/90"
      )}
    >
      <MicrophoneIcon className="w-10 h-10 text-white" />
    </button>
  </div>

  {/* Timer — below button, large but not overwhelming */}
  <div className="text-center">
    <p className="text-5xl font-mono font-light tabular-nums tracking-wider text-foreground">
      {formatTime(elapsed)}
    </p>
    <p className="text-sm text-muted-foreground mt-2">
      {isRecording ? 'Recording...' : 'Tap to start recording'}
    </p>
  </div>

  {/* Waveform — compact bar at bottom, only shown when recording */}
  {isRecording && (
    <div className="w-full max-w-sm h-12">
      <WaveformVisualizer compact />
    </div>
  )}
</div>
```

**Step 2: Move device/quality controls to a collapsible bottom drawer**

The "Allow Microphone Access" and "High Quality" buttons taking up the full width at the bottom is distracting. Collapse into a settings row:

```tsx
// Bottom settings bar — compact
<div className="border-t border-border p-4 flex items-center gap-3">
  {!hasMicPermission && (
    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-sm">
      <MicrophoneIcon className="w-4 h-4" />
      Allow Microphone
    </button>
  )}
  <DeviceQualitySelector compact />
</div>
```

**Step 3: Commit**
```bash
git add universal-app/src/app/record/
git commit -m "fix: recording page — center-first layout, compact waveform, cleaner mic CTA"
```

---

## Task 9: Typography & Section Label Consistency (Issue I)

**Root Cause:** Section labels across the app use inconsistent patterns — some use `UPPERCASE TRACKING-WIDE` all-caps text, others use regular sentence case, with inconsistent sizing. This creates visual noise and hierarchy ambiguity.

**Files:**
- Modify: `universal-app/src/app/globals.css` (add utility class)
- Modify: Multiple component files (AI panel, insights, review queue)

**Step 1: Create a canonical section label utility class**

In `globals.css`, add:
```css
/* Canonical section label — use instead of ad-hoc all-caps */
.label-section {
  @apply text-xs font-semibold text-muted-foreground tracking-wider uppercase;
}
```

**Step 2: Audit and replace inconsistent section labels**

Search for all patterns:
```bash
grep -r "text-xs.*uppercase\|uppercase.*text-xs\|TRACKING\|tracking-wide" universal-app/src/components/ --include="*.tsx"
```

Replace with `label-section` class or consistent Tailwind equivalent:
```tsx
// Before (inconsistent)
<p className="text-xs font-semibold tracking-widest uppercase text-gray-400">QUICK ACTIONS</p>

// After (consistent)
<p className="label-section">Quick Actions</p>
```

**Step 3: Commit**
```bash
git add universal-app/src/app/globals.css universal-app/src/components/
git commit -m "fix: typography — add canonical label-section utility, standardize section headers"
```

---

## Task 10: Global Quality Pass & Dark Mode Verification

**Goal:** Verify that all theme-related changes work correctly in both light and dark mode, and that no hardcoded colors remain.

**Step 1: Run hardcoded color audit**
```bash
grep -r "bg-slate-\|text-slate-\|bg-gray-\|text-gray-\|bg-zinc-\|bg-neutral-" universal-app/src/components/ --include="*.tsx" | grep -v "dark:" | grep -v "//.*bg-slate"
```

Any results not wrapped in `dark:` prefix or theme-conditional logic should be converted to CSS variable tokens.

**Step 2: Run animation audit**
```bash
grep -r "animate-spin\|animate-pulse\|animate-bounce" universal-app/src/components/ --include="*.tsx" | grep -v "motion-reduce:"
```

Each should have `motion-reduce:animate-none` paired with it.

**Step 3: Run accessibility audit for icon buttons**
```bash
grep -r 'size="icon"' universal-app/src/components/ --include="*.tsx" | grep -v "aria-label"
```

Each icon-only button must have `aria-label`.

**Step 4: Visual regression check**

Open the app in browser at `http://localhost:3000`. Check:
- [ ] Home page: cards are white/bg-card, not dark
- [ ] My Notes page: cards match theme (light = white, dark = dark surface)
- [ ] AI panel: slides from right, doesn't blur main content, buttons are styled
- [ ] Insights: metrics show as proper cards with numbers large, labels small
- [ ] Review queue: overdue shows human-readable, tab nav has pill style
- [ ] Persona selector: each card has a role color accent
- [ ] Header: breadcrumbs never cut mid-word
- [ ] Recording: centered layout, compact waveform

**Step 5: Final commit**
```bash
git add -u
git commit -m "fix: global quality pass — remove hardcoded colors, a11y audit, motion-reduce"
```

---

## Summary

| Task | Issue | Files Changed | Effort |
|------|-------|--------------|--------|
| 1 | Dark card backgrounds (My Notes) | MeetingCard.tsx, my-notes/page.tsx | 30min |
| 2 | Inconsistent home action icons | page.tsx | 20min |
| 3 | AI panel width/blur/buttons | my-notes/[id]/page.tsx | 45min |
| 4 | Insights metrics layout | insights/page.tsx, InsightsDashboard.tsx | 45min |
| 5 | Review queue badge overload | review-queue/page.tsx, ReviewQueue.tsx | 30min |
| 6 | Persona selector differentiation | login/page.tsx | 30min |
| 7 | Header breadcrumb truncation | AppShell.tsx | 20min |
| 8 | Recording page layout | record/page.tsx, RecordingControls.tsx | 40min |
| 9 | Typography section labels | globals.css + components | 20min |
| 10 | Global quality pass | Multiple | 30min |

**Total estimated effort: ~5.5 hours**

---

## Design Principles to Maintain Going Forward

1. **Never use hardcoded colors** — all colors via CSS custom properties (`bg-card`, `text-foreground`, etc.)
2. **Cards must surface in theme** — `bg-card border border-border` is the canonical card style
3. **Badge hierarchy** — max 3 visible badges per card; overflow shown as `+N`
4. **Icon consistency** — all icons in the same context use the same fill/stroke style
5. **Panel width** — side panels max 320px fixed, push content rather than overlay
6. **Section labels** — use `.label-section` utility class only
7. **Overdue/time formatting** — always human-readable (days/weeks), never raw hours
8. **Empty states** — always show a purposeful illustration + message, never bare zeros
