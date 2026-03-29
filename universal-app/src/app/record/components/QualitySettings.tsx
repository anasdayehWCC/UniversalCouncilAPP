'use client';

/**
 * Quality Settings
 *
 * Audio quality selection with estimated file sizes.
 *
 * @module app/record/components/QualitySettings
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Check, ChevronDown, Zap, Gauge, Sparkles, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QUALITY_PRESETS, type AudioQuality, type AudioQualityConfig } from '@/lib/audio/types';

interface QualitySettingsProps {
  /** Current quality setting */
  quality: AudioQuality;
  /** Quality change callback */
  onQualityChange: (quality: AudioQuality) => void;
  /** Estimated duration in seconds */
  estimatedDuration?: number;
  /** Whether settings are disabled */
  disabled?: boolean;
}

const QUALITY_ICONS: Record<AudioQuality, React.ElementType> = {
  low: Zap,
  medium: Gauge,
  high: Sparkles,
  ultra: Crown,
};

const QUALITY_COLORS: Record<AudioQuality, string> = {
  low: 'text-success',
  medium: 'text-info',
  high: 'text-purple-500',
  ultra: 'text-amber-500',
};

export function QualitySettings({
  quality,
  onQualityChange,
  estimatedDuration = 0,
  disabled = false,
}: QualitySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentConfig = QUALITY_PRESETS[quality];

  // Estimate file size
  const estimatedSizeMB = estimatedDuration > 0
    ? (estimatedDuration / 60) * currentConfig.sizePerMinuteMB
    : currentConfig.sizePerMinuteMB * 30; // Default to 30 min estimate

  const formatSize = (mb: number) => {
    if (mb < 1) return `${Math.round(mb * 1024)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  const qualities = Object.values(QUALITY_PRESETS);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-3 px-4 py-3',
          'rounded-xl',
          'backdrop-blur-xl',
          'bg-white/20 dark:bg-white/10',
          'border border-white/30 dark:border-white/20',
          'transition-all duration-200',
          'hover:bg-white/30 dark:hover:bg-white/20',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isOpen && 'ring-2 ring-primary/50'
        )}
      >
        <Settings className="w-5 h-5 text-muted-foreground" />
        <div className="text-left">
          <div className="flex items-center gap-2">
            {React.createElement(QUALITY_ICONS[quality], {
              className: cn('w-4 h-4', QUALITY_COLORS[quality]),
            })}
            <span className="text-sm font-medium">{currentConfig.label}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {currentConfig.bitrate} kbps • ~{formatSize(currentConfig.sizePerMinuteMB)}/min
          </p>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform duration-200 ml-auto',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 w-72 mt-2',
              'rounded-xl overflow-hidden',
              'backdrop-blur-xl',
              'bg-card/90',
              'border border-border/50',
              'shadow-xl'
            )}
          >
            <div className="p-2 space-y-1">
              {qualities.map((config) => {
                const Icon = QUALITY_ICONS[config.name];
                const isSelected = config.name === quality;

                return (
                  <button
                    key={config.name}
                    onClick={() => {
                      onQualityChange(config.name);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-lg',
                      'transition-colors duration-150',
                      'hover:bg-primary/10',
                      isSelected && 'bg-primary/5'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        isSelected ? 'bg-primary/20' : 'bg-muted'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', QUALITY_COLORS[config.name])} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{config.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {config.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {config.bitrate} kbps • {config.sampleRate / 1000}kHz •{' '}
                        {config.channels === 1 ? 'Mono' : 'Stereo'} •{' '}
                        ~{formatSize(config.sizePerMinuteMB)}/min
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Estimated size for current recording */}
            {estimatedDuration > 0 && (
              <div className="border-t border-border p-3 bg-muted/50">
                <p className="text-xs text-muted-foreground">
                  Estimated size for {Math.floor(estimatedDuration / 60)}:
                  {String(estimatedDuration % 60).padStart(2, '0')}:{' '}
                  <span className="font-medium text-foreground">
                    {formatSize(estimatedSizeMB)}
                  </span>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

export default QualitySettings;
