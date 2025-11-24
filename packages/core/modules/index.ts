import type { TenantConfig } from '../config/types';
import type { Permission } from '../plugins/registry';

export type Role = 'social_worker' | 'manager' | 'admin';

export type ModuleRoute = {
  path: string;
  label: string;
  requiredPermissions?: Permission[];
};

export type ModuleDefinition = {
  id: string;
  title: string;
  routes: ModuleRoute[];
  serviceDomains?: string[] | null;
};

export const rolePermissions: Record<Role, Permission[]> = {
  social_worker: ['transcription:read', 'transcription:write', 'minutes:read'],
  manager: ['transcription:read', 'transcription:write', 'minutes:read', 'minutes:approve'],
  admin: ['admin:*', 'minutes:read', 'transcription:read', 'transcription:write'],
};

export function hasPermission(required: Permission[] | undefined, role: Role): boolean {
  if (!required || required.length === 0) return true;
  const perms = rolePermissions[role] ?? [];
  return required.every((permission) => {
    const [domain] = permission.split(':');
    const wildcard = `${domain}:*` as Permission;
    return perms.includes(permission) || perms.includes(wildcard);
  });
}

export const coreModuleManifest: Record<string, ModuleDefinition> = {
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
  tasks: {
    id: 'tasks',
    title: 'Tasks',
    routes: [{ path: '/tasks', label: 'My Tasks' }],
  },
};

type GetEnabledModulesOptions = {
  serviceDomainId?: string | null;
  role?: Role;
  manifest?: Record<string, ModuleDefinition>;
};

export function getEnabledModules(
  config: TenantConfig,
  { serviceDomainId, role = 'social_worker', manifest = coreModuleManifest }: GetEnabledModulesOptions = {}
): ModuleDefinition[] {
  return config.modules
    .filter((moduleConfig) => moduleConfig.enabled !== false)
    .map((moduleConfig) => {
      const moduleDefinition = manifest[moduleConfig.id];
      if (!moduleDefinition) return null;

      if (
        serviceDomainId &&
        moduleConfig.departments &&
        moduleConfig.departments.length > 0 &&
        !moduleConfig.departments.includes(serviceDomainId)
      ) {
        return null;
      }

      const filteredRoutes = moduleDefinition.routes.filter((route) => hasPermission(route.requiredPermissions, role));
      return { ...moduleDefinition, routes: filteredRoutes };
    })
    .filter((module): module is ModuleDefinition => !!module);
}
