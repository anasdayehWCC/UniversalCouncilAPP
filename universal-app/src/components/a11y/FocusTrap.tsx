'use client';

/**
 * Focus Trap Component
 * 
 * Constrains keyboard focus within a container, essential for
 * modals, dialogs, and overlay components.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  useFocusTrap as useFocusTrapHook,
  getTabbableElements,
  saveFocus,
  restoreFocus,
} from '@/lib/a11y/focus-trap';

export interface FocusTrapProps {
  /** Children to render inside the trap */
  children: React.ReactNode;
  /** Whether the trap is active */
  active?: boolean;
  /** Initial focus target (selector or element) */
  initialFocus?: string;
  /** Return focus to trigger element on deactivate */
  returnFocus?: boolean;
  /** Allow clicking outside the trap */
  allowOutsideClick?: boolean;
  /** Escape key deactivates trap */
  escapeDeactivates?: boolean;
  /** Callback when escape is pressed */
  onEscape?: () => void;
  /** Callback when clicking outside (if allowOutsideClick is true) */
  onOutsideClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Container element type */
  as?: keyof JSX.IntrinsicElements;
  /** Additional props for container */
  containerProps?: React.HTMLAttributes<HTMLElement>;
}

/**
 * FocusTrap Component
 * 
 * Traps keyboard focus within its children. When active, Tab and Shift+Tab
 * cycle through focusable elements within the container.
 * 
 * @example
 * ```tsx
 * <FocusTrap active={isOpen} onEscape={() => setIsOpen(false)}>
 *   <Dialog>
 *     <button>Action 1</button>
 *     <button>Action 2</button>
 *   </Dialog>
 * </FocusTrap>
 * ```
 */
export function FocusTrap({
  children,
  active = true,
  initialFocus,
  returnFocus = true,
  allowOutsideClick = false,
  escapeDeactivates = true,
  onEscape,
  onOutsideClick,
  className,
  as: Component = 'div',
  containerProps,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const activatedRef = useRef(false);
  
  // Save focus when trap activates
  useEffect(() => {
    if (active && !activatedRef.current) {
      previousFocusRef.current = saveFocus();
      activatedRef.current = true;
    } else if (!active && activatedRef.current) {
      if (returnFocus && previousFocusRef.current) {
        restoreFocus(previousFocusRef.current);
      }
      activatedRef.current = false;
    }
  }, [active, returnFocus]);
  
  // Set initial focus
  useEffect(() => {
    if (!active || !containerRef.current) return;
    
    const container = containerRef.current;
    
    // Delay to allow DOM to settle
    const timeoutId = setTimeout(() => {
      // Try initial focus target
      if (initialFocus) {
        const target = container.querySelector<HTMLElement>(initialFocus);
        if (target) {
          target.focus();
          return;
        }
      }
      
      // Fall back to first tabbable element
      const tabbables = getTabbableElements(container);
      if (tabbables.length > 0) {
        tabbables[0].focus();
      } else {
        // Focus container itself as last resort
        container.tabIndex = -1;
        container.focus();
      }
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [active, initialFocus]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!active || !containerRef.current) return;
      
      // Handle Escape
      if (event.key === 'Escape' && escapeDeactivates) {
        event.preventDefault();
        event.stopPropagation();
        onEscape?.();
        return;
      }
      
      // Handle Tab
      if (event.key === 'Tab') {
        const container = containerRef.current;
        const tabbables = getTabbableElements(container);
        
        if (tabbables.length === 0) {
          event.preventDefault();
          return;
        }
        
        const firstTabbable = tabbables[0];
        const lastTabbable = tabbables[tabbables.length - 1];
        const activeElement = document.activeElement;
        
        if (event.shiftKey) {
          // Shift+Tab: going backwards
          if (activeElement === firstTabbable || !container.contains(activeElement)) {
            event.preventDefault();
            lastTabbable.focus();
          }
        } else {
          // Tab: going forwards
          if (activeElement === lastTabbable || !container.contains(activeElement)) {
            event.preventDefault();
            firstTabbable.focus();
          }
        }
      }
    },
    [active, escapeDeactivates, onEscape]
  );
  
  // Handle outside clicks
  useEffect(() => {
    if (!active || allowOutsideClick) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      
      const target = event.target as Node;
      if (!container.contains(target)) {
        if (allowOutsideClick) {
          onOutsideClick?.();
        } else {
          // Prevent focus from leaving
          event.preventDefault();
          event.stopPropagation();
          
          // Return focus to container
          const tabbables = getTabbableElements(container);
          if (tabbables.length > 0) {
            tabbables[0].focus();
          }
        }
      }
    };
    
    // Handle focus leaving
    const handleFocusIn = (event: FocusEvent) => {
      const container = containerRef.current;
      if (!container) return;
      
      const target = event.target as HTMLElement;
      if (!container.contains(target)) {
        event.preventDefault();
        
        // Return focus to container
        const tabbables = getTabbableElements(container);
        if (tabbables.length > 0) {
          tabbables[0].focus();
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('focusin', handleFocusIn, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('focusin', handleFocusIn, true);
    };
  }, [active, allowOutsideClick, onOutsideClick]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (returnFocus && previousFocusRef.current) {
        restoreFocus(previousFocusRef.current);
      }
    };
  }, [returnFocus]);
  
  const Container = Component as 'div';
  
  return (
    <Container
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={cn(className)}
      {...containerProps}
    >
      {children}
    </Container>
  );
}

/**
 * Modal Focus Trap
 * 
 * Pre-configured focus trap for modal dialogs with proper
 * ARIA attributes and focus management.
 */
export function ModalFocusTrap({
  children,
  active = true,
  onClose,
  labelledBy,
  describedBy,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClose?: () => void;
  labelledBy?: string;
  describedBy?: string;
  className?: string;
}) {
  return (
    <FocusTrap
      active={active}
      escapeDeactivates
      returnFocus
      onEscape={onClose}
      className={cn('outline-none', className)}
      containerProps={{
        role: 'dialog',
        'aria-modal': true,
        'aria-labelledby': labelledBy,
        'aria-describedby': describedBy,
      }}
    >
      {children}
    </FocusTrap>
  );
}

/**
 * Menu Focus Trap
 * 
 * Focus trap configured for dropdown menus with roving tabindex.
 */
export function MenuFocusTrap({
  children,
  active = true,
  onClose,
  labelledBy,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClose?: () => void;
  labelledBy?: string;
  className?: string;
}) {
  return (
    <FocusTrap
      active={active}
      escapeDeactivates
      returnFocus
      onEscape={onClose}
      className={cn('outline-none', className)}
      containerProps={{
        role: 'menu',
        'aria-labelledby': labelledBy,
      }}
    >
      {children}
    </FocusTrap>
  );
}

/**
 * Hook-based focus trap (alternative API)
 */
export function useFocusTrap(options: {
  enabled?: boolean;
  initialFocus?: string;
  returnFocus?: boolean;
  escapeDeactivates?: boolean;
  onEscape?: () => void;
} = {}) {
  const {
    enabled = true,
    initialFocus,
    returnFocus = true,
    escapeDeactivates = true,
    onEscape,
  } = options;
  
  return useFocusTrapHook({
    enabled,
    initialFocus,
    returnFocusOnDeactivate: returnFocus,
    escapeDeactivates,
  });
}

export default FocusTrap;
