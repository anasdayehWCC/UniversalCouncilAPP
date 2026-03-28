/**
 * Sound System Types
 *
 * Type definitions for the notification sound system including
 * sound names, configuration, and preferences.
 *
 * @module lib/sounds/types
 */

// ============================================================================
// Sound Name Enum
// ============================================================================

/**
 * Available sound names in the system
 */
export type SoundName =
  | 'success' // Short positive chime for successful actions
  | 'error' // Subtle error tone for failed operations
  | 'notification' // Gentle ping for new notifications
  | 'warning' // Alert tone for warnings
  | 'complete'; // Task completion sound

/**
 * Array of all available sound names for iteration
 */
export const SOUND_NAMES: SoundName[] = [
  'success',
  'error',
  'notification',
  'warning',
  'complete',
];

// ============================================================================
// Sound Configuration
// ============================================================================

/**
 * Configuration for a single sound
 */
export interface SoundConfig {
  /** Unique sound identifier */
  name: SoundName;
  /** Path to the audio file */
  path: string;
  /** Default volume (0-1) */
  defaultVolume: number;
  /** Description for accessibility */
  description: string;
  /** Whether this sound is enabled by default */
  enabledByDefault: boolean;
}

/**
 * Default sound configurations
 */
export const DEFAULT_SOUND_CONFIGS: Record<SoundName, SoundConfig> = {
  success: {
    name: 'success',
    path: '/sounds/success.mp3',
    defaultVolume: 0.5,
    description: 'Short positive chime for successful actions',
    enabledByDefault: true,
  },
  error: {
    name: 'error',
    path: '/sounds/error.mp3',
    defaultVolume: 0.4,
    description: 'Subtle error tone for failed operations',
    enabledByDefault: true,
  },
  notification: {
    name: 'notification',
    path: '/sounds/notification.mp3',
    defaultVolume: 0.5,
    description: 'Gentle ping for new notifications',
    enabledByDefault: true,
  },
  warning: {
    name: 'warning',
    path: '/sounds/warning.mp3',
    defaultVolume: 0.45,
    description: 'Alert tone for warnings',
    enabledByDefault: true,
  },
  complete: {
    name: 'complete',
    path: '/sounds/complete.mp3',
    defaultVolume: 0.5,
    description: 'Task completion sound',
    enabledByDefault: true,
  },
};

// ============================================================================
// Sound Preferences
// ============================================================================

/**
 * User preferences for individual sounds
 */
export interface SoundPreference {
  /** Whether this sound is enabled */
  enabled: boolean;
  /** Volume level (0-1) */
  volume: number;
}

/**
 * Complete sound preferences configuration
 */
export interface SoundPreferences {
  /** Global mute toggle */
  muted: boolean;
  /** Master volume (0-1) */
  masterVolume: number;
  /** Whether to respect reduced motion preference */
  respectReducedMotion: boolean;
  /** Per-sound preferences */
  sounds: Record<SoundName, SoundPreference>;
  /** Last updated timestamp */
  updatedAt: string;
}

/**
 * Default sound preferences
 */
export const DEFAULT_SOUND_PREFERENCES: SoundPreferences = {
  muted: false,
  masterVolume: 0.7,
  respectReducedMotion: true,
  sounds: {
    success: { enabled: true, volume: 0.5 },
    error: { enabled: true, volume: 0.4 },
    notification: { enabled: true, volume: 0.5 },
    warning: { enabled: true, volume: 0.45 },
    complete: { enabled: true, volume: 0.5 },
  },
  updatedAt: new Date().toISOString(),
};

// ============================================================================
// Sound Player State
// ============================================================================

/**
 * State of the sound player
 */
export interface SoundPlayerState {
  /** Whether the audio context is initialized */
  initialized: boolean;
  /** Whether sounds are currently loading */
  loading: boolean;
  /** Map of loaded sounds */
  loadedSounds: Set<SoundName>;
  /** Any error during initialization/loading */
  error: string | null;
}

/**
 * Options for playing a sound
 */
export interface PlaySoundOptions {
  /** Override volume for this play (0-1) */
  volume?: number;
  /** Whether to force play even if muted */
  force?: boolean;
  /** Callback when sound finishes playing */
  onEnd?: () => void;
}
