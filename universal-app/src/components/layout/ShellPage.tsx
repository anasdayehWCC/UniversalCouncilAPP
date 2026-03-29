'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type ShellPageProps = React.ComponentPropsWithoutRef<'section'> & {
  children: React.ReactNode;
  contentClassName?: string;
  padded?: boolean;
};

export function ShellPage({
  children,
  className,
  contentClassName,
  padded = true,
  ...sectionProps
}: ShellPageProps) {
  return (
    <section className={cn('min-h-0 flex-1', className)} {...sectionProps}>
      <div
        className={cn(
          'min-h-0 w-full',
          padded && 'px-4 py-6 sm:px-6 lg:px-8',
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}

export default ShellPage;
