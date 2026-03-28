'use client';

/**
 * useContextMenu Hook
 * 
 * Manages context menu state, position calculation, and keyboard navigation.
 * Works with both the Radix context menu or custom implementations.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { 
 *     isOpen, 
 *     position, 
 *     openMenu, 
 *     closeMenu, 
 *     contextData 
 *   } = useContextMenu<{ id: string; name: string }>();
 * 
 *   const handleContextMenu = (e: React.MouseEvent, data: { id: string; name: string }) => {
 *     openMenu(e, data);
 *   };
 * 
 *   return (
 *     <div onContextMenu={(e) => handleContextMenu(e, { id: '1', name: 'Item' })}>
 *       Right click me
 *     </div>
 *   );
 * }
 * ```
 * 
 * @module hooks/useContextMenu
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface MenuPosition {
  x: number;
  y: number;
}

export interface UseContextMenuOptions {
  /** Close menu when clicking outside */
  closeOnClickOutside?: boolean;
  /** Close menu on escape key */
  closeOnEscape?: boolean;
  /** Close menu on scroll */
  closeOnScroll?: boolean;
  /** Prevent default context menu behavior */
  preventDefault?: boolean;
  /** Menu padding from viewport edges */
  viewportPadding?: number;
  /** Callback when menu opens */
  onOpen?: () => void;
  /** Callback when menu closes */
  onClose?: () => void;
}

export interface UseContextMenuReturn<T = unknown> {
  /** Whether the menu is currently open */
  isOpen: boolean;
  /** Menu position coordinates */
  position: MenuPosition;
  /** Data associated with the current context */
  contextData: T | null;
  /** Open the menu at event coordinates */
  openMenu: (event: React.MouseEvent | MouseEvent, data?: T) => void;
  /** Open the menu at specific coordinates */
  openMenuAt: (x: number, y: number, data?: T) => void;
  /** Close the menu */
  closeMenu: () => void;
  /** Toggle the menu */
  toggleMenu: (event: React.MouseEvent | MouseEvent, data?: T) => void;
  /** Ref for the trigger element */
  triggerRef: React.RefObject<HTMLElement | null>;
  /** Ref for the menu element */
  menuRef: React.RefObject<HTMLDivElement | null>;
  /** Props to spread on trigger element */
  getTriggerProps: () => {
    ref: React.RefObject<HTMLElement | null>;
    onContextMenu: (event: React.MouseEvent) => void;
  };
  /** Props to spread on menu element */
  getMenuProps: () => {
    ref: React.RefObject<HTMLDivElement | null>;
    style: React.CSSProperties;
    role: string;
    'aria-hidden': boolean;
  };
}

// ============================================================================
// Default Options
// ============================================================================

const defaultOptions: Required<UseContextMenuOptions> = {
  closeOnClickOutside: true,
  closeOnEscape: true,
  closeOnScroll: true,
  preventDefault: true,
  viewportPadding: 8,
  onOpen: () => {},
  onClose: () => {},
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing context menu state and behavior
 */
export function useContextMenu<T = unknown>(
  options: UseContextMenuOptions = {}
): UseContextMenuReturn<T> {
  const config = { ...defaultOptions, ...options };

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [contextData, setContextData] = useState<T | null>(null);

  const triggerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * Calculate menu position ensuring it stays within viewport
   */
  const calculatePosition = useCallback(
    (x: number, y: number): MenuPosition => {
      const { viewportPadding } = config;
      const menuWidth = menuRef.current?.offsetWidth ?? 200;
      const menuHeight = menuRef.current?.offsetHeight ?? 200;

      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

      // Adjust X position if menu would overflow right edge
      let adjustedX = x;
      if (x + menuWidth + viewportPadding > viewportWidth) {
        adjustedX = viewportWidth - menuWidth - viewportPadding;
      }
      // Ensure menu doesn't go off left edge
      adjustedX = Math.max(viewportPadding, adjustedX);

      // Adjust Y position if menu would overflow bottom edge
      let adjustedY = y;
      if (y + menuHeight + viewportPadding > viewportHeight) {
        adjustedY = viewportHeight - menuHeight - viewportPadding;
      }
      // Ensure menu doesn't go off top edge
      adjustedY = Math.max(viewportPadding, adjustedY);

      return { x: adjustedX, y: adjustedY };
    },
    [config]
  );

  /**
   * Open menu at event coordinates
   */
  const openMenu = useCallback(
    (event: React.MouseEvent | MouseEvent, data?: T) => {
      if (config.preventDefault) {
        event.preventDefault();
      }

      const newPosition = calculatePosition(event.clientX, event.clientY);
      setPosition(newPosition);
      setContextData(data ?? null);
      setIsOpen(true);
      config.onOpen();
    },
    [calculatePosition, config]
  );

  /**
   * Open menu at specific coordinates
   */
  const openMenuAt = useCallback(
    (x: number, y: number, data?: T) => {
      const newPosition = calculatePosition(x, y);
      setPosition(newPosition);
      setContextData(data ?? null);
      setIsOpen(true);
      config.onOpen();
    },
    [calculatePosition, config]
  );

  /**
   * Close the menu
   */
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setContextData(null);
    config.onClose();
  }, [config]);

  /**
   * Toggle menu open/closed
   */
  const toggleMenu = useCallback(
    (event: React.MouseEvent | MouseEvent, data?: T) => {
      if (isOpen) {
        closeMenu();
      } else {
        openMenu(event, data);
      }
    },
    [isOpen, openMenu, closeMenu]
  );

  // Handle click outside
  useEffect(() => {
    if (!isOpen || !config.closeOnClickOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, config.closeOnClickOutside, closeMenu]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !config.closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, config.closeOnEscape, closeMenu]);

  // Handle scroll
  useEffect(() => {
    if (!isOpen || !config.closeOnScroll) return;

    const handleScroll = () => closeMenu();

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen, config.closeOnScroll, closeMenu]);

  /**
   * Get props for trigger element
   */
  const getTriggerProps = useCallback(
    () => ({
      ref: triggerRef,
      onContextMenu: (event: React.MouseEvent) => openMenu(event),
    }),
    [openMenu]
  );

  /**
   * Get props for menu element
   */
  const getMenuProps = useCallback(
    () => ({
      ref: menuRef,
      style: {
        position: 'fixed' as const,
        left: position.x,
        top: position.y,
        zIndex: 50,
      },
      role: 'menu',
      'aria-hidden': !isOpen,
    }),
    [position, isOpen]
  );

  return {
    isOpen,
    position,
    contextData,
    openMenu,
    openMenuAt,
    closeMenu,
    toggleMenu,
    triggerRef,
    menuRef,
    getTriggerProps,
    getMenuProps,
  };
}

// ============================================================================
// Keyboard Navigation Hook
// ============================================================================

export interface UseMenuKeyboardNavigationOptions {
  /** List of menu item refs */
  itemRefs: React.RefObject<HTMLElement>[];
  /** Whether the menu is open */
  isOpen: boolean;
  /** Callback when an item is selected */
  onSelect?: (index: number) => void;
  /** Callback to close the menu */
  onClose?: () => void;
}

/**
 * Hook for keyboard navigation within menus
 */
export function useMenuKeyboardNavigation({
  itemRefs,
  isOpen,
  onSelect,
  onClose,
}: UseMenuKeyboardNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Reset focus when menu opens/closes
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
      // Focus first item when menu opens
      itemRefs[0]?.current?.focus();
    }
  }, [isOpen, itemRefs]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev < itemRefs.length - 1 ? prev + 1 : 0;
            itemRefs[next]?.current?.focus();
            return next;
          });
          break;

        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : itemRefs.length - 1;
            itemRefs[next]?.current?.focus();
            return next;
          });
          break;

        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          itemRefs[0]?.current?.focus();
          break;

        case 'End':
          event.preventDefault();
          const lastIndex = itemRefs.length - 1;
          setFocusedIndex(lastIndex);
          itemRefs[lastIndex]?.current?.focus();
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          onSelect?.(focusedIndex);
          break;

        case 'Escape':
          event.preventDefault();
          onClose?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, itemRefs, onSelect, onClose]);

  return {
    focusedIndex,
    setFocusedIndex,
  };
}

export default useContextMenu;
