/**
 * useFileUpload Hook
 *
 * Easy-to-use hook for file upload functionality.
 * Provides a simplified interface to the UploadManager.
 *
 * @module hooks/useFileUpload
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  UploadManager,
  createUploadManager,
  type UploadItem,
  type UploadProgress,
  type UploadOptions,
  type UploadError,
  type UploadResult,
  type UploadManagerConfig,
  type QueueStats,
  validateFile,
  filterValidFiles,
  formatFileSize,
} from '@/lib/upload';

// ============================================================================
// Types
// ============================================================================

export interface UseFileUploadOptions {
  /** Upload manager configuration overrides */
  config?: Partial<UploadManagerConfig>;
  /** Auto-start uploads when files are added */
  autoStart?: boolean;
  /** Called when an upload starts */
  onUploadStart?: (item: UploadItem) => void;
  /** Called on upload progress */
  onProgress?: (progress: UploadProgress) => void;
  /** Called when an upload completes */
  onComplete?: (result: UploadResult) => void;
  /** Called when an upload fails */
  onError?: (error: UploadError, item: UploadItem) => void;
  /** Called when all uploads complete */
  onAllComplete?: () => void;
  /** Called when queue changes */
  onQueueChange?: (stats: QueueStats) => void;
}

export interface UseFileUploadReturn {
  /** Upload manager instance */
  manager: UploadManager | null;
  /** All upload items */
  uploads: UploadItem[];
  /** Queue statistics */
  stats: QueueStats;
  /** Whether any uploads are active */
  isUploading: boolean;
  /** Add a file to upload */
  upload: (file: File, options?: UploadOptions) => Promise<string>;
  /** Add multiple files */
  uploadMultiple: (files: File[], options?: UploadOptions) => Promise<string[]>;
  /** Pause an upload */
  pause: (uploadId: string) => void;
  /** Resume a paused upload */
  resume: (uploadId: string) => Promise<void>;
  /** Cancel an upload */
  cancel: (uploadId: string) => void;
  /** Retry a failed upload */
  retry: (uploadId: string) => Promise<void>;
  /** Remove an upload from queue */
  remove: (uploadId: string) => void;
  /** Clear completed/failed uploads */
  clearFinished: () => void;
  /** Pause all uploads */
  pauseAll: () => void;
  /** Resume all uploads */
  resumeAll: () => Promise<void>;
  /** Cancel all uploads */
  cancelAll: () => void;
  /** Get upload by ID */
  getUpload: (uploadId: string) => UploadItem | undefined;
  /** Validate a file */
  validateFile: (file: File) => Promise<{ valid: boolean; errors: string[] }>;
  /** Quick validate multiple files */
  filterValid: (files: File[]) => { valid: File[]; invalid: Array<{ file: File; errors: string[] }> };
  /** Format file size */
  formatSize: (bytes: number) => string;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useFileUpload(
  options: UseFileUploadOptions = {}
): UseFileUploadReturn {
  const {
    config,
    autoStart = true,
    onUploadStart,
    onProgress,
    onComplete,
    onError,
    onAllComplete,
    onQueueChange,
  } = options;

  const { getToken } = useAuth();
  const managerRef = useRef<UploadManager | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    pending: 0,
    uploading: 0,
    completed: 0,
    failed: 0,
    paused: 0,
    totalBytes: 0,
    uploadedBytes: 0,
    overallProgress: 0,
    activeUploads: 0,
  });

  // Initialize manager
  useEffect(() => {
    const manager = createUploadManager(
      async () => {
        try {
          return await getToken();
        } catch {
          return null;
        }
      },
      {
        autoStart,
        ...config,
      }
    );

    // Subscribe to events
    const unsubscribeStart = manager.on('start', (event) => {
      if (event.item) {
        onUploadStart?.(event.item);
      }
      updateState(manager);
    });

    const unsubscribeProgress = manager.on('progress', (event) => {
      if (event.progress) {
        onProgress?.(event.progress);
      }
      updateState(manager);
    });

    const unsubscribeComplete = manager.on('complete', (event) => {
      if (event.item) {
        onComplete?.({
          uploadId: event.item.id,
          fileName: event.item.file.name,
          fileSize: event.item.file.size,
          duration: Date.now() - event.item.createdAt.getTime(),
          averageSpeed:
            event.item.file.size /
            ((Date.now() - event.item.createdAt.getTime()) / 1000),
        });
      }
      updateState(manager);
      checkAllComplete(manager);
    });

    const unsubscribeError = manager.on('error', (event) => {
      if (event.error && event.item) {
        onError?.(event.error, event.item);
      }
      updateState(manager);
      checkAllComplete(manager);
    });

    const unsubscribeQueue = manager.on('queue-change', (event) => {
      if (event.queueStats) {
        onQueueChange?.(event.queueStats);
      }
      updateState(manager);
    });

    const unsubscribeAdd = manager.on('add', () => {
      updateState(manager);
    });

    const unsubscribePause = manager.on('pause', () => {
      updateState(manager);
    });

    const unsubscribeResume = manager.on('resume', () => {
      updateState(manager);
    });

    const unsubscribeCancel = manager.on('cancel', () => {
      updateState(manager);
    });

    const unsubscribeRetry = manager.on('retry', () => {
      updateState(manager);
    });

    managerRef.current = manager;

    return () => {
      unsubscribeStart();
      unsubscribeProgress();
      unsubscribeComplete();
      unsubscribeError();
      unsubscribeQueue();
      unsubscribeAdd();
      unsubscribePause();
      unsubscribeResume();
      unsubscribeCancel();
      unsubscribeRetry();
      manager.destroy();
      managerRef.current = null;
    };
  }, [
    getToken,
    autoStart,
    config,
    onUploadStart,
    onProgress,
    onComplete,
    onError,
    onQueueChange,
  ]);

  // Update state from manager
  const updateState = useCallback((manager: UploadManager) => {
    setUploads(manager.getAllUploads());
    setStats(manager.getQueueStats());
  }, []);

  // Check if all uploads are complete
  const checkAllComplete = useCallback(
    (manager: UploadManager) => {
      const currentStats = manager.getQueueStats();
      const allDone =
        currentStats.total > 0 &&
        currentStats.pending === 0 &&
        currentStats.uploading === 0;

      if (allDone) {
        onAllComplete?.();
      }
    },
    [onAllComplete]
  );

  // Upload a single file
  const upload = useCallback(
    async (file: File, uploadOptions?: UploadOptions): Promise<string> => {
      if (!managerRef.current) {
        throw new Error('Upload manager not initialized');
      }
      return managerRef.current.add(file, uploadOptions);
    },
    []
  );

  // Upload multiple files
  const uploadMultiple = useCallback(
    async (files: File[], uploadOptions?: UploadOptions): Promise<string[]> => {
      if (!managerRef.current) {
        throw new Error('Upload manager not initialized');
      }
      return managerRef.current.addMultiple(files, uploadOptions);
    },
    []
  );

  // Pause upload
  const pause = useCallback((uploadId: string) => {
    managerRef.current?.pause(uploadId);
  }, []);

  // Resume upload
  const resume = useCallback(async (uploadId: string) => {
    await managerRef.current?.resume(uploadId);
  }, []);

  // Cancel upload
  const cancel = useCallback((uploadId: string) => {
    managerRef.current?.cancel(uploadId);
  }, []);

  // Retry failed upload
  const retry = useCallback(async (uploadId: string) => {
    await managerRef.current?.retry(uploadId);
  }, []);

  // Remove upload
  const remove = useCallback((uploadId: string) => {
    managerRef.current?.remove(uploadId);
  }, []);

  // Clear finished uploads
  const clearFinished = useCallback(() => {
    managerRef.current?.clearFinished();
  }, []);

  // Pause all uploads
  const pauseAll = useCallback(() => {
    uploads
      .filter((u) => u.status === 'uploading')
      .forEach((u) => managerRef.current?.pause(u.id));
  }, [uploads]);

  // Resume all uploads
  const resumeAll = useCallback(async () => {
    const paused = uploads.filter((u) => u.status === 'paused');
    for (const u of paused) {
      await managerRef.current?.resume(u.id);
    }
  }, [uploads]);

  // Cancel all uploads
  const cancelAll = useCallback(() => {
    uploads.forEach((u) => managerRef.current?.cancel(u.id));
  }, [uploads]);

  // Get upload by ID
  const getUpload = useCallback((uploadId: string) => {
    return managerRef.current?.getUpload(uploadId);
  }, []);

  // Validate file
  const doValidateFile = useCallback(
    async (file: File) => {
      const result = await validateFile(file, config?.validation);
      return {
        valid: result.valid,
        errors: result.failed.map((f) => f.message),
      };
    },
    [config?.validation]
  );

  // Filter valid files
  const doFilterValid = useCallback(
    (files: File[]) => {
      return filterValidFiles(files, config?.validation);
    },
    [config?.validation]
  );

  // Computed state
  const isUploading = stats.uploading > 0;

  return {
    manager: managerRef.current,
    uploads,
    stats,
    isUploading,
    upload,
    uploadMultiple,
    pause,
    resume,
    cancel,
    retry,
    remove,
    clearFinished,
    pauseAll,
    resumeAll,
    cancelAll,
    getUpload,
    validateFile: doValidateFile,
    filterValid: doFilterValid,
    formatSize: formatFileSize,
  };
}

// ============================================================================
// Simple Upload Hook
// ============================================================================

export interface UseSimpleUploadOptions {
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allowed MIME types */
  allowedTypes?: string[];
  /** Upload URL */
  uploadUrl?: string;
  /** Called on progress */
  onProgress?: (percentage: number) => void;
  /** Called on success */
  onSuccess?: (response: unknown) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

export interface UseSimpleUploadReturn {
  /** Upload a file */
  upload: (file: File) => Promise<void>;
  /** Current progress (0-100) */
  progress: number;
  /** Is currently uploading */
  isUploading: boolean;
  /** Error message if any */
  error: string | null;
  /** Reset state */
  reset: () => void;
}

/**
 * Simple single-file upload hook
 * For quick integration when full queue management isn't needed
 */
export function useSimpleUpload(
  options: UseSimpleUploadOptions = {}
): UseSimpleUploadReturn {
  const {
    maxSize = 500 * 1024 * 1024,
    allowedTypes = [],
    uploadUrl,
    onProgress,
    onSuccess,
    onError,
  } = options;

  const { getToken } = useAuth();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const upload = useCallback(
    async (file: File) => {
      // Validate
      if (file.size > maxSize) {
        const msg = `File too large. Maximum size is ${formatFileSize(maxSize)}`;
        setError(msg);
        onError?.(msg);
        return;
      }

      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        const msg = `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
        setError(msg);
        onError?.(msg);
        return;
      }

      setIsUploading(true);
      setError(null);
      setProgress(0);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const token = await getToken();
        const url = uploadUrl || `${process.env.NEXT_PUBLIC_API_URL}/api/v1/recordings`;

        // Get upload URL
        const initResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            filename: file.name,
            file_size: file.size,
            mime_type: file.type,
          }),
          signal: abortController.signal,
        });

        if (!initResponse.ok) {
          throw new Error(`Failed to initiate upload: ${initResponse.status}`);
        }

        const { upload_url } = await initResponse.json();

        // Upload file with progress
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setProgress(pct);
              onProgress?.(pct);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Network error')));
          xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

          abortController.signal.addEventListener('abort', () => xhr.abort());

          xhr.open('PUT', upload_url);
          if (file.type) {
            xhr.setRequestHeader('Content-Type', file.type);
          }
          if (upload_url.includes('blob.core.windows.net')) {
            xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
          }
          xhr.send(file);
        });

        setProgress(100);
        onSuccess?.({ success: true });
      } catch (e) {
        if (abortController.signal.aborted) {
          setError('Upload cancelled');
          return;
        }
        const msg = e instanceof Error ? e.message : 'Upload failed';
        setError(msg);
        onError?.(msg);
      } finally {
        setIsUploading(false);
        abortControllerRef.current = null;
      }
    },
    [maxSize, allowedTypes, uploadUrl, getToken, onProgress, onSuccess, onError]
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setProgress(0);
    setIsUploading(false);
    setError(null);
  }, []);

  return {
    upload,
    progress,
    isUploading,
    error,
    reset,
  };
}

export default useFileUpload;
