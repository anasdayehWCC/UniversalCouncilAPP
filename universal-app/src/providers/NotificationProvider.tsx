'use client';

/**
 * Notification Provider
 * 
 * Provides notification context with real-time updates, toast integration,
 * and centralized notification state management.
 * 
 * @module providers/NotificationProvider
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import type {
  Notification,
  NotificationPreferences,
  PushSupport,
  NotificationType,
  NotificationEvent,
} from '@/lib/notifications/types';
import {
  getPushSupport,
  requestPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  sendSubscriptionToBackend,
} from '@/lib/notifications/push';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/notifications/preferences';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/hooks/useAuth';

// ============================================================================
// Types
// ============================================================================

interface NotificationContextValue {
  /** All notifications */
  notifications: Notification[];
  /** Unread notification count */
  unreadCount: number;
  /** Whether currently loading */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Push notification support status */
  pushSupport: PushSupport | null;
  /** User's notification preferences */
  preferences: NotificationPreferences | null;
  /** Whether push notifications are enabled */
  pushEnabled: boolean;
  /** Whether the notification panel is open */
  isPanelOpen: boolean;

  // Actions
  /** Open the notification panel */
  openPanel: () => void;
  /** Close the notification panel */
  closePanel: () => void;
  /** Toggle the notification panel */
  togglePanel: () => void;
  /** Refresh notifications */
  refreshNotifications: () => Promise<void>;
  /** Mark a notification as read */
  markAsRead: (id: string) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Delete a notification */
  deleteNotification: (id: string) => Promise<void>;
  /** Clear all notifications */
  clearAll: () => Promise<void>;
  /** Request push permission */
  requestPermission: () => Promise<boolean>;
  /** Enable push notifications */
  enablePush: () => Promise<boolean>;
  /** Disable push notifications */
  disablePush: () => Promise<boolean>;
  /** Update notification preferences */
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  /** Add a local notification (for testing/demo) */
  addLocalNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// ============================================================================
// Demo Notifications
// ============================================================================

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'demo-1',
    type: 'approval_needed',
    title: 'Minute Awaiting Approval',
    body: 'A new care plan minute for Case #2024-1234 requires your review.',
    data: { entityId: 'minute-123', entityType: 'minute', url: '/minutes/minute-123' },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    priority: 'high',
    dismissible: true,
  },
  {
    id: 'demo-2',
    type: 'assignment',
    title: 'New Case Assignment',
    body: 'You have been assigned to Case #2024-5678.',
    data: { entityId: 'case-5678', entityType: 'case', url: '/cases/case-5678' },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    priority: 'normal',
    dismissible: true,
  },
  {
    id: 'demo-3',
    type: 'minute_approved',
    title: 'Minute Approved',
    body: 'Your care visit minute has been approved.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    priority: 'normal',
    dismissible: true,
  },
];

// ============================================================================
// Provider Component
// ============================================================================

interface NotificationProviderProps {
  children: ReactNode;
  /** Use demo mode (no API calls) */
  demoMode?: boolean;
  /** Polling interval in ms (default: 30000) */
  pollInterval?: number;
  /** Enable toast notifications for new items */
  toastOnNew?: boolean;
}

export function NotificationProvider({
  children,
  demoMode = false,
  pollInterval = 30000,
  toastOnNew = true,
}: NotificationProviderProps) {
  const { accessToken, isAuthenticated } = useAuth();
  const toast = useToast();

  // State
  const [notifications, setNotifications] = useState<Notification[]>(
    demoMode ? DEMO_NOTIFICATIONS : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pushSupport, setPushSupport] = useState<PushSupport | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Computed values
  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  // ============================================================================
  // Panel Controls
  // ============================================================================

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);
  const togglePanel = useCallback(() => setIsPanelOpen(prev => !prev), []);

  // ============================================================================
  // Notification Fetching
  // ============================================================================

  const refreshNotifications = useCallback(async () => {
    if (demoMode) {
      setNotifications(DEMO_NOTIFICATIONS);
      return;
    }

    if (!isAuthenticated || !accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications?limit=50', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const newNotifications: Notification[] = data.notifications || [];

      // Show toast for newly arrived notifications
      if (toastOnNew && notifications.length > 0) {
        const existingIds = new Set(notifications.map(n => n.id));
        const newItems = newNotifications.filter(n => !existingIds.has(n.id) && !n.read);
        
        newItems.forEach((n) => {
          const toastType = n.type === 'minute_rejected' ? 'warning' 
            : n.priority === 'urgent' ? 'error' 
            : 'info';
          toast[toastType](n.title, n.body);
        });
      }

      setNotifications(newNotifications);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch notifications');
      setError(error);
      console.error('[NotificationProvider] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isAuthenticated, demoMode, notifications, toastOnNew, toast]);

  // ============================================================================
  // Notification Actions
  // ============================================================================

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
    );

    if (demoMode || !isAuthenticated || !accessToken) return;

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.error('[NotificationProvider] Mark as read error:', err);
      refreshNotifications();
    }
  }, [accessToken, isAuthenticated, demoMode, refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: now })));

    if (demoMode || !isAuthenticated || !accessToken) return;

    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.error('[NotificationProvider] Mark all as read error:', err);
      refreshNotifications();
    }
  }, [accessToken, isAuthenticated, demoMode, refreshNotifications]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    if (demoMode || !isAuthenticated || !accessToken) return;

    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.error('[NotificationProvider] Delete error:', err);
      refreshNotifications();
    }
  }, [accessToken, isAuthenticated, demoMode, refreshNotifications]);

  const clearAll = useCallback(async () => {
    setNotifications([]);

    if (demoMode || !isAuthenticated || !accessToken) return;

    try {
      await fetch('/api/notifications/clear', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.error('[NotificationProvider] Clear all error:', err);
      refreshNotifications();
    }
  }, [accessToken, isAuthenticated, demoMode, refreshNotifications]);

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
      if (!subscription) return false;

      if (isAuthenticated && accessToken) {
        await sendSubscriptionToBackend(subscription, accessToken);
      }

      setPushEnabled(true);
      await refreshPushSupport();
      toast.success('Push notifications enabled');
      return true;
    } catch (err) {
      console.error('[NotificationProvider] Enable push error:', err);
      toast.error('Failed to enable push notifications');
      return false;
    }
  }, [accessToken, isAuthenticated, refreshPushSupport, toast]);

  const disablePush = useCallback(async (): Promise<boolean> => {
    try {
      const success = await unsubscribeFromPush();
      setPushEnabled(!success);
      await refreshPushSupport();
      if (success) {
        toast.info('Push notifications disabled');
      }
      return success;
    } catch (err) {
      console.error('[NotificationProvider] Disable push error:', err);
      return false;
    }
  }, [refreshPushSupport, toast]);

  // ============================================================================
  // Preferences
  // ============================================================================

  const refreshPreferences = useCallback(async () => {
    try {
      const prefs = await getNotificationPreferences(accessToken ?? undefined);
      setPreferences(prefs);
    } catch (err) {
      console.error('[NotificationProvider] Get preferences error:', err);
    }
  }, [accessToken]);

  const updatePreferencesHandler = useCallback(async (updates: Partial<NotificationPreferences>) => {
    try {
      const updated = await updateNotificationPreferences(updates, accessToken ?? undefined);
      setPreferences(updated);
    } catch (err) {
      console.error('[NotificationProvider] Update preferences error:', err);
      throw err;
    }
  }, [accessToken]);

  // ============================================================================
  // Local Notification (for testing/demo)
  // ============================================================================

  const addLocalNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);

    if (toastOnNew) {
      const toastType = notification.type === 'minute_rejected' ? 'warning'
        : notification.priority === 'urgent' ? 'error'
        : 'info';
      toast[toastType](notification.title, notification.body);
    }
  }, [toastOnNew, toast]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Initial setup
  useEffect(() => {
    refreshPushSupport();
    refreshPreferences();
    refreshNotifications();
  }, [refreshPushSupport, refreshPreferences, refreshNotifications]);

  // Polling for updates
  useEffect(() => {
    if (demoMode) return;

    const interval = setInterval(() => {
      refreshNotifications();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, refreshNotifications, demoMode]);

  // Listen for service worker messages
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as NotificationEvent | undefined;
      if (!data?.type) return;

      switch (data.type) {
        case 'notification:new':
          if (data.payload && 'id' in data.payload) {
            setNotifications(prev => [data.payload as Notification, ...prev]);
            const notification = data.payload as Notification;
            if (toastOnNew) {
              toast.info(notification.title, notification.body);
            }
          }
          break;
        case 'notification:read':
          if (data.payload && 'id' in data.payload) {
            const id = (data.payload as Notification).id;
            setNotifications(prev =>
              prev.map(n => (n.id === id ? { ...n, read: true } : n))
            );
          }
          break;
        case 'notification:deleted':
        case 'notification:cleared':
          refreshNotifications();
          break;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [refreshNotifications, toastOnNew, toast]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount,
    isLoading,
    error,
    pushSupport,
    preferences,
    pushEnabled,
    isPanelOpen,
    openPanel,
    closePanel,
    togglePanel,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    requestPermission,
    enablePush,
    disablePush,
    updatePreferences: updatePreferencesHandler,
    addLocalNotification,
  }), [
    notifications,
    unreadCount,
    isLoading,
    error,
    pushSupport,
    preferences,
    pushEnabled,
    isPanelOpen,
    openPanel,
    closePanel,
    togglePanel,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    requestPermission,
    enablePush,
    disablePush,
    updatePreferencesHandler,
    addLocalNotification,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Use notification context
 * Must be used within NotificationProvider
 */
export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}

export default NotificationProvider;
