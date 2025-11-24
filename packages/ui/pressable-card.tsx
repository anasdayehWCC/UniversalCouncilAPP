'use client';

import * as React from 'react';
import { cn } from './utils';

type PressableProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  subtle?: boolean;
};

export const PressableCard = React.forwardRef<HTMLButtonElement, PressableProps>(
  ({ className, children, subtle = false, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'group relative flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        subtle && 'border-transparent bg-muted hover:shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
PressableCard.displayName = 'PressableCard';
