import type { TenantConfig } from '@core/config/types'
import {
  coreModuleManifest,
  getEnabledModules as getEnabledModulesFromManifest,
  type ModuleDefinition,
  type Role,
} from '@core/modules'

export type Module = ModuleDefinition

export const modules = coreModuleManifest

export function getEnabledModules(
  config: TenantConfig,
  serviceDomainId?: string | null,
  role: Role = 'social_worker',
): Module[] {
  return getEnabledModulesFromManifest(config, { serviceDomainId, role })
}
