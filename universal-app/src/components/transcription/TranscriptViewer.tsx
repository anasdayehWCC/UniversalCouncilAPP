'use client';

/**
 * TranscriptViewer Component
 *
 * Main viewer component for transcription display with:
 * - Timestamped segments with click-to-seek
 * - Speaker diarization with colors
 * - Real-time playback highlighting
 * - Search functionality
 * - Copy and edit capabilities
 *
 * @module components/transcription/TranscriptViewer
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Settings2,
  Maximize2,
  FileText,
  Clock,
  Languages,
  Sparkles,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { TranscriptSegment } from './TranscriptSegment';
import { TranscriptSearch } from './TranscriptSearch';
import { SpeakerLegend } from './SpeakerLegend';
import { TranscriptExport } from './TranscriptExport';
import type {
  TranscriptionResult,
  SyncedSegment,
  TranscriptSearchResult,
  TranscriptFilter,
  TranscriptExportOptions,
} from '@/lib/transcription';

// ============================================================================
// Types
// ============================================================================

export interface TranscriptViewerProps {
  /** Transcription data */
  transcription: TranscriptionResult | null;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Synced segments with playback state */
  syncedSegments?: SyncedSegment[];
  /** Active segment index */
  activeSegmentIndex?: number;
  /** Segment currently being edited */
  editingSegmentId?: string | null;
  /** Search query */
  searchQuery?: string;
  /** Search results */
  searchResults?: TranscriptSearchResult[];
  /** Current search result index */
  currentSearchIndex?: number;
  /** Active filter */
  filter?: TranscriptFilter;
  /** Audio ref for playback controls */
  audioRef?: React.RefObject<HTMLAudioElement>;
  /** Current playback state */
  playback?: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    playbackRate: number;
  };
  /** Whether to show confidence indicators */
  showConfidence?: boolean;
  /** Whether to show the speakers sidebar */
  showSpeakers?: boolean;
  /** Whether to show the export panel */
  showExport?: boolean;
  /** Layout mode */
  layout?: 'default' | 'compact' | 'fullscreen';
  /** Callbacks */
  onSeek?: (time: number) => void;
  onSearch?: (query: string) => void;
  onClearSearch?: () => void;
  onNextSearchResult?: () => void;
  onPrevSearchResult?: () => void;
  onToggleSpeakerFilter?: (speakerId: string) => void;
  onClearFilter?: () => void;
  onRenameSpeaker?: (speakerId: string, newLabel: string) => void;
  onStartEdit?: (segmentId: string) => void;
  onSaveEdit?: (segmentId: string, newText: string) => void;
  onCancelEdit?: () => void;
  onExport?: (options: TranscriptExportOptions) => Promise<void>;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Utilities
// ============================================================================

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function TranscriptSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function TranscriptEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-muted dark:bg-muted flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground dark:text-muted-foreground mb-2">
        No transcript available
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        The transcript will appear here once the recording has been processed.
      </p>
    </div>
  );
}

// ============================================================================
// Error State
// ============================================================================

function TranscriptError({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-medium text-red-700 dark:text-red-400 mb-2">
        Failed to load transcript
      </h3>
      <p className="text-sm text-red-600/80 max-w-sm">
        {error.message || 'An error occurred while loading the transcript.'}
      </p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TranscriptViewer({
  transcription,
  isLoading = false,
  error = null,
  syncedSegments = [],
  activeSegmentIndex = -1,
  editingSegmentId = null,
  searchQuery = '',
  searchResults = [],
  currentSearchIndex = 0,
  filter = {},
  audioRef,
  playback = { isPlaying: false, currentTime: 0, duration: 0, playbackRate: 1 },
  showConfidence = false,
  showSpeakers = true,
  showExport = false,
  layout = 'default',
  onSeek,
  onSearch,
  onClearSearch,
  onNextSearchResult,
  onPrevSearchResult,
  onToggleSpeakerFilter,
  onClearFilter,
  onRenameSpeaker,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onExport,
  className,
}: TranscriptViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Get speaker for a segment
  const getSpeaker = useCallback((speakerId: string) => {
    return transcription?.speakers.find(s => s.id === speakerId);
  }, [transcription?.speakers]);

  // Get search highlight for a segment
  const getSearchHighlight = useCallback((segmentId: string) => {
    if (!searchQuery || searchResults.length === 0) return null;
    
    const currentResult = searchResults[currentSearchIndex];
    if (currentResult?.segment.id === segmentId) {
      return {
        start: currentResult.matchStart,
        end: currentResult.matchEnd,
      };
    }
    return null;
  }, [searchQuery, searchResults, currentSearchIndex]);

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentIndex < 0 || !transcription) return;

    const segment = transcription.segments[activeSegmentIndex];
    if (!segment) return;

    const element = segmentRefs.current.get(segment.id);
    if (element && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // Check if element is not visible
      if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeSegmentIndex, transcription]);

  // Auto-scroll to search result
  useEffect(() => {
    if (searchResults.length === 0) return;

    const currentResult = searchResults[currentSearchIndex];
    if (!currentResult) return;

    const element = segmentRefs.current.get(currentResult.segment.id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSearchIndex, searchResults]);

  // Segments to display (synced or raw)
  const displaySegments = useMemo(() => {
    if (syncedSegments.length > 0) {
      return syncedSegments;
    }
    return transcription?.segments || [];
  }, [syncedSegments, transcription?.segments]);

  // Player controls
  const handlePlayPause = useCallback(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    if (playback.isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [audioRef, playback.isPlaying]);

  const handleSkipBack = useCallback(() => {
    const audio = audioRef?.current;
    if (audio) {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    }
  }, [audioRef]);

  const handleSkipForward = useCallback(() => {
    const audio = audioRef?.current;
    if (audio) {
      audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    }
  }, [audioRef]);

  const handleSliderChange = useCallback((value: number[]) => {
    const time = (value[0] / 100) * playback.duration;
    onSeek?.(time);
  }, [playback.duration, onSeek]);

  const sliderValue = useMemo(() => {
    if (playback.duration === 0) return [0];
    return [(playback.currentTime / playback.duration) * 100];
  }, [playback.currentTime, playback.duration]);

  return (
    <div
      className={cn(
        'flex flex-col lg:flex-row gap-4 h-full',
        layout === 'fullscreen' && 'fixed inset-0 z-50 bg-background dark:bg-background p-4',
        className
      )}
    >
      {/* Main Content */}
      <Card
        variant="glass"
        className={cn(
          'flex flex-col flex-1 min-w-0 overflow-hidden',
          'backdrop-blur-xl bg-background/80 dark:bg-background/90'
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border/50 dark:border-border/50 bg-muted/50 dark:bg-muted/80">
          {/* Metadata Row */}
          {transcription && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Badge variant="outline" className="gap-1.5 bg-background/50 dark:bg-muted/50">
                <Clock className="w-3 h-3" />
                {formatDuration(transcription.duration)}
              </Badge>
              <Badge variant="outline" className="gap-1.5 bg-background/50 dark:bg-muted/50">
                <Languages className="w-3 h-3" />
                {transcription.language}
              </Badge>
              {transcription.overallConfidence && (
                <Badge
                  variant="outline"
                  className={cn(
                    'gap-1.5',
                    transcription.overallConfidence >= 0.9
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : transcription.overallConfidence >= 0.75
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  {Math.round(transcription.overallConfidence * 100)}% confidence
                </Badge>
              )}
              <Badge variant="secondary" className="ml-auto">
                {transcription.wordCount} words
              </Badge>
            </div>
          )}

          {/* Search Bar */}
          <div className="px-4 py-2">
            <TranscriptSearch
              value={searchQuery}
              results={searchResults}
              currentIndex={currentSearchIndex}
              onChange={onSearch}
              onClear={onClearSearch}
              onNext={onNextSearchResult}
              onPrev={onPrevSearchResult}
              compact
            />
          </div>

          {/* Audio Player Controls */}
          {audioRef?.current && (
            <div className="flex items-center gap-3 px-4 py-3 border-t border-border/30 dark:border-border/30">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSkipBack}
                className="h-8 w-8"
                aria-label="Skip back 10 seconds"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                size="icon"
                onClick={handlePlayPause}
                className="h-10 w-10 rounded-full shadow-md"
                aria-label={playback.isPlaying ? 'Pause' : 'Play'}
              >
                {playback.isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={handleSkipForward}
                className="h-8 w-8"
                aria-label="Skip forward 10 seconds"
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <div className="flex-1 flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-12">
                  {formatTime(playback.currentTime)}
                </span>
                <Slider
                  value={sliderValue}
                  onValueChange={handleSliderChange}
                  max={100}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-xs font-mono text-muted-foreground w-12 text-right">
                  {formatTime(playback.duration)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Transcript Content */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          {isLoading ? (
            <TranscriptSkeleton />
          ) : error ? (
            <TranscriptError error={error} />
          ) : !transcription || displaySegments.length === 0 ? (
            <TranscriptEmpty />
          ) : (
            <div className="p-4 space-y-1">
              {displaySegments.map((segment, index) => {
                const isSynced = 'isActive' in segment;
                const isActive = isSynced ? (segment.isActive as boolean) : index === activeSegmentIndex;

                return (
                  <div
                    key={segment.id}
                    ref={(el) => {
                      if (el) {
                        segmentRefs.current.set(segment.id, el);
                      }
                    }}
                  >
                    <TranscriptSegment
                      segment={segment}
                      speaker={getSpeaker(segment.speaker)}
                      isActive={isActive}
                      isEditing={editingSegmentId === segment.id}
                      searchHighlight={getSearchHighlight(segment.id)}
                      showConfidence={showConfidence}
                      showTimestamp={true}
                      onSeek={onSeek}
                      onStartEdit={onStartEdit ? () => onStartEdit(segment.id) : undefined}
                      onSaveEdit={onSaveEdit ? (text) => onSaveEdit(segment.id, text) : undefined}
                      onCancelEdit={onCancelEdit}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Sidebar */}
      {(showSpeakers || showExport) && transcription && (
        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
          {/* Speaker Legend */}
          {showSpeakers && (
            <SpeakerLegend
              speakers={transcription.speakers}
              filteredSpeakers={filter.speakers}
              onToggleFilter={onToggleSpeakerFilter}
              onClearFilter={onClearFilter}
              onRenameSpeaker={onRenameSpeaker}
              showStats={true}
            />
          )}

          {/* Export Panel */}
          {showExport && (
            <TranscriptExport
              transcription={transcription}
              speakers={transcription.speakers}
              onExport={onExport}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default TranscriptViewer;
