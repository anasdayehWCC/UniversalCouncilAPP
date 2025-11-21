import { TenantConfig } from './config/types'
import { Permission, hasPermission, Role } from './permissions'

export type Module = {
  id: string
  title: string
  routes: { path: string; label: string; requiredPermissions?: Permission[] }[]
  serviceDomains?: string[] | null
}

const coreModules: Record<string, Module> = {
  transcription: {
    id: 'transcription',
    title: 'Transcription',
    routes: [
      { path: '/capture', label: 'Capture' },
      { path: '/new', label: 'New Meeting' },
      { path: '/recordings', label: 'Recordings' },
      { path: '/transcriptions', label: 'Transcriptions' },
    ],
  },
  minutes: {
    id: 'minutes',
    title: 'Minutes',
    routes: [
      { path: '/templates', label: 'Templates' },
      { path: '/transcriptions', label: 'Minutes' },
    ],
  },
  notes: {
    id: 'notes',
    title: 'Notes',
    routes: [{ path: '/notes', label: 'Notes' }],
  },
  admin: {
    id: 'admin',
    title: 'Admin',
    routes: [
      { path: '/users', label: 'Users', requiredPermissions: ['admin:*'] },
      { path: '/settings', label: 'Settings', requiredPermissions: ['admin:*'] },
    ],
  },
}

export function getEnabledModules(
  config: TenantConfig,
  serviceDomainId?: string | null,
  role: Role = 'social_worker',
): Module[] {
  return config.modules
    .filter((m) => m.enabled)
    .map((m) => {
      const mod = coreModules[m.id]
      if (!mod) return null
      if (serviceDomainId && m.departments && m.departments.length > 0 && !m.departments.includes(serviceDomainId)) {
        return null
      }
      const filteredRoutes = mod.routes.filter((r) => hasPermission(r.requiredPermissions, role))
      return { ...mod, routes: filteredRoutes }
    })
    .filter((m): m is Module => !!m)
}
