'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Pause, Play, Wifi, WifiOff, Settings2, ArrowLeft, Activity, ShieldCheck, MonitorSmartphone, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { queueRecording } from '@/lib/offline-queue';
import { useDevPreview } from '@/lib/dev-preview-provider';
import { Button } from '@careminutes/ui';
import { PressableSurface } from '@/lib/ui/pressable';
import { TokenText } from '@careminutes/ui';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { RecordingWaveform } from '@/components/recording-waveform';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@careminutes/ui/dialog';
import { Label } from '@careminutes/ui/label';
import { Checkbox } from '@careminutes/ui/checkbox';

export default function CapturePage() {
  const { isOffline } = useDevPreview();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processingMode, setProcessingMode] = useState<'fast' | 'economy'>('fast');
   const [meetingMode, setMeetingMode] = useState<'in_person' | 'online'>('in_person');
  const [consentGiven, setConsentGiven] = useState(false);
  const [modeModalOpen, setModeModalOpen] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    if (!consentGiven) {
      toast.error('Please confirm recording consent');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleSaveRecording(blob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const handleSaveRecording = async (blob: Blob) => {
    try {
      const fileName = `recording-${new Date().toISOString()}.webm`;

      // Always queue first (offline-first pattern)
      await queueRecording(
        blob,
        {
          case_reference: 'Quick Capture',
          processing_mode: processingMode,
          meeting_mode: meetingMode,
          consent_ack: consentGiven,
        },
        fileName
      );

      toast.success('Recording saved to queue', {
        description: isOffline ? 'Will sync when online' : 'Ready to upload',
        icon: isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />,
      });

      // Optional: Redirect to queue or list
      // router.push('/transcriptions');
    } catch (err) {
      console.error('Failed to save recording:', err);
      toast.error('Failed to save recording');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 z-10">
        <Link href="/new" className="p-2 rounded-full hover:bg-muted/50 transition-colors">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel-premium border-[color:var(--border)]">
          {isOffline ? (
            <>
              <WifiOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Offline</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-green-600">Online</span>
            </>
          )}
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings2 className="w-6 h-6" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="recording"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-8 w-full max-w-2xl"
            >
              <div className="text-6xl font-mono font-bold tracking-tighter text-foreground tabular-nums">
                {formatDuration(duration)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" aria-hidden />
                {isPaused ? 'Paused' : 'Recording live'}
              </div>
              <RecordingWaveform className="mt-2" />

              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
                />
                <div className="flex items-center gap-3">
                  <Button
                    size="lg"
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="h-20 w-20 rounded-full bg-white text-primary shadow-lg hover:bg-slate-100 transition-all hover:scale-105"
                  >
                    {isPaused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
                  </Button>
                  <Button
                    size="lg"
                    onClick={stopRecording}
                    className="h-24 w-24 rounded-full bg-red-500 hover:bg-red-600 shadow-lg flex items-center justify-center transition-all hover:scale-105"
                  >
                    <Square className="w-8 h-8 text-white fill-current" />
                  </Button>
        </div>
      </div>
              <p className="text-sm text-muted-foreground animate-pulse">Recording in progress...</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-8 w-full max-w-xs"
            >
              <div className="text-center space-y-2">
                <TokenText as="h1" className="text-3xl font-bold tracking-tight">New Recording</TokenText>
                <TokenText emphasis="muted">Tap to start capturing audio</TokenText>
              </div>

              <Button
                size="lg"
                onClick={startRecording}
                className="h-32 w-32 rounded-full bg-primary hover:bg-primary/90 shadow-xl flex items-center justify-center transition-all hover:scale-105 ring-4 ring-primary/10"
              >
                <Mic className="w-12 h-12 text-primary-foreground" />
              </Button>

              {/* Processing Mode Toggle */}
              <div className="flex gap-2 w-full">
                <PressableSurface
                  onClick={() => setProcessingMode('fast')}
                  className={cn(
                    "flex-1 py-3 px-4",
                    processingMode === 'fast'
                      ? "bg-background border-[color:var(--ring)]"
                      : "bg-muted"
                  )}
                  aria-label="Fast processing mode"
                >
                  <TokenText className="text-sm font-medium">Fast</TokenText>
                  <TokenText emphasis="muted" className="text-xs">Low latency</TokenText>
                </PressableSurface>
                <PressableSurface
                  onClick={() => setProcessingMode('economy')}
                  className={cn(
                    "flex-1 py-3 px-4",
                    processingMode === 'economy'
                      ? "bg-background border-[color:var(--ring)]"
                      : "bg-muted"
                  )}
                  aria-label="Economy processing mode"
                >
                  <TokenText className="text-sm font-medium">Economy</TokenText>
                  <TokenText emphasis="muted" className="text-xs">Batch, cost optimised</TokenText>
                </PressableSurface>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Floating controls/status */}
      {isRecording && (
        <div className="fixed bottom-6 inset-x-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-slate-900/80 px-4 py-2 text-white shadow-xl backdrop-blur">
            <span className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" aria-hidden />
              Live • {formatDuration(duration)}
            </span>
            <span className="text-xs text-white/70">Mode: {processingMode === 'fast' ? 'Fast' : 'Economy'}</span>
            <Activity className="h-4 w-4 text-white/70" />
          </div>
        </div>
      )}

      <Dialog open={modeModalOpen} onOpenChange={setModeModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Choose recording mode
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pick the context for this recording and confirm you have permission. This helps templates and audits label the session correctly.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <PressableSurface
                onClick={() => setMeetingMode('in_person')}
                className={cn(
                  'p-3 rounded-xl border',
                  meetingMode === 'in_person' ? 'border-primary bg-primary/5' : 'border-muted'
                )}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <TokenText emphasis="strong">In person</TokenText>
                </div>
                <TokenText emphasis="muted" className="text-xs">Home visit or face-to-face meeting</TokenText>
              </PressableSurface>
              <PressableSurface
                onClick={() => setMeetingMode('online')}
                className={cn(
                  'p-3 rounded-xl border',
                  meetingMode === 'online' ? 'border-primary bg-primary/5' : 'border-muted'
                )}
              >
                <div className="flex items-center gap-2">
                  <MonitorSmartphone className="h-4 w-4" />
                  <TokenText emphasis="strong">Online / hybrid</TokenText>
                </div>
                <TokenText emphasis="muted" className="text-xs">Teams/phone or mixed</TokenText>
              </PressableSurface>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="consent"
                checked={consentGiven}
                onCheckedChange={(v) => setConsentGiven(Boolean(v))}
              />
              <Label htmlFor="consent" className="text-sm leading-snug">
                I have informed participants and obtained permission to record this session.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!consentGiven}
              onClick={() => setModeModalOpen(false)}
              className="w-full"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
