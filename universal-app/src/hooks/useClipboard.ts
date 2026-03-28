'use client';

/**
 * useClipboard hook
 * Provides clipboard operations with status tracking and feedback
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ClipboardStatus,
  ClipboardError,
  ClipboardResult,
  CopyOptions,
  PasteOptions,
  RichClipboardContent,
  UseClipboardReturn,
} from '@/lib/clipboard/types';
import {
  copy,
  copyImage as copyImageUtil,
  paste as pasteUtil,
  isClipboardSupported,
} from '@/lib/clipboard';

/** Hook options */
interface UseClipboardOptions {
  /** Reset to idle after successful copy (ms) */
  resetDelay?: number;
  /** Default copy options */
  copyOptions?: CopyOptions;
  /** Default paste options */
  pasteOptions?: PasteOptions;
  /** Callback on successful copy */
  onCopySuccess?: (result: ClipboardResult) => void;
  /** Callback on copy error */
  onCopyError?: (error: ClipboardError) => void;
  /** Callback on successful paste */
  onPasteSuccess?: (result: ClipboardResult<string>) => void;
  /** Callback on paste error */
  onPasteError?: (error: ClipboardError) => void;
}

/**
 * Hook for clipboard operations with status tracking
 *
 * @example
 * ```tsx
 * const { copy, status, copiedText, isSupported } = useClipboard();
 *
 * const handleCopy = async () => {
 *   const result = await copy('Hello, World!');
 *   if (result.success) {
 *     console.log('Copied!');
 *   }
 * };
 * ```
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const {
    resetDelay = 2000,
    copyOptions,
    pasteOptions,
    onCopySuccess,
    onCopyError,
    onPasteSuccess,
    onPasteError,
  } = options;

  const [status, setStatus] = useState<ClipboardStatus>('idle');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [error, setError] = useState<ClipboardError | null>(null);
  const [isSupported] = useState(() => isClipboardSupported());

  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  // Schedule status reset
  const scheduleReset = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    if (resetDelay > 0) {
      resetTimeoutRef.current = setTimeout(() => {
        setStatus('idle');
        setCopiedText(null);
        setError(null);
      }, resetDelay);
    }
  }, [resetDelay]);

  // Copy function
  const copyFn = useCallback(
    async (
      content: string | RichClipboardContent,
      opts?: CopyOptions
    ): Promise<ClipboardResult> => {
      setStatus('copying');
      setError(null);

      const mergedOptions = { ...copyOptions, ...opts };
      const result = await copy(content, mergedOptions);

      if (result.success) {
        setStatus('copied');
        setCopiedText(typeof content === 'string' ? content : content.text);
        onCopySuccess?.(result);
        scheduleReset();
      } else {
        setStatus('error');
        setError(result.error || null);
        onCopyError?.(result.error!);
        scheduleReset();
      }

      return result;
    },
    [copyOptions, onCopySuccess, onCopyError, scheduleReset]
  );

  // Copy image function
  const copyImageFn = useCallback(
    async (image: Blob | HTMLCanvasElement | HTMLImageElement): Promise<ClipboardResult> => {
      setStatus('copying');
      setError(null);

      const result = await copyImageUtil(image);

      if (result.success) {
        setStatus('copied');
        setCopiedText('[Image]');
        onCopySuccess?.(result);
        scheduleReset();
      } else {
        setStatus('error');
        setError(result.error || null);
        onCopyError?.(result.error!);
        scheduleReset();
      }

      return result;
    },
    [onCopySuccess, onCopyError, scheduleReset]
  );

  // Paste function
  const pasteFn = useCallback(
    async (opts?: PasteOptions): Promise<ClipboardResult<string>> => {
      setStatus('pasting');
      setError(null);

      const mergedOptions = { ...pasteOptions, ...opts };
      const result = await pasteUtil(mergedOptions);

      if (result.success) {
        setStatus('pasted');
        onPasteSuccess?.(result);
        scheduleReset();
      } else {
        setStatus('error');
        setError(result.error || null);
        onPasteError?.(result.error!);
        scheduleReset();
      }

      return result;
    },
    [pasteOptions, onPasteSuccess, onPasteError, scheduleReset]
  );

  // Reset function
  const reset = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    setStatus('idle');
    setCopiedText(null);
    setError(null);
  }, []);

  return {
    // State
    status,
    copiedText,
    error,
    isSupported,
    // Actions
    copy: copyFn,
    copyImage: copyImageFn,
    paste: pasteFn,
    reset,
  };
}

export default useClipboard;
