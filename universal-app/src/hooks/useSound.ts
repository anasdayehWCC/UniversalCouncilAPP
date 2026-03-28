'use client';

/**
 * useSound Hook
 *
 * Provides sound playback functionality with preference management
 * and reduced motion respect.
 *
 * @module hooks/useSound
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import {
  SoundName,
  SOUND_NAMES,
  SoundPreferences,
  DEFAULT_SOUND_PREFERENCES,
  PlaySoundOptions,
  SoundPlayerState,
} from '@/lib/sounds/types';
import { getSoundPlayer, initializeSoundPlayer } from '@/lib/sounds';

// ============================================================================
// Types
// ============================================================================

export interface UseSoundState {
  /** Whether the sound system is initialized */
  initialized: boolean;
  /** Whether sounds are loading */
  loading: boolean;
  /** Whether sounds are globally muted */
  muted: boolean;
  /** Master volume (0-1) */
  masterVolume: number;
  /** Current preferences */
  preferences: SoundPreferences;
  /** Whether reduced motion is preferred */
  reducedMotion: boolean;
  /** Any error */
  error: string | null;
}

export interface UseSoundActions {
  /** Play a sound by name */
  play: (name: SoundName, options?: PlaySoundOptions) => Promise<void>;
  /** Play success sound */
  playSuccess: (options?: PlaySoundOptions) => Promise<void>;
  /** Play error sound */
  playError: (options?: PlaySoundOptions) => Promise<void>;
  /** Play notification sound */
  playNotification: (options?: PlaySoundOptions) => Promise<void>;
  /** Play warning sound */
  playWarning: (options?: PlaySoundOptions) => Promise<void>;
  /** Play completion sound */
  playComplete: (options?: PlaySoundOptions) => Promise<void>;
  /** Set mute state */
  setMuted: (muted: boolean) => void;
  /** Toggle mute */
  toggleMute: () => void;
  /** Set master volume */
  setMasterVolume: (volume: number) => void;
  /** Enable a specific sound */
  enableSound: (name: SoundName) => void;
  /** Disable a specific sound */
  disableSound: (name: SoundName) => void;
  /** Toggle a specific sound */
  toggleSound: (name: SoundName) => void;
  /** Set volume for a specific sound */
  setSoundVolume: (name: SoundName, volume: number) => void;
  /** Update preferences */
  updatePreferences: (updates: Partial<SoundPreferences>) => void;
  /** Reset to defaults */
  resetPreferences: () => void;
  /** Initialize sound system (call on user interaction) */
  initialize: () => Promise<void>;
}

export type UseSoundReturn = UseSoundState & UseSoundActions;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for playing sounds and managing sound preferences
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { play, playSuccess, muted, toggleMute } = useSound();
 *
 *   const handleSave = async () => {
 *     await saveData();
 *     playSuccess();
 *   };
 *
 *   return (
 *     <button onClick={handleSave}>Save</button>
 *   );
 * }
 * ```
 */
export function useSound(): UseSoundReturn {
  const reducedMotion = usePrefersReducedMotion();
  const playerRef = useRef(getSoundPlayer());

  const [state, setState] = useState<UseSoundState>(() => {
    const player = playerRef.current;
    const prefs = player.getPreferences();
    const playerState = player.getState();

    return {
      initialized: playerState.initialized,
      loading: playerState.loading,
      muted: prefs.muted,
      masterVolume: prefs.masterVolume,
      preferences: prefs,
      reducedMotion,
      error: playerState.error,
    };
  });

  // Sync reduced motion preference
  useEffect(() => {
    setState((prev) => ({ ...prev, reducedMotion }));
  }, [reducedMotion]);

  // Refresh state from player
  const refreshState = useCallback(() => {
    const player = playerRef.current;
    const prefs = player.getPreferences();
    const playerState = player.getState();

    setState((prev) => ({
      ...prev,
      initialized: playerState.initialized,
      loading: playerState.loading,
      muted: prefs.muted,
      masterVolume: prefs.masterVolume,
      preferences: prefs,
      error: playerState.error,
    }));
  }, []);

  // ==========================================================================
  // Playback Actions
  // ==========================================================================

  const shouldPlay = useCallback(
    (options?: PlaySoundOptions): boolean => {
      const prefs = playerRef.current.getPreferences();

      // Check if reduced motion is enabled and should be respected
      if (reducedMotion && prefs.respectReducedMotion && !options?.force) {
        return false;
      }

      return true;
    },
    [reducedMotion]
  );

  const play = useCallback(
    async (name: SoundName, options?: PlaySoundOptions): Promise<void> => {
      if (!shouldPlay(options)) return;
      await playerRef.current.play(name, options);
    },
    [shouldPlay]
  );

  const playSuccess = useCallback(
    async (options?: PlaySoundOptions): Promise<void> => {
      if (!shouldPlay(options)) return;
      await playerRef.current.playSuccess(options);
    },
    [shouldPlay]
  );

  const playError = useCallback(
    async (options?: PlaySoundOptions): Promise<void> => {
      if (!shouldPlay(options)) return;
      await playerRef.current.playError(options);
    },
    [shouldPlay]
  );

  const playNotification = useCallback(
    async (options?: PlaySoundOptions): Promise<void> => {
      if (!shouldPlay(options)) return;
      await playerRef.current.playNotification(options);
    },
    [shouldPlay]
  );

  const playWarning = useCallback(
    async (options?: PlaySoundOptions): Promise<void> => {
      if (!shouldPlay(options)) return;
      await playerRef.current.playWarning(options);
    },
    [shouldPlay]
  );

  const playComplete = useCallback(
    async (options?: PlaySoundOptions): Promise<void> => {
      if (!shouldPlay(options)) return;
      await playerRef.current.playComplete(options);
    },
    [shouldPlay]
  );

  // ==========================================================================
  // Control Actions
  // ==========================================================================

  const setMuted = useCallback((muted: boolean) => {
    playerRef.current.setMuted(muted);
    refreshState();
  }, [refreshState]);

  const toggleMute = useCallback(() => {
    playerRef.current.toggleMute();
    refreshState();
  }, [refreshState]);

  const setMasterVolume = useCallback((volume: number) => {
    playerRef.current.setMasterVolume(volume);
    refreshState();
  }, [refreshState]);

  const enableSound = useCallback((name: SoundName) => {
    playerRef.current.enableSound(name);
    refreshState();
  }, [refreshState]);

  const disableSound = useCallback((name: SoundName) => {
    playerRef.current.disableSound(name);
    refreshState();
  }, [refreshState]);

  const toggleSound = useCallback((name: SoundName) => {
    playerRef.current.toggleSound(name);
    refreshState();
  }, [refreshState]);

  const setSoundVolume = useCallback((name: SoundName, volume: number) => {
    playerRef.current.setSoundVolume(name, volume);
    refreshState();
  }, [refreshState]);

  const updatePreferences = useCallback((updates: Partial<SoundPreferences>) => {
    playerRef.current.updatePreferences(updates);
    refreshState();
  }, [refreshState]);

  const resetPreferences = useCallback(() => {
    playerRef.current.resetPreferences();
    refreshState();
  }, [refreshState]);

  const initialize = useCallback(async () => {
    await initializeSoundPlayer();
    refreshState();
  }, [refreshState]);

  return {
    // State
    initialized: state.initialized,
    loading: state.loading,
    muted: state.muted,
    masterVolume: state.masterVolume,
    preferences: state.preferences,
    reducedMotion: state.reducedMotion,
    error: state.error,
    // Actions
    play,
    playSuccess,
    playError,
    playNotification,
    playWarning,
    playComplete,
    setMuted,
    toggleMute,
    setMasterVolume,
    enableSound,
    disableSound,
    toggleSound,
    setSoundVolume,
    updatePreferences,
    resetPreferences,
    initialize,
  };
}

// ============================================================================
// Utility Hook: Play Sound on Event
// ============================================================================

/**
 * Hook to play a sound when a condition changes to true
 *
 * @example
 * ```tsx
 * function SaveButton({ isSaved }) {
 *   useSoundOnCondition('success', isSaved);
 *   return <button>Save</button>;
 * }
 * ```
 */
export function useSoundOnCondition(
  sound: SoundName,
  condition: boolean,
  options?: PlaySoundOptions
): void {
  const { play, initialized, muted } = useSound();
  const prevCondition = useRef(condition);

  useEffect(() => {
    // Play when condition changes from false to true
    if (condition && !prevCondition.current && initialized && !muted) {
      play(sound, options);
    }
    prevCondition.current = condition;
  }, [condition, sound, play, options, initialized, muted]);
}

// ============================================================================
// Utility Hook: Sound Feedback
// ============================================================================

interface UseSoundFeedbackOptions {
  /** Sound to play on success */
  successSound?: SoundName;
  /** Sound to play on error */
  errorSound?: SoundName;
  /** Whether to play sounds */
  enabled?: boolean;
}

/**
 * Hook for providing audio feedback on async operations
 *
 * @example
 * ```tsx
 * function SaveForm() {
 *   const { withFeedback } = useSoundFeedback();
 *
 *   const handleSubmit = withFeedback(async (data) => {
 *     await saveData(data);
 *   });
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useSoundFeedback(options: UseSoundFeedbackOptions = {}) {
  const {
    successSound = 'success',
    errorSound = 'error',
    enabled = true,
  } = options;

  const { playSuccess, playError, play } = useSound();

  const withFeedback = useCallback(
    <T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T => {
      return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        try {
          const result = await fn(...args);
          if (enabled) {
            await play(successSound);
          }
          return result as ReturnType<T>;
        } catch (error) {
          if (enabled) {
            await play(errorSound);
          }
          throw error;
        }
      }) as T;
    },
    [enabled, play, successSound, errorSound]
  );

  return {
    withFeedback,
    playSuccess: enabled ? playSuccess : () => Promise.resolve(),
    playError: enabled ? playError : () => Promise.resolve(),
  };
}

export default useSound;
