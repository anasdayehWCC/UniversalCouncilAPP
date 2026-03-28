'use client';

/**
 * CopyButton component
 * A button that copies content to clipboard with visual feedback
 */

import { useState, useCallback } from 'react';
import { Check, Copy, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { copy } from '@/lib/clipboard';
import type { CopyButtonProps, ClipboardResult, RichClipboardContent } from '@/lib/clipboard/types';

/** Button variant styles */
const variantStyles = {
  default:
    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  ghost:
    'hover:bg-accent hover:text-accent-foreground',
  outline:
    'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  icon:
    'hover:bg-accent hover:text-accent-foreground rounded-md',
};

/** Button size styles */
const sizeStyles = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-6 text-base',
  icon: 'h-8 w-8 p-0',
};

type CopyState = 'idle' | 'copied' | 'error';

/**
 * CopyButton - A button that copies content to clipboard with visual feedback
 *
 * @example
 * ```tsx
 * // Simple text copy
 * <CopyButton content="Hello, World!" />
 *
 * // With custom content
 * <CopyButton
 *   content={{ text: 'Plain text', html: '<b>Rich text</b>' }}
 *   variant="outline"
 *   size="sm"
 *   onCopy={(result) => console.log('Copied!', result)}
 * />
 *
 * // Icon-only button
 * <CopyButton content="Copy me" variant="icon" size="icon" />
 * ```
 */
export function CopyButton({
  content,
  options,
  className,
  variant = 'ghost',
  size = 'icon',
  successDuration = 2000,
  successContent,
  defaultContent,
  onCopy,
  onError,
  'aria-label': ariaLabel,
  disabled,
}: CopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle');

  const handleCopy = useCallback(async () => {
    if (disabled) return;

    try {
      // Get content (supports function for lazy evaluation)
      const contentToCopy: string | RichClipboardContent =
        typeof content === 'function' ? content() : content;

      const result: ClipboardResult = await copy(contentToCopy, options);

      if (result.success) {
        setState('copied');
        onCopy?.(result);

        // Reset after duration
        setTimeout(() => {
          setState('idle');
        }, successDuration);
      } else {
        setState('error');
        if (result.error) {
          onError?.(result.error);
        }

        // Reset after duration
        setTimeout(() => {
          setState('idle');
        }, successDuration);
      }
    } catch (error) {
      setState('error');
      onError?.({
        code: 'UNKNOWN',
        message: 'Failed to copy',
        cause: error,
      });

      setTimeout(() => {
        setState('idle');
      }, successDuration);
    }
  }, [content, options, disabled, onCopy, onError, successDuration]);

  // Determine what to render based on state
  const renderContent = () => {
    switch (state) {
      case 'copied':
        return successContent || (
          <>
            <Check className="h-4 w-4" />
            {size !== 'icon' && <span className="ml-1.5">Copied!</span>}
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="h-4 w-4 text-destructive" />
            {size !== 'icon' && <span className="ml-1.5">Failed</span>}
          </>
        );
      default:
        return defaultContent || (
          <>
            <Copy className="h-4 w-4" />
            {size !== 'icon' && <span className="ml-1.5">Copy</span>}
          </>
        );
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      aria-label={ariaLabel || 'Copy to clipboard'}
      aria-live="polite"
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-all duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        state === 'copied' && 'text-green-600 dark:text-green-400',
        state === 'error' && 'text-destructive',
        className
      )}
    >
      {renderContent()}
    </button>
  );
}

export default CopyButton;
