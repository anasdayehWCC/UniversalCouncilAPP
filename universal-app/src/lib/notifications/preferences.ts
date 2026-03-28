/**
 * Notification Preferences Service
 * 
 * Manages user notification preferences including category toggles,
 * quiet hours, and channel settings.
 * 
 * @module lib/notifications/preferences
 */

import type {
  NotificationPreferences,
  NotificationCategoryPreferences,
  ChannelSettings,
  QuietHours,
} from './types';
import { DEFAULT_NOTIFICATION_PREFERENCES, DEFAULT_CHANNEL_SETTINGS } from './types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Local storage key for preferences
 */
const PREFERENCES_STORAGE_KEY = 'notification_preferences';

/**
 * Cache duration in milliseconds (5 minutes)
 */
const CACHE_DURATION = 5 * 60 * 1000;

// ============================================================================
// Local Storage Helpers
// ============================================================================

/**
 * Get preferences from local storage
 */
function getLocalPreferences(): NotificationPreferences | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    return data.preferences || null;
  } catch {
    return null;
  }
}

/**
 * Save preferences to local storage with timestamp
 */
function saveLocalPreferences(preferences: NotificationPreferences): void {
  if (typeof window === 'undefined') return;
  
  try {
    const data = {
      preferences,
      timestamp: Date.now(),
    };
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[Preferences] Error saving to local storage:', error);
  }
}

/**
 * Check if cached preferences are still valid
 */
function isCacheValid(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!stored) return false;
    
    const data = JSON.parse(stored);
    return Date.now() - data.timestamp < CACHE_DURATION;
  } catch {
    return false;
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get notification preferences for the current user
 * Uses local cache with backend fallback
 */
export async function getNotificationPreferences(
  accessToken?: string
): Promise<NotificationPreferences> {
  // Try cache first
  if (isCacheValid()) {
    const cached = getLocalPreferences();
    if (cached) {
      console.log('[Preferences] Using cached preferences');
      return cached;
    }
  }

  // If no token, return defaults with cached or generated userId
  if (!accessToken) {
    const cached = getLocalPreferences();
    if (cached) return cached;
    
    const defaults: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      userId: 'local',
    };
    saveLocalPreferences(defaults);
    return defaults;
  }

  // Fetch from backend
  try {
    const response = await fetch('/api/notifications/preferences', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const preferences: NotificationPreferences = await response.json();
    saveLocalPreferences(preferences);
    console.log('[Preferences] Fetched from backend');
    return preferences;
  } catch (error) {
    console.error('[Preferences] Error fetching from backend:', error);
    
    // Fall back to cached or defaults
    const cached = getLocalPreferences();
    if (cached) return cached;
    
    const defaults: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      userId: 'local',
    };
    return defaults;
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  updates: Partial<NotificationPreferences>,
  accessToken?: string
): Promise<NotificationPreferences> {
  // Get current preferences
  const current = await getNotificationPreferences(accessToken);
  
  // Merge updates
  const updated: NotificationPreferences = {
    ...current,
    ...updates,
    categories: {
      ...current.categories,
      ...(updates.categories || {}),
    },
    quietHours: {
      ...current.quietHours,
      ...(updates.quietHours || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  // Save locally immediately
  saveLocalPreferences(updated);

  // Sync to backend if authenticated
  if (accessToken) {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updated),
      });

      if (!response.ok) {
        console.error('[Preferences] Failed to sync to backend');
      } else {
        console.log('[Preferences] Synced to backend');
      }
    } catch (error) {
      console.error('[Preferences] Error syncing to backend:', error);
    }
  }

  return updated;
}

// ============================================================================
// Category Preferences
// ============================================================================

type CategoryKey = keyof NotificationCategoryPreferences;

/**
 * Get settings for a specific notification category
 */
export async function getCategorySettings(
  category: CategoryKey,
  accessToken?: string
): Promise<ChannelSettings> {
  const preferences = await getNotificationPreferences(accessToken);
  return preferences.categories[category] || DEFAULT_CHANNEL_SETTINGS;
}

/**
 * Update settings for a specific notification category
 */
export async function updateCategorySettings(
  category: CategoryKey,
  settings: Partial<ChannelSettings>,
  accessToken?: string
): Promise<NotificationPreferences> {
  const preferences = await getNotificationPreferences(accessToken);
  
  const updatedCategories: NotificationCategoryPreferences = {
    ...preferences.categories,
    [category]: {
      ...preferences.categories[category],
      ...settings,
    },
  };

  return updateNotificationPreferences(
    { categories: updatedCategories },
    accessToken
  );
}

/**
 * Toggle a specific channel for a category
 */
export async function toggleCategoryChannel(
  category: CategoryKey,
  channel: keyof ChannelSettings,
  enabled: boolean,
  accessToken?: string
): Promise<NotificationPreferences> {
  return updateCategorySettings(
    category,
    { [channel]: enabled },
    accessToken
  );
}

/**
 * Enable all notifications for a category
 */
export async function enableCategory(
  category: CategoryKey,
  accessToken?: string
): Promise<NotificationPreferences> {
  return updateCategorySettings(
    category,
    { push: true, inApp: true, email: true, sms: true },
    accessToken
  );
}

/**
 * Disable all notifications for a category
 */
export async function disableCategory(
  category: CategoryKey,
  accessToken?: string
): Promise<NotificationPreferences> {
  return updateCategorySettings(
    category,
    { push: false, inApp: false, email: false, sms: false },
    accessToken
  );
}

// ============================================================================
// Quiet Hours
// ============================================================================

/**
 * Get quiet hours settings
 */
export async function getQuietHours(
  accessToken?: string
): Promise<QuietHours> {
  const preferences = await getNotificationPreferences(accessToken);
  return preferences.quietHours;
}

/**
 * Update quiet hours settings
 */
export async function updateQuietHours(
  quietHours: Partial<QuietHours>,
  accessToken?: string
): Promise<NotificationPreferences> {
  const preferences = await getNotificationPreferences(accessToken);
  
  const updated: QuietHours = {
    ...preferences.quietHours,
    ...quietHours,
  };

  return updateNotificationPreferences({ quietHours: updated }, accessToken);
}

/**
 * Toggle quiet hours on/off
 */
export async function toggleQuietHours(
  enabled: boolean,
  accessToken?: string
): Promise<NotificationPreferences> {
  return updateQuietHours({ enabled }, accessToken);
}

/**
 * Check if quiet hours are currently active
 */
export function isQuietHoursActive(quietHours: QuietHours): boolean {
  if (!quietHours.enabled) return false;

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Check if current day is in the quiet hours days
  if (!quietHours.daysOfWeek.includes(currentDay)) {
    return false;
  }

  const { startTime, endTime } = quietHours;

  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  }

  // Same-day quiet hours (e.g., 14:00 to 16:00)
  return currentTime >= startTime && currentTime < endTime;
}

// ============================================================================
// Global Toggles
// ============================================================================

/**
 * Toggle all notifications on/off
 */
export async function toggleGlobalNotifications(
  enabled: boolean,
  accessToken?: string
): Promise<NotificationPreferences> {
  return updateNotificationPreferences({ globalEnabled: enabled }, accessToken);
}

/**
 * Toggle sound
 */
export async function toggleSound(
  enabled: boolean,
  accessToken?: string
): Promise<NotificationPreferences> {
  return updateNotificationPreferences({ soundEnabled: enabled }, accessToken);
}

/**
 * Toggle vibration
 */
export async function toggleVibration(
  enabled: boolean,
  accessToken?: string
): Promise<NotificationPreferences> {
  return updateNotificationPreferences({ vibrationEnabled: enabled }, accessToken);
}

/**
 * Toggle badge
 */
export async function toggleBadge(
  enabled: boolean,
  accessToken?: string
): Promise<NotificationPreferences> {
  return updateNotificationPreferences({ badgeEnabled: enabled }, accessToken);
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Reset preferences to defaults
 */
export async function resetPreferences(
  accessToken?: string
): Promise<NotificationPreferences> {
  const current = await getNotificationPreferences(accessToken);
  
  const reset: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    userId: current.userId,
  };

  return updateNotificationPreferences(reset, accessToken);
}

/**
 * Clear local preferences cache
 */
export function clearPreferencesCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PREFERENCES_STORAGE_KEY);
  console.log('[Preferences] Cache cleared');
}

/**
 * Check if a notification should be delivered based on preferences
 */
export function shouldDeliverNotification(
  type: keyof NotificationCategoryPreferences,
  channel: keyof ChannelSettings,
  preferences: NotificationPreferences
): boolean {
  // Check global toggle
  if (!preferences.globalEnabled) return false;

  // Check quiet hours
  if (isQuietHoursActive(preferences.quietHours)) {
    // During quiet hours, only deliver high-priority notifications
    // This could be enhanced to check notification priority
    return false;
  }

  // Check category and channel settings
  const categorySettings = preferences.categories[type];
  if (!categorySettings) return false;

  return categorySettings[channel] ?? false;
}
