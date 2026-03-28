/**
 * Template Item Context Menu
 * 
 * Context menu for template items in the template manager.
 * Provides actions for Edit, Duplicate, and Delete.
 * 
 * @module lib/menus/template-item-menu
 */

import {
  Pencil,
  Copy,
  Trash2,
  Eye,
  FileText,
  Download,
  Upload,
  Lock,
  Unlock,
  Star,
  StarOff,
  Settings,
  History,
} from 'lucide-react';
import type { MenuConfig } from './types';
import { createMenu } from './builders';

// ============================================================================
// Types
// ============================================================================

export interface TemplateItemMenuContext {
  /** Template ID */
  templateId: string;
  /** Template name */
  name: string;
  /** Whether template is system/default (not editable) */
  isSystem: boolean;
  /** Whether user can edit this template */
  canEdit: boolean;
  /** Whether user can delete this template */
  canDelete: boolean;
  /** Whether template is currently locked */
  isLocked: boolean;
  /** Whether template is starred/favorited */
  isStarred: boolean;
  /** Whether template has been modified from original */
  isModified: boolean;
  /** Version count */
  versionCount: number;
}

export interface TemplateItemMenuHandlers {
  /** Called when Edit is selected */
  onEdit: (templateId: string) => void | Promise<void>;
  /** Called when Duplicate is selected */
  onDuplicate: (templateId: string) => void | Promise<void>;
  /** Called when Delete is selected */
  onDelete: (templateId: string) => void | Promise<void>;
  /** Called when Preview is selected */
  onPreview: (templateId: string) => void | Promise<void>;
  /** Called when Use template is selected */
  onUseTemplate: (templateId: string) => void | Promise<void>;
  /** Called when Export is selected */
  onExport: (templateId: string, format: 'json' | 'yaml') => void | Promise<void>;
  /** Called when Import (replace) is selected */
  onImport: (templateId: string) => void | Promise<void>;
  /** Called when Lock/Unlock is selected */
  onLockToggle: (templateId: string, locked: boolean) => void | Promise<void>;
  /** Called when Star/Unstar is selected */
  onStarToggle: (templateId: string, starred: boolean) => void | Promise<void>;
  /** Called when Settings is selected */
  onSettings: (templateId: string) => void | Promise<void>;
  /** Called when View history is selected */
  onViewHistory: (templateId: string) => void | Promise<void>;
  /** Called when Reset to default is selected */
  onReset: (templateId: string) => void | Promise<void>;
}

// ============================================================================
// Menu Builder
// ============================================================================

/**
 * Build the template item context menu
 */
export function buildTemplateItemMenu(
  context: TemplateItemMenuContext,
  handlers: TemplateItemMenuHandlers
): MenuConfig {
  const {
    templateId,
    name,
    isSystem,
    canEdit,
    canDelete,
    isLocked,
    isStarred,
    isModified,
    versionCount,
  } = context;

  return createMenu('template-item-menu')
    .ariaLabel(`Actions for template: ${name}`)
    // Primary actions
    .action('Use template', () => handlers.onUseTemplate(templateId), {
      icon: FileText,
    })
    .action('Preview', () => handlers.onPreview(templateId), {
      icon: Eye,
    })
    .separator()
    // Edit actions
    .action('Edit', () => handlers.onEdit(templateId), {
      icon: Pencil,
      shortcut: '⌘E',
      disabled: !canEdit || isLocked,
    })
    .action('Duplicate', () => handlers.onDuplicate(templateId), {
      icon: Copy,
      shortcut: '⌘D',
    })
    .action('Settings', () => handlers.onSettings(templateId), {
      icon: Settings,
      disabled: isSystem,
    })
    .separator()
    // Organization
    .action(isStarred ? 'Unstar' : 'Star', () =>
      handlers.onStarToggle(templateId, !isStarred),
      {
        icon: isStarred ? StarOff : Star,
      }
    )
    .when(!isSystem, (builder) =>
      builder.action(isLocked ? 'Unlock' : 'Lock', () =>
        handlers.onLockToggle(templateId, !isLocked),
        {
          icon: isLocked ? Unlock : Lock,
        }
      )
    )
    .separator()
    // Import/Export
    .submenu('Export', (sub) =>
      sub
        .action('Export as JSON', () => handlers.onExport(templateId, 'json'), {
          icon: Download,
        })
        .action('Export as YAML', () => handlers.onExport(templateId, 'yaml'), {
          icon: Download,
        })
    )
    .when(!isSystem, (builder) =>
      builder.action('Import & replace', () => handlers.onImport(templateId), {
        icon: Upload,
        disabled: isLocked,
      })
    )
    .separator()
    // History and versioning
    .when(versionCount > 1, (builder) =>
      builder.action(`View history (${versionCount} versions)`, () =>
        handlers.onViewHistory(templateId),
        {
          icon: History,
        }
      )
    )
    .when(isModified && !isSystem, (builder) =>
      builder.action('Reset to default', () => handlers.onReset(templateId), {
        variant: 'destructive',
      })
    )
    // Delete
    .when(!isSystem, (builder) =>
      builder
        .separator()
        .action('Delete', () => handlers.onDelete(templateId), {
          icon: Trash2,
          variant: 'destructive',
          disabled: !canDelete || isLocked,
        })
    )
    .build();
}

// ============================================================================
// Default Handlers (for demo/development)
// ============================================================================

/**
 * Create placeholder handlers that log actions
 */
export function createMockTemplateItemHandlers(): TemplateItemMenuHandlers {
  return {
    onEdit: (id) => console.log('[Menu] Edit template:', id),
    onDuplicate: (id) => console.log('[Menu] Duplicate template:', id),
    onDelete: (id) => console.log('[Menu] Delete template:', id),
    onPreview: (id) => console.log('[Menu] Preview template:', id),
    onUseTemplate: (id) => console.log('[Menu] Use template:', id),
    onExport: (id, format) => console.log('[Menu] Export template:', id, format),
    onImport: (id) => console.log('[Menu] Import to template:', id),
    onLockToggle: (id, locked) => console.log('[Menu] Lock template:', id, locked),
    onStarToggle: (id, starred) => console.log('[Menu] Star template:', id, starred),
    onSettings: (id) => console.log('[Menu] Template settings:', id),
    onViewHistory: (id) => console.log('[Menu] View template history:', id),
    onReset: (id) => console.log('[Menu] Reset template:', id),
  };
}
