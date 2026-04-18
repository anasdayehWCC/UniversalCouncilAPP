'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStatePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Consistent empty-state container: dashed border, muted background, centered content.
 */
export function EmptyStatePanel({ children, className, ...props }: EmptyStatePanelProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default EmptyStatePanel;
