/**
 * File Upload System
 *
 * Comprehensive file upload system with chunked uploads, resume capability,
 * progress tracking, parallel uploads, and file validation.
 *
 * @module lib/upload
 */

// Types
export * from './types';

// Validation utilities
export {
  validateFile,
  quickValidateFile,
  validateFiles,
  isFileValid,
  filterValidFiles,
  formatFileSize,
  getFileExtension,
  isAudioMimeType,
  isVideoMimeType,
  detectAudioFormat,
  extractAudioDuration,
  AUDIO_FORMAT_SIGNATURES,
  createFileSizeRule,
  createMimeTypeRule,
  createExtensionRule,
  createContentValidationRule,
  createAudioFormatRule,
  createMinFileSizeRule,
  createFilenameRule,
  createValidationRules,
} from './validation';

// Upload manager
export { UploadManager, createUploadManager } from './manager';
