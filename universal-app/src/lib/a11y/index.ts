/**
 * Accessibility Utilities Index
 * 
 * WCAG AA compliant utilities for building accessible interfaces.
 */

// Types
export * from './types';

// Focus management
export {
  // Classes
  FocusTrap,
  // Functions
  createFocusTrap,
  getTabbableElements,
  getFirstTabbable,
  getLastTabbable,
  isTabbable,
  isFocusable,
  attemptFocus,
  saveFocus,
  restoreFocus,
  // Hooks
  useFocusTrap,
  useRovingTabIndex,
  useFocusRestore,
  useFocusOnMount,
} from './focus-trap';

// Announcements
export {
  // Manager
  getAnnouncementManager,
  // Functions
  announce,
  announcePolite,
  announceAssertive,
  dismissAnnouncement,
  clearAnnouncements,
  // Hooks
  useAnnouncementQueue,
  useAnnounce,
  useAnnounceOnChange,
  useAnnounceLoading,
  useAnnounceErrors,
  useAnnounceRoute,
} from './announcer';

// Audit
export {
  // Functions
  getContrastRatio,
  checkColorContrast,
  runA11yAudit,
  logA11yAudit,
  auditAndLog,
  // Hooks
  useA11yAudit,
} from './audit';
