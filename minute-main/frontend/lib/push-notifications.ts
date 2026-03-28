/**
 * Push Notification Service (Phase 33B)
 * 
 * Handles Web Push notification registration, subscription management,
 * and notification display for offline sync completions and other events.
 */

// Type definitions
interface PushSubscriptionJSON {
  endpoint: string
  keys?: {
    p256dh: string
    auth: string
  }
  expirationTime?: number | null
}

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
  actions?: { action: string; title: string; icon?: string }[]
  requireInteraction?: boolean
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_HOST ||
  process.env.BACKEND_HOST ||
  'http://localhost:8080'

// LocalStorage keys
const PUSH_ENABLED_KEY = 'pushNotifications:enabled'
const PUSH_SUBSCRIPTION_KEY = 'pushNotifications:subscription'

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Get current notification permission state
 */
export function getPermissionState(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

/**
 * Request notification permission
 */
export async function requestPermission(): Promise<boolean> {
  if (!isPushSupported()) return false
  
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/**
 * Convert URL-safe base64 to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(token?: string): Promise<PushSubscriptionJSON | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported')
    return null
  }

  const permission = await requestPermission()
  if (!permission) {
    console.warn('Notification permission denied')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription()
    
    if (!subscription && VAPID_PUBLIC_KEY) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }
    
    if (!subscription) {
      console.warn('Failed to create push subscription')
      return null
    }

    const subscriptionJSON = subscription.toJSON() as PushSubscriptionJSON
    
    // Save to backend if we have a token
    if (token) {
      await saveSubscriptionToBackend(subscriptionJSON, token)
    }
    
    // Save to localStorage
    localStorage.setItem(PUSH_ENABLED_KEY, 'true')
    localStorage.setItem(PUSH_SUBSCRIPTION_KEY, JSON.stringify(subscriptionJSON))
    
    return subscriptionJSON
  } catch (error) {
    console.error('Failed to subscribe to push:', error)
    return null
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(token?: string): Promise<boolean> {
  if (!isPushSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      // Notify backend
      if (token) {
        await removeSubscriptionFromBackend(subscription.endpoint, token)
      }
      
      // Unsubscribe locally
      await subscription.unsubscribe()
    }
    
    localStorage.setItem(PUSH_ENABLED_KEY, 'false')
    localStorage.removeItem(PUSH_SUBSCRIPTION_KEY)
    
    return true
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error)
    return false
  }
}

/**
 * Check if user is subscribed to push
 */
export async function isSubscribedToPush(): Promise<boolean> {
  if (!isPushSupported()) return false
  
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return !!subscription
  } catch {
    return false
  }
}

/**
 * Check local preference for push notifications
 */
export function isPushEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(PUSH_ENABLED_KEY) === 'true'
}

/**
 * Save subscription to backend
 */
async function saveSubscriptionToBackend(
  subscription: PushSubscriptionJSON,
  token: string
): Promise<void> {
  try {
    await fetch(`${API_BASE}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subscription),
    })
  } catch (error) {
    console.error('Failed to save subscription to backend:', error)
    // Non-fatal - subscription still works locally
  }
}

/**
 * Remove subscription from backend
 */
async function removeSubscriptionFromBackend(
  endpoint: string,
  token: string
): Promise<void> {
  try {
    await fetch(`${API_BASE}/notifications/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint }),
    })
  } catch (error) {
    console.error('Failed to remove subscription from backend:', error)
    // Non-fatal
  }
}

/**
 * Show a local notification (for testing or fallback)
 */
export async function showLocalNotification(options: NotificationOptions): Promise<boolean> {
  if (!isPushSupported()) return false
  
  const permission = await requestPermission()
  if (!permission) return false

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192x192.png',
      badge: options.badge || '/icon-192x192.png',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction,
    })
    return true
  } catch (error) {
    console.error('Failed to show notification:', error)
    return false
  }
}

/**
 * Notify user of offline sync completion
 */
export async function notifySyncComplete(count: number): Promise<void> {
  await showLocalNotification({
    title: 'Recordings Synced',
    body: `${count} offline recording${count === 1 ? '' : 's'} uploaded successfully.`,
    tag: 'sync-complete',
    data: { type: 'sync-complete', count },
  })
}

/**
 * Notify user of sync failure
 */
export async function notifySyncFailed(failedCount: number, totalCount: number): Promise<void> {
  await showLocalNotification({
    title: 'Sync Incomplete',
    body: `${failedCount} of ${totalCount} recording${totalCount === 1 ? '' : 's'} failed to sync. Tap to retry.`,
    tag: 'sync-failed',
    requireInteraction: true,
    data: { type: 'sync-failed', failedCount, totalCount },
  })
}

/**
 * Notify user of new transcription ready
 */
export async function notifyTranscriptionReady(transcriptionId: string, title: string): Promise<void> {
  await showLocalNotification({
    title: 'Transcription Ready',
    body: `"${title}" is ready for review.`,
    tag: `transcription-${transcriptionId}`,
    data: { type: 'transcription-ready', transcriptionId },
  })
}

/**
 * Notify user of minutes generated
 */
export async function notifyMinutesReady(transcriptionId: string, title: string): Promise<void> {
  await showLocalNotification({
    title: 'Minutes Generated',
    body: `Minutes for "${title}" are ready.`,
    tag: `minutes-${transcriptionId}`,
    data: { type: 'minutes-ready', transcriptionId },
  })
}
