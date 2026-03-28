'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMinutes } from '@/hooks/useMinutes';
import { MinuteEditor } from '@/components/minutes/MinuteEditor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  Loader2,
  FileText,
  AlertTriangle
} from 'lucide-react';

export default function MinuteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const minuteId = params.id as string;

  const {
    minute,
    isLoading,
    isSaving,
    isDirty,
    lastSaved,
    error,
    loadMinute,
    updateMinute,
    updateSection,
    addSection,
    removeSection,
    reorderSections,
    addEvidence,
    removeEvidence,
    addActionItem,
    updateActionItem,
    removeActionItem,
    saveMinute,
    submitForReview,
    approve,
    requestChanges
  } = useMinutes({
    autoSaveInterval: 30000,
    onAutoSave: (minute) => {
      console.log('[MinuteDetailPage] Auto-saved:', minute.id);
    },
    onError: (error) => {
      console.error('[MinuteDetailPage] Error:', error);
    }
  });

  useEffect(() => {
    if (minuteId) {
      loadMinute(minuteId);
    }
  }, [minuteId, loadMinute]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Loading minute...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !minute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Card variant="glass" className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Failed to load minute
            </h2>
            <p className="text-slate-500 mb-4">{error.message}</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => loadMinute(minuteId)}>
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Not found state
  if (!minute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Card variant="glass" className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Minute not found
            </h2>
            <p className="text-slate-500 mb-4">
              The minute you are looking for does not exist or has been removed.
            </p>
            <Link href="/minutes">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Minutes
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/minutes" className="hover:text-[var(--primary)] transition-colors">
            Minutes
          </Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-300">{minute.title}</span>
        </div>

        {/* Editor */}
        <MinuteEditor
          minute={minute}
          isSaving={isSaving}
          isDirty={isDirty}
          lastSaved={lastSaved}
          onUpdate={updateMinute}
          onUpdateSection={updateSection}
          onAddSection={addSection}
          onRemoveSection={removeSection}
          onReorderSections={reorderSections}
          onAddEvidence={addEvidence}
          onRemoveEvidence={removeEvidence}
          onAddActionItem={addActionItem}
          onUpdateActionItem={updateActionItem}
          onRemoveActionItem={removeActionItem}
          onSave={saveMinute}
          onSubmitForReview={submitForReview}
          onApprove={approve}
          onRequestChanges={requestChanges}
        />
      </div>
    </div>
  );
}
