/**
 * Notifications Module
 * 
 * Re-exports all notification-related types and functions.
 * 
 * @module lib/notifications
 */

// Types
export type {
  NotificationType,
  NotificationPriority,
  NotificationData,
  NotificationAction,
  Notification,
  QuietHours,
  ChannelSettings,
  NotificationCategoryPreferences,
  NotificationPreferences,
  PushKeys,
  PushSubscription,
  PushPermissionState,
  PushSupport,
  NotificationsResponse,
  NotificationActionResult,
  NotificationEventType,
  NotificationEvent,
} from './types';

export {
  DEFAULT_CHANNEL_SETTINGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './types';

// Push notification functions
export {
  isPushSupported,
  getPushPermission,
  requestPushPermission,
  getCurrentSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSupport,
  sendTestNotification,
  sendSubscriptionToBackend,
  removeSubscriptionFromBackend,
} from './push';

// Preferences functions
export {
  getNotificationPreferences,
  updateNotificationPreferences,
  getCategorySettings,
  updateCategorySettings,
  toggleCategoryChannel,
  enableCategory,
  disableCategory,
  getQuietHours,
  updateQuietHours,
  toggleQuietHours,
  isQuietHoursActive,
  toggleGlobalNotifications,
  toggleSound,
  toggleVibration,
  toggleBadge,
  resetPreferences,
  clearPreferencesCache,
  shouldDeliverNotification,
} from './preferences';
