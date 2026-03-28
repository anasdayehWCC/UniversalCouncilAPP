'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileAudio, X, CheckCircle2, Zap, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '@/context/DemoContext';
import { Meeting } from '@/types/demo';

export default function UploadPage() {
  const { addMeeting, currentUser } = useDemo();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<'fast' | 'economy'>('fast');
  const [title, setTitle] = useState('');
  const [simulateError] = useState(false);
  const [uploadResult, setUploadResult] = useState<'success' | 'error' | null>(null);
  const [queuedMeetingId, setQueuedMeetingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      setTitle(dropped.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    setErrorMessage(null);
    setQueuedMeetingId(null);
    // Simulate upload
    let p = 0;
    const shouldFail = simulateError;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setUploading(false);
          if (shouldFail) {
            setUploadResult('error');
            setErrorMessage('Transcription service returned an error. Retry or switch to Fast mode.');
            return;
          }
          const now = new Date().toISOString();
          const meeting: Meeting = {
            id: `u-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36)}`,
            title: title || file.name.replace(/\.[^/.]+$/, ""),
            date: now,
            duration: 'Processing',
            attendees: [currentUser.name],
            templateId: currentUser.domain === 'adults' ? 'safeguarding' : currentUser.domain === 'housing' ? 'housing-inspection' : 'statutory-visit',
            status: 'processing',
            domain: currentUser.domain,
            tags: ['Uploaded', mode === 'fast' ? 'Fast' : 'Economy'],
            riskScore: 'low',
            summary: `Audio upload received in ${mode === 'fast' ? 'Fast' : 'Economy'} mode. AI transcription is in progress.`,
            transcript: [],
            tasks: [],
            processingMode: mode,
            uploadedAt: now,
            submittedById: currentUser.id,
            submittedBy: currentUser.name,
            submittedAt: now,
          };
          addMeeting(meeting);
          setQueuedMeetingId(meeting.id);
          setUploadResult('success');
        }, 500);
      }
    }, 100);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="sr-only" aria-live="polite">
        {uploading ? `Uploading ${file?.name || 'file'}, ${progress}%` : uploadResult === 'success' ? 'Upload succeeded' : uploadResult === 'error' ? 'Upload failed' : ''}
      </div>
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Upload Audio</h1>
        <p className="text-slate-500">Import recordings from other devices for transcription.</p>
      </div>

      {!file ? (
        <div 
          role="button"
          tabIndex={0}
          aria-label="Upload audio file"
          className={cn(
            "border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer",
            dragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              document.getElementById('file-upload')?.click();
            }
          }}
        >
          <input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            accept="audio/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const picked = e.target.files[0];
                setFile(picked);
                setTitle(picked.name.replace(/\.[^/.]+$/, ""));
              }
            }}
          />
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Click to upload or drag and drop</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Supported formats: MP3, M4A, WAV (Max 500MB)
          </p>
        </div>
      ) : (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <FileAudio className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{file.name}</h3>
                <p className="text-sm text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            {!uploading && (
              <Button variant="ghost" size="icon" onClick={() => setFile(null)} aria-label="Remove file">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            )}
          </div>

          {uploading ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-blue-600">Uploading...</span>
                <span className="text-slate-500">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div 
                  role="button"
                  tabIndex={0}
                  aria-pressed={mode === 'fast'}
                  className={cn(
                    "p-4 border rounded-xl cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2",
                    mode === 'fast' ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-slate-200 hover:border-slate-300"
                  )}
                  onClick={() => setMode('fast')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setMode('fast');
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className={cn("w-4 h-4", mode === 'fast' ? "text-blue-600" : "text-slate-400")} />
                    <span className={cn("font-bold text-sm", mode === 'fast' ? "text-blue-900" : "text-slate-700")}>Fast Mode</span>
                  </div>
                  <p className="text-xs text-slate-500">Quick transcription for standard meetings.</p>
                </div>

                <div 
                  role="button"
                  tabIndex={0}
                  aria-pressed={mode === 'economy'}
                  className={cn(
                    "p-4 border rounded-xl cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2",
                    mode === 'economy' ? "border-green-500 bg-green-50 ring-1 ring-green-500" : "border-slate-200 hover:border-slate-300"
                  )}
                  onClick={() => setMode('economy')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setMode('economy');
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className={cn("w-4 h-4", mode === 'economy' ? "text-green-600" : "text-slate-400")} />
                    <span className={cn("font-bold text-sm", mode === 'economy' ? "text-green-900" : "text-slate-700")}>Economy</span>
                  </div>
                  <p className="text-xs text-slate-500">Slower processing, better for long recordings.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Meeting Title</Label>
                  <Input 
                    placeholder="e.g. Smith Family Visit" 
                    value={title || file.name.replace(/\.[^/.]+$/, "")} 
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                {/* <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300"
                      checked={simulateError}
                      onChange={(e) => setSimulateError(e.target.checked)}
                    />
                    Simulate processing error
                  </Label>
                  <p className="text-xs text-slate-500">Use this to demo failure handling without needing real backends.</p>
                </div> */}
              </div>

              <div className="flex justify-end pt-4">
	                <Button 
	                  className="min-w-[140px]" 
	                  onClick={handleUpload}
	                  disabled={uploading}
	                >
                  Start Upload
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {uploadResult === 'success' && queuedMeetingId && (
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">Upload queued for transcription</h3>
              <p className="text-sm text-slate-600">We created a note with your selected mode ({mode}). You can monitor it in My Notes.</p>
              <div className="flex gap-3 mt-3">
                <Link href={`/my-notes/${queuedMeetingId}`}>
                  <Button variant="outline">Open note</Button>
                </Link>
                <Button variant="ghost" onClick={() => { setFile(null); setProgress(0); setUploadResult(null); }}>
                  Upload another file
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {uploadResult === 'error' && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">Upload failed</h3>
              <p className="text-sm text-slate-600">{errorMessage}</p>
              <div className="flex gap-3 mt-3">
                <Button variant="outline" onClick={() => handleUpload()} disabled={uploading || !file}>
                  Retry upload
                </Button>
                <Button variant="ghost" onClick={() => { setFile(null); setUploadResult(null); setProgress(0); }}>
                  Start over
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
