/**
 * Focus Trap Utilities
 * 
 * Manages focus containment for modals, dialogs, and other overlay components.
 * Ensures keyboard users can't tab outside of active modal content.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  FocusTrapConfig,
  FocusTrapState,
  RovingTabIndexConfig,
  RovingTabIndexState,
  TabbableOptions,
} from './types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default selector for focusable elements
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Selector for tabbable elements (excluding negative tabindex by default)
 */
const TABBABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'area[href]:not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'iframe:not([tabindex="-1"])',
  '[contenteditable]:not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all tabbable elements within a container
 */
export function getTabbableElements(
  container: HTMLElement,
  options: TabbableOptions = {}
): HTMLElement[] {
  const { includeNegativeTabIndex = false, selector, exclude = [] } = options;
  
  const baseSelector = selector || (includeNegativeTabIndex ? FOCUSABLE_SELECTOR : TABBABLE_SELECTOR);
  const elements = Array.from(container.querySelectorAll<HTMLElement>(baseSelector));
  
  // Filter out hidden and excluded elements
  return elements.filter((el) => {
    // Check if element is visible
    if (el.offsetParent === null && el.tagName !== 'BODY') return false;
    
    // Check if element matches any exclude selector
    if (exclude.some((excludeSelector) => el.matches(excludeSelector))) return false;
    
    // Check computed visibility
    const styles = window.getComputedStyle(el);
    if (styles.visibility === 'hidden' || styles.display === 'none') return false;
    
    return true;
  });
}

/**
 * Get the first tabbable element in a container
 */
export function getFirstTabbable(
  container: HTMLElement,
  options?: TabbableOptions
): HTMLElement | null {
  const elements = getTabbableElements(container, options);
  return elements[0] || null;
}

/**
 * Get the last tabbable element in a container
 */
export function getLastTabbable(
  container: HTMLElement,
  options?: TabbableOptions
): HTMLElement | null {
  const elements = getTabbableElements(container, options);
  return elements[elements.length - 1] || null;
}

/**
 * Check if an element is tabbable
 */
export function isTabbable(element: HTMLElement): boolean {
  return element.matches(TABBABLE_SELECTOR);
}

/**
 * Check if an element is focusable (even with negative tabindex)
 */
export function isFocusable(element: HTMLElement): boolean {
  return element.matches(FOCUSABLE_SELECTOR);
}

/**
 * Attempt to focus an element with fallback
 */
export function attemptFocus(
  target: string | HTMLElement | null | undefined,
  container?: HTMLElement
): boolean {
  if (!target) return false;
  
  let element: HTMLElement | null = null;
  
  if (typeof target === 'string') {
    element = container
      ? container.querySelector<HTMLElement>(target)
      : document.querySelector<HTMLElement>(target);
  } else {
    element = target;
  }
  
  if (element && isFocusable(element)) {
    element.focus({ preventScroll: false });
    return document.activeElement === element;
  }
  
  return false;
}

/**
 * Save current focus for later restoration
 */
export function saveFocus(): HTMLElement | null {
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    return activeElement;
  }
  return null;
}

/**
 * Restore focus to a previously saved element
 */
export function restoreFocus(
  element: HTMLElement | null,
  options: { preventScroll?: boolean } = {}
): boolean {
  if (!element) return false;
  
  try {
    element.focus({ preventScroll: options.preventScroll });
    return document.activeElement === element;
  } catch {
    return false;
  }
}

// ============================================================================
// Focus Trap Class
// ============================================================================

/**
 * Focus trap manager class
 */
export class FocusTrap {
  private config: FocusTrapConfig;
  private container: HTMLElement | null = null;
  private previouslyFocused: HTMLElement | null = null;
  private active = false;
  private paused = false;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleFocusIn: (e: FocusEvent) => void;
  
  constructor(config: FocusTrapConfig) {
    this.config = {
      returnFocusOnDeactivate: true,
      allowOutsideClick: false,
      escapeDeactivates: true,
      clickOutsideDeactivates: false,
      preventScroll: false,
      delayInitialFocus: false,
      ...config,
    };
    
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleFocusIn = this.handleFocusIn.bind(this);
  }
  
  /**
   * Get the container element
   */
  private getContainer(): HTMLElement | null {
    const { container } = this.config;
    if (container instanceof HTMLElement) {
      return container;
    }
    if (container && 'current' in container) {
      return container.current;
    }
    return null;
  }
  
  /**
   * Activate the focus trap
   */
  activate(): void {
    if (this.active) return;
    
    this.container = this.getContainer();
    if (!this.container) {
      console.warn('[FocusTrap] Container not found, cannot activate');
      return;
    }
    
    this.previouslyFocused = saveFocus();
    this.active = true;
    
    // Add event listeners
    document.addEventListener('keydown', this.boundHandleKeyDown, true);
    document.addEventListener('focusin', this.boundHandleFocusIn, true);
    
    // Set initial focus
    const { delayInitialFocus } = this.config;
    const delay = typeof delayInitialFocus === 'number' ? delayInitialFocus : 0;
    
    if (delayInitialFocus === false) {
      this.focusInitial();
    } else {
      setTimeout(() => this.focusInitial(), delay);
    }
  }
  
  /**
   * Deactivate the focus trap
   */
  deactivate(): void {
    if (!this.active) return;
    
    this.active = false;
    this.paused = false;
    
    // Remove event listeners
    document.removeEventListener('keydown', this.boundHandleKeyDown, true);
    document.removeEventListener('focusin', this.boundHandleFocusIn, true);
    
    // Restore focus
    if (this.config.returnFocusOnDeactivate && this.previouslyFocused) {
      restoreFocus(this.previouslyFocused, { preventScroll: this.config.preventScroll });
    }
    
    this.container = null;
    this.previouslyFocused = null;
  }
  
  /**
   * Pause the focus trap (allows focus outside temporarily)
   */
  pause(): void {
    this.paused = true;
  }
  
  /**
   * Unpause the focus trap
   */
  unpause(): void {
    this.paused = false;
  }
  
  /**
   * Get current state
   */
  getState(): FocusTrapState {
    return {
      active: this.active,
      paused: this.paused,
      container: this.container,
      previouslyFocused: this.previouslyFocused,
    };
  }
  
  /**
   * Focus the initial element
   */
  private focusInitial(): void {
    if (!this.container || !this.active) return;
    
    const { initialFocus, fallbackFocus } = this.config;
    
    // Try initial focus target
    if (attemptFocus(initialFocus, this.container)) return;
    
    // Try first tabbable element
    const firstTabbable = getFirstTabbable(this.container, this.config.tabbableOptions);
    if (firstTabbable && attemptFocus(firstTabbable)) return;
    
    // Try fallback focus
    if (attemptFocus(fallbackFocus, this.container)) return;
    
    // Focus container itself as last resort
    if (this.container.tabIndex < 0) {
      this.container.tabIndex = -1;
    }
    this.container.focus();
  }
  
  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.active || this.paused || !this.container) return;
    
    // Handle Escape
    if (event.key === 'Escape' && this.config.escapeDeactivates) {
      event.preventDefault();
      event.stopPropagation();
      this.deactivate();
      return;
    }
    
    // Handle Tab
    if (event.key === 'Tab') {
      this.handleTabKey(event);
    }
  }
  
  /**
   * Handle Tab key navigation
   */
  private handleTabKey(event: KeyboardEvent): void {
    if (!this.container) return;
    
    const tabbables = getTabbableElements(this.container, this.config.tabbableOptions);
    if (tabbables.length === 0) return;
    
    const firstTabbable = tabbables[0];
    const lastTabbable = tabbables[tabbables.length - 1];
    const activeElement = document.activeElement;
    
    if (event.shiftKey) {
      // Shift+Tab: moving backwards
      if (activeElement === firstTabbable || !this.container.contains(activeElement)) {
        event.preventDefault();
        lastTabbable.focus();
      }
    } else {
      // Tab: moving forwards
      if (activeElement === lastTabbable || !this.container.contains(activeElement)) {
        event.preventDefault();
        firstTabbable.focus();
      }
    }
  }
  
  /**
   * Handle focus moving in the document
   */
  private handleFocusIn(event: FocusEvent): void {
    if (!this.active || this.paused || !this.container) return;
    
    const target = event.target as HTMLElement;
    
    // If focus moved outside container, pull it back
    if (!this.container.contains(target)) {
      event.preventDefault();
      event.stopPropagation();
      
      const firstTabbable = getFirstTabbable(this.container, this.config.tabbableOptions);
      if (firstTabbable) {
        firstTabbable.focus();
      } else {
        this.container.focus();
      }
    }
  }
}

/**
 * Create a focus trap instance
 */
export function createFocusTrap(config: FocusTrapConfig): FocusTrap {
  return new FocusTrap(config);
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * React hook for focus trap management
 */
export function useFocusTrap(
  config: Omit<FocusTrapConfig, 'container'> & { enabled?: boolean }
): {
  containerRef: React.RefObject<HTMLDivElement | null>;
  state: FocusTrapState;
  activate: () => void;
  deactivate: () => void;
  pause: () => void;
  unpause: () => void;
} {
  const containerRef = useRef<HTMLDivElement>(null);
  const trapRef = useRef<FocusTrap | null>(null);
  const [state, setState] = useState<FocusTrapState>({
    active: false,
    paused: false,
    container: null,
    previouslyFocused: null,
  });
  
  const { enabled = true, ...restConfig } = config;
  
  // Initialize trap
  useEffect(() => {
    if (!containerRef.current) return;
    
    trapRef.current = new FocusTrap({
      ...restConfig,
      container: containerRef,
    });
    
    if (enabled) {
      trapRef.current.activate();
      setState(trapRef.current.getState());
    }
    
    return () => {
      trapRef.current?.deactivate();
      trapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  
  const activate = useCallback(() => {
    trapRef.current?.activate();
    if (trapRef.current) {
      setState(trapRef.current.getState());
    }
  }, []);
  
  const deactivate = useCallback(() => {
    trapRef.current?.deactivate();
    if (trapRef.current) {
      setState(trapRef.current.getState());
    }
  }, []);
  
  const pause = useCallback(() => {
    trapRef.current?.pause();
    if (trapRef.current) {
      setState(trapRef.current.getState());
    }
  }, []);
  
  const unpause = useCallback(() => {
    trapRef.current?.unpause();
    if (trapRef.current) {
      setState(trapRef.current.getState());
    }
  }, []);
  
  return {
    containerRef,
    state,
    activate,
    deactivate,
    pause,
    unpause,
  };
}

/**
 * React hook for roving tabindex pattern
 */
export function useRovingTabIndex(config: RovingTabIndexConfig): RovingTabIndexState {
  const { container, itemSelector, orientation = 'vertical', wrap = true, initialIndex = 0, onFocusChange } = config;
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [itemCount, setItemCount] = useState(0);
  
  // Get items
  const getItems = useCallback((): HTMLElement[] => {
    if (!container.current) return [];
    return Array.from(container.current.querySelectorAll<HTMLElement>(itemSelector));
  }, [container, itemSelector]);
  
  // Update item count
  useEffect(() => {
    const items = getItems();
    setItemCount(items.length);
    
    // Set initial tabindex values
    items.forEach((item, index) => {
      item.tabIndex = index === currentIndex ? 0 : -1;
    });
  }, [getItems, currentIndex]);
  
  // Focus item at index
  const focusItem = useCallback(
    (index: number) => {
      const items = getItems();
      if (index >= 0 && index < items.length) {
        items.forEach((item, i) => {
          item.tabIndex = i === index ? 0 : -1;
        });
        items[index].focus();
        setCurrentIndex(index);
        onFocusChange?.(index, items[index]);
      }
    },
    [getItems, onFocusChange]
  );
  
  // Navigation functions
  const next = useCallback(() => {
    const items = getItems();
    if (items.length === 0) return;
    
    let nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      nextIndex = wrap ? 0 : items.length - 1;
    }
    focusItem(nextIndex);
  }, [currentIndex, getItems, wrap, focusItem]);
  
  const previous = useCallback(() => {
    const items = getItems();
    if (items.length === 0) return;
    
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = wrap ? items.length - 1 : 0;
    }
    focusItem(prevIndex);
  }, [currentIndex, getItems, wrap, focusItem]);
  
  const first = useCallback(() => focusItem(0), [focusItem]);
  const last = useCallback(() => focusItem(getItems().length - 1), [focusItem, getItems]);
  
  // Key handler
  useEffect(() => {
    const containerEl = container.current;
    if (!containerEl) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;
      
      const isVertical = orientation === 'vertical' || orientation === 'both';
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';
      
      let handled = false;
      
      if ((key === 'ArrowDown' && isVertical) || (key === 'ArrowRight' && isHorizontal)) {
        next();
        handled = true;
      } else if ((key === 'ArrowUp' && isVertical) || (key === 'ArrowLeft' && isHorizontal)) {
        previous();
        handled = true;
      } else if (key === 'Home') {
        first();
        handled = true;
      } else if (key === 'End') {
        last();
        handled = true;
      }
      
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    
    containerEl.addEventListener('keydown', handleKeyDown);
    return () => containerEl.removeEventListener('keydown', handleKeyDown);
  }, [container, orientation, next, previous, first, last]);
  
  return {
    currentIndex,
    itemCount,
    setCurrentIndex: focusItem,
    next,
    previous,
    first,
    last,
  };
}

// ============================================================================
// Focus Restoration Hook
// ============================================================================

/**
 * Hook to save and restore focus
 */
export function useFocusRestore(): {
  save: () => void;
  restore: () => void;
  savedElement: HTMLElement | null;
} {
  const savedRef = useRef<HTMLElement | null>(null);
  
  const save = useCallback(() => {
    savedRef.current = saveFocus();
  }, []);
  
  const restore = useCallback(() => {
    restoreFocus(savedRef.current);
    savedRef.current = null;
  }, []);
  
  return {
    save,
    restore,
    savedElement: savedRef.current,
  };
}

/**
 * Hook to manage focus on mount/unmount
 */
export function useFocusOnMount(
  targetRef: React.RefObject<HTMLElement | null>,
  options: {
    focusOnMount?: boolean;
    restoreOnUnmount?: boolean;
    delay?: number;
  } = {}
): void {
  const { focusOnMount = true, restoreOnUnmount = true, delay = 0 } = options;
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (restoreOnUnmount) {
      previousFocusRef.current = saveFocus();
    }
    
    if (focusOnMount && targetRef.current) {
      const focus = () => {
        if (targetRef.current) {
          targetRef.current.focus();
        }
      };
      
      if (delay > 0) {
        const timeoutId = setTimeout(focus, delay);
        return () => clearTimeout(timeoutId);
      } else {
        focus();
      }
    }
    
    return () => {
      if (restoreOnUnmount && previousFocusRef.current) {
        restoreFocus(previousFocusRef.current);
      }
    };
  }, [focusOnMount, restoreOnUnmount, delay, targetRef]);
}
