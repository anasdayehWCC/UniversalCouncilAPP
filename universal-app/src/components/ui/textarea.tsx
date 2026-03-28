'use client';

/**
 * Textarea Component
 * 
 * Multi-line text input with consistent styling and accessibility.
 * 
 * @module components/ui/textarea
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Visual variant */
  variant?: 'default' | 'error';
  /** Whether to auto-resize based on content */
  autoResize?: boolean;
}

// ============================================================================
// Component
// ============================================================================

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', autoResize = false, ...props }, ref) => {
    const handleInput = React.useCallback(
      (e: React.FormEvent<HTMLTextAreaElement>) => {
        if (autoResize) {
          const target = e.currentTarget;
          target.style.height = 'auto';
          target.style.height = `${target.scrollHeight}px`;
        }
      },
      [autoResize]
    );

    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2',
          'text-sm ring-offset-white placeholder:text-slate-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-200',
          variant === 'default' && [
            'border-slate-300',
            'focus-visible:ring-[var(--primary,#2563eb)]',
            'focus-visible:border-[var(--primary,#2563eb)]',
          ],
          variant === 'error' && [
            'border-red-500',
            'focus-visible:ring-red-500',
            'focus-visible:border-red-500',
          ],
          autoResize && 'resize-none overflow-hidden',
          className
        )}
        ref={ref}
        onInput={handleInput}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
