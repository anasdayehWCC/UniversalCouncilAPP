'use client';

/**
 * HelpTooltip Component
 *
 * Help icon with rich tooltip content including documentation links
 * and "don't show again" functionality for persistent dismissal.
 *
 * @module components/help/HelpTooltip
 */

import * as React from 'react';
import { HelpCircle, ExternalLink, X, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipPortal,
} from '@/components/ui/tooltip';
import { getHelpContent, type HelpContent } from '@/lib/help/content';

// ============================================================================
// Types
// ============================================================================

export interface HelpTooltipProps {
  /** Help topic ID from centralized content, OR inline content */
  topicId?: string;
  /** Inline content (when not using centralized topics) */
  title?: string;
  content?: React.ReactNode;
  docsUrl?: string;
  /** Tooltip position */
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  /** Icon size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual style */
  variant?: 'default' | 'subtle' | 'inline';
  /** Storage key for "don't show again" (enables the feature when provided) */
  dismissKey?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback when help is viewed */
  onView?: () => void;
  /** Show full body content (instead of just summary) */
  showFullContent?: boolean;
  /** Delay before showing tooltip */
  delayDuration?: number;
}

// ============================================================================
// Storage Helpers
// ============================================================================

const DISMISSED_HELP_KEY = 'help_dismissed_topics';

function getDismissedTopics(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DISMISSED_HELP_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setDismissedTopic(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDismissedTopics();
    if (!current.includes(key)) {
      localStorage.setItem(DISMISSED_HELP_KEY, JSON.stringify([...current, key]));
    }
  } catch {
    // Ignore storage errors
  }
}

function removeDismissedTopic(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDismissedTopics();
    localStorage.setItem(
      DISMISSED_HELP_KEY,
      JSON.stringify(current.filter((k) => k !== key))
    );
  } catch {
    // Ignore storage errors
  }
}

export function resetDismissedHelp(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DISMISSED_HELP_KEY);
}

// ============================================================================
// Help Icon Button
// ============================================================================

interface HelpIconProps {
  size: 'sm' | 'md' | 'lg';
  variant: 'default' | 'subtle' | 'inline';
  className?: string;
}

const HelpIcon = React.forwardRef<HTMLButtonElement, HelpIconProps>(
  ({ size, variant, className }, ref) => {
    const sizeClasses = {
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    const variantClasses = {
      default: cn(
        'text-muted-foreground hover:text-[var(--primary)]',
        'dark:text-muted-foreground dark:hover:text-[var(--primary)]'
      ),
      subtle: cn(
        'text-muted-foreground hover:text-foreground',
        'dark:text-muted-foreground dark:hover:text-foreground'
      ),
      inline: cn(
        'text-[var(--primary)] opacity-70 hover:opacity-100'
      ),
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1',
          variantClasses[variant],
          className
        )}
        aria-label="Help"
      >
        <HelpCircle className={sizeClasses[size]} />
      </button>
    );
  }
);
HelpIcon.displayName = 'HelpIcon';

// ============================================================================
// Main Component
// ============================================================================

/**
 * Help tooltip with optional "don't show again" functionality.
 *
 * @example
 * ```tsx
 * // Using centralized content by topic ID
 * <HelpTooltip topicId="recording-start" />
 *
 * // Using inline content
 * <HelpTooltip
 *   title="Processing Mode"
 *   content="Choose Fast for urgent work or Economy for cost savings."
 *   docsUrl="/docs/processing"
 * />
 *
 * // With don't show again
 * <HelpTooltip
 *   topicId="onboarding-intro"
 *   dismissKey="onboarding-intro"
 * />
 * ```
 */
export function HelpTooltip({
  topicId,
  title: inlineTitle,
  content: inlineContent,
  docsUrl: inlineDocsUrl,
  side = 'top',
  align = 'center',
  size = 'md',
  variant = 'default',
  dismissKey,
  className,
  onView,
  showFullContent = false,
  delayDuration = 200,
}: HelpTooltipProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  // Load centralized content if topicId provided
  const topicContent = topicId ? getHelpContent(topicId) : undefined;

  // Merge centralized and inline content (inline takes precedence)
  const title = inlineTitle || topicContent?.title;
  const content = inlineContent || (showFullContent ? topicContent?.body : topicContent?.summary);
  const docsUrl = inlineDocsUrl || topicContent?.docsUrl;

  // Check if this help has been dismissed
  React.useEffect(() => {
    if (dismissKey) {
      const dismissed = getDismissedTopics();
      setIsDismissed(dismissed.includes(dismissKey));
    }
  }, [dismissKey]);

  // Track view callback
  React.useEffect(() => {
    if (isOpen && onView) {
      onView();
    }
  }, [isOpen, onView]);

  // Handle dismissal
  const handleDismiss = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (dismissKey) {
        setDismissedTopic(dismissKey);
        setIsDismissed(true);
        setIsOpen(false);
      }
    },
    [dismissKey]
  );

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  // Don't render if no content
  if (!content && !title) {
    return null;
  }

  return (
    <TooltipRoot
      delayDuration={delayDuration}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <TooltipTrigger asChild>
        <HelpIcon size={size} variant={variant} className={className} />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          side={side}
          align={align}
          sideOffset={8}
          className={cn(
            'relative max-w-xs p-0 bg-card dark:bg-card',
            'border border-border dark:border-border',
            'text-foreground dark:text-foreground'
          )}
          showArrow={false}
        >
          {/* Close/Dismiss button */}
          {dismissKey && (
            <button
              onClick={handleDismiss}
              className={cn(
                'absolute right-2 top-2 rounded-sm opacity-70 hover:opacity-100',
                'text-muted-foreground hover:text-foreground',
                'dark:text-muted-foreground dark:hover:text-foreground',
                'transition-opacity'
              )}
              aria-label="Don't show again"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Content */}
          <div className="p-3 pr-8">
            {title && (
              <div className="font-medium text-sm mb-1">{title}</div>
            )}
            {typeof content === 'string' ? (
              <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
                {content}
              </p>
            ) : (
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                {content}
              </div>
            )}
          </div>

          {/* Footer with docs link */}
          {docsUrl && (
            <div
              className={cn(
                'px-3 py-2 border-t border-border dark:border-border',
                'bg-muted dark:bg-muted rounded-b-md'
              )}
            >
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-medium',
                  'text-[var(--primary)] hover:underline'
                )}
              >
                <BookOpen className="h-3 w-3" />
                Learn more
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            </div>
          )}

          {/* Don't show again text (shown when dismissKey is provided) */}
          {dismissKey && (
            <div
              className={cn(
                'px-3 py-1.5 text-[10px] text-muted-foreground dark:text-muted-foreground',
                'border-t border-border dark:border-border',
                'bg-muted dark:bg-muted rounded-b-md'
              )}
            >
              Click × to hide this tip permanently
            </div>
          )}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  );
}

// ============================================================================
// Label with Help
// ============================================================================

interface LabelWithHelpProps {
  /** Label text */
  label: string;
  /** Help topic ID or content */
  helpTopicId?: string;
  helpContent?: React.ReactNode;
  helpDocsUrl?: string;
  /** Whether field is required */
  required?: boolean;
  /** HTML for attribute */
  htmlFor?: string;
  /** Additional className for label */
  className?: string;
}

/**
 * Form label with integrated help tooltip.
 *
 * @example
 * ```tsx
 * <LabelWithHelp
 *   label="Case Reference"
 *   helpTopicId="case-reference-format"
 *   htmlFor="case-ref-input"
 *   required
 * />
 * <input id="case-ref-input" ... />
 * ```
 */
export function LabelWithHelp({
  label,
  helpTopicId,
  helpContent,
  helpDocsUrl,
  required,
  htmlFor,
  className,
}: LabelWithHelpProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-foreground dark:text-foreground"
      >
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <HelpTooltip
        topicId={helpTopicId}
        content={helpContent}
        docsUrl={helpDocsUrl}
        size="sm"
        variant="subtle"
      />
    </div>
  );
}

// ============================================================================
// Inline Help Text
// ============================================================================

interface InlineHelpProps {
  /** Help text or topic ID */
  text?: string;
  topicId?: string;
  /** Visual variant */
  variant?: 'default' | 'warning' | 'info';
  /** Additional className */
  className?: string;
}

/**
 * Inline help text shown below form fields.
 *
 * @example
 * ```tsx
 * <input type="text" />
 * <InlineHelp text="Enter the full case reference number" />
 * ```
 */
export function InlineHelp({
  text,
  topicId,
  variant = 'default',
  className,
}: InlineHelpProps) {
  const topicContent = topicId ? getHelpContent(topicId) : undefined;
  const displayText = text || topicContent?.summary;

  if (!displayText) return null;

  const variantClasses = {
    default: 'text-muted-foreground dark:text-muted-foreground',
    warning: 'text-warning dark:text-warning',
    info: 'text-info dark:text-info',
  };

  return (
    <p className={cn('text-xs mt-1', variantClasses[variant], className)}>
      {displayText}
    </p>
  );
}

// ============================================================================
// Exports
// ============================================================================

// resetDismissedHelp is exported inline
