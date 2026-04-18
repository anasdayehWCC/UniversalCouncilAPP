'use client';

/**
 * Recording List
 *
 * Displays a list of recordings with filtering and actions.
 *
 * @module components/recording/RecordingList
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileAudio, 
  Filter, 
  Trash2, 
  Upload, 
  RefreshCw,
  WifiOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { listQueued, type OfflineRecording } from '@/lib/offline-queue';
import type { RecordingStatus } from '@/lib/storage-adapter';
import { RecordingCard } from './RecordingCard';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialogRenderer } from '@/components/ui/ConfirmDialogRenderer';

interface RecordingListProps {
  /** Filter by status */
  statusFilter?: RecordingStatus | 'all';
  /** Maximum items to display */
  maxItems?: number;
  /** Show filter controls */
  showFilters?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Refresh callback */
  onRefresh?: () => void;
  /** Recording click callback */
  onRecordingClick?: (recording: OfflineRecording) => void;
  /** Delete callback */
  onDelete?: (id: number) => void;
  /** Retry callback */
  onRetry?: (id: number) => void;
  /** Additional className */
  className?: string;
}

/**
 * Status filter pills
 */
const STATUS_FILTERS: { value: RecordingStatus | 'all'; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: FileAudio },
  { value: 'pending', label: 'Pending', icon: WifiOff },
  { value: 'synced', label: 'Synced', icon: CheckCircle },
  { value: 'failed', label: 'Failed', icon: AlertCircle },
];

export function RecordingList({
  statusFilter: initialFilter = 'all',
  maxItems,
  showFilters = true,
  emptyMessage = 'No recordings yet',
  onRefresh,
  onRecordingClick,
  onDelete,
  onRetry,
  className,
}: RecordingListProps) {
  const [recordings, setRecordings] = useState<OfflineRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<RecordingStatus | 'all'>(initialFilter);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const { confirm, confirmDialogState, handleConfirm, handleCancel } = useConfirmDialog();

  // Load recordings
  const loadRecordings = async () => {
    setIsLoading(true);
    try {
      const data = await listQueued();
      setRecordings(data);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, []);

  // Filter recordings
  const filteredRecordings = recordings
    .filter((rec) => filter === 'all' || rec.status === filter)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, maxItems);

  // Count by status
  const counts = recordings.reduce(
    (acc, rec) => {
      acc[rec.status] = (acc[rec.status] || 0) + 1;
      acc.all += 1;
      return acc;
    },
    { all: 0, pending: 0, syncing: 0, synced: 0, failed: 0 } as Record<string, number>
  );

  const handleRefresh = async () => {
    await loadRecordings();
    onRefresh?.();
  };

  const handlePlay = (recording: OfflineRecording) => {
    if (playingId === recording.id) {
      setPlayingId(null);
    } else {
      setPlayingId(recording.id ?? null);
      onRecordingClick?.(recording);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Delete recording?',
      description: 'The audio file and its transcript will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (ok) {
      onDelete?.(id);
      setRecordings((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <ConfirmDialogRenderer
        {...confirmDialogState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FileAudio className="w-5 h-5 text-primary" />
          Recordings
          <span className="text-muted-foreground font-normal">
            ({counts.all})
          </span>
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin motion-reduce:animate-none')} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STATUS_FILTERS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                'transition-all duration-200',
                'whitespace-nowrap',
                filter === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {counts[value] > 0 && (
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 rounded-full text-xs',
                  filter === value
                    ? 'bg-primary-foreground/20'
                    : 'bg-background'
                )}>
                  {counts[value]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Recording List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={`skeleton-${i}`} variant="glass" className="p-4 animate-pulse motion-reduce:animate-none">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </div>
                </div>
              </Card>
            ))
          ) : filteredRecordings.length === 0 ? (
            // Empty state
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileAudio className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{emptyMessage}</p>
            </motion.div>
          ) : (
            // Recording cards
            filteredRecordings.map((recording) => (
              <RecordingCard
                key={recording.id}
                id={recording.id!}
                fileName={recording.fileName}
                duration={recording.duration}
                size={recording.blob?.size}
                status={recording.status}
                createdAt={recording.createdAt}
                caseReference={recording.case_reference}
                error={recording.error}
                isPlaying={playingId === recording.id}
                onPlay={() => handlePlay(recording)}
                onDelete={() => handleDelete(recording.id!)}
                onRetry={recording.status === 'failed' ? () => onRetry?.(recording.id!) : undefined}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Bulk actions */}
      {counts.pending > 0 && (
        <Card className="p-4 bg-warning/10 border-warning/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-warning" />
              <div>
                <p className="font-medium text-warning">
                  {counts.pending} recording{counts.pending > 1 ? 's' : ''} pending sync
                </p>
                <p className="text-sm text-muted-foreground">
                  Will upload when online
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Sync Now
            </Button>
          </div>
        </Card>
      )}

      {counts.failed > 0 && (
        <Card className="p-4 bg-destructive/10 border-destructive/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  {counts.failed} recording{counts.failed > 1 ? 's' : ''} failed to sync
                </p>
                <p className="text-sm text-muted-foreground">
                  Tap to retry or delete
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Clear Failed
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default RecordingList;
