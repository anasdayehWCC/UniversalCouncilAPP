/**
 * Menu System Types
 * 
 * Type definitions for context menus, action handlers, and menu builders.
 * 
 * @module lib/menus/types
 */

import type { LucideIcon } from 'lucide-react';

// ============================================================================
// Core Menu Item Types
// ============================================================================

/**
 * Base menu item properties
 */
export interface MenuItemBase {
  /** Unique identifier for the item */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon component */
  icon?: LucideIcon;
  /** Keyboard shortcut display (e.g., "⌘C") */
  shortcut?: string;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Visual variant */
  variant?: 'default' | 'destructive';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Standard action menu item
 */
export interface ActionMenuItem extends MenuItemBase {
  type: 'action';
  /** Handler called when item is selected */
  onSelect: () => void | Promise<void>;
}

/**
 * Checkbox menu item
 */
export interface CheckboxMenuItem extends MenuItemBase {
  type: 'checkbox';
  /** Current checked state */
  checked: boolean;
  /** Handler called when checkbox is toggled */
  onCheckedChange: (checked: boolean) => void;
}

/**
 * Radio menu item
 */
export interface RadioMenuItem extends MenuItemBase {
  type: 'radio';
  /** Group name for radio items */
  group: string;
  /** Whether this item is selected */
  selected: boolean;
  /** Handler called when item is selected */
  onSelect: () => void;
}

/**
 * Submenu container item
 */
export interface SubmenuItem extends MenuItemBase {
  type: 'submenu';
  /** Child menu items */
  items: MenuItem[];
}

/**
 * Menu separator
 */
export interface SeparatorItem {
  type: 'separator';
  id: string;
}

/**
 * Menu label/header
 */
export interface LabelItem {
  type: 'label';
  id: string;
  label: string;
  inset?: boolean;
}

/**
 * Union of all menu item types
 */
export type MenuItem =
  | ActionMenuItem
  | CheckboxMenuItem
  | RadioMenuItem
  | SubmenuItem
  | SeparatorItem
  | LabelItem;

// ============================================================================
// Menu Configuration Types
// ============================================================================

/**
 * Complete menu configuration
 */
export interface MenuConfig {
  /** Menu identifier */
  id: string;
  /** Menu items */
  items: MenuItem[];
  /** Menu width override */
  width?: number;
  /** Accessible label */
  ariaLabel?: string;
}

/**
 * Context data passed to menu builders
 */
export interface MenuContext<T = unknown> {
  /** The data item the menu was opened on */
  data: T;
  /** Whether the user can edit */
  canEdit?: boolean;
  /** Whether the user can delete */
  canDelete?: boolean;
  /** Whether the user can share */
  canShare?: boolean;
  /** Additional context flags */
  [key: string]: unknown;
}

/**
 * Menu builder function type
 */
export type MenuBuilder<T = unknown> = (context: MenuContext<T>) => MenuItem[];

// ============================================================================
// Action Handler Types
// ============================================================================

/**
 * Result of a menu action
 */
export interface ActionResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

/**
 * Async action handler
 */
export type ActionHandler<T = unknown> = (
  data: T
) => Promise<ActionResult> | ActionResult;

/**
 * Map of action IDs to handlers
 */
export type ActionHandlerMap<T = unknown> = Record<string, ActionHandler<T>>;

// ============================================================================
// Menu Event Types
// ============================================================================

/**
 * Menu event types
 */
export type MenuEventType = 'open' | 'close' | 'select' | 'hover';

/**
 * Menu event payload
 */
export interface MenuEvent {
  type: MenuEventType;
  menuId: string;
  itemId?: string;
  timestamp: number;
}

/**
 * Menu event listener
 */
export type MenuEventListener = (event: MenuEvent) => void;

// ============================================================================
// Shortcut Types
// ============================================================================

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Key to press */
  key: string;
  /** Require meta/cmd key */
  meta?: boolean;
  /** Require ctrl key */
  ctrl?: boolean;
  /** Require shift key */
  shift?: boolean;
  /** Require alt key */
  alt?: boolean;
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.meta) parts.push('⌘');
  if (shortcut.ctrl) parts.push('⌃');
  if (shortcut.alt) parts.push('⌥');
  if (shortcut.shift) parts.push('⇧');
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join('');
}
