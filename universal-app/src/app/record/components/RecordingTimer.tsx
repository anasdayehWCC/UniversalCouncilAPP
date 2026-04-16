'use client';

/**
 * Recording Timer
 *
 * Displays recording duration with visual indicators.
 *
 * @module app/record/components/RecordingTimer
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RecordingTimerProps {
  /** Duration in seconds */
  duration: number;
  /** Formatted duration string */
  formattedDuration: string;
  /** Whether recording is active */
  isRecording: boolean;
  /** Whether recording is paused */
  isPaused: boolean;
  /** Maximum duration in seconds (0 = unlimited) */
  maxDuration?: number;
}

export function RecordingTimer({
  duration,
  formattedDuration,
  isRecording,
  isPaused,
  maxDuration = 0,
}: RecordingTimerProps) {
  const hasMaxDuration = maxDuration > 0;
  const progress = hasMaxDuration ? (duration / maxDuration) * 100 : 0;
  const isNearLimit = hasMaxDuration && progress >= 80;
  const isAtLimit = hasMaxDuration && progress >= 95;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Main Timer Display */}
      <div className="relative">
        <motion.div
          className={cn(
            'text-6xl md:text-8xl font-mono font-bold tracking-tight',
            'text-foreground/90 dark:text-white/90',
            isPaused && 'text-muted-foreground',
            isAtLimit && 'text-error'
          )}
          animate={
            isRecording && !isPaused
              ? { scale: [1, 1.02, 1], opacity: [0.9, 1, 0.9] }
              : {}
          }
          transition={{ duration: 1, repeat: Infinity }}
        >
          {formattedDuration}
        </motion.div>

        {/* Recording Indicator Dot */}
        {isRecording && !isPaused && (
          <motion.div
            className="absolute -top-2 -right-4 w-4 h-4 rounded-full bg-destructive"
            animate={{ opacity: [1, 0.5, 1], scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>

      {/* Status Label */}
      <div className="flex items-center gap-2">
        {isRecording && !isPaused && (
          <motion.span
            className="text-sm font-medium text-destructive"
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ● Recording
          </motion.span>
        )}
        {isPaused && (
          <span className="text-sm font-medium text-warning">
            ⏸ Paused
          </span>
        )}
        {!isRecording && duration === 0 && (
          <span className="text-sm text-muted-foreground">
            Ready to record
          </span>
        )}
      </div>

      {/* Progress Bar (if max duration set) */}
      {hasMaxDuration && isRecording && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>0:00</span>
            <span>{Math.floor(maxDuration / 60)}:{(maxDuration % 60).toString().padStart(2, '0')}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full transition-colors',
                isNearLimit ? 'bg-warning' : 'bg-primary',
                isAtLimit && 'bg-error'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {isNearLimit && (
            <p className={cn(
              'text-xs mt-1 text-center',
              isAtLimit ? 'text-error' : 'text-warning'
            )}>
              {isAtLimit
                ? 'Maximum duration reached'
                : `${Math.ceil(maxDuration - duration)}s remaining`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default RecordingTimer;
