'use client';

import React, { useState } from 'react';
import { Minute, MinuteVersion } from '@/lib/minutes/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  History, 
  ChevronRight,
  User,
  Clock,
  RotateCcw,
  Eye
} from 'lucide-react';

interface MinuteVersionHistoryProps {
  minute: Minute;
  onRestoreVersion?: (version: MinuteVersion) => void;
  onPreviewVersion?: (version: MinuteVersion) => void;
  className?: string;
}

export function MinuteVersionHistory({ 
  minute, 
  onRestoreVersion,
  onPreviewVersion,
  className 
}: MinuteVersionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const versions = minute.versions || [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  if (versions.length === 0) {
    return null;
  }

  return (
    <Card variant="glass" className={cn('overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <History className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Version History
          </span>
          <span className="text-xs text-slate-400">
            ({versions.length} versions)
          </span>
        </div>
        <ChevronRight className={cn(
          'w-4 h-4 text-slate-400 transition-transform',
          isExpanded && 'rotate-90'
        )} />
      </button>

      {/* Version List */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          {versions.map((version, index) => (
            <div 
              key={version.id}
              className={cn(
                'flex items-start gap-3 p-4',
                index < versions.length - 1 && 'border-b border-slate-100 dark:border-slate-800'
              )}
            >
              {/* Version Number */}
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                index === 0 
                  ? 'bg-[var(--primary-soft)] text-[var(--primary)]' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              )}>
                v{version.version}
              </div>

              {/* Version Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {version.changes}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {version.createdBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(version.createdAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {onPreviewVersion && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => onPreviewVersion(version)}
                    title="Preview this version"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                {onRestoreVersion && index > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => onRestoreVersion(version)}
                    title="Restore this version"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
