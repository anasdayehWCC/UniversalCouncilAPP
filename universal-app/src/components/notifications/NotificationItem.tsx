'use client';

/**
 * Notification Item Component
 * 
 * Displays a single notification with icon, content, actions,
 * and interactive elements like mark as read and delete.
 * 
 * @module components/notifications/NotificationItem
 */

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  UserPlus,
  AtSign,
  Clock,
  Bell,
  MessageSquare,
  Download,
  X,
  ExternalLink,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/lib/notifications/types';

// ============================================================================
// Types
// ============================================================================

interface NotificationItemProps {
  /** The notification to display */
  notification: Notification;
  /** Mark notification as read */
  onMarkAsRead?: (id: string) => void;
  /** Delete notification */
  onDelete?: (id: string) => void;
  /** Click handler for the notification */
  onClick?: (notification: Notification) => void;
  /** Whether to show the delete button */
  showDelete?: boolean;
  /** Whether this is a compact view */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Notification Icons
// ============================================================================

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  approval_needed: <AlertCircle className="h-5 w-5 text-amber-500" />,
  minute_approved: <CheckCircle className="h-5 w-5 text-green-500" />,
  minute_rejected: <AlertCircle className="h-5 w-5 text-red-500" />,
  assignment: <UserPlus className="h-5 w-5 text-blue-500" />,
  mention: <AtSign className="h-5 w-5 text-purple-500" />,
  reminder: <Clock className="h-5 w-5 text-orange-500" />,
  system: <Bell className="h-5 w-5 text-slate-500" />,
  comment: <MessageSquare className="h-5 w-5 text-teal-500" />,
  export_ready: <Download className="h-5 w-5 text-emerald-500" />,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  approval_needed: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
  minute_approved: 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20',
  minute_rejected: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20',
  assignment: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
  mention: 'border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20',
  reminder: 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20',
  system: 'border-l-slate-500 bg-slate-50/50 dark:bg-slate-950/20',
  comment: 'border-l-teal-500 bg-teal-50/50 dark:bg-teal-950/20',
  export_ready: 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20',
};

// ============================================================================
// Time Formatting
// ============================================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

// ============================================================================
// Component
// ============================================================================

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  showDelete = true,
  compact = false,
  className,
}: NotificationItemProps) {
  const handleClick = useCallback(() => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    onClick?.(notification);
  }, [notification, onMarkAsRead, onClick]);

  const handleMarkAsReadClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead?.(notification.id);
  }, [notification.id, onMarkAsRead]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(notification.id);
  }, [notification.id, onDelete]);

  const handleActionClick = useCallback((e: React.MouseEvent, url?: string) => {
    e.stopPropagation();
    if (url) {
      // Mark as read when clicking action
      if (!notification.read && onMarkAsRead) {
        onMarkAsRead(notification.id);
      }
      window.location.href = url;
    }
  }, [notification, onMarkAsRead]);

  const icon = NOTIFICATION_ICONS[notification.type] || <Bell className="h-5 w-5" />;
  const colorClass = notification.read
    ? 'border-l-transparent bg-transparent'
    : NOTIFICATION_COLORS[notification.type] || 'border-l-slate-500';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative flex gap-3 rounded-lg border-l-4 p-3 transition-all cursor-pointer',
        'hover:bg-slate-100 dark:hover:bg-slate-800',
        colorClass,
        notification.read && 'opacity-70',
        compact && 'p-2 gap-2',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${notification.read ? 'Read' : 'Unread'} notification: ${notification.title}`}
    >
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 mt-0.5',
        compact && 'mt-0'
      )}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn(
            'font-medium text-slate-900 dark:text-slate-100 line-clamp-1',
            compact ? 'text-sm' : 'text-base',
            !notification.read && 'font-semibold'
          )}>
            {notification.title}
          </h4>
          <span className={cn(
            'flex-shrink-0 text-slate-500 dark:text-slate-400',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        {!compact && (
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
            {notification.body}
          </p>
        )}

        {/* Actor info */}
        {notification.data?.actorName && !compact && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            By {notification.data.actorName}
          </p>
        )}

        {/* Actions */}
        {notification.actions && notification.actions.length > 0 && !compact && (
          <div className="flex flex-wrap gap-2 pt-1">
            {notification.actions.map((action) => (
              <button
                key={action.id}
                onClick={(e) => handleActionClick(e, action.url)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                  action.type === 'primary' && 'bg-[var(--accent)] text-white hover:opacity-90',
                  action.type === 'secondary' && 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200',
                  action.type === 'destructive' && 'bg-red-100 text-red-700 hover:bg-red-200'
                )}
              >
                {action.label}
                <ExternalLink className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons (shown on hover) */}
      <div className={cn(
        'absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
        'bg-white/90 dark:bg-slate-800/90 rounded-md p-0.5 backdrop-blur-sm',
      )}>
        {!notification.read && onMarkAsRead && (
          <button
            onClick={handleMarkAsReadClick}
            className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Mark as read"
            aria-label="Mark as read"
          >
            <Check className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
          </button>
        )}
        {showDelete && notification.dismissible && onDelete && (
          <button
            onClick={handleDeleteClick}
            className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            title="Delete notification"
            aria-label="Delete notification"
          >
            <X className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 hover:text-red-500" />
          </button>
        )}
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rounded-full bg-[var(--accent)]"
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
}

export default NotificationItem;
