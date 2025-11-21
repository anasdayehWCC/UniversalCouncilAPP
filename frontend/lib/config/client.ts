import { TenantConfig } from './types'

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_HOST ||
  process.env.BACKEND_HOST ||
  ''

export async function fetchTenantConfig(tenantId: string): Promise<TenantConfig> {
  const resp = await fetch(`${API_BASE}/config/${tenantId}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  if (!resp.ok) {
    throw new Error(`Failed to load tenant config (${resp.status})`)
  }
  return resp.json()
}
