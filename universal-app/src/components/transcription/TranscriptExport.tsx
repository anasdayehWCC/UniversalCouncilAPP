'use client';

/**
 * TranscriptExport Component
 *
 * Export options panel for downloading transcripts
 * in various formats with customizable options.
 *
 * @module components/transcription/TranscriptExport
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileText,
  FileType2,
  File,
  Subtitles,
  Code2,
  Clock,
  User,
  CheckSquare,
  Square,
  ChevronDown,
  Loader2,
  Check,
} from 'lucide-react';
import type {
  TranscriptionResult,
  TranscriptExportFormat,
  TranscriptExportOptions,
  TranscriptSpeaker,
} from '@/lib/transcription';

// ============================================================================
// Types
// ============================================================================

export interface TranscriptExportProps {
  /** Transcription data to export */
  transcription: TranscriptionResult | null;
  /** Speakers for filtering */
  speakers?: TranscriptSpeaker[];
  /** Whether export is in progress */
  isExporting?: boolean;
  /** Callback when export is triggered */
  onExport?: (options: TranscriptExportOptions) => Promise<void>;
  /** Additional class names */
  className?: string;
}

interface FormatOption {
  format: TranscriptExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

// ============================================================================
// Format Definitions
// ============================================================================

const FORMAT_OPTIONS: FormatOption[] = [
  {
    format: 'txt',
    label: 'Plain Text',
    description: 'Simple text file, universal compatibility',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    format: 'docx',
    label: 'Microsoft Word',
    description: 'Formatted document with speaker labels',
    icon: <FileType2 className="w-5 h-5" />,
    badge: 'Popular',
  },
  {
    format: 'pdf',
    label: 'PDF Document',
    description: 'Print-ready, formatted document',
    icon: <File className="w-5 h-5" />,
  },
  {
    format: 'srt',
    label: 'SRT Subtitles',
    description: 'Standard subtitle format for video',
    icon: <Subtitles className="w-5 h-5" />,
  },
  {
    format: 'vtt',
    label: 'WebVTT',
    description: 'Web-native subtitle format',
    icon: <Subtitles className="w-5 h-5" />,
  },
  {
    format: 'json',
    label: 'JSON Data',
    description: 'Raw data for integrations',
    icon: <Code2 className="w-5 h-5" />,
  },
];

// ============================================================================
// Component
// ============================================================================

export function TranscriptExport({
  transcription,
  speakers = [],
  isExporting = false,
  onExport,
  className,
}: TranscriptExportProps) {
  const [selectedFormat, setSelectedFormat] = useState<TranscriptExportFormat>('docx');
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [includeSpeakers, setIncludeSpeakers] = useState(true);
  const [includeConfidence, setIncludeConfidence] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = useCallback(async () => {
    if (!onExport || !transcription) return;

    const options: TranscriptExportOptions = {
      format: selectedFormat,
      includeTimestamps,
      includeSpeakers,
      includeConfidence,
      includeMetadata,
      speakerFilter: selectedSpeakers.length > 0 ? selectedSpeakers : undefined,
      filename: `transcript-${transcription.recordingId}`,
    };

    try {
      await onExport(options);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [
    onExport,
    transcription,
    selectedFormat,
    includeTimestamps,
    includeSpeakers,
    includeConfidence,
    includeMetadata,
    selectedSpeakers,
  ]);

  const toggleSpeaker = useCallback((speakerId: string) => {
    setSelectedSpeakers(prev =>
      prev.includes(speakerId)
        ? prev.filter(id => id !== speakerId)
        : [...prev, speakerId]
    );
  }, []);

  if (!transcription) {
    return (
      <div className={cn('p-6 text-center text-slate-500', className)}>
        No transcription available to export.
      </div>
    );
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
            Export Transcript
          </span>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {transcription.wordCount || 0} words
        </Badge>
      </div>

      {/* Format Selection */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FORMAT_OPTIONS.map((option) => (
            <button
              key={option.format}
              onClick={() => setSelectedFormat(option.format)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                'hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]',
                selectedFormat === option.format
                  ? 'border-[var(--primary)] bg-[var(--primary-soft)] ring-2 ring-[var(--primary)]/20'
                  : 'border-slate-200 dark:border-slate-700'
              )}
            >
              <div className={cn(
                'text-slate-600 dark:text-slate-400',
                selectedFormat === option.format && 'text-[var(--primary)]'
              )}>
                {option.icon}
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {option.label}
                </div>
                {option.badge && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 mt-1 bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    {option.badge}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Selected Format Description */}
        <p className="text-xs text-slate-500 text-center">
          {FORMAT_OPTIONS.find(f => f.format === selectedFormat)?.description}
        </p>

        {/* Options Toggle */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center justify-center gap-1 w-full py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
        >
          <span>Export options</span>
          <ChevronDown className={cn(
            'w-4 h-4 transition-transform',
            showOptions && 'rotate-180'
          )} />
        </button>

        {/* Export Options */}
        {showOptions && (
          <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            {/* Include Options */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Include in export
              </span>

              <label className="flex items-center gap-3 cursor-pointer group">
                <button
                  onClick={() => setIncludeTimestamps(!includeTimestamps)}
                  className="focus:outline-none"
                >
                  {includeTimestamps ? (
                    <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                  )}
                </button>
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Timestamps
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <button
                  onClick={() => setIncludeSpeakers(!includeSpeakers)}
                  className="focus:outline-none"
                >
                  {includeSpeakers ? (
                    <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                  )}
                </button>
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Speaker labels
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <button
                  onClick={() => setIncludeConfidence(!includeConfidence)}
                  className="focus:outline-none"
                >
                  {includeConfidence ? (
                    <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                  )}
                </button>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Confidence scores
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <button
                  onClick={() => setIncludeMetadata(!includeMetadata)}
                  className="focus:outline-none"
                >
                  {includeMetadata ? (
                    <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                  )}
                </button>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Document header/metadata
                </span>
              </label>
            </div>

            {/* Speaker Filter */}
            {speakers.length > 1 && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Filter by speaker
                </span>
                <div className="flex flex-wrap gap-2">
                  {speakers.map((speaker) => (
                    <button
                      key={speaker.id}
                      onClick={() => toggleSpeaker(speaker.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                        selectedSpeakers.includes(speaker.id)
                          ? 'text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      )}
                      style={
                        selectedSpeakers.includes(speaker.id)
                          ? { backgroundColor: speaker.color }
                          : undefined
                      }
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: speaker.color }}
                      />
                      {speaker.label}
                    </button>
                  ))}
                </div>
                {selectedSpeakers.length > 0 && (
                  <button
                    onClick={() => setSelectedSpeakers([])}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting || !onExport}
          className={cn(
            'w-full h-11 gap-2 transition-all',
            exportSuccess && 'bg-emerald-600 hover:bg-emerald-700'
          )}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : exportSuccess ? (
            <>
              <Check className="w-4 h-4" />
              Downloaded!
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export as {FORMAT_OPTIONS.find(f => f.format === selectedFormat)?.label}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default TranscriptExport;
