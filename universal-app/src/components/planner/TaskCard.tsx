'use client';

/**
 * Task Card Component
 * 
 * Displays a linked Planner task with sync status and quick actions.
 * 
 * @module components/planner/TaskCard
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LinkedPlannerTask, PlannerTask } from '@/lib/planner';

// ============================================================================
// Types
// ============================================================================

export interface TaskCardProps {
  /** Linked task data */
  linkedTask: LinkedPlannerTask;
  /** Full Planner task data (optional, for display) */
  plannerTask?: PlannerTask;
  /** Called when user clicks to view in Planner */
  onOpenInPlanner?: () => void;
  /** Called when user clicks to refresh sync */
  onRefresh?: () => void;
  /** Called when user clicks to unlink */
  onUnlink?: () => void;
  /** Whether refresh is in progress */
  isRefreshing?: boolean;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getPriorityLabel(priority: number): { label: string; color: string } {
  if (priority <= 2) return { label: 'Urgent', color: 'bg-destructive/10 text-destructive' };
  if (priority <= 5) return { label: 'Important', color: 'bg-warning/10 text-warning' };
  if (priority <= 7) return { label: 'Medium', color: 'bg-warning/10 text-warning' };
  return { label: 'Low', color: 'bg-muted text-muted-foreground' };
}

function getStatusConfig(status: LinkedPlannerTask['syncStatus']): {
  icon: React.ReactNode;
  label: string;
  color: string;
} {
  switch (status) {
    case 'synced':
      return {
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
        label: 'Synced',
        color: 'text-success',
      };
    case 'pending':
      return {
        icon: (
          <svg className="w-4 h-4 animate-pulse motion-reduce:animate-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        label: 'Pending',
        color: 'text-warning',
      };
    case 'error':
      return {
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        label: 'Error',
        color: 'text-destructive',
      };
    case 'conflict':
      return {
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        label: 'Conflict',
        color: 'text-orange-600 dark:text-orange-400',
      };
    default:
      return {
        icon: null,
        label: 'Unknown',
        color: 'text-gray-600 dark:text-gray-400',
      };
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function TaskCard({
  linkedTask,
  plannerTask,
  onOpenInPlanner,
  onRefresh,
  onUnlink,
  isRefreshing,
  className,
}: TaskCardProps) {
  const [showActions, setShowActions] = useState(false);
  
  const task = plannerTask ?? linkedTask.taskSnapshot;
  const statusConfig = getStatusConfig(linkedTask.syncStatus);
  const priority = task?.priority ?? 5;
  const priorityConfig = getPriorityLabel(priority);
  const isCompleted = (task?.percentComplete ?? 0) === 100;

  const handleOpenInPlanner = useCallback(() => {
    if (onOpenInPlanner) {
      onOpenInPlanner();
    } else {
      // Default: open Planner web app
      window.open(
        `https://tasks.office.com/planid/${linkedTask.planId}/task/${linkedTask.plannerTaskId}`,
        '_blank'
      );
    }
  }, [onOpenInPlanner, linkedTask.planId, linkedTask.plannerTaskId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative p-4 rounded-lg border
        bg-white dark:bg-gray-900
        border-gray-200 dark:border-gray-700
        hover:border-primary
        transition-all duration-200
        ${className}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Completion Checkbox (visual only) */}
          <div className={`
            mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
            ${isCompleted 
              ? 'bg-success border-success' 
              : 'border-gray-300 dark:border-gray-600'
            }
          `}>
            {isCompleted && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <h4 className={`
              text-sm font-medium truncate
              ${isCompleted 
                ? 'line-through text-gray-500 dark:text-gray-500' 
                : 'text-gray-900 dark:text-white'
              }
            `}>
              {task?.title ?? 'Untitled Task'}
            </h4>

            {/* Meta Info */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {/* Priority Badge */}
              <span className={`text-xs px-1.5 py-0.5 rounded ${priorityConfig.color}`}>
                {priorityConfig.label}
              </span>

              {/* Due Date */}
              {task?.dueDateTime && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(task.dueDateTime).toLocaleDateString()}
                </span>
              )}

              {/* Sync Status */}
              <span className={`text-xs flex items-center gap-1 ${statusConfig.color}`}>
                {statusConfig.icon}
                {statusConfig.label}
              </span>
            </div>

            {/* Last Synced */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Last synced {formatRelativeTime(linkedTask.lastSyncedAt)}
            </p>

            {/* Error Message */}
            {linkedTask.errorMessage && (
              <p className="text-xs text-destructive mt-1">
                {linkedTask.errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Planner Icon */}
        <button
          onClick={handleOpenInPlanner}
          className="
            flex-shrink-0 p-1.5 rounded-lg
            text-gray-400 hover:text-primary hover:bg-primary/10
            transition-colors
          "
          title="Open in Microsoft Planner"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </button>
      </div>

      {/* Action Buttons (shown on hover) */}
      <motion.div
        initial={false}
        animate={{ opacity: showActions ? 1 : 0, height: showActions ? 'auto' : 0 }}
        className="overflow-hidden"
      >
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              text-gray-600 hover:text-primary hover:bg-primary/10
              dark:text-gray-400 dark:hover:text-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            <svg 
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin motion-reduce:animate-none' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          <button
            onClick={handleOpenInPlanner}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              text-gray-600 hover:text-primary hover:bg-primary/10
              dark:text-gray-400 dark:hover:text-primary
              transition-colors
            "
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in Planner
          </button>

          <button
            onClick={onUnlink}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              text-gray-600 hover:text-destructive hover:bg-destructive/10
              dark:text-gray-400 dark:hover:text-destructive
              transition-colors ml-auto
            "
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            Unlink
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TaskCard;
