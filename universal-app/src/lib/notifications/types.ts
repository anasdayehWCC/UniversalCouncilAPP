/**
 * Notification Types
 * 
 * Type definitions for the push notification system including
 * notification types, preferences, and push subscriptions.
 * 
 * @module lib/notifications/types
 */

// ============================================================================
// Notification Type Enum
// ============================================================================

/**
 * Types of notifications that can be sent to users
 */
export type NotificationType =
  | 'approval_needed'    // Minute requires approval
  | 'minute_approved'    // Minute was approved
  | 'minute_rejected'    // Minute was rejected with feedback
  | 'assignment'         // New case/minute assigned
  | 'mention'            // User was mentioned in a comment
  | 'reminder'           // Upcoming deadline or follow-up
  | 'system'             // System notifications (updates, maintenance)
  | 'comment'            // New comment on a minute
  | 'export_ready';      // Export completed and ready for download

/**
 * Priority levels for notifications
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// ============================================================================
// Core Notification Types
// ============================================================================

/**
 * Additional data payload for notifications
 */
export interface NotificationData {
  /** Related entity ID (minute, transcription, etc.) */
  entityId?: string;
  /** Entity type for routing */
  entityType?: 'minute' | 'transcription' | 'case' | 'export';
  /** URL to navigate to on click */
  url?: string;
  /** User who triggered the notification */
  actorId?: string;
  /** Actor's display name */
  actorName?: string;
  /** Actor's avatar URL */
  actorAvatar?: string;
  /** Preview text or excerpt */
  preview?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Action button for notifications
 */
export interface NotificationAction {
  /** Button identifier */
  id: string;
  /** Button label */
  label: string;
  /** Action type */
  type: 'primary' | 'secondary' | 'destructive';
  /** URL to navigate to on click */
  url?: string;
  /** API endpoint to call on click */
  apiEndpoint?: string;
}

/**
 * Individual notification object
 */
export interface Notification {
  /** Unique notification ID */
  id: string;
  /** Notification type category */
  type: NotificationType;
  /** Short title for the notification */
  title: string;
  /** Detailed notification message */
  body: string;
  /** Additional data payload */
  data?: NotificationData;
  /** Whether the notification has been read */
  read: boolean;
  /** Timestamp when notification was created */
  createdAt: string;
  /** Timestamp when notification was read (if read) */
  readAt?: string;
  /** Priority level */
  priority: NotificationPriority;
  /** Icon name or URL */
  icon?: string;
  /** Actions available for this notification */
  actions?: NotificationAction[];
  /** Whether the notification is dismissible */
  dismissible: boolean;
  /** Group identifier for collapsing similar notifications */
  groupId?: string;
}

// ============================================================================
// Notification Preferences
// ============================================================================

/**
 * Quiet hours configuration
 */
export interface QuietHours {
  /** Whether quiet hours are enabled */
  enabled: boolean;
  /** Start time (24-hour format, e.g., "22:00") */
  startTime: string;
  /** End time (24-hour format, e.g., "07:00") */
  endTime: string;
  /** Days of week (0 = Sunday, 6 = Saturday) */
  daysOfWeek: number[];
}

/**
 * Per-channel notification settings
 */
export interface ChannelSettings {
  /** Push notifications enabled */
  push: boolean;
  /** In-app notifications enabled */
  inApp: boolean;
  /** Email notifications enabled */
  email: boolean;
  /** SMS notifications enabled (if available) */
  sms: boolean;
}

/**
 * Category-specific notification preferences
 */
export interface NotificationCategoryPreferences {
  /** Approval-related notifications */
  approvals: ChannelSettings;
  /** Assignment notifications */
  assignments: ChannelSettings;
  /** Mention notifications */
  mentions: ChannelSettings;
  /** Reminder notifications */
  reminders: ChannelSettings;
  /** Comment notifications */
  comments: ChannelSettings;
  /** Export completion notifications */
  exports: ChannelSettings;
  /** System notifications */
  system: ChannelSettings;
}

/**
 * Complete user notification preferences
 */
export interface NotificationPreferences {
  /** User ID these preferences belong to */
  userId: string;
  /** Whether all notifications are enabled */
  globalEnabled: boolean;
  /** Quiet hours configuration */
  quietHours: QuietHours;
  /** Per-category preferences */
  categories: NotificationCategoryPreferences;
  /** Sound enabled for notifications */
  soundEnabled: boolean;
  /** Vibration enabled (mobile) */
  vibrationEnabled: boolean;
  /** Show notification badges */
  badgeEnabled: boolean;
  /** Notification grouping preference */
  groupNotifications: boolean;
  /** Auto-mark as read when viewed */
  autoMarkRead: boolean;
  /** Timestamp of last update */
  updatedAt: string;
}

// ============================================================================
// Push Subscription
// ============================================================================

/**
 * Web Push API subscription keys
 */
export interface PushKeys {
  /** Public key for encryption */
  p256dh: string;
  /** Authentication secret */
  auth: string;
}

/**
 * Push notification subscription
 */
export interface PushSubscription {
  /** Subscription ID */
  id: string;
  /** User ID this subscription belongs to */
  userId: string;
  /** Push endpoint URL */
  endpoint: string;
  /** Expiration time (if applicable) */
  expirationTime: number | null;
  /** Encryption keys */
  keys: PushKeys;
  /** Device/browser identifier */
  deviceId: string;
  /** User agent string */
  userAgent: string;
  /** Whether subscription is active */
  active: boolean;
  /** When subscription was created */
  createdAt: string;
  /** Last successful push delivery */
  lastUsedAt?: string;
}

// ============================================================================
// Push Permission
// ============================================================================

/**
 * Push notification permission state
 */
export type PushPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

/**
 * Push notification support status
 */
export interface PushSupport {
  /** Whether push notifications are supported */
  supported: boolean;
  /** Whether service worker is available */
  serviceWorkerAvailable: boolean;
  /** Current permission state */
  permission: PushPermissionState;
  /** Whether already subscribed */
  subscribed: boolean;
  /** Current subscription (if any) */
  subscription?: PushSubscription;
  /** Error message if not supported */
  errorMessage?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Paginated notifications response
 */
export interface NotificationsResponse {
  /** List of notifications */
  notifications: Notification[];
  /** Total count (for pagination) */
  total: number;
  /** Number of unread notifications */
  unreadCount: number;
  /** Next page cursor */
  nextCursor?: string;
  /** Whether there are more pages */
  hasMore: boolean;
}

/**
 * Notification action result
 */
export interface NotificationActionResult {
  /** Whether the action was successful */
  success: boolean;
  /** Updated notification (if applicable) */
  notification?: Notification;
  /** Error message (if failed) */
  error?: string;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Notification event types for real-time updates
 */
export type NotificationEventType =
  | 'notification:new'
  | 'notification:read'
  | 'notification:deleted'
  | 'notification:cleared'
  | 'subscription:created'
  | 'subscription:deleted';

/**
 * Real-time notification event
 */
export interface NotificationEvent {
  /** Event type */
  type: NotificationEventType;
  /** Event payload */
  payload: Notification | { ids: string[] } | null;
  /** Event timestamp */
  timestamp: string;
}

// ============================================================================
// Defaults
// ============================================================================

/**
 * Default channel settings (all enabled)
 */
export const DEFAULT_CHANNEL_SETTINGS: ChannelSettings = {
  push: true,
  inApp: true,
  email: false,
  sms: false,
};

/**
 * Default notification preferences for new users
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'userId'> = {
  globalEnabled: true,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  categories: {
    approvals: { ...DEFAULT_CHANNEL_SETTINGS, email: true },
    assignments: { ...DEFAULT_CHANNEL_SETTINGS, email: true },
    mentions: { ...DEFAULT_CHANNEL_SETTINGS },
    reminders: { ...DEFAULT_CHANNEL_SETTINGS },
    comments: { ...DEFAULT_CHANNEL_SETTINGS },
    exports: { ...DEFAULT_CHANNEL_SETTINGS, push: false },
    system: { ...DEFAULT_CHANNEL_SETTINGS, push: false },
  },
  soundEnabled: true,
  vibrationEnabled: true,
  badgeEnabled: true,
  groupNotifications: true,
  autoMarkRead: false,
  updatedAt: new Date().toISOString(),
};
