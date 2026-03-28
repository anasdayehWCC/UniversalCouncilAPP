'use client';

/**
 * A11yProvider
 * 
 * Accessibility context provider for managing user preferences,
 * screen reader announcements, and keyboard shortcuts globally.
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type {
  AccessibilityConfig,
  A11yPreferences,
  A11yContextValue,
  AriaLivePoliteness,
  KeyboardShortcut,
} from '@/lib/a11y/types';
import { DEFAULT_A11Y_CONFIG, DEFAULT_A11Y_PREFERENCES } from '@/lib/a11y/types';
import { announce, clearAnnouncements } from '@/lib/a11y/announcer';
import { attemptFocus } from '@/lib/a11y/focus-trap';
import { GlobalAnnouncer } from '@/components/a11y/LiveRegion';
import { SkipLinks } from '@/components/a11y/SkipLinks';

// ============================================================================
// Context
// ============================================================================

const A11yContext = createContext<A11yContextValue | undefined>(undefined);

// ============================================================================
// Storage
// ============================================================================

const PREFERENCES_STORAGE_KEY = 'universal-app-a11y-preferences';

function loadStoredPreferences(): Partial<A11yPreferences> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  
  return {};
}

function persistPreferences(preferences: A11yPreferences): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// Provider Component
// ============================================================================

export interface A11yProviderProps {
  children: ReactNode;
  /** Override default configuration */
  config?: Partial<AccessibilityConfig>;
  /** Override default preferences */
  defaultPreferences?: Partial<A11yPreferences>;
  /** Include skip links */
  includeSkipLinks?: boolean;
  /** Include global announcer */
  includeAnnouncer?: boolean;
  /** Debug mode (shows announcements visually) */
  debug?: boolean;
}

/**
 * A11yProvider Component
 * 
 * Provides accessibility context to the entire application.
 * Manages user preferences, keyboard shortcuts, and announcements.
 * 
 * @example
 * ```tsx
 * // In your root layout
 * <A11yProvider>
 *   <App />
 * </A11yProvider>
 * 
 * // With custom configuration
 * <A11yProvider
 *   config={{ minContrastRatio: 7 }}
 *   defaultPreferences={{ fontSize: 1.25 }}
 *   includeSkipLinks
 *   includeAnnouncer
 * >
 *   <App />
 * </A11yProvider>
 * ```
 */
export function A11yProvider({
  children,
  config: configOverride,
  defaultPreferences,
  includeSkipLinks = true,
  includeAnnouncer = true,
  debug = false,
}: A11yProviderProps) {
  // Configuration
  const config = useMemo<AccessibilityConfig>(
    () => ({ ...DEFAULT_A11Y_CONFIG, ...configOverride }),
    [configOverride]
  );
  
  // Preferences state
  const [preferences, setPreferencesState] = useState<A11yPreferences>(() => ({
    ...DEFAULT_A11Y_PREFERENCES,
    ...defaultPreferences,
    ...loadStoredPreferences(),
  }));
  
  // Keyboard shortcuts registry
  const [shortcuts, setShortcuts] = useState<Map<string, KeyboardShortcut>>(
    new Map()
  );
  
  // Detect system preferences on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check reduced motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: more)');
    
    const updateSystemPreferences = () => {
      setPreferencesState((prev) => ({
        ...prev,
        reducedMotion: prev.reducedMotion || reducedMotionQuery.matches,
        highContrast: prev.highContrast || highContrastQuery.matches,
      }));
    };
    
    updateSystemPreferences();
    
    reducedMotionQuery.addEventListener('change', updateSystemPreferences);
    highContrastQuery.addEventListener('change', updateSystemPreferences);
    
    return () => {
      reducedMotionQuery.removeEventListener('change', updateSystemPreferences);
      highContrastQuery.removeEventListener('change', updateSystemPreferences);
    };
  }, []);
  
  // Persist preferences when they change
  useEffect(() => {
    persistPreferences(preferences);
  }, [preferences]);
  
  // Apply preferences to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Font size
    root.style.setProperty('--a11y-font-scale', String(preferences.fontSize));
    root.style.fontSize = `${preferences.fontSize * 100}%`;
    
    // CSS classes for preferences
    root.classList.toggle('reduce-motion', preferences.reducedMotion);
    root.classList.toggle('high-contrast', preferences.highContrast);
    root.classList.toggle('increased-spacing', preferences.increasedSpacing);
    root.classList.toggle('dyslexia-font', preferences.dyslexiaFont);
    root.classList.toggle('reduce-transparency', preferences.reduceTransparency);
    root.classList.toggle('focus-outlines', preferences.showFocusOutlines);
    
    // Data attributes for CSS selectors
    root.dataset.reducedMotion = String(preferences.reducedMotion);
    root.dataset.highContrast = String(preferences.highContrast);
    
  }, [preferences]);
  
  // Set preferences
  const setPreferences = useCallback((newPrefs: Partial<A11yPreferences>) => {
    setPreferencesState((prev) => ({ ...prev, ...newPrefs }));
  }, []);
  
  // Announcement methods
  const announceMessage = useCallback(
    (message: string, politeness?: AriaLivePoliteness) => {
      if (!config.announcements) return;
      announce(message, politeness || config.defaultPoliteness, config.announcementTimeout);
    },
    [config]
  );
  
  const announcePolite = useCallback(
    (message: string) => announceMessage(message, 'polite'),
    [announceMessage]
  );
  
  const announceAssertive = useCallback(
    (message: string) => announceMessage(message, 'assertive'),
    [announceMessage]
  );
  
  // Focus methods
  const focusMain = useCallback(() => {
    attemptFocus(`#${config.skipLinkTarget}, main, [role="main"]`);
  }, [config.skipLinkTarget]);
  
  const focusElement = useCallback((selector: string) => {
    attemptFocus(selector);
  }, []);
  
  // Keyboard shortcut methods
  const registerShortcut = useCallback(
    (key: string, callback: () => void, description: string) => {
      setShortcuts((prev) => {
        const next = new Map(prev);
        next.set(key, { key, callback, description, enabled: true });
        return next;
      });
    },
    []
  );
  
  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!config.keyboardShortcuts) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Build key string
      const parts: string[] = [];
      if (event.altKey) parts.push('Alt');
      if (event.ctrlKey) parts.push('Ctrl');
      if (event.metaKey) parts.push('Meta');
      if (event.shiftKey) parts.push('Shift');
      parts.push(event.key);
      
      const key = parts.join('+');
      const shortcut = shortcuts.get(key);
      
      if (shortcut && shortcut.enabled) {
        event.preventDefault();
        shortcut.callback();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, config.keyboardShortcuts]);
  
  // Default shortcuts
  useEffect(() => {
    // Alt+1: Focus main content
    registerShortcut('Alt+1', focusMain, 'Focus main content');
    
    // Alt+2: Focus navigation
    registerShortcut(
      'Alt+2',
      () => focusElement('nav, [role="navigation"]'),
      'Focus navigation'
    );
    
    return () => {
      unregisterShortcut('Alt+1');
      unregisterShortcut('Alt+2');
    };
  }, [registerShortcut, unregisterShortcut, focusMain, focusElement]);
  
  // Context value
  const contextValue = useMemo<A11yContextValue>(
    () => ({
      config,
      preferences,
      setPreferences,
      announce: announceMessage,
      announcePolite,
      announceAssertive,
      focusMain,
      focusElement,
      registerShortcut,
      unregisterShortcut,
    }),
    [
      config,
      preferences,
      setPreferences,
      announceMessage,
      announcePolite,
      announceAssertive,
      focusMain,
      focusElement,
      registerShortcut,
      unregisterShortcut,
    ]
  );
  
  // Cleanup announcements on unmount
  useEffect(() => {
    return () => {
      clearAnnouncements();
    };
  }, []);
  
  return (
    <A11yContext.Provider value={contextValue}>
      {includeSkipLinks && <SkipLinks />}
      {children}
      {includeAnnouncer && <GlobalAnnouncer debug={debug} />}
    </A11yContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access accessibility context
 */
export function useA11y(): A11yContextValue {
  const context = useContext(A11yContext);
  
  if (!context) {
    throw new Error('useA11y must be used within an A11yProvider');
  }
  
  return context;
}

/**
 * Hook to access accessibility preferences only
 */
export function useA11yPreferences(): {
  preferences: A11yPreferences;
  setPreferences: (prefs: Partial<A11yPreferences>) => void;
} {
  const { preferences, setPreferences } = useA11y();
  return { preferences, setPreferences };
}

/**
 * Hook to access announcement functions only
 */
export function useA11yAnnounce(): {
  announce: (message: string, politeness?: AriaLivePoliteness) => void;
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
} {
  const { announce, announcePolite, announceAssertive } = useA11y();
  return { announce, announcePolite, announceAssertive };
}

/**
 * Hook to access focus utilities only
 */
export function useA11yFocus(): {
  focusMain: () => void;
  focusElement: (selector: string) => void;
} {
  const { focusMain, focusElement } = useA11y();
  return { focusMain, focusElement };
}

/**
 * Hook to register keyboard shortcuts
 */
export function useA11yShortcuts(): {
  register: (key: string, callback: () => void, description: string) => void;
  unregister: (key: string) => void;
} {
  const { registerShortcut, unregisterShortcut } = useA11y();
  return { register: registerShortcut, unregister: unregisterShortcut };
}

export default A11yProvider;
