'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  isPushSupported,
  isPushEnabled,
  isSubscribedToPush,
  subscribeToPush,
  unsubscribeFromPush,
  getPermissionState,
} from '@/lib/push-notifications'
import { useAccessToken } from './use-access-token'

interface UsePushNotificationsReturn {
  /** Whether push notifications are supported by the browser */
  isSupported: boolean
  /** Whether the user has subscribed to push notifications */
  isSubscribed: boolean
  /** Whether push is enabled in user preferences */
  isEnabled: boolean
  /** Current notification permission state */
  permissionState: NotificationPermission | 'unsupported'
  /** Loading state during subscription changes */
  loading: boolean
  /** Error message if subscription failed */
  error: string | null
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>
  /** Toggle push notifications on/off */
  toggle: () => Promise<boolean>
}

/**
 * Hook for managing push notification subscriptions
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const { accessToken } = useAccessToken()
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check support and current state on mount
  useEffect(() => {
    const checkState = async () => {
      const supported = isPushSupported()
      setIsSupported(supported)
      
      if (!supported) {
        setLoading(false)
        return
      }

      setPermissionState(getPermissionState())
      setIsEnabled(isPushEnabled())
      
      const subscribed = await isSubscribedToPush()
      setIsSubscribed(subscribed)
      setLoading(false)
    }

    checkState()
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications not supported')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const subscription = await subscribeToPush(accessToken ?? undefined)
      if (subscription) {
        setIsSubscribed(true)
        setIsEnabled(true)
        setPermissionState(getPermissionState())
        return true
      } else {
        setError('Failed to subscribe - permission may have been denied')
        return false
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [isSupported, accessToken])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    setLoading(true)
    setError(null)

    try {
      const success = await unsubscribeFromPush(accessToken ?? undefined)
      if (success) {
        setIsSubscribed(false)
        setIsEnabled(false)
      }
      return success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [isSupported, accessToken])

  // Toggle subscription
  const toggle = useCallback(async (): Promise<boolean> => {
    if (isSubscribed) {
      return unsubscribe()
    } else {
      return subscribe()
    }
  }, [isSubscribed, subscribe, unsubscribe])

  return {
    isSupported,
    isSubscribed,
    isEnabled,
    permissionState,
    loading,
    error,
    subscribe,
    unsubscribe,
    toggle,
  }
}
