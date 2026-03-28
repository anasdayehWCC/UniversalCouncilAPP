/**
 * Module System Index
 * 
 * Main entry point for the module registry system.
 * Re-exports all public APIs.
 */

// Types
export type {
  ModuleDefinition,
  ModuleStatus,
  ModuleRoute,
  ModuleDependency,
  ModulePermission,
  ModuleCategory,
  ModuleNavItem,
  ModuleAuthContext,
  ModuleEnabledResult,
  ResolvedModule,
  TenantModuleConfig,
  ModuleQueryOptions,
  ModuleRegisterOptions,
  ModuleEvent,
  ModuleEventType,
  ModuleEventListener,
  ModuleHooks,
  RouteAuthRequirements,
} from './types';

// Registry
export { ModuleRegistry, getModuleRegistry } from './registry';

// Context and hooks
export {
  ModuleProvider,
  useModuleContext,
  useModule,
  useModules,
  useModuleRoutes,
  useRouteAccess,
  useModuleEvents,
  useModuleAdmin,
} from './module-context';

// Core modules
export {
  registerCoreModules,
  initializeModules,
  allModuleDefinitions,
  recordingModule,
  transcriptionModule,
  minutesModule,
  reviewModule,
  insightsModule,
  adminModule,
  templatesModule,
} from './core-modules';

// Module definition exports
export { coreModuleIds, featureModuleIds } from './definitions';
