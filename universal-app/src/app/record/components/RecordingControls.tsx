'use client';

/**
 * Recording Controls
 *
 * Start/stop/pause buttons for audio recording.
 * Premium glassmorphism design with smooth animations.
 *
 * @module app/record/components/RecordingControls
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Pause, Play, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RecordingState } from '@/lib/audio/types';

interface RecordingControlsProps {
  /** Current recording state */
  state: RecordingState;
  /** Start recording callback */
  onStart: () => void;
  /** Stop recording callback */
  onStop: () => void;
  /** Pause recording callback */
  onPause: () => void;
  /** Resume recording callback */
  onResume: () => void;
  /** Cancel recording callback */
  onCancel: () => void;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Whether saving is in progress */
  isSaving?: boolean;
}

export function RecordingControls({
  state,
  onStart,
  onStop,
  onPause,
  onResume,
  onCancel,
  disabled = false,
  isSaving = false,
}: RecordingControlsProps) {
  const isIdle = state === 'idle';
  const isRecording = state === 'recording';
  const isPaused = state === 'paused';
  const isStopped = state === 'stopped';

  // Main action button
  const renderMainButton = () => {
    // Saving state
    if (isSaving) {
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin motion-reduce:animate-none" />
          </div>
          <span className="text-sm text-muted-foreground">Saving...</span>
        </motion.div>
      );
    }

    // Idle - Show start button
    if (isIdle || isStopped) {
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          disabled={disabled}
          className={cn(
            'relative w-24 h-24 md:w-28 md:h-28 rounded-full',
            'bg-gradient-to-br from-red-500 to-red-600',
            'shadow-lg shadow-red-500/30',
            'flex items-center justify-center',
            'transition-all duration-300',
            'hover:shadow-xl hover:shadow-red-500/40',
            'focus:outline-none focus:ring-4 focus:ring-red-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Mic className="w-10 h-10 md:w-12 md:h-12 text-white" />
          
          {/* Pulse ring animation */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-destructive/50"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>
      );
    }

    // Recording - Show stop button
    if (isRecording || isPaused) {
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStop}
          disabled={disabled}
          className={cn(
            'relative w-24 h-24 md:w-28 md:h-28 rounded-full',
            'bg-gradient-to-br from-slate-700 to-slate-800',
            'dark:from-slate-600 dark:to-slate-700',
            'shadow-lg shadow-slate-500/20',
            'flex items-center justify-center',
            'transition-all duration-300',
            'hover:shadow-xl',
            'focus:outline-none focus:ring-4 focus:ring-slate-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Square className="w-10 h-10 md:w-12 md:h-12 text-white fill-white" />
          
          {/* Recording indicator */}
          {isRecording && (
            <motion.div
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.button>
      );
    }

    return null;
  };

  // Secondary controls (pause/resume, cancel)
  const renderSecondaryControls = () => {
    if (!isRecording && !isPaused) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="flex items-center gap-4"
      >
        {/* Pause/Resume button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={isPaused ? onResume : onPause}
          disabled={disabled}
          className={cn(
            'w-14 h-14 rounded-full',
            'backdrop-blur-xl',
            'bg-white/20 dark:bg-white/10',
            'border border-white/30 dark:border-white/20',
            'shadow-lg',
            'flex items-center justify-center',
            'transition-all duration-200',
            'hover:bg-white/30 dark:hover:bg-white/20',
            'focus:outline-none focus:ring-2 focus:ring-white/50',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
        >
          {isPaused ? (
            <Play className="w-6 h-6 text-foreground dark:text-white" />
          ) : (
            <Pause className="w-6 h-6 text-foreground dark:text-white" />
          )}
        </motion.button>

        {/* Cancel button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onCancel}
          disabled={disabled}
          className={cn(
            'w-14 h-14 rounded-full',
            'backdrop-blur-xl',
            'bg-destructive/20',
            'border border-destructive/30',
            'shadow-lg',
            'flex items-center justify-center',
            'transition-all duration-200',
            'hover:bg-destructive/30',
            'focus:outline-none focus:ring-2 focus:ring-destructive/50',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Cancel recording"
        >
          <X className="w-6 h-6 text-destructive" />
        </motion.button>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Main Button */}
      {renderMainButton()}

      {/* Secondary Controls */}
      {renderSecondaryControls()}

      {/* Hint text */}
      {isIdle && !isStopped && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground text-center"
        >
          Tap to start recording
        </motion.p>
      )}
    </div>
  );
}

export default RecordingControls;
