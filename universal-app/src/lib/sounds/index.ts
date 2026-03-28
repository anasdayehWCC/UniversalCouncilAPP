/**
 * Sound System
 *
 * Web Audio API-based sound player for notification sounds.
 * Supports preloading, volume control, mute state, and user preferences.
 *
 * @module lib/sounds
 */

import {
  SoundName,
  SOUND_NAMES,
  SoundConfig,
  DEFAULT_SOUND_CONFIGS,
  SoundPreferences,
  DEFAULT_SOUND_PREFERENCES,
  SoundPlayerState,
  PlaySoundOptions,
} from './types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Local storage key for sound preferences
 */
const PREFERENCES_STORAGE_KEY = 'sound_preferences';

/**
 * Fallback data URI for silent audio (used when actual files aren't available)
 * This is a minimal valid MP3 file that produces silence
 */
const SILENT_AUDIO_FALLBACK =
  'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYkSsKwAAAAAAAAAAAAAAAAAAAA//tQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQZB4P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';

// ============================================================================
// Sound Player Class
// ============================================================================

/**
 * Manages audio playback using Web Audio API
 */
class SoundPlayer {
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<SoundName, AudioBuffer> = new Map();
  private gainNode: GainNode | null = null;
  private preferences: SoundPreferences;
  private state: SoundPlayerState = {
    initialized: false,
    loading: false,
    loadedSounds: new Set(),
    error: null,
  };

  constructor() {
    this.preferences = this.loadPreferences();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  async initialize(): Promise<void> {
    if (this.state.initialized) return;

    try {
      // Create audio context (modern browsers require user gesture)
      this.audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      // Create master gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.preferences.muted ? 0 : this.preferences.masterVolume;
      this.gainNode.connect(this.audioContext.destination);

      this.state.initialized = true;
      this.state.error = null;

      // Preload all sounds
      await this.preloadAll();
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to initialize audio';
      console.error('[SoundPlayer] Initialization error:', error);
    }
  }

  /**
   * Resume audio context if suspended (required by browsers)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // ==========================================================================
  // Sound Loading
  // ==========================================================================

  /**
   * Preload all configured sounds
   */
  async preloadAll(): Promise<void> {
    if (!this.audioContext) return;

    this.state.loading = true;

    const loadPromises = SOUND_NAMES.map((name) => this.loadSound(name));
    await Promise.allSettled(loadPromises);

    this.state.loading = false;
  }

  /**
   * Load a single sound file
   */
  async loadSound(name: SoundName): Promise<void> {
    if (!this.audioContext || this.audioBuffers.has(name)) return;

    const config = DEFAULT_SOUND_CONFIGS[name];

    try {
      const response = await fetch(config.path);

      if (!response.ok) {
        // Use silent fallback if file doesn't exist
        console.warn(`[SoundPlayer] Sound file not found: ${config.path}, using silent fallback`);
        await this.loadSilentFallback(name);
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.audioBuffers.set(name, audioBuffer);
      this.state.loadedSounds.add(name);
    } catch (error) {
      console.warn(`[SoundPlayer] Failed to load ${name}:`, error);
      // Use silent fallback on error
      await this.loadSilentFallback(name);
    }
  }

  /**
   * Load silent fallback audio for when actual files aren't available
   */
  private async loadSilentFallback(name: SoundName): Promise<void> {
    if (!this.audioContext) return;

    try {
      const response = await fetch(SILENT_AUDIO_FALLBACK);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.audioBuffers.set(name, audioBuffer);
      this.state.loadedSounds.add(name);
    } catch (error) {
      console.error(`[SoundPlayer] Failed to load silent fallback for ${name}:`, error);
    }
  }

  // ==========================================================================
  // Playback
  // ==========================================================================

  /**
   * Play a sound by name
   */
  async play(name: SoundName, options: PlaySoundOptions = {}): Promise<void> {
    // Don't play if muted (unless forced)
    if (this.preferences.muted && !options.force) return;

    // Check if this specific sound is enabled
    const soundPref = this.preferences.sounds[name];
    if (!soundPref?.enabled && !options.force) return;

    // Initialize if needed
    if (!this.state.initialized) {
      await this.initialize();
    }

    await this.resume();

    if (!this.audioContext || !this.gainNode) return;

    // Load sound if not yet loaded
    if (!this.audioBuffers.has(name)) {
      await this.loadSound(name);
    }

    const buffer = this.audioBuffers.get(name);
    if (!buffer) return;

    try {
      // Create source node
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      // Create gain node for this particular sound
      const soundGain = this.audioContext.createGain();
      const volume = options.volume ?? soundPref?.volume ?? DEFAULT_SOUND_CONFIGS[name].defaultVolume;
      soundGain.gain.value = volume;

      // Connect: source -> sound gain -> master gain -> destination
      source.connect(soundGain);
      soundGain.connect(this.gainNode);

      // Handle completion callback
      if (options.onEnd) {
        source.onended = options.onEnd;
      }

      // Play immediately
      source.start(0);
    } catch (error) {
      console.error(`[SoundPlayer] Failed to play ${name}:`, error);
    }
  }

  /**
   * Play success sound
   */
  playSuccess(options?: PlaySoundOptions): Promise<void> {
    return this.play('success', options);
  }

  /**
   * Play error sound
   */
  playError(options?: PlaySoundOptions): Promise<void> {
    return this.play('error', options);
  }

  /**
   * Play notification sound
   */
  playNotification(options?: PlaySoundOptions): Promise<void> {
    return this.play('notification', options);
  }

  /**
   * Play warning sound
   */
  playWarning(options?: PlaySoundOptions): Promise<void> {
    return this.play('warning', options);
  }

  /**
   * Play completion sound
   */
  playComplete(options?: PlaySoundOptions): Promise<void> {
    return this.play('complete', options);
  }

  // ==========================================================================
  // Volume Control
  // ==========================================================================

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.preferences.masterVolume = clampedVolume;

    if (this.gainNode && !this.preferences.muted) {
      this.gainNode.gain.value = clampedVolume;
    }

    this.savePreferences();
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.preferences.masterVolume;
  }

  /**
   * Set volume for a specific sound
   */
  setSoundVolume(name: SoundName, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.preferences.sounds[name].volume = clampedVolume;
    this.savePreferences();
  }

  /**
   * Get volume for a specific sound
   */
  getSoundVolume(name: SoundName): number {
    return this.preferences.sounds[name]?.volume ?? DEFAULT_SOUND_CONFIGS[name].defaultVolume;
  }

  // ==========================================================================
  // Mute Control
  // ==========================================================================

  /**
   * Set mute state
   */
  setMuted(muted: boolean): void {
    this.preferences.muted = muted;

    if (this.gainNode) {
      this.gainNode.gain.value = muted ? 0 : this.preferences.masterVolume;
    }

    this.savePreferences();
  }

  /**
   * Get mute state
   */
  isMuted(): boolean {
    return this.preferences.muted;
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.setMuted(!this.preferences.muted);
    return this.preferences.muted;
  }

  // ==========================================================================
  // Sound Enable/Disable
  // ==========================================================================

  /**
   * Enable a specific sound
   */
  enableSound(name: SoundName): void {
    this.preferences.sounds[name].enabled = true;
    this.savePreferences();
  }

  /**
   * Disable a specific sound
   */
  disableSound(name: SoundName): void {
    this.preferences.sounds[name].enabled = false;
    this.savePreferences();
  }

  /**
   * Toggle a specific sound
   */
  toggleSound(name: SoundName): boolean {
    const enabled = !this.preferences.sounds[name].enabled;
    this.preferences.sounds[name].enabled = enabled;
    this.savePreferences();
    return enabled;
  }

  /**
   * Check if a specific sound is enabled
   */
  isSoundEnabled(name: SoundName): boolean {
    return this.preferences.sounds[name]?.enabled ?? true;
  }

  // ==========================================================================
  // Preferences
  // ==========================================================================

  /**
   * Get current preferences
   */
  getPreferences(): SoundPreferences {
    return { ...this.preferences };
  }

  /**
   * Update preferences
   */
  updatePreferences(updates: Partial<SoundPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...updates,
      sounds: {
        ...this.preferences.sounds,
        ...(updates.sounds || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    // Apply volume changes immediately
    if (this.gainNode) {
      this.gainNode.gain.value = this.preferences.muted ? 0 : this.preferences.masterVolume;
    }

    this.savePreferences();
  }

  /**
   * Reset to default preferences
   */
  resetPreferences(): void {
    this.preferences = { ...DEFAULT_SOUND_PREFERENCES };

    if (this.gainNode) {
      this.gainNode.gain.value = this.preferences.muted ? 0 : this.preferences.masterVolume;
    }

    this.savePreferences();
  }

  /**
   * Load preferences from local storage
   */
  private loadPreferences(): SoundPreferences {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_SOUND_PREFERENCES };
    }

    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (!stored) return { ...DEFAULT_SOUND_PREFERENCES };

      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all sounds are present
      return {
        ...DEFAULT_SOUND_PREFERENCES,
        ...parsed,
        sounds: {
          ...DEFAULT_SOUND_PREFERENCES.sounds,
          ...(parsed.sounds || {}),
        },
      };
    } catch {
      return { ...DEFAULT_SOUND_PREFERENCES };
    }
  }

  /**
   * Save preferences to local storage
   */
  private savePreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('[SoundPlayer] Failed to save preferences:', error);
    }
  }

  // ==========================================================================
  // State
  // ==========================================================================

  /**
   * Get current player state
   */
  getState(): SoundPlayerState {
    return { ...this.state };
  }

  /**
   * Check if player is ready
   */
  isReady(): boolean {
    return this.state.initialized && !this.state.loading;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNode = null;
    this.audioBuffers.clear();
    this.state.loadedSounds.clear();
    this.state.initialized = false;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let soundPlayerInstance: SoundPlayer | null = null;

/**
 * Get the singleton sound player instance
 */
export function getSoundPlayer(): SoundPlayer {
  if (!soundPlayerInstance) {
    soundPlayerInstance = new SoundPlayer();
  }
  return soundPlayerInstance;
}

/**
 * Initialize the sound player (should be called on user interaction)
 */
export async function initializeSoundPlayer(): Promise<void> {
  const player = getSoundPlayer();
  await player.initialize();
}

// ============================================================================
// Convenience Exports
// ============================================================================

export { SoundPlayer };
export * from './types';
