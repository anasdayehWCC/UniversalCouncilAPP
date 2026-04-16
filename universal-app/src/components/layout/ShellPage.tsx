'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type ShellPageProps = React.ComponentPropsWithoutRef<'section'> & {
  children: React.ReactNode;
  header?: React.ReactNode;
  inspector?: React.ReactNode;
  contentClassName?: string;
  bodyClassName?: string;
  headerClassName?: string;
  inspectorClassName?: string;
  padded?: boolean;
};

export function ShellPage({
  children,
  header,
  inspector,
  className,
  contentClassName,
  bodyClassName,
  headerClassName,
  inspectorClassName,
  padded = true,
  ...sectionProps
}: ShellPageProps) {
  return (
    <section className={cn('flex min-h-0 flex-1 flex-col', className)} {...sectionProps}>
      {header && (
        <div
          className={cn(
            padded && 'px-4 pt-6 sm:px-6 lg:px-8',
            headerClassName
          )}
        >
          {header}
        </div>
      )}
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          padded && (header ? 'px-4 pb-6 sm:px-6 lg:px-8' : 'px-4 py-6 sm:px-6 lg:px-8'),
          bodyClassName
        )}
      >
        {inspector ? (
          <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className={cn('min-h-0 flex-1', contentClassName)}>{children}</div>
            <aside
              className={cn(
                'min-h-0 xl:sticky xl:top-4 xl:self-start',
                inspectorClassName
              )}
            >
              {inspector}
            </aside>
          </div>
        ) : (
          <div className={cn('min-h-0 w-full', contentClassName)}>{children}</div>
        )}
      </div>
    </section>
  );
}

export default ShellPage;
