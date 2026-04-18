'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { HeroSurface } from './PageSurface';

type MetricTone =
  | 'default'
  | 'brand'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info';

export interface MetricStripItem {
  label: string;
  value?: string | number;
  tone?: MetricTone;
  icon?: React.ReactNode;
}

const baseMetricClasses =
  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.01em]';

function getMetricToneClasses(tone: MetricTone, inverted: boolean) {
  if (inverted) {
    if (tone === 'brand') return 'border-white/25 bg-white/16 text-white';
    if (tone === 'success') return 'border-white/22 bg-white/14 text-white';
    if (tone === 'warning') return 'border-white/22 bg-white/14 text-white';
    if (tone === 'destructive') return 'border-white/22 bg-white/14 text-white';
    if (tone === 'info') return 'border-white/22 bg-white/14 text-white';
    return 'border-white/18 bg-white/10 text-white/92';
  }

  switch (tone) {
    case 'brand':
      return 'border-primary/20 bg-primary/8 text-primary';
    case 'success':
      return 'border-success/20 bg-success/10 text-success';
    case 'warning':
      return 'border-warning/20 bg-warning/10 text-warning';
    case 'destructive':
      return 'border-destructive/20 bg-destructive/10 text-destructive';
    case 'info':
      return 'border-info/20 bg-info/10 text-info';
    default:
      return 'border-border bg-muted/55 text-foreground';
  }
}

export function MetricStrip({
  items,
  className,
  inverted = false,
}: {
  items: MetricStripItem[];
  className?: string;
  inverted?: boolean;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', className)}>
      {items.map((item) => (
        <span
          key={`${item.label}-${item.value ?? ''}`}
          className={cn(
            baseMetricClasses,
            getMetricToneClasses(item.tone ?? 'default', inverted)
          )}
        >
          {item.icon}
          <span>{item.label}</span>
          {item.value !== undefined && <span className={cn(inverted ? 'text-white' : 'text-foreground')}>{item.value}</span>}
        </span>
      ))}
    </div>
  );
}

export function PageSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-display font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description && (
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function InspectorPanel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-display font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {actions}
        </div>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  metrics,
  className,
  gradient,
  inverted = false,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  metrics?: MetricStripItem[];
  className?: string;
  gradient?: string;
  inverted?: boolean;
  children?: React.ReactNode;
}) {
  const content = (
    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 space-y-3">
        {eyebrow && (
          <p className={cn('text-[11px] font-semibold uppercase tracking-[0.18em]', inverted ? 'text-white/72' : 'text-muted-foreground')}>
            {eyebrow}
          </p>
        )}
        <div className="space-y-2">
          <h1 className={cn('text-3xl font-display font-semibold tracking-tight sm:text-4xl', inverted ? 'text-white' : 'text-foreground')}>
            {title}
          </h1>
          {description && (
            <div className={cn('max-w-3xl text-sm leading-6 sm:text-base', inverted ? 'text-white/78' : 'text-muted-foreground')}>
              {description}
            </div>
          )}
        </div>
        {metrics && metrics.length > 0 && <MetricStrip items={metrics} inverted={inverted} />}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );

  if (gradient) {
    return (
      <HeroSurface
        className={cn('text-white', className)}
        style={{ background: gradient }}
      >
        <div className="pointer-events-none absolute inset-y-0 right-0 w-72 rounded-full bg-white/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-black/10 blur-3xl" />
        {content}
      </HeroSurface>
    );
  }

  return (
    <section className={cn('space-y-5', className)}>
      {content}
    </section>
  );
}
