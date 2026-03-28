/**
 * Transcription Types
 * 
 * Type definitions for transcription data with speaker diarization,
 * timestamps, and confidence scores.
 * 
 * @module lib/transcription/types
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Individual transcript segment with timing, speaker, and text
 */
export interface TranscriptSegment {
  /** Unique identifier for the segment */
  id: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Speaker identifier (references TranscriptSpeaker.id) */
  speaker: string;
  /** Transcribed text content */
  text: string;
  /** Confidence score (0-1) for the transcription */
  confidence: number;
  /** Whether this segment has been manually edited */
  isEdited?: boolean;
  /** Original text before any edits */
  originalText?: string;
  /** Timestamp of last edit */
  editedAt?: string;
  /** User who made the edit */
  editedBy?: string;
}

/**
 * Speaker information for diarization
 */
export interface TranscriptSpeaker {
  /** Unique speaker identifier */
  id: string;
  /** Display label (e.g., "Speaker 1", "Sarah", "Social Worker") */
  label: string;
  /** Color for visual differentiation (hex or CSS color) */
  color: string;
  /** Optional avatar URL */
  avatarUrl?: string;
  /** Optional role/title */
  role?: string;
  /** Total speaking time in seconds */
  totalDuration?: number;
  /** Number of segments spoken */
  segmentCount?: number;
}

/**
 * Complete transcription result with segments and metadata
 */
export interface TranscriptionResult {
  /** Recording/meeting ID this transcription belongs to */
  id: string;
  /** Recording ID reference */
  recordingId: string;
  /** Array of transcript segments in order */
  segments: TranscriptSegment[];
  /** Speaker information map */
  speakers: TranscriptSpeaker[];
  /** Total duration in seconds */
  duration: number;
  /** Detected language code (e.g., "en-GB") */
  language: string;
  /** Language confidence score */
  languageConfidence?: number;
  /** Overall transcription confidence */
  overallConfidence?: number;
  /** Processing timestamp */
  createdAt: string;
  /** Last updated timestamp */
  updatedAt?: string;
  /** Processing model used */
  model?: string;
  /** Processing mode (fast/economy) */
  processingMode?: 'fast' | 'economy';
  /** Word count */
  wordCount?: number;
}

/**
 * Transcription processing status
 */
export type TranscriptionStatus = 
  | 'pending'     // Queued for processing
  | 'processing'  // Currently being transcribed
  | 'completed'   // Successfully transcribed
  | 'failed';     // Transcription failed

/**
 * Transcription job metadata
 */
export interface TranscriptionJob {
  /** Job ID */
  id: string;
  /** Recording ID being processed */
  recordingId: string;
  /** Current status */
  status: TranscriptionStatus;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Error message if failed */
  error?: string;
  /** Job creation time */
  createdAt: string;
  /** Completion time */
  completedAt?: string;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
}

// ============================================================================
// Search & Filter Types
// ============================================================================

/**
 * Search result for transcript content
 */
export interface TranscriptSearchResult {
  /** Segment containing the match */
  segment: TranscriptSegment;
  /** Index of the segment in the array */
  segmentIndex: number;
  /** Starting character index of the match within the text */
  matchStart: number;
  /** Ending character index of the match */
  matchEnd: number;
  /** Highlighted text with match markers */
  highlightedText: string;
}

/**
 * Filter options for transcript display
 */
export interface TranscriptFilter {
  /** Filter by specific speakers */
  speakers?: string[];
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number;
  /** Time range start (seconds) */
  timeStart?: number;
  /** Time range end (seconds) */
  timeEnd?: number;
  /** Only show edited segments */
  editedOnly?: boolean;
}

// ============================================================================
// Export Types
// ============================================================================

/**
 * Export format options
 */
export type TranscriptExportFormat = 
  | 'txt'     // Plain text
  | 'docx'    // Microsoft Word
  | 'pdf'     // PDF document
  | 'srt'     // Subtitle format
  | 'vtt'     // WebVTT subtitle format
  | 'json';   // Raw JSON

/**
 * Export configuration options
 */
export interface TranscriptExportOptions {
  /** Output format */
  format: TranscriptExportFormat;
  /** Include timestamps */
  includeTimestamps: boolean;
  /** Include speaker labels */
  includeSpeakers: boolean;
  /** Include confidence scores */
  includeConfidence: boolean;
  /** Filter to specific speakers */
  speakerFilter?: string[];
  /** Custom filename (without extension) */
  filename?: string;
  /** Include header with metadata */
  includeMetadata?: boolean;
}

// ============================================================================
// Playback Sync Types
// ============================================================================

/**
 * Current playback state for sync
 */
export interface PlaybackState {
  /** Whether audio is playing */
  isPlaying: boolean;
  /** Current playback time in seconds */
  currentTime: number;
  /** Audio duration in seconds */
  duration: number;
  /** Playback speed (1.0 = normal) */
  playbackRate: number;
}

/**
 * Segment with playback sync state
 */
export interface SyncedSegment extends TranscriptSegment {
  /** Whether this segment is currently active/playing */
  isActive: boolean;
  /** Whether this segment is in the past */
  isPast: boolean;
  /** Progress through segment (0-1) */
  progress: number;
}

// ============================================================================
// Edit Types
// ============================================================================

/**
 * Edit operation for transcript corrections
 */
export interface TranscriptEdit {
  /** Segment ID being edited */
  segmentId: string;
  /** Original text */
  originalText: string;
  /** New corrected text */
  newText: string;
  /** Timestamp of edit */
  timestamp: string;
  /** User who made the edit */
  userId: string;
}

/**
 * Edit history entry
 */
export interface TranscriptEditHistory {
  /** Edit ID */
  id: string;
  /** Transcription ID */
  transcriptionId: string;
  /** Array of edits */
  edits: TranscriptEdit[];
  /** Version number */
  version: number;
  /** Created timestamp */
  createdAt: string;
}

// ============================================================================
// Speaker Colors Preset
// ============================================================================

/**
 * Default speaker colors for visual differentiation
 * Using colors that work well in both light and dark modes
 */
export const SPEAKER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#EF4444', // Red
] as const;

/**
 * Get color for speaker by index
 */
export function getSpeakerColor(index: number): string {
  return SPEAKER_COLORS[index % SPEAKER_COLORS.length];
}
