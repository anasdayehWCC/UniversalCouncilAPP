/**
 * Cache Key Management Module
 *
 * Provides structured cache key generation, namespace management,
 * and tag-based invalidation patterns.
 *
 * @module lib/cache/keys
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Cache namespaces for different data types
 */
export type CacheNamespace =
  | 'minutes'
  | 'transcriptions'
  | 'recordings'
  | 'templates'
  | 'users'
  | 'config'
  | 'insights'
  | 'notifications'
  | 'search'
  | 'review'
  | 'export'
  | 'domain'
  | 'tenant';

/**
 * Cache key builder options
 */
export interface CacheKeyOptions {
  /** Namespace for logical grouping */
  namespace: CacheNamespace;
  /** Entity type or resource name */
  resource?: string;
  /** Entity ID */
  id?: string;
  /** Query parameters */
  params?: Record<string, string | number | boolean | null | undefined>;
  /** User-specific key segment */
  userId?: string;
  /** Tenant-specific key segment */
  tenantId?: string;
}

/**
 * Tag configuration for cache entries
 */
export interface CacheTagConfig {
  /** Namespace tag */
  namespace: CacheNamespace;
  /** Entity-specific tags */
  entityTags?: string[];
  /** User-specific tag */
  userTag?: string;
  /** Tenant-specific tag */
  tenantTag?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Key segment separator */
const KEY_SEPARATOR = ':';

/** TTL presets in milliseconds */
export const CacheTTL = {
  /** 30 seconds - for frequently changing data */
  SHORT: 30 * 1000,
  /** 2 minutes - for user-specific data */
  MEDIUM: 2 * 60 * 1000,
  /** 5 minutes - standard TTL */
  STANDARD: 5 * 60 * 1000,
  /** 15 minutes - for slower-changing data */
  LONG: 15 * 60 * 1000,
  /** 1 hour - for config/static data */
  VERY_LONG: 60 * 60 * 1000,
  /** 24 hours - for rarely changing data */
  DAY: 24 * 60 * 60 * 1000,
} as const;

/** Stale time presets (when to revalidate in background) */
export const CacheStaleTime = {
  IMMEDIATE: 0,
  SHORT: 15 * 1000,
  MEDIUM: 60 * 1000,
  LONG: 5 * 60 * 1000,
} as const;

// ============================================================================
// Key Generators
// ============================================================================

/**
 * Build a cache key from components
 */
export function buildCacheKey(options: CacheKeyOptions): string {
  const parts: string[] = [];

  // Add tenant segment if multi-tenant
  if (options.tenantId) {
    parts.push(`tenant:${options.tenantId}`);
  }

  // Add user segment if user-specific
  if (options.userId) {
    parts.push(`user:${options.userId}`);
  }

  // Namespace is required
  parts.push(options.namespace);

  // Add resource if specified
  if (options.resource) {
    parts.push(options.resource);
  }

  // Add ID if specified
  if (options.id) {
    parts.push(options.id);
  }

  // Add sorted params if any
  if (options.params && Object.keys(options.params).length > 0) {
    const paramString = serializeParams(options.params);
    if (paramString) {
      parts.push(`params:${paramString}`);
    }
  }

  return parts.join(KEY_SEPARATOR);
}

/**
 * Serialize query parameters into a stable string
 */
function serializeParams(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);

  return filtered.join('&');
}

/**
 * Parse a cache key back into components
 */
export function parseCacheKey(key: string): Partial<CacheKeyOptions> {
  const parts = key.split(KEY_SEPARATOR);
  const result: Partial<CacheKeyOptions> = {};

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.startsWith('tenant:')) {
      result.tenantId = part.slice(7);
    } else if (part.startsWith('user:')) {
      result.userId = part.slice(5);
    } else if (part.startsWith('params:')) {
      result.params = deserializeParams(part.slice(7));
    } else if (!result.namespace) {
      // First non-prefix part is the namespace
      result.namespace = part as CacheNamespace;
    } else if (!result.resource) {
      result.resource = part;
    } else if (!result.id) {
      result.id = part;
    }
  }

  return result;
}

/**
 * Deserialize params string back to object
 */
function deserializeParams(
  paramString: string
): Record<string, string> {
  const result: Record<string, string> = {};
  const pairs = paramString.split('&');

  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value !== undefined) {
      result[key] = decodeURIComponent(value);
    }
  }

  return result;
}

// ============================================================================
// Namespace-Specific Key Generators
// ============================================================================

/**
 * Generate keys for minutes-related data
 */
export const minuteKeys = {
  all: (tenantId?: string): string =>
    buildCacheKey({ namespace: 'minutes', tenantId }),

  list: (
    params?: { status?: string; page?: number; limit?: number },
    tenantId?: string
  ): string =>
    buildCacheKey({
      namespace: 'minutes',
      resource: 'list',
      params,
      tenantId,
    }),

  detail: (id: string, tenantId?: string): string =>
    buildCacheKey({ namespace: 'minutes', id, tenantId }),

  versions: (minuteId: string, tenantId?: string): string =>
    buildCacheKey({
      namespace: 'minutes',
      resource: 'versions',
      id: minuteId,
      tenantId,
    }),

  byUser: (userId: string, tenantId?: string): string =>
    buildCacheKey({
      namespace: 'minutes',
      resource: 'user',
      userId,
      tenantId,
    }),

  recent: (userId?: string, tenantId?: string): string =>
    buildCacheKey({
      namespace: 'minutes',
      resource: 'recent',
      userId,
      tenantId,
    }),

  search: (query: string, tenantId?: string): string =>
    buildCacheKey({
      namespace: 'minutes',
      resource: 'search',
      params: { q: query },
      tenantId,
    }),
};

/**
 * Generate keys for transcription-related data
 */
export const transcriptionKeys = {
  all: (tenantId?: string): string =>
    buildCacheKey({ namespace: 'transcriptions', tenantId }),

  detail: (id: string, tenantId?: string): string =>
    buildCacheKey({ namespace: 'transcriptions', id, tenantId }),

  byMinute: (minuteId: string, tenantId?: string): string =>
    buildCacheKey({
      namespace: 'transcriptions',
      resource: 'minute',
      id: minuteId,
      tenantId,
    }),

  segments: (transcriptionId: string, tenantId?: string): string =>
    buildCacheKey({
      namespace: 'transcriptions',
      resource: 'segments',
      id: transcriptionId,
      tenantId,
    }),
};

/**
 * Generate keys for template-related data
 */
export const templateKeys = {
  all: (tenantId?: string): string =>
    buildCacheKey({ namespace: 'templates', tenantId }),

  list: (
    params?: { domain?: string; active?: boolean },
    tenantId?: string
  ): string =>
    buildCacheKey({
      namespace: 'templates',
      resource: 'list',
      params,
      tenantId,
    }),

  detail: (id: string, tenantId?: string): string =>
    buildCacheKey({ namespace: 'templates', id, tenantId }),

  byDomain: (domain: string, tenantId?: string): string =>
    buildCacheKey({
      namespace: 'templates',
      resource: 'domain',
      id: domain,
      tenantId,
    }),
};

/**
 * Generate keys for user-related data
 */
export const userKeys = {
  all: (tenantId?: string): string =>
    buildCacheKey({ namespace: 'users', tenantId }),

  me: (userId?: string): string =>
    buildCacheKey({ namespace: 'users', resource: 'me', userId }),

  detail: (id: string, tenantId?: string): string =>
    buildCacheKey({ namespace: 'users', id, tenantId }),

  preferences: (userId: string): string =>
    buildCacheKey({
      namespace: 'users',
      resource: 'preferences',
      userId,
    }),

  permissions: (userId: string, tenantId?: string): string =>
    buildCacheKey({
      namespace: 'users',
      resource: 'permissions',
      userId,
      tenantId,
    }),
};

/**
 * Generate keys for config/tenant data
 */
export const configKeys = {
  tenant: (tenantId: string): string =>
    buildCacheKey({ namespace: 'tenant', id: tenantId }),

  modules: (tenantId?: string): string =>
    buildCacheKey({ namespace: 'config', resource: 'modules', tenantId }),

  navigation: (tenantId?: string, role?: string): string =>
    buildCacheKey({
      namespace: 'config',
      resource: 'navigation',
      params: { role },
      tenantId,
    }),

  features: (tenantId?: string): string =>
    buildCacheKey({ namespace: 'config', resource: 'features', tenantId }),

  domains: (tenantId?: string): string =>
    buildCacheKey({ namespace: 'domain', resource: 'list', tenantId }),
};

/**
 * Generate keys for insights/analytics data
 */
export const insightsKeys = {
  summary: (
    params?: { from?: string; to?: string },
    tenantId?: string
  ): string =>
    buildCacheKey({
      namespace: 'insights',
      resource: 'summary',
      params,
      tenantId,
    }),

  activity: (
    params?: { period?: string; userId?: string },
    tenantId?: string
  ): string =>
    buildCacheKey({
      namespace: 'insights',
      resource: 'activity',
      params,
      tenantId,
    }),

  metrics: (metricType: string, tenantId?: string): string =>
    buildCacheKey({
      namespace: 'insights',
      resource: 'metrics',
      id: metricType,
      tenantId,
    }),
};

/**
 * Generate keys for review queue data
 */
export const reviewKeys = {
  queue: (
    params?: { status?: string; assignee?: string },
    tenantId?: string
  ): string =>
    buildCacheKey({
      namespace: 'review',
      resource: 'queue',
      params,
      tenantId,
    }),

  item: (id: string, tenantId?: string): string =>
    buildCacheKey({ namespace: 'review', id, tenantId }),

  counts: (tenantId?: string): string =>
    buildCacheKey({ namespace: 'review', resource: 'counts', tenantId }),
};

/**
 * Generate keys for search results
 */
export const searchKeys = {
  results: (
    query: string,
    params?: { type?: string; page?: number },
    tenantId?: string
  ): string =>
    buildCacheKey({
      namespace: 'search',
      resource: 'results',
      params: { q: query, ...params },
      tenantId,
    }),

  suggestions: (prefix: string, tenantId?: string): string =>
    buildCacheKey({
      namespace: 'search',
      resource: 'suggestions',
      params: { prefix },
      tenantId,
    }),
};

// ============================================================================
// Tag Generators
// ============================================================================

/**
 * Generate cache tags for entity
 */
export function buildCacheTags(config: CacheTagConfig): string[] {
  const tags: string[] = [];

  // Namespace tag (e.g., "ns:minutes")
  tags.push(`ns:${config.namespace}`);

  // Entity-specific tags
  if (config.entityTags) {
    tags.push(...config.entityTags.map((t) => `entity:${t}`));
  }

  // User tag
  if (config.userTag) {
    tags.push(`user:${config.userTag}`);
  }

  // Tenant tag
  if (config.tenantTag) {
    tags.push(`tenant:${config.tenantTag}`);
  }

  return tags;
}

/**
 * Tag generators for common invalidation patterns
 */
export const cacheTags = {
  /** All cache for a namespace */
  namespace: (ns: CacheNamespace): string => `ns:${ns}`,

  /** All cache for an entity */
  entity: (type: string, id: string): string => `entity:${type}:${id}`,

  /** All cache for a user */
  user: (userId: string): string => `user:${userId}`,

  /** All cache for a tenant */
  tenant: (tenantId: string): string => `tenant:${tenantId}`,

  /** Specific minute */
  minute: (minuteId: string): string => `entity:minute:${minuteId}`,

  /** Specific transcription */
  transcription: (id: string): string => `entity:transcription:${id}`,

  /** Specific template */
  template: (id: string): string => `entity:template:${id}`,
};

// ============================================================================
// Invalidation Patterns
// ============================================================================

/**
 * Get tags to invalidate when a minute is updated
 */
export function getMinuteInvalidationTags(
  minuteId: string,
  userId?: string,
  tenantId?: string
): string[] {
  const tags = [
    cacheTags.namespace('minutes'),
    cacheTags.minute(minuteId),
  ];

  if (userId) {
    tags.push(cacheTags.user(userId));
  }

  if (tenantId) {
    tags.push(cacheTags.tenant(tenantId));
  }

  // Also invalidate related caches
  tags.push(cacheTags.namespace('review'));
  tags.push(cacheTags.namespace('insights'));

  return tags;
}

/**
 * Get tags to invalidate when a template is updated
 */
export function getTemplateInvalidationTags(
  templateId: string,
  tenantId?: string
): string[] {
  const tags = [
    cacheTags.namespace('templates'),
    cacheTags.template(templateId),
  ];

  if (tenantId) {
    tags.push(cacheTags.tenant(tenantId));
  }

  return tags;
}

/**
 * Get tags to invalidate when user permissions change
 */
export function getUserInvalidationTags(
  userId: string,
  tenantId?: string
): string[] {
  const tags = [
    cacheTags.namespace('users'),
    cacheTags.user(userId),
  ];

  if (tenantId) {
    tags.push(cacheTags.tenant(tenantId));
  }

  // User changes might affect navigation/modules
  tags.push(cacheTags.namespace('config'));

  return tags;
}

/**
 * Get tags to invalidate when tenant config changes
 */
export function getTenantInvalidationTags(tenantId: string): string[] {
  return [
    cacheTags.tenant(tenantId),
    cacheTags.namespace('config'),
    cacheTags.namespace('templates'),
    cacheTags.namespace('domain'),
  ];
}

// ============================================================================
// Pattern Matchers
// ============================================================================

/**
 * Create regex pattern to match cache keys by namespace
 */
export function namespacePattern(namespace: CacheNamespace): RegExp {
  // Match keys that contain the namespace
  return new RegExp(`(^|:)${namespace}(:|$)`);
}

/**
 * Create regex pattern to match cache keys by user
 */
export function userPattern(userId: string): RegExp {
  return new RegExp(`user:${userId}(:|$)`);
}

/**
 * Create regex pattern to match cache keys by tenant
 */
export function tenantPattern(tenantId: string): RegExp {
  return new RegExp(`tenant:${tenantId}(:|$)`);
}

/**
 * Create regex pattern to match cache keys by entity
 */
export function entityPattern(
  namespace: CacheNamespace,
  entityId: string
): RegExp {
  return new RegExp(`${namespace}:.*${entityId}`);
}
