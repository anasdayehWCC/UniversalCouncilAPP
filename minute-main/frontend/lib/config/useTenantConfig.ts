import { useEffect, useState } from 'react'
import { fetchTenantConfig } from './client'
import { TenantConfig } from './types'

export function useTenantConfig(
  tenantId: string,
): { config: TenantConfig | null; loading: boolean; error: string | null } {
  const [config, setConfig] = useState<TenantConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchTenantConfig(tenantId)
      .then((c) => {
        if (!mounted) return
        setConfig(c)
        setError(null)
      })
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [tenantId])

  return { config, loading, error }
}
