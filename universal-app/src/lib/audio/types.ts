/**
 * Audio Recording Types
 *
 * Type definitions for audio recording functionality.
 * Supports offline-first capture for social care meetings.
 *
 * @module lib/audio/types
 */

// ============================================================================
// Recording State
// ============================================================================

/**
 * Current state of the audio recorder
 */
export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

/**
 * Audio format for recording
 */
export type AudioFormat = 'webm' | 'opus' | 'mp3' | 'wav';

/**
 * Audio quality presets
 */
export type AudioQuality = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Audio quality configuration
 */
export interface AudioQualityConfig {
  /** Quality preset name */
  name: AudioQuality;
  /** Display label */
  label: string;
  /** Audio bitrate in kbps */
  bitrate: number;
  /** Sample rate in Hz */
  sampleRate: number;
  /** Number of audio channels (1 = mono, 2 = stereo) */
  channels: number;
  /** Estimated file size per minute in MB */
  sizePerMinuteMB: number;
  /** Description of use case */
  description: string;
}

/**
 * Quality presets for different use cases
 */
export const QUALITY_PRESETS: Record<AudioQuality, AudioQualityConfig> = {
  low: {
    name: 'low',
    label: 'Economy',
    bitrate: 32,
    sampleRate: 22050,
    channels: 1,
    sizePerMinuteMB: 0.24,
    description: 'Best for limited storage or bandwidth',
  },
  medium: {
    name: 'medium',
    label: 'Standard',
    bitrate: 64,
    sampleRate: 44100,
    channels: 1,
    sizePerMinuteMB: 0.48,
    description: 'Good balance of quality and size',
  },
  high: {
    name: 'high',
    label: 'High Quality',
    bitrate: 128,
    sampleRate: 44100,
    channels: 1,
    sizePerMinuteMB: 0.96,
    description: 'Recommended for transcription accuracy',
  },
  ultra: {
    name: 'ultra',
    label: 'Ultra',
    bitrate: 256,
    sampleRate: 48000,
    channels: 2,
    sizePerMinuteMB: 1.92,
    description: 'Maximum quality for archival',
  },
};

// ============================================================================
// Recording Metadata
// ============================================================================

/**
 * Metadata about a recording
 */
export interface RecordingMetadata {
  /** Unique identifier for the recording */
  id: string;
  /** Recording duration in seconds */
  duration: number;
  /** File size in bytes */
  size: number;
  /** Audio format used */
  format: AudioFormat;
  /** Quality preset used */
  quality: AudioQuality;
  /** Audio bitrate in kbps */
  bitrate: number;
  /** Sample rate in Hz */
  sampleRate: number;
  /** Number of channels */
  channels: number;
  /** Recording start timestamp */
  startedAt: Date;
  /** Recording end timestamp */
  endedAt?: Date;
  /** Paused duration in seconds */
  pausedDuration: number;
}

/**
 * Case/subject metadata for a recording
 */
export interface CaseMetadata {
  /** Case reference number */
  caseReference: string;
  /** Subject initials (privacy-safe) */
  subjectInitials?: string;
  /** Subject date of birth */
  subjectDob?: string;
  /** Service domain (children, adults, housing) */
  serviceDomain?: string;
  /** Template ID for minute generation */
  templateId?: string;
  /** Template name */
  templateName?: string;
  /** Visit type */
  visitType?: string;
  /** Meeting mode */
  meetingMode?: 'in_person' | 'online';
  /** Intended outcomes */
  intendedOutcomes?: string;
  /** Risk flags */
  riskFlags?: string;
  /** Additional notes */
  notes?: string;
  /** Consent acknowledged */
  consentAcknowledged?: boolean;
  /** Recording timestamp */
  recordedAt: Date;
  /** Recorder (worker) name */
  recorderName?: string;
  /** Recorder (worker) ID */
  recorderId?: string;
  /** Worker team */
  workerTeam?: string;
}

// ============================================================================
// Audio Devices
// ============================================================================

/**
 * Audio input device information
 */
export interface AudioDevice {
  /** Device ID */
  deviceId: string;
  /** Device label/name */
  label: string;
  /** Device kind (audioinput, audiooutput) */
  kind: MediaDeviceKind;
  /** Group ID for related devices */
  groupId: string;
  /** Whether this is the default device */
  isDefault: boolean;
  /** Whether the device is currently active */
  isActive: boolean;
}

/**
 * Audio permission state
 */
export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unknown';

/**
 * Audio permission status
 */
export interface AudioPermissionStatus {
  /** Current permission state */
  state: PermissionState;
  /** Whether permission has been requested */
  hasRequested: boolean;
  /** Error message if permission denied */
  errorMessage?: string;
}

// ============================================================================
// Audio Levels
// ============================================================================

/**
 * Real-time audio level data
 */
export interface AudioLevelData {
  /** Current audio level (0-1) */
  level: number;
  /** Peak level since last reset */
  peak: number;
  /** Average level over recent samples */
  average: number;
  /** Whether audio is clipping */
  isClipping: boolean;
  /** Whether audio is too quiet */
  isTooQuiet: boolean;
  /** Timestamp of measurement */
  timestamp: number;
}

/**
 * Waveform data for visualization
 */
export interface WaveformData {
  /** Array of amplitude values (0-255) */
  data: Uint8Array;
  /** FFT size used */
  fftSize: number;
  /** Timestamp of sample */
  timestamp: number;
}

// ============================================================================
// Recorder Events
// ============================================================================

/**
 * Events emitted by the audio recorder
 */
export interface RecorderEvents {
  /** Recording state changed */
  stateChange: (state: RecordingState) => void;
  /** Audio level update */
  levelUpdate: (data: AudioLevelData) => void;
  /** Duration update (every second while recording) */
  durationUpdate: (durationSeconds: number) => void;
  /** Error occurred */
  error: (error: RecorderError) => void;
  /** Recording data available */
  dataAvailable: (blob: Blob) => void;
  /** Device list changed */
  devicesChanged: (devices: AudioDevice[]) => void;
  /** Recording complete */
  complete: (recording: CompletedRecording) => void;
}

/**
 * Recorder error types
 */
export type RecorderErrorType =
  | 'permission_denied'
  | 'device_not_found'
  | 'device_in_use'
  | 'not_supported'
  | 'encoding_error'
  | 'no_audio_detected'
  | 'storage_full'
  | 'unknown';

/**
 * Recorder error
 */
export interface RecorderError {
  /** Error type */
  type: RecorderErrorType;
  /** Error message */
  message: string;
  /** Original error */
  originalError?: Error;
  /** Recoverable flag */
  recoverable: boolean;
  /** Recovery suggestion */
  recoverySuggestion?: string;
}

// ============================================================================
// Completed Recording
// ============================================================================

/**
 * A completed recording ready for queue/upload
 */
export interface CompletedRecording {
  /** Recording ID */
  id: string;
  /** Audio blob */
  blob: Blob;
  /** File name */
  fileName: string;
  /** MIME type */
  mimeType: string;
  /** Recording metadata */
  metadata: RecordingMetadata;
  /** Case metadata (optional) */
  caseMetadata?: CaseMetadata;
}

// ============================================================================
// Recorder Options
// ============================================================================

/**
 * Options for initializing the audio recorder
 */
export interface RecorderOptions {
  /** Quality preset */
  quality?: AudioQuality;
  /** Custom bitrate (overrides quality preset) */
  bitrate?: number;
  /** Custom sample rate (overrides quality preset) */
  sampleRate?: number;
  /** Number of channels */
  channels?: number;
  /** Preferred audio format */
  format?: AudioFormat;
  /** Device ID to use */
  deviceId?: string;
  /** Enable echo cancellation */
  echoCancellation?: boolean;
  /** Enable noise suppression */
  noiseSuppression?: boolean;
  /** Enable auto gain control */
  autoGainControl?: boolean;
  /** Data chunk interval in ms */
  chunkIntervalMs?: number;
  /** Maximum recording duration in seconds (0 = unlimited) */
  maxDurationSeconds?: number;
  /** Silence detection threshold (0-1) */
  silenceThreshold?: number;
}

/**
 * Default recorder options
 */
export const DEFAULT_RECORDER_OPTIONS: Required<RecorderOptions> = {
  quality: 'high',
  bitrate: 128,
  sampleRate: 44100,
  channels: 1,
  format: 'webm',
  deviceId: 'default',
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  chunkIntervalMs: 1000,
  maxDurationSeconds: 0,
  silenceThreshold: 0.01,
};
