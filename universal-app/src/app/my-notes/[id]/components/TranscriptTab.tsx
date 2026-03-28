'use client';

/**
 * TranscriptTab Component
 *
 * Recording detail transcript tab that integrates the TranscriptViewer
 * with the useTranscription hook for a complete experience.
 *
 * @module app/my-notes/[id]/components/TranscriptTab
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TranscriptViewer } from '@/components/transcription';
import { useTranscription } from '@/hooks/useTranscription';
import type { TranscriptExportOptions } from '@/lib/transcription';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

// ============================================================================
// Types
// ============================================================================

export interface TranscriptTabProps {
  /** Recording/meeting ID */
  recordingId: string;
  /** Fallback transcript data (legacy format) */
  legacyTranscript?: Array<{
    speaker: string;
    text: string;
    timestamp: string;
  }>;
  /** Audio URL if available */
  audioUrl?: string;
  /** Duration string (legacy format) */
  duration?: string;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Utils
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

// ============================================================================
// Component
// ============================================================================

export function TranscriptTab({
  recordingId,
  legacyTranscript,
  audioUrl,
  duration,
  className,
}: TranscriptTabProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize the transcription hook
  const {
    transcription,
    isLoading,
    error,
    syncedSegments,
    activeSegmentIndex,
    editingSegmentId,
    searchQuery,
    searchResults,
    currentSearchIndex,
    filter,
    playback,
    loadTranscription,
    search,
    clearSearch,
    nextSearchResult,
    prevSearchResult,
    toggleSpeakerFilter,
    clearFilter,
    renameSpeaker,
    seekTo,
    startEditing,
    saveEdit,
    cancelEdit,
    updatePlayback,
  } = useTranscription({
    audioRef: audioRef as React.RefObject<HTMLAudioElement>,
    autoScroll: true,
  });

  // Load transcription on mount
  useEffect(() => {
    loadTranscription(recordingId);
  }, [recordingId, loadTranscription]);

  // Handle export
  const handleExport = async (options: TranscriptExportOptions) => {
    if (!transcription) return;

    // Generate content based on format
    let content = '';
    const segments = options.speakerFilter
      ? transcription.segments.filter(s => options.speakerFilter?.includes(s.speaker))
      : transcription.segments;

    const getSpeakerLabel = (speakerId: string) => {
      return transcription.speakers.find(s => s.id === speakerId)?.label || 'Unknown';
    };

    switch (options.format) {
      case 'txt':
        if (options.includeMetadata) {
          content += `Transcript Export\n`;
          content += `Generated: ${new Date().toLocaleString()}\n`;
          content += `Duration: ${formatTime(transcription.duration)}\n`;
          content += `Language: ${transcription.language}\n\n`;
          content += '─'.repeat(50) + '\n\n';
        }

        segments.forEach(segment => {
          const timestamp = options.includeTimestamps
            ? `[${formatTime(segment.start)}] `
            : '';
          const speaker = options.includeSpeakers
            ? `${getSpeakerLabel(segment.speaker)}: `
            : '';
          const confidence = options.includeConfidence
            ? ` (${Math.round(segment.confidence * 100)}%)`
            : '';
          
          content += `${timestamp}${speaker}${segment.text}${confidence}\n\n`;
        });
        break;

      case 'srt':
        segments.forEach((segment, index) => {
          const formatSrtTime = (s: number) => {
            const hrs = Math.floor(s / 3600);
            const mins = Math.floor((s % 3600) / 60);
            const secs = Math.floor(s % 60);
            const ms = Math.floor((s % 1) * 1000);
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
          };

          content += `${index + 1}\n`;
          content += `${formatSrtTime(segment.start)} --> ${formatSrtTime(segment.end)}\n`;
          if (options.includeSpeakers) {
            content += `<v ${getSpeakerLabel(segment.speaker)}>`;
          }
          content += `${segment.text}\n\n`;
        });
        break;

      case 'vtt':
        content = 'WEBVTT\n\n';
        segments.forEach(segment => {
          const formatVttTime = (s: number) => {
            const hrs = Math.floor(s / 3600);
            const mins = Math.floor((s % 3600) / 60);
            const secs = Math.floor(s % 60);
            const ms = Math.floor((s % 1) * 1000);
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
          };

          content += `${formatVttTime(segment.start)} --> ${formatVttTime(segment.end)}\n`;
          if (options.includeSpeakers) {
            content += `<v ${getSpeakerLabel(segment.speaker)}>`;
          }
          content += `${segment.text}\n\n`;
        });
        break;

      case 'json':
        content = JSON.stringify({
          ...transcription,
          exportedAt: new Date().toISOString(),
          exportOptions: options,
        }, null, 2);
        break;

      default:
        // For docx and pdf, we'd need a library like docx or pdfkit
        // For now, fallback to txt
        content = segments.map(s => `${getSpeakerLabel(s.speaker)}: ${s.text}`).join('\n\n');
    }

    // Create download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${options.filename || 'transcript'}.${options.format === 'json' ? 'json' : options.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle seek with audio element
  const handleSeek = (time: number) => {
    seekTo(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
    }
  };

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Hidden audio element for playback control */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          className="hidden"
          preload="metadata"
        />
      )}

      {/* Full Transcript Viewer */}
      <TranscriptViewer
        transcription={transcription}
        isLoading={isLoading}
        error={error}
        syncedSegments={syncedSegments}
        activeSegmentIndex={activeSegmentIndex}
        editingSegmentId={editingSegmentId}
        searchQuery={searchQuery}
        searchResults={searchResults}
        currentSearchIndex={currentSearchIndex}
        filter={filter}
        audioRef={audioRef as React.RefObject<HTMLAudioElement>}
        playback={playback}
        showConfidence={true}
        showSpeakers={true}
        showExport={true}
        onSeek={handleSeek}
        onSearch={search}
        onClearSearch={clearSearch}
        onNextSearchResult={nextSearchResult}
        onPrevSearchResult={prevSearchResult}
        onToggleSpeakerFilter={toggleSpeakerFilter}
        onClearFilter={clearFilter}
        onRenameSpeaker={renameSpeaker}
        onStartEdit={startEditing}
        onSaveEdit={saveEdit}
        onCancelEdit={cancelEdit}
        onExport={handleExport}
        className="flex-1 min-h-0"
      />
    </div>
  );
}

export default TranscriptTab;
