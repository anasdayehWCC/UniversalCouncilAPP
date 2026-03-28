/**
 * Audio Recorder
 *
 * Core audio recording functionality using MediaRecorder API.
 * Supports Opus/WebM, pause/resume, audio level monitoring,
 * and comprehensive error handling.
 *
 * @module lib/audio/recorder
 */

import {
  type RecordingState,
  type AudioFormat,
  type AudioQuality,
  type AudioDevice,
  type AudioLevelData,
  type WaveformData,
  type RecorderEvents,
  type RecorderError,
  type RecorderErrorType,
  type RecorderOptions,
  type RecordingMetadata,
  type CompletedRecording,
  type AudioPermissionStatus,
  type PermissionState,
  QUALITY_PRESETS,
  DEFAULT_RECORDER_OPTIONS,
} from './types';

// ============================================================================
// MIME Type Helpers
// ============================================================================

/**
 * Get supported MIME type for the requested format
 */
function getSupportedMimeType(format: AudioFormat): string | null {
  const mimeTypes: Record<AudioFormat, string[]> = {
    webm: ['audio/webm;codecs=opus', 'audio/webm'],
    opus: ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus'],
    mp3: ['audio/mpeg', 'audio/mp3'],
    wav: ['audio/wav', 'audio/wave'],
  };

  for (const mimeType of mimeTypes[format]) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  // Fallback to webm/opus
  const fallbacks = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
  for (const mimeType of fallbacks) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return null;
}

/**
 * Get file extension for MIME type
 */
function getFileExtension(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'mp3';
  if (mimeType.includes('wav') || mimeType.includes('wave')) return 'wav';
  return 'webm';
}

// ============================================================================
// Error Helpers
// ============================================================================

/**
 * Create a recorder error
 */
function createError(
  type: RecorderErrorType,
  message: string,
  originalError?: Error,
  recoverable = false,
  recoverySuggestion?: string
): RecorderError {
  return {
    type,
    message,
    originalError,
    recoverable,
    recoverySuggestion,
  };
}

/**
 * Map DOMException to RecorderError
 */
function mapDOMError(error: DOMException): RecorderError {
  switch (error.name) {
    case 'NotAllowedError':
      return createError(
        'permission_denied',
        'Microphone permission was denied',
        error,
        true,
        'Please allow microphone access in your browser settings'
      );
    case 'NotFoundError':
      return createError(
        'device_not_found',
        'No microphone device found',
        error,
        true,
        'Please connect a microphone and try again'
      );
    case 'NotReadableError':
      return createError(
        'device_in_use',
        'Microphone is being used by another application',
        error,
        true,
        'Please close other applications using the microphone'
      );
    case 'NotSupportedError':
      return createError(
        'not_supported',
        'Audio recording is not supported in this browser',
        error,
        false
      );
    default:
      return createError('unknown', error.message || 'An unknown error occurred', error, false);
  }
}

// ============================================================================
// Audio Recorder Class
// ============================================================================

/**
 * Audio recorder using MediaRecorder API
 */
export class AudioRecorder {
  // State
  private state: RecordingState = 'idle';
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  // Recording data
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private pauseStartTime: number = 0;
  private totalPausedDuration: number = 0;
  private recordingId: string = '';

  // Options
  private options: Required<RecorderOptions>;
  private mimeType: string;

  // Timers
  private levelCheckInterval: number | null = null;
  private durationInterval: number | null = null;

  // Event listeners
  private listeners: Partial<Record<keyof RecorderEvents, Set<RecorderEvents[keyof RecorderEvents]>>> = {};

  constructor(options: RecorderOptions = {}) {
    this.options = { ...DEFAULT_RECORDER_OPTIONS, ...options };

    // Apply quality preset if not overridden
    if (!options.bitrate) {
      this.options.bitrate = QUALITY_PRESETS[this.options.quality].bitrate;
    }
    if (!options.sampleRate) {
      this.options.sampleRate = QUALITY_PRESETS[this.options.quality].sampleRate;
    }
    if (!options.channels) {
      this.options.channels = QUALITY_PRESETS[this.options.quality].channels;
    }

    // Get supported MIME type
    const supportedMime = getSupportedMimeType(this.options.format);
    this.mimeType = supportedMime || 'audio/webm';
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Add event listener
   */
  on<K extends keyof RecorderEvents>(event: K, callback: RecorderEvents[K]): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.listeners[event] as Set<any>).add(callback);
  }

  /**
   * Remove event listener
   */
  off<K extends keyof RecorderEvents>(event: K, callback: RecorderEvents[K]): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.listeners[event] as Set<any>)?.delete(callback);
  }

  /**
   * Emit event
   */
  private emit<K extends keyof RecorderEvents>(
    event: K,
    ...args: Parameters<RecorderEvents[K]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.listeners[event] as Set<any>)?.forEach((callback) => callback(...args));
  }

  // ============================================================================
  // Permission Management
  // ============================================================================

  /**
   * Check microphone permission status
   */
  static async checkPermission(): Promise<AudioPermissionStatus> {
    try {
      if (!navigator.permissions) {
        return { state: 'unknown', hasRequested: false };
      }

      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return {
        state: result.state as PermissionState,
        hasRequested: result.state !== 'prompt',
      };
    } catch {
      return { state: 'unknown', hasRequested: false };
    }
  }

  /**
   * Request microphone permission
   */
  static async requestPermission(): Promise<AudioPermissionStatus> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return { state: 'granted', hasRequested: true };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        return {
          state: 'denied',
          hasRequested: true,
          errorMessage: 'Microphone permission was denied',
        };
      }
      return {
        state: 'unknown',
        hasRequested: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // Device Management
  // ============================================================================

  /**
   * List available audio input devices
   */
  static async listDevices(): Promise<AudioDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');

      return audioInputs.map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${index + 1}`,
        kind: device.kind,
        groupId: device.groupId,
        isDefault: device.deviceId === 'default' || index === 0,
        isActive: false,
      }));
    } catch (error) {
      console.error('Failed to list audio devices:', error);
      return [];
    }
  }

  // ============================================================================
  // Recording Controls
  // ============================================================================

  /**
   * Start recording
   */
  async start(): Promise<void> {
    if (this.state !== 'idle') {
      throw new Error(`Cannot start recording: current state is ${this.state}`);
    }

    try {
      // Create recording ID
      this.recordingId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Get media stream
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: this.options.deviceId !== 'default' ? { exact: this.options.deviceId } : undefined,
          echoCancellation: this.options.echoCancellation,
          noiseSuppression: this.options.noiseSuppression,
          autoGainControl: this.options.autoGainControl,
          sampleRate: this.options.sampleRate,
          channelCount: this.options.channels,
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Set up audio analysis
      this.setupAudioAnalysis();

      // Create MediaRecorder
      const recorderOptions: MediaRecorderOptions = {
        mimeType: this.mimeType,
        audioBitsPerSecond: this.options.bitrate * 1000,
      };

      this.mediaRecorder = new MediaRecorder(this.mediaStream, recorderOptions);

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          this.emit('dataAvailable', event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        const error = createError(
          'encoding_error',
          'Recording error occurred',
          (event as ErrorEvent).error,
          false
        );
        this.emit('error', error);
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingComplete();
      };

      // Reset counters
      this.chunks = [];
      this.startTime = Date.now();
      this.totalPausedDuration = 0;

      // Start recording
      this.mediaRecorder.start(this.options.chunkIntervalMs);

      // Start timers
      this.startLevelMonitoring();
      this.startDurationTracking();

      // Update state
      this.setState('recording');
    } catch (error) {
      this.cleanup();
      if (error instanceof DOMException) {
        this.emit('error', mapDOMError(error));
      } else {
        this.emit('error', createError('unknown', 'Failed to start recording', error as Error));
      }
      throw error;
    }
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (this.state !== 'recording') {
      throw new Error(`Cannot pause: current state is ${this.state}`);
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.pauseStartTime = Date.now();
      this.setState('paused');
    }
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (this.state !== 'paused') {
      throw new Error(`Cannot resume: current state is ${this.state}`);
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.totalPausedDuration += Date.now() - this.pauseStartTime;
      this.setState('recording');
    }
  }

  /**
   * Stop recording
   */
  stop(): void {
    if (this.state === 'idle' || this.state === 'stopped') {
      throw new Error(`Cannot stop: current state is ${this.state}`);
    }

    if (this.state === 'paused') {
      this.totalPausedDuration += Date.now() - this.pauseStartTime;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.stopTimers();
    this.setState('stopped');
  }

  /**
   * Cancel recording (discard data)
   */
  cancel(): void {
    this.chunks = [];
    if (this.state !== 'idle') {
      this.stop();
    }
    this.cleanup();
    this.setState('idle');
  }

  // ============================================================================
  // Audio Analysis
  // ============================================================================

  /**
   * Set up audio analysis nodes
   */
  private setupAudioAnalysis(): void {
    if (!this.mediaStream) return;

    try {
      this.audioContext = new AudioContext({ sampleRate: this.options.sampleRate });
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyserNode);
    } catch (error) {
      console.warn('Failed to set up audio analysis:', error);
    }
  }

  /**
   * Get current audio level
   */
  getAudioLevel(): AudioLevelData {
    if (!this.analyserNode) {
      return {
        level: 0,
        peak: 0,
        average: 0,
        isClipping: false,
        isTooQuiet: true,
        timestamp: Date.now(),
      };
    }

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);

    // Calculate RMS level
    let sum = 0;
    let max = 0;
    for (const value of dataArray) {
      const normalized = value / 255;
      sum += normalized ** 2;
      max = Math.max(max, normalized);
    }

    const level = Math.sqrt(sum / dataArray.length);
    const peak = max;
    const average = sum / dataArray.length;

    return {
      level,
      peak,
      average,
      isClipping: peak > 0.95,
      isTooQuiet: level < this.options.silenceThreshold,
      timestamp: Date.now(),
    };
  }

  /**
   * Get waveform data for visualization
   */
  getWaveformData(): WaveformData {
    if (!this.analyserNode) {
      return {
        data: new Uint8Array(128),
        fftSize: 256,
        timestamp: Date.now(),
      };
    }

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteTimeDomainData(dataArray);

    return {
      data: dataArray,
      fftSize: this.analyserNode.fftSize,
      timestamp: Date.now(),
    };
  }

  // ============================================================================
  // Timers
  // ============================================================================

  /**
   * Start audio level monitoring
   */
  private startLevelMonitoring(): void {
    this.levelCheckInterval = window.setInterval(() => {
      if (this.state === 'recording') {
        const levelData = this.getAudioLevel();
        this.emit('levelUpdate', levelData);
      }
    }, 50); // 20 FPS for smooth visualization
  }

  /**
   * Start duration tracking
   */
  private startDurationTracking(): void {
    this.durationInterval = window.setInterval(() => {
      if (this.state === 'recording') {
        const duration = this.getDuration();
        this.emit('durationUpdate', duration);

        // Check max duration
        if (this.options.maxDurationSeconds > 0 && duration >= this.options.maxDurationSeconds) {
          this.stop();
        }
      }
    }, 1000);
  }

  /**
   * Stop all timers
   */
  private stopTimers(): void {
    if (this.levelCheckInterval) {
      clearInterval(this.levelCheckInterval);
      this.levelCheckInterval = null;
    }
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Get current state
   */
  getState(): RecordingState {
    return this.state;
  }

  /**
   * Set state and emit event
   */
  private setState(newState: RecordingState): void {
    this.state = newState;
    this.emit('stateChange', newState);
  }

  /**
   * Get current duration in seconds
   */
  getDuration(): number {
    if (!this.startTime) return 0;

    let elapsed = Date.now() - this.startTime - this.totalPausedDuration;
    if (this.state === 'paused') {
      elapsed -= Date.now() - this.pauseStartTime;
    }

    return Math.floor(elapsed / 1000);
  }

  /**
   * Get recording metadata
   */
  getMetadata(): RecordingMetadata {
    return {
      id: this.recordingId,
      duration: this.getDuration(),
      size: this.chunks.reduce((acc, chunk) => acc + chunk.size, 0),
      format: this.options.format,
      quality: this.options.quality,
      bitrate: this.options.bitrate,
      sampleRate: this.options.sampleRate,
      channels: this.options.channels,
      startedAt: new Date(this.startTime),
      endedAt: this.state === 'stopped' ? new Date() : undefined,
      pausedDuration: Math.floor(this.totalPausedDuration / 1000),
    };
  }

  // ============================================================================
  // Completion
  // ============================================================================

  /**
   * Handle recording completion
   */
  private handleRecordingComplete(): void {
    const blob = new Blob(this.chunks, { type: this.mimeType });
    const metadata = this.getMetadata();
    const extension = getFileExtension(this.mimeType);
    const fileName = `recording_${this.recordingId}.${extension}`;

    const completed: CompletedRecording = {
      id: this.recordingId,
      blob,
      fileName,
      mimeType: this.mimeType,
      metadata,
    };

    this.emit('complete', completed);
    this.cleanup();
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.stopTimers();

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(console.warn);
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.mediaRecorder = null;
  }

  /**
   * Destroy recorder and clean up
   */
  destroy(): void {
    this.cancel();
    this.listeners = {};
  }
}

// ============================================================================
// Exports
// ============================================================================

export default AudioRecorder;
