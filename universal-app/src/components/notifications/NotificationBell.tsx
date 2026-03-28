'use client';

/**
 * Notification Bell Component
 * 
 * Header bell icon with unread count badge and dropdown preview.
 * 
 * @module components/notifications/NotificationBell
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Settings, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationContext } from '@/providers/NotificationProvider';
import { NotificationItem } from './NotificationItem';
import type { Notification } from '@/lib/notifications/types';

// ============================================================================
// Types
// ============================================================================

interface NotificationBellProps {
  /** Show dropdown preview on hover/click */
  showPreview?: boolean;
  /** Max notifications to show in preview */
  maxPreview?: number;
  /** Open full notification center */
  onOpenCenter?: () => void;
  /** Navigate to a URL */
  onNavigate?: (url: string) => void;
  /** Open notification preferences */
  onOpenPreferences?: () => void;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function NotificationBell({
  showPreview = true,
  maxPreview = 5,
  onOpenCenter,
  onNavigate,
  onOpenPreferences,
  className,
}: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationContext();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isDropdownOpen]);

  const handleBellClick = useCallback(() => {
    if (showPreview) {
      setIsDropdownOpen(!isDropdownOpen);
    } else if (onOpenCenter) {
      onOpenCenter();
    }
  }, [showPreview, isDropdownOpen, onOpenCenter]);

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (notification.data?.url && onNavigate) {
      onNavigate(notification.data.url);
      setIsDropdownOpen(false);
    }
  }, [onNavigate]);

  const handleViewAll = useCallback(() => {
    setIsDropdownOpen(false);
    onOpenCenter?.();
  }, [onOpenCenter]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const previewNotifications = notifications.slice(0, maxPreview);
  const hasMore = notifications.length > maxPreview;

  return (
    <div className={cn('relative', className)}>
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={handleBellClick}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'hover:bg-slate-100 dark:hover:bg-slate-800',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2',
          isDropdownOpen && 'bg-slate-100 dark:bg-slate-800'
        )}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        
        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                'min-w-[18px] h-[18px] px-1 text-[10px] font-bold',
                'bg-[var(--accent)] text-white rounded-full',
                'ring-2 ring-white dark:ring-slate-900'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Preview */}
      {showPreview && (
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute right-0 mt-2 w-[360px] max-h-[480px]',
                'bg-white dark:bg-slate-900 rounded-xl shadow-xl',
                'border border-slate-200 dark:border-slate-700',
                'flex flex-col overflow-hidden z-50'
              )}
              role="menu"
              aria-orientation="vertical"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Notifications
                </h3>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Mark all as read"
                      aria-label="Mark all as read"
                    >
                      <CheckCheck className="h-4 w-4 text-slate-500" />
                    </button>
                  )}
                  {onOpenPreferences && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenPreferences();
                      }}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Settings"
                      aria-label="Notification settings"
                    >
                      <Settings className="h-4 w-4 text-slate-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto">
                {previewNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Bell className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {previewNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                        onClick={handleNotificationClick}
                        compact
                        showDelete={false}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {(hasMore || notifications.length > 0) && onOpenCenter && (
                <div className="border-t border-slate-200 dark:border-slate-700 p-2">
                  <button
                    onClick={handleViewAll}
                    className={cn(
                      'w-full py-2 text-sm font-medium text-center rounded-lg transition-colors',
                      'text-[var(--accent)] hover:bg-[var(--accent)]/10'
                    )}
                  >
                    {hasMore
                      ? `View all ${notifications.length} notifications`
                      : 'View all notifications'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export default NotificationBell;
