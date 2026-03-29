import React from 'react';
import { cn } from '@/lib/utils';

type ProgressBarVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type ProgressBarSize = 'sm' | 'md' | 'lg';

type ProgressBarProps = {
  /** Progress value (0-100) */
  value: number;
  /** Color variant - uses theme colors */
  variant?: ProgressBarVariant;
  /** Custom color override (hex or CSS variable) */
  color?: string;
  /** Custom background override */
  backgroundColor?: string;
  /** Additional class name */
  className?: string;
  /** Size preset or custom height value (e.g., '8px') */
  height?: ProgressBarSize | string;
  /** Label text */
  label?: string;
  /** Show percentage */
  showPercentage?: boolean;
  /** Indeterminate state for unknown progress */
  indeterminate?: boolean;
};

const variantColors: Record<ProgressBarVariant, string> = {
  default: 'var(--primary)',
  success: 'var(--success, #22c55e)',
  warning: 'var(--warning, #f59e0b)',
  error: 'var(--destructive)',
  info: 'var(--info, #3b82f6)',
};

const sizeStyles: Record<ProgressBarSize, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  variant = 'default',
  color,
  backgroundColor,
  className,
  height = 'md',
  label,
  showPercentage = true,
  indeterminate = false,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const barColor = color || variantColors[variant];
  
  // Check if height is a preset size or custom value
  const isPresetSize = height === 'sm' || height === 'md' || height === 'lg';
  const heightClass = isPresetSize ? sizeStyles[height] : undefined;
  const heightStyle = !isPresetSize ? { height } : undefined;
  
  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || (showPercentage && label)) && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{label}</span>
          {showPercentage && !indeterminate && (
            <span className="font-semibold tabular-nums">{clamped}%</span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden bg-muted',
          heightClass
        )}
        style={{ ...heightStyle, ...(backgroundColor ? { backgroundColor } : {}) }}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-label={label || 'Progress'}
        role="progressbar"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            indeterminate && 'animate-progress-indeterminate'
          )}
          style={{ 
            width: indeterminate ? '30%' : `${clamped}%`, 
            background: barColor 
          }}
        />
      </div>
    </div>
  );
}
