'use client';

/**
 * Module Context and Hooks
 * 
 * React integration for the module registry system.
 * Provides context and hooks for accessing modules throughout the app.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { getModuleRegistry, ModuleRegistry } from './registry';
import type {
  ModuleDefinition,
  ResolvedModule,
  ModuleNavItem,
  ModuleRoute,
  ModuleStatus,
  ModuleAuthContext,
  ModuleEvent,
  ModuleQueryOptions,
} from './types';
import type { ServiceDomain, UserRole } from '@/config/domains';

/**
 * Module context value
 */
interface ModuleContextValue {
  /** Whether the module system is initialized */
  initialized: boolean;
  /** Current tenant ID */
  tenantId: string | null;
  /** Current domain */
  domain: ServiceDomain | null;
  /** Auth context for permission checks */
  authContext: ModuleAuthContext | null;
  /** Module registry instance */
  registry: ModuleRegistry;
  /** Get all enabled modules */
  getModules: (options?: ModuleQueryOptions) => ModuleDefinition[];
  /** Get a specific module */
  getModule: (moduleId: string) => ModuleDefinition | undefined;
  /** Get resolved module with computed state */
  getResolvedModule: (moduleId: string) => ResolvedModule | undefined;
  /** Check if a module is enabled */
  isModuleEnabled: (moduleId: string) => boolean;
  /** Get navigation items */
  getNavigationItems: () => ModuleNavItem[];
  /** Get all routes */
  getRoutes: () => ModuleRoute[];
  /** Check route accessibility */
  isRouteAccessible: (moduleId: string, routeId: string) => boolean;
  /** Set module status (admin only) */
  setModuleStatus: (moduleId: string, status: ModuleStatus) => Promise<void>;
  /** Set tenant context */
  setTenant: (tenantId: string, domain: ServiceDomain) => void;
  /** Set auth context */
  setAuthContext: (context: ModuleAuthContext) => void;
}

const ModuleContext = createContext<ModuleContextValue | undefined>(undefined);

/**
 * Props for ModuleProvider
 */
interface ModuleProviderProps {
  children: ReactNode;
  /** Initial tenant ID */
  tenantId?: string;
  /** Initial domain */
  domain?: ServiceDomain;
  /** Initial user info for auth context */
  userId?: string;
  /** Initial role */
  role?: UserRole;
}

/**
 * ModuleProvider - Provides module context to the app
 */
export function ModuleProvider({
  children,
  tenantId: initialTenantId,
  domain: initialDomain,
  userId,
  role,
}: ModuleProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(initialTenantId ?? null);
  const [domain, setDomain] = useState<ServiceDomain | null>(initialDomain ?? null);
  const [authContext, setAuthContext] = useState<ModuleAuthContext | null>(null);
  const [, forceUpdate] = useState({});

  const registry = useMemo(() => getModuleRegistry(), []);

  // Initialize auth context from props
  useEffect(() => {
    if (userId && role && domain && tenantId) {
      setAuthContext({
        userId,
        role,
        domain,
        tenantId,
      });
    }
  }, [userId, role, domain, tenantId]);

  // Initialize registry with tenant context
  useEffect(() => {
    if (tenantId && domain) {
      registry.initialize(tenantId, domain);
      setInitialized(true);
    }
  }, [registry, tenantId, domain]);

  // Subscribe to registry events for re-renders
  useEffect(() => {
    const unsubscribe = registry.subscribe('*', () => {
      forceUpdate({});
    });
    return unsubscribe;
  }, [registry]);

  const setTenant = useCallback(
    (newTenantId: string, newDomain: ServiceDomain) => {
      setTenantId(newTenantId);
      setDomain(newDomain);
      registry.setTenant(newTenantId, newDomain);
      
      // Update auth context with new tenant/domain
      if (authContext) {
        setAuthContext({
          ...authContext,
          tenantId: newTenantId,
          domain: newDomain,
        });
      }
    },
    [registry, authContext]
  );

  const contextValue = useMemo<ModuleContextValue>(
    () => ({
      initialized,
      tenantId,
      domain,
      authContext,
      registry,
      getModules: (options) => registry.getModules(options),
      getModule: (moduleId) => registry.getModule(moduleId),
      getResolvedModule: (moduleId) =>
        registry.getResolvedModule(moduleId, authContext ?? undefined),
      isModuleEnabled: (moduleId) => registry.isModuleEnabled(moduleId).enabled,
      getNavigationItems: () =>
        authContext ? registry.getNavigationItems(authContext) : [],
      getRoutes: () => registry.getRoutes(authContext ?? undefined),
      isRouteAccessible: (moduleId, routeId) =>
        authContext
          ? registry.isRouteAccessible(moduleId, routeId, authContext)
          : false,
      setModuleStatus: (moduleId, status) =>
        registry.setModuleStatus(moduleId, status),
      setTenant,
      setAuthContext,
    }),
    [initialized, tenantId, domain, authContext, registry, setTenant]
  );

  return (
    <ModuleContext.Provider value={contextValue}>
      {children}
    </ModuleContext.Provider>
  );
}

/**
 * Hook to access the full module context
 */
export function useModuleContext(): ModuleContextValue {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModuleContext must be used within a ModuleProvider');
  }
  return context;
}

/**
 * Hook to get a specific module
 */
export function useModule(moduleId: string): {
  module: ResolvedModule | undefined;
  isEnabled: boolean;
  isLoading: boolean;
} {
  const { getResolvedModule, isModuleEnabled, initialized } = useModuleContext();

  const module = useMemo(() => getResolvedModule(moduleId), [getResolvedModule, moduleId]);
  const isEnabled = useMemo(() => isModuleEnabled(moduleId), [isModuleEnabled, moduleId]);

  return {
    module,
    isEnabled,
    isLoading: !initialized,
  };
}

/**
 * Hook to get all modules matching criteria
 */
export function useModules(options?: ModuleQueryOptions): {
  modules: ModuleDefinition[];
  isLoading: boolean;
} {
  const { getModules, initialized } = useModuleContext();

  const modules = useMemo(() => getModules(options), [getModules, options]);

  return {
    modules,
    isLoading: !initialized,
  };
}

/**
 * Hook to get navigation items from modules
 */
export function useModuleRoutes(): {
  navItems: ModuleNavItem[];
  routes: ModuleRoute[];
  isLoading: boolean;
} {
  const { getNavigationItems, getRoutes, initialized } = useModuleContext();

  const navItems = useMemo(() => getNavigationItems(), [getNavigationItems]);
  const routes = useMemo(() => getRoutes(), [getRoutes]);

  return {
    navItems,
    routes,
    isLoading: !initialized,
  };
}

/**
 * Hook to check if a route is accessible
 */
export function useRouteAccess(moduleId: string, routeId: string): {
  isAccessible: boolean;
  isLoading: boolean;
} {
  const { isRouteAccessible, initialized } = useModuleContext();

  const isAccessible = useMemo(
    () => isRouteAccessible(moduleId, routeId),
    [isRouteAccessible, moduleId, routeId]
  );

  return {
    isAccessible,
    isLoading: !initialized,
  };
}

/**
 * Hook to subscribe to module events
 */
export function useModuleEvents(
  callback: (event: ModuleEvent) => void,
  eventTypes?: (ModuleEvent['type'] | '*')[]
) {
  const { registry } = useModuleContext();

  useEffect(() => {
    const types = eventTypes ?? ['*'];
    const unsubscribes = types.map((type) =>
      registry.subscribe(type as ModuleEvent['type'] | '*', callback)
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [registry, callback, eventTypes]);
}

/**
 * Hook for module administration
 */
export function useModuleAdmin() {
  const { setModuleStatus, getModules, registry } = useModuleContext();

  const enableModule = useCallback(
    async (moduleId: string) => {
      await setModuleStatus(moduleId, 'enabled');
    },
    [setModuleStatus]
  );

  const disableModule = useCallback(
    async (moduleId: string) => {
      await setModuleStatus(moduleId, 'disabled');
    },
    [setModuleStatus]
  );

  const setBetaStatus = useCallback(
    async (moduleId: string) => {
      await setModuleStatus(moduleId, 'beta');
    },
    [setModuleStatus]
  );

  const deprecateModule = useCallback(
    async (moduleId: string) => {
      await setModuleStatus(moduleId, 'deprecated');
    },
    [setModuleStatus]
  );

  const getAllModules = useCallback(
    () => getModules({ includeDisabled: true }),
    [getModules]
  );

  const getDependencyGraph = useCallback(
    () => registry.getDependencyGraph(),
    [registry]
  );

  const getLoadOrder = useCallback(
    () => registry.getLoadOrder(),
    [registry]
  );

  return {
    enableModule,
    disableModule,
    setBetaStatus,
    deprecateModule,
    getAllModules,
    getDependencyGraph,
    getLoadOrder,
  };
}
