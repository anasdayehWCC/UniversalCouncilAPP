'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from './utils';
import { Badge } from './badge';
import { TokenText } from './token-text';

type StatusTone = 'success' | 'warning' | 'danger' | 'info';

const toneClass: Record<StatusTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  danger: 'bg-rose-50 text-rose-700 border-rose-100',
  info: 'bg-slate-100 text-slate-700 border-slate-200',
};

export type RecordingCardProps = {
  title: string;
  subtitle?: string;
  durationLabel?: string;
  status?: string;
  tone?: StatusTone;
  onClick?: () => void;
  actionSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  className?: string;
};

export function RecordingCard({
  title,
  subtitle,
  durationLabel,
  status,
  tone = 'info',
  onClick,
  actionSlot,
  footerSlot,
  className,
}: RecordingCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/80 p-4 shadow-lg backdrop-blur transition hover:shadow-xl',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 shadow-inner" />
        <div className="flex-1 space-y-1">
          <TokenText emphasis="strong" className="text-base">
            {title}
          </TokenText>
          {subtitle && (
            <TokenText className="text-sm text-muted-foreground">{subtitle}</TokenText>
          )}
          <div className="flex flex-wrap gap-2">
            {status && (
              <span className={cn('rounded-full border px-2 py-1 text-xs font-semibold', toneClass[tone])}>
                {status}
              </span>
            )}
            {durationLabel && (
              <Badge className="bg-primary/10 text-primary border-primary/20">
                {durationLabel}
              </Badge>
            )}
          </div>
        </div>
        {actionSlot}
      </div>

      {footerSlot && <div className="mt-4">{footerSlot}</div>}

      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-primary/10" />
      </div>
    </motion.div>
  );
}
