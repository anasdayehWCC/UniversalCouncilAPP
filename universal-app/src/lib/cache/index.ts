/**
 * Cache Module
 *
 * Comprehensive caching strategy for Universal App with:
 * - Multiple caching strategies (cache-first, network-first, stale-while-revalidate)
 * - Memory and IndexedDB cache backends
 * - TTL-based invalidation
 * - Tag-based cache invalidation
 * - Cache key generators
 *
 * @module lib/cache
 *
 * @example
 * ```typescript
 * import { getCacheManager, minuteKeys, CacheTTL, cacheTags } from '@/lib/cache';
 *
 * // Fetch with caching
 * const { data } = await getCacheManager().fetch(
 *   minuteKeys.detail(minuteId),
 *   () => api.getMinute(minuteId),
 *   {
 *     strategy: 'stale-while-revalidate',
 *     ttl: CacheTTL.STANDARD,
 *     tags: [cacheTags.minute(minuteId)],
 *   }
 * );
 *
 * // Invalidate related caches
 * await getCacheManager().invalidateByTags([cacheTags.minute(minuteId)]);
 * ```
 */

// Core strategy exports
export {
  CacheManager,
  getCacheManager,
  resetCacheManager,
  cachedFetch,
  invalidateCache,
  clearAllCache,
  prefetchData,
  type CacheStrategy,
  type CacheEntry,
  type CacheConfig,
  type CacheOptions,
  type CacheFetchResult,
} from './strategy';

// Key management exports
export {
  // Key builders
  buildCacheKey,
  parseCacheKey,
  // Namespace key generators
  minuteKeys,
  transcriptionKeys,
  templateKeys,
  userKeys,
  configKeys,
  insightsKeys,
  reviewKeys,
  searchKeys,
  // Tag management
  buildCacheTags,
  cacheTags,
  // Invalidation helpers
  getMinuteInvalidationTags,
  getTemplateInvalidationTags,
  getUserInvalidationTags,
  getTenantInvalidationTags,
  // Pattern matchers
  namespacePattern,
  userPattern,
  tenantPattern,
  entityPattern,
  // Constants
  CacheTTL,
  CacheStaleTime,
  // Types
  type CacheNamespace,
  type CacheKeyOptions,
  type CacheTagConfig,
} from './keys';
