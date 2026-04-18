'use client';

/**
 * Skip Links Component
 * 
 * Provides skip navigation links for keyboard users to bypass
 * repetitive content and jump to main sections.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkipLinkTarget {
  /** Target element ID (without #) */
  id: string;
  /** Visible label for the skip link */
  label: string;
}

export interface SkipLinksProps {
  /** Links to display */
  links?: SkipLinkTarget[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Default skip link targets
 */
const DEFAULT_LINKS: SkipLinkTarget[] = [
  { id: 'main-content', label: 'Skip to main content' },
  { id: 'main-navigation', label: 'Skip to navigation' },
];

/**
 * SkipLinks Component
 * 
 * Renders visually hidden links that become visible on focus,
 * allowing keyboard users to skip to main content areas.
 * 
 * @example
 * ```tsx
 * // In your layout
 * <SkipLinks />
 * <header id="main-navigation">...</header>
 * <main id="main-content">...</main>
 * ```
 */
export function SkipLinks({ links = DEFAULT_LINKS, className }: SkipLinksProps) {
  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    event.preventDefault();
    
    const target = document.getElementById(targetId);
    if (target) {
      // Make target focusable if not interactive
      if (!target.hasAttribute('tabindex')) {
        target.tabIndex = -1;
      }
      target.focus({ preventScroll: false });
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  return (
    <nav
      aria-label="Skip links"
      className={cn(
        'fixed top-0 left-0 z-[100] flex flex-col gap-1 p-2',
        className
      )}
    >
      {links.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={(e) => handleClick(e, id)}
          className={cn(
            // Visually hidden by default
            'sr-only focus:not-sr-only',
            // Visible styles when focused
            'focus:relative focus:block',
            'focus:px-4 focus:py-2',
            'focus:bg-[var(--primary)] focus:text-white',
            'focus:rounded-md focus:shadow-lg',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]',
            'font-medium text-sm',
            'transition-transform duration-200',
            'focus:transform focus:translate-x-0',
            '-translate-x-full'
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

/**
 * Skip to content link (simplified version)
 */
export function SkipToContent({
  targetId = 'main-content',
  label = 'Skip to main content',
  className,
}: {
  targetId?: string;
  label?: string;
  className?: string;
}) {
  return (
    <SkipLinks
      links={[{ id: targetId, label }]}
      className={className}
    />
  );
}

export default SkipLinks;
