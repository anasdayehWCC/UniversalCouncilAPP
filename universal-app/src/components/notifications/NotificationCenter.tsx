'use client';

/**
 * Notification Center Component
 * 
 * A slide-out panel displaying all notifications with filtering,
 * actions, and real-time updates.
 * 
 * @module components/notifications/NotificationCenter
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  Filter,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationContext } from '@/providers/NotificationProvider';
import { NotificationItem } from './NotificationItem';
import type { Notification, NotificationType } from '@/lib/notifications/types';

// ============================================================================
// Types
// ============================================================================

interface NotificationCenterProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Navigate to a URL */
  onNavigate?: (url: string) => void;
  /** Open notification preferences */
  onOpenPreferences?: () => void;
  /** Additional class names */
  className?: string;
}

type FilterOption = 'all' | 'unread' | NotificationType;

// ============================================================================
// Filter Options
// ============================================================================

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'approval_needed', label: 'Approvals' },
  { value: 'assignment', label: 'Assignments' },
  { value: 'mention', label: 'Mentions' },
  { value: 'reminder', label: 'Reminders' },
];

// ============================================================================
// Component
// ============================================================================

export function NotificationCenter({
  isOpen,
  onClose,
  onNavigate,
  onOpenPreferences,
  className,
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refreshNotifications,
  } = useNotificationContext();

  const [filter, setFilter] = useState<FilterOption>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: { label: string; notifications: Notification[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let currentGroup: Notification[] = [];
    let currentLabel = '';

    filteredNotifications.forEach((notification) => {
      const date = new Date(notification.createdAt);
      date.setHours(0, 0, 0, 0);

      let label: string;
      if (date.getTime() === today.getTime()) {
        label = 'Today';
      } else if (date.getTime() === yesterday.getTime()) {
        label = 'Yesterday';
      } else {
        label = date.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
      }

      if (label !== currentLabel) {
        if (currentGroup.length > 0) {
          groups.push({ label: currentLabel, notifications: currentGroup });
        }
        currentLabel = label;
        currentGroup = [notification];
      } else {
        currentGroup.push(notification);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ label: currentLabel, notifications: currentGroup });
    }

    return groups;
  }, [filteredNotifications]);

  // Handlers
  const handleNotificationClick = useCallback((notification: Notification) => {
    if (notification.data?.url && onNavigate) {
      onNavigate(notification.data.url);
      onClose();
    }
  }, [onNavigate, onClose]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleClearAll = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      await clearAll();
    }
  }, [clearAll]);

  const handleRefresh = useCallback(async () => {
    await refreshNotifications();
  }, [refreshNotifications]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white dark:bg-slate-900',
              'shadow-2xl z-50 flex flex-col',
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Notification Center"
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-[var(--accent)]" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-[var(--accent)] text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* Actions Bar */}
              <div className="flex items-center justify-between px-4 pb-3">
                {/* Filter */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors',
                      'hover:bg-slate-100 dark:hover:bg-slate-800',
                      filter !== 'all' && 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    )}
                  >
                    <Filter className="h-4 w-4" />
                    {FILTER_OPTIONS.find(opt => opt.value === filter)?.label || 'All'}
                  </button>

                  <AnimatePresence>
                    {showFilterMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10"
                      >
                        {FILTER_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setFilter(option.value);
                              setShowFilterMenu(false);
                            }}
                            className={cn(
                              'w-full px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-700',
                              'first:rounded-t-lg last:rounded-b-lg',
                              filter === option.value && 'text-[var(--accent)] font-medium'
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    title="Refresh"
                    aria-label="Refresh notifications"
                  >
                    <RefreshCw className={cn('h-4 w-4 text-slate-500', isLoading && 'animate-spin')} />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Mark all as read"
                      aria-label="Mark all as read"
                    >
                      <CheckCheck className="h-4 w-4 text-slate-500" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      title="Clear all"
                      aria-label="Clear all notifications"
                    >
                      <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-500" />
                    </button>
                  )}
                  {onOpenPreferences && (
                    <button
                      onClick={onOpenPreferences}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Settings"
                      aria-label="Notification settings"
                    >
                      <Settings className="h-4 w-4 text-slate-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Inbox className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {filter === 'all' ? 'No notifications' : 'No notifications found'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {filter === 'all'
                      ? "You're all caught up!"
                      : `No ${FILTER_OPTIONS.find(opt => opt.value === filter)?.label.toLowerCase()} notifications`}
                  </p>
                  {filter !== 'all' && (
                    <button
                      onClick={() => setFilter('all')}
                      className="mt-4 text-sm text-[var(--accent)] hover:underline"
                    >
                      View all notifications
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-2">
                  <AnimatePresence mode="popLayout">
                    {groupedNotifications.map((group) => (
                      <div key={group.label} className="mb-4">
                        <h3 className="px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {group.label}
                        </h3>
                        <div className="space-y-1">
                          {group.notifications.map((notification) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              onMarkAsRead={markAsRead}
                              onDelete={deleteNotification}
                              onClick={handleNotificationClick}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {onOpenPreferences && (
              <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 p-3">
                <button
                  onClick={onOpenPreferences}
                  className="w-full py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-[var(--accent)] transition-colors"
                >
                  Manage notification preferences
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NotificationCenter;
