/**
 * Module Registry Type Definitions
 * 
 * This file defines the core types for the module system that enables
 * dynamic feature loading based on tenant configuration.
 */

import type { LucideIcon } from 'lucide-react';
import type { ServiceDomain, UserRole } from '@/config/domains';

/**
 * Module status indicating availability and lifecycle stage
 */
export type ModuleStatus = 'enabled' | 'disabled' | 'beta' | 'deprecated';

/**
 * Route authentication requirements
 */
export interface RouteAuthRequirements {
  /** Whether authentication is required for this route */
  requiresAuth: boolean;
  /** Roles that can access this route. Empty array means all authenticated users. */
  allowedRoles: UserRole[];
  /** Domains that can access this route. Empty array means all domains. */
  allowedDomains: ServiceDomain[];
  /** Optional custom permission check function */
  customCheck?: (context: ModuleAuthContext) => boolean;
}

/**
 * Context passed to custom auth checks
 */
export interface ModuleAuthContext {
  userId: string;
  role: UserRole;
  domain: ServiceDomain;
  tenantId: string;
  permissions?: string[];
}

/**
 * Defines a route within a module
 */
export interface ModuleRoute {
  /** Unique route identifier within the module */
  id: string;
  /** URL path for this route */
  path: string;
  /** Display label for navigation */
  label: string;
  /** Icon for navigation (from lucide-react) */
  icon?: LucideIcon;
  /** Brief description of the route */
  description?: string;
  /** Layout to use for this route */
  layout?: 'default' | 'fullscreen' | 'minimal' | 'admin';
  /** Authentication and authorization requirements */
  auth: RouteAuthRequirements;
  /** Whether this route should appear in navigation */
  showInNav?: boolean;
  /** Navigation order (lower = higher priority) */
  navOrder?: number;
  /** Child routes */
  children?: ModuleRoute[];
  /** Feature flag that controls this route's visibility */
  featureFlag?: string;
}

/**
 * Defines a dependency on another module
 */
export interface ModuleDependency {
  /** ID of the required module */
  moduleId: string;
  /** Minimum version required (semver) */
  minVersion?: string;
  /** Whether this dependency is optional */
  optional?: boolean;
  /** Reason for this dependency */
  reason?: string;
}

/**
 * Navigation item derived from module routes
 */
export interface ModuleNavItem {
  /** Module ID this nav item belongs to */
  moduleId: string;
  /** Route ID within the module */
  routeId: string;
  /** Display label */
  label: string;
  /** URL path */
  href: string;
  /** Icon component */
  icon?: LucideIcon;
  /** Description for tooltips */
  description?: string;
  /** Order in navigation */
  order: number;
  /** Feature flag requirement */
  featureFlag?: string;
}

/**
 * Permission definition for a module
 */
export interface ModulePermission {
  /** Unique permission identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this permission allows */
  description: string;
  /** Default roles that have this permission */
  defaultRoles: UserRole[];
}

/**
 * Hooks that modules can define for lifecycle events
 */
export interface ModuleHooks {
  /** Called when module is enabled */
  onEnable?: () => void | Promise<void>;
  /** Called when module is disabled */
  onDisable?: () => void | Promise<void>;
  /** Called when module is loaded into registry */
  onRegister?: () => void | Promise<void>;
  /** Called when tenant context changes */
  onTenantChange?: (tenantId: string, domain: ServiceDomain) => void | Promise<void>;
}

/**
 * Module configuration specific to a tenant
 */
export interface TenantModuleConfig {
  /** Module status for this tenant */
  status: ModuleStatus;
  /** Custom configuration overrides */
  config?: Record<string, unknown>;
  /** Enabled feature flags */
  enabledFeatures?: string[];
  /** Disabled routes */
  disabledRoutes?: string[];
}

/**
 * Full module definition
 */
export interface ModuleDefinition {
  /** Unique module identifier */
  id: string;
  /** Human-readable module name */
  name: string;
  /** Module description */
  description: string;
  /** Module version (semver) */
  version: string;
  /** Default status if not specified in tenant config */
  defaultStatus: ModuleStatus;
  /** Module icon for admin UI */
  icon?: LucideIcon;
  /** Module category for grouping */
  category: ModuleCategory;
  /** Routes provided by this module */
  routes: ModuleRoute[];
  /** Permissions defined by this module */
  permissions: ModulePermission[];
  /** Dependencies on other modules */
  dependencies: ModuleDependency[];
  /** Lifecycle hooks */
  hooks?: ModuleHooks;
  /** Service domains this module is available for */
  availableDomains: ServiceDomain[] | 'all';
  /** Whether this module is a core module (cannot be disabled) */
  isCore?: boolean;
  /** Tags for filtering and searching */
  tags?: string[];
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Module categories for organization
 */
export type ModuleCategory =
  | 'capture'      // Recording, transcription, input
  | 'processing'   // AI processing, analysis
  | 'output'       // Minutes, reports, exports
  | 'review'       // Approval, QA workflows
  | 'analytics'    // Insights, dashboards
  | 'admin'        // Administration, configuration
  | 'integration'  // External system integrations
  | 'utility';     // Helper modules

/**
 * Module registry state
 */
export interface ModuleRegistryState {
  /** All registered modules */
  modules: Map<string, ModuleDefinition>;
  /** Module status per tenant: tenantId -> moduleId -> config */
  tenantConfigs: Map<string, Map<string, TenantModuleConfig>>;
  /** Current tenant ID */
  currentTenantId: string | null;
  /** Current domain */
  currentDomain: ServiceDomain | null;
  /** Whether registry has been initialized */
  initialized: boolean;
}

/**
 * Result of checking if a module is enabled
 */
export interface ModuleEnabledResult {
  /** Whether the module is enabled */
  enabled: boolean;
  /** Module status */
  status: ModuleStatus;
  /** Reason if disabled */
  reason?: string;
  /** Missing dependencies */
  missingDependencies?: string[];
}

/**
 * Resolved module with computed properties
 */
export interface ResolvedModule extends ModuleDefinition {
  /** Computed enabled state */
  isEnabled: boolean;
  /** Computed status */
  currentStatus: ModuleStatus;
  /** Resolved routes (filtered by permissions) */
  resolvedRoutes: ModuleRoute[];
  /** Whether all dependencies are satisfied */
  dependenciesSatisfied: boolean;
}

/**
 * Options for querying modules
 */
export interface ModuleQueryOptions {
  /** Filter by status */
  status?: ModuleStatus | ModuleStatus[];
  /** Filter by category */
  category?: ModuleCategory | ModuleCategory[];
  /** Filter by domain */
  domain?: ServiceDomain;
  /** Include disabled modules */
  includeDisabled?: boolean;
  /** Filter by tags */
  tags?: string[];
}

/**
 * Options for module registration
 */
export interface ModuleRegisterOptions {
  /** Override default status */
  status?: ModuleStatus;
  /** Skip dependency check */
  skipDependencyCheck?: boolean;
  /** Skip calling onRegister hook */
  skipHooks?: boolean;
}

/**
 * Module event types for subscription
 */
export type ModuleEventType =
  | 'module:registered'
  | 'module:enabled'
  | 'module:disabled'
  | 'module:updated'
  | 'tenant:changed'
  | 'registry:initialized';

/**
 * Module event payload
 */
export interface ModuleEvent {
  type: ModuleEventType;
  moduleId?: string;
  tenantId?: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

/**
 * Event listener function
 */
export type ModuleEventListener = (event: ModuleEvent) => void;
