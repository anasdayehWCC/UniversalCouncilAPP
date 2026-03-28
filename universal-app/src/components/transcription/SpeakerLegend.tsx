'use client';

/**
 * SpeakerLegend Component
 *
 * Displays all speakers with color-coded badges,
 * allows filtering and renaming speakers.
 *
 * @module components/transcription/SpeakerLegend
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Clock,
  MessageSquare,
  Pencil,
  Check,
  X,
  Filter,
  FilterX,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { TranscriptSpeaker } from '@/lib/transcription';

// ============================================================================
// Types
// ============================================================================

export interface SpeakerLegendProps {
  /** Array of speakers */
  speakers: TranscriptSpeaker[];
  /** Currently filtered speakers (empty = all) */
  filteredSpeakers?: string[];
  /** Callback when speaker filter is toggled */
  onToggleFilter?: (speakerId: string) => void;
  /** Callback when filter is cleared */
  onClearFilter?: () => void;
  /** Callback when speaker is renamed */
  onRenameSpeaker?: (speakerId: string, newLabel: string) => void;
  /** Whether the legend is collapsible */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Show detailed stats */
  showStats?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Utilities
// ============================================================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

function formatPercent(fraction: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((fraction / total) * 100)}%`;
}

// ============================================================================
// Individual Speaker Item
// ============================================================================

interface SpeakerItemProps {
  speaker: TranscriptSpeaker;
  isFiltered: boolean;
  onToggle?: () => void;
  onRename?: (newLabel: string) => void;
  showStats: boolean;
  totalDuration: number;
}

function SpeakerItem({
  speaker,
  isFiltered,
  onToggle,
  onRename,
  showStats,
  totalDuration,
}: SpeakerItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(speaker.label);

  const handleSave = useCallback(() => {
    if (editLabel.trim() && editLabel !== speaker.label) {
      onRename?.(editLabel.trim());
    }
    setIsEditing(false);
  }, [editLabel, speaker.label, onRename]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditLabel(speaker.label);
      setIsEditing(false);
    }
  }, [handleSave, speaker.label]);

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-2.5 rounded-lg transition-all',
        'hover:bg-slate-50 dark:hover:bg-slate-800/50',
        isFiltered && 'bg-[var(--primary-soft)] ring-1 ring-[var(--primary)]/20'
      )}
    >
      {/* Color Badge / Avatar */}
      <button
        onClick={onToggle}
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          'text-xs font-bold text-white shadow-sm',
          'transition-all hover:scale-110 cursor-pointer',
          isFiltered && 'ring-2 ring-offset-2 ring-[var(--primary)]'
        )}
        style={{ backgroundColor: speaker.color }}
        title={isFiltered ? 'Click to remove from filter' : 'Click to filter by this speaker'}
      >
        {speaker.label.charAt(0).toUpperCase()}
      </button>

      {/* Speaker Info */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="h-7 text-sm"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSave}
              className="h-7 w-7"
            >
              <Check className="w-3 h-3 text-emerald-600" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setEditLabel(speaker.label);
                setIsEditing(false);
              }}
              className="h-7 w-7"
            >
              <X className="w-3 h-3 text-red-500" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
              {speaker.label}
            </span>
            {onRename && (
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                title="Rename speaker"
              >
                <Pencil className="w-3 h-3 text-slate-500" />
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        {showStats && speaker.totalDuration !== undefined && (
          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(speaker.totalDuration)}
              <span className="text-slate-400">
                ({formatPercent(speaker.totalDuration, totalDuration)})
              </span>
            </span>
            {speaker.segmentCount !== undefined && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {speaker.segmentCount} segments
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter Indicator */}
      {isFiltered && (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0.5 bg-[var(--primary)] text-white border-0"
        >
          Active
        </Badge>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SpeakerLegend({
  speakers,
  filteredSpeakers = [],
  onToggleFilter,
  onClearFilter,
  onRenameSpeaker,
  collapsible = true,
  defaultCollapsed = false,
  showStats = true,
  className,
}: SpeakerLegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const totalDuration = speakers.reduce(
    (sum, s) => sum + (s.totalDuration || 0),
    0
  );

  const hasActiveFilter = filteredSpeakers.length > 0;

  if (speakers.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700',
        'shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3',
          'border-b border-slate-100 dark:border-slate-800',
          'bg-slate-50/50 dark:bg-slate-800/50'
        )}
      >
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
            Speakers
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
            {speakers.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear Filter */}
          {hasActiveFilter && onClearFilter && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearFilter}
              className="h-7 px-2 text-xs text-slate-500 hover:text-red-600"
            >
              <FilterX className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}

          {/* Collapse Toggle */}
          {collapsible && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-7 w-7"
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-2 space-y-1">
          {/* Filter Hint */}
          {onToggleFilter && !hasActiveFilter && (
            <div className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-2">
              <Filter className="w-3 h-3" />
              Click a speaker to filter the transcript
            </div>
          )}

          {/* Speaker List */}
          {speakers.map((speaker) => (
            <SpeakerItem
              key={speaker.id}
              speaker={speaker}
              isFiltered={filteredSpeakers.includes(speaker.id)}
              onToggle={onToggleFilter ? () => onToggleFilter(speaker.id) : undefined}
              onRename={onRenameSpeaker ? (newLabel) => onRenameSpeaker(speaker.id, newLabel) : undefined}
              showStats={showStats}
              totalDuration={totalDuration}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SpeakerLegend;
