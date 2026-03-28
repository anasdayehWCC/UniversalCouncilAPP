'use client';

/**
 * SoundSettings Component
 *
 * Settings panel for managing notification sound preferences including
 * global mute, master volume, and per-sound controls.
 *
 * @module components/settings/SoundSettings
 */

import React, { useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Volume2,
  VolumeX,
  Volume1,
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlayCircle,
  Info,
  RotateCcw,
} from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { SoundName, SOUND_NAMES, DEFAULT_SOUND_CONFIGS } from '@/lib/sounds/types';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface SoundSettingsProps {
  /** Additional className */
  className?: string;
  /** Whether to show the card wrapper */
  showCard?: boolean;
  /** Callback when settings change */
  onChange?: () => void;
}

// ============================================================================
// Sound Icon Map
// ============================================================================

const SOUND_ICONS: Record<SoundName, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  notification: Bell,
  warning: AlertTriangle,
  complete: PlayCircle,
};

// ============================================================================
// Sub-Components
// ============================================================================

interface SoundToggleProps {
  name: SoundName;
  enabled: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (volume: number) => void;
  onPreview: () => void;
  disabled?: boolean;
}

function SoundToggle({
  name,
  enabled,
  volume,
  onToggle,
  onVolumeChange,
  onPreview,
  disabled,
}: SoundToggleProps) {
  const Icon = SOUND_ICONS[name];
  const config = DEFAULT_SOUND_CONFIGS[name];

  return (
    <div
      className={cn(
        'group flex items-center gap-4 rounded-lg border p-3 transition-all',
        enabled
          ? 'border-[var(--accent)]/20 bg-[var(--accent)]/5'
          : 'border-slate-200 bg-slate-50',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
          enabled
            ? 'bg-[var(--accent)] text-white'
            : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
        )}
        aria-pressed={enabled}
        aria-label={`${enabled ? 'Disable' : 'Enable'} ${name} sound`}
      >
        <Icon className="h-5 w-5" />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium capitalize text-slate-900">{name}</span>
          <button
            type="button"
            onClick={onPreview}
            className={cn(
              'text-xs text-[var(--accent)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity',
              !enabled && 'hidden'
            )}
            aria-label={`Preview ${name} sound`}
          >
            Preview
          </button>
        </div>
        <p className="text-xs text-slate-500 truncate">{config.description}</p>
      </div>

      {/* Volume Slider */}
      <div className={cn('w-24 shrink-0', !enabled && 'opacity-50')}>
        <Slider
          value={[volume * 100]}
          max={100}
          step={5}
          disabled={!enabled || disabled}
          onValueChange={(value) => onVolumeChange(value[0] / 100)}
          aria-label={`${name} volume`}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SoundSettings({
  className,
  showCard = true,
  onChange,
}: SoundSettingsProps) {
  const {
    initialized,
    muted,
    masterVolume,
    preferences,
    reducedMotion,
    toggleMute,
    setMasterVolume,
    toggleSound,
    setSoundVolume,
    resetPreferences,
    updatePreferences,
    play,
    initialize,
  } = useSound();

  // Initialize on first interaction
  const handleInteraction = useCallback(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  // Preview a sound
  const handlePreview = useCallback(
    (name: SoundName) => {
      handleInteraction();
      play(name, { force: true });
    },
    [play, handleInteraction]
  );

  // Handle toggle
  const handleToggle = useCallback(
    (name: SoundName) => {
      handleInteraction();
      toggleSound(name);
      onChange?.();
    },
    [toggleSound, handleInteraction, onChange]
  );

  // Handle volume change
  const handleVolumeChange = useCallback(
    (name: SoundName, volume: number) => {
      handleInteraction();
      setSoundVolume(name, volume);
      onChange?.();
    },
    [setSoundVolume, handleInteraction, onChange]
  );

  // Handle master volume change
  const handleMasterVolumeChange = useCallback(
    (value: number[]) => {
      handleInteraction();
      setMasterVolume(value[0] / 100);
      onChange?.();
    },
    [setMasterVolume, handleInteraction, onChange]
  );

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    handleInteraction();
    toggleMute();
    onChange?.();
  }, [toggleMute, handleInteraction, onChange]);

  // Handle reduced motion toggle
  const handleReducedMotionToggle = useCallback(
    (respect: boolean) => {
      handleInteraction();
      updatePreferences({ respectReducedMotion: respect });
      onChange?.();
    },
    [updatePreferences, handleInteraction, onChange]
  );

  // Handle reset
  const handleReset = useCallback(() => {
    resetPreferences();
    onChange?.();
  }, [resetPreferences, onChange]);

  // Get volume icon based on level
  const VolumeIcon = muted ? VolumeX : masterVolume > 0.5 ? Volume2 : Volume1;

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Sound Settings</h3>
          <p className="text-sm text-slate-500">
            Configure notification sounds and volume
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Global Controls */}
      <div className="space-y-4 rounded-lg border border-slate-200 p-4">
        {/* Mute Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                muted
                  ? 'bg-red-100 text-red-600'
                  : 'bg-[var(--accent)]/10 text-[var(--accent)]'
              )}
            >
              <VolumeIcon className="h-5 w-5" />
            </div>
            <div>
              <Label className="font-medium">Sound Effects</Label>
              <p className="text-xs text-slate-500">
                {muted ? 'All sounds are muted' : 'Sounds are enabled'}
              </p>
            </div>
          </div>
          <Button
            variant={muted ? 'destructive' : 'default'}
            size="sm"
            onClick={handleMuteToggle}
          >
            {muted ? 'Unmute' : 'Mute All'}
          </Button>
        </div>

        {/* Master Volume */}
        <div className={cn('space-y-2', muted && 'opacity-50')}>
          <div className="flex items-center justify-between">
            <Label>Master Volume</Label>
            <span className="text-sm font-medium text-slate-600">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
          <Slider
            value={[masterVolume * 100]}
            max={100}
            step={5}
            disabled={muted}
            onValueChange={handleMasterVolumeChange}
            aria-label="Master volume"
          />
        </div>

        {/* Reduced Motion */}
        {reducedMotion && (
          <div className="flex items-start gap-3 rounded-md bg-amber-50 p-3 text-sm">
            <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">
                Reduced motion detected
              </p>
              <p className="text-amber-700 mt-1">
                Your system prefers reduced motion.{' '}
                {preferences.respectReducedMotion ? (
                  <>
                    Sounds are disabled.{' '}
                    <button
                      type="button"
                      onClick={() => handleReducedMotionToggle(false)}
                      className="font-medium underline hover:no-underline"
                    >
                      Enable anyway
                    </button>
                  </>
                ) : (
                  <>
                    Sounds are still playing.{' '}
                    <button
                      type="button"
                      onClick={() => handleReducedMotionToggle(true)}
                      className="font-medium underline hover:no-underline"
                    >
                      Respect preference
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Individual Sound Controls */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">
          Individual Sounds
        </Label>
        <div className="space-y-2">
          {SOUND_NAMES.map((name) => (
            <SoundToggle
              key={name}
              name={name}
              enabled={preferences.sounds[name]?.enabled ?? true}
              volume={preferences.sounds[name]?.volume ?? 0.5}
              onToggle={() => handleToggle(name)}
              onVolumeChange={(vol) => handleVolumeChange(name, vol)}
              onPreview={() => handlePreview(name)}
              disabled={muted}
            />
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-xs text-slate-400 text-center">
        Sound preferences are stored locally on your device
      </p>
    </div>
  );

  if (!showCard) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={cn('p-6', className)}>
      {content}
    </Card>
  );
}

export default SoundSettings;
