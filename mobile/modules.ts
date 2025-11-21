import type { ModuleConfig, TenantConfig } from "./types"

export const getEnabledModules = (config: TenantConfig, serviceDomainId?: string | null): ModuleConfig[] => {
  return (config.modules || [])
    .filter((m) => m.enabled)
    .filter((m) => !serviceDomainId || !m.departments || m.departments.includes(serviceDomainId))
}
