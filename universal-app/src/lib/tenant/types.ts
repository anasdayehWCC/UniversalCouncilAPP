/**
 * Tenant Configuration Types
 *
 * Comprehensive type definitions for multi-tenant SaaS configuration.
 * Supports multiple councils, departments, roles, and feature configurations.
 */

import type { LucideIcon } from 'lucide-react';

// ============================================================================
// Core Identifiers
// ============================================================================

/** Unique identifier for a tenant (council) */
export type TenantId = string;

/** Service domain identifiers */
export type ServiceDomainId = 'children' | 'adults' | 'housing' | 'corporate' | 'education' | 'health';

/** User role identifiers */
export type RoleId =
  | 'social_worker'
  | 'manager'
  | 'senior_manager'
  | 'admin'
  | 'housing_officer'
  | 'quality_assurance'
  | 'team_lead'
  | 'support';

/** Module identifiers for tenant feature toggles */
export type ModuleId =
  | 'smart_capture'
  | 'transcription'
  | 'templates'
  | 'review_workflow'
  | 'ai_insights'
  | 'case_management'
  | 'task_management'
  | 'team_dashboard'
  | 'analytics'
  | 'audit_log'
  | 'integrations'
  | 'bulk_operations'
  | 'offline_mode'
  | 'export_pdf'
  | 'export_word'
  | 'mosaic_sync'
  | 'liquid_logic_sync';

// ============================================================================
// Branding Configuration
// ============================================================================

/** Theme configuration for visual branding */
export interface ThemeConfig {
  /** Primary brand color (hex) */
  primary: string;
  /** Secondary/accent color (hex) */
  accent: string;
  /** Background gradient CSS value */
  gradient: string;
  /** Optional dark mode primary */
  primaryDark?: string;
  /** Optional dark mode accent */
  accentDark?: string;
  /** Font family for headings */
  fontHeading?: string;
  /** Font family for body text */
  fontBody?: string;
  /** Border radius scale (sm, md, lg) */
  borderRadius?: 'sm' | 'md' | 'lg';
}

/** Logo configuration */
export interface LogoConfig {
  /** URL to the primary logo (light background) */
  light: string;
  /** URL to the logo for dark backgrounds */
  dark: string;
  /** Alt text for accessibility */
  alt: string;
  /** Optional favicon URL */
  favicon?: string;
  /** Logo width in pixels */
  width?: number;
  /** Logo height in pixels */
  height?: number;
}

/** Complete branding configuration */
export interface BrandingConfig {
  /** Council/organization name */
  name: string;
  /** Short name for compact displays */
  shortName: string;
  /** Theme configuration */
  theme: ThemeConfig;
  /** Logo configuration */
  logo: LogoConfig;
  /** Email domain for the organization */
  emailDomain?: string;
  /** Support email address */
  supportEmail?: string;
  /** Terms of service URL */
  termsUrl?: string;
  /** Privacy policy URL */
  privacyUrl?: string;
}

// ============================================================================
// Service Domain Configuration
// ============================================================================

/** Configuration for a service domain (department) */
export interface ServiceDomainConfig {
  /** Unique domain identifier */
  id: ServiceDomainId;
  /** Display name */
  name: string;
  /** Authority/council label for this domain */
  authorityLabel: string;
  /** Persona display label */
  personaLabel: string;
  /** Domain-specific theme overrides */
  theme: ThemeConfig;
  /** Available roles in this domain */
  availableRoles: RoleId[];
  /** Enabled modules for this domain */
  enabledModules: ModuleId[];
  /** Default templates for this domain */
  defaultTemplates?: string[];
  /** Domain-specific settings */
  settings?: Record<string, unknown>;
}

// ============================================================================
// Role Configuration
// ============================================================================

/** Permission types */
export type Permission =
  | 'read:own'
  | 'read:team'
  | 'read:all'
  | 'write:own'
  | 'write:team'
  | 'write:all'
  | 'delete:own'
  | 'delete:team'
  | 'delete:all'
  | 'approve:team'
  | 'approve:all'
  | 'admin:users'
  | 'admin:config'
  | 'admin:audit'
  | 'admin:modules'
  | 'export:basic'
  | 'export:bulk'
  | 'integrations:read'
  | 'integrations:write';

/** Navigation item configuration */
export interface NavItemConfig {
  /** Display label */
  label: string;
  /** Route path */
  href: string;
  /** Icon name (Lucide icon key) */
  icon: string;
  /** Optional description */
  description?: string;
  /** Feature flag that controls visibility */
  featureFlag?: string;
  /** Required permission to see this item */
  requiredPermission?: Permission;
  /** Badge content (e.g., notification count) */
  badge?: string | number;
  /** Child navigation items */
  children?: NavItemConfig[];
}

/** Role configuration */
export interface RoleConfig {
  /** Unique role identifier */
  id: RoleId;
  /** Display name */
  name: string;
  /** Role description */
  description: string;
  /** Permissions granted to this role */
  permissions: Permission[];
  /** Navigation items for this role */
  navigation: NavItemConfig[];
  /** Accessible modules */
  modules: ModuleId[];
  /** Dashboard widgets for this role */
  dashboardWidgets?: string[];
  /** Quick actions available */
  quickActions?: string[];
  /** Can this role switch domains? */
  canSwitchDomain?: boolean;
  /** Role hierarchy level (higher = more authority) */
  hierarchyLevel: number;
}

// ============================================================================
// Module Configuration
// ============================================================================

/** Module status */
export type ModuleStatus = 'enabled' | 'disabled' | 'beta' | 'coming_soon' | 'deprecated';

/** Module configuration */
export interface ModuleConfig {
  /** Unique module identifier */
  id: ModuleId;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Current status */
  status: ModuleStatus;
  /** Roles that can access this module */
  allowedRoles: RoleId[];
  /** Domains where this module is available */
  allowedDomains: ServiceDomainId[];
  /** Module-specific settings */
  settings?: Record<string, unknown>;
  /** Required modules (dependencies) */
  dependencies?: ModuleId[];
  /** Routes this module adds */
  routes?: string[];
  /** Version string */
  version?: string;
}

// ============================================================================
// Feature Flags
// ============================================================================

/** Feature flag definition */
export interface FeatureFlagDefinition {
  /** Flag key */
  key: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Default value */
  defaultValue: boolean;
  /** Roles that can toggle this flag */
  toggleableBy?: RoleId[];
  /** Domains where this flag applies */
  applicableDomains?: ServiceDomainId[];
  /** Is this a beta feature? */
  isBeta?: boolean;
  /** Rollout percentage (0-100) */
  rolloutPercentage?: number;
}

/** Feature flags state */
export interface FeatureFlags {
  /** AI-powered insights enabled */
  aiInsights: boolean;
  /** Housing pilot features */
  housingPilot: boolean;
  /** Smart capture (audio recording) */
  smartCapture: boolean;
  /** Offline mode support */
  offlineMode: boolean;
  /** Advanced analytics */
  advancedAnalytics: boolean;
  /** Case management integration */
  caseManagement: boolean;
  /** Bulk operations */
  bulkOperations: boolean;
  /** Dark mode */
  darkMode: boolean;
  /** New UI experiment */
  newUiExperiment: boolean;
  /** Custom tenant flag (extensible) */
  [key: string]: boolean;
}

// ============================================================================
// Integration Configuration
// ============================================================================

/** External system integration types */
export type IntegrationType =
  | 'mosaic'
  | 'liquid_logic'
  | 'azure_ad'
  | 'sharepoint'
  | 'teams'
  | 'outlook'
  | 'power_automate'
  | 'custom_api';

/** Integration configuration */
export interface IntegrationConfig {
  /** Integration type */
  type: IntegrationType;
  /** Display name */
  name: string;
  /** Is this integration enabled? */
  enabled: boolean;
  /** API endpoint (if applicable) */
  endpoint?: string;
  /** Sync direction */
  syncDirection?: 'inbound' | 'outbound' | 'bidirectional';
  /** Sync frequency in minutes */
  syncFrequency?: number;
  /** Field mappings */
  fieldMappings?: Record<string, string>;
  /** Additional settings */
  settings?: Record<string, unknown>;
}

// ============================================================================
// Complete Tenant Configuration
// ============================================================================

/** Environment configuration */
export interface EnvironmentConfig {
  /** API base URL */
  apiBaseUrl: string;
  /** Authentication provider */
  authProvider: 'azure_ad' | 'auth0' | 'mock';
  /** Azure AD tenant ID (if using Azure AD) */
  azureAdTenantId?: string;
  /** Azure AD client ID */
  azureAdClientId?: string;
  /** PostHog API key */
  posthogKey?: string;
  /** Sentry DSN */
  sentryDsn?: string;
  /** Enable debug mode */
  debug?: boolean;
}

/** Localization configuration */
export interface LocalizationConfig {
  /** Default locale */
  defaultLocale: string;
  /** Available locales */
  availableLocales: string[];
  /** Date format */
  dateFormat: string;
  /** Time format */
  timeFormat: string;
  /** Timezone */
  timezone: string;
  /** Currency code */
  currency?: string;
}

/** Complete tenant configuration */
export interface TenantConfig {
  /** Unique tenant identifier */
  id: TenantId;
  /** Tenant slug (URL-safe identifier) */
  slug: string;
  /** Branding configuration */
  branding: BrandingConfig;
  /** Available service domains */
  serviceDomains: ServiceDomainConfig[];
  /** Role configurations */
  roles: RoleConfig[];
  /** Module configurations */
  modules: ModuleConfig[];
  /** Feature flags */
  featureFlags: FeatureFlags;
  /** Feature flag definitions */
  featureFlagDefinitions?: FeatureFlagDefinition[];
  /** Integration configurations */
  integrations: IntegrationConfig[];
  /** Environment configuration */
  environment?: EnvironmentConfig;
  /** Localization settings */
  localization: LocalizationConfig;
  /** Default service domain */
  defaultDomain: ServiceDomainId;
  /** Is this tenant active? */
  isActive: boolean;
  /** Tenant creation date */
  createdAt?: string;
  /** Last updated date */
  updatedAt?: string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Configuration Loading Types
// ============================================================================

/** Configuration source */
export type ConfigSource = 'environment' | 'api' | 'static' | 'hybrid';

/** Configuration load result */
export interface ConfigLoadResult {
  /** Loaded configuration */
  config: TenantConfig;
  /** Source of the configuration */
  source: ConfigSource;
  /** When the config was loaded */
  loadedAt: Date;
  /** Cache TTL in seconds */
  ttl: number;
  /** Is this from cache? */
  fromCache: boolean;
}

/** Configuration override options */
export interface ConfigOverrides {
  /** Feature flag overrides */
  featureFlags?: Partial<FeatureFlags>;
  /** Module status overrides */
  modules?: Partial<Record<ModuleId, ModuleStatus>>;
  /** Branding overrides */
  branding?: Partial<BrandingConfig>;
  /** Environment overrides */
  environment?: Partial<EnvironmentConfig>;
}

/** Tenant context value exposed via React context */
export interface TenantContextValue {
  /** Current tenant configuration */
  tenant: TenantConfig;
  /** Current service domain */
  currentDomain: ServiceDomainConfig;
  /** Current user role */
  currentRole: RoleConfig;
  /** Is configuration loading? */
  isLoading: boolean;
  /** Configuration error */
  error: Error | null;
  /** Check if a feature is enabled */
  isFeatureEnabled: (flag: keyof FeatureFlags) => boolean;
  /** Check if a module is enabled */
  isModuleEnabled: (moduleId: ModuleId) => boolean;
  /** Check if user has permission */
  hasPermission: (permission: Permission) => boolean;
  /** Get navigation for current role */
  getNavigation: () => NavItemConfig[];
  /** Switch service domain */
  switchDomain: (domainId: ServiceDomainId) => void;
  /** Reload configuration */
  reloadConfig: () => Promise<void>;
  /** Apply configuration overrides */
  applyOverrides: (overrides: ConfigOverrides) => void;
}
