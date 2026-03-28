/**
 * Visually Hidden Component
 * 
 * Hides content visually while keeping it accessible to screen readers.
 * Also known as "sr-only" (screen-reader only).
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface VisuallyHiddenProps {
  /** Content to hide visually */
  children: React.ReactNode;
  /** Whether to use span (inline) or div (block) */
  as?: 'span' | 'div';
  /** Make visible when focused (for skip links) */
  focusable?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** ID for aria-labelledby references */
  id?: string;
}

/**
 * CSS for visually hidden content
 * This technique hides content from sighted users while keeping it
 * accessible to screen readers and other assistive technology.
 */
const visuallyHiddenStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
};

/**
 * VisuallyHidden Component
 * 
 * Renders content that is hidden from visual users but remains
 * accessible to screen readers.
 * 
 * @example
 * ```tsx
 * // Hide label visually but keep accessible
 * <button>
 *   <Icon name="close" />
 *   <VisuallyHidden>Close dialog</VisuallyHidden>
 * </button>
 * 
 * // Add context for screen readers
 * <VisuallyHidden>Currently showing:</VisuallyHidden>
 * <span>Page 1 of 10</span>
 * ```
 */
export function VisuallyHidden({
  children,
  as: Component = 'span',
  focusable = false,
  className,
  id,
}: VisuallyHiddenProps) {
  if (focusable) {
    // Use Tailwind classes for focusable version
    return (
      <Component
        id={id}
        className={cn(
          // Hidden by default
          'sr-only',
          // Visible when focused
          'focus:not-sr-only focus:absolute focus:z-50',
          'focus:px-4 focus:py-2 focus:bg-white focus:text-black',
          'focus:rounded focus:shadow-lg',
          className
        )}
        tabIndex={0}
      >
        {children}
      </Component>
    );
  }
  
  // Standard visually hidden (using inline styles for reliability)
  return (
    <Component
      id={id}
      style={visuallyHiddenStyles}
      className={className}
    >
      {children}
    </Component>
  );
}

/**
 * SROnly Component
 * 
 * Alias for VisuallyHidden with more familiar naming.
 */
export function SROnly(props: VisuallyHiddenProps) {
  return <VisuallyHidden {...props} />;
}

/**
 * AccessibleLabel Component
 * 
 * Creates a hidden label for form elements or interactive components
 * that need accessible names without visible labels.
 * 
 * @example
 * ```tsx
 * <div>
 *   <AccessibleLabel htmlFor="search-input">
 *     Search the site
 *   </AccessibleLabel>
 *   <input id="search-input" type="search" placeholder="Search..." />
 * </div>
 * ```
 */
export function AccessibleLabel({
  children,
  htmlFor,
  id,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  id?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      id={id}
      style={visuallyHiddenStyles}
      className={className}
    >
      {children}
    </label>
  );
}

/**
 * AccessibleDescription Component
 * 
 * Creates a hidden description for aria-describedby references.
 * 
 * @example
 * ```tsx
 * <button aria-describedby="delete-desc">Delete</button>
 * <AccessibleDescription id="delete-desc">
 *   This action cannot be undone. All data will be permanently removed.
 * </AccessibleDescription>
 * ```
 */
export function AccessibleDescription({
  children,
  id,
  className,
}: {
  children: React.ReactNode;
  id: string;
  className?: string;
}) {
  return (
    <VisuallyHidden id={id} as="div" className={className}>
      {children}
    </VisuallyHidden>
  );
}

/**
 * LiveAnnouncement Component
 * 
 * Visually hidden live region for dynamic announcements.
 * 
 * @example
 * ```tsx
 * <LiveAnnouncement>
 *   {loadingComplete ? 'Content loaded successfully' : ''}
 * </LiveAnnouncement>
 * ```
 */
export function LiveAnnouncement({
  children,
  politeness = 'polite',
  atomic = true,
  className,
}: {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      style={visuallyHiddenStyles}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * SkipLink Anchor Component
 * 
 * Creates an anchor target for skip links.
 * 
 * @example
 * ```tsx
 * <SkipLinkAnchor id="main-content" />
 * <main>...</main>
 * ```
 */
export function SkipLinkAnchor({
  id,
  label,
}: {
  id: string;
  label?: string;
}) {
  return (
    <span
      id={id}
      tabIndex={-1}
      style={visuallyHiddenStyles}
      aria-label={label}
    />
  );
}

export default VisuallyHidden;
