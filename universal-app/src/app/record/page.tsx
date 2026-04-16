'use client';

/**
 * Recording Page
 *
 * Full-featured audio recording interface for social care meetings.
 * Supports offline-first capture, consent management, and metadata.
 *
 * @module app/record
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Clock,
  Upload,
  HardDrive,
  CloudUpload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDemo } from '@/context/DemoContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useRecorder, QUALITY_PRESETS } from '@/hooks/useRecorder';
import type { AudioQuality, CaseMetadata } from '@/lib/audio/types';
import type { Meeting } from '@/types/demo';

import {
  RecordingTimer,
  RecordingControls,
  AudioVisualizer,
  DeviceSelector,
  RecordingMetadata,
  QualitySettings,
} from './components';

// ============================================================================
// Consent Screen
// ============================================================================

function ConsentScreen({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [consentGiven, setConsentGiven] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card variant="glass" className="p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Recording Consent
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Before starting, please confirm that you have informed all
            participants that this meeting will be recorded for note-taking
            purposes.
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-xl text-left border border-muted">
          <label className="flex items-start gap-3 cursor-pointer min-h-[44px] py-2">
            <input
              type="checkbox"
              className="mt-0.5 w-5 h-5 shrink-0 text-primary rounded-sm border-muted-foreground focus:ring-primary"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
            />
            <span className="text-sm text-muted-foreground">
              I confirm that I have obtained permission from all attendees to
              record this session. I understand this recording will be processed
              securely in accordance with council data protection policies.
            </span>
          </label>
        </div>

        <div className="flex gap-4 justify-center">
          <Button variant="ghost" onClick={onDecline}>
            Cancel
          </Button>
          <Button
            disabled={!consentGiven}
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('recordingConsentGiven', 'true');
              }
              onAccept();
            }}
          >
            I Understand, Continue
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Recording Complete Screen
// ============================================================================

function RecordingCompleteScreen({
  duration,
  meetingId,
  onNewRecording,
}: {
  duration: string;
  meetingId: string | null;
  onNewRecording: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto"
    >
      <Card variant="glass" className="p-8 text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-10 h-10 text-success" />
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Recording Saved!
          </h2>
          <p className="text-muted-foreground">
            Your {duration} recording has been queued for transcription.
          </p>
        </div>

        {meetingId && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Note ID: <span className="font-mono text-foreground">{meetingId}</span>
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {meetingId && (
            <Button asChild>
              <Link href={`/minutes/${meetingId}`}>View Recording</Link>
            </Button>
          )}
          <Button variant="outline" onClick={onNewRecording}>
            New Recording
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Main Recording Page
// ============================================================================

const ALLOWED_ROLES: Array<'social_worker' | 'housing_officer'> = ['social_worker', 'housing_officer'];

export default function RecordPage() {
  useRoleGuard(ALLOWED_ROLES);

  const router = useRouter();
  const { currentUser, addMeeting, role } = useDemo();
  const { state: networkState } = useNetworkStatus();

  // Authorization gate: block ALL rendering until role is confirmed.
  // useRoleGuard redirects via useEffect, but that fires AFTER first render.
  // Without this early return, unauthorized users briefly see the consent screen.
  const isAuthorized = ALLOWED_ROLES.includes(role);
  if (!isAuthorized) {
    return null;
  }

  // Consent state
  const [showConsent, setShowConsent] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('recordingConsentGiven') !== 'true';
    }
    return true;
  });

  // Quality settings
  const [quality, setQuality] = useState<AudioQuality>('high');

  // Case metadata
  const [caseMetadata, setCaseMetadata] = useState<Partial<CaseMetadata>>({
    serviceDomain: currentUser.domain,
    recorderName: currentUser.name,
    recorderId: currentUser.id,
  });

  // Recording completion
  const [isComplete, setIsComplete] = useState(false);
  const [completedMeetingId, setCompletedMeetingId] = useState<string | null>(null);

  // Save status indicator: tracks post-recording save/upload state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'uploaded'>('idle');

  // Recorder hook
  const recorder = useRecorder({
    quality,
    autoSave: true,
    caseMetadata: caseMetadata as CaseMetadata,
    onComplete: (recording) => {
      // Show "saved to device" immediately
      setSaveStatus('saving');

      // Create meeting record
      const now = new Date().toISOString();
      const meeting: Meeting = {
        id: `r-${Date.now().toString(36)}`,
        title: caseMetadata.caseReference
          ? `Recording - ${caseMetadata.caseReference}`
          : 'New Recording',
        date: now,
        duration: recorder.formattedDuration,
        attendees: [currentUser.name],
        templateId:
          currentUser.domain === 'adults'
            ? 'safeguarding'
            : currentUser.domain === 'housing'
            ? 'housing-inspection'
            : 'statutory-visit',
        status: 'processing',
        domain: currentUser.domain,
        tags: ['Recorded', 'Processing'],
        summary: 'Recording saved and queued for transcription.',
        transcript: [],
        tasks: [],
        processingMode: 'fast',
        uploadedAt: now,
        submittedById: currentUser.id,
        submittedBy: currentUser.name,
        submittedAt: now,
      };

      addMeeting(meeting);
      setCompletedMeetingId(meeting.id);

      // Transition through save statuses before showing complete screen
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('uploaded');
        setTimeout(() => {
          setIsComplete(true);
          setSaveStatus('idle');
        }, 1200);
      }, 1500);
    },
    onError: (error) => {
      console.error('Recording error:', error);
    },
  });

  // Handle quality change - only when idle
  const handleQualityChange = useCallback(
    (newQuality: AudioQuality) => {
      if (recorder.state === 'idle') {
        setQuality(newQuality);
      }
    },
    [recorder.state]
  );

  // Handle start recording
  const handleStart = useCallback(async () => {
    try {
      await recorder.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [recorder]);

  // Handle new recording
  const handleNewRecording = useCallback(() => {
    setIsComplete(false);
    setCompletedMeetingId(null);
    setSaveStatus('idle');
    setCaseMetadata({
      serviceDomain: currentUser.domain,
      recorderName: currentUser.name,
      recorderId: currentUser.id,
    });
  }, [currentUser]);

  // Update case metadata timestamp when recording starts
  useEffect(() => {
    if (recorder.state === 'recording' && !caseMetadata.recordedAt) {
      setCaseMetadata((prev) => ({
        ...prev,
        recordedAt: new Date(),
      }));
    }
  }, [recorder.state, caseMetadata.recordedAt]);

  // Show consent screen
  if (showConsent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <ConsentScreen
          onAccept={() => setShowConsent(false)}
          onDecline={() => router.push('/')}
        />
      </div>
    );
  }

  // Show completion screen
  if (isComplete) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <RecordingCompleteScreen
          duration={recorder.formattedDuration}
          meetingId={completedMeetingId}
          onNewRecording={handleNewRecording}
        />
      </div>
    );
  }

  const isRecordingActive = recorder.state === 'recording' || recorder.state === 'paused';
  const isPaused = recorder.state === 'paused';

  return (
    <div className="min-h-0 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Go back"
                onClick={() => {
                  if (isRecordingActive) {
                    if (confirm('Are you sure you want to leave? Recording will be cancelled.')) {
                      recorder.cancel();
                      router.push('/');
                    }
                  } else {
                    router.push('/');
                  }
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Record Meeting</h1>
                <p className="text-sm text-muted-foreground">
                  {currentUser.name} • {currentUser.domain}
                </p>
              </div>
            </div>

            {/* Network Status */}
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
                networkState === 'online'
                  ? 'bg-success/10 text-success'
                  : networkState === 'offline'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-warning/10 text-warning'
              )}
            >
              {networkState === 'online' ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Online</span>
                </>
              ) : networkState === 'offline' ? (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Degraded</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Recording Interface */}
        <div className="space-y-6">
          {/* Timer */}
          <div className="flex justify-center">
            <RecordingTimer
              duration={recorder.duration}
              formattedDuration={recorder.formattedDuration}
              isRecording={recorder.state === 'recording'}
              isPaused={isPaused}
            />
          </div>

          {/* Visualizer */}
          <AudioVisualizer
            audioLevel={recorder.audioLevel}
            waveformData={recorder.waveformData}
            isRecording={recorder.state === 'recording'}
            isPaused={isPaused}
            variant="bars"
          />

          {/* Controls */}
          <div className="flex justify-center pt-4">
            <RecordingControls
              state={recorder.state}
              onStart={handleStart}
              onStop={recorder.stop}
              onPause={recorder.pause}
              onResume={recorder.resume}
              onCancel={recorder.cancel}
              isSaving={recorder.isSaving}
              disabled={recorder.permission.state === 'denied'}
            />
          </div>

          {/* Save/Upload Status Indicator */}
          <AnimatePresence>
            {saveStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-2 text-sm font-medium"
              >
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <HardDrive className="w-4 h-4 animate-pulse motion-reduce:animate-none" />
                    Saving recording...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-2 text-success">
                    <HardDrive className="w-4 h-4" />
                    Recording saved to device
                  </span>
                )}
                {saveStatus === 'uploaded' && (
                  <span className="flex items-center gap-2 text-success">
                    <CloudUpload className="w-4 h-4" />
                    Uploaded
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings (only when not recording) */}
        <AnimatePresence>
          {!isRecordingActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              {/* Device and Quality Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DeviceSelector
                  devices={recorder.devices}
                  selectedDeviceId={recorder.selectedDeviceId}
                  permission={recorder.permission}
                  onSelectDevice={recorder.selectDevice}
                  onRequestPermission={recorder.requestPermission}
                  onRefreshDevices={recorder.refreshDevices}
                  disabled={isRecordingActive}
                />
                <QualitySettings
                  quality={quality}
                  onQualityChange={handleQualityChange}
                  estimatedDuration={recorder.duration}
                  disabled={isRecordingActive}
                />
              </div>

              {/* Metadata Form */}
              <RecordingMetadata
                metadata={caseMetadata}
                onChange={setCaseMetadata}
                disabled={isRecordingActive}
                compact={false}
                serviceDomain={currentUser.domain}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact metadata during recording */}
        <AnimatePresence>
          {isRecordingActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RecordingMetadata
                metadata={caseMetadata}
                onChange={setCaseMetadata}
                disabled={false}
                compact={true}
                serviceDomain={currentUser.domain}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {recorder.error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-4 bg-destructive/10 border-destructive/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">
                      {recorder.error.message}
                    </p>
                    {recorder.error.recoverySuggestion && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {recorder.error.recoverySuggestion}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={recorder.clearError}
                  >
                    Dismiss
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Offline Notice */}
        {networkState === 'offline' && !isRecordingActive && (
          <Card className="p-4 bg-amber-500/10 border-amber-500/20">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium text-amber-600 dark:text-amber-400">
                  You&apos;re offline
                </p>
                <p className="text-sm text-muted-foreground">
                  Recordings will be saved locally and uploaded when you&apos;re back online.
                </p>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
