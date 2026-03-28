'use client';

/**
 * Tooltip Component
 *
 * Enhanced tooltip built on Radix UI Tooltip primitive with support for
 * rich content, multiple positions, delay control, and accessibility.
 *
 * @module components/ui/tooltip
 */

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
export type TooltipAlign = 'start' | 'center' | 'end';

export interface TooltipProps {
  /** Tooltip trigger element */
  children: React.ReactNode;
  /** Tooltip content - can be string or rich React content */
  content: React.ReactNode;
  /** Side to render tooltip relative to trigger */
  side?: TooltipSide;
  /** Alignment relative to trigger */
  align?: TooltipAlign;
  /** Offset from trigger in pixels */
  sideOffset?: number;
  /** Delay before showing tooltip (ms) */
  delayDuration?: number;
  /** Delay before hiding tooltip after leaving (ms) */
  skipDelayDuration?: number;
  /** Whether tooltip can be dismissed by clicking outside */
  disableHoverableContent?: boolean;
  /** Additional class names for trigger wrapper */
  triggerClassName?: string;
  /** Additional class names for content container */
  contentClassName?: string;
  /** Disable tooltip entirely */
  disabled?: boolean;
  /** Whether tooltip is initially open (controlled) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Arrow style variant */
  arrow?: boolean | 'subtle';
  /** Max width of tooltip content */
  maxWidth?: number | string;
}

// ============================================================================
// Provider
// ============================================================================

/**
 * Wrap your app with TooltipProvider to enable tooltips globally.
 * Sets default delay behavior for all tooltips.
 *
 * @example
 * ```tsx
 * <TooltipProvider>
 *   <App />
 * </TooltipProvider>
 * ```
 */
export const TooltipProvider = TooltipPrimitive.Provider;

// ============================================================================
// Root Components (for primitive usage)
// ============================================================================

const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipPortal = TooltipPrimitive.Portal;
const TooltipArrow = TooltipPrimitive.Arrow;

// ============================================================================
// Content Component
// ============================================================================

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    showArrow?: boolean | 'subtle';
    maxWidth?: number | string;
  }
>(
  (
    {
      className,
      sideOffset = 4,
      side = 'top',
      align = 'center',
      showArrow = true,
      maxWidth = 280,
      children,
      ...props
    },
    ref
  ) => (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      side={side}
      align={align}
      className={cn(
        // Base styles
        'z-[100] overflow-hidden rounded-md px-3 py-2',
        // Colors
        'bg-slate-900 text-slate-50',
        'dark:bg-slate-50 dark:text-slate-900',
        // Typography
        'text-sm leading-relaxed',
        // Shadow & border
        'shadow-lg border border-slate-800',
        'dark:border-slate-200',
        // Animations
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        // Slide animations based on side
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      style={{
        maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
      }}
      {...props}
    >
      {children}
      {showArrow && (
        <TooltipArrow
          className={cn(
            'fill-slate-900 dark:fill-slate-50',
            showArrow === 'subtle' && 'opacity-80'
          )}
          width={8}
          height={4}
        />
      )}
    </TooltipPrimitive.Content>
  )
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// ============================================================================
// Composed Tooltip Component
// ============================================================================

/**
 * All-in-one Tooltip component with sensible defaults.
 *
 * @example
 * ```tsx
 * // Simple text tooltip
 * <Tooltip content="Save your changes">
 *   <button>Save</button>
 * </Tooltip>
 *
 * // Rich content tooltip
 * <Tooltip
 *   content={
 *     <div>
 *       <strong>Keyboard Shortcut</strong>
 *       <kbd className="ml-2">⌘S</kbd>
 *     </div>
 *   }
 *   side="bottom"
 *   delayDuration={100}
 * >
 *   <button>Save</button>
 * </Tooltip>
 * ```
 */
export function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  sideOffset = 6,
  delayDuration = 300,
  skipDelayDuration: _skipDelayDuration = 100, // Not used - Provider controls this
  disableHoverableContent = false,
  triggerClassName,
  contentClassName,
  disabled = false,
  open,
  onOpenChange,
  arrow = true,
  maxWidth = 280,
}: TooltipProps) {
  // Don't render tooltip if disabled or no content
  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <TooltipRoot
      delayDuration={delayDuration}
      disableHoverableContent={disableHoverableContent}
      open={open}
      onOpenChange={onOpenChange}
    >
      <TooltipTrigger asChild className={triggerClassName}>
        {children}
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          side={side}
          align={align}
          sideOffset={sideOffset}
          showArrow={arrow}
          maxWidth={maxWidth}
          className={contentClassName}
        >
          {content}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  );
}

// ============================================================================
// Info Tooltip Variant
// ============================================================================

interface InfoTooltipProps extends Omit<TooltipProps, 'children'> {
  /** Icon size */
  size?: 'sm' | 'md' | 'lg';
  /** Icon color variant */
  variant?: 'default' | 'primary' | 'muted';
}

/**
 * Standalone info icon with tooltip.
 *
 * @example
 * ```tsx
 * <div className="flex items-center gap-2">
 *   <label>Processing Mode</label>
 *   <InfoTooltip
 *     content="Choose 'Fast' for urgent transcriptions or 'Economy' for cost savings"
 *   />
 * </div>
 * ```
 */
export function InfoTooltip({
  content,
  size = 'md',
  variant = 'muted',
  ...props
}: InfoTooltipProps) {
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const variantClasses = {
    default: 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
    primary: 'text-[var(--primary)] hover:text-[var(--primary-hover)]',
    muted: 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400',
  };

  return (
    <Tooltip content={content} delayDuration={200} {...props}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
          variantClasses[variant]
        )}
        aria-label="More information"
      >
        <svg
          className={sizeClasses[size]}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </Tooltip>
  );
}

// ============================================================================
// Keyboard Shortcut Tooltip
// ============================================================================

interface ShortcutTooltipProps extends Omit<TooltipProps, 'content'> {
  /** Action description */
  label: string;
  /** Keyboard shortcut keys */
  shortcut: string[];
}

/**
 * Tooltip showing action with keyboard shortcut.
 *
 * @example
 * ```tsx
 * <ShortcutTooltip label="Save" shortcut={['⌘', 'S']}>
 *   <button>Save</button>
 * </ShortcutTooltip>
 * ```
 */
export function ShortcutTooltip({
  label,
  shortcut,
  children,
  ...props
}: ShortcutTooltipProps) {
  return (
    <Tooltip
      content={
        <div className="flex items-center gap-2">
          <span>{label}</span>
          <span className="flex items-center gap-0.5">
            {shortcut.map((key, i) => (
              <kbd
                key={i}
                className={cn(
                  'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded px-1',
                  'bg-slate-700 text-[10px] font-medium text-slate-200',
                  'dark:bg-slate-200 dark:text-slate-700'
                )}
              >
                {key}
              </kbd>
            ))}
          </span>
        </div>
      }
      {...props}
    >
      {children}
    </Tooltip>
  );
}

// ============================================================================
// Exports
// ============================================================================

export {
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipPortal,
  TooltipArrow,
};
