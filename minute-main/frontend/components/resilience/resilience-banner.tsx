'use client'

import { Button } from '@careminutes/ui'
import { cn } from '@/lib/utils'
import { useResilience } from '@/providers/ResilienceProvider'
import { RefreshCw, ServerCrash, WifiOff } from 'lucide-react'

export function ResilienceBanner() {
  const {
    isOnline,
    apiHealthy,
    isDegraded,
    pendingCount,
    isSyncing,
    checkingApi,
    apiError,
    lastApiCheck,
    retryAll,
  } = useResilience()

  if (!isDegraded && pendingCount === 0) return null

  const isOffline = !isOnline
  const isApiDown = isOnline && !apiHealthy

  const title = isOffline
    ? 'Offline mode'
    : isApiDown
      ? 'Degraded mode'
      : 'Queued for sync'

  const description = isOffline
    ? 'You are offline. We will keep actions queued and sync when you are back online.'
    : isApiDown
      ? 'The API is unreachable. Navigation uses cached defaults until the connection recovers.'
      : 'Pending items will sync automatically when connectivity is stable.'

  const Icon = isOffline ? WifiOff : isApiDown ? ServerCrash : RefreshCw

  return (
    <div className="sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-800/85 to-slate-900/90 px-4 py-3 text-white backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-white/80">
              {description}
              {apiError && isApiDown && ` (${apiError})`}
            </p>
            {lastApiCheck && (
              <p className="mt-0.5 text-[11px] text-white/60">
                Last check: {new Date(lastApiCheck).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              {pendingCount} pending
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className={cn(
              'border-white/30 bg-white/10 text-white hover:bg-white/20',
              (checkingApi || isSyncing) && 'pointer-events-none opacity-70',
            )}
            onClick={retryAll}
            disabled={checkingApi}
          >
            <RefreshCw
              className={cn(
                'mr-2 h-4 w-4',
                (checkingApi || isSyncing) && 'animate-spin',
              )}
            />
            {checkingApi || isSyncing ? 'Checking…' : 'Retry now'}
          </Button>
        </div>
      </div>
    </div>
  )
}
