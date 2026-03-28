/**
 * File Upload System Types
 *
 * Type definitions for the comprehensive file upload system.
 * Supports chunked uploads, resume capability, and queue management.
 *
 * @module lib/upload/types
 */

// ============================================================================
// Upload Status & State
// ============================================================================

/**
 * Status of an upload operation
 */
export type UploadStatus =
  | 'pending'
  | 'validating'
  | 'preparing'
  | 'uploading'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Upload priority levels
 */
export type UploadPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Chunk upload state for resumable uploads
 */
export interface ChunkState {
  /** Total number of chunks */
  totalChunks: number;
  /** Currently uploaded chunks (indices) */
  uploadedChunks: number[];
  /** Size of each chunk in bytes */
  chunkSize: number;
  /** Current chunk being uploaded */
  currentChunk: number;
  /** Session URL for resumable upload */
  sessionUrl?: string;
  /** Session expiration time */
  sessionExpiresAt?: Date;
}

/**
 * Progress information for an upload
 */
export interface UploadProgress {
  /** Unique upload ID */
  uploadId: string;
  /** File name */
  fileName: string;
  /** Bytes uploaded so far */
  bytesUploaded: number;
  /** Total file size in bytes */
  totalBytes: number;
  /** Upload percentage (0-100) */
  percentage: number;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
  /** Upload speed in bytes per second */
  speed?: number;
  /** Current status */
  status: UploadStatus;
  /** Chunk state for resumable uploads */
  chunkState?: ChunkState;
  /** Start time */
  startedAt?: Date;
  /** Last update time */
  updatedAt?: Date;
}

// ============================================================================
// Upload Item & Queue
// ============================================================================

/**
 * Individual file upload item
 */
export interface UploadItem {
  /** Unique upload identifier */
  id: string;
  /** The file to upload */
  file: File;
  /** Upload status */
  status: UploadStatus;
  /** Upload progress */
  progress: UploadProgress;
  /** Upload priority */
  priority: UploadPriority;
  /** Number of retry attempts */
  retryCount: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Error message if failed */
  error?: string;
  /** Error code for specific failures */
  errorCode?: UploadErrorCode;
  /** Validation result */
  validation?: ValidationResult;
  /** Chunk state for large files */
  chunkState?: ChunkState;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Destination path/folder */
  destination?: string;
  /** Upload URL */
  uploadUrl?: string;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
  /** Whether this is a resumable upload */
  resumable: boolean;
  /** Abort controller for cancellation */
  abortController?: AbortController;
}

/**
 * Upload queue stats
 */
export interface QueueStats {
  /** Total items in queue */
  total: number;
  /** Pending uploads */
  pending: number;
  /** Currently uploading */
  uploading: number;
  /** Completed uploads */
  completed: number;
  /** Failed uploads */
  failed: number;
  /** Paused uploads */
  paused: number;
  /** Total bytes to upload */
  totalBytes: number;
  /** Bytes uploaded so far */
  uploadedBytes: number;
  /** Overall progress percentage */
  overallProgress: number;
  /** Active upload count */
  activeUploads: number;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Supported audio formats with magic bytes
 */
export interface AudioFormatSignature {
  /** MIME type */
  mimeType: string;
  /** Magic bytes at file start */
  magicBytes: number[];
  /** Offset to check magic bytes */
  offset?: number;
  /** Human-readable format name */
  formatName: string;
}

/**
 * Validation rule for files
 */
export interface ValidationRule {
  /** Rule identifier */
  id: string;
  /** Rule description */
  description: string;
  /** Validation function */
  validate: (file: File, content?: ArrayBuffer) => Promise<boolean>;
  /** Error message if validation fails */
  errorMessage: string;
  /** Whether this rule requires reading file content */
  requiresContent?: boolean;
}

/**
 * Result of file validation
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** List of passed rules */
  passed: string[];
  /** List of failed rules with messages */
  failed: ValidationFailure[];
  /** Detected MIME type */
  detectedMimeType?: string;
  /** Detected audio format */
  detectedFormat?: string;
  /** File metadata extracted during validation */
  metadata?: FileMetadata;
}

/**
 * Validation failure details
 */
export interface ValidationFailure {
  /** Rule ID that failed */
  ruleId: string;
  /** Error message */
  message: string;
  /** Whether this is a blocking error */
  blocking: boolean;
}

/**
 * File metadata extracted during validation
 */
export interface FileMetadata {
  /** File duration in seconds (for audio/video) */
  duration?: number;
  /** Audio channels (for audio files) */
  channels?: number;
  /** Sample rate in Hz (for audio files) */
  sampleRate?: number;
  /** Bitrate in kbps */
  bitrate?: number;
  /** Image/video dimensions */
  dimensions?: { width: number; height: number };
  /** Codec information */
  codec?: string;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Upload manager configuration
 */
export interface UploadManagerConfig {
  /** API base URL */
  apiBaseUrl: string;
  /** Maximum concurrent uploads */
  maxConcurrentUploads: number;
  /** Chunk size for large files (bytes) */
  chunkSize: number;
  /** File size threshold for chunked uploads (bytes) */
  chunkThreshold: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay base (ms) */
  retryDelayBase: number;
  /** Request timeout (ms) */
  timeout: number;
  /** Whether to enable resumable uploads */
  enableResumable: boolean;
  /** IndexedDB persistence */
  persistQueue: boolean;
  /** Auto-start uploads on add */
  autoStart: boolean;
  /** Validation configuration */
  validation: ValidationConfig;
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Allowed MIME types */
  allowedMimeTypes: string[];
  /** Allowed file extensions */
  allowedExtensions: string[];
  /** Whether to perform content validation */
  validateContent: boolean;
  /** Whether to scan for audio format */
  validateAudioFormat: boolean;
}

/**
 * Default upload manager configuration
 */
export const DEFAULT_UPLOAD_CONFIG: UploadManagerConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  maxConcurrentUploads: 3,
  chunkSize: 5 * 1024 * 1024, // 5MB chunks
  chunkThreshold: 10 * 1024 * 1024, // Use chunked upload for files > 10MB
  maxRetries: 3,
  retryDelayBase: 1000,
  timeout: 60000,
  enableResumable: true,
  persistQueue: true,
  autoStart: true,
  validation: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/webm',
      'audio/ogg',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
      'audio/aac',
      'video/mp4',
      'video/webm',
    ],
    allowedExtensions: ['.mp3', '.wav', '.webm', '.ogg', '.m4a', '.mp4', '.aac'],
    validateContent: true,
    validateAudioFormat: true,
  },
};

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Upload error codes
 */
export type UploadErrorCode =
  | 'FILE_TOO_LARGE'
  | 'INVALID_TYPE'
  | 'INVALID_CONTENT'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'QUOTA_EXCEEDED'
  | 'SESSION_EXPIRED'
  | 'CHUNK_FAILED'
  | 'VALIDATION_FAILED'
  | 'UNKNOWN';

/**
 * Upload error details
 */
export interface UploadError {
  /** Error code */
  code: UploadErrorCode;
  /** Human-readable message */
  message: string;
  /** HTTP status code if applicable */
  statusCode?: number;
  /** Original error */
  originalError?: Error;
  /** Whether error is retryable */
  retryable: boolean;
  /** Suggested action */
  suggestion?: string;
}

// ============================================================================
// Events & Callbacks
// ============================================================================

/**
 * Upload event types
 */
export type UploadEventType =
  | 'add'
  | 'start'
  | 'progress'
  | 'pause'
  | 'resume'
  | 'complete'
  | 'error'
  | 'cancel'
  | 'retry'
  | 'queue-change';

/**
 * Upload event payload
 */
export interface UploadEvent {
  /** Event type */
  type: UploadEventType;
  /** Upload item */
  item?: UploadItem;
  /** Error if applicable */
  error?: UploadError;
  /** Progress data */
  progress?: UploadProgress;
  /** Queue stats */
  queueStats?: QueueStats;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Upload event handler
 */
export type UploadEventHandler = (event: UploadEvent) => void;

/**
 * Upload options for a single file
 */
export interface UploadOptions {
  /** Upload priority */
  priority?: UploadPriority;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Destination path/folder */
  destination?: string;
  /** Progress callback */
  onProgress?: (progress: UploadProgress) => void;
  /** Complete callback */
  onComplete?: (result: UploadResult) => void;
  /** Error callback */
  onError?: (error: UploadError) => void;
  /** Custom upload URL override */
  uploadUrl?: string;
  /** Skip validation */
  skipValidation?: boolean;
  /** Force chunked upload */
  forceChunked?: boolean;
}

/**
 * Result of a completed upload
 */
export interface UploadResult {
  /** Upload ID */
  uploadId: string;
  /** File name */
  fileName: string;
  /** File size */
  fileSize: number;
  /** Server response (ID, URL, etc.) */
  response?: {
    id?: string;
    url?: string;
    [key: string]: unknown;
  };
  /** Time taken in ms */
  duration: number;
  /** Average upload speed */
  averageSpeed: number;
}

// ============================================================================
// Persisted State
// ============================================================================

/**
 * Persisted upload state for IndexedDB
 */
export interface PersistedUploadState {
  /** Upload item ID */
  id: string;
  /** File info (can't persist File object) */
  fileInfo: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
  /** Upload status */
  status: UploadStatus;
  /** Progress */
  progress: UploadProgress;
  /** Chunk state */
  chunkState?: ChunkState;
  /** Metadata */
  metadata?: Record<string, unknown>;
  /** Destination */
  destination?: string;
  /** Retry count */
  retryCount: number;
  /** Created at */
  createdAt: string;
  /** Updated at */
  updatedAt: string;
}
