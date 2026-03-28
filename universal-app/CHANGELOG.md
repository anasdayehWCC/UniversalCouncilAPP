# Changelog

All notable changes to this project will be documented here. Dates use `YYYY-MM-DD`.

## 2026-03-28

### Added - Batch Operations System

- Created `src/lib/batch/`:
  - `types.ts`: Type definitions for batch selection, actions, progress tracking, and undo
  - `store.ts`: Zustand store with selection state, action execution, progress updates, undo stack
  - `index.ts`: Module exports with utility functions (processBatch, calculateRange, formatProgress)

- Created `src/hooks/useBatchSelection.ts`:
  - Hook for managing multi-select state
  - Select/deselect individual items
  - Select all / deselect all
  - Range selection with shift+click
  - Cmd/Ctrl+click for add-to-selection
  - Max selectable limit support
  - Invert selection utility

- Created `src/components/batch/`:
  - `BatchActionBar.tsx`: Floating action bar when items selected, shows selection count, batch actions with icons, confirmation dialogs, progress indicator, undo button
  - `SelectableItem.tsx`: Wrapper with checkbox UI, visual selected state with ring/tint, keyboard navigation support
  - `SelectAllCheckbox`: Indeterminate state checkbox for select all
  - `index.ts`: Component exports

### Added - Recent Items System

- Created `src/lib/recent/`:
  - `types.ts`: Type definitions for recent items (meetings, templates, searches, cases, documents)
  - `storage.ts`: LocalStorage-based persistence with deduplication, auto-cleanup, and pin management
  - `index.ts`: Module exports

- Created `src/hooks/useRecentItems.ts`:
  - Hook for recent items management
  - Get recent items by type or all
  - Add/remove items with deduplication
  - Pin/unpin functionality with persistent storage
  - Search within recent items
  - Navigation to items with access time update
  - Cross-tab sync via storage events
  - Helper functions for creating recent items by type

- Created `src/components/recent/`:
  - `RecentItemsList.tsx`: List of recent items by category with quick actions on hover, context menu, clear all button, pin indicators
  - `RecentItemsPanel.tsx`: Sidebar panel with category tabs, search within recent, loading skeleton, collapsible mode
  - `index.ts`: Component exports

### Added - Context Menu System

- Created `src/components/ui/context-menu.tsx`:
  - Full-featured context menu built on Radix UI
  - Support for icons, keyboard shortcuts, separators
  - Nested submenus with chevron indicators
  - Checkbox and radio item variants
  - Disabled state styling
  - Destructive action variant (red styling)
  - Dark mode support
  - CSS variable theming integration

- Created `src/hooks/useContextMenu.ts`:
  - Hook for managing context menu state
  - Position calculation with viewport boundary detection
  - Keyboard navigation support (arrow keys, Home/End, Enter/Space, Escape)
  - Close on click outside, escape, and scroll options
  - Event callbacks for open/close
  - Props getters for trigger and menu elements

- Created `src/lib/menus/`:
  - `types.ts`: Menu configuration types (ActionMenuItem, CheckboxMenuItem, SubmenuItem, etc.)
  - `builders.ts`: Fluent builder API for creating menus, convenience functions
  - `index.ts`: Module exports
  - `meeting-card-menu.ts`: Context menu for meeting cards (Edit, Export, Share, Delete, etc.)
  - `transcription-segment-menu.ts`: Context menu for transcript segments (Copy, Jump to, Add note, Bookmark, Highlight)
  - `template-item-menu.ts`: Context menu for templates (Edit, Duplicate, Delete, Export, Version history)

- Added `@radix-ui/react-context-menu` dependency

### Added - Comprehensive Help/Tooltip System

- Created `src/components/ui/tooltip.tsx`:
  - Enhanced tooltip built on Radix UI Tooltip primitive
  - Support for rich content (not just text)
  - Multiple positions (top/right/bottom/left) and alignments
  - Configurable delay control
  - `InfoTooltip`: Standalone info icon with tooltip
  - `ShortcutTooltip`: Action with keyboard shortcut display

- Created `src/components/help/HelpTooltip.tsx`:
  - Help icon with rich tooltip content
  - Integration with centralized help content by topic ID
  - Documentation link support
  - "Don't show again" dismissal with localStorage persistence
  - `LabelWithHelp`: Form label with integrated help tooltip
  - `InlineHelp`: Inline help text below form fields

- Created `src/lib/help/content.ts`:
  - Centralized help content organized by feature area
  - Categories: Recording, Transcription, Minutes, Review, Templates, Insights
  - Each topic includes title, summary, body (markdown), keywords, docs URL
  - Search functionality with keyword matching
  - i18n-ready structure with locale support (English, Welsh example)
  - Related topics linking

- Created `src/components/help/OnboardingTour.tsx`:
  - Step-by-step interactive tour for new users
  - Spotlight/highlight effect using SVG mask
  - Progress indicator with animated dots
  - Skip/next/back controls with keyboard navigation
  - Framer Motion animations
  - Configurable overlay opacity and z-index

- Created `src/hooks/useOnboarding.ts`:
  - Track completion state per tour with localStorage persistence
  - Version tracking to re-trigger tours after updates
  - Auto-show for new users with configurable delay
  - Resume from last viewed step
  - Session-only option for temporary tours
  - Predefined tour configurations: `MAIN_TOUR_STEPS`, `RECORDING_TOUR_STEPS`
  - Convenience hooks: `useMainOnboarding()`, `useRecordingOnboarding()`
  - Utility functions: `resetAllOnboarding()`, `hasUnseenOnboarding()`

- Added dependency: `@radix-ui/react-tooltip@^1.1.8`

### Added - Notification Sound System

- Created `src/lib/sounds/` module with full audio infrastructure:
  - `types.ts`: Sound name types, configuration, and preferences interfaces
  - `index.ts`: Web Audio API-based sound player singleton
    - Preloading with silent fallback when files unavailable
    - Volume control (master and per-sound)
    - Mute state persistence in localStorage
    - Cross-browser AudioContext initialization

- Created `src/hooks/useSound.ts`:
  - `useSound()`: Main hook for playing sounds with preference management
  - `useSoundOnCondition()`: Play sound when condition becomes true
  - `useSoundFeedback()`: Wrap async functions with success/error sounds
  - Respects `prefers-reduced-motion` accessibility preference

- Created `src/components/settings/SoundSettings.tsx`:
  - Full settings panel for sound preferences
  - Global mute toggle and master volume slider
  - Per-sound enable/disable and volume controls
  - Preview buttons for each sound
  - Reduced motion preference notice

- Added `public/sounds/README.md`:
  - Documentation for required sound files
  - Audio specs and accessibility guidelines

### Added - Comprehensive Caching Strategy

- Created `src/lib/cache/` module with full caching infrastructure:
  - `strategy.ts`: Cache manager with multiple strategies and backends
    - **Cache-first**: Serve from cache, update in background
    - **Network-first**: Fresh data preferred, cache fallback
    - **Stale-while-revalidate**: Return cache immediately, revalidate in background
    - **Network-only**: Never cache (sensitive/real-time data)
    - **Cache-only**: Never fetch (offline resources)
  - `keys.ts`: Cache key generators and tag-based invalidation
  - `index.ts`: Module barrel exports

- Caching infrastructure features:
  - **Dual-layer cache**: Memory (LRU) + IndexedDB for persistence
  - **TTL-based expiration**: Configurable TTLs per cache type
  - **Tag-based invalidation**: Invalidate related entries by tags
  - **Cache warming**: Prefetch critical data on app load
  - **Pattern invalidation**: Regex-based cache clearing
  - **Request coalescing**: Deduplicate concurrent fetches

- Created `src/hooks/useCachedData.ts`:
  - `useCachedQuery()`: TanStack Query integration with dual-layer cache
  - `useCachedMutation()`: Mutation with automatic cache invalidation
  - `usePrefetch()`: Background prefetching hook
  - `useCacheInvalidation()`: Manual cache invalidation
  - `useCacheWarming()`: Critical data warming on mount
  - `useCacheStats()`: Cache statistics for debugging
  - `useOfflineCache()`: Offline-aware caching with fallback

- Updated `public/sw.js` with comprehensive runtime caching:
  - **Cache versioning**: Automatic old cache cleanup on version bump
  - **Multiple cache stores**: static, runtime, api, images, fonts
  - **TTL enforcement**: Automatic expiration with configurable TTLs
  - **Cache size limits**: LRU eviction to prevent storage bloat
  - **Request coalescing**: Prevent duplicate in-flight requests
  - **Cache metadata**: Timestamp headers for staleness tracking
  - **API response caching**: Smart caching for API endpoints
  - **Long-cache patterns**: Extended TTL for config/templates
  - **Message handlers**: CACHE_WARM, CACHE_CLEAR, CACHE_INVALIDATE, GET_CACHE_STATS

- Cache key generators for:
  - Minutes (list, detail, versions, by user, recent, search)
  - Transcriptions (detail, by minute, segments)
  - Templates (list, detail, by domain)
  - Users (me, detail, preferences, permissions)
  - Config (tenant, modules, navigation, features, domains)
  - Insights (summary, activity, metrics)
  - Review (queue, item, counts)
  - Search (results, suggestions)

### Added - Comprehensive File Upload System

- Created `src/lib/upload/` module with full upload management:
  - `types.ts`: Type definitions for upload items, progress, validation, events, and configuration
  - `validation.ts`: MIME type validation, file size limits, content scanning with magic bytes detection
  - `manager.ts`: Upload manager with chunked uploads, resume capability, queue management
  - `index.ts`: Module exports

- Upload system features:
  - **Chunked Upload Support**: Large files (>10MB) use resumable chunked uploads (5MB chunks)
  - **Resume Capability**: IndexedDB persistence allows resuming interrupted uploads
  - **Progress Tracking**: Real-time progress with speed and time remaining estimates
  - **Parallel Uploads**: Configurable concurrent upload limit with priority queue
  - **File Validation**: MIME type, extension, size, and content validation (audio format magic bytes)
  - **Error Handling**: Retry logic with exponential backoff, detailed error codes

- Created `src/components/upload/FileUploader.tsx`:
  - Drag and drop support with visual feedback
  - File preview with type icons
  - Progress indicators per file
  - Pause/resume/cancel controls
  - Error display with retry option
  - Mobile-friendly responsive design

- Created `src/hooks/useFileUpload.ts`:
  - Full hook for upload queue management
  - Event callbacks for start, progress, complete, error
  - Queue stats (pending, uploading, completed, failed)
  - Batch operations (pauseAll, resumeAll, cancelAll)
  - `useSimpleUpload()` simplified single-file hook

- Audio format validation:
  - MP3 (ID3v2 and frame sync detection)
  - WAV (RIFF header)
  - WebM/Matroska (EBML header)
  - OGG (OggS signature)
  - M4A/AAC/MP4 (ftyp box)
  - FLAC (fLaC signature)

### Added - Comprehensive Session Management System

- Created `src/lib/session/` module with full session management:
  - `types.ts`: Type definitions for session data, status, config, and events
  - `storage.ts`: Encrypted localStorage with AES-GCM, cross-tab communication via BroadcastChannel
  - `manager.ts`: Core session manager with activity tracking, timers, and multi-tab sync
  - `index.ts`: Module exports

- Session management features:
  - **Session Creation & Validation**: Secure session ID generation, automatic validation
  - **Idle Timeout Handling**: Configurable idle detection with automatic session extension
  - **Session Refresh Logic**: Extend sessions on activity, respect max duration limits
  - **Multi-Tab Synchronization**: BroadcastChannel API with localStorage fallback
  - **Activity Tracking**: Mouse, keyboard, scroll, touch, focus events (throttled)
  - **Encrypted Storage**: AES-GCM encryption via Web Crypto API with fallback obfuscation

- Created `src/hooks/useSession.ts`:
  - Full session state management hook
  - Auto-logout on session expiry (integrates with MSAL)
  - Session persistence across page reloads
  - `useSessionStatus()` simplified status hook
  - `useSessionTimeout()` countdown hook

- Created `src/components/session/`:
  - `SessionWarning.tsx`: Warning modal with countdown timer, progress bar, urgency colors
  - `AutoSessionWarning`: Pre-connected version using useSession hook
  - `SessionProvider.tsx`: Context provider wrapping session management
  - `SessionGate`: Conditional rendering based on session state
  - `withSession()`: HOC for route protection

- Integration with existing MSAL auth:
  - Automatic session creation from MSAL account on login
  - Coordinates logout across session and MSAL
  - Uses IDLE_TIMEOUT_MS and TOKEN_REFRESH_INTERVAL_MS from msal-config

### Added - Comprehensive Performance Monitoring System

- Created `src/lib/performance/` module with full performance monitoring:
  - `types.ts`: Type definitions for budgets, slow renders, journeys, components
  - `monitor.ts`: Core monitoring with FPS, memory, long task detection
  - `reporter.ts`: Batch reporting with PostHog/Sentry integration
  - `index.ts`: Module exports

- Performance monitoring features:
  - **Core Web Vitals**: LCP, FID, CLS, INP, TTFB tracking (extends existing vitals)
  - **Custom Timing**: `startTiming()`, `endTiming()`, `measureFunction()`, `measureAsyncFunction()`
  - **Performance Budgets**: Configurable thresholds with warning/error levels
  - **Slow Render Detection**: Automatic tracking with configurable threshold (default 16ms)
  - **User Journey Tracking**: `startJourney()`, `markJourneyStep()`, `endJourney()` for key flows
  - **Long Task Detection**: PerformanceObserver-based detection for >50ms tasks
  - **FPS Counter**: Real-time FPS tracking using requestAnimationFrame
  - **Memory Monitoring**: JS heap size tracking (Chrome/Edge only)

- Batch reporting with sampling:
  - Configurable sample rate for production (default 10%)
  - Automatic batching with interval-based flush
  - Page visibility and beforeunload handlers for reliable delivery
  - PostHog events: `performance_report`, `performance_budget_violation`, `performance_slow_renders`
  - Sentry measurements and breadcrumbs for violations

- Created `src/hooks/usePerformance.ts`:
  - Component-level performance tracking hook
  - Auto-tracking of render times
  - `useFps()` lightweight FPS hook
  - `useMemory()` lightweight memory hook
  - `useRenderProfiler()` for React Profiler integration

- Created `src/components/dev/PerformanceOverlay.tsx`:
  - Development-only performance overlay
  - Real-time FPS counter with color coding
  - Memory usage display with progress bar
  - Core Web Vitals display with ratings
  - Top component renders table
  - Slow render warnings
  - Budget violation alerts
  - Collapsible mini badge mode
  - Draggable position (4 corners)

### Added - Comprehensive Form Validation System

- Created `src/lib/forms/validation.ts` with extensive Zod schemas:
  - Recording metadata validation (title, attendees, template, quality settings)
  - Meeting forms (case info, participants, agenda, virtual meeting support)
  - User profile forms (notifications, accessibility, theme preferences)
  - Admin settings (tenant config, security policies, integrations)
  - Export configuration (format, sections, branding, security, destinations)
  - Utility functions: `getErrorMessages`, `validateField`, `createPartialSchema`, `mergeSchemas`, `withCrossFieldValidation`, `getRequiredFields`, `getFieldMetadata`

- Created `src/lib/forms/hooks.ts` with form validation hooks:
  - `useFormValidation` - Full form validation with cross-field support
  - `useFieldValidation` - Individual field validation with debounce
  - `useFormSubmission` - Submission handling with loading/error states
  - `useFormPersistence` - Persist form state to localStorage

- Created `src/components/forms/FormField.tsx`:
  - Input wrapper with label, description, help text, tooltip support
  - Required/optional field indicators
  - Accessible error announcements with ARIA live regions
  - `FormFieldInput`, `FormFieldTextarea` with context integration
  - `FormFieldGroup`, `FormFieldRow` for layout organization
  - Size variants (sm, md, lg) and style variants (default, filled, ghost)

- Created `src/components/forms/FormBuilder.tsx`:
  - Dynamic form generation from Zod schemas
  - Section-based layouts with conditional rendering
  - Support for all field types (text, email, password, number, tel, url, date, datetime-local, time, textarea, select, checkbox, radio, hidden)
  - Field dependencies and conditional visibility
  - Custom field renderers and value transformations
  - Pre-built common field configurations (email, phone, name, password, date, notes)
  - Auto-generate fields from schema option

- Updated `src/lib/forms/index.ts` and `src/components/forms/index.ts` with barrel exports

### Added - Comprehensive API and Architecture Documentation

- Enhanced `docs/API.md` with complete API documentation:
  - Architecture overview diagram showing proxy-based API flow
  - Detailed authentication flow with Azure Entra ID sequence diagram
  - Complete list of API endpoints (proxy routes, demo API, backend endpoints)
  - Request/response examples for transcriptions, minutes, and recordings APIs
  - Comprehensive error codes table with HTTP status codes and retryability
  - Error response format documentation with examples
  - Rate limiting documentation with headers and default limits
  - WebSocket events section (planned) with current polling alternative

- Enhanced `docs/ARCHITECTURE.md` with system architecture:
  - High-level system overview ASCII diagram
  - Complete frontend/backend/storage layer architecture diagram
  - Detailed directory structure with purpose explanations
  - Design patterns documentation:
    - Provider Pattern (Composite Root)
    - Module System Pattern
    - Optimistic Update Pattern
    - Repository Pattern (Data Access)
    - Strategy Pattern (Multi-Tenant)
    - State Machine Pattern (Workflow)
  - State management approach with four layers:
    - Server State (TanStack Query)
    - Global State (Context Providers)
    - Local/UI State (useState/useReducer)
    - Persistent State (IndexedDB/localStorage)
  - Data flow diagrams:
    - Recording to Published Minute journey
    - API Request flow with interceptors and retry logic
  - Security architecture overview

- Updated `README.md` with:
  - Clear documentation table with links to all docs
  - Quick start section
  - Project structure overview
  - Tech stack summary
  - Environment variables reference

### Added - Comprehensive Security Headers Configuration

- Created `src/lib/security/csp.ts`: Content Security Policy utilities:
  - `generateNonce()` for cryptographically secure nonce generation
  - `TRUSTED_SOURCES` configuration for scripts, styles, fonts, images, media, connect sources
  - `buildCSPHeader()` and `buildDevCSPHeader()` for environment-specific CSP
  - `getNonce()` for Server Components to access request nonce
  - `parseCSPViolation()` and `CSPViolationReport` type for violation handling
  - Support for CSP report-only mode via `CSP_REPORT_ONLY` env var

- Created `src/lib/security/headers.ts`: Security headers configuration:
  - `SECURITY_HEADERS` constant with X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, COOP, CORP, COEP
  - `buildSecurityHeaders()` with configurable HSTS and permissions
  - `getPermissionsPolicy()` allowing microphone/camera for recording, restricting other features
  - `API_SECURITY_HEADERS` for API route-specific headers

- Created `src/middleware.ts`: Next.js middleware for dynamic security:
  - Per-request CSP nonce generation
  - Security headers applied to all non-static routes
  - API route detection for different header treatment
  - Nonce propagation via `x-nonce` header for Server Components

- Created `src/app/api/security/csp-report/route.ts`: CSP violation reporting endpoint:
  - POST handler for `application/csp-report` and `application/reports+json`
  - Filtering of known false positives (browser extensions, dev tools)
  - Structured logging of violations for monitoring

- Updated `next.config.ts`: Enhanced static security headers:
  - Added HSTS with 1-year max-age, includeSubDomains, preload
  - Updated Permissions-Policy: microphone=(self), camera=(self) for recording
  - Added X-DNS-Prefetch-Control, X-Download-Options, X-Permitted-Cross-Domain-Policies
  - Added Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy, Origin-Agent-Cluster

### Added - Manager Approval Workflow System

- Created `src/lib/workflow/types.ts`: Comprehensive workflow type definitions:
  - WorkflowStep enumeration: draft, submitted, in_review, changes_requested, approved, published
  - WorkflowAction enumeration: submit, approve, reject, request_changes, escalate, resubmit, withdraw, publish, assign, unassign
  - WorkflowTransition interface with from/to steps, required roles, and conditions
  - WorkflowHistoryEntry for audit trail with actor info, timestamps, comments
  - WorkflowState for complete entity workflow state including SLA tracking
  - WORKFLOW_STEP_CONFIG and WORKFLOW_ACTION_CONFIG with visual styling and permissions
  - WorkflowPriority (low, normal, high, urgent) with SLA day configuration
  - EscalationReason enumeration for escalation workflow

- Created `src/lib/workflow/state-machine.ts`: Finite state machine implementation:
  - WorkflowStateMachine class with transition validation
  - canTransition() for role and condition checking
  - executeTransition() with audit trail and side effects
  - getAvailableActions() for role-based action discovery
  - createInitialWorkflowState() factory function
  - checkSlaBreach() and getTimeUntilSlaBreach() for SLA management
  - getWorkflowSummary() for display purposes

- Created `src/lib/workflow/notifications.ts`: Workflow notification functions:
  - notifyOnSubmit() - Notify managers of new submissions
  - notifyOnApproval() - Notify author of approval
  - notifyOnChangesRequested() - Notify with feedback for revisions
  - notifyOnRejection() - Notify author of rejection with reason
  - notifyOnEscalation() - Notify senior manager and author
  - notifyOnAssignment() - Notify assigned reviewer
  - notifySlaBreach() - SLA warning notifications
  - processWorkflowNotifications() for action-based dispatch

- Created workflow components in `src/components/workflow/`:
  - WorkflowTimeline.tsx: Visual workflow history with animated entries
  - WorkflowStatus.tsx: Status badges with SLA indicators, progress display
  - WorkflowActions.tsx: Action buttons with dialog integration
  - ApprovalDialog.tsx: Confirmation dialog for approvals with optional comment
  - ChangesRequestDialog.tsx: Request changes/rejection with quick templates
  - EscalationDialog.tsx: Escalation with reason selection and target manager

- Created `src/hooks/useWorkflow.ts`: React hook for workflow management:
  - useWorkflow() hook with state machine integration
  - Computed values: availableActions, canEdit, canReview, isFinal, slaInfo
  - executeAction() for executing transitions with notifications
  - useWorkflowQueue() hook for manager queue view with filtering and stats

### Added - SharePoint/OneDrive Integration

- Created `src/lib/sharepoint/types.ts`: Comprehensive type definitions:
  - SharePointConfig with Graph API settings and auto-save options
  - SharePointSite, SharePointDrive, SharePointFolder, SharePointFile interfaces
  - SharePointItemReference, SharePointIdentity for entity relationships
  - UploadOptions with progress callbacks, chunked upload support
  - DownloadOptions with version selection and progress tracking
  - CreateFolderOptions, ListItemsOptions for folder operations
  - SharePointSearchOptions and SharePointSearchResult for discovery
  - SharePointLocation for picker/integration use
  - LinkedSharePointDocument for minute-to-file linking
  - AutoSaveRule for automated document saving rules
  - SharePointApiError with comprehensive error codes
  - SharePointConnectionState for connection lifecycle

- Created `src/lib/sharepoint/client.ts`: Microsoft Graph API client:
  - SharePointClient class with MSAL token injection
  - Site operations: getRootSite(), searchSites(), getFollowedSites()
  - Drive operations: getMyDrive(), getSiteDrives(), getSharedDrives()
  - Folder operations: getFolder(), listFolderContents(), createFolder(), createFolderPath()
  - File operations: getFile(), uploadFile(), downloadFile(), deleteItem(), moveItem(), copyItem()
  - Large file upload with chunked sessions (>4MB)
  - Search: search() with filters and pagination
  - Version management: getFileVersions(), restoreVersion()
  - Sharing: createSharingLink(), getPermissions()
  - Automatic retry with exponential backoff
  - Singleton pattern via getSharePointClient()

- Created `src/lib/sharepoint/integration.ts`: Minutes integration layer:
  - SharePointIntegration class for minute-centric operations
  - autoSaveMinutes() with folder pattern formatting ({year}/{month}/{caseRef})
  - autoSaveRecording() for audio/video uploads
  - linkFileToMinute()/unlinkFile() for document association
  - getLinkedDocumentsForMinute() for retrieval
  - AutoSaveRule CRUD with localStorage persistence
  - getRecentLocations()/updateRecentLocation() for picker history
  - generateFolderPath()/generateFileName() for organization helpers

- Created `src/lib/sharepoint/index.ts`: Module exports

- Created `src/hooks/useSharePoint.ts`: Main React hook:
  - Connection state management (connect, disconnect, selectSite, selectDrive)
  - Folder navigation (browse, navigateUp, navigateToPath, refresh, loadMore)
  - File operations (uploadFile, downloadFile, deleteItem, createFolder, moveItem)
  - Search functionality with results management
  - Integration methods (linkFileToMinute, unlinkFile, autoSaveMinutes)
  - Auto-save rules management
  - Error handling with clearError()
  - useSharePointStatus() simplified hook for connection status
  - useSharePointBrowser() hook for file browsing
  - useSharePointUpload() hook with progress tracking

- Created `src/components/sharepoint/SharePointPicker.tsx`: Location picker modal:
  - Multi-step wizard (connect → site → drive → folder)
  - Breadcrumb navigation with path display
  - Recent locations quick access
  - Create new folder capability
  - Premium UI with custom SharePoint/folder/drive icons
  - Framer Motion animations
  - Glass card styling consistent with design system

- Created `src/components/sharepoint/SharePointBrowser.tsx`: File browser component:
  - Grid/list view toggle
  - Search with instant filtering
  - Upload button with file picker
  - Folder navigation with breadcrumbs
  - File actions (download, delete) with context menu
  - File type icons with color-coded gradients
  - Multi-select support for batch operations
  - Loading states with skeleton UI
  - Responsive design (compact mode option)

- Created `src/components/sharepoint/SharePointUploadButton.tsx`: Upload button:
  - Drag-and-drop file upload support
  - Multiple file selection
  - Progress bar with percentage and bytes
  - Success/error states with animations
  - Destination picker integration
  - Custom fields attachment for metadata
  - Icon-only compact mode
  - Configurable button variants and sizes

- Created `src/components/sharepoint/SharePointLink.tsx`: Linked document display:
  - SharePointLink component for single linked document
  - File type icon with color coding
  - Link type badge (Minute, Recording, Attachment)
  - Actions: open in SharePoint, download, unlink
  - Hover animations and gradient accent
  - Compact mode for lists
  - SharePointLinksList component for multiple documents
  - Empty state and loading handling

- Created `src/components/sharepoint/index.ts`: Component exports

### Added - WCAG AA Accessibility Compliance Utilities

- Created `src/lib/a11y/types.ts`: Comprehensive accessibility type definitions:
  - AccessibilityConfig for global a11y configuration
  - A11yPreferences (reducedMotion, highContrast, fontSize, dyslexiaFont, etc.)
  - AriaRole types (AriaLandmarkRole, AriaWidgetRole)
  - AriaStateAttributes and AriaPropertyAttributes
  - FocusTrapConfig and FocusTrapState interfaces
  - RovingTabIndexConfig for keyboard navigation patterns
  - Announcement types for screen reader announcements
  - A11yContextValue for provider context
  - KeyboardShortcut configuration types
  - ContrastCheckResult for WCAG contrast validation
  - A11yAuditIssue and A11yAuditResult for runtime checks

- Created `src/lib/a11y/focus-trap.ts`: Focus management utilities:
  - FocusTrap class with activate/deactivate/pause/unpause methods
  - getTabbableElements(), getFirstTabbable(), getLastTabbable() selectors
  - isTabbable(), isFocusable() element validators
  - saveFocus(), restoreFocus() for focus preservation
  - useFocusTrap() hook for React integration
  - useRovingTabIndex() hook for arrow key navigation
  - useFocusRestore() and useFocusOnMount() hooks

- Created `src/lib/a11y/announcer.ts`: Screen reader announcements:
  - AnnouncementManager singleton for global queue
  - announce(), announcePolite(), announceAssertive() functions
  - useAnnouncementQueue() hook for queue access
  - useAnnounce() simplified announcement hook
  - useAnnounceOnChange() for value change announcements
  - useAnnounceLoading() for loading state announcements
  - useAnnounceErrors() for form validation errors
  - useAnnounceRoute() for navigation announcements

- Created `src/lib/a11y/audit.ts`: Runtime accessibility checks:
  - getContrastRatio() with WCAG 2.1 relative luminance calculation
  - checkColorContrast() returning AA/AAA pass status
  - runA11yAudit() checking images, buttons, links, forms, headings, landmarks
  - Auditors for alt text, accessible names, form labels, heading hierarchy
  - Color contrast sampling with LARGE_TEXT_SIZE handling
  - logA11yAudit() for dev mode console warnings
  - useA11yAudit() hook for component-level auditing

- Created `src/components/a11y/SkipLinks.tsx`:
  - SkipLinks component with configurable targets
  - SkipToContent simplified variant
  - Visually hidden until focused, keyboard-accessible

- Created `src/components/a11y/LiveRegion.tsx`:
  - LiveRegion component with politeness levels
  - GlobalAnnouncer for app-wide announcements
  - StatusAnnouncer and ErrorAnnouncer specialized variants
  - useAnnouncementRegion() hook for managed regions

- Created `src/components/a11y/FocusTrap.tsx`:
  - FocusTrap component with escape handling
  - ModalFocusTrap pre-configured for dialogs
  - MenuFocusTrap for dropdown menus
  - Focus restoration on deactivation

- Created `src/components/a11y/VisuallyHidden.tsx`:
  - VisuallyHidden (sr-only) component
  - SROnly alias
  - AccessibleLabel for form inputs
  - AccessibleDescription for aria-describedby
  - LiveAnnouncement for dynamic content
  - SkipLinkTarget anchor component

- Created `src/components/a11y/AccessibleIcon.tsx`:
  - AccessibleIcon wrapper for icons
  - IconButton with required aria-label
  - IconLink for icon-only links
  - LoadingIcon with announcement
  - StatusIcon (success/error/warning/info/loading)

- Created `src/hooks/useAccessibility.ts`:
  - usePrefersReducedMotion() system preference hook
  - usePrefersHighContrast() system preference hook
  - usePrefersColorScheme() light/dark detection
  - useKeyboardShortcuts() and useKeyboardShortcut() hooks
  - useEscapeKey() convenience hook
  - useFocusManagement() for container focus control
  - useFocusOnMount() with select option
  - useFocusVisible() for keyboard focus detection
  - useAccessibilityPreferences() with localStorage persistence
  - useAccessibility() comprehensive hook

- Created `src/providers/A11yProvider.tsx`:
  - A11yProvider context with config and preferences
  - System preference detection (reduced motion, high contrast)
  - Preference persistence to localStorage
  - CSS class application (reduce-motion, high-contrast, etc.)
  - Keyboard shortcut registry (Alt+1 focus main, Alt+2 focus nav)
  - useA11y(), useA11yPreferences(), useA11yAnnounce() hooks
  - useA11yFocus(), useA11yShortcuts() specialized hooks

### Added - Mobile-Responsive Layouts & Breakpoint Utilities
- Created `src/lib/responsive/types.ts`: Comprehensive type definitions for responsive design:
  - Breakpoint type (xs, sm, md, lg, xl, 2xl) matching Tailwind CSS v4
  - DeviceType (mobile, tablet, desktop) and OrientationType (portrait, landscape)
  - BreakpointConfig and BreakpointMap for breakpoint metadata
  - ResponsiveState interface with full device/viewport information
  - SafeAreaInsets for notched device support (iPhone, iPad)
  - TouchConfig with 44px minimum tap targets per Apple/Google guidelines
  - SwipeableConfig, BottomSheetConfig, PullToRefreshConfig for mobile patterns
  - FABConfig and FABAction for floating action buttons

- Created `src/lib/responsive/breakpoints.ts`: Breakpoint utilities:
  - BREAKPOINT_VALUES matching Tailwind v4 defaults (640, 768, 1024, 1280, 1536)
  - BREAKPOINTS map with device type mappings
  - CONTAINER_BREAKPOINTS for component-level responsiveness
  - getBreakpoint(), getDeviceType(), compareBreakpoints() functions
  - isBreakpointUp(), isBreakpointDown(), isBreakpointBetween() comparators
  - Media query generators: minWidth(), maxWidth(), between(), portrait(), landscape()
  - touchDevice(), hoverDevice(), reducedMotion(), highContrast(), darkMode() queries
  - CSS_VARIABLES for safe-area-insets and touch targets
  - responsive() and getResponsiveValue() utilities
  - fluidValue() for fluid typography/spacing with clamp()

- Created `src/hooks/useResponsive.ts`: React hooks for responsive design:
  - useBreakpoint() - current breakpoint name
  - useIsMobile(), useIsTablet() - device type checks
  - useDeviceType() - mobile/tablet/desktop
  - useOrientation() - portrait/landscape with screen.orientation API
  - useMediaQuery() - custom media query matching
  - useBreakpointUp(), useBreakpointDown() - breakpoint comparisons
  - useIsTouchDevice() - touch capability detection
  - usePrefersReducedMotion() - accessibility preference
  - useHasNotch(), useSafeAreaInsets() - notched device support
  - useViewportSize() - viewport dimensions
  - useResponsive() - comprehensive responsive state object
  - useResponsiveValue() - breakpoint-based value selection
  - useScrollDirection() - FAB hide-on-scroll support
  - useKeyboardVisible() - mobile keyboard detection

- Created `src/components/layout/ResponsiveContainer.tsx`:
  - ResponsiveContainer - max-width container with size variants (sm, md, lg, xl, full)
  - SafeAreaContainer - respects safe-area-inset-* for notched devices
  - TouchFriendlyContainer - enforces 44px minimum tap targets

- Created `src/components/layout/MobileStack.tsx`:
  - MobileStack - stacks vertically on mobile, row on larger screens
  - StackItem - responsive width control for stack children
  - Configurable breakAt, gap, alignItems, justifyContent props

- Created `src/components/layout/ResponsiveGrid.tsx`:
  - ResponsiveGrid - auto-responsive grid with breakpoint columns
  - GridItem - column and row span control
  - Support for both viewport and container queries
  - minItemWidth prop for auto-fit grids

- Created `src/components/layout/ShowAbove.tsx`:
  - ShowAbove - show content only above specified breakpoint
  - HideAbove - hide content above specified breakpoint
  - MobileOnly, TabletOnly, DesktopOnly - convenience components
  - TouchDeviceOnly - show only on touch devices
  - Uses CSS display utilities for zero layout shift

- Created `src/components/layout/SwipeableViews.tsx`:
  - SwipeableViews - mobile swipeable carousel/tabs
  - SwipeableTab - individual tab content
  - Touch gesture support with spring animations
  - Pagination dots and navigation arrows
  - Loop, autoPlay, keyboard navigation options

- Created `src/components/mobile/BottomSheet.tsx`:
  - BottomSheet - iOS-style bottom sheet with snap points
  - Multiple snap points (40%, 90% default)
  - Drag gestures with spring physics
  - Modal backdrop with blur option
  - useBottomSheet() hook for state management

- Created `src/components/mobile/PullToRefresh.tsx`:
  - PullToRefresh - pull-to-refresh pattern
  - Configurable threshold, resistance, maxPull
  - Spinner and dots indicator styles
  - usePullToRefresh() hook for state management

- Created `src/components/mobile/SwipeActions.tsx`:
  - SwipeActions - swipe-to-reveal actions on list items
  - Left and right action support
  - SwipeableListItem - preconfigured edit/delete/archive/mark-read actions
  - Destructive action styling

- Created `src/components/mobile/FloatingActionButton.tsx`:
  - FloatingActionButton (FAB) - Material Design-style FAB
  - Speed dial with multiple actions
  - Position variants (bottom-right, bottom-left, bottom-center, top-right, top-left)
  - Extended FAB with label
  - Hide on scroll support
  - FABGroup - group multiple FABs
  - FABIcons - common icons (Plus, Microphone, Edit, Camera, Upload)

- Created barrel exports:
  - `src/lib/responsive/index.ts` - all responsive utilities
  - `src/components/layout/index.ts` - all layout components
  - `src/components/mobile/index.ts` - all mobile components

### Added - Feature Flag System
- Created `src/lib/features/types.ts`: Comprehensive type definitions for feature flags:
  - FeatureFlag interface with id, name, conditions, rolloutPercentage, variants, analytics
  - FeatureCondition union type (tenant, role, domain, percentage, date_range, user_list, environment, custom)
  - FeatureContext interface for evaluation context (tenantId, userId, role, domain, properties)
  - FeatureBundle for grouped flag collections
  - FeatureEvaluationResult with source tracking
  - FeatureOverride for admin overrides
  - PostHog integration types (PostHogFeatureFlag, PostHogSyncConfig)
  - FeatureFlagState for store management

- Created `src/lib/features/flags.ts`: Feature flag definitions:
  - FLAG_IDS constants for type-safe flag references
  - 25+ feature flags across categories: core, integrations, notifications, AI, workflow, export, admin, experimental
  - FEATURE_BUNDLES for grouped rollouts (ai_suite, enterprise_integrations, advanced_workflow, etc.)
  - Helper functions: getFlag, getFlagsByTag, getFlagsByStatus, getFlagsByOwner, getBundleFlags

- Created `src/lib/features/evaluator.ts`: Flag evaluation engine:
  - hashForPercentage() using FNV-1a for consistent percentage rollout
  - selectVariant() for A/B test variant selection
  - Condition evaluators: tenant, role, domain, percentage, date_range, user_list, environment, custom
  - evaluateCondition() and evaluateConditions() for condition matching
  - evaluateFlag() with override/PostHog/dependency chain support
  - isFeatureEnabled(), getFeatureVariant() convenience functions
  - generateCacheKey() for evaluation caching
  - trackFlagEvaluation(), trackFeatureUsage() for analytics

- Created `src/lib/features/provider.tsx`: React context and hooks:
  - FeatureFlagProvider with PostHog sync, caching, localStorage persistence
  - useFeatureFlag(flagId) - simple enabled check
  - useFeatureFlagEvaluation(flagId) - full evaluation result
  - useFeatureVariant(flagId) - A/B test variant
  - useFeatureFlags() - all flags with enabled state
  - useFeatureFlagAdmin() - admin actions (createOverride, removeOverride, syncPostHog)
  - useFeatureUsageTracker(flagId) - usage tracking
  - withFeatureFlag() HOC for conditional rendering

- Created `src/lib/features/posthog-integration.ts`: PostHog utilities:
  - syncFeatureFlagsFromPostHog() - sync all flags with error handling
  - refreshPostHogFlags() - reload flags on demand
  - trackFlagEvaluationInPostHog(), trackFeatureUsageInPostHog()
  - trackExperimentExposure(), trackExperimentConversion() for A/B tests
  - updatePostHogUserProperties() for targeting
  - setPostHogTenantGroup() for tenant-level flags
  - setPostHogOverride(), clearPostHogOverrides()

- Created `src/components/features/FeatureGate.tsx`: Conditional rendering:
  - FeatureGate - single flag gate with fallback, invert, loading support
  - MultiFeatureGate - multiple flags with 'all'/'any' logic
  - FeatureSwitch - switch-case style with Case and Default components

- Created `src/components/features/FeatureToggle.tsx`: Admin toggle UI:
  - FeatureToggle - searchable, filterable flag list with toggle switches
  - FeatureTogglePanel - full panel with sync button, clear all, stats
  - Status indicators (released, beta, development, deprecated)
  - Override indicators with undo button
  - Expandable flag details (conditions, tags, owner)

- Created `src/components/features/FeatureBadge.tsx`: Feature badges:
  - FeatureBadge - variant badges (beta, new, experimental, coming_soon, deprecated, premium)
  - AutoFeatureBadge - auto-detect badge from flag status
  - InlineBadge - wrap content with badge
  - FeatureStatusIndicator - simple enabled/disabled dot

- Created `src/hooks/useFeatures.ts`: Additional feature hooks:
  - useFeatureEnabled() - enabled check with track callback
  - useAllFeatures() - all enabled features grouped by tag
  - useFeatureAnalytics() - tracking with mount/unmount events
  - useABTest() - A/B testing with exposure/conversion tracking
  - useFeatureDependencies() - check dependency chain
  - useFeatureState() - detailed flag state
  - useFeatureChecks() - bulk flag checking
  - useFeatureRollout() - rollout progress info
  - useTypedFeatureFlags() - type-safe flag record

### Added - Role-Based Navigation System
- Created `src/lib/navigation/types.ts`: Complete type definitions for navigation:
  - NavItem interface with label, href, icon, roles, permissions, children, badges
  - NavSection interface with title, items, showFor roles/domains, collapsibility
  - NavigationConfig interface with sections, footerItems, quickActions
  - QuickAction, FooterItem, BreadcrumbItem interfaces
  - Permission type with granular access control (view/edit/approve/manage)
  - NavigationState, NavigationActions, NavigationContextValue interfaces
  - NavigationUserContext for filtering context

- Created `src/lib/navigation/config.ts`: Navigation configuration:
  - Capture section (Smart Capture, Upload, Batch Upload)
  - Notes section (My Notes, Team Notes, Templates, Scheduled)
  - Review section (Review Queue, QA Dashboard, Approval History)
  - Insights section (Team/Org Analytics, Usage Reports, Export)
  - Admin section (Configuration, Modules, Users, Templates, Audit Logs)
  - Footer items (Notifications, Help & Support)
  - Quick actions by role (New Recording, Upload, Search, Review Next)
  - Domain overrides for housing and corporate
  - getDefaultExpandedSections() and getHomeRoute() helpers

- Created `src/lib/navigation/filter.ts`: Filtering utilities:
  - filterNavigationForRole() - filter by role and domain
  - filterNavigationForContext() - filter by complete user context
  - filterNavigationForPermissions() - filter by permission set
  - getQuickActions(), getPrimaryQuickAction() - role-specific actions
  - getPermissionsForRole() - default permissions per role
  - searchNavigation() - search nav items
  - getFlatNavItems(), findNavItemByHref(), findNavItemById() helpers
  - getSectionForItem() - find section containing item

- Created `src/components/navigation/NavItem.tsx`: Individual nav item with:
  - Active state highlighting with accent bar
  - Nested children support with expand/collapse
  - Icon, badge, description display
  - Disabled state with reason tooltip
  - External link support
  - Premium glass/hover effects

- Created `src/components/navigation/NavSection.tsx`: Section component with:
  - Collapsible header with chevron animation
  - Optional section icon
  - Child item rendering

- Created `src/components/navigation/QuickActions.tsx`: Quick action buttons:
  - Primary CTA highlighting
  - Keyboard shortcut display
  - Horizontal/vertical layout variants
  - Glass/primary/secondary/ghost styling

- Created `src/components/navigation/UserMenu.tsx`: User dropdown with:
  - Avatar or initials display
  - Online status indicator
  - Role badge with color coding
  - Profile, Settings, Domain info links
  - Switch Role option (for demo)
  - Sign Out action

- Created `src/components/navigation/MobileNav.tsx`: Mobile drawer navigation:
  - Full-screen slide-in overlay
  - All sections with vertical quick actions
  - Footer items and user menu
  - ESC key to close
  - Body scroll lock when open

- Created `src/components/navigation/MainNav.tsx`: Main layout component:
  - Collapsible desktop sidebar
  - Sticky header with breadcrumbs
  - Search input with slash shortcut
  - Notification bell with badge
  - Responsive mobile/desktop switching

- Created `src/hooks/useNavigation.ts`: Navigation hook:
  - filteredConfig based on role/domain/flags
  - activeItem tracking
  - expandedSections state with role defaults
  - Mobile menu state
  - searchQuery and searchResults
  - quickActions for current role
  - useBreadcrumbs() and useActiveNavSection() helpers

- Created `src/providers/NavigationProvider.tsx`: Navigation context:
  - NavigationProvider with full state management
  - useNavigationContext() hook
  - useFilteredNavigation(), useMobileNav() convenience hooks
  - usePageBreadcrumbs() for page-level breadcrumb setting
  - useNavExpansion() for section expansion control

### Added - Minute Generation Display & Editing Interface
- Created `src/lib/minutes/types.ts`: Comprehensive TypeScript types for minute management:
  - MinuteStatus enum (draft, pending_review, approved, published) with status config
  - SectionType enum (summary, keyPoints, actionItems, decisions, attendees, risks, safeguarding, nextSteps)
  - ActionPriority and ActionStatus enums with configuration
  - EvidenceLink interface for transcript citation linking
  - ActionItem interface with assignee, due date, priority tracking
  - MinuteSection interface with markdown content and evidence arrays
  - MinuteAttendee, MinuteMetadata, MinuteVersion interfaces
  - Complete Minute interface with sections, actions, attendees, workflow fields
  - SECTION_TYPES, MINUTE_STATUS_CONFIG, ACTION_PRIORITY_CONFIG, ACTION_STATUS_CONFIG constants

- Created `src/hooks/useMinutes.ts`: Full-featured minutes management hook:
  - CRUD operations: loadMinute, createMinute, updateMinute, saveMinute, deleteMinute
  - Section operations: addSection, updateSection, removeSection, reorderSections
  - Action item operations: addActionItem, updateActionItem, removeActionItem
  - Evidence operations: addEvidence, removeEvidence
  - Attendee operations: addAttendee, updateAttendee, removeAttendee
  - Workflow operations: submitForReview, approve, requestChanges, publish
  - Auto-save with configurable interval and dirty state tracking
  - Demo data generator for development

- Created `src/components/minutes/MinuteStatusBadge.tsx`: Status badge component with:
  - Size variants (sm, md, lg)
  - Icon support with lucide-react icons
  - Pulse animation for pending_review status
  - MinuteStatusDot compact variant for lists

- Created `src/components/minutes/MinuteSection.tsx`: Section editor component with:
  - Section header with type icon, title editing, collapse toggle
  - Markdown content editing with auto-resize textarea
  - Simple markdown rendering (bold, italic, lists)
  - Evidence citations display with popover triggers
  - Drag handle for reordering
  - Add/remove evidence functionality

- Created `src/components/minutes/EvidencePopover.tsx`: Evidence citation popover with:
  - Citation badge with truncated text and timestamp
  - Expandable popover with full quote display
  - Timestamp range and speaker attribution
  - Play audio and view in transcript actions
  - Remove evidence capability
  - EvidenceMarker inline component variant

- Created `src/components/minutes/ActionItemList.tsx`: Action items manager with:
  - ActionItemRow component with checkbox status cycling
  - Inline editing for description, assignee, due date
  - Priority badge with click-to-cycle functionality
  - Due date formatting with overdue highlighting
  - Progress bar and completion statistics
  - Drag handle for reordering
  - Expanded evidence view

- Created `src/components/minutes/MinutePreview.tsx`: Read-only preview with:
  - Print-friendly document layout
  - Header with status, title, date, duration
  - Attendees section with presence indicators
  - Numbered sections with markdown rendering
  - Action items summary table
  - Document footer with metadata
  - Print/Download/Share action buttons
  - Global print CSS styles

- Created `src/components/minutes/MinuteEditor.tsx`: Main editor interface with:
  - Sticky header with status, title editing, save state
  - Edit/Preview tab switching
  - Add section menu with all section types
  - Section list with full editing capabilities
  - Action items card with glass variant
  - Changes requested banner display
  - Submit for review / Approve / Request changes workflow buttons
  - Document metadata footer

- Updated `src/app/minutes/page.tsx`: Minutes list page with:
  - Stats cards (total, drafts, pending, completed)
  - Search by title/case name
  - Status filter tabs
  - Glass card list with status badges, risk indicators
  - Meeting metadata (date, duration, attendees, actions)
  - Click navigation to detail view
  - Empty state handling

- Created `src/app/minutes/[id]/page.tsx`: Single minute view/edit page with:
  - Loading and error states with retry
  - Breadcrumb navigation
  - Full MinuteEditor integration
  - useMinutes hook wiring for all operations

- Created `src/app/minutes/[id]/components/MinuteInfoSidebar.tsx`: Info sidebar with:
  - Meeting info (date, duration, template, case)
  - Attendees summary with avatars
  - Action items progress bar
  - Risks indicator alert

- Created `src/app/minutes/[id]/components/MinuteVersionHistory.tsx`: Version history with:
  - Collapsible version list
  - Version number badges
  - Change descriptions with author/timestamp
  - Preview and restore actions

- Created `src/app/minutes/[id]/components/TranscriptPanel.tsx`: Transcript panel with:
  - Audio player controls (play/pause, skip, progress)
  - Volume and expand controls
  - Text selection with "Link as Evidence" action
  - Speaker-segmented transcript display
  - Current segment highlighting

### Added - Manager Review Queue Interface
- Created `src/lib/review/types.ts`: Comprehensive TypeScript types for the review queue system including:
  - ReviewStatus enum (pending, in_review, changes_requested, approved, rejected) with status config
  - ReviewPriority enum (low, normal, high, urgent) with priority config  
  - ReviewItem interface for queue items with minute, author, status, priority, feedback counts
  - ReviewFeedback interface with type-safe feedback types (suggestion, required, praising, question)
  - FeedbackReply interface for threaded discussions
  - ReviewFilter interface for multi-criteria filtering
  - Helper functions: meetingStatusToReviewStatus, calculatePriority, isOverdue, getSlaRemaining

- Created `src/hooks/useReview.ts`: Full-featured review queue hook providing:
  - Queue state management with filtering/sorting
  - Selection management for bulk operations
  - Review statistics calculation (pending, urgent, overdue, throughput)
  - Review actions: submitReview, bulkReview, startReview
  - Feedback management: addFeedback, resolveFeedback, replyToFeedback
  - Auto-refresh capability with configurable interval

- Created `src/components/review/ReviewQueue.tsx`: Main queue list component with:
  - Filterable/sortable list with quick stats
  - Bulk selection and approve/reject actions
  - List/compact view toggle
  - Real-time loading states with overlay

- Created `src/components/review/ReviewCard.tsx`: Individual review item card with:
  - Author avatar, name, submission date
  - Status/priority badges with color coding
  - SLA countdown indicator
  - Quick approve/reject actions
  - Navigation to detail view

- Created `src/components/review/ReviewFilters.tsx`: Advanced filter panel with:
  - Search by title/author
  - Status multi-select filter
  - Priority filter
  - Domain/service type filter  
  - Overdue/unresolved feedback toggles
  - Collapsible advanced filters
  - Active filter pills with clear functionality

- Created `src/components/review/ReviewDetail.tsx`: Full review view with:
  - Side-by-side minute content and feedback panel
  - Section-based inline commenting
  - Evidence verification with audio playback stub
  - Approve/reject/request changes decision panel
  - Required changes blocking approval

- Created `src/components/review/FeedbackThread.tsx`: Discussion component with:
  - Threaded comment display with replies
  - Feedback type badges (suggestion, required, praising, question)
  - @mentions support
  - Resolve feedback functionality
  - Expandable reply threads

- Created `src/components/review/ReviewStats.tsx`: Dashboard statistics with:
  - Pending, urgent, overdue, approved today counts
  - Average review time
  - Weekly throughput with trend indicator
  - By-author breakdown

- Created `src/app/review-queue/[id]/page.tsx`: Review detail page with:
  - Role guard for manager/admin access
  - Full ReviewDetail component integration
  - Gradient header with config theme

- Created `src/components/review/index.ts`: Barrel export for review components
- Created `src/lib/review/index.ts`: Barrel export for review types

### Added - Comprehensive Admin Configuration Panel
- Created `src/types/admin.ts`: TypeScript interfaces for AdminUser, AdminModule, AdminTemplate, TenantSettings, AuditLogEntry, AdminStats, and AdminAction types with ADMIN_PERMISSIONS constant for role-based access control.
- Created `src/hooks/useAdmin.ts`: Admin context hook providing:
  - Mock data for users, modules, templates, settings, and audit log
  - Permission checks (canManageUsers, canManageModules, canManageTemplates, canManageSettings, canViewAudit)
  - User management (addUser, updateUser, deleteUser)
  - Module management (toggleModule, updateModuleSettings)
  - Template management (addTemplate, updateTemplate, deleteTemplate)
  - Settings management (updateSettings)
  - Automatic audit logging for all admin actions
- Created `src/components/admin/AdminNav.tsx`: Admin sidebar navigation with role-based item visibility, active state highlighting, and badge counts.
- Created `src/components/admin/AdminHeader.tsx`: Admin header with dynamic breadcrumbs and AdminPageWrapper component for consistent page layout.
- Created `src/components/admin/UserTable.tsx`: Data table with:
  - Search, role/status filters
  - Sortable columns (name, email, role, status, lastLogin)
  - Bulk selection and actions
  - Action menu (edit, delete)
  - Pagination-ready design
- Created `src/components/admin/UserForm.tsx`: Modal form for add/edit user with:
  - Zod schema validation
  - Field-level error display
  - Domain-based team suggestions
  - Loading states
- Created `src/components/admin/ModuleToggle.tsx`: Module configuration view with:
  - Category grouping (core, AI, integration, pilot)
  - Dependency checking and warnings
  - Expandable settings preview
  - Confirmation dialogs for destructive actions
- Created `src/components/admin/SettingsForm.tsx`: Settings form with tabs:
  - General: tenant name, feature toggles
  - Branding: color pickers, logo upload, live preview
  - Compliance: data retention, MFA, allowed domains
  - Notifications: email/Slack toggles, webhook URL
- Created `src/components/admin/AuditLog.tsx`: Audit log viewer with:
  - Search, action/resource filters
  - Paginated entries with icons
  - CSV export functionality
  - Relative timestamps
- Created `src/components/admin/index.ts`: Barrel export for admin components.
- Created `src/app/admin/layout.tsx`: Admin layout with sidebar and main content area.
- Updated `src/app/admin/page.tsx`: Enhanced dashboard with:
  - KPI cards (users, meetings, transcription time, storage)
  - Quick actions panel
  - System health monitoring
  - Active modules overview
  - Team adoption metrics
  - Recent activity feed
- Updated `src/app/admin/users/page.tsx`: Full user management page with UserTable and UserForm integration.
- Updated `src/app/admin/modules/page.tsx`: Module configuration page with ModuleToggle component.
- Created `src/app/admin/templates/page.tsx`: Template management page with grid view, domain grouping, and actions menu.
- Created `src/app/admin/settings/page.tsx`: Settings page with SettingsForm component.
- Created `src/app/admin/audit/page.tsx`: Audit log page with full log viewer.
- Updated `src/lib/dates.ts`: Added `formatDistanceToNow()` helper for relative timestamps.

### Changed
- Added `zod` dependency for form validation.

## 2026-03-28
### Added - Multi-Tenant Configuration System
- Created `src/lib/tenant/types.ts`: Comprehensive TypeScript interfaces for multi-tenant SaaS configuration including TenantConfig, ServiceDomainConfig, RoleConfig, ModuleConfig, FeatureFlags, Permission types, NavItemConfig, IntegrationConfig, and TenantContextValue.
- Created `src/lib/tenant/defaults.ts`: Default configurations for themes, localization, feature flags, service domains (children, adults, housing, corporate, education, health), roles (social_worker, team_lead, manager, senior_manager, admin, quality_assurance, housing_officer, support), and 17 configurable modules.
- Created `src/lib/tenant/config-loader.ts`: Configuration loading system with environment/API/static source support, TTL-based caching, hot-reload subscriptions, config override application, and tenant detection from URL/subdomain/localStorage.
- Created `src/lib/tenant/tenant-context.tsx`: React context provider (`TenantProvider`) with hooks: `useCurrentTenant()`, `useCurrentDomain()`, `useCurrentRole()`, `useTenantFeature()`, `useTenantFeatures()`, `useModule()`, `usePermission()`, `usePermissions()`, `useNavigation()`, `useTenantBranding()`, `useTenantTheme()`, `useDomainSwitcher()`, `useTenantStatus()`.
- Created `src/lib/tenant/configs/wcc.config.ts`: Westminster City Council configuration with Children's, Adults, Housing, and Corporate domains, Mosaic integration, and WCC brand colors.
- Created `src/lib/tenant/configs/rbkc.config.ts`: Royal Borough of Kensington and Chelsea configuration with bi-borough Adult Social Care, Liquid Logic integration, and RBKC brand colors.
- Created `src/lib/tenant/configs/demo.config.ts`: Development/demo tenant with all features enabled, mock integrations, and all service domains available.
- Created `src/lib/tenant/index.ts`: Barrel export for the tenant module with organized exports for types, defaults, loader, context, and static configs.

## 2026-03-28
### Added - Sentry & PostHog Integration
- Created `src/lib/sentry.ts`: Centralized Sentry configuration with privacy controls, PII scrubbing, demo mode awareness, Do Not Track respect, and helper functions for error/message capture, user identification, and performance monitoring.
- Created `src/lib/posthog.ts`: PostHog configuration with privacy-compliant initialization, automatic PII filtering, feature flag support, session recording, event tracking, and group analytics.
- Created `src/providers/PostHogProvider.tsx`: React context provider for PostHog with automatic page view tracking, feature flag hooks (`usePostHog`, `useFeatureFlag`, `useFeatureEnabled`), and GDPR opt-in/out controls.
- Created `src/hooks/useAnalytics.ts`: Unified analytics hook combining Sentry and PostHog with `useAnalytics()` (identify, track, captureError, isFlagEnabled), `usePageLoadTracking()`, `useInteractionTracking()`, and `useFormTracking()`.
- Created `src/instrumentation.ts`: Next.js 16 instrumentation file for server-side Sentry initialization with `onRequestError` hook for unhandled error capture.
- Created `sentry.client.config.ts`: Client-side Sentry configuration with browser tracing, session replay, and feedback widget integration.
- Created `sentry.server.config.ts`: Server-side (Node.js) Sentry configuration with HTTP tracing, PII scrubbing, and Prisma integration.
- Created `sentry.edge.config.ts`: Edge runtime Sentry configuration with minimal sampling and privacy controls.
- Updated `src/components/ErrorBoundary.tsx`: Enhanced with proper Sentry integration, error event IDs, and user feedback dialog support.
- Created `.env.example`: Environment variable template documenting all required variables for Sentry and PostHog.

### Changed
- Added `@sentry/nextjs@^8.47.0` and `posthog-js@^1.194.0` dependencies for observability.

### Added - PWA Support
- Created `public/manifest.json`: Complete PWA manifest with app name "Council Minutes", icons at multiple sizes, shortcuts for Record/Minutes/Upload, and proper PWA configuration.
- Created `public/sw.js`: Service worker with cache-first strategy for static assets, network-first for APIs, offline fallback, and background sync support.
- Created `public/offline.html`: Styled offline fallback page with retry functionality and feature list.
- Created `src/app/manifest.ts`: Next.js 16 dynamic manifest generation.
- Created `src/lib/pwa.tsx`: Service worker registration with `ServiceWorkerRegistration` component, `useIsStandalone()` hook, and `useNetworkStatus()` hook.
- Created `src/components/pwa/PWAPrompts.tsx`: `PWAUpdateNotification` for SW updates and `PWAInstallPrompt` for A2HS install prompt.
- Created `public/icons/icon.svg` and `icon-maskable.svg`: Main app icons with document/checkmark design.
- Created `public/icons/record-96x96.svg`, `minutes-96x96.svg`, `upload-96x96.svg`: Shortcut icons.
- Created `public/icons/safari-pinned-tab.svg`: Safari pinned tab icon.
- Created `public/browserconfig.xml`: Microsoft tile configuration.
- Created `scripts/generate-pwa-icons.js`: Icon generation script using sharp.

### Changed
- Updated `src/app/layout.tsx`: Added PWA meta tags, Apple web app configuration, viewport settings, icon links, and ServiceWorkerRegistration.
- Updated `next.config.ts`: Added headers for SW, manifest, icons caching, and security headers.

### Added - MSAL Authentication Integration
- Created `src/lib/auth/msal-config.ts`: Azure Entra ID (MSAL) configuration with environment variables, API scopes, idle timeout settings, and demo mode flag.
- Created `src/lib/auth/index.ts`: Auth module exports for configuration and documentation.
- Created `src/providers/AuthProvider.tsx`: Root authentication provider wrapping MsalProvider with idle timeout detection, automatic token refresh, and demo mode bypass.
- Created `src/hooks/useAuth.ts`: Full auth hook with `useAuth()` (login, logout, getToken, isAuthenticated) and `useAccessToken()` for token access.
- Created `src/components/AuthGate.tsx`: Route protection component with `AuthGate` and `withAuthGate` HOC, loading state, and demo mode support.
- Created `.env.local.example`: Environment variable template for Azure auth configuration.

### Changed
- Added `@azure/msal-browser@^3.27.0` and `@azure/msal-react@^2.1.1` dependencies for Azure authentication.

### Added - Offline Queue Infrastructure
- Created `src/lib/storage-adapter.ts`: IndexedDB storage via Dexie with `StorageAdapter` interface, `DexieStorageAdapter` implementation, and singleton accessor. Supports recordings and generic sync operations with retry tracking.
- Created `src/lib/offline-queue.ts`: Queue management for recordings and sync operations with exponential backoff retry, multi-step upload (recording → blob → transcription), status tracking, and queue statistics.
- Created `src/hooks/useSyncManager.ts`: React hook for offline sync management with reactive Dexie live queries, auto-sync on reconnect, toast notifications, and manual sync/retry controls.

### Changed
- Added `dexie@^4.0.10` and `dexie-react-hooks@^1.1.7` dependencies for IndexedDB storage.

### Added - Backend Connection Infrastructure
- Created `src/lib/api-client.ts`: Typed HTTP client with automatic retry, exponential backoff, request/response interceptors, and auth token management.
- Created `src/lib/api-errors.ts`: Structured error types (`ApiError`, `NetworkError`, `TimeoutError`, `ValidationError`) with user-friendly messages and retry logic.
- Created `src/lib/useApiQuery.ts`: Custom React hooks (`useApiQuery`, `useApiMutation`) for data fetching with caching, loading states, and error handling.
- Created `src/app/api/proxy/[...path]/route.ts`: API proxy route to forward requests to minute-main backend with auth, CORS, and error handling.

### Added - UI Infrastructure
- Created `src/components/ErrorBoundary.tsx`: Global error boundary component with user-friendly fallback UI, error logging, and Sentry integration.
- Created `src/components/Toast.tsx`: Toast notification system with success/error/warning/info variants, animations, and action support.
- Created `src/components/ui/skeleton.tsx`: Loading skeleton components for cards, lists, tables, metrics, and full dashboards.

### Changed
- Updated `src/app/layout.tsx` to wrap app in `ErrorBoundary` and `ToastProvider` for global error handling and notifications.

### Documentation
- Updated root `AGENTS.md` with **CRITICAL: Frontend Location** section clarifying that `universal-app/` is the official frontend.
- Created `/memories/repo/CRITICAL_frontend_location.md` documenting the correct frontend location and features to port from minute-main/frontend.

### Testing
- Lint passes via `npm run lint`

## 2025-12-12
### Fixed
- Housing officer persona now uses practitioner dashboard variant and copy instead of falling through to admin view.
- Housing officers can access Smart Capture (`/record`) in the housing domain, matching visible navigation.
- Login “Skip for now” CTA now authenticates the current persona instead of bouncing back to `/login`.
- Added `signOut` to `DemoContext` and wired AppShell Sign out/Switch to clear auth state and return to `/login`.
- Demo templates now live in `DemoContext` and hydrate from `/api/demos/personas`; Templates and Note Detail read from shared state.
- Tightened metrics helpers to accept `ServiceDomain` and removed redundant task dueDate guards.
- Unified Templates/My Notes hero headers to use the active domain gradient theme.
- Wired key CTAs: My Notes “New Recording” now opens Smart Capture, Manager dashboard “Approve” updates status, and “Bulk Approve Low Risk” routes to Review Queue.
- Radix Select/Dropdown focus states now tint via theme tokens (`--accent`, `--primary-soft`).
- Tabs, Slider, Input, and Badge focus rings now use `--accent` / `--primary` tokens for consistent theming.
- TabsList rails now use the `--primary-soft` background token, including Review Queue tabs.
- EnhancedInput focus styling and send CTA now use theme tokens and default Button variants instead of hard‑coded blues.
- Upload processing‑mode tiles and Record consent checkbox focus rings now use theme ring tokens.
- Login persona card focus rings now pull from `--login-focus-ring`, which ThemeSetter derives from the active palette.
- Centralized “pending review” status policy in `PENDING_REVIEW_STATUSES` and aligned manager KPIs, Review Queue, and tenant metrics to exclude `processing` from approval counts.
- Improved duration parsing in `useMeetingMetrics` to support mixed formats (`45m`, `1h 15m`, `MM:SS`, `HH:MM:SS`) and ignore processing sentinels so Avg Duration KPIs stay accurate.
- Login persona grid now derives persona ids from `DemoContext` (ordered fallback) to prevent drift when personas change.
- `EnhancedInput` now supports controlled usage while preserving existing uncontrolled behavior.
- Updated README demo API contract to match current persona roles/domains and pilot fields.
- My Notes status filter now includes `flagged` (“Changes Requested”) to match full `MeetingStatus`.
- Meetings now carry optional `submittedById`; seeded demo data and new Record/Upload flows set it, and analytics/manager dashboards prefer id-based attribution.
- Review Queue and Meeting Detail status badges now share the same labels/colors as Meeting cards (incl. flagged/processing).
- FlagGate disabled states no longer show “Open Admin” actions for non‑admin roles; CTAs route to safe alternatives.
- Admin module toggles and primary actions now use theme tokens/default Button variants instead of hard‑coded blues.
- ROLE_MATRIX.md updated to reflect current persona domains and nav scopes.
- Admin Feature Flags copy now reflects global demo scope (not per‑tenant persistence).
- `modulesEnabled` KPI is now derived from active Feature Flags; removed manual +/- controls to prevent drift.
- Legacy `/capture` and `/minutes` routes now redirect to `/record` and `/my-notes` to avoid duplicate/demo-drift surfaces.
- Admin Modules toggles now confirm before changing flags, matching MainConfigArea UX.
- Removed unused `useNormalizedMetrics` hook to avoid dead-code drift in Insights.
- Primary actions on Record consent, Upload, and TranscriptPlayer now use theme‑driven Button styling instead of fixed blue utilities.

### Testing
- `npm run lint`
- `npm run build`

## 2025-12-11
### Fixed
- Restored Next.js TypeScript build by importing `Meeting` in `src/app/my-notes/page.tsx`.
- Moved persisted demo state + recording consent hydration into lazy initializers to satisfy `react-hooks/set-state-in-effect` and avoid first‑paint flicker.
- Removed unused `setSimulateError` setter from Upload while keeping failure simulation off by default.

### Testing
- `npm run lint`
- `npm run build`

## 2025-11-28
### Fixed
- Suppressed extension-driven hydration mismatch warnings by adding `suppressHydrationWarning` to the root `html/body` so Grammarly-injected `data-gr-*` attributes no longer trigger console errors in Next.js 16.0.4 dev.

### Docs
- Documented extension hygiene in `AGENTS.md` and captured the hydration warning fix in the roadmap (Phase 13, newly discovered).

### Testing
- Not run (layout prop + docs update only).

## 2025-11-25
### Added
- Phase 01 governance docs: `AGENTS.md` plus roadmap at `minute-main/ROADMAP_social_care.md`.
- Theme tokens expanded (`--primary-soft`, `--brand-gradient`) via `ThemeSetter`.
- Phase 03: Upload flow now simulates success/failure, captures processing mode, and adds uploaded notes into shared meeting state.
- Phase 04: Manager review queue gains risk filters, quick approve/return actions, and risk badges on cards.
- Phase 05: Lint/quality sweep — removed impure render calls, tightened `any` types, cleaned unused imports, swapped `<img>` for `next/image`, and got `npm run lint` passing.
- Phase 06: Meetings now sorted newest-first via `DemoContext`; Meeting cards/detail show submitted/uploaded timestamps.
- Phase 07: Recording page creates processing notes in shared state with a success panel linking to the new note.
- Phase 08: Accessibility polish — skip link/main landmark, aria labels on icon-only controls, keyboard-activatable upload dropzone.
- Phase 09: Insights now read live mock data with domain filter, risk distribution pill, and derived metrics.
- Phase 10: Persona login screen with avatar cards wired to context; refreshed Westminster/RBKC theming and “Smart Capture” naming.
- Persona-specific UX: manager sidebar now surfaces Team Notes/Users & Teams; manager home shows Approvals Pending + Team Overview; admin (Priya) console redesigned with config/module/analytics cards.
- Gemini-inspired UI polish: gradient hero headers with info rails on Insights/Review Queue, glass-panel KPI chips, and tabbed admin surface for Priya.
- Added gradient hero + info rail for social worker dashboard; Review Queue now has gradient hero, info rails, and branded empty state CTA. Team activity now derives from live submitter data in Insights.
- Feature flags + module counts now persist in `DemoContext` (localStorage). Admin toggles gate nav/pages: Smart Capture, AI Insights, and Housing pilot render disabled states with CTAs.
- Role-specific UX tightening: social workers no longer see cross-domain scopes in Insights; manager dashboard text/queues filter to their domain/team and live contributors. Housing templates, Smart Capture, and AI Insights render disabled-only states when toggled off.
- Added `ROLE_MATRIX.md` to document persona capabilities (nav, scope, flags) for future contributors.
- Phase 13: Persona data, templates, and meetings now live in `src/config/personas.ts` with authority metadata; `DemoContext` hydrates from that source and shares types via `src/types/demo.ts` to reduce duplication.
- Phase 14: Navigation now driven by `src/config/navigation.ts` (per domain+role+flags), and AppShell renders those links without ad hoc filtering.
- Added `FlagGate` wrapper + feature-driven hero copy for Smart Capture, AI Insights, and Housing templates so disabled states reuse consistent messaging/text/CTAs.
- Phase 15: Added `useRoleGuard` to protect pages by persona/role and introduced `src/lib/selectors.ts` for approvals SLA + sync KPIs, keeping manager metrics tied to live mock data.
- Phase 16: Added persona switch log in Admin showing authority + focus area metadata and extended `DemoContext` with `personaHistory` and derived role helpers plus meeting domain validation for consistency.
- Phase 17: Introduced `useMeetingMetrics` hook for normalized counts + kpis and documented persona copy; reduces duplicate reduces in Insights and custom metrics.
- Phase 18: Added enhanced input + centralized animation helpers inspired by Gemini for multi-modal interactions and reusable motion patterns.
- Phase 19: Added animated background gradient, responsive AppShell refinements with blurred overlays, and AnimatedIcon helper to keep interactive icons consistent.
- Phase 20: Added mobile overlay/touch hint improvements in AppShell and extended AnimatedIcon with active/fill states to better match Gemini’s responsive gestures.
- Phase 21: Introduced consistent date formatting via `src/lib/dates.ts` to eliminate hydration mismatches caused by differing locale output.
- Phase 22: Added `usePrefersReducedMotion` guard to `AnimatedIcon` so interactive icons pause motion when users request reduced animation.
- Static demo API at `api/demos/personas` (force-static, revalidate 0) serving personas, meetings, templates for faster dev hydration; `DemoProvider` hydrates from it on mount.
- `DemoContext` now exposes a `personas` map + derived role helpers to consumers to avoid re-importing `PERSONAS`.
- Added `admin/modules` stub page (role-guarded) reusing feature-flag toggles to avoid 404s when Priya opens Modules.
- Introduced `useNormalizedMetrics` helper for chart-ready series (status, risk, template) to keep visualisations aligned with `useMeetingMetrics`.

### Changed
- GlassCard now offers a hero variant with stronger blur/gradient used by login persona cards for consistent high-polish styling.
- Login persona list stacks vertically and scrolls on very small screens while keeping desktop grid intact; touch targets increased for mobile.
- Login persona avatars now use domain-colored rings with subtle hover/active glow tied to prefers-reduced-motion.
- Navigation now uses ThemeSetter tokens for hover/active states and supports nested routes.
- Sidebar logo and header context pills render with domain gradients instead of brittle Tailwind classes.
- Meeting data now lives in `DemoContext` (`meetings`, `addMeeting`, `updateMeetingStatus`) replacing direct `MEETINGS` usage.
- Smart Capture/Insights/Templates pages now respect admin feature toggles; buttons using unsupported `asChild` replaced with Link wrappers to restore TS build.
- Persona, template, and meeting imports now draw directly from `src/config/personas.ts` and `src/types/demo.ts`, allowing us to delete the legacy `src/data/mockData.ts` helper and keep mock data centralized.
- AppShell now leans on a static gradient + theme tokens instead of the background animation, and MeetingCard/ReviewQueue/Admin timestamp text use the new `formatDateTime` helper to avoid hydration mismatches.
- Domain gradients flattened to single-color fills for readability per stakeholder feedback (no heavy background gradient layers on cards/shell).
- Insights now guarded by `useRoleGuard(['manager','admin'])` to soft-block roles that shouldn’t view analytics; review queue remains guarded.
- Date utilities now force UTC in `Intl.DateTimeFormat` to remove locale-driven hydration mismatches (23/11 vs 11/23).
- AppShell sidebar now uses domain-coloured dark backgrounds with higher-contrast nav pills, tinted page canvases vary by domain/role, and admin gains a Tenant Adoption section with progress bars powered by a reusable `ProgressBar` component.
- Phase 13: Persona login screen restyled into a dark gradient hero with glass persona cards and shared background animations so the login experience matches the Gemini-inspired AppShell.
- Login persona cards now derive both function and domain labels (driven by the new `functionLabel` persona field and the central `personaLabel` domain token) and tint their badges with the domain theme colors for visual consistency.
- Login hero, cards, badges, focus rings, and gradient overlays now pull every hue from `ThemeSetter`/`config.theme` (`--login-*` tokens plus `--accent` / `--primary`) instead of ad-hoc Tailwind grey/sky classes, so each council’s palette automatically drives the login experience.
- `BackgroundGradient` now exposes theme-aware tint props plus an optional parallax hook; the login hero passes the current council palette so the animated background always matches the authority theme and respects `prefers-reduced-motion`.
- Persona cards now show a feature-flag-backed pilot badge (housing pilot & AI insights) via the shared `Badge` component so stakeholders can spot experimental personas whenever the related flag is active.

### Testing
- `npm run lint`
- `npm run build`
  - Re-verified after persona login UI refresh.
  - Re-ran after sidebar/canvas tint + tenant adoption updates.
