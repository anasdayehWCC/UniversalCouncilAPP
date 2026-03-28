'use client';

/**
 * TranscriptSegment Component
 *
 * Displays a single transcript segment with speaker info,
 * timestamp, confidence indicator, and edit capabilities.
 *
 * @module components/transcription/TranscriptSegment
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pencil,
  Check,
  X,
  AlertCircle,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import type { TranscriptSegment as SegmentType, TranscriptSpeaker, SyncedSegment } from '@/lib/transcription';

// ============================================================================
// Types
// ============================================================================

export interface TranscriptSegmentProps {
  /** Segment data */
  segment: SegmentType | SyncedSegment;
  /** Speaker information */
  speaker: TranscriptSpeaker | undefined;
  /** Whether this segment is currently active (playing) */
  isActive?: boolean;
  /** Whether this segment is in edit mode */
  isEditing?: boolean;
  /** Whether search highlight should be shown */
  searchHighlight?: { start: number; end: number } | null;
  /** Whether to show confidence indicator */
  showConfidence?: boolean;
  /** Whether to show timestamp */
  showTimestamp?: boolean;
  /** Callback when timestamp is clicked */
  onSeek?: (time: number) => void;
  /** Callback when edit is started */
  onStartEdit?: () => void;
  /** Callback when edit is saved */
  onSaveEdit?: (newText: string) => void;
  /** Callback when edit is cancelled */
  onCancelEdit?: () => void;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get confidence level styling
 */
function getConfidenceLevel(confidence: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (confidence >= 0.9) {
    return { label: 'High', color: 'text-emerald-600', bgColor: 'bg-emerald-100' };
  }
  if (confidence >= 0.75) {
    return { label: 'Medium', color: 'text-amber-600', bgColor: 'bg-amber-100' };
  }
  return { label: 'Low', color: 'text-red-600', bgColor: 'bg-red-100' };
}

// ============================================================================
// Component
// ============================================================================

export function TranscriptSegment({
  segment,
  speaker,
  isActive = false,
  isEditing = false,
  searchHighlight = null,
  showConfidence = false,
  showTimestamp = true,
  onSeek,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  className,
}: TranscriptSegmentProps) {
  const [editText, setEditText] = useState(segment.text);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if segment is SyncedSegment
  const syncedSegment = 'isActive' in segment ? segment : null;
  const displayActive = syncedSegment?.isActive ?? isActive;

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  // Reset edit text when segment changes
  useEffect(() => {
    if (!isEditing) {
      setEditText(segment.text);
    }
  }, [segment.text, isEditing]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(segment.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy text');
    }
  }, [segment.text]);

  const handleSave = useCallback(() => {
    if (editText.trim() && onSaveEdit) {
      onSaveEdit(editText.trim());
    }
  }, [editText, onSaveEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancelEdit?.();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  }, [onCancelEdit, handleSave]);

  // Render text with search highlighting
  const renderText = () => {
    if (!searchHighlight) {
      return segment.text;
    }

    const before = segment.text.slice(0, searchHighlight.start);
    const match = segment.text.slice(searchHighlight.start, searchHighlight.end);
    const after = segment.text.slice(searchHighlight.end);

    return (
      <>
        {before}
        <mark className="bg-yellow-200 dark:bg-yellow-500/30 text-inherit rounded px-0.5">
          {match}
        </mark>
        {after}
      </>
    );
  };

  const confidenceLevel = getConfidenceLevel(segment.confidence);
  const speakerInitial = speaker?.label?.charAt(0).toUpperCase() || '?';

  return (
    <div
      className={cn(
        'group relative flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all duration-300',
        // Active state
        displayActive && 'bg-[var(--primary-soft)] ring-2 ring-[var(--primary)]/20 scale-[1.01]',
        // Past state (synced segment)
        syncedSegment?.isPast && !displayActive && 'opacity-75',
        // Hover state
        !displayActive && 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50',
        // Editing state
        isEditing && 'bg-slate-100 dark:bg-slate-800 ring-2 ring-[var(--accent)]',
        // Edited indicator
        segment.isEdited && 'border-l-2 border-amber-400',
        className
      )}
    >
      {/* Speaker Avatar */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center',
            'text-sm font-bold text-white shadow-sm',
            'transition-transform duration-300',
            displayActive && 'scale-110 shadow-lg'
          )}
          style={{ backgroundColor: speaker?.color || '#6366F1' }}
          title={speaker?.label || 'Unknown Speaker'}
        >
          {speakerInitial}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: Speaker name, timestamp, confidence */}
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          {/* Speaker Label */}
          <span
            className="text-xs sm:text-sm font-semibold truncate"
            style={{ color: speaker?.color || '#6366F1' }}
          >
            {speaker?.label || 'Unknown'}
          </span>

          {/* Timestamp */}
          {showTimestamp && (
            <button
              onClick={() => onSeek?.(segment.start)}
              className={cn(
                'flex items-center gap-1 text-[10px] sm:text-xs font-mono px-1.5 py-0.5 rounded-md',
                'text-slate-500 hover:text-[var(--primary)] hover:bg-[var(--primary-soft)]',
                'transition-colors cursor-pointer'
              )}
              title="Click to seek to this time"
            >
              <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {formatTimestamp(segment.start)}
            </button>
          )}

          {/* Confidence Badge */}
          {showConfidence && (
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1.5 py-0.5 h-auto',
                confidenceLevel.color,
                confidenceLevel.bgColor,
                'border-0'
              )}
            >
              {Math.round(segment.confidence * 100)}%
            </Badge>
          )}

          {/* Edited Indicator */}
          {segment.isEdited && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0.5 h-auto bg-amber-100 text-amber-700 border-0"
            >
              Edited
            </Badge>
          )}

          {/* Low Confidence Warning */}
          {segment.confidence < 0.75 && (
            <span title="Low confidence - may need review">
              <AlertCircle className="w-3 h-3 text-amber-500" />
            </span>
          )}
        </div>

        {/* Text Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                'w-full min-h-[80px] p-2 rounded-lg resize-none',
                'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600',
                'text-sm text-slate-800 dark:text-slate-200',
                'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]',
                'transition-all'
              )}
              placeholder="Enter corrected text..."
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Press <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">⌘↵</kbd> to save
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancelEdit}
                  className="h-7 px-2"
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!editText.trim() || editText === segment.text}
                  className="h-7 px-2"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p
            className={cn(
              'text-sm sm:text-base leading-relaxed',
              'text-slate-700 dark:text-slate-300',
              displayActive && 'text-slate-900 dark:text-white font-medium'
            )}
          >
            {renderText()}
          </p>
        )}
      </div>

      {/* Actions (visible on hover) */}
      {!isEditing && (
        <div
          className={cn(
            'absolute right-2 top-2 flex gap-1',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'sm:flex hidden' // Only show on larger screens
          )}
        >
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCopy}
            className="h-7 w-7 text-slate-400 hover:text-slate-600"
            title="Copy text"
          >
            {copied ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
          {onStartEdit && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onStartEdit}
              className="h-7 w-7 text-slate-400 hover:text-slate-600"
              title="Edit text"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Progress bar for active segment */}
      {syncedSegment?.isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-200"
            style={{ width: `${syncedSegment.progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default TranscriptSegment;
