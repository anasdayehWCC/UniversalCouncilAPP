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
          'flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2',
          'text-sm text-foreground ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-200',
          variant === 'default' && [
            'border-input',
            'focus-visible:border-ring',
          ],
          variant === 'error' && [
            'border-error',
            'focus-visible:ring-error',
            'focus-visible:border-error',
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
