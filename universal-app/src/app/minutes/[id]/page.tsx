'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMinutes } from '@/hooks/useMinutes';
import { MinuteEditor } from '@/components/minutes/MinuteEditor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
      <div className="min-h-0 bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin motion-reduce:animate-none mx-auto mb-4" />
              <p className="text-muted-foreground">Loading minute...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !minute) {
    return (
      <div className="min-h-0 bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Card variant="glass" className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Failed to load minute
            </h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
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
      <div className="min-h-0 bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Card variant="glass" className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Minute not found
            </h2>
            <p className="text-muted-foreground mb-4">
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
    <div className="min-h-0 bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/minutes" className="hover:text-[var(--primary)] transition-colors">
            Minutes
          </Link>
          <span>/</span>
          <span className="text-foreground">{minute.title}</span>
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
