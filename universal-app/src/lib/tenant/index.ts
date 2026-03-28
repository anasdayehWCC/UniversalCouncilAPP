/**
 * Tenant Configuration Module
 *
 * Provides comprehensive multi-tenant SaaS configuration for the Universal Council App.
 * This module handles tenant configuration, service domains, roles, modules, and feature flags.
 *
 * @example
 * ```tsx
 * // In your app layout or provider
 * import { TenantProvider, useCurrentTenant, useTenantFeature } from '@/lib/tenant';
 *
 * function App() {
 *   return (
 *     <TenantProvider>
 *       <YourApp />
 *     </TenantProvider>
 *   );
 * }
 *
 * // In a component
 * function MyComponent() {
 *   const tenant = useCurrentTenant();
 *   const isSmartCaptureEnabled = useTenantFeature('smartCapture');
 *
 *   return (
 *     <div style={{ background: tenant.branding.theme.gradient }}>
 *       {isSmartCaptureEnabled && <SmartCaptureButton />}
 *     </div>
 *   );
 * }
 * ```
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Core identifiers
  TenantId,
  ServiceDomainId,
  RoleId,
  ModuleId,
  
  // Configuration types
  TenantConfig,
  ServiceDomainConfig,
  RoleConfig,
  ModuleConfig,
  NavItemConfig,
  
  // Branding
  BrandingConfig,
  ThemeConfig,
  LogoConfig,
  
  // Feature flags
  FeatureFlags,
  FeatureFlagDefinition,
  
  // Permissions
  Permission,
  
  // Modules
  ModuleStatus,
  
  // Integrations
  IntegrationType,
  IntegrationConfig,
  
  // Environment & Localization
  EnvironmentConfig,
  LocalizationConfig,
  
  // Loading
  ConfigSource,
  ConfigLoadResult,
  ConfigOverrides,
  
  // Context
  TenantContextValue,
} from './types';

// ============================================================================
// Default Exports
// ============================================================================

export {
  // Theme defaults
  DEFAULT_THEME,
  DEFAULT_LOCALIZATION,
  DEFAULT_FEATURE_FLAGS,
  
  // Configuration defaults
  DEFAULT_SERVICE_DOMAINS,
  DEFAULT_ROLES,
  DEFAULT_MODULES,
  DEFAULT_TENANT_CONFIG,
  
  // Helper functions
  getDefaultNavigation,
  getDefaultModules,
  createTenantConfig,
} from './defaults';

// ============================================================================
// Config Loader Exports
// ============================================================================

export {
  // Loading functions
  loadTenantConfig,
  getCachedConfig,
  clearConfigCache,
  reloadConfig,
  
  // Override functions
  applyConfigOverrides,
  
  // Subscription functions
  subscribeToConfigChanges,
  notifyConfigChange,
  startConfigPolling,
  
  // Utility functions
  detectTenantId,
  getAvailableTenants,
  isValidTenant,
  getTenantDisplayName,
} from './config-loader';

// ============================================================================
// Context & Hook Exports
// ============================================================================

export {
  // Provider
  TenantProvider,
  
  // Core hooks
  useTenantContext,
  useCurrentTenant,
  useCurrentDomain,
  useCurrentRole,
  
  // Feature hooks
  useTenantFeature,
  useTenantFeatures,
  useModule,
  
  // Permission hooks
  usePermission,
  usePermissions,
  
  // Navigation hooks
  useNavigation,
  
  // Branding hooks
  useTenantBranding,
  useTenantTheme,
  
  // Domain switcher
  useDomainSwitcher,
  
  // Status hooks
  useTenantStatus,
} from './tenant-context';

// ============================================================================
// Static Config Exports
// ============================================================================

export { wccConfig } from './configs/wcc.config';
export { rbkcConfig } from './configs/rbkc.config';
export { demoConfig } from './configs/demo.config';
