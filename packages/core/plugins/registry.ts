export type Permission = `${string}:${string}`; // e.g. "cases:read", "transcription:edit"

export interface RouteConfig {
  path: string;
  componentId: string; // resolved by hosting app
  requiredPermissions?: Permission[];
}

export interface FeatureModuleMeta {
  id: string;
  title: string;
  category?: string;
}

export interface FeatureModule {
  meta: FeatureModuleMeta;
  routes: RouteConfig[];
  onRegister?(tenantId: string): void;
}

const registry: Record<string, FeatureModule> = {};

export function registerModule(module: FeatureModule) {
  registry[module.meta.id] = module;
}

export function getModules(): FeatureModule[] {
  return Object.values(registry);
}

export function getModulesForTenant(
  tenantId: string,
  enabledModuleIds: string[]
): FeatureModule[] {
  return enabledModuleIds
    .map((id) => registry[id])
    .filter((m): m is FeatureModule => !!m);
}
