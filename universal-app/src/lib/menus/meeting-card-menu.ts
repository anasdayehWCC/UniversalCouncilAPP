/**
 * Meeting Card Context Menu
 * 
 * Context menu configuration for meeting cards in the dashboard.
 * Provides actions for Edit, Delete, Export, and Share.
 * 
 * @module lib/menus/meeting-card-menu
 */

import {
  Pencil,
  Trash2,
  Download,
  Share2,
  Copy,
  ExternalLink,
  FileText,
  Archive,
  Star,
  StarOff,
} from 'lucide-react';
import type { MenuItem, MenuConfig } from './types';
import { createMenu } from './builders';

// ============================================================================
// Types
// ============================================================================

export interface MeetingCardMenuContext {
  /** Meeting ID */
  meetingId: string;
  /** Meeting title */
  title: string;
  /** Whether user can edit this meeting */
  canEdit: boolean;
  /** Whether user can delete this meeting */
  canDelete: boolean;
  /** Whether user can share this meeting */
  canShare: boolean;
  /** Whether meeting is favorited */
  isFavorited: boolean;
  /** Whether meeting is archived */
  isArchived: boolean;
  /** Whether meeting has minutes */
  hasMinutes: boolean;
}

export interface MeetingCardMenuHandlers {
  /** Called when Edit is selected */
  onEdit: (meetingId: string) => void | Promise<void>;
  /** Called when Delete is selected */
  onDelete: (meetingId: string) => void | Promise<void>;
  /** Called when Export is selected */
  onExport: (meetingId: string, format: 'pdf' | 'docx' | 'txt') => void | Promise<void>;
  /** Called when Share is selected */
  onShare: (meetingId: string) => void | Promise<void>;
  /** Called when Copy link is selected */
  onCopyLink: (meetingId: string) => void | Promise<void>;
  /** Called when Open in new tab is selected */
  onOpenNewTab: (meetingId: string) => void | Promise<void>;
  /** Called when View minutes is selected */
  onViewMinutes: (meetingId: string) => void | Promise<void>;
  /** Called when Archive/Unarchive is selected */
  onArchiveToggle: (meetingId: string, archive: boolean) => void | Promise<void>;
  /** Called when Favorite/Unfavorite is selected */
  onFavoriteToggle: (meetingId: string, favorite: boolean) => void | Promise<void>;
}

// ============================================================================
// Menu Builder
// ============================================================================

/**
 * Build the meeting card context menu
 */
export function buildMeetingCardMenu(
  context: MeetingCardMenuContext,
  handlers: MeetingCardMenuHandlers
): MenuConfig {
  const { meetingId, canEdit, canDelete, canShare, isFavorited, isArchived, hasMinutes } = context;

  return createMenu('meeting-card-menu')
    .ariaLabel(`Actions for meeting: ${context.title}`)
    // Primary actions
    .action('Edit', () => handlers.onEdit(meetingId), {
      icon: Pencil,
      shortcut: '⌘E',
      disabled: !canEdit,
    })
    .when(hasMinutes, (builder) =>
      builder.action('View minutes', () => handlers.onViewMinutes(meetingId), {
        icon: FileText,
      })
    )
    .separator()
    // Favorite/Archive
    .action(
      isFavorited ? 'Remove from favourites' : 'Add to favourites',
      () => handlers.onFavoriteToggle(meetingId, !isFavorited),
      {
        icon: isFavorited ? StarOff : Star,
      }
    )
    .action(
      isArchived ? 'Unarchive' : 'Archive',
      () => handlers.onArchiveToggle(meetingId, !isArchived),
      {
        icon: Archive,
      }
    )
    .separator()
    // Export submenu
    .submenu('Export', (sub) =>
      sub
        .action('Export as PDF', () => handlers.onExport(meetingId, 'pdf'), {
          icon: Download,
        })
        .action('Export as Word', () => handlers.onExport(meetingId, 'docx'), {
          icon: Download,
        })
        .action('Export as Text', () => handlers.onExport(meetingId, 'txt'), {
          icon: Download,
        })
    )
    .separator()
    // Share actions
    .action('Copy link', () => handlers.onCopyLink(meetingId), {
      icon: Copy,
      shortcut: '⌘L',
    })
    .action('Share', () => handlers.onShare(meetingId), {
      icon: Share2,
      disabled: !canShare,
    })
    .action('Open in new tab', () => handlers.onOpenNewTab(meetingId), {
      icon: ExternalLink,
    })
    .separator()
    // Destructive action
    .action('Delete', () => handlers.onDelete(meetingId), {
      icon: Trash2,
      variant: 'destructive',
      disabled: !canDelete,
    })
    .build();
}

// ============================================================================
// Default Handlers (for demo/development)
// ============================================================================

/**
 * Create placeholder handlers that log actions
 */
export function createMockMeetingCardHandlers(): MeetingCardMenuHandlers {
  return {
    onEdit: (id) => console.log('[Menu] Edit meeting:', id),
    onDelete: (id) => console.log('[Menu] Delete meeting:', id),
    onExport: (id, format) => console.log('[Menu] Export meeting:', id, format),
    onShare: (id) => console.log('[Menu] Share meeting:', id),
    onCopyLink: (id) => console.log('[Menu] Copy link:', id),
    onOpenNewTab: (id) => console.log('[Menu] Open in new tab:', id),
    onViewMinutes: (id) => console.log('[Menu] View minutes:', id),
    onArchiveToggle: (id, archive) => console.log('[Menu] Archive:', id, archive),
    onFavoriteToggle: (id, favorite) => console.log('[Menu] Favorite:', id, favorite),
  };
}
