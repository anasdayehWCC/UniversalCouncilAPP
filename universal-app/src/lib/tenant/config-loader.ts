/**
 * Tenant Configuration Loader
 *
 * Handles loading tenant configuration from various sources:
 * - Environment variables
 * - Backend API
 * - Static configuration files
 *
 * Supports caching with TTL and hot-reloading.
 */

import type {
  TenantConfig,
  ConfigLoadResult,
  ConfigSource,
  ConfigOverrides,
  FeatureFlags,
  ModuleId,
  ModuleStatus,
} from './types';
import { DEFAULT_TENANT_CONFIG, DEFAULT_FEATURE_FLAGS } from './defaults';
import { wccConfig } from './configs/wcc.config';
import { rbkcConfig } from './configs/rbkc.config';
import { demoConfig } from './configs/demo.config';

// ============================================================================
// Configuration Store
// ============================================================================

interface CacheEntry {
  config: TenantConfig;
  loadedAt: Date;
  expiresAt: Date;
  source: ConfigSource;
}

const configCache = new Map<string, CacheEntry>();

// Default cache TTL: 5 minutes
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

// Static tenant configurations
const STATIC_CONFIGS: Record<string, TenantConfig> = {
  wcc: wccConfig,
  rbkc: rbkcConfig,
  demo: demoConfig,
};

// ============================================================================
// Environment Detection
// ============================================================================

/**
 * Get tenant ID from environment or URL
 */
export function detectTenantId(): string {
  // Check environment variable first
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TENANT_ID) {
    return process.env.NEXT_PUBLIC_TENANT_ID;
  }

  // Check client-side window location for subdomain-based tenancy
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Handle subdomain-based tenancy (e.g., wcc.app.council.gov.uk)
    const subdomain = hostname.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'app' && STATIC_CONFIGS[subdomain]) {
      return subdomain;
    }

    // Check URL search params for tenant override (development)
    const params = new URLSearchParams(window.location.search);
    const tenantParam = params.get('tenant');
    if (tenantParam && STATIC_CONFIGS[tenantParam]) {
      return tenantParam;
    }

    // Check localStorage for persisted tenant (development)
    const storedTenant = window.localStorage.getItem('currentTenantId');
    if (storedTenant && STATIC_CONFIGS[storedTenant]) {
      return storedTenant;
    }
  }

  // Default to demo tenant
  return 'demo';
}

/**
 * Get API base URL from environment
 */
function getApiBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return '/api';
}

// ============================================================================
// Configuration Loading
// ============================================================================

/**
 * Load tenant configuration from static configs
 */
function loadStaticConfig(tenantId: string): TenantConfig | null {
  return STATIC_CONFIGS[tenantId] || null;
}

/**
 * Load tenant configuration from backend API
 */
async function loadApiConfig(tenantId: string): Promise<TenantConfig | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/tenants/${tenantId}/config`, {
      headers: {
        'Accept': 'application/json',
        'X-Tenant-Id': tenantId,
      },
      next: { revalidate: 300 }, // Next.js cache for 5 minutes
    });

    if (!response.ok) {
      console.warn(`Failed to load tenant config from API: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data as TenantConfig;
  } catch (error) {
    console.warn('Error loading tenant config from API:', error);
    return null;
  }
}

/**
 * Merge configurations with deep override
 */
function mergeConfigs(base: TenantConfig, overrides: Partial<TenantConfig>): TenantConfig {
  return {
    ...base,
    ...overrides,
    branding: {
      ...base.branding,
      ...overrides.branding,
      theme: {
        ...base.branding.theme,
        ...overrides.branding?.theme,
      },
      logo: {
        ...base.branding.logo,
        ...overrides.branding?.logo,
      },
    },
    featureFlags: {
      ...base.featureFlags,
      ...overrides.featureFlags,
    },
    localization: {
      ...base.localization,
      ...overrides.localization,
    },
  };
}

/**
 * Check if cache entry is valid
 */
function isCacheValid(entry: CacheEntry | undefined): boolean {
  if (!entry) return false;
  return new Date() < entry.expiresAt;
}

/**
 * Load tenant configuration with caching
 */
export async function loadTenantConfig(
  tenantId?: string,
  options: {
    forceRefresh?: boolean;
    ttlMs?: number;
    source?: ConfigSource;
  } = {}
): Promise<ConfigLoadResult> {
  const resolvedTenantId = tenantId || detectTenantId();
  const { forceRefresh = false, ttlMs = DEFAULT_CACHE_TTL_MS, source = 'hybrid' } = options;

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = configCache.get(resolvedTenantId);
    if (isCacheValid(cached)) {
      return {
        config: cached!.config,
        source: cached!.source,
        loadedAt: cached!.loadedAt,
        ttl: Math.floor((cached!.expiresAt.getTime() - Date.now()) / 1000),
        fromCache: true,
      };
    }
  }

  let config: TenantConfig | null = null;
  let resolvedSource: ConfigSource = source;

  // Try loading based on source preference
  switch (source) {
    case 'static':
      config = loadStaticConfig(resolvedTenantId);
      resolvedSource = 'static';
      break;

    case 'api':
      config = await loadApiConfig(resolvedTenantId);
      resolvedSource = 'api';
      break;

    case 'hybrid':
    default:
      // Try API first, fall back to static
      config = await loadApiConfig(resolvedTenantId);
      if (config) {
        resolvedSource = 'api';
      } else {
        config = loadStaticConfig(resolvedTenantId);
        resolvedSource = 'static';
      }
      break;
  }

  // Fall back to demo config if nothing found
  if (!config) {
    config = STATIC_CONFIGS['demo'];
    resolvedSource = 'static';
  }

  // Cache the result
  const now = new Date();
  const entry: CacheEntry = {
    config,
    loadedAt: now,
    expiresAt: new Date(now.getTime() + ttlMs),
    source: resolvedSource,
  };
  configCache.set(resolvedTenantId, entry);

  return {
    config,
    source: resolvedSource,
    loadedAt: now,
    ttl: Math.floor(ttlMs / 1000),
    fromCache: false,
  };
}

/**
 * Get cached config without loading
 */
export function getCachedConfig(tenantId: string): TenantConfig | null {
  const cached = configCache.get(tenantId);
  return cached && isCacheValid(cached) ? cached.config : null;
}

/**
 * Clear configuration cache
 */
export function clearConfigCache(tenantId?: string): void {
  if (tenantId) {
    configCache.delete(tenantId);
  } else {
    configCache.clear();
  }
}

/**
 * Invalidate and reload configuration
 */
export async function reloadConfig(tenantId?: string): Promise<ConfigLoadResult> {
  const resolvedTenantId = tenantId || detectTenantId();
  clearConfigCache(resolvedTenantId);
  return loadTenantConfig(resolvedTenantId, { forceRefresh: true });
}

// ============================================================================
// Configuration Overrides
// ============================================================================

/**
 * Apply runtime overrides to a configuration
 */
export function applyConfigOverrides(
  config: TenantConfig,
  overrides: ConfigOverrides
): TenantConfig {
  let result = { ...config };

  // Apply feature flag overrides
  if (overrides.featureFlags) {
    result.featureFlags = {
      ...result.featureFlags,
      ...overrides.featureFlags,
    };
  }

  // Apply module status overrides
  if (overrides.modules) {
    result.modules = result.modules.map((m) => ({
      ...m,
      status: overrides.modules![m.id] ?? m.status,
    }));
  }

  // Apply branding overrides
  if (overrides.branding) {
    result.branding = {
      ...result.branding,
      ...overrides.branding,
      theme: {
        ...result.branding.theme,
        ...overrides.branding.theme,
      },
    };
  }

  // Apply environment overrides
  if (overrides.environment) {
    result.environment = {
      ...result.environment,
      ...overrides.environment,
    };
  }

  return result;
}

// ============================================================================
// Configuration Subscription (Hot Reload)
// ============================================================================

type ConfigChangeHandler = (config: TenantConfig) => void;
const changeHandlers = new Map<string, Set<ConfigChangeHandler>>();

/**
 * Subscribe to configuration changes
 */
export function subscribeToConfigChanges(
  tenantId: string,
  handler: ConfigChangeHandler
): () => void {
  if (!changeHandlers.has(tenantId)) {
    changeHandlers.set(tenantId, new Set());
  }
  changeHandlers.get(tenantId)!.add(handler);

  // Return unsubscribe function
  return () => {
    changeHandlers.get(tenantId)?.delete(handler);
  };
}

/**
 * Notify subscribers of configuration change
 */
export function notifyConfigChange(tenantId: string, config: TenantConfig): void {
  const handlers = changeHandlers.get(tenantId);
  if (handlers) {
    handlers.forEach((handler) => {
      try {
        handler(config);
      } catch (error) {
        console.error('Error in config change handler:', error);
      }
    });
  }
}

/**
 * Start polling for configuration updates
 */
export function startConfigPolling(
  tenantId: string,
  intervalMs: number = 60000
): () => void {
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;

    try {
      const result = await loadTenantConfig(tenantId, { forceRefresh: true, source: 'api' });
      if (!result.fromCache) {
        notifyConfigChange(tenantId, result.config);
      }
    } catch (error) {
      console.warn('Config polling error:', error);
    }

    if (isActive) {
      setTimeout(poll, intervalMs);
    }
  };

  // Start polling
  setTimeout(poll, intervalMs);

  // Return stop function
  return () => {
    isActive = false;
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all available tenant IDs
 */
export function getAvailableTenants(): string[] {
  return Object.keys(STATIC_CONFIGS);
}

/**
 * Check if a tenant ID is valid
 */
export function isValidTenant(tenantId: string): boolean {
  return tenantId in STATIC_CONFIGS;
}

/**
 * Get tenant display name
 */
export function getTenantDisplayName(tenantId: string): string {
  const config = STATIC_CONFIGS[tenantId];
  return config?.branding.name || tenantId.toUpperCase();
}
