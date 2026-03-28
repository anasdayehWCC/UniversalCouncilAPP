'use client';

/**
 * useRecorder Hook
 *
 * React hook for audio recording with offline queue integration.
 * Provides state, controls, audio levels, and auto-save functionality.
 *
 * @module hooks/useRecorder
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AudioRecorder,
  type RecordingState,
  type AudioLevelData,
  type WaveformData,
  type AudioDevice,
  type AudioPermissionStatus,
  type RecorderOptions,
  type RecordingMetadata,
  type CompletedRecording,
  type RecorderError,
  type CaseMetadata,
  QUALITY_PRESETS,
} from '@/lib/audio';
import { queueRecording, type QueueMeta } from '@/lib/offline-queue';

// ============================================================================
// Types
// ============================================================================

export interface UseRecorderState {
  /** Current recording state */
  state: RecordingState;
  /** Recording duration in seconds */
  duration: number;
  /** Formatted duration string (MM:SS) */
  formattedDuration: string;
  /** Current audio level data */
  audioLevel: AudioLevelData;
  /** Waveform data for visualization */
  waveformData: WaveformData | null;
  /** Available audio devices */
  devices: AudioDevice[];
  /** Selected device ID */
  selectedDeviceId: string;
  /** Permission status */
  permission: AudioPermissionStatus;
  /** Current error */
  error: RecorderError | null;
  /** Recording metadata */
  metadata: RecordingMetadata | null;
  /** Last completed recording */
  completedRecording: CompletedRecording | null;
  /** Whether recording is saving */
  isSaving: boolean;
  /** Whether auto-save is enabled */
  autoSave: boolean;
}

export interface UseRecorderControls {
  /** Start recording */
  start: () => Promise<void>;
  /** Stop recording */
  stop: () => void;
  /** Pause recording */
  pause: () => void;
  /** Resume recording */
  resume: () => void;
  /** Cancel recording (discard data) */
  cancel: () => void;
  /** Request microphone permission */
  requestPermission: () => Promise<AudioPermissionStatus>;
  /** Refresh device list */
  refreshDevices: () => Promise<void>;
  /** Select audio device */
  selectDevice: (deviceId: string) => void;
  /** Save recording to offline queue */
  saveToQueue: (caseMetadata?: CaseMetadata) => Promise<number | null>;
  /** Clear error */
  clearError: () => void;
  /** Toggle auto-save */
  toggleAutoSave: () => void;
  /** Get current waveform data */
  getWaveformData: () => WaveformData | null;
}

export interface UseRecorderOptions extends RecorderOptions {
  /** Case metadata to attach to recording */
  caseMetadata?: CaseMetadata;
  /** Auto-save to offline queue when recording stops */
  autoSave?: boolean;
  /** Callback when recording completes */
  onComplete?: (recording: CompletedRecording) => void;
  /** Callback when error occurs */
  onError?: (error: RecorderError) => void;
}

export type UseRecorderReturn = UseRecorderState & UseRecorderControls;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format duration as MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert CaseMetadata to QueueMeta
 */
function toQueueMeta(caseMetadata?: CaseMetadata): QueueMeta {
  return {
    case_reference: caseMetadata?.caseReference || 'unassigned',
    service_domain_id: caseMetadata?.serviceDomain,
    template_name: caseMetadata?.templateName,
    template_id: caseMetadata?.templateId,
    subject_initials: caseMetadata?.subjectInitials,
    subject_dob: caseMetadata?.subjectDob,
    visit_type: caseMetadata?.visitType,
    meeting_mode: caseMetadata?.meetingMode,
    intended_outcomes: caseMetadata?.intendedOutcomes,
    risk_flags: caseMetadata?.riskFlags,
    notes: caseMetadata?.notes,
    consent_ack: caseMetadata?.consentAcknowledged,
    worker_team: caseMetadata?.workerTeam,
  };
}

// ============================================================================
// Hook
// ============================================================================

export function useRecorder(options: UseRecorderOptions = {}): UseRecorderReturn {
  const {
    caseMetadata: initialCaseMetadata,
    autoSave: initialAutoSave = true,
    onComplete,
    onError,
    ...recorderOptions
  } = options;

  // Refs
  const recorderRef = useRef<AudioRecorder | null>(null);
  const caseMetadataRef = useRef<CaseMetadata | undefined>(initialCaseMetadata);

  // State
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState<AudioLevelData>({
    level: 0,
    peak: 0,
    average: 0,
    isClipping: false,
    isTooQuiet: true,
    timestamp: Date.now(),
  });
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('default');
  const [permission, setPermission] = useState<AudioPermissionStatus>({
    state: 'unknown',
    hasRequested: false,
  });
  const [error, setError] = useState<RecorderError | null>(null);
  const [metadata, setMetadata] = useState<RecordingMetadata | null>(null);
  const [completedRecording, setCompletedRecording] = useState<CompletedRecording | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSave, setAutoSave] = useState(initialAutoSave);

  // ============================================================================
  // Initialization
  // ============================================================================

  // Check permission and list devices on mount
  useEffect(() => {
    const init = async () => {
      const permissionStatus = await AudioRecorder.checkPermission();
      setPermission(permissionStatus);

      if (permissionStatus.state === 'granted') {
        const deviceList = await AudioRecorder.listDevices();
        setDevices(deviceList);
      }
    };

    init();

    // Listen for device changes
    const handleDeviceChange = async () => {
      const deviceList = await AudioRecorder.listDevices();
      setDevices(deviceList);
    };

    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  // Update waveform data during recording
  useEffect(() => {
    let animationFrame: number;

    const updateWaveform = () => {
      if (recorderRef.current && state === 'recording') {
        setWaveformData(recorderRef.current.getWaveformData());
      }
      animationFrame = requestAnimationFrame(updateWaveform);
    };

    if (state === 'recording') {
      updateWaveform();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.destroy();
        recorderRef.current = null;
      }
    };
  }, []);

  // ============================================================================
  // Controls
  // ============================================================================

  const requestPermission = useCallback(async (): Promise<AudioPermissionStatus> => {
    const status = await AudioRecorder.requestPermission();
    setPermission(status);

    if (status.state === 'granted') {
      const deviceList = await AudioRecorder.listDevices();
      setDevices(deviceList);
    }

    return status;
  }, []);

  const refreshDevices = useCallback(async (): Promise<void> => {
    const deviceList = await AudioRecorder.listDevices();
    setDevices(deviceList);
  }, []);

  const selectDevice = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
  }, []);

  const start = useCallback(async (): Promise<void> => {
    setError(null);

    // Ensure permission is granted
    if (permission.state !== 'granted') {
      const status = await requestPermission();
      if (status.state !== 'granted') {
        throw new Error('Microphone permission is required');
      }
    }

    // Create new recorder instance
    const recorder = new AudioRecorder({
      ...recorderOptions,
      deviceId: selectedDeviceId,
    });

    // Set up event handlers
    recorder.on('stateChange', (newState) => {
      setState(newState);
    });

    recorder.on('durationUpdate', (newDuration) => {
      setDuration(newDuration);
      setMetadata(recorder.getMetadata());
    });

    recorder.on('levelUpdate', (levelData) => {
      setAudioLevel(levelData);
    });

    recorder.on('error', (err) => {
      setError(err);
      onError?.(err);
    });

    recorder.on('complete', async (recording) => {
      setCompletedRecording(recording);
      onComplete?.(recording);

      // Auto-save if enabled
      if (autoSave) {
        setIsSaving(true);
        try {
          const meta = toQueueMeta(caseMetadataRef.current);
          await queueRecording(recording.blob, meta, recording.fileName);
        } catch (saveError) {
          console.error('Failed to auto-save recording:', saveError);
          setError({
            type: 'storage_full',
            message: 'Failed to save recording to offline queue',
            recoverable: true,
            recoverySuggestion: 'Try freeing up storage space and saving manually',
          });
        } finally {
          setIsSaving(false);
        }
      }
    });

    recorderRef.current = recorder;

    // Start recording
    await recorder.start();
    setDuration(0);
    setMetadata(recorder.getMetadata());
  }, [permission, selectedDeviceId, recorderOptions, autoSave, requestPermission, onComplete, onError]);

  const stop = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
    }
  }, []);

  const pause = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.resume();
    }
  }, []);

  const cancel = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    setState('idle');
    setDuration(0);
    setMetadata(null);
    setCompletedRecording(null);
  }, []);

  const saveToQueue = useCallback(
    async (caseMetadata?: CaseMetadata): Promise<number | null> => {
      if (!completedRecording) {
        return null;
      }

      setIsSaving(true);
      try {
        const meta = toQueueMeta(caseMetadata || caseMetadataRef.current);
        const id = await queueRecording(
          completedRecording.blob,
          meta,
          completedRecording.fileName
        );
        return id;
      } catch (saveError) {
        console.error('Failed to save recording:', saveError);
        setError({
          type: 'storage_full',
          message: 'Failed to save recording to offline queue',
          recoverable: true,
          recoverySuggestion: 'Try freeing up storage space',
        });
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [completedRecording]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const toggleAutoSave = useCallback(() => {
    setAutoSave((prev) => !prev);
  }, []);

  const getWaveformData = useCallback((): WaveformData | null => {
    if (recorderRef.current && state === 'recording') {
      return recorderRef.current.getWaveformData();
    }
    return waveformData;
  }, [state, waveformData]);

  // Update case metadata ref when it changes
  useEffect(() => {
    caseMetadataRef.current = initialCaseMetadata;
  }, [initialCaseMetadata]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    state,
    duration,
    formattedDuration: formatDuration(duration),
    audioLevel,
    waveformData,
    devices,
    selectedDeviceId,
    permission,
    error,
    metadata,
    completedRecording,
    isSaving,
    autoSave,

    // Controls
    start,
    stop,
    pause,
    resume,
    cancel,
    requestPermission,
    refreshDevices,
    selectDevice,
    saveToQueue,
    clearError,
    toggleAutoSave,
    getWaveformData,
  };
}

// ============================================================================
// Exports
// ============================================================================

export { QUALITY_PRESETS };
export type { AudioDevice, AudioQuality, CaseMetadata } from '@/lib/audio';

export default useRecorder;
