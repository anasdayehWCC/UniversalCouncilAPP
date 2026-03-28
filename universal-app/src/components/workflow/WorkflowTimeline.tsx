'use client';

/**
 * WorkflowTimeline Component
 * 
 * Visual representation of workflow history showing all actions
 * taken on a document with actor info, timestamps, and comments.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type WorkflowHistoryEntry,
  type WorkflowStep,
  WORKFLOW_STEP_CONFIG,
  WORKFLOW_ACTION_CONFIG,
} from '@/lib/workflow/types';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface WorkflowTimelineProps {
  history: WorkflowHistoryEntry[];
  currentStep: WorkflowStep;
  className?: string;
  compact?: boolean;
  maxItems?: number;
}

interface TimelineItemProps {
  entry: WorkflowHistoryEntry;
  isFirst: boolean;
  isLast: boolean;
  compact?: boolean;
}

// ============================================================================
// Icon Components (inline SVGs to avoid dependency issues)
// ============================================================================

const Icons = {
  FileEdit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Send: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  CheckCircle2: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  XCircle: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  AlertCircle: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ArrowUpCircle: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
    </svg>
  ),
  MessageSquare: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  RefreshCw: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Globe: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  UserPlus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  Undo: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
};

const getActionIcon = (iconName: string) => {
  const Icon = Icons[iconName as keyof typeof Icons];
  return Icon ? <Icon /> : <Icons.FileEdit />;
};

// ============================================================================
// Timeline Item Component
// ============================================================================

function TimelineItem({ entry, isFirst, isLast, compact }: TimelineItemProps) {
  const actionConfig = WORKFLOW_ACTION_CONFIG[entry.action];
  const toStepConfig = WORKFLOW_STEP_CONFIG[entry.toStep];
  const formattedDate = formatDate(entry.timestamp);
  const formattedTime = formatTime(entry.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn('relative flex gap-4', compact ? 'pb-3' : 'pb-6')}
    >
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200" />
      )}

      {/* Icon Node */}
      <div
        className={cn(
          'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white',
          toStepConfig.borderColor,
          toStepConfig.color
        )}
      >
        {getActionIcon(actionConfig.icon)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn('font-medium text-slate-900', compact && 'text-sm')}>
              {actionConfig.label}
            </p>
            <p className="text-sm text-slate-500">
              by <span className="font-medium">{entry.actor.name}</span>
              {entry.actor.role && (
                <span className="text-slate-400"> · {formatRole(entry.actor.role)}</span>
              )}
            </p>
          </div>
          <div className="text-right text-xs text-slate-400 whitespace-nowrap">
            <div>{formattedDate}</div>
            <div>{formattedTime}</div>
          </div>
        </div>

        {/* Comment */}
        {entry.comment && !compact && (
          <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{entry.comment}</p>
          </div>
        )}
        {entry.comment && compact && (
          <p className="mt-1 text-sm text-slate-500 truncate">{entry.comment}</p>
        )}

        {/* Metadata */}
        {entry.metadata && !compact && (
          <div className="mt-2 flex flex-wrap gap-2">
            {entry.metadata.assigneeName && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                <Icons.UserPlus />
                Assigned to {entry.metadata.assigneeName}
              </span>
            )}
            {entry.metadata.escalationReason && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full">
                <Icons.ArrowUpCircle />
                Escalated
              </span>
            )}
          </div>
        )}

        {/* Step Transition Badge */}
        {!compact && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span className={cn('px-2 py-0.5 rounded', WORKFLOW_STEP_CONFIG[entry.fromStep].bgColor)}>
              {WORKFLOW_STEP_CONFIG[entry.fromStep].label}
            </span>
            <span>→</span>
            <span className={cn('px-2 py-0.5 rounded', toStepConfig.bgColor, toStepConfig.color)}>
              {toStepConfig.label}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WorkflowTimeline({
  history,
  currentStep,
  className,
  compact = false,
  maxItems,
}: WorkflowTimelineProps) {
  // Sort history by timestamp (newest first for display)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Apply maxItems limit if specified
  const displayHistory = maxItems ? sortedHistory.slice(0, maxItems) : sortedHistory;
  const hasMore = maxItems && sortedHistory.length > maxItems;

  if (history.length === 0) {
    return (
      <div className={cn('p-4 text-center text-slate-500', className)}>
        <Icons.FileEdit />
        <p className="mt-2 text-sm">No workflow history yet</p>
      </div>
    );
  }

  return (
    <div className={cn('workflow-timeline', className)}>
      {/* Current Status Header */}
      <div className="mb-4 flex items-center gap-2">
        <div
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
            WORKFLOW_STEP_CONFIG[currentStep].bgColor,
            WORKFLOW_STEP_CONFIG[currentStep].color
          )}
        >
          {getActionIcon(WORKFLOW_STEP_CONFIG[currentStep].icon)}
          {WORKFLOW_STEP_CONFIG[currentStep].label}
        </div>
        <span className="text-sm text-slate-500">
          {history.length} action{history.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        <AnimatePresence mode="popLayout">
          {displayHistory.map((entry, index) => (
            <TimelineItem
              key={entry.id}
              entry={entry}
              isFirst={index === 0}
              isLast={index === displayHistory.length - 1 && !hasMore}
              compact={compact}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Show More */}
      {hasMore && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-sm text-slate-500 text-center">
            + {sortedHistory.length - maxItems} more actions
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRole(role: string): string {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default WorkflowTimeline;
