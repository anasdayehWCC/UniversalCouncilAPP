'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type SurfaceProps = React.ComponentPropsWithoutRef<'section'> & {
  children: React.ReactNode;
};

export function HeroSurface({
  children,
  className,
  style,
  ...props
}: SurfaceProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-border/30 px-6 py-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.45)] sm:px-8',
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </section>
  );
}

export function PrimaryPanel({
  children,
  className,
  ...props
}: SurfaceProps) {
  return (
    <Card
      className={cn(
        'rounded-[24px] border border-border/70 bg-card/96 p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.38)] sm:p-6',
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

export function SecondaryPanel({
  children,
  className,
  ...props
}: SurfaceProps) {
  return (
    <Card
      className={cn(
        'rounded-[24px] border border-border/55 bg-card/88 p-5 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.32)] sm:p-6',
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

export function InspectorSurface({
  children,
  className,
  ...props
}: SurfaceProps) {
  return (
    <Card
      className={cn(
        'rounded-[24px] border border-border/60 bg-card/94 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)]',
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

export function EmptyStatePanel({
  children,
  className,
  ...props
}: SurfaceProps) {
  return (
    <section
      className={cn(
        'rounded-[24px] border border-dashed border-border bg-muted/30 px-6 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]',
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function ListRow({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-[20px] border border-border bg-card/94 px-4 py-4 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.3)] transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}