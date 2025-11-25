'use client';

import * as React from 'react';
import { cn } from './utils';

export type SplitViewProps = {
  left: React.ReactNode;
  right: React.ReactNode;
  leftMin?: string;
  rightMin?: string;
  className?: string;
};

export function SplitView({
  left,
  right,
  leftMin = '320px',
  rightMin = '320px',
  className,
}: SplitViewProps) {
  return (
    <div
      className={cn(
        'grid gap-4 lg:grid-cols-[1fr,1fr] rounded-3xl border border-white/10 bg-white/70 p-4 backdrop-blur',
        className,
      )}
      style={
        {
          '--left-min': leftMin,
          '--right-min': rightMin,
        } as React.CSSProperties
      }
    >
      <div className="min-w-[var(--left-min)]">{left}</div>
      <div className="min-w-[var(--right-min)]">{right}</div>
    </div>
  );
}
