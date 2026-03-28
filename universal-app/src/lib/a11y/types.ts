/**
 * WCAG AA Accessibility Types
 * 
 * Core type definitions for accessibility compliance utilities.
 * Based on WCAG 2.1 AA guidelines and WAI-ARIA 1.2 specifications.
 */

import type { RefObject } from 'react';

// ============================================================================
// Accessibility Configuration
// ============================================================================

/**
 * Global accessibility configuration for the application
 */
export interface AccessibilityConfig {
  /** Enable screen reader announcements */
  announcements: boolean;
  /** Show focus indicators */
  focusIndicators: boolean;
  /** Skip link target ID */
  skipLinkTarget: string;
  /** Default live region politeness */
  defaultPoliteness: AriaLivePoliteness;
  /** Announcement timeout in ms */
  announcementTimeout: number;
  /** Enable keyboard shortcuts */
  keyboardShortcuts: boolean;
  /** Focus trap enabled by default for modals */
  focusTrapEnabled: boolean;
  /** Minimum color contrast ratio (WCAG AA = 4.5:1, AAA = 7:1) */
  minContrastRatio: 4.5 | 7;
}

/**
 * Default accessibility configuration
 */
export const DEFAULT_A11Y_CONFIG: AccessibilityConfig = {
  announcements: true,
  focusIndicators: true,
  skipLinkTarget: 'main-content',
  defaultPoliteness: 'polite',
  announcementTimeout: 5000,
  keyboardShortcuts: true,
  focusTrapEnabled: true,
  minContrastRatio: 4.5,
};

// ============================================================================
// User Preferences
// ============================================================================

/**
 * User accessibility preferences
 */
export interface A11yPreferences {
  /** Respects prefers-reduced-motion media query */
  reducedMotion: boolean;
  /** High contrast mode preference */
  highContrast: boolean;
  /** Font size scale (1 = 100%, 1.25 = 125%, etc.) */
  fontSize: FontSizeScale;
  /** Increased spacing for better readability */
  increasedSpacing: boolean;
  /** Prefer explicit focus indicators */
  showFocusOutlines: boolean;
  /** Screen reader optimization mode */
  screenReaderMode: boolean;
  /** Dyslexia-friendly font */
  dyslexiaFont: boolean;
  /** Reduce transparency effects */
  reduceTransparency: boolean;
  /** Pause animations */
  pauseAnimations: boolean;
}

/**
 * Font size scale options
 */
export type FontSizeScale = 0.875 | 1 | 1.125 | 1.25 | 1.5 | 1.75 | 2;

/**
 * Default user preferences
 */
export const DEFAULT_A11Y_PREFERENCES: A11yPreferences = {
  reducedMotion: false,
  highContrast: false,
  fontSize: 1,
  increasedSpacing: false,
  showFocusOutlines: true,
  screenReaderMode: false,
  dyslexiaFont: false,
  reduceTransparency: false,
  pauseAnimations: false,
};

// ============================================================================
// ARIA Roles & Attributes
// ============================================================================

/**
 * Valid ARIA live region politeness values
 */
export type AriaLivePoliteness = 'off' | 'polite' | 'assertive';

/**
 * Common ARIA landmark roles
 */
export type AriaLandmarkRole =
  | 'banner'
  | 'complementary'
  | 'contentinfo'
  | 'form'
  | 'main'
  | 'navigation'
  | 'region'
  | 'search';

/**
 * Common ARIA widget roles
 */
export type AriaWidgetRole =
  | 'alert'
  | 'alertdialog'
  | 'button'
  | 'checkbox'
  | 'combobox'
  | 'dialog'
  | 'grid'
  | 'gridcell'
  | 'link'
  | 'listbox'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'option'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'scrollbar'
  | 'searchbox'
  | 'slider'
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tablist'
  | 'tabpanel'
  | 'textbox'
  | 'tooltip'
  | 'tree'
  | 'treeitem';

/**
 * Combined ARIA roles type
 */
export type AriaRole = AriaLandmarkRole | AriaWidgetRole;

/**
 * ARIA state attributes
 */
export interface AriaStateAttributes {
  'aria-busy'?: boolean;
  'aria-checked'?: boolean | 'mixed';
  'aria-disabled'?: boolean;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-pressed'?: boolean | 'mixed';
  'aria-selected'?: boolean;
}

/**
 * ARIA property attributes
 */
export interface AriaPropertyAttributes {
  'aria-activedescendant'?: string;
  'aria-atomic'?: boolean;
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
  'aria-controls'?: string;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-describedby'?: string;
  'aria-details'?: string;
  'aria-errormessage'?: string;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-keyshortcuts'?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-live'?: AriaLivePoliteness;
  'aria-modal'?: boolean;
  'aria-multiline'?: boolean;
  'aria-multiselectable'?: boolean;
  'aria-orientation'?: 'horizontal' | 'vertical';
  'aria-owns'?: string;
  'aria-placeholder'?: string;
  'aria-readonly'?: boolean;
  'aria-relevant'?: 'additions' | 'removals' | 'text' | 'all' | 'additions text';
  'aria-required'?: boolean;
  'aria-roledescription'?: string;
  'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
  'aria-valuemax'?: number;
  'aria-valuemin'?: number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
}

/**
 * Combined ARIA attributes
 */
export type AriaAttributes = AriaStateAttributes & AriaPropertyAttributes;

// ============================================================================
// Focus Management
// ============================================================================

/**
 * Focus trap configuration
 */
export interface FocusTrapConfig {
  /** Container element or ref */
  container: HTMLElement | RefObject<HTMLElement | null>;
  /** Initial focus element selector */
  initialFocus?: string | HTMLElement;
  /** Fallback focus element selector */
  fallbackFocus?: string | HTMLElement;
  /** Whether to return focus on deactivation */
  returnFocusOnDeactivate?: boolean;
  /** Allow focus to leave the trap */
  allowOutsideClick?: boolean;
  /** Escape key deactivates trap */
  escapeDeactivates?: boolean;
  /** Click outside deactivates trap */
  clickOutsideDeactivates?: boolean;
  /** Prevent scroll when trap is active */
  preventScroll?: boolean;
  /** Delay before activating (ms) */
  delayInitialFocus?: boolean | number;
  /** Custom tabbable element selector */
  tabbableOptions?: TabbableOptions;
}

/**
 * Options for determining tabbable elements
 */
export interface TabbableOptions {
  /** Include elements with negative tabindex */
  includeNegativeTabIndex?: boolean;
  /** Custom tabbable selector */
  selector?: string;
  /** Elements to exclude */
  exclude?: string[];
}

/**
 * Focus trap state
 */
export interface FocusTrapState {
  /** Whether the trap is active */
  active: boolean;
  /** Whether the trap is paused */
  paused: boolean;
  /** The container element */
  container: HTMLElement | null;
  /** Previously focused element (for restoration) */
  previouslyFocused: HTMLElement | null;
}

/**
 * Roving tabindex configuration
 */
export interface RovingTabIndexConfig {
  /** Container element or ref */
  container: RefObject<HTMLElement | null>;
  /** Selector for focusable items */
  itemSelector: string;
  /** Orientation for arrow key navigation */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** Wrap around at ends */
  wrap?: boolean;
  /** Index of initially focused item */
  initialIndex?: number;
  /** Callback when focused item changes */
  onFocusChange?: (index: number, element: HTMLElement) => void;
}

/**
 * Roving tabindex state
 */
export interface RovingTabIndexState {
  /** Currently focused index */
  currentIndex: number;
  /** Total number of items */
  itemCount: number;
  /** Update focused index */
  setCurrentIndex: (index: number) => void;
  /** Move to next item */
  next: () => void;
  /** Move to previous item */
  previous: () => void;
  /** Move to first item */
  first: () => void;
  /** Move to last item */
  last: () => void;
}

// ============================================================================
// Announcements
// ============================================================================

/**
 * Announcement message configuration
 */
export interface Announcement {
  /** Unique ID for the announcement */
  id: string;
  /** Message to announce */
  message: string;
  /** Politeness level */
  politeness: AriaLivePoliteness;
  /** Timeout before clearing (0 = no auto-clear) */
  timeout?: number;
  /** Timestamp when created */
  timestamp: number;
}

/**
 * Announcement queue state
 */
export interface AnnouncementQueueState {
  /** Queue of pending announcements */
  queue: Announcement[];
  /** Currently active announcement */
  current: Announcement | null;
  /** Add an announcement */
  announce: (message: string, politeness?: AriaLivePoliteness) => void;
  /** Clear all announcements */
  clear: () => void;
  /** Clear a specific announcement */
  dismiss: (id: string) => void;
}

// ============================================================================
// Accessibility Context
// ============================================================================

/**
 * Full accessibility context value
 */
export interface A11yContextValue {
  /** Current accessibility configuration */
  config: AccessibilityConfig;
  /** User preferences */
  preferences: A11yPreferences;
  /** Update preferences */
  setPreferences: (prefs: Partial<A11yPreferences>) => void;
  /** Announcement methods */
  announce: (message: string, politeness?: AriaLivePoliteness) => void;
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
  /** Focus management */
  focusMain: () => void;
  focusElement: (selector: string) => void;
  /** Keyboard shortcut registration */
  registerShortcut: (key: string, callback: () => void, description: string) => void;
  unregisterShortcut: (key: string) => void;
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  /** Key combination (e.g., 'Alt+1', 'Escape') */
  key: string;
  /** Callback function */
  callback: () => void;
  /** Human-readable description */
  description: string;
  /** Whether shortcut is enabled */
  enabled?: boolean;
  /** Prevent default behavior */
  preventDefault?: boolean;
  /** Stop propagation */
  stopPropagation?: boolean;
}

/**
 * Parsed keyboard event
 */
export interface ParsedKeyboardEvent {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

// ============================================================================
// Color Contrast
// ============================================================================

/**
 * Color contrast check result
 */
export interface ContrastCheckResult {
  /** Foreground color */
  foreground: string;
  /** Background color */
  background: string;
  /** Calculated contrast ratio */
  ratio: number;
  /** Passes WCAG AA for normal text (4.5:1) */
  passesAA: boolean;
  /** Passes WCAG AA for large text (3:1) */
  passesAALarge: boolean;
  /** Passes WCAG AAA for normal text (7:1) */
  passesAAA: boolean;
}

// ============================================================================
// Accessibility Audit
// ============================================================================

/**
 * Accessibility issue severity
 */
export type A11yIssueSeverity = 'error' | 'warning' | 'info';

/**
 * Accessibility audit issue
 */
export interface A11yAuditIssue {
  /** Issue ID */
  id: string;
  /** Severity level */
  severity: A11yIssueSeverity;
  /** WCAG criterion (e.g., '1.4.3') */
  criterion?: string;
  /** Issue description */
  message: string;
  /** Affected element */
  element?: HTMLElement;
  /** Element selector for debugging */
  selector?: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Accessibility audit result
 */
export interface A11yAuditResult {
  /** Total issues found */
  totalIssues: number;
  /** Errors (must fix) */
  errors: A11yAuditIssue[];
  /** Warnings (should fix) */
  warnings: A11yAuditIssue[];
  /** Info (nice to fix) */
  info: A11yAuditIssue[];
  /** Whether audit passed (no errors) */
  passed: boolean;
  /** Timestamp of audit */
  timestamp: number;
}
