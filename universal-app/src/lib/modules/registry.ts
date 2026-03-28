/**
 * Module Registry
 * 
 * Singleton class that manages module registration, dependency resolution,
 * and tenant-aware module status.
 */

import type {
  ModuleDefinition,
  ModuleRegistryState,
  ModuleEnabledResult,
  ResolvedModule,
  TenantModuleConfig,
  ModuleStatus,
  ModuleQueryOptions,
  ModuleRegisterOptions,
  ModuleNavItem,
  ModuleRoute,
  ModuleEvent,
  ModuleEventType,
  ModuleEventListener,
  ModuleAuthContext,
} from './types';
import type { ServiceDomain, UserRole } from '@/config/domains';

/**
 * ModuleRegistry - Singleton class for managing modules
 */
class ModuleRegistry {
  private static instance: ModuleRegistry | null = null;
  private state: ModuleRegistryState;
  private listeners: Map<ModuleEventType | '*', Set<ModuleEventListener>>;

  private constructor() {
    this.state = {
      modules: new Map(),
      tenantConfigs: new Map(),
      currentTenantId: null,
      currentDomain: null,
      initialized: false,
    };
    this.listeners = new Map();
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  /**
   * Reset the registry (useful for testing)
   */
  static resetInstance(): void {
    ModuleRegistry.instance = null;
  }

  /**
   * Initialize the registry with tenant context
   */
  initialize(tenantId: string, domain: ServiceDomain): void {
    this.state.currentTenantId = tenantId;
    this.state.currentDomain = domain;
    this.state.initialized = true;
    this.emit({ type: 'registry:initialized', tenantId, timestamp: new Date() });
  }

  /**
   * Set current tenant context
   */
  setTenant(tenantId: string, domain: ServiceDomain): void {
    const previousTenantId = this.state.currentTenantId;
    this.state.currentTenantId = tenantId;
    this.state.currentDomain = domain;

    // Call tenant change hooks
    if (previousTenantId !== tenantId) {
      this.state.modules.forEach((module) => {
        module.hooks?.onTenantChange?.(tenantId, domain);
      });
      this.emit({ type: 'tenant:changed', tenantId, timestamp: new Date() });
    }
  }

  /**
   * Register a module
   */
  async registerModule(
    definition: ModuleDefinition,
    options: ModuleRegisterOptions = {}
  ): Promise<void> {
    // Validate module definition
    this.validateModuleDefinition(definition);

    // Check dependencies unless skipped
    if (!options.skipDependencyCheck) {
      const missingDeps = this.checkDependencies(definition);
      if (missingDeps.length > 0) {
        throw new Error(
          `Module "${definition.id}" has unmet dependencies: ${missingDeps.join(', ')}`
        );
      }
    }

    // Register the module
    this.state.modules.set(definition.id, definition);

    // Call onRegister hook unless skipped
    if (!options.skipHooks && definition.hooks?.onRegister) {
      await definition.hooks.onRegister();
    }

    this.emit({
      type: 'module:registered',
      moduleId: definition.id,
      timestamp: new Date(),
    });
  }

  /**
   * Unregister a module
   */
  unregisterModule(moduleId: string): boolean {
    const module = this.state.modules.get(moduleId);
    if (!module) return false;

    // Check if other modules depend on this one
    const dependents = this.getDependents(moduleId);
    if (dependents.length > 0) {
      throw new Error(
        `Cannot unregister "${moduleId}": required by ${dependents.join(', ')}`
      );
    }

    this.state.modules.delete(moduleId);
    return true;
  }

  /**
   * Get a module by ID
   */
  getModule(moduleId: string): ModuleDefinition | undefined {
    return this.state.modules.get(moduleId);
  }

  /**
   * Get all registered modules
   */
  getModules(options: ModuleQueryOptions = {}): ModuleDefinition[] {
    let modules = Array.from(this.state.modules.values());

    // Filter by status
    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      modules = modules.filter((m) => {
        const { status } = this.isModuleEnabled(m.id);
        return statuses.includes(status);
      });
    }

    // Filter by category
    if (options.category) {
      const categories = Array.isArray(options.category) ? options.category : [options.category];
      modules = modules.filter((m) => categories.includes(m.category));
    }

    // Filter by domain
    if (options.domain) {
      modules = modules.filter(
        (m) => m.availableDomains === 'all' || m.availableDomains.includes(options.domain!)
      );
    }

    // Filter out disabled unless explicitly included
    if (!options.includeDisabled) {
      modules = modules.filter((m) => this.isModuleEnabled(m.id).enabled);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      modules = modules.filter((m) =>
        options.tags!.some((tag) => m.tags?.includes(tag))
      );
    }

    return modules;
  }

  /**
   * Get resolved module with computed state
   */
  getResolvedModule(moduleId: string, authContext?: ModuleAuthContext): ResolvedModule | undefined {
    const module = this.getModule(moduleId);
    if (!module) return undefined;

    const enabledResult = this.isModuleEnabled(moduleId);
    const resolvedRoutes = authContext
      ? this.filterRoutesByAuth(module.routes, authContext)
      : module.routes;

    return {
      ...module,
      isEnabled: enabledResult.enabled,
      currentStatus: enabledResult.status,
      resolvedRoutes,
      dependenciesSatisfied: !enabledResult.missingDependencies?.length,
    };
  }

  /**
   * Check if a module is enabled for current tenant
   */
  isModuleEnabled(moduleId: string): ModuleEnabledResult {
    const module = this.state.modules.get(moduleId);
    
    if (!module) {
      return {
        enabled: false,
        status: 'disabled',
        reason: 'Module not found',
      };
    }

    // Core modules are always enabled
    if (module.isCore) {
      return { enabled: true, status: 'enabled' };
    }

    // Check domain availability
    const currentDomain = this.state.currentDomain;
    if (currentDomain && module.availableDomains !== 'all') {
      if (!module.availableDomains.includes(currentDomain)) {
        return {
          enabled: false,
          status: 'disabled',
          reason: `Not available for domain: ${currentDomain}`,
        };
      }
    }

    // Check tenant-specific config
    const tenantConfig = this.getTenantModuleConfig(moduleId);
    if (tenantConfig) {
      const status = tenantConfig.status;
      return {
        enabled: status === 'enabled' || status === 'beta',
        status,
      };
    }

    // Check dependencies
    const missingDeps = this.checkDependencies(module);
    if (missingDeps.length > 0) {
      return {
        enabled: false,
        status: 'disabled',
        reason: 'Missing dependencies',
        missingDependencies: missingDeps,
      };
    }

    // Use default status
    const defaultStatus = module.defaultStatus;
    return {
      enabled: defaultStatus === 'enabled' || defaultStatus === 'beta',
      status: defaultStatus,
    };
  }

  /**
   * Set module status for a tenant
   */
  async setModuleStatus(
    moduleId: string,
    status: ModuleStatus,
    tenantId?: string
  ): Promise<void> {
    const module = this.state.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module "${moduleId}" not found`);
    }

    if (module.isCore) {
      throw new Error(`Cannot change status of core module "${moduleId}"`);
    }

    const targetTenantId = tenantId || this.state.currentTenantId;
    if (!targetTenantId) {
      throw new Error('No tenant context available');
    }

    // Get or create tenant config map
    if (!this.state.tenantConfigs.has(targetTenantId)) {
      this.state.tenantConfigs.set(targetTenantId, new Map());
    }

    const tenantConfigs = this.state.tenantConfigs.get(targetTenantId)!;
    const currentConfig = tenantConfigs.get(moduleId) || { status };

    tenantConfigs.set(moduleId, { ...currentConfig, status });

    // Call hooks
    if (status === 'enabled' || status === 'beta') {
      await module.hooks?.onEnable?.();
      this.emit({ type: 'module:enabled', moduleId, tenantId: targetTenantId, timestamp: new Date() });
    } else {
      await module.hooks?.onDisable?.();
      this.emit({ type: 'module:disabled', moduleId, tenantId: targetTenantId, timestamp: new Date() });
    }
  }

  /**
   * Get navigation items from enabled modules
   */
  getNavigationItems(authContext: ModuleAuthContext): ModuleNavItem[] {
    const navItems: ModuleNavItem[] = [];

    this.getModules({ domain: authContext.domain }).forEach((module) => {
      module.routes.forEach((route) => {
        if (!route.showInNav) return;

        // Check auth
        if (!this.checkRouteAuth(route, authContext)) return;

        navItems.push({
          moduleId: module.id,
          routeId: route.id,
          label: route.label,
          href: route.path,
          icon: route.icon,
          description: route.description,
          order: route.navOrder ?? 100,
          featureFlag: route.featureFlag,
        });
      });
    });

    // Sort by order
    return navItems.sort((a, b) => a.order - b.order);
  }

  /**
   * Get all routes from enabled modules
   */
  getRoutes(authContext?: ModuleAuthContext): ModuleRoute[] {
    const routes: ModuleRoute[] = [];

    this.getModules({ domain: authContext?.domain }).forEach((module) => {
      let moduleRoutes = module.routes;
      
      if (authContext) {
        moduleRoutes = this.filterRoutesByAuth(moduleRoutes, authContext);
      }

      routes.push(...moduleRoutes);
    });

    return routes;
  }

  /**
   * Check if a route is accessible
   */
  isRouteAccessible(
    moduleId: string,
    routeId: string,
    authContext: ModuleAuthContext
  ): boolean {
    const module = this.getModule(moduleId);
    if (!module) return false;

    if (!this.isModuleEnabled(moduleId).enabled) return false;

    const route = this.findRoute(module.routes, routeId);
    if (!route) return false;

    return this.checkRouteAuth(route, authContext);
  }

  /**
   * Subscribe to module events
   */
  subscribe(
    eventType: ModuleEventType | '*',
    listener: ModuleEventListener
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  /**
   * Get modules that depend on a given module
   */
  getDependents(moduleId: string): string[] {
    const dependents: string[] = [];

    this.state.modules.forEach((module, id) => {
      const hasDependency = module.dependencies.some(
        (dep) => dep.moduleId === moduleId && !dep.optional
      );
      if (hasDependency) {
        dependents.push(id);
      }
    });

    return dependents;
  }

  /**
   * Get dependency graph for visualization
   */
  getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    this.state.modules.forEach((module) => {
      graph.set(
        module.id,
        module.dependencies
          .filter((d) => !d.optional)
          .map((d) => d.moduleId)
      );
    });

    return graph;
  }

  /**
   * Topologically sort modules based on dependencies
   */
  getLoadOrder(): string[] {
    const visited = new Set<string>();
    const sorted: string[] = [];

    const visit = (moduleId: string) => {
      if (visited.has(moduleId)) return;
      visited.add(moduleId);

      const module = this.state.modules.get(moduleId);
      if (!module) return;

      module.dependencies.forEach((dep) => {
        visit(dep.moduleId);
      });

      sorted.push(moduleId);
    };

    this.state.modules.forEach((_, id) => visit(id));

    return sorted;
  }

  // Private methods

  private validateModuleDefinition(definition: ModuleDefinition): void {
    if (!definition.id) {
      throw new Error('Module must have an id');
    }
    if (!definition.name) {
      throw new Error(`Module "${definition.id}" must have a name`);
    }
    if (!definition.version) {
      throw new Error(`Module "${definition.id}" must have a version`);
    }
    if (this.state.modules.has(definition.id)) {
      throw new Error(`Module "${definition.id}" is already registered`);
    }
  }

  private checkDependencies(module: ModuleDefinition): string[] {
    const missing: string[] = [];

    module.dependencies.forEach((dep) => {
      if (dep.optional) return;

      const depModule = this.state.modules.get(dep.moduleId);
      if (!depModule) {
        missing.push(dep.moduleId);
      } else if (!this.isModuleEnabled(dep.moduleId).enabled) {
        missing.push(dep.moduleId);
      }
    });

    return missing;
  }

  private getTenantModuleConfig(moduleId: string): TenantModuleConfig | undefined {
    const tenantId = this.state.currentTenantId;
    if (!tenantId) return undefined;

    return this.state.tenantConfigs.get(tenantId)?.get(moduleId);
  }

  private checkRouteAuth(route: ModuleRoute, context: ModuleAuthContext): boolean {
    const { auth } = route;

    // Check if auth is required
    if (!auth.requiresAuth) return true;

    // Check role
    if (auth.allowedRoles.length > 0 && !auth.allowedRoles.includes(context.role)) {
      return false;
    }

    // Check domain
    if (auth.allowedDomains.length > 0 && !auth.allowedDomains.includes(context.domain)) {
      return false;
    }

    // Custom check
    if (auth.customCheck && !auth.customCheck(context)) {
      return false;
    }

    return true;
  }

  private filterRoutesByAuth(routes: ModuleRoute[], context: ModuleAuthContext): ModuleRoute[] {
    return routes
      .filter((route) => this.checkRouteAuth(route, context))
      .map((route) => ({
        ...route,
        children: route.children
          ? this.filterRoutesByAuth(route.children, context)
          : undefined,
      }));
  }

  private findRoute(routes: ModuleRoute[], routeId: string): ModuleRoute | undefined {
    for (const route of routes) {
      if (route.id === routeId) return route;
      if (route.children) {
        const found = this.findRoute(route.children, routeId);
        if (found) return found;
      }
    }
    return undefined;
  }

  private emit(event: ModuleEvent): void {
    // Notify specific listeners
    this.listeners.get(event.type)?.forEach((listener) => listener(event));

    // Notify wildcard listeners
    this.listeners.get('*')?.forEach((listener) => listener(event));
  }
}

// Export singleton instance getter
export const getModuleRegistry = ModuleRegistry.getInstance.bind(ModuleRegistry);

// Export class for testing
export { ModuleRegistry };
