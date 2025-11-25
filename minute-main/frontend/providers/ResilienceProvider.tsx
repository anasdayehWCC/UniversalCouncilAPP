'use client'

import { ReactNode, createContext, useContext, useMemo } from 'react'
import { useConnectivityStatus } from '@/hooks/use-connectivity-status'

type ResilienceContextValue = ReturnType<typeof useConnectivityStatus> & {
  retryAll: () => Promise<void>
}

const ResilienceContext = createContext<ResilienceContextValue | null>(null)

export function ResilienceProvider({
  token,
  children,
}: {
  token?: string | null
  children: ReactNode
}) {
  const state = useConnectivityStatus(token)

  const value = useMemo<ResilienceContextValue>(
    () => ({
      ...state,
      retryAll: async () => {
        await state.retryHealth()
        if (state.isOnline) {
          await state.retrySync()
        }
      },
    }),
    [state],
  )

  return (
    <ResilienceContext.Provider value={value}>
      {children}
    </ResilienceContext.Provider>
  )
}

export function useResilience() {
  const ctx = useContext(ResilienceContext)
  if (!ctx) {
    throw new Error('useResilience must be used within ResilienceProvider')
  }
  return ctx
}
