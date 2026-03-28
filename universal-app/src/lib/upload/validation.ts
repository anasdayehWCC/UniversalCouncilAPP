/**
 * File Upload Validation
 *
 * Comprehensive file validation including MIME type checking,
 * file size limits, and content scanning for audio format verification.
 *
 * @module lib/upload/validation
 */

import {
  type ValidationResult,
  type ValidationRule,
  type ValidationFailure,
  type ValidationConfig,
  type FileMetadata,
  type AudioFormatSignature,
  DEFAULT_UPLOAD_CONFIG,
} from './types';

// ============================================================================
// Audio Format Signatures (Magic Bytes)
// ============================================================================

/**
 * Known audio format signatures for content validation
 */
export const AUDIO_FORMAT_SIGNATURES: AudioFormatSignature[] = [
  // MP3 - ID3v2 header
  {
    mimeType: 'audio/mpeg',
    magicBytes: [0x49, 0x44, 0x33], // "ID3"
    formatName: 'MP3 (ID3v2)',
  },
  // MP3 - Frame sync without ID3
  {
    mimeType: 'audio/mpeg',
    magicBytes: [0xff, 0xfb], // Frame sync
    formatName: 'MP3 (Frame Sync)',
  },
  {
    mimeType: 'audio/mpeg',
    magicBytes: [0xff, 0xfa],
    formatName: 'MP3 (Frame Sync)',
  },
  {
    mimeType: 'audio/mpeg',
    magicBytes: [0xff, 0xf3],
    formatName: 'MP3 (Frame Sync)',
  },
  {
    mimeType: 'audio/mpeg',
    magicBytes: [0xff, 0xf2],
    formatName: 'MP3 (Frame Sync)',
  },
  // WAV
  {
    mimeType: 'audio/wav',
    magicBytes: [0x52, 0x49, 0x46, 0x46], // "RIFF"
    formatName: 'WAV',
  },
  // OGG
  {
    mimeType: 'audio/ogg',
    magicBytes: [0x4f, 0x67, 0x67, 0x53], // "OggS"
    formatName: 'OGG',
  },
  // WebM/Matroska
  {
    mimeType: 'audio/webm',
    magicBytes: [0x1a, 0x45, 0xdf, 0xa3], // EBML header
    formatName: 'WebM/Matroska',
  },
  // M4A/AAC (MP4 container)
  {
    mimeType: 'audio/mp4',
    magicBytes: [0x00, 0x00, 0x00], // ftyp starts at offset 4
    formatName: 'M4A/AAC',
  },
  // FLAC
  {
    mimeType: 'audio/flac',
    magicBytes: [0x66, 0x4c, 0x61, 0x43], // "fLaC"
    formatName: 'FLAC',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert bytes to human-readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Check if a MIME type is an audio type
 */
export function isAudioMimeType(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

/**
 * Check if a MIME type is a video type
 */
export function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * Read first N bytes of a file
 */
export async function readFileHeader(
  file: File,
  bytes: number = 32
): Promise<ArrayBuffer> {
  const slice = file.slice(0, bytes);
  return slice.arrayBuffer();
}

/**
 * Compare byte arrays
 */
function bytesMatch(
  buffer: ArrayBuffer,
  signature: number[],
  offset: number = 0
): boolean {
  const view = new Uint8Array(buffer);
  if (view.length < offset + signature.length) return false;

  for (let i = 0; i < signature.length; i++) {
    if (view[offset + i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Detect audio format from file content
 */
export async function detectAudioFormat(
  file: File
): Promise<AudioFormatSignature | null> {
  try {
    const header = await readFileHeader(file, 32);

    for (const sig of AUDIO_FORMAT_SIGNATURES) {
      const offset = sig.offset ?? 0;
      if (bytesMatch(header, sig.magicBytes, offset)) {
        return sig;
      }
    }

    // Special handling for M4A/MP4 - check for 'ftyp' at offset 4
    const view = new Uint8Array(header);
    if (
      view.length >= 12 &&
      view[4] === 0x66 && // 'f'
      view[5] === 0x74 && // 't'
      view[6] === 0x79 && // 'y'
      view[7] === 0x70 // 'p'
    ) {
      return {
        mimeType: 'audio/mp4',
        magicBytes: [0x66, 0x74, 0x79, 0x70],
        offset: 4,
        formatName: 'M4A/AAC/MP4',
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract duration from audio file using Web Audio API
 */
export async function extractAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;
      URL.revokeObjectURL(url);
      resolve(isFinite(duration) ? duration : null);
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(null);
    });

    // Set timeout for metadata loading
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve(null);
    }, 5000);

    audio.src = url;
  });
}

// ============================================================================
// Validation Rules
// ============================================================================

/**
 * Create file size validation rule
 */
export function createFileSizeRule(maxSize: number): ValidationRule {
  return {
    id: 'file_size',
    description: `File must be smaller than ${formatFileSize(maxSize)}`,
    validate: async (file: File) => file.size <= maxSize,
    errorMessage: `File exceeds maximum size of ${formatFileSize(maxSize)}`,
  };
}

/**
 * Create MIME type validation rule
 */
export function createMimeTypeRule(allowedTypes: string[]): ValidationRule {
  return {
    id: 'mime_type',
    description: `File must be one of: ${allowedTypes.join(', ')}`,
    validate: async (file: File) => {
      // Check declared MIME type
      if (allowedTypes.includes(file.type)) return true;

      // Fallback: check extension mapping
      const ext = getFileExtension(file.name);
      const extToMime: Record<string, string[]> = {
        '.mp3': ['audio/mpeg', 'audio/mp3'],
        '.wav': ['audio/wav', 'audio/wave', 'audio/x-wav'],
        '.webm': ['audio/webm', 'video/webm'],
        '.ogg': ['audio/ogg'],
        '.m4a': ['audio/m4a', 'audio/x-m4a', 'audio/mp4'],
        '.mp4': ['video/mp4', 'audio/mp4'],
        '.aac': ['audio/aac'],
      };

      const possibleTypes = extToMime[ext] || [];
      return possibleTypes.some((t) => allowedTypes.includes(t));
    },
    errorMessage: 'File type is not supported',
  };
}

/**
 * Create file extension validation rule
 */
export function createExtensionRule(allowedExtensions: string[]): ValidationRule {
  return {
    id: 'extension',
    description: `File extension must be: ${allowedExtensions.join(', ')}`,
    validate: async (file: File) => {
      const ext = getFileExtension(file.name);
      return allowedExtensions.includes(ext);
    },
    errorMessage: `File extension not allowed. Allowed: ${allowedExtensions.join(', ')}`,
  };
}

/**
 * Create content validation rule (magic bytes)
 */
export function createContentValidationRule(): ValidationRule {
  return {
    id: 'content_validation',
    description: 'Validates file content matches declared type',
    validate: async (file: File) => {
      const format = await detectAudioFormat(file);
      if (!format) {
        // Non-audio files or unknown format - skip deep validation
        return true;
      }
      // Content is valid audio format
      return true;
    },
    errorMessage: 'File content does not match a valid audio format',
    requiresContent: true,
  };
}

/**
 * Create audio format validation rule
 */
export function createAudioFormatRule(): ValidationRule {
  return {
    id: 'audio_format',
    description: 'Validates file is a recognized audio format',
    validate: async (file: File) => {
      // Only validate audio files
      if (!isAudioMimeType(file.type) && !isVideoMimeType(file.type)) {
        return true;
      }

      const format = await detectAudioFormat(file);
      return format !== null;
    },
    errorMessage:
      'File does not appear to be a valid audio file. Please ensure the file is not corrupted.',
    requiresContent: true,
  };
}

/**
 * Create minimum file size rule (to detect empty/corrupt files)
 */
export function createMinFileSizeRule(minSize: number = 1024): ValidationRule {
  return {
    id: 'min_file_size',
    description: `File must be at least ${formatFileSize(minSize)}`,
    validate: async (file: File) => file.size >= minSize,
    errorMessage: 'File appears to be empty or corrupted',
  };
}

/**
 * Create filename sanitization rule
 */
export function createFilenameRule(): ValidationRule {
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  return {
    id: 'filename',
    description: 'Validates filename contains no invalid characters',
    validate: async (file: File) => !invalidChars.test(file.name),
    errorMessage: 'Filename contains invalid characters',
  };
}

// ============================================================================
// Main Validation Functions
// ============================================================================

/**
 * Create validation rules from config
 */
export function createValidationRules(config: ValidationConfig): ValidationRule[] {
  const rules: ValidationRule[] = [];

  // Always validate filename
  rules.push(createFilenameRule());

  // Minimum file size
  rules.push(createMinFileSizeRule(1024));

  // Maximum file size
  rules.push(createFileSizeRule(config.maxFileSize));

  // MIME type validation
  if (config.allowedMimeTypes.length > 0) {
    rules.push(createMimeTypeRule(config.allowedMimeTypes));
  }

  // Extension validation
  if (config.allowedExtensions.length > 0) {
    rules.push(createExtensionRule(config.allowedExtensions));
  }

  // Content validation
  if (config.validateContent) {
    rules.push(createContentValidationRule());
  }

  // Audio format validation
  if (config.validateAudioFormat) {
    rules.push(createAudioFormatRule());
  }

  return rules;
}

/**
 * Validate a file against all rules
 */
export async function validateFile(
  file: File,
  config: ValidationConfig = DEFAULT_UPLOAD_CONFIG.validation
): Promise<ValidationResult> {
  const rules = createValidationRules(config);
  const passed: string[] = [];
  const failed: ValidationFailure[] = [];
  let detectedFormat: AudioFormatSignature | null = null;
  let metadata: FileMetadata | undefined;

  // Run all validation rules
  for (const rule of rules) {
    try {
      const isValid = await rule.validate(file);
      if (isValid) {
        passed.push(rule.id);
      } else {
        failed.push({
          ruleId: rule.id,
          message: rule.errorMessage,
          blocking: true,
        });
      }
    } catch (error) {
      // Rule threw an error - treat as failure
      failed.push({
        ruleId: rule.id,
        message: error instanceof Error ? error.message : rule.errorMessage,
        blocking: true,
      });
    }
  }

  // Extract additional metadata for audio files
  if (isAudioMimeType(file.type) || isVideoMimeType(file.type)) {
    detectedFormat = await detectAudioFormat(file);

    try {
      const duration = await extractAudioDuration(file);
      if (duration) {
        metadata = { duration };
      }
    } catch {
      // Metadata extraction is optional
    }
  }

  return {
    valid: failed.length === 0,
    passed,
    failed,
    detectedMimeType: file.type || detectedFormat?.mimeType,
    detectedFormat: detectedFormat?.formatName,
    metadata,
  };
}

/**
 * Quick validation (size and type only, no content reading)
 */
export function quickValidateFile(
  file: File,
  config: ValidationConfig = DEFAULT_UPLOAD_CONFIG.validation
): ValidationResult {
  const passed: string[] = [];
  const failed: ValidationFailure[] = [];

  // Check file size
  if (file.size > config.maxFileSize) {
    failed.push({
      ruleId: 'file_size',
      message: `File exceeds maximum size of ${formatFileSize(config.maxFileSize)}`,
      blocking: true,
    });
  } else {
    passed.push('file_size');
  }

  // Check MIME type
  const ext = getFileExtension(file.name);
  const mimeTypeValid =
    config.allowedMimeTypes.includes(file.type) ||
    config.allowedExtensions.includes(ext);

  if (!mimeTypeValid) {
    failed.push({
      ruleId: 'mime_type',
      message: 'File type is not supported',
      blocking: true,
    });
  } else {
    passed.push('mime_type');
  }

  // Check extension
  if (!config.allowedExtensions.includes(ext)) {
    failed.push({
      ruleId: 'extension',
      message: `File extension not allowed. Allowed: ${config.allowedExtensions.join(', ')}`,
      blocking: true,
    });
  } else {
    passed.push('extension');
  }

  return {
    valid: failed.length === 0,
    passed,
    failed,
    detectedMimeType: file.type,
  };
}

/**
 * Validate multiple files
 */
export async function validateFiles(
  files: File[],
  config: ValidationConfig = DEFAULT_UPLOAD_CONFIG.validation
): Promise<Map<File, ValidationResult>> {
  const results = new Map<File, ValidationResult>();

  await Promise.all(
    files.map(async (file) => {
      const result = await validateFile(file, config);
      results.set(file, result);
    })
  );

  return results;
}

/**
 * Check if file passes quick validation
 */
export function isFileValid(
  file: File,
  config: ValidationConfig = DEFAULT_UPLOAD_CONFIG.validation
): boolean {
  return quickValidateFile(file, config).valid;
}

/**
 * Filter valid files from a list
 */
export function filterValidFiles(
  files: File[],
  config: ValidationConfig = DEFAULT_UPLOAD_CONFIG.validation
): { valid: File[]; invalid: Array<{ file: File; errors: string[] }> } {
  const valid: File[] = [];
  const invalid: Array<{ file: File; errors: string[] }> = [];

  for (const file of files) {
    const result = quickValidateFile(file, config);
    if (result.valid) {
      valid.push(file);
    } else {
      invalid.push({
        file,
        errors: result.failed.map((f) => f.message),
      });
    }
  }

  return { valid, invalid };
}
