/**
 * Menu System
 * 
 * Context menu configuration, types, and utilities for the Universal Council App.
 * 
 * @module lib/menus
 * 
 * @example
 * ```tsx
 * import { createMenu, createActionItem, createSeparator } from '@/lib/menus';
 * import { Edit, Trash2, Share } from 'lucide-react';
 * 
 * const menu = createMenu('meeting-card')
 *   .action('Edit', () => handleEdit(), { icon: Edit, shortcut: '⌘E' })
 *   .action('Share', () => handleShare(), { icon: Share })
 *   .separator()
 *   .action('Delete', () => handleDelete(), { icon: Trash2, variant: 'destructive' })
 *   .build();
 * ```
 */

// Types
export type {
  MenuItem,
  MenuItemBase,
  ActionMenuItem,
  CheckboxMenuItem,
  RadioMenuItem,
  SubmenuItem,
  SeparatorItem,
  LabelItem,
  MenuConfig,
  MenuContext,
  MenuBuilder as MenuBuilderType,
  ActionResult,
  ActionHandler,
  ActionHandlerMap,
  MenuEventType,
  MenuEvent,
  MenuEventListener,
  KeyboardShortcut,
} from './types';

export { formatShortcut } from './types';

// Builders
export {
  createActionItem,
  createCheckboxItem,
  createRadioItem,
  createSubmenu,
  createSeparator,
  createLabel,
  createMenu,
  MenuBuilder,
  createEditActions,
  createShareActions,
} from './builders';

// Pre-built menus
export {
  buildMeetingCardMenu,
  type MeetingCardMenuContext,
} from './meeting-card-menu';

export {
  buildTranscriptionSegmentMenu,
  type TranscriptionSegmentMenuContext,
} from './transcription-segment-menu';

export {
  buildTemplateItemMenu,
  type TemplateItemMenuContext,
} from './template-item-menu';
