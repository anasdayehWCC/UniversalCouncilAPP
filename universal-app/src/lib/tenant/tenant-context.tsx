'use client';

/**
 * Tenant Context Provider
 *
 * React context for accessing tenant configuration throughout the application.
 * Provides hooks for feature flags, module access, permissions, and navigation.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import type {
  TenantConfig,
  TenantContextValue,
  ServiceDomainConfig,
  RoleConfig,
  FeatureFlags,
  Permission,
  ModuleId,
  ServiceDomainId,
  RoleId,
  NavItemConfig,
  ConfigOverrides,
} from './types';
import {
  loadTenantConfig,
  applyConfigOverrides,
  subscribeToConfigChanges,
  reloadConfig as reloadConfigFromLoader,
  detectTenantId,
} from './config-loader';
import { demoConfig } from './configs/demo.config';

// ============================================================================
// Context Definition
// ============================================================================

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

interface TenantProviderProps {
  children: ReactNode;
  /** Initial tenant ID (optional, will be detected from environment/URL) */
  tenantId?: string;
  /** Initial domain ID (optional, uses tenant default) */
  initialDomainId?: ServiceDomainId;
  /** Initial role ID (optional) */
  initialRoleId?: RoleId;
  /** Static configuration to use (bypasses loading) */
  staticConfig?: TenantConfig;
  /** Enable hot-reloading of configuration */
  enableHotReload?: boolean;
}

// ============================================================================
// Provider Component
// ============================================================================

export function TenantProvider({
  children,
  tenantId: propTenantId,
  initialDomainId,
  initialRoleId,
  staticConfig,
  enableHotReload = false,
}: TenantProviderProps) {
  // State
  const [tenant, setTenant] = useState<TenantConfig>(staticConfig || demoConfig);
  const [currentDomainId, setCurrentDomainId] = useState<ServiceDomainId>(
    initialDomainId || staticConfig?.defaultDomain || 'children'
  );
  const [currentRoleId, setCurrentRoleId] = useState<RoleId>(initialRoleId || 'social_worker');
  const [isLoading, setIsLoading] = useState(!staticConfig);
  const [error, setError] = useState<Error | null>(null);
  const [overrides, setOverrides] = useState<ConfigOverrides>({});

  // Derived state
  const effectiveConfig = useMemo(
    () => (Object.keys(overrides).length > 0 ? applyConfigOverrides(tenant, overrides) : tenant),
    [tenant, overrides]
  );

  const currentDomain = useMemo(
    () =>
      effectiveConfig.serviceDomains.find((d) => d.id === currentDomainId) ||
      effectiveConfig.serviceDomains[0],
    [effectiveConfig.serviceDomains, currentDomainId]
  );

  const currentRole = useMemo(
    () =>
      effectiveConfig.roles.find((r) => r.id === currentRoleId) ||
      effectiveConfig.roles.find((r) => r.id === 'social_worker') ||
      effectiveConfig.roles[0],
    [effectiveConfig.roles, currentRoleId]
  );

  // Load configuration on mount
  useEffect(() => {
    if (staticConfig) {
      setTenant(staticConfig);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadConfig() {
      try {
        setIsLoading(true);
        setError(null);

        const resolvedTenantId = propTenantId || detectTenantId();
        const result = await loadTenantConfig(resolvedTenantId);

        if (isMounted) {
          setTenant(result.config);
          if (!initialDomainId) {
            setCurrentDomainId(result.config.defaultDomain);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load tenant configuration'));
          setIsLoading(false);
        }
      }
    }

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, [propTenantId, staticConfig, initialDomainId]);

  // Subscribe to config changes for hot-reload
  useEffect(() => {
    if (!enableHotReload || staticConfig) return;

    const tenantId = propTenantId || detectTenantId();
    const unsubscribe = subscribeToConfigChanges(tenantId, (newConfig) => {
      setTenant(newConfig);
    });

    return unsubscribe;
  }, [enableHotReload, propTenantId, staticConfig]);

  // Persist domain selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('currentDomainId', currentDomainId);
    }
  }, [currentDomainId]);

  // Persist role selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('currentRoleId', currentRoleId);
    }
  }, [currentRoleId]);

  // Context methods
  const isFeatureEnabled = useCallback(
    (flag: keyof FeatureFlags): boolean => {
      return effectiveConfig.featureFlags[flag] ?? false;
    },
    [effectiveConfig.featureFlags]
  );

  const isModuleEnabled = useCallback(
    (moduleId: ModuleId): boolean => {
      const module = effectiveConfig.modules.find((m) => m.id === moduleId);
      if (!module) return false;
      if (module.status !== 'enabled' && module.status !== 'beta') return false;
      if (!module.allowedDomains.includes(currentDomainId)) return false;
      if (!module.allowedRoles.includes(currentRoleId)) return false;
      return true;
    },
    [effectiveConfig.modules, currentDomainId, currentRoleId]
  );

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return currentRole.permissions.includes(permission);
    },
    [currentRole]
  );

  const getNavigation = useCallback((): NavItemConfig[] => {
    return currentRole.navigation.filter((item) => {
      // Check feature flag
      if (item.featureFlag && !isFeatureEnabled(item.featureFlag as keyof FeatureFlags)) {
        return false;
      }
      // Check permission
      if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
        return false;
      }
      return true;
    });
  }, [currentRole.navigation, isFeatureEnabled, hasPermission]);

  const switchDomain = useCallback(
    (domainId: ServiceDomainId) => {
      // Check if role can switch domains
      if (!currentRole.canSwitchDomain) {
        console.warn(`Role ${currentRole.id} cannot switch domains`);
        return;
      }

      // Validate domain exists
      const domain = effectiveConfig.serviceDomains.find((d) => d.id === domainId);
      if (!domain) {
        console.warn(`Domain ${domainId} not found`);
        return;
      }

      // Check if current role is available in new domain
      if (!domain.availableRoles.includes(currentRoleId)) {
        // Switch to first available role in new domain
        const newRole = domain.availableRoles[0];
        if (newRole) {
          setCurrentRoleId(newRole);
        }
      }

      setCurrentDomainId(domainId);
    },
    [currentRole, currentRoleId, effectiveConfig.serviceDomains]
  );

  const reloadConfigHandler = useCallback(async () => {
    if (staticConfig) return;

    try {
      setIsLoading(true);
      const tenantId = propTenantId || detectTenantId();
      const result = await reloadConfigFromLoader(tenantId);
      setTenant(result.config);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reload configuration'));
    } finally {
      setIsLoading(false);
    }
  }, [propTenantId, staticConfig]);

  const applyOverridesHandler = useCallback((newOverrides: ConfigOverrides) => {
    setOverrides((prev) => ({
      ...prev,
      ...newOverrides,
      featureFlags: {
        ...prev.featureFlags,
        ...newOverrides.featureFlags,
      },
      modules: {
        ...prev.modules,
        ...newOverrides.modules,
      },
      branding: {
        ...prev.branding,
        ...newOverrides.branding,
      },
    }));
  }, []);

  // Context value
  const contextValue: TenantContextValue = useMemo(
    () => ({
      tenant: effectiveConfig,
      currentDomain,
      currentRole,
      isLoading,
      error,
      isFeatureEnabled,
      isModuleEnabled,
      hasPermission,
      getNavigation,
      switchDomain,
      reloadConfig: reloadConfigHandler,
      applyOverrides: applyOverridesHandler,
    }),
    [
      effectiveConfig,
      currentDomain,
      currentRole,
      isLoading,
      error,
      isFeatureEnabled,
      isModuleEnabled,
      hasPermission,
      getNavigation,
      switchDomain,
      reloadConfigHandler,
      applyOverridesHandler,
    ]
  );

  return <TenantContext.Provider value={contextValue}>{children}</TenantContext.Provider>;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Access the full tenant context
 */
export function useTenantContext(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenantContext must be used within a TenantProvider');
  }
  return context;
}

/**
 * Get the current tenant configuration
 */
export function useCurrentTenant(): TenantConfig {
  const { tenant } = useTenantContext();
  return tenant;
}

/**
 * Get the current service domain configuration
 */
export function useCurrentDomain(): ServiceDomainConfig {
  const { currentDomain } = useTenantContext();
  return currentDomain;
}

/**
 * Get the current role configuration
 */
export function useCurrentRole(): RoleConfig {
  const { currentRole } = useTenantContext();
  return currentRole;
}

/**
 * Check if a feature flag is enabled
 */
export function useTenantFeature(flag: keyof FeatureFlags): boolean {
  const { isFeatureEnabled } = useTenantContext();
  return isFeatureEnabled(flag);
}

/**
 * Check if multiple feature flags are enabled
 */
export function useTenantFeatures(flags: (keyof FeatureFlags)[]): Record<string, boolean> {
  const { isFeatureEnabled } = useTenantContext();
  return useMemo(
    () =>
      flags.reduce(
        (acc, flag) => {
          acc[flag] = isFeatureEnabled(flag);
          return acc;
        },
        {} as Record<string, boolean>
      ),
    [flags, isFeatureEnabled]
  );
}

/**
 * Check if a module is enabled for the current user
 */
export function useModule(moduleId: ModuleId): boolean {
  const { isModuleEnabled } = useTenantContext();
  return isModuleEnabled(moduleId);
}

/**
 * Check if the current user has a specific permission
 */
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useTenantContext();
  return hasPermission(permission);
}

/**
 * Check multiple permissions at once
 */
export function usePermissions(permissions: Permission[]): Record<Permission, boolean> {
  const { hasPermission } = useTenantContext();
  return useMemo(
    () =>
      permissions.reduce(
        (acc, perm) => {
          acc[perm] = hasPermission(perm);
          return acc;
        },
        {} as Record<Permission, boolean>
      ),
    [permissions, hasPermission]
  );
}

/**
 * Get filtered navigation for current user
 */
export function useNavigation(): NavItemConfig[] {
  const { getNavigation } = useTenantContext();
  return useMemo(() => getNavigation(), [getNavigation]);
}

/**
 * Get tenant branding configuration
 */
export function useTenantBranding() {
  const { tenant } = useTenantContext();
  return tenant.branding;
}

/**
 * Get tenant theme configuration
 */
export function useTenantTheme() {
  const { tenant, currentDomain } = useTenantContext();
  // Domain theme overrides tenant theme
  return {
    ...tenant.branding.theme,
    ...currentDomain.theme,
  };
}

/**
 * Get domain switcher state and controls
 */
export function useDomainSwitcher() {
  const { tenant, currentDomain, currentRole, switchDomain } = useTenantContext();

  const availableDomains = useMemo(
    () => tenant.serviceDomains.filter((d) => d.availableRoles.includes(currentRole.id)),
    [tenant.serviceDomains, currentRole.id]
  );

  const canSwitch = currentRole.canSwitchDomain && availableDomains.length > 1;

  return {
    currentDomain,
    availableDomains,
    canSwitch,
    switchDomain,
  };
}

/**
 * Get loading and error state
 */
export function useTenantStatus() {
  const { isLoading, error, reloadConfig } = useTenantContext();
  return { isLoading, error, reloadConfig };
}
