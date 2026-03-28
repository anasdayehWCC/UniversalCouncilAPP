import React from 'react';
import { cn } from '@/lib/utils';

type ProgressBarProps = {
  value: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
  height?: string;
  label?: string;
};

export function ProgressBar({
  value,
  color = '#2563eb',
  backgroundColor = '#e2e8f0',
  className,
  height = '12px',
  label,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full space-y-2', className)}>
      {label && <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{label}</span>
        <span className="font-semibold text-slate-800">{clamped}%</span>
      </div>}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ backgroundColor, height }}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        role="progressbar"
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
    </div>
  );
}
