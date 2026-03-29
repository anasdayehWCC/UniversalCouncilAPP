'use client';

/**
 * FileUploader Component
 *
 * Drag-and-drop file upload component with:
 * - Drag and drop support
 * - File preview
 * - Progress indicators
 * - Cancel upload option
 * - Error display
 *
 * @module components/upload/FileUploader
 */

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  type UploadItem,
  type UploadProgress,
  type UploadOptions,
  type ValidationConfig,
  type UploadPriority,
  DEFAULT_UPLOAD_CONFIG,
  formatFileSize,
  quickValidateFile,
  filterValidFiles,
} from '@/lib/upload';

// ============================================================================
// Icons
// ============================================================================

const UploadCloudIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn('w-10 h-10', className)}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 16V8M12 8L9 11M12 8L15 11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 16.7428C21.2215 15.734 22 14.2195 22 12.5C22 9.46243 19.5376 7 16.5 7C16.2815 7 16.0771 6.886 15.9661 6.69774C14.6621 4.48484 12.2544 3 9.5 3C5.35786 3 2 6.35786 2 10.5C2 12.5661 2.83545 14.4371 4.18695 15.7935"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FileIcon = ({ className, type }: { className?: string; type?: string }) => {
  const isAudio = type?.startsWith('audio/');
  const isVideo = type?.startsWith('video/');

  if (isAudio) {
    return (
      <svg
        className={cn('w-5 h-5', className)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 18V5l12-2v13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (isVideo) {
    return (
      <svg
        className={cn('w-5 h-5', className)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="2"
          y="4"
          width="20"
          height="16"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M10 9l5 3-5 3V9z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg
      className={cn('w-5 h-5', className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn('w-5 h-5', className)}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path
      d="M9 12l2 2 4-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ErrorCircleIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn('w-5 h-5', className)}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path
      d="M15 9l-6 6M9 9l6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PauseIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn('w-4 h-4', className)}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
    <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
  </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn('w-4 h-4', className)}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5 3l14 9-14 9V3z" fill="currentColor" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn('w-4 h-4', className)}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18 6L6 18M6 6l12 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn('w-4 h-4', className)}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 4v6h6M23 20v-6h-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ============================================================================
// Types
// ============================================================================

export interface FileUploaderProps {
  /** Accept file types (MIME types or extensions) */
  accept?: string;
  /** Allow multiple files */
  multiple?: boolean;
  /** Maximum number of files (when multiple is true) */
  maxFiles?: number;
  /** Validation configuration */
  validationConfig?: Partial<ValidationConfig>;
  /** Upload priority */
  priority?: UploadPriority;
  /** Custom metadata to attach to uploads */
  metadata?: Record<string, unknown>;
  /** Destination folder/path */
  destination?: string;
  /** Called when files are added */
  onFilesAdded?: (files: File[]) => void;
  /** Called when upload starts */
  onUploadStart?: (uploadId: string, file: File) => void;
  /** Called on upload progress */
  onProgress?: (progress: UploadProgress) => void;
  /** Called when upload completes */
  onUploadComplete?: (uploadId: string, file: File) => void;
  /** Called on upload error */
  onError?: (uploadId: string, error: string, file: File) => void;
  /** Called when all uploads complete */
  onAllComplete?: () => void;
  /** Show file preview */
  showPreview?: boolean;
  /** Compact mode (minimal UI) */
  compact?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom dropzone text */
  dropzoneText?: string;
  /** Custom class name */
  className?: string;
  /** Hide completed uploads after delay (ms) */
  autoHideCompleted?: number;
  /** External upload manager (optional - creates internal if not provided) */
  uploadManager?: {
    add: (file: File, options: UploadOptions) => Promise<string>;
    pause: (id: string) => void;
    resume: (id: string) => Promise<void>;
    cancel: (id: string) => void;
    retry: (id: string) => Promise<void>;
    getUpload: (id: string) => UploadItem | undefined;
  };
}

interface LocalUploadState {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';
  error?: string;
  startTime?: number;
  speed?: number;
}

// ============================================================================
// Helper Components
// ============================================================================

interface UploadItemRowProps {
  upload: LocalUploadState;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  showPreview: boolean;
}

function UploadItemRow({
  upload,
  onPause,
  onResume,
  onCancel,
  onRetry,
  showPreview,
}: UploadItemRowProps) {
  const ext = upload.file.name.split('.').pop()?.toLowerCase() || '';
  const isAudio = upload.file.type.startsWith('audio/');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        upload.status === 'failed'
          ? 'border-destructive/30 bg-destructive/10 dark:border-destructive/30 dark:bg-destructive/10'
          : upload.status === 'completed'
            ? 'border-success/30 bg-success/10 dark:border-success/30 dark:bg-success/10'
            : 'border-border bg-card dark:border-border dark:bg-card'
      )}
    >
      {/* File icon / preview */}
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          upload.status === 'failed'
            ? 'bg-destructive/10 text-destructive dark:bg-destructive/10 dark:text-destructive'
            : upload.status === 'completed'
              ? 'bg-success/10 text-success dark:bg-success/10 dark:text-success'
              : 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary'
        )}
      >
        {upload.status === 'completed' ? (
          <CheckCircleIcon className="w-5 h-5" />
        ) : upload.status === 'failed' ? (
          <ErrorCircleIcon className="w-5 h-5" />
        ) : (
          <FileIcon type={upload.file.type} />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground dark:text-foreground truncate">
            {upload.file.name}
          </span>
          {isAudio && (
            <span className="text-xs px-1.5 py-0.5 bg-info/10 text-info rounded">
              {ext.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
          <span>{formatFileSize(upload.file.size)}</span>
          {upload.status === 'uploading' && upload.speed && (
            <>
              <span>•</span>
              <span>{formatFileSize(upload.speed)}/s</span>
            </>
          )}
          {upload.error && (
            <>
              <span>•</span>
              <span className="text-destructive">{upload.error}</span>
            </>
          )}
        </div>

        {/* Progress bar */}
        {(upload.status === 'uploading' || upload.status === 'paused') && (
          <div className="mt-2">
            <ProgressBar
              value={upload.progress}
              height="6px"
              variant={upload.status === 'paused' ? 'warning' : 'default'}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {upload.status === 'uploading' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onPause(upload.id)}
            className="h-7 w-7 p-0"
            aria-label="Pause upload"
          >
            <PauseIcon />
          </Button>
        )}

        {upload.status === 'paused' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onResume(upload.id)}
            className="h-7 w-7 p-0"
            aria-label="Resume upload"
          >
            <PlayIcon />
          </Button>
        )}

        {upload.status === 'failed' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRetry(upload.id)}
            className="h-7 w-7 p-0"
            aria-label="Retry upload"
          >
            <RefreshIcon />
          </Button>
        )}

        {upload.status !== 'completed' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onCancel(upload.id)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            aria-label="Cancel upload"
          >
            <XIcon />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function FileUploader({
  accept = 'audio/*',
  multiple = true,
  maxFiles = 10,
  validationConfig,
  priority = 'normal',
  metadata,
  destination,
  onFilesAdded,
  onUploadStart,
  onProgress,
  onUploadComplete,
  onError,
  onAllComplete,
  showPreview = true,
  compact = false,
  disabled = false,
  dropzoneText,
  className,
  autoHideCompleted,
  uploadManager,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<Map<string, LocalUploadState>>(new Map());
  const [rejectedFiles, setRejectedFiles] = useState<
    Array<{ name: string; errors: string[] }>
  >([]);

  const config = useMemo(
    () => ({
      ...DEFAULT_UPLOAD_CONFIG.validation,
      ...validationConfig,
    }),
    [validationConfig]
  );

  // Convert accept string to validation-compatible format
  const acceptTypes = useMemo(() => {
    if (!accept) return { mimeTypes: [], extensions: [] };

    const mimeTypes: string[] = [];
    const extensions: string[] = [];

    accept.split(',').forEach((type) => {
      const trimmed = type.trim();
      if (trimmed.startsWith('.')) {
        extensions.push(trimmed);
      } else if (trimmed.includes('/')) {
        // Handle wildcards like audio/*
        if (trimmed.endsWith('/*')) {
          const prefix = trimmed.replace('/*', '/');
          config.allowedMimeTypes.forEach((mt) => {
            if (mt.startsWith(prefix)) {
              mimeTypes.push(mt);
            }
          });
        } else {
          mimeTypes.push(trimmed);
        }
      }
    });

    return { mimeTypes, extensions };
  }, [accept, config.allowedMimeTypes]);

  // Auto-hide completed uploads
  useEffect(() => {
    if (!autoHideCompleted) return;

    const completedIds = Array.from(uploads.entries())
      .filter(([, u]) => u.status === 'completed')
      .map(([id]) => id);

    if (completedIds.length === 0) return;

    const timeout = setTimeout(() => {
      setUploads((prev) => {
        const next = new Map(prev);
        completedIds.forEach((id) => next.delete(id));
        return next;
      });
    }, autoHideCompleted);

    return () => clearTimeout(timeout);
  }, [uploads, autoHideCompleted]);

  // Check if all uploads are complete
  useEffect(() => {
    const allUploads = Array.from(uploads.values());
    if (allUploads.length === 0) return;

    const allComplete = allUploads.every(
      (u) => u.status === 'completed' || u.status === 'failed'
    );
    if (allComplete) {
      onAllComplete?.();
    }
  }, [uploads, onAllComplete]);

  /**
   * Handle file selection
   */
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Check max files
      if (multiple && fileArray.length > maxFiles) {
        setRejectedFiles([
          {
            name: `${fileArray.length} files`,
            errors: [`Maximum ${maxFiles} files allowed`],
          },
        ]);
        return;
      }

      // Validate files
      const validationOverrides = {
        ...config,
        allowedMimeTypes: [
          ...config.allowedMimeTypes,
          ...acceptTypes.mimeTypes,
        ],
        allowedExtensions: [
          ...config.allowedExtensions,
          ...acceptTypes.extensions,
        ],
      };

      const { valid, invalid } = filterValidFiles(
        fileArray,
        validationOverrides
      );

      if (invalid.length > 0) {
        setRejectedFiles(
          invalid.map((i) => ({ name: i.file.name, errors: i.errors }))
        );
      }

      if (valid.length === 0) return;

      // Clear rejected files after showing
      setTimeout(() => setRejectedFiles([]), 5000);

      onFilesAdded?.(valid);

      // Add files to upload queue
      for (const file of valid) {
        const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // Add to local state
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(localId, {
            id: localId,
            file,
            progress: 0,
            status: 'pending',
            startTime: Date.now(),
          });
          return next;
        });

        // Start upload
        try {
          if (uploadManager) {
            const uploadId = await uploadManager.add(file, {
              priority,
              metadata,
              destination,
              onProgress: (progress) => {
                setUploads((prev) => {
                  const next = new Map(prev);
                  const item = next.get(localId);
                  if (item) {
                    item.progress = progress.percentage;
                    item.status = progress.status as LocalUploadState['status'];
                    item.speed = progress.speed;
                  }
                  return next;
                });
                onProgress?.(progress);
              },
              onComplete: () => {
                setUploads((prev) => {
                  const next = new Map(prev);
                  const item = next.get(localId);
                  if (item) {
                    item.status = 'completed';
                    item.progress = 100;
                  }
                  return next;
                });
                onUploadComplete?.(localId, file);
              },
              onError: (error) => {
                setUploads((prev) => {
                  const next = new Map(prev);
                  const item = next.get(localId);
                  if (item) {
                    item.status = 'failed';
                    item.error = error.message;
                  }
                  return next;
                });
                onError?.(localId, error.message, file);
              },
            });

            // Update local ID to match manager ID
            setUploads((prev) => {
              const next = new Map(prev);
              const item = next.get(localId);
              if (item) {
                item.id = uploadId;
                next.delete(localId);
                next.set(uploadId, item);
              }
              return next;
            });

            onUploadStart?.(uploadId, file);
          } else {
            // Simulate upload for demo/testing
            simulateUpload(localId, file);
            onUploadStart?.(localId, file);
          }
        } catch (e) {
          setUploads((prev) => {
            const next = new Map(prev);
            const item = next.get(localId);
            if (item) {
              item.status = 'failed';
              item.error = e instanceof Error ? e.message : 'Upload failed';
            }
            return next;
          });
          onError?.(localId, e instanceof Error ? e.message : 'Upload failed', file);
        }
      }
    },
    [
      multiple,
      maxFiles,
      config,
      acceptTypes,
      onFilesAdded,
      uploadManager,
      priority,
      metadata,
      destination,
      onUploadStart,
      onProgress,
      onUploadComplete,
      onError,
    ]
  );

  /**
   * Simulate upload for testing/demo
   */
  const simulateUpload = useCallback(
    (id: string, file: File) => {
      setUploads((prev) => {
        const next = new Map(prev);
        const item = next.get(id);
        if (item) {
          item.status = 'uploading';
        }
        return next;
      });

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploads((prev) => {
            const next = new Map(prev);
            const item = next.get(id);
            if (item) {
              item.status = 'completed';
              item.progress = 100;
            }
            return next;
          });
          onUploadComplete?.(id, file);
        } else {
          setUploads((prev) => {
            const next = new Map(prev);
            const item = next.get(id);
            if (item) {
              item.progress = progress;
              item.speed = Math.random() * 1024 * 1024; // Random speed for demo
            }
            return next;
          });
        }
      }, 200);
    },
    [onUploadComplete]
  );

  // Drag and drop handlers
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [disabled, handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
      // Reset input
      e.target.value = '';
    },
    [handleFiles]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    [disabled]
  );

  // Upload control handlers
  const handlePause = useCallback(
    (id: string) => {
      uploadManager?.pause(id);
      setUploads((prev) => {
        const next = new Map(prev);
        const item = next.get(id);
        if (item) {
          item.status = 'paused';
        }
        return next;
      });
    },
    [uploadManager]
  );

  const handleResume = useCallback(
    (id: string) => {
      uploadManager?.resume(id);
      setUploads((prev) => {
        const next = new Map(prev);
        const item = next.get(id);
        if (item) {
          item.status = 'uploading';
        }
        return next;
      });
    },
    [uploadManager]
  );

  const handleCancel = useCallback(
    (id: string) => {
      uploadManager?.cancel(id);
      setUploads((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    },
    [uploadManager]
  );

  const handleRetry = useCallback(
    (id: string) => {
      uploadManager?.retry(id);
      setUploads((prev) => {
        const next = new Map(prev);
        const item = next.get(id);
        if (item) {
          item.status = 'uploading';
          item.progress = 0;
          item.error = undefined;
        }
        return next;
      });
    },
    [uploadManager]
  );

  const uploadList = Array.from(uploads.values());
  const hasUploads = uploadList.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload files"
        aria-disabled={disabled}
        className={cn(
          'relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
          isDragOver
            ? 'border-primary bg-primary/10 dark:bg-primary/10 scale-[1.02]'
            : 'border-border dark:border-border hover:border-primary hover:bg-muted dark:hover:bg-muted',
          disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent',
          compact ? 'p-6' : 'p-10'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center text-center">
          <motion.div
            animate={{
              y: isDragOver ? -5 : 0,
              scale: isDragOver ? 1.1 : 1,
            }}
            className={cn(
              'mb-4 p-3 rounded-full',
              isDragOver
                ? 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary'
                : 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground'
            )}
          >
            <UploadCloudIcon
              className={cn(compact ? 'w-8 h-8' : 'w-10 h-10')}
            />
          </motion.div>

          <h3
            className={cn(
              'font-semibold text-foreground dark:text-foreground mb-1',
              compact ? 'text-base' : 'text-lg'
            )}
          >
            {dropzoneText || (isDragOver ? 'Drop files here' : 'Drag & drop files or click to browse')}
          </h3>

          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            {multiple
              ? `Up to ${maxFiles} audio files • Max ${formatFileSize(config.maxFileSize)} each`
              : `Single audio file • Max ${formatFileSize(config.maxFileSize)}`}
          </p>

          <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
            MP3, WAV, WebM, M4A, OGG supported
          </p>
        </div>
      </div>

      {/* Rejected files error */}
      <AnimatePresence>
        {rejectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 dark:bg-destructive/10 dark:border-destructive/30"
          >
            <div className="flex items-start gap-2">
              <ErrorCircleIcon className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive dark:text-destructive">
                  Some files could not be uploaded
                </p>
                <ul className="mt-1 text-xs text-destructive dark:text-destructive">
                  {rejectedFiles.map((f, i) => (
                    <li key={i}>
                      {f.name}: {f.errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload list */}
      {showPreview && hasUploads && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground dark:text-foreground">
              Uploads ({uploadList.length})
            </span>
            {uploadList.some((u) => u.status === 'completed' || u.status === 'failed') && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setUploads((prev) => {
                    const next = new Map(prev);
                    for (const [id, u] of next) {
                      if (u.status === 'completed' || u.status === 'failed') {
                        next.delete(id);
                      }
                    }
                    return next;
                  });
                }}
                className="text-xs h-7"
              >
                Clear finished
              </Button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {uploadList.map((upload) => (
              <UploadItemRow
                key={upload.id}
                upload={upload}
                onPause={handlePause}
                onResume={handleResume}
                onCancel={handleCancel}
                onRetry={handleRetry}
                showPreview={showPreview}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
