'use client';

/**
 * useAccessibility Hook
 * 
 * Comprehensive accessibility hook providing focus management,
 * keyboard navigation, screen reader preferences, and high contrast mode.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  A11yPreferences,
  KeyboardShortcut,
  ParsedKeyboardEvent,
} from '@/lib/a11y/types';
import { DEFAULT_A11Y_PREFERENCES } from '@/lib/a11y/types';
import { announce } from '@/lib/a11y/announcer';
import { getTabbableElements, attemptFocus } from '@/lib/a11y/focus-trap';

// ============================================================================
// Media Query Hooks
// ============================================================================

/**
 * Hook to detect prefers-reduced-motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
}

/**
 * Hook to detect prefers-contrast
 */
export function usePrefersHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: more)').matches;
  });
  
  useEffect(() => {
    const mql = window.matchMedia('(prefers-contrast: more)');
    const handler = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };
    
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  
  return prefersHighContrast;
}

/**
 * Hook to detect prefers-color-scheme
 */
export function usePrefersColorScheme(): 'light' | 'dark' {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => {
      setColorScheme(event.matches ? 'dark' : 'light');
    };
    
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  
  return colorScheme;
}

// ============================================================================
// Keyboard Navigation Hooks
// ============================================================================

/**
 * Parse keyboard event into standardized format
 */
function parseKeyboardEvent(event: KeyboardEvent): ParsedKeyboardEvent {
  return {
    key: event.key,
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
  };
}

/**
 * Parse shortcut string into components
 */
function parseShortcutString(shortcut: string): ParsedKeyboardEvent {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts.pop() || '';
  
  return {
    key: key === 'space' ? ' ' : key,
    altKey: parts.includes('alt'),
    ctrlKey: parts.includes('ctrl'),
    metaKey: parts.includes('meta') || parts.includes('cmd'),
    shiftKey: parts.includes('shift'),
  };
}

/**
 * Check if keyboard event matches shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const eventParsed = parseKeyboardEvent(event);
  const shortcutParsed = parseShortcutString(shortcut);
  
  return (
    eventParsed.key.toLowerCase() === shortcutParsed.key.toLowerCase() &&
    eventParsed.altKey === shortcutParsed.altKey &&
    eventParsed.ctrlKey === shortcutParsed.ctrlKey &&
    eventParsed.metaKey === shortcutParsed.metaKey &&
    eventParsed.shiftKey === shortcutParsed.shiftKey
  );
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: {
    enabled?: boolean;
    target?: HTMLElement | null;
  } = {}
): void {
  const { enabled = true, target = null } = options;
  
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;
        
        if (matchesShortcut(event, shortcut.key)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          if (shortcut.stopPropagation) {
            event.stopPropagation();
          }
          shortcut.callback();
          break;
        }
      }
    };
    
    const targetElement = target || document;
    targetElement.addEventListener('keydown', handleKeyDown as EventListener);
    
    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [shortcuts, enabled, target]);
}

/**
 * Hook for single keyboard shortcut
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: {
    enabled?: boolean;
    preventDefault?: boolean;
    description?: string;
  } = {}
): void {
  const { enabled = true, preventDefault = true, description = '' } = options;
  
  useKeyboardShortcuts(
    [
      {
        key,
        callback,
        description,
        enabled,
        preventDefault,
      },
    ],
    { enabled }
  );
}

/**
 * Hook for escape key handler
 */
export function useEscapeKey(
  callback: () => void,
  options: { enabled?: boolean } = {}
): void {
  useKeyboardShortcut('Escape', callback, options);
}

// ============================================================================
// Focus Management Hooks
// ============================================================================

/**
 * Hook for managing focus within a container
 */
export function useFocusManagement(containerRef: React.RefObject<HTMLElement | null>): {
  focusFirst: () => void;
  focusLast: () => void;
  focusNext: () => void;
  focusPrevious: () => void;
  focusByIndex: (index: number) => void;
  getCurrentIndex: () => number;
  getTabbables: () => HTMLElement[];
} {
  const getTabbables = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return getTabbableElements(containerRef.current);
  }, [containerRef]);
  
  const getCurrentIndex = useCallback((): number => {
    const tabbables = getTabbables();
    const activeElement = document.activeElement;
    return tabbables.indexOf(activeElement as HTMLElement);
  }, [getTabbables]);
  
  const focusByIndex = useCallback(
    (index: number) => {
      const tabbables = getTabbables();
      if (index >= 0 && index < tabbables.length) {
        tabbables[index].focus();
      }
    },
    [getTabbables]
  );
  
  const focusFirst = useCallback(() => focusByIndex(0), [focusByIndex]);
  
  const focusLast = useCallback(() => {
    const tabbables = getTabbables();
    focusByIndex(tabbables.length - 1);
  }, [getTabbables, focusByIndex]);
  
  const focusNext = useCallback(() => {
    const tabbables = getTabbables();
    const currentIndex = getCurrentIndex();
    const nextIndex = currentIndex + 1 >= tabbables.length ? 0 : currentIndex + 1;
    focusByIndex(nextIndex);
  }, [getTabbables, getCurrentIndex, focusByIndex]);
  
  const focusPrevious = useCallback(() => {
    const tabbables = getTabbables();
    const currentIndex = getCurrentIndex();
    const prevIndex = currentIndex - 1 < 0 ? tabbables.length - 1 : currentIndex - 1;
    focusByIndex(prevIndex);
  }, [getTabbables, getCurrentIndex, focusByIndex]);
  
  return {
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    focusByIndex,
    getCurrentIndex,
    getTabbables,
  };
}

/**
 * Hook to focus element on mount
 */
export function useFocusOnMount(
  ref: React.RefObject<HTMLElement | null>,
  options: {
    enabled?: boolean;
    delay?: number;
    select?: boolean;
  } = {}
): void {
  const { enabled = true, delay = 0, select = false } = options;
  
  useEffect(() => {
    if (!enabled || !ref.current) return;
    
    const focus = () => {
      if (ref.current) {
        ref.current.focus();
        
        // Select text if input/textarea
        if (select && 'select' in ref.current) {
          (ref.current as HTMLInputElement).select();
        }
      }
    };
    
    if (delay > 0) {
      const timeoutId = setTimeout(focus, delay);
      return () => clearTimeout(timeoutId);
    } else {
      requestAnimationFrame(focus);
    }
  }, [enabled, delay, select, ref]);
}

/**
 * Hook to track focus visible state
 */
export function useFocusVisible(): {
  isFocusVisible: boolean;
  focusProps: {
    onFocus: () => void;
    onBlur: () => void;
    onKeyDown: () => void;
    onMouseDown: () => void;
  };
} {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const hadKeyboardEvent = useRef(false);
  
  const focusProps = {
    onFocus: () => {
      if (hadKeyboardEvent.current) {
        setIsFocusVisible(true);
      }
    },
    onBlur: () => {
      setIsFocusVisible(false);
    },
    onKeyDown: () => {
      hadKeyboardEvent.current = true;
    },
    onMouseDown: () => {
      hadKeyboardEvent.current = false;
    },
  };
  
  return { isFocusVisible, focusProps };
}

// ============================================================================
// Accessibility Preferences Hook
// ============================================================================

const STORAGE_KEY = 'a11y-preferences';

/**
 * Load preferences from localStorage
 */
function loadPreferences(): A11yPreferences {
  if (typeof window === 'undefined') return DEFAULT_A11Y_PREFERENCES;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_A11Y_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  
  return DEFAULT_A11Y_PREFERENCES;
}

/**
 * Save preferences to localStorage
 */
function savePreferences(preferences: Partial<A11yPreferences>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const current = loadPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook for managing accessibility preferences
 */
export function useAccessibilityPreferences(): {
  preferences: A11yPreferences;
  setPreferences: (prefs: Partial<A11yPreferences>) => void;
  resetPreferences: () => void;
  systemReducedMotion: boolean;
  systemHighContrast: boolean;
} {
  const systemReducedMotion = usePrefersReducedMotion();
  const systemHighContrast = usePrefersHighContrast();
  
  const [preferences, setPreferencesState] = useState<A11yPreferences>(() => {
    const stored = loadPreferences();
    return {
      ...stored,
      // Override with system preferences if user hasn't set explicit values
      reducedMotion: stored.reducedMotion || systemReducedMotion,
      highContrast: stored.highContrast || systemHighContrast,
    };
  });
  
  // Update when system preferences change
  useEffect(() => {
    setPreferencesState((prev) => ({
      ...prev,
      reducedMotion: prev.reducedMotion || systemReducedMotion,
      highContrast: prev.highContrast || systemHighContrast,
    }));
  }, [systemReducedMotion, systemHighContrast]);
  
  const setPreferences = useCallback((newPrefs: Partial<A11yPreferences>) => {
    setPreferencesState((prev) => {
      const updated = { ...prev, ...newPrefs };
      savePreferences(updated);
      return updated;
    });
  }, []);
  
  const resetPreferences = useCallback(() => {
    setPreferencesState(DEFAULT_A11Y_PREFERENCES);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);
  
  return {
    preferences,
    setPreferences,
    resetPreferences,
    systemReducedMotion,
    systemHighContrast,
  };
}

// ============================================================================
// Main useAccessibility Hook
// ============================================================================

/**
 * Comprehensive accessibility hook
 */
export function useAccessibility(): {
  // Preferences
  preferences: A11yPreferences;
  setPreferences: (prefs: Partial<A11yPreferences>) => void;
  resetPreferences: () => void;
  
  // System queries
  systemReducedMotion: boolean;
  systemHighContrast: boolean;
  colorScheme: 'light' | 'dark';
  
  // Announcements
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
  
  // Focus utilities
  focusMain: () => void;
  focusElement: (selector: string) => void;
  
  // CSS class helpers
  getMotionClass: (withMotion: string, reduced?: string) => string;
  getContrastClass: (normal: string, highContrast: string) => string;
} {
  const {
    preferences,
    setPreferences,
    resetPreferences,
    systemReducedMotion,
    systemHighContrast,
  } = useAccessibilityPreferences();
  
  const colorScheme = usePrefersColorScheme();
  
  // Announcement helpers
  const announcePolite = useCallback((message: string) => {
    announce(message, 'polite');
  }, []);
  
  const announceAssertive = useCallback((message: string) => {
    announce(message, 'assertive');
  }, []);
  
  // Focus helpers
  const focusMain = useCallback(() => {
    attemptFocus('#main-content, main, [role="main"]');
  }, []);
  
  const focusElement = useCallback((selector: string) => {
    attemptFocus(selector);
  }, []);
  
  // CSS class helpers
  const getMotionClass = useCallback(
    (withMotion: string, reduced = '') => {
      return preferences.reducedMotion ? reduced : withMotion;
    },
    [preferences.reducedMotion]
  );
  
  const getContrastClass = useCallback(
    (normal: string, highContrast: string) => {
      return preferences.highContrast ? highContrast : normal;
    },
    [preferences.highContrast]
  );
  
  return {
    preferences,
    setPreferences,
    resetPreferences,
    systemReducedMotion,
    systemHighContrast,
    colorScheme,
    announce,
    announcePolite,
    announceAssertive,
    focusMain,
    focusElement,
    getMotionClass,
    getContrastClass,
  };
}

export default useAccessibility;
