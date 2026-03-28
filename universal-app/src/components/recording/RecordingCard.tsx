'use client';

/**
 * Recording Card
 *
 * Displays a saved recording with metadata and actions.
 *
 * @module components/recording/RecordingCard
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Trash2, 
  Upload, 
  Clock, 
  FileAudio, 
  WifiOff,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RecordingStatus } from '@/lib/storage-adapter';

interface RecordingCardProps {
  /** Recording ID */
  id: number;
  /** File name */
  fileName: string;
  /** Duration in seconds */
  duration?: number;
  /** File size in bytes */
  size?: number;
  /** Recording status */
  status: RecordingStatus;
  /** Created timestamp */
  createdAt: Date;
  /** Case reference */
  caseReference?: string;
  /** Error message if failed */
  error?: string;
  /** Play callback */
  onPlay?: () => void;
  /** Delete callback */
  onDelete?: () => void;
  /** Retry sync callback */
  onRetry?: () => void;
  /** Whether currently playing */
  isPlaying?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format duration for display
 */
function formatDuration(seconds?: number): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: RecordingStatus }) {
  const config = {
    pending: {
      icon: WifiOff,
      label: 'Pending sync',
      className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    syncing: {
      icon: Loader2,
      label: 'Syncing...',
      className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      animateIcon: true,
    },
    synced: {
      icon: CheckCircle,
      label: 'Synced',
      className: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    failed: {
      icon: AlertCircle,
      label: 'Failed',
      className: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
  };

  const statusConfig = config[status] || config.pending;
  const { icon: Icon, label, className } = statusConfig;
  const animateIcon = 'animateIcon' in statusConfig ? statusConfig.animateIcon : false;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
      className
    )}>
      <Icon className={cn('w-3 h-3', animateIcon && 'animate-spin')} />
      {label}
    </span>
  );
}

export function RecordingCard({
  id,
  fileName,
  duration,
  size,
  status,
  createdAt,
  caseReference,
  error,
  onPlay,
  onDelete,
  onRetry,
  isPlaying = false,
  className,
}: RecordingCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card 
        variant="glass" 
        className={cn('p-4', className)}
        hoverEffect={false}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
            status === 'synced' ? 'bg-green-500/20' :
            status === 'failed' ? 'bg-red-500/20' :
            'bg-primary/20'
          )}>
            <FileAudio className={cn(
              'w-6 h-6',
              status === 'synced' ? 'text-green-500' :
              status === 'failed' ? 'text-red-500' :
              'text-primary'
            )} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">
                {caseReference || fileName}
              </h4>
              <StatusBadge status={status} />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(duration)}
              </span>
              <span>{formatFileSize(size)}</span>
              <span>{formatDate(createdAt)}</span>
            </div>
            {error && (
              <p className="text-xs text-red-500 mt-1 truncate">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Play button */}
            {onPlay && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPlay}
                className="w-9 h-9"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            )}

            {/* Retry button for failed */}
            {status === 'failed' && onRetry && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRetry}
                className="w-9 h-9 text-amber-500 hover:text-amber-600"
              >
                <Upload className="w-4 h-4" />
              </Button>
            )}

            {/* Delete button */}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="w-9 h-9 text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default RecordingCard;
