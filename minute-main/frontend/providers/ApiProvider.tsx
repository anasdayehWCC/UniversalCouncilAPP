"use client"

import { ReactNode, useEffect } from 'react'
import { client } from '@/lib/client/client.gen'
import { devPreviewFetch } from '@/lib/dev-preview/fetcher'
import { API_PROXY_PATH } from './TanstackQueryProvider'

export const ApiProvider = ({ token, children }: { token: string | null; children: ReactNode }) => {
  useEffect(() => {
    client.setConfig({
      baseUrl: API_PROXY_PATH,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      fetch: devPreviewFetch,
    })
  }, [token])

  return <>{children}</>
}
