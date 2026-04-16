'use client';

/**
 * Recording Page
 *
 * Full-featured audio recording interface for social care meetings.
 * Supports offline-first capture, consent management, and metadata.
 *
 * @module app/record
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDemo } from '@/context/DemoContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useNetworkStatus } from '@/providers/NetworkStatusProvider';
import { useRecorder, QUALITY_PRESETS } from '@/hooks/useRecorder';
import type { AudioQuality, CaseMetadata } from '@/lib/audio/types';
import type { Meeting } from '@/types/demo';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { PageHeader, ShellPage } from '@/components/layout';

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
  const [consentChecked, setConsentChecked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card variant="glass" className="p-8 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/18">
          <AlertTriangle className="w-8 h-8 text-warning" />
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

        <div className="bg-muted/50 rounded-xl text-left border border-muted">
          {/* 44px minimum touch target via min-h-[44px] and full-row tap area */}
          <label className="flex items-center gap-3 cursor-pointer p-4 min-h-11">
            <span className="flex items-center justify-center w-6 h-6 shrink-0">
              <input
                type="checkbox"
                className="w-5 h-5 text-primary rounded-sm border-muted-foreground focus:ring-primary"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
              />
            </span>
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
            disabled={!consentChecked}
            onClick={onAccept}
          >
            I Confirm, Start Session
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

export default function RecordPage() {
  const { isReady, isAuthorized } = useRoleGuard(['social_worker', 'housing_officer']);

  const router = useRouter();
  const { currentUser, addMeeting } = useDemo();
  const { state: networkState } = useNetworkStatus();

  // Consent state — per-session, never persisted to localStorage
  const [showConsent, setShowConsent] = useState(true);
  const [consentTimestamp, setConsentTimestamp] = useState<string | null>(null);

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
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Recorder hook
  const recorder = useRecorder({
    quality,
    autoSave: true,
    caseMetadata: caseMetadata as CaseMetadata,
    onComplete: (recording) => {
      // Create meeting record
      const now = new Date().toISOString();
      const meeting: Meeting = {
        id: recording.id,
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
        consentGiven: true,
        consentTimestamp: consentTimestamp ?? now,
      };

      addMeeting(meeting);
      setCompletedMeetingId(meeting.id);
      setIsComplete(true);
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
      setCaseMetadata((prev) => {
        if (prev.recordedAt) {
          return prev;
        }
        return {
          ...prev,
          recordedAt: new Date(),
        };
      });
      await recorder.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [recorder]);

  // Handle new recording — reset consent so it is required per-session
  const handleNewRecording = useCallback(() => {
    setIsComplete(false);
    setCompletedMeetingId(null);
    setShowConsent(true);
    setConsentTimestamp(null);
    setCaseMetadata({
      serviceDomain: currentUser.domain,
      recorderName: currentUser.name,
      recorderId: currentUser.id,
    });
  }, [currentUser]);

  // Show consent screen
  if (showConsent) {
    return (
      <ShellPage
        className="animate-in fade-in duration-300"
        padded={false}
        contentClassName="flex h-full items-center justify-center p-4"
      >
        <ConsentScreen
          onAccept={() => {
            setConsentTimestamp(new Date().toISOString());
            setShowConsent(false);
          }}
          onDecline={() => router.push('/')}
        />
      </ShellPage>
    );
  }

  // Show completion screen
  if (isComplete) {
    return (
      <ShellPage
        className="animate-in fade-in duration-300"
        padded={false}
        contentClassName="flex h-full items-center justify-center p-4"
      >
        <RecordingCompleteScreen
          duration={recorder.formattedDuration}
          meetingId={completedMeetingId}
          onNewRecording={handleNewRecording}
        />
      </ShellPage>
    );
  }

  const isRecordingActive = recorder.state === 'recording' || recorder.state === 'paused';
  const isPaused = recorder.state === 'paused';
  const networkTone =
    networkState === 'online'
      ? 'success'
      : networkState === 'offline'
      ? 'destructive'
      : 'warning';
  const networkLabel =
    networkState === 'online'
      ? 'Online'
      : networkState === 'offline'
      ? 'Offline'
      : 'Degraded';
  const handleNavigateBack = () => {
    if (isRecordingActive) {
      setShowLeaveDialog(true);
      return;
    }
    router.push('/');
  };

  if (!isReady || !isAuthorized) {
    return null;
  }

  return (
    <ShellPage
      padded={false}
      header={
        <PageHeader
          eyebrow="Capture"
          title="Record Meeting"
          description={`${currentUser.name} • ${currentUser.domain}`}
          metrics={[
            { label: 'Connection', value: networkLabel, tone: networkTone },
            { label: 'Quality', value: QUALITY_PRESETS[quality].label, tone: 'info' },
          ]}
          actions={
            <Button
              variant="outline"
              className="gap-2"
              aria-label="Go back"
              onClick={handleNavigateBack}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          }
        />
      }
      contentClassName="space-y-8"
    >
      <div className="mx-auto max-w-4xl space-y-8 pb-16">
        {/* Recording Interface */}
        <Card variant="glass" className="space-y-8 p-6 sm:p-8" hoverEffect={false}>
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
        </Card>

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
          <Card className="border-warning/20 bg-warning/10 p-4">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-warning" />
              <div>
                <p className="font-medium text-warning">
                  You&apos;re offline
                </p>
                <p className="text-sm text-muted-foreground">
                  Recordings will be saved locally and uploaded when you&apos;re back online.
                </p>
              </div>
            </div>
          </Card>
        )}

        <ConfirmDialog
          open={showLeaveDialog}
          onOpenChange={setShowLeaveDialog}
          title="Leave recording?"
          description="Leaving now will cancel the active recording and discard the in-progress capture."
          confirmText="Leave and discard"
          cancelText="Keep recording"
          destructive
          onConfirm={() => {
            recorder.cancel();
            router.push('/');
          }}
        />
      </div>
    </ShellPage>
  );
}
