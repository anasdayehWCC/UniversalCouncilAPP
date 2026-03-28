/**
 * Core Modules Registration
 * 
 * Registers all core modules with the module registry.
 * This file should be imported early in the application bootstrap.
 */

import { getModuleRegistry } from './registry';
import {
  allModuleDefinitions,
  recordingModule,
  transcriptionModule,
  minutesModule,
  reviewModule,
  insightsModule,
  adminModule,
  templatesModule,
} from './definitions';
import type { ModuleDefinition } from './types';

/**
 * Register a single module with error handling
 */
async function safeRegisterModule(module: ModuleDefinition): Promise<boolean> {
  try {
    const registry = getModuleRegistry();
    await registry.registerModule(module, { skipDependencyCheck: true });
    return true;
  } catch (error) {
    console.error(`[ModuleRegistry] Failed to register module "${module.id}":`, error);
    return false;
  }
}

/**
 * Register all core modules in dependency order
 * 
 * Order matters - modules with dependencies should be registered
 * after their dependencies.
 */
export async function registerCoreModules(): Promise<void> {
  const registry = getModuleRegistry();
  
  // Registration order (respecting dependencies):
  // 1. Core modules with no dependencies
  // 2. Feature modules with no dependencies
  // 3. Modules that depend on others

  const registrationOrder: ModuleDefinition[] = [
    // Core modules first (no dependencies)
    adminModule,
    minutesModule,
    
    // Feature modules with no dependencies
    recordingModule,
    transcriptionModule,
    templatesModule,
    
    // Modules with dependencies
    reviewModule,      // depends on: minutes
    insightsModule,    // depends on: minutes, review (optional)
  ];

  console.log('[ModuleRegistry] Registering core modules...');

  for (const module of registrationOrder) {
    const success = await safeRegisterModule(module);
    if (success) {
      console.log(`[ModuleRegistry] Registered: ${module.id} (${module.category})`);
    }
  }

  console.log(`[ModuleRegistry] Registration complete. ${registry.getModules({ includeDisabled: true }).length} modules registered.`);
}

/**
 * Initialize the module registry with a tenant context
 */
export async function initializeModules(
  tenantId: string,
  domain: 'children' | 'adults' | 'housing' | 'corporate'
): Promise<void> {
  const registry = getModuleRegistry();
  
  // Register modules if not already done
  if (registry.getModules({ includeDisabled: true }).length === 0) {
    await registerCoreModules();
  }

  // Initialize with tenant context
  registry.initialize(tenantId, domain);
  
  console.log(`[ModuleRegistry] Initialized for tenant: ${tenantId}, domain: ${domain}`);
}

/**
 * Get the initialized module registry instance
 */
export { getModuleRegistry };

/**
 * Re-export module definitions for convenience
 */
export {
  allModuleDefinitions,
  recordingModule,
  transcriptionModule,
  minutesModule,
  reviewModule,
  insightsModule,
  adminModule,
  templatesModule,
};
