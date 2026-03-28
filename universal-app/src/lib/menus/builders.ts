/**
 * Menu Builders
 * 
 * Utility functions for building menu configurations.
 * 
 * @module lib/menus/builders
 */

import type { LucideIcon } from 'lucide-react';
import type {
  MenuItem,
  ActionMenuItem,
  CheckboxMenuItem,
  RadioMenuItem,
  SubmenuItem,
  SeparatorItem,
  LabelItem,
  MenuConfig,
  KeyboardShortcut,
} from './types';
import { formatShortcut } from './types';

// ============================================================================
// Item Builders
// ============================================================================

let itemIdCounter = 0;

/**
 * Generate unique item ID
 */
function generateId(prefix = 'menu-item'): string {
  return `${prefix}-${++itemIdCounter}`;
}

/**
 * Create an action menu item
 */
export function createActionItem(
  label: string,
  onSelect: () => void | Promise<void>,
  options: Partial<Omit<ActionMenuItem, 'type' | 'label' | 'onSelect'>> = {}
): ActionMenuItem {
  return {
    type: 'action',
    id: options.id ?? generateId('action'),
    label,
    onSelect,
    ...options,
  };
}

/**
 * Create a checkbox menu item
 */
export function createCheckboxItem(
  label: string,
  checked: boolean,
  onCheckedChange: (checked: boolean) => void,
  options: Partial<Omit<CheckboxMenuItem, 'type' | 'label' | 'checked' | 'onCheckedChange'>> = {}
): CheckboxMenuItem {
  return {
    type: 'checkbox',
    id: options.id ?? generateId('checkbox'),
    label,
    checked,
    onCheckedChange,
    ...options,
  };
}

/**
 * Create a radio menu item
 */
export function createRadioItem(
  label: string,
  group: string,
  selected: boolean,
  onSelect: () => void,
  options: Partial<Omit<RadioMenuItem, 'type' | 'label' | 'group' | 'selected' | 'onSelect'>> = {}
): RadioMenuItem {
  return {
    type: 'radio',
    id: options.id ?? generateId('radio'),
    label,
    group,
    selected,
    onSelect,
    ...options,
  };
}

/**
 * Create a submenu item
 */
export function createSubmenu(
  label: string,
  items: MenuItem[],
  options: Partial<Omit<SubmenuItem, 'type' | 'label' | 'items'>> = {}
): SubmenuItem {
  return {
    type: 'submenu',
    id: options.id ?? generateId('submenu'),
    label,
    items,
    ...options,
  };
}

/**
 * Create a separator
 */
export function createSeparator(): SeparatorItem {
  return {
    type: 'separator',
    id: generateId('separator'),
  };
}

/**
 * Create a label/header
 */
export function createLabel(
  label: string,
  options: Partial<Omit<LabelItem, 'type' | 'label'>> = {}
): LabelItem {
  return {
    type: 'label',
    id: options.id ?? generateId('label'),
    label,
    ...options,
  };
}

// ============================================================================
// Menu Config Builder
// ============================================================================

/**
 * Fluent builder for creating menu configurations
 */
export class MenuBuilder {
  private config: MenuConfig;

  constructor(id: string) {
    this.config = {
      id,
      items: [],
    };
  }

  /**
   * Add an action item
   */
  action(
    label: string,
    onSelect: () => void | Promise<void>,
    options: {
      icon?: LucideIcon;
      shortcut?: KeyboardShortcut | string;
      disabled?: boolean;
      variant?: 'default' | 'destructive';
    } = {}
  ): this {
    const shortcut = options.shortcut
      ? typeof options.shortcut === 'string'
        ? options.shortcut
        : formatShortcut(options.shortcut)
      : undefined;

    this.config.items.push(
      createActionItem(label, onSelect, {
        icon: options.icon,
        shortcut,
        disabled: options.disabled,
        variant: options.variant,
      })
    );
    return this;
  }

  /**
   * Add a checkbox item
   */
  checkbox(
    label: string,
    checked: boolean,
    onCheckedChange: (checked: boolean) => void,
    options: { icon?: LucideIcon; disabled?: boolean } = {}
  ): this {
    this.config.items.push(createCheckboxItem(label, checked, onCheckedChange, options));
    return this;
  }

  /**
   * Add a separator
   */
  separator(): this {
    this.config.items.push(createSeparator());
    return this;
  }

  /**
   * Add a label/header
   */
  label(text: string): this {
    this.config.items.push(createLabel(text));
    return this;
  }

  /**
   * Add a submenu
   */
  submenu(
    label: string,
    buildSubmenu: (builder: MenuBuilder) => MenuBuilder,
    options: { icon?: LucideIcon; disabled?: boolean } = {}
  ): this {
    const subBuilder = new MenuBuilder(`${this.config.id}-submenu`);
    buildSubmenu(subBuilder);
    this.config.items.push(
      createSubmenu(label, subBuilder.build().items, {
        icon: options.icon,
        disabled: options.disabled,
      })
    );
    return this;
  }

  /**
   * Add multiple items conditionally
   */
  when(condition: boolean, buildItems: (builder: this) => this): this {
    if (condition) {
      buildItems(this);
    }
    return this;
  }

  /**
   * Set menu width
   */
  width(width: number): this {
    this.config.width = width;
    return this;
  }

  /**
   * Set aria label
   */
  ariaLabel(label: string): this {
    this.config.ariaLabel = label;
    return this;
  }

  /**
   * Build the final menu configuration
   */
  build(): MenuConfig {
    return { ...this.config };
  }
}

/**
 * Create a new menu builder
 */
export function createMenu(id: string): MenuBuilder {
  return new MenuBuilder(id);
}

// ============================================================================
// Common Patterns
// ============================================================================

/**
 * Create standard edit actions (Edit, Duplicate, Delete)
 */
export function createEditActions(handlers: {
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}): MenuItem[] {
  const items: MenuItem[] = [];

  if (handlers.onEdit) {
    items.push(
      createActionItem('Edit', handlers.onEdit, {
        id: 'edit',
        shortcut: '⌘E',
        disabled: handlers.canEdit === false,
      })
    );
  }

  if (handlers.onDuplicate) {
    items.push(
      createActionItem('Duplicate', handlers.onDuplicate, {
        id: 'duplicate',
        shortcut: '⌘D',
      })
    );
  }

  if (handlers.onDelete) {
    items.push(
      createActionItem('Delete', handlers.onDelete, {
        id: 'delete',
        variant: 'destructive',
        disabled: handlers.canDelete === false,
      })
    );
  }

  return items;
}

/**
 * Create standard share actions
 */
export function createShareActions(handlers: {
  onCopyLink?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  canShare?: boolean;
}): MenuItem[] {
  const items: MenuItem[] = [];

  if (handlers.onCopyLink) {
    items.push(
      createActionItem('Copy link', handlers.onCopyLink, {
        id: 'copy-link',
        shortcut: '⌘L',
      })
    );
  }

  if (handlers.onShare) {
    items.push(
      createActionItem('Share', handlers.onShare, {
        id: 'share',
        disabled: handlers.canShare === false,
      })
    );
  }

  if (handlers.onExport) {
    items.push(
      createActionItem('Export', handlers.onExport, {
        id: 'export',
      })
    );
  }

  return items;
}
