'use client';

/**
 * Live Region Component
 * 
 * ARIA live region for screen reader announcements.
 * Dynamically announces content changes to assistive technology.
 */

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { AriaLivePoliteness, Announcement } from '@/lib/a11y/types';
import { useAnnouncementQueue } from '@/lib/a11y/announcer';

export interface LiveRegionProps {
  /** Politeness level: 'polite' waits, 'assertive' interrupts */
  politeness?: AriaLivePoliteness;
  /** Whether the region is atomic (announce all content) */
  atomic?: boolean;
  /** What types of changes to announce */
  relevant?: 'additions' | 'removals' | 'text' | 'all' | 'additions text';
  /** Additional CSS classes */
  className?: string;
  /** Children to render (optional, usually empty for dynamic announcements) */
  children?: React.ReactNode;
  /** Whether to visually show announcements (for debugging) */
  debug?: boolean;
}

/**
 * LiveRegion Component
 * 
 * Creates an ARIA live region that announces content changes to screen readers.
 * By default, it's visually hidden but accessible to assistive technology.
 * 
 * @example
 * ```tsx
 * // Polite announcement (waits for current speech to finish)
 * <LiveRegion politeness="polite">
 *   {status}
 * </LiveRegion>
 * 
 * // Assertive announcement (interrupts current speech)
 * <LiveRegion politeness="assertive">
 *   {error}
 * </LiveRegion>
 * ```
 */
export function LiveRegion({
  politeness = 'polite',
  atomic = true,
  relevant = 'additions text',
  className,
  children,
  debug = false,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn(
        // Visually hidden unless debugging
        !debug && 'sr-only',
        debug && 'fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-sm z-50',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Global Announcer Component
 * 
 * Renders live regions for both polite and assertive announcements.
 * Should be placed once at the root of your app.
 */
export function GlobalAnnouncer({ debug = false }: { debug?: boolean }) {
  const { queue } = useAnnouncementQueue();
  
  // Separate announcements by politeness
  const politeAnnouncements = queue.filter((a) => a.politeness === 'polite');
  const assertiveAnnouncements = queue.filter((a) => a.politeness === 'assertive');
  
  // Get latest message for each type
  const latestPolite = politeAnnouncements[politeAnnouncements.length - 1];
  const latestAssertive = assertiveAnnouncements[assertiveAnnouncements.length - 1];
  
  return (
    <>
      {/* Polite live region */}
      <LiveRegion
        politeness="polite"
        debug={debug}
        className={debug ? 'bottom-4' : undefined}
      >
        <AnnouncementContent announcement={latestPolite} />
      </LiveRegion>
      
      {/* Assertive live region */}
      <LiveRegion
        politeness="assertive"
        debug={debug}
        className={debug ? 'bottom-20' : undefined}
      >
        <AnnouncementContent announcement={latestAssertive} />
      </LiveRegion>
    </>
  );
}

/**
 * Announcement content with key for re-render
 */
function AnnouncementContent({ announcement }: { announcement?: Announcement }) {
  // Use a key to force re-announcement of same content
  if (!announcement) return null;
  
  return (
    <span key={announcement.id}>
      {announcement.message}
    </span>
  );
}

/**
 * UseAnnouncementRegion Hook
 * 
 * Creates a managed live region with announcement function.
 */
export function useAnnouncementRegion(
  politeness: AriaLivePoliteness = 'polite'
): {
  message: string;
  announce: (text: string) => void;
  clear: () => void;
  LiveRegionComponent: React.FC<{ debug?: boolean }>;
} {
  const [message, setMessage] = useState('');
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  
  const announce = (text: string) => {
    // Clear previous timeout
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }
    
    // Clear first, then set (ensures re-announcement)
    setMessage('');
    requestAnimationFrame(() => {
      setMessage(text);
    });
    
    // Auto-clear after delay
    clearTimeoutRef.current = setTimeout(() => {
      setMessage('');
    }, 5000);
  };
  
  const clear = () => {
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }
    setMessage('');
  };
  
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);
  
  const LiveRegionComponent: React.FC<{ debug?: boolean }> = ({
    debug = false,
  }) => (
    <LiveRegion politeness={politeness} debug={debug}>
      {message}
    </LiveRegion>
  );
  
  return {
    message,
    announce,
    clear,
    LiveRegionComponent,
  };
}

/**
 * Status Announcer Component
 * 
 * Specialized live region for status updates.
 */
export function StatusAnnouncer({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  const [announced, setAnnounced] = useState('');
  
  useEffect(() => {
    if (status && status !== announced) {
      // Small delay to ensure DOM update
      const timeoutId = setTimeout(() => {
        setAnnounced(status);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [status, announced]);
  
  return (
    <LiveRegion politeness="polite" className={className}>
      {announced}
    </LiveRegion>
  );
}

/**
 * Error Announcer Component
 * 
 * Specialized live region for error messages (assertive).
 */
export function ErrorAnnouncer({
  error,
  className,
}: {
  error: string | null | undefined;
  className?: string;
}) {
  const [announced, setAnnounced] = useState('');
  
  useEffect(() => {
    if (error && error !== announced) {
      setAnnounced('');
      requestAnimationFrame(() => {
        setAnnounced(`Error: ${error}`);
      });
    } else if (!error) {
      setAnnounced('');
    }
  }, [error, announced]);
  
  return (
    <LiveRegion politeness="assertive" className={className}>
      {announced}
    </LiveRegion>
  );
}

export default LiveRegion;
