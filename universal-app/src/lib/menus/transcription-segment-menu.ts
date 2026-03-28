/**
 * Transcription Segment Context Menu
 * 
 * Context menu for individual transcription segments.
 * Provides actions for Copy, Jump to timestamp, and Add note.
 * 
 * @module lib/menus/transcription-segment-menu
 */

import {
  Copy,
  Clock,
  StickyNote,
  Quote,
  Bookmark,
  Flag,
  MessageSquare,
  Play,
  Highlighter,
} from 'lucide-react';
import type { MenuConfig } from './types';
import { createMenu } from './builders';

// ============================================================================
// Types
// ============================================================================

export interface TranscriptionSegmentMenuContext {
  /** Segment ID */
  segmentId: string;
  /** Segment text content */
  text: string;
  /** Start timestamp in seconds */
  startTime: number;
  /** End timestamp in seconds */
  endTime: number;
  /** Speaker name if identified */
  speaker?: string;
  /** Whether segment has existing note */
  hasNote: boolean;
  /** Whether segment is bookmarked */
  isBookmarked: boolean;
  /** Whether segment is flagged for review */
  isFlagged: boolean;
  /** Whether audio playback is available */
  hasAudio: boolean;
}

export interface TranscriptionSegmentMenuHandlers {
  /** Copy segment text to clipboard */
  onCopy: (text: string) => void | Promise<void>;
  /** Jump to segment timestamp in player */
  onJumpTo: (startTime: number) => void | Promise<void>;
  /** Play segment audio */
  onPlay: (startTime: number, endTime: number) => void | Promise<void>;
  /** Add or edit a note on segment */
  onAddNote: (segmentId: string) => void | Promise<void>;
  /** Quote segment in minutes */
  onQuote: (segmentId: string, text: string) => void | Promise<void>;
  /** Toggle bookmark on segment */
  onBookmarkToggle: (segmentId: string, bookmarked: boolean) => void | Promise<void>;
  /** Toggle flag for review */
  onFlagToggle: (segmentId: string, flagged: boolean) => void | Promise<void>;
  /** Add comment/annotation */
  onComment: (segmentId: string) => void | Promise<void>;
  /** Highlight segment */
  onHighlight: (segmentId: string, color?: string) => void | Promise<void>;
}

// ============================================================================
// Menu Builder
// ============================================================================

/**
 * Format seconds to MM:SS or HH:MM:SS display
 */
function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Build the transcription segment context menu
 */
export function buildTranscriptionSegmentMenu(
  context: TranscriptionSegmentMenuContext,
  handlers: TranscriptionSegmentMenuHandlers
): MenuConfig {
  const {
    segmentId,
    text,
    startTime,
    endTime,
    speaker,
    hasNote,
    isBookmarked,
    isFlagged,
    hasAudio,
  } = context;

  const timestampLabel = `Jump to ${formatTimestamp(startTime)}`;

  return createMenu('transcription-segment-menu')
    .ariaLabel(`Actions for segment${speaker ? ` by ${speaker}` : ''} at ${formatTimestamp(startTime)}`)
    // Primary actions
    .action('Copy text', () => handlers.onCopy(text), {
      icon: Copy,
      shortcut: '⌘C',
    })
    .action(timestampLabel, () => handlers.onJumpTo(startTime), {
      icon: Clock,
    })
    .when(hasAudio, (builder) =>
      builder.action('Play segment', () => handlers.onPlay(startTime, endTime), {
        icon: Play,
      })
    )
    .separator()
    // Note and quote actions
    .action(hasNote ? 'Edit note' : 'Add note', () => handlers.onAddNote(segmentId), {
      icon: StickyNote,
      shortcut: '⌘N',
    })
    .action('Quote in minutes', () => handlers.onQuote(segmentId, text), {
      icon: Quote,
      shortcut: '⌘Q',
    })
    .action('Add comment', () => handlers.onComment(segmentId), {
      icon: MessageSquare,
    })
    .separator()
    // Organization actions
    .action(isBookmarked ? 'Remove bookmark' : 'Bookmark', () =>
      handlers.onBookmarkToggle(segmentId, !isBookmarked),
      {
        icon: Bookmark,
      }
    )
    .action(isFlagged ? 'Clear flag' : 'Flag for review', () =>
      handlers.onFlagToggle(segmentId, !isFlagged),
      {
        icon: Flag,
      }
    )
    .submenu('Highlight', (sub) =>
      sub
        .action('Yellow', () => handlers.onHighlight(segmentId, 'yellow'), {
          icon: Highlighter,
        })
        .action('Green', () => handlers.onHighlight(segmentId, 'green'), {
          icon: Highlighter,
        })
        .action('Blue', () => handlers.onHighlight(segmentId, 'blue'), {
          icon: Highlighter,
        })
        .action('Pink', () => handlers.onHighlight(segmentId, 'pink'), {
          icon: Highlighter,
        })
        .separator()
        .action('Remove highlight', () => handlers.onHighlight(segmentId, undefined))
    )
    .build();
}

// ============================================================================
// Default Handlers (for demo/development)
// ============================================================================

/**
 * Create placeholder handlers that log actions
 */
export function createMockTranscriptionSegmentHandlers(): TranscriptionSegmentMenuHandlers {
  return {
    onCopy: (text) => {
      navigator.clipboard?.writeText(text);
      console.log('[Menu] Copied text:', text.slice(0, 50) + '...');
    },
    onJumpTo: (time) => console.log('[Menu] Jump to:', time),
    onPlay: (start, end) => console.log('[Menu] Play segment:', start, '-', end),
    onAddNote: (id) => console.log('[Menu] Add note to:', id),
    onQuote: (id, text) => console.log('[Menu] Quote:', id, text.slice(0, 50)),
    onBookmarkToggle: (id, bookmarked) => console.log('[Menu] Bookmark:', id, bookmarked),
    onFlagToggle: (id, flagged) => console.log('[Menu] Flag:', id, flagged),
    onComment: (id) => console.log('[Menu] Comment on:', id),
    onHighlight: (id, color) => console.log('[Menu] Highlight:', id, color),
  };
}
