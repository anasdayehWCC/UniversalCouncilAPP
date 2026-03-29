'use client';

/**
 * Audio Visualizer
 *
 * Real-time waveform and level visualization.
 * Premium glassmorphism design with smooth animations.
 *
 * @module app/record/components/AudioVisualizer
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AudioLevelData, WaveformData } from '@/lib/audio/types';

// ============================================================================
// Types
// ============================================================================

interface AudioVisualizerProps {
  /** Current audio level data */
  audioLevel: AudioLevelData;
  /** Waveform data for visualization */
  waveformData: WaveformData | null;
  /** Whether recording is active */
  isRecording: boolean;
  /** Whether recording is paused */
  isPaused: boolean;
  /** Visualization style */
  variant?: 'bars' | 'waveform' | 'circle';
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Bar Visualizer
// ============================================================================

function BarVisualizer({
  audioLevel,
  isRecording,
  isPaused,
}: {
  audioLevel: AudioLevelData;
  isRecording: boolean;
  isPaused: boolean;
}) {
  const barCount = 32;
  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      // Create a wave-like distribution
      const position = i / barCount;
      const centerDistance = Math.abs(position - 0.5) * 2;
      const baseHeight = 1 - centerDistance * 0.7;
      const randomFactor = Math.random() * 0.3;
      return baseHeight * audioLevel.level + randomFactor * 0.1;
    });
  }, [audioLevel.level]);

  return (
    <div className="flex items-end justify-center gap-1 h-32 md:h-40">
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className={cn(
            'w-2 md:w-2.5 rounded-full',
            'bg-gradient-to-t from-primary via-primary/80 to-accent',
            isPaused && 'opacity-40',
            !isRecording && 'opacity-20'
          )}
          initial={{ height: 4 }}
          animate={{
            height: isRecording && !isPaused 
              ? Math.max(4, height * 128 + 16)
              : 4 + Math.sin(Date.now() / 500 + index * 0.2) * 4,
          }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Waveform Visualizer
// ============================================================================

function WaveformVisualizer({
  waveformData,
  isRecording,
  isPaused,
}: {
  waveformData: WaveformData | null;
  isRecording: boolean;
  isPaused: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Get data
    const data = waveformData?.data || new Uint8Array(128).fill(128);
    const sliceWidth = rect.width / data.length;

    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = isPaused 
      ? 'rgba(100, 116, 139, 0.4)' 
      : isRecording 
        ? 'rgb(59, 130, 246)' 
        : 'rgba(100, 116, 139, 0.2)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let x = 0;
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 255;
      const y = v * rect.height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Draw glow effect when recording
    if (isRecording && !isPaused) {
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }
  }, [waveformData, isRecording, isPaused]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 md:h-40 rounded-xl"
      style={{ width: '100%', height: 'auto' }}
    />
  );
}

// ============================================================================
// Circle Visualizer
// ============================================================================

function CircleVisualizer({
  audioLevel,
  isRecording,
  isPaused,
}: {
  audioLevel: AudioLevelData;
  isRecording: boolean;
  isPaused: boolean;
}) {
  const rings = 5;

  return (
    <div className="relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center">
      {Array.from({ length: rings }).map((_, index) => {
        const scale = 1 + (audioLevel.level * 0.5 * (rings - index)) / rings;
        const delay = index * 0.05;

        return (
          <motion.div
            key={index}
            className={cn(
              'absolute rounded-full border-2',
              'border-primary/30 dark:border-primary/40',
              isPaused && 'opacity-30',
              !isRecording && 'opacity-10'
            )}
            style={{
              width: `${60 + index * 20}%`,
              height: `${60 + index * 20}%`,
            }}
            animate={
              isRecording && !isPaused
                ? {
                    scale: [1, scale, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }
                : {}
            }
            transition={{
              duration: 0.5,
              delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}

      {/* Center dot */}
      <motion.div
        className={cn(
          'w-4 h-4 rounded-full',
          isRecording && !isPaused ? 'bg-destructive' : 'bg-muted-foreground/30'
        )}
        animate={
          isRecording && !isPaused
            ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
            : {}
        }
        transition={{ duration: 1, repeat: Infinity }}
      />
    </div>
  );
}

// ============================================================================
// Level Meter
// ============================================================================

function LevelMeter({ audioLevel }: { audioLevel: AudioLevelData }) {
  return (
    <div className="flex items-center gap-3 w-full max-w-xs">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            audioLevel.isClipping ? 'bg-destructive' : 
            audioLevel.level > 0.7 ? 'bg-warning' : 
            'bg-gradient-to-r from-primary to-accent'
          )}
          animate={{ width: `${Math.min(audioLevel.level * 100, 100)}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-12 text-right">
        {Math.round(audioLevel.level * 100)}%
      </span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AudioVisualizer({
  audioLevel,
  waveformData,
  isRecording,
  isPaused,
  variant = 'bars',
  className,
}: AudioVisualizerProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 p-6',
        'rounded-2xl',
        'backdrop-blur-xl',
        'bg-white/10 dark:bg-white/5',
        'border border-white/20 dark:border-white/10',
        className
      )}
    >
      {/* Main Visualization */}
      {variant === 'bars' && (
        <BarVisualizer
          audioLevel={audioLevel}
          isRecording={isRecording}
          isPaused={isPaused}
        />
      )}
      {variant === 'waveform' && (
        <WaveformVisualizer
          waveformData={waveformData}
          isRecording={isRecording}
          isPaused={isPaused}
        />
      )}
      {variant === 'circle' && (
        <CircleVisualizer
          audioLevel={audioLevel}
          isRecording={isRecording}
          isPaused={isPaused}
        />
      )}

      {/* Level Meter */}
      <LevelMeter audioLevel={audioLevel} />

      {/* Status indicators */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {audioLevel.isClipping && (
          <span className="text-destructive font-medium">⚠ Audio too loud</span>
        )}
        {audioLevel.isTooQuiet && isRecording && !isPaused && (
          <span className="text-warning font-medium">⚠ Audio too quiet</span>
        )}
        {!audioLevel.isClipping && !audioLevel.isTooQuiet && isRecording && !isPaused && (
          <span className="text-success font-medium">✓ Good level</span>
        )}
      </div>
    </div>
  );
}

export default AudioVisualizer;
