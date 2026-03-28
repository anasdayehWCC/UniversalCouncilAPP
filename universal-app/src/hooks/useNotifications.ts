'use client';

/**
 * useNotifications Hook
 * 
 * Provides notification functionality including loading notifications,
 * marking as read, requesting permissions, and subscribing to updates.
 * 
 * @module hooks/useNotifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Notification,
  NotificationsResponse,
  NotificationPreferences,
  PushSupport,
  NotificationType,
} from '@/lib/notifications/types';
import {
  getPushSupport,
  requestPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  sendSubscriptionToBackend,
  removeSubscriptionFromBackend,
} from '@/lib/notifications/push';
import { getNotificationPreferences } from '@/lib/notifications/preferences';
import { useAuth } from './useAuth';

// ============================================================================
// Types
// ============================================================================

export interface NotificationFilters {
  /** Filter by notification types */
  types?: NotificationType[];
  /** Filter by read status */
  read?: boolean;
  /** Maximum number to fetch */
  limit?: number;
  /** Cursor for pagination */
  cursor?: string;
}

export interface UseNotificationsState {
  /** List of notifications */
  notifications: Notification[];
  /** Number of unread notifications */
  unreadCount: number;
  /** Total notification count */
  totalCount: number;
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether there are more notifications to load */
  hasMore: boolean;
  /** Error if any */
  error: Error | null;
  /** Push notification support status */
  pushSupport: PushSupport | null;
  /** User's notification preferences */
  preferences: NotificationPreferences | null;
  /** Whether push is currently enabled */
  pushEnabled: boolean;
}

export interface UseNotificationsActions {
  /** Fetch/refresh notifications */
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  /** Load more notifications (pagination) */
  loadMore: () => Promise<void>;
  /** Mark a notification as read */
  markAsRead: (id: string) => Promise<void>;
  /** Mark multiple notifications as read */
  markMultipleAsRead: (ids: string[]) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Delete a notification */
  deleteNotification: (id: string) => Promise<void>;
  /** Clear all notifications */
  clearAll: () => Promise<void>;
  /** Request push notification permission */
  requestPermission: () => Promise<boolean>;
  /** Enable push notifications */
  enablePush: () => Promise<boolean>;
  /** Disable push notifications */
  disablePush: () => Promise<boolean>;
  /** Refresh push support status */
  refreshPushSupport: () => Promise<void>;
  /** Refresh preferences */
  refreshPreferences: () => Promise<void>;
}

export type UseNotificationsReturn = UseNotificationsState & UseNotificationsActions;

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_LIMIT = 20;
const POLL_INTERVAL = 30000; // 30 seconds

// ============================================================================
// Demo Data
// ============================================================================

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'demo-1',
    type: 'approval_needed',
    title: 'Minute Awaiting Approval',
    body: 'A new care plan minute for Case #2024-1234 requires your review and approval.',
    data: {
      entityId: 'minute-123',
      entityType: 'minute',
      url: '/minutes/minute-123',
      actorName: 'Sarah Johnson',
    },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    priority: 'high',
    dismissible: true,
    actions: [
      { id: 'approve', label: 'Review', type: 'primary', url: '/minutes/minute-123' },
    ],
  },
  {
    id: 'demo-2',
    type: 'assignment',
    title: 'New Case Assignment',
    body: 'You have been assigned to Case #2024-5678 - Family Assessment.',
    data: {
      entityId: 'case-5678',
      entityType: 'case',
      url: '/cases/case-5678',
      actorName: 'Team Manager',
    },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    priority: 'normal',
    dismissible: true,
  },
  {
    id: 'demo-3',
    type: 'minute_approved',
    title: 'Minute Approved',
    body: 'Your care visit minute for Case #2024-0001 has been approved.',
    data: {
      entityId: 'minute-456',
      entityType: 'minute',
      url: '/minutes/minute-456',
      actorName: 'Manager Smith',
    },
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    priority: 'normal',
    dismissible: true,
  },
  {
    id: 'demo-4',
    type: 'reminder',
    title: 'Follow-up Reminder',
    body: 'Reminder: Follow-up visit for Case #2024-3456 is due tomorrow.',
    data: {
      entityId: 'case-3456',
      entityType: 'case',
      url: '/cases/case-3456',
    },
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    priority: 'normal',
    dismissible: true,
  },
  {
    id: 'demo-5',
    type: 'mention',
    title: 'You were mentioned',
    body: 'Alex Chen mentioned you in a comment on Case #2024-7890.',
    data: {
      entityId: 'comment-789',
      entityType: 'minute',
      url: '/minutes/minute-789#comments',
      actorName: 'Alex Chen',
    },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    priority: 'normal',
    dismissible: true,
  },
];

// ============================================================================
// Hook Implementation
// ============================================================================

export function useNotifications(options: {
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
  /** Whether to enable polling for updates */
  enablePolling?: boolean;
  /** Custom poll interval in milliseconds */
  pollInterval?: number;
  /** Use demo data instead of API */
  demoMode?: boolean;
} = {}): UseNotificationsReturn {
  const {
    autoFetch = true,
    enablePolling = true,
    pollInterval = POLL_INTERVAL,
    demoMode = false,
  } = options;

  const { accessToken, isAuthenticated } = useAuth();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const cursorRef = useRef<string | undefined>(undefined);

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pushSupport, setPushSupport] = useState<PushSupport | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);

  // ============================================================================
  // Fetch Functions
  // ============================================================================

  const fetchNotifications = useCallback(async (filters?: NotificationFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      if (demoMode || !isAuthenticated || !accessToken) {
        // Use demo data
        let filtered = [...DEMO_NOTIFICATIONS];
        
        if (filters?.types?.length) {
          filtered = filtered.filter(n => filters.types!.includes(n.type));
        }
        if (filters?.read !== undefined) {
          filtered = filtered.filter(n => n.read === filters.read);
        }

        setNotifications(filtered);
        setUnreadCount(filtered.filter(n => !n.read).length);
        setTotalCount(filtered.length);
        setHasMore(false);
        cursorRef.current = undefined;
        return;
      }

      const params = new URLSearchParams();
      if (filters?.types?.length) {
        params.set('types', filters.types.join(','));
      }
      if (filters?.read !== undefined) {
        params.set('read', String(filters.read));
      }
      if (filters?.limit) {
        params.set('limit', String(filters.limit));
      }
      if (filters?.cursor) {
        params.set('cursor', filters.cursor);
      }

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: NotificationsResponse = await response.json();
      
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setTotalCount(data.total);
      setHasMore(data.hasMore);
      cursorRef.current = data.nextCursor;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch notifications');
      setError(error);
      console.error('[Notifications] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isAuthenticated, demoMode]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !cursorRef.current) return;

    setIsLoading(true);
    
    try {
      if (demoMode || !isAuthenticated || !accessToken) {
        return; // Demo mode doesn't support pagination
      }

      const params = new URLSearchParams({
        cursor: cursorRef.current,
        limit: String(DEFAULT_LIMIT),
      });

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: NotificationsResponse = await response.json();
      
      setNotifications(prev => [...prev, ...data.notifications]);
      setHasMore(data.hasMore);
      cursorRef.current = data.nextCursor;
    } catch (err) {
      console.error('[Notifications] Load more error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, accessToken, isAuthenticated, demoMode]);

  // ============================================================================
  // Mark as Read
  // ============================================================================

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    if (demoMode || !isAuthenticated || !accessToken) return;

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      console.error('[Notifications] Mark as read error:', err);
      // Revert on error
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: false, readAt: undefined } : n))
      );
      setUnreadCount(prev => prev + 1);
    }
  }, [accessToken, isAuthenticated, demoMode]);

  const markMultipleAsRead = useCallback(async (ids: string[]) => {
    // Optimistic update
    const now = new Date().toISOString();
    setNotifications(prev =>
      prev.map(n => (ids.includes(n.id) ? { ...n, read: true, readAt: now } : n))
    );
    const unreadIds = notifications.filter(n => ids.includes(n.id) && !n.read).length;
    setUnreadCount(prev => Math.max(0, prev - unreadIds));

    if (demoMode || !isAuthenticated || !accessToken) return;

    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ids }),
      });
    } catch (err) {
      console.error('[Notifications] Mark multiple as read error:', err);
      // Refresh to get correct state
      fetchNotifications();
    }
  }, [accessToken, isAuthenticated, notifications, demoMode, fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: now })));
    setUnreadCount(0);

    if (demoMode || !isAuthenticated || !accessToken) return;

    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      console.error('[Notifications] Mark all as read error:', err);
      fetchNotifications();
    }
  }, [accessToken, isAuthenticated, demoMode, fetchNotifications]);

  // ============================================================================
  // Delete
  // ============================================================================

  const deleteNotification = useCallback(async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));
    setTotalCount(prev => Math.max(0, prev - 1));
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    if (demoMode || !isAuthenticated || !accessToken) return;

    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      console.error('[Notifications] Delete error:', err);
      fetchNotifications();
    }
  }, [accessToken, isAuthenticated, notifications, demoMode, fetchNotifications]);

  const clearAll = useCallback(async () => {
    // Optimistic update
    setNotifications([]);
    setUnreadCount(0);
    setTotalCount(0);

    if (demoMode || !isAuthenticated || !accessToken) return;

    try {
      await fetch('/api/notifications/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      console.error('[Notifications] Clear all error:', err);
      fetchNotifications();
    }
  }, [accessToken, isAuthenticated, demoMode, fetchNotifications]);

  // ============================================================================
  // Push Notification Management
  // ============================================================================

  const refreshPushSupport = useCallback(async () => {
    const support = await getPushSupport();
    setPushSupport(support);
    setPushEnabled(support.subscribed);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const result = await requestPushPermission();
    await refreshPushSupport();
    return result === 'granted';
  }, [refreshPushSupport]);

  const enablePush = useCallback(async (): Promise<boolean> => {
    try {
      const subscription = await subscribeToPush();
      if (!subscription) {
        console.error('[Notifications] Failed to subscribe to push');
        return false;
      }

      // Send to backend if authenticated
      if (isAuthenticated && accessToken) {
        await sendSubscriptionToBackend(subscription, accessToken);
      }

      setPushEnabled(true);
      await refreshPushSupport();
      return true;
    } catch (err) {
      console.error('[Notifications] Enable push error:', err);
      return false;
    }
  }, [accessToken, isAuthenticated, refreshPushSupport]);

  const disablePush = useCallback(async (): Promise<boolean> => {
    try {
      const success = await unsubscribeFromPush();
      
      // Remove from backend if authenticated
      if (isAuthenticated && accessToken && pushSupport?.subscription?.id) {
        await removeSubscriptionFromBackend(pushSupport.subscription.id, accessToken);
      }

      setPushEnabled(!success);
      await refreshPushSupport();
      return success;
    } catch (err) {
      console.error('[Notifications] Disable push error:', err);
      return false;
    }
  }, [accessToken, isAuthenticated, pushSupport, refreshPushSupport]);

  // ============================================================================
  // Preferences
  // ============================================================================

  const refreshPreferences = useCallback(async () => {
    try {
      const prefs = await getNotificationPreferences(accessToken ?? undefined);
      setPreferences(prefs);
    } catch (err) {
      console.error('[Notifications] Get preferences error:', err);
    }
  }, [accessToken]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications({ limit: DEFAULT_LIMIT });
      refreshPushSupport();
      refreshPreferences();
    }
  }, [autoFetch, fetchNotifications, refreshPushSupport, refreshPreferences]);

  // Polling
  useEffect(() => {
    if (!enablePolling) return;

    pollingRef.current = setInterval(() => {
      fetchNotifications({ limit: DEFAULT_LIMIT });
    }, pollInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enablePolling, pollInterval, fetchNotifications]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    hasMore,
    error,
    pushSupport,
    preferences,
    pushEnabled,
    // Actions
    fetchNotifications,
    loadMore,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    requestPermission,
    enablePush,
    disablePush,
    refreshPushSupport,
    refreshPreferences,
  };
}

export default useNotifications;
