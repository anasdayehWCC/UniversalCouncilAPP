/**
 * Push Notification Service
 * 
 * Handles push notification subscription, permission requests,
 * and service worker registration for Web Push API.
 * 
 * @module lib/notifications/push
 */

import type { PushSubscription, PushSupport, PushPermissionState } from './types';
import { registerServiceWorker } from '@/lib/pwa';

// ============================================================================
// Constants
// ============================================================================

/**
 * VAPID public key for push notifications
 * This should be replaced with your actual VAPID public key from the backend
 */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * Local storage key for subscription state
 */
const SUBSCRIPTION_STORAGE_KEY = 'push_subscription';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a base64 string to a Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  const stored = localStorage.getItem('device_id');
  if (stored) return stored;
  
  const id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem('device_id', id);
  return id;
}

// ============================================================================
// Permission Management
// ============================================================================

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current push notification permission state
 */
export function getPushPermission(): PushPermissionState {
  if (!isPushSupported()) return 'unsupported';
  
  const permission = Notification.permission;
  switch (permission) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'denied';
    default:
      return 'prompt';
  }
}

/**
 * Request push notification permission
 * @returns The resulting permission state
 */
export async function requestPushPermission(): Promise<PushPermissionState> {
  if (!isPushSupported()) {
    console.warn('[Push] Push notifications not supported');
    return 'unsupported';
  }

  try {
    const result = await Notification.requestPermission();
    console.log('[Push] Permission result:', result);
    
    switch (result) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      default:
        return 'prompt';
    }
  } catch (error) {
    console.error('[Push] Error requesting permission:', error);
    return 'denied';
  }
}

// ============================================================================
// Service Worker Management
// ============================================================================

// ============================================================================
// Push Subscription Management
// ============================================================================

/**
 * Get the current push subscription
 */
export async function getCurrentSubscription(): Promise<PushSubscriptionJSON | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;

    const subscription = await registration.pushManager.getSubscription();
    return subscription ? subscription.toJSON() : null;
  } catch (error) {
    console.error('[Push] Error getting subscription:', error);
    return null;
  }
}

/**
 * Subscribe to push notifications
 * @returns The subscription object or null if failed
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('[Push] Push not supported');
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('[Push] VAPID public key not configured');
    return null;
  }

  try {
    // Ensure permission is granted
    const permission = getPushPermission();
    if (permission !== 'granted') {
      const newPermission = await requestPushPermission();
      if (newPermission !== 'granted') {
        console.warn('[Push] Permission not granted:', newPermission);
        return null;
      }
    }

    // Get or register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('[Push] No service worker registration');
      return null;
    }

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    // If not subscribed, create new subscription
    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      console.log('[Push] New subscription created');
    }

    // Convert to our subscription format
    const subscriptionJSON = subscription.toJSON();
    const deviceId = generateDeviceId();
    
    const pushSubscription: PushSubscription = {
      id: '', // Will be assigned by backend
      userId: '', // Will be assigned by backend
      endpoint: subscriptionJSON.endpoint || '',
      expirationTime: subscriptionJSON.expirationTime || null,
      keys: {
        p256dh: subscriptionJSON.keys?.p256dh || '',
        auth: subscriptionJSON.keys?.auth || '',
      },
      deviceId,
      userAgent: navigator.userAgent,
      active: true,
      createdAt: new Date().toISOString(),
    };

    // Store subscription locally
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(pushSubscription));

    console.log('[Push] Subscription ready:', subscription.endpoint);
    return pushSubscription;
  } catch (error) {
    console.error('[Push] Error subscribing:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return true;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    const result = await subscription.unsubscribe();
    
    // Clear local storage
    localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
    
    console.log('[Push] Unsubscribed:', result);
    return result;
  } catch (error) {
    console.error('[Push] Error unsubscribing:', error);
    return false;
  }
}

/**
 * Get the full push support status
 */
export async function getPushSupport(): Promise<PushSupport> {
  const supported = isPushSupported();
  const serviceWorkerAvailable = 
    typeof window !== 'undefined' && 'serviceWorker' in navigator;
  const permission = getPushPermission();
  
  let subscribed = false;
  let subscription: PushSubscription | undefined;
  let errorMessage: string | undefined;

  if (supported) {
    try {
      const currentSub = await getCurrentSubscription();
      subscribed = !!currentSub;
      
      if (currentSub) {
        const stored = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
        subscription = stored ? JSON.parse(stored) : undefined;
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }
  } else {
    if (!serviceWorkerAvailable) {
      errorMessage = 'Service workers are not supported in this browser';
    } else if (typeof window !== 'undefined' && !('PushManager' in window)) {
      errorMessage = 'Push notifications are not supported in this browser';
    } else if (typeof window !== 'undefined' && !('Notification' in window)) {
      errorMessage = 'Notifications are not supported in this browser';
    }
  }

  return {
    supported,
    serviceWorkerAvailable,
    permission,
    subscribed,
    subscription,
    errorMessage,
  };
}

// ============================================================================
// Push Event Handlers
// ============================================================================

/**
 * Send a test notification (for debugging)
 * Uses the Notification API directly
 */
export function sendTestNotification(
  title: string = 'Test Notification',
  body: string = 'This is a test notification from the Council Minutes app.'
): boolean {
  if (!isPushSupported() || getPushPermission() !== 'granted') {
    console.warn('[Push] Cannot send test notification - not ready');
    return false;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'test-notification',
      requireInteraction: false,
    });

    notification.onclick = () => {
      console.log('[Push] Test notification clicked');
      notification.close();
      window.focus();
    };

    return true;
  } catch (error) {
    console.error('[Push] Error sending test notification:', error);
    return false;
  }
}

// ============================================================================
// Backend Integration
// ============================================================================

/**
 * Send subscription to backend for storage
 * This should be called after successfully subscribing
 */
export async function sendSubscriptionToBackend(
  subscription: PushSubscription,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      console.error('[Push] Failed to register subscription with backend');
      return false;
    }

    const data = await response.json();
    
    // Update local storage with backend-assigned ID
    const updated = { ...subscription, id: data.id };
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(updated));

    console.log('[Push] Subscription registered with backend:', data.id);
    return true;
  } catch (error) {
    console.error('[Push] Error sending subscription to backend:', error);
    return false;
  }
}

/**
 * Remove subscription from backend
 */
export async function removeSubscriptionFromBackend(
  subscriptionId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/notifications/subscribe/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('[Push] Failed to remove subscription from backend');
      return false;
    }

    console.log('[Push] Subscription removed from backend');
    return true;
  } catch (error) {
    console.error('[Push] Error removing subscription from backend:', error);
    return false;
  }
}
