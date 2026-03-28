/**
 * Screen Reader Announcements
 * 
 * ARIA live region utilities for announcing dynamic content changes
 * to screen reader users.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Announcement, AriaLivePoliteness, AnnouncementQueueState } from './types';

// ============================================================================
// Announcement Manager
// ============================================================================

/**
 * Global announcement queue manager
 */
class AnnouncementManager {
  private static instance: AnnouncementManager | null = null;
  private listeners: Set<(queue: Announcement[]) => void> = new Set();
  private queue: Announcement[] = [];
  private timeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private idCounter = 0;
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): AnnouncementManager {
    if (!AnnouncementManager.instance) {
      AnnouncementManager.instance = new AnnouncementManager();
    }
    return AnnouncementManager.instance;
  }
  
  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `announcement-${++this.idCounter}-${Date.now()}`;
  }
  
  /**
   * Add an announcement to the queue
   */
  announce(
    message: string,
    politeness: AriaLivePoliteness = 'polite',
    timeout = 5000
  ): string {
    const id = this.generateId();
    
    const announcement: Announcement = {
      id,
      message,
      politeness,
      timeout,
      timestamp: Date.now(),
    };
    
    // For assertive messages, clear existing assertive announcements
    if (politeness === 'assertive') {
      this.queue = this.queue.filter((a) => a.politeness !== 'assertive');
    }
    
    this.queue = [...this.queue, announcement];
    this.notifyListeners();
    
    // Auto-clear after timeout
    if (timeout > 0) {
      const timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, timeout);
      this.timeouts.set(id, timeoutId);
    }
    
    return id;
  }
  
  /**
   * Announce politely (doesn't interrupt)
   */
  announcePolite(message: string, timeout?: number): string {
    return this.announce(message, 'polite', timeout);
  }
  
  /**
   * Announce assertively (interrupts current speech)
   */
  announceAssertive(message: string, timeout?: number): string {
    return this.announce(message, 'assertive', timeout);
  }
  
  /**
   * Dismiss a specific announcement
   */
  dismiss(id: string): void {
    // Clear any pending timeout
    const timeoutId = this.timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(id);
    }
    
    this.queue = this.queue.filter((a) => a.id !== id);
    this.notifyListeners();
  }
  
  /**
   * Clear all announcements
   */
  clear(): void {
    // Clear all timeouts
    this.timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.timeouts.clear();
    
    this.queue = [];
    this.notifyListeners();
  }
  
  /**
   * Get current queue
   */
  getQueue(): Announcement[] {
    return [...this.queue];
  }
  
  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (queue: Announcement[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners of queue change
   */
  private notifyListeners(): void {
    const queue = this.getQueue();
    this.listeners.forEach((listener) => listener(queue));
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get the announcement manager instance
 */
export function getAnnouncementManager(): AnnouncementManager {
  return AnnouncementManager.getInstance();
}

/**
 * Announce a message to screen readers
 */
export function announce(
  message: string,
  politeness: AriaLivePoliteness = 'polite',
  timeout?: number
): string {
  return getAnnouncementManager().announce(message, politeness, timeout);
}

/**
 * Announce politely (doesn't interrupt current speech)
 */
export function announcePolite(message: string, timeout?: number): string {
  return getAnnouncementManager().announcePolite(message, timeout);
}

/**
 * Announce assertively (interrupts current speech)
 */
export function announceAssertive(message: string, timeout?: number): string {
  return getAnnouncementManager().announceAssertive(message, timeout);
}

/**
 * Dismiss a specific announcement
 */
export function dismissAnnouncement(id: string): void {
  getAnnouncementManager().dismiss(id);
}

/**
 * Clear all announcements
 */
export function clearAnnouncements(): void {
  getAnnouncementManager().clear();
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook to access the announcement queue
 */
export function useAnnouncementQueue(): AnnouncementQueueState {
  const [queue, setQueue] = useState<Announcement[]>([]);
  const manager = useRef(getAnnouncementManager());
  
  useEffect(() => {
    const unsubscribe = manager.current.subscribe(setQueue);
    return unsubscribe;
  }, []);
  
  const announceCallback = useCallback(
    (message: string, politeness?: AriaLivePoliteness) => {
      manager.current.announce(message, politeness);
    },
    []
  );
  
  const clearCallback = useCallback(() => {
    manager.current.clear();
  }, []);
  
  const dismissCallback = useCallback((id: string) => {
    manager.current.dismiss(id);
  }, []);
  
  return {
    queue,
    current: queue[0] || null,
    announce: announceCallback,
    clear: clearCallback,
    dismiss: dismissCallback,
  };
}

/**
 * Hook for simple announcements
 */
export function useAnnounce(): {
  announce: (message: string, politeness?: AriaLivePoliteness) => void;
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
} {
  const announceCallback = useCallback(
    (message: string, politeness: AriaLivePoliteness = 'polite') => {
      announce(message, politeness);
    },
    []
  );
  
  const announcePoliteCallback = useCallback((message: string) => {
    announcePolite(message);
  }, []);
  
  const announceAssertiveCallback = useCallback((message: string) => {
    announceAssertive(message);
  }, []);
  
  return {
    announce: announceCallback,
    announcePolite: announcePoliteCallback,
    announceAssertive: announceAssertiveCallback,
  };
}

/**
 * Hook to announce on value change
 */
export function useAnnounceOnChange<T>(
  value: T,
  getMessage: (value: T, prevValue: T | undefined) => string | null,
  options: {
    politeness?: AriaLivePoliteness;
    skipInitial?: boolean;
  } = {}
): void {
  const { politeness = 'polite', skipInitial = true } = options;
  const prevValueRef = useRef<T | undefined>(undefined);
  const isInitialRef = useRef(true);
  
  useEffect(() => {
    if (isInitialRef.current) {
      isInitialRef.current = false;
      if (skipInitial) {
        prevValueRef.current = value;
        return;
      }
    }
    
    const message = getMessage(value, prevValueRef.current);
    if (message) {
      announce(message, politeness);
    }
    
    prevValueRef.current = value;
  }, [value, getMessage, politeness, skipInitial]);
}

/**
 * Hook to announce loading states
 */
export function useAnnounceLoading(
  loading: boolean,
  options: {
    loadingMessage?: string;
    loadedMessage?: string;
    politeness?: AriaLivePoliteness;
  } = {}
): void {
  const {
    loadingMessage = 'Loading...',
    loadedMessage = 'Content loaded',
    politeness = 'polite',
  } = options;
  
  const prevLoadingRef = useRef<boolean | undefined>(undefined);
  
  useEffect(() => {
    // Skip initial state
    if (prevLoadingRef.current === undefined) {
      prevLoadingRef.current = loading;
      return;
    }
    
    if (loading && !prevLoadingRef.current) {
      announce(loadingMessage, politeness);
    } else if (!loading && prevLoadingRef.current) {
      announce(loadedMessage, politeness);
    }
    
    prevLoadingRef.current = loading;
  }, [loading, loadingMessage, loadedMessage, politeness]);
}

/**
 * Hook to announce form validation errors
 */
export function useAnnounceErrors(
  errors: Record<string, string | undefined> | string[],
  options: {
    politeness?: AriaLivePoliteness;
    debounceMs?: number;
  } = {}
): void {
  const { politeness = 'assertive', debounceMs = 500 } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    // Clear pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      let errorMessages: string[];
      
      if (Array.isArray(errors)) {
        errorMessages = errors.filter(Boolean);
      } else {
        errorMessages = Object.values(errors).filter((e): e is string => Boolean(e));
      }
      
      if (errorMessages.length > 0) {
        const message =
          errorMessages.length === 1
            ? `Error: ${errorMessages[0]}`
            : `${errorMessages.length} errors: ${errorMessages.join('. ')}`;
        announce(message, politeness);
      }
    }, debounceMs);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [errors, politeness, debounceMs]);
}

/**
 * Hook to announce route changes
 */
export function useAnnounceRoute(
  pathname: string,
  options: {
    getPageTitle?: (pathname: string) => string;
    politeness?: AriaLivePoliteness;
  } = {}
): void {
  const {
    getPageTitle = (path) => {
      // Default: Extract last segment and format
      const segment = path.split('/').filter(Boolean).pop() || 'Home';
      return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    },
    politeness = 'polite',
  } = options;
  
  const prevPathnameRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    // Skip initial
    if (prevPathnameRef.current === undefined) {
      prevPathnameRef.current = pathname;
      return;
    }
    
    if (pathname !== prevPathnameRef.current) {
      const pageTitle = getPageTitle(pathname);
      announce(`Navigated to ${pageTitle}`, politeness);
    }
    
    prevPathnameRef.current = pathname;
  }, [pathname, getPageTitle, politeness]);
}
