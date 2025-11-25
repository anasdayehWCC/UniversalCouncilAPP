'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSyncManager } from '@/hooks/use-sync-manager'

const HEALTH_ENDPOINT = '/api/proxy/health/ready'
const POLL_INTERVAL_MS = 30_000

type ConnectivityState = {
  isOnline: boolean
  apiHealthy: boolean
  isDegraded: boolean
  checkingApi: boolean
  apiError: string | null
  lastApiCheck: number | null
  pendingCount: number
  isSyncing: boolean
  retryHealth: () => Promise<void>
  retrySync: () => Promise<void>
}

export function useConnectivityStatus(token?: string | null): ConnectivityState {
  const { isOnline, isSyncing, pendingCount, syncRecordings } = useSyncManager(token)
  const [apiHealthy, setApiHealthy] = useState(true)
  const [checkingApi, setCheckingApi] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [lastApiCheck, setLastApiCheck] = useState<number | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const retryHealth = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (!isOnline) {
      setApiHealthy(false)
      setApiError('Offline')
      setLastApiCheck(Date.now())
      return
    }

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setCheckingApi(true)

    try {
      const res = await fetch(HEALTH_ENDPOINT, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`)
      }
      setApiHealthy(true)
      setApiError(null)
    } catch (error) {
      if ((error as Error).name === 'AbortError') return
      setApiHealthy(false)
      setApiError(
        error instanceof Error ? error.message : 'Unable to reach the API',
      )
    } finally {
      setCheckingApi(false)
      setLastApiCheck(Date.now())
    }
  }, [isOnline])

  useEffect(() => {
    retryHealth()
    const interval = setInterval(retryHealth, POLL_INTERVAL_MS)
    return () => {
      clearInterval(interval)
      controllerRef.current?.abort()
    }
  }, [retryHealth])

  const retrySync = useCallback(async () => {
    if (!pendingCount) return
    await syncRecordings()
  }, [pendingCount, syncRecordings])

  const isDegraded = useMemo(
    () => !isOnline || !apiHealthy,
    [isOnline, apiHealthy],
  )

  return {
    isOnline,
    apiHealthy,
    isDegraded,
    checkingApi,
    apiError,
    lastApiCheck,
    pendingCount,
    isSyncing,
    retryHealth,
    retrySync,
  }
}
