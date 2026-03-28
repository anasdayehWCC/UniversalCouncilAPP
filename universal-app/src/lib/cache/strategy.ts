/**
 * Cache Strategy Module
 *
 * Implements cache-first, network-first, and stale-while-revalidate strategies
 * with TTL-based invalidation, cache warming, and multiple backend support.
 *
 * @module lib/cache/strategy
 */

import Dexie, { type Table } from 'dexie';

// ============================================================================
// Types
// ============================================================================

/**
 * Cache strategy types
 */
export type CacheStrategy =
  | 'cache-first'
  | 'network-first'
  | 'stale-while-revalidate'
  | 'network-only'
  | 'cache-only';

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  etag?: string;
  version?: number;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /** Default TTL in milliseconds */
  defaultTTL: number;
  /** Maximum number of entries in memory cache */
  maxMemoryEntries: number;
  /** Whether to persist to IndexedDB */
  persistToIndexedDB: boolean;
  /** Cache version for invalidation on updates */
  version: number;
  /** Debug logging */
  debug: boolean;
}

/**
 * Options for cache operations
 */
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  strategy?: CacheStrategy;
  forceRefresh?: boolean;
  staleTime?: number;
}

/**
 * Result of a cache fetch operation
 */
export interface CacheFetchResult<T> {
  data: T;
  source: 'memory' | 'indexeddb' | 'network';
  isStale: boolean;
  timestamp: number;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxMemoryEntries: 500,
  persistToIndexedDB: true,
  version: 1,
  debug: process.env.NODE_ENV === 'development',
};

// ============================================================================
// Cache Database (IndexedDB via Dexie)
// ============================================================================

class CacheDatabase extends Dexie {
  entries!: Table<CacheEntry>;

  constructor() {
    super('UniversalAppCache');

    this.version(1).stores({
      entries: 'key, timestamp, *tags',
    });
  }
}

// ============================================================================
// Memory Cache Backend
// ============================================================================

/**
 * LRU-based in-memory cache with TTL support
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = 500) {
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): CacheEntry<T> | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (entry) {
      // Update access order for LRU
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
      this.accessOrder.push(key);
    }

    return entry;
  }

  set<T>(key: string, entry: CacheEntry<T>): void {
    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxEntries && this.accessOrder.length > 0) {
      const oldest = this.accessOrder.shift();
      if (oldest) {
        this.cache.delete(oldest);
      }
    }

    this.cache.set(key, entry as CacheEntry);
    this.accessOrder.push(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    return this.cache.delete(key);
  }

  deleteByTag(tag: string): number {
    let deleted = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  deleteByPattern(pattern: RegExp): number {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  entries(): Array<[string, CacheEntry]> {
    return Array.from(this.cache.entries());
  }
}

// ============================================================================
// IndexedDB Cache Backend
// ============================================================================

/**
 * IndexedDB-based persistent cache
 */
class IndexedDBCache {
  private db: CacheDatabase;
  private ready: Promise<void>;

  constructor() {
    this.db = new CacheDatabase();
    this.ready = this.db.open().then(() => undefined);
  }

  async get<T>(key: string): Promise<CacheEntry<T> | undefined> {
    await this.ready;
    return this.db.entries.get(key) as Promise<CacheEntry<T> | undefined>;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    await this.ready;
    await this.db.entries.put(entry);
  }

  async has(key: string): Promise<boolean> {
    await this.ready;
    const count = await this.db.entries.where('key').equals(key).count();
    return count > 0;
  }

  async delete(key: string): Promise<boolean> {
    await this.ready;
    const count = await this.db.entries.where('key').equals(key).delete();
    return count > 0;
  }

  async deleteByTag(tag: string): Promise<number> {
    await this.ready;
    const entries = await this.db.entries.where('tags').equals(tag).toArray();
    const keys = entries.map((e) => e.key);
    await this.db.entries.bulkDelete(keys);
    return keys.length;
  }

  async deleteByPattern(pattern: RegExp): Promise<number> {
    await this.ready;
    const entries = await this.db.entries.toArray();
    const keysToDelete = entries.filter((e) => pattern.test(e.key)).map((e) => e.key);
    await this.db.entries.bulkDelete(keysToDelete);
    return keysToDelete.length;
  }

  async deleteExpired(): Promise<number> {
    await this.ready;
    const now = Date.now();
    const entries = await this.db.entries.toArray();
    const expiredKeys = entries.filter((e) => now - e.timestamp > e.ttl).map((e) => e.key);
    await this.db.entries.bulkDelete(expiredKeys);
    return expiredKeys.length;
  }

  async clear(): Promise<void> {
    await this.ready;
    await this.db.entries.clear();
  }

  async size(): Promise<number> {
    await this.ready;
    return this.db.entries.count();
  }

  async keys(): Promise<string[]> {
    await this.ready;
    const entries = await this.db.entries.toArray();
    return entries.map((e) => e.key);
  }
}

// ============================================================================
// Cache Manager
// ============================================================================

/**
 * Main cache manager with multi-backend support and strategy execution
 */
export class CacheManager {
  private memoryCache: MemoryCache;
  private indexedDBCache: IndexedDBCache | null = null;
  private config: CacheConfig;
  private pendingRequests = new Map<string, Promise<unknown>>();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memoryCache = new MemoryCache(this.config.maxMemoryEntries);

    if (this.config.persistToIndexedDB && typeof window !== 'undefined') {
      this.indexedDBCache = new IndexedDBCache();
    }
  }

  // --------------------------------------------------------------------------
  // Core Operations
  // --------------------------------------------------------------------------

  /**
   * Get data from cache or network using specified strategy
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<CacheFetchResult<T>> {
    const {
      ttl = this.config.defaultTTL,
      tags = [],
      strategy = 'stale-while-revalidate',
      forceRefresh = false,
      staleTime = ttl / 2,
    } = options;

    if (forceRefresh) {
      return this.fetchFromNetwork(key, fetcher, ttl, tags);
    }

    switch (strategy) {
      case 'cache-first':
        return this.cacheFirst(key, fetcher, ttl, tags);

      case 'network-first':
        return this.networkFirst(key, fetcher, ttl, tags);

      case 'stale-while-revalidate':
        return this.staleWhileRevalidate(key, fetcher, ttl, tags, staleTime);

      case 'network-only':
        return this.fetchFromNetwork(key, fetcher, ttl, tags);

      case 'cache-only':
        return this.cacheOnly<T>(key);

      default:
        return this.staleWhileRevalidate(key, fetcher, ttl, tags, staleTime);
    }
  }

  /**
   * Directly get from cache (memory or IndexedDB)
   */
  async get<T>(key: string): Promise<CacheEntry<T> | undefined> {
    // Check memory first
    const memoryEntry = this.memoryCache.get<T>(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry;
    }

    // Check IndexedDB
    if (this.indexedDBCache) {
      const idbEntry = await this.indexedDBCache.get<T>(key);
      if (idbEntry && !this.isExpired(idbEntry)) {
        // Promote to memory cache
        this.memoryCache.set(key, idbEntry);
        return idbEntry;
      }
    }

    return undefined;
  }

  /**
   * Directly set cache entry
   */
  async set<T>(
    key: string,
    data: T,
    options: { ttl?: number; tags?: string[] } = {}
  ): Promise<void> {
    const { ttl = this.config.defaultTTL, tags = [] } = options;

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      tags,
      version: this.config.version,
    };

    // Set in memory
    this.memoryCache.set(key, entry);

    // Persist to IndexedDB
    if (this.indexedDBCache) {
      await this.indexedDBCache.set(key, entry);
    }

    this.log('set', key, { ttl, tags });
  }

  /**
   * Delete a specific cache entry
   */
  async delete(key: string): Promise<boolean> {
    const memoryDeleted = this.memoryCache.delete(key);
    let idbDeleted = false;

    if (this.indexedDBCache) {
      idbDeleted = await this.indexedDBCache.delete(key);
    }

    this.log('delete', key);
    return memoryDeleted || idbDeleted;
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let totalDeleted = 0;

    for (const tag of tags) {
      totalDeleted += this.memoryCache.deleteByTag(tag);

      if (this.indexedDBCache) {
        totalDeleted += await this.indexedDBCache.deleteByTag(tag);
      }
    }

    this.log('invalidateByTags', tags.join(', '), { deleted: totalDeleted });
    return totalDeleted;
  }

  /**
   * Invalidate cache by key pattern
   */
  async invalidateByPattern(pattern: RegExp): Promise<number> {
    let totalDeleted = 0;

    totalDeleted += this.memoryCache.deleteByPattern(pattern);

    if (this.indexedDBCache) {
      totalDeleted += await this.indexedDBCache.deleteByPattern(pattern);
    }

    this.log('invalidateByPattern', pattern.toString(), { deleted: totalDeleted });
    return totalDeleted;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (this.indexedDBCache) {
      await this.indexedDBCache.clear();
    }

    this.log('clear', 'all');
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    let cleaned = 0;

    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    // Clean IndexedDB
    if (this.indexedDBCache) {
      cleaned += await this.indexedDBCache.deleteExpired();
    }

    this.log('cleanup', 'expired', { cleaned });
    return cleaned;
  }

  // --------------------------------------------------------------------------
  // Cache Warming
  // --------------------------------------------------------------------------

  /**
   * Warm cache with multiple entries
   */
  async warm<T>(
    entries: Array<{
      key: string;
      fetcher: () => Promise<T>;
      options?: CacheOptions;
    }>
  ): Promise<void> {
    this.log('warm', 'started', { count: entries.length });

    await Promise.all(
      entries.map(async ({ key, fetcher, options }) => {
        try {
          await this.fetch(key, fetcher, { ...options, forceRefresh: true });
        } catch (error) {
          console.error(`[Cache] Failed to warm ${key}:`, error);
        }
      })
    );

    this.log('warm', 'completed', { count: entries.length });
  }

  /**
   * Prefetch data in background (doesn't block UI)
   */
  prefetch<T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions): void {
    // Don't prefetch if already cached
    const existing = this.memoryCache.get(key);
    if (existing && !this.isStale(existing, options?.staleTime || this.config.defaultTTL / 2)) {
      return;
    }

    // Fire and forget
    this.fetch(key, fetcher, options).catch((error) => {
      console.error(`[Cache] Prefetch failed for ${key}:`, error);
    });
  }

  // --------------------------------------------------------------------------
  // Strategy Implementations
  // --------------------------------------------------------------------------

  private async cacheFirst<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
    tags: string[]
  ): Promise<CacheFetchResult<T>> {
    // Try memory cache
    const memoryEntry = this.memoryCache.get<T>(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.log('cacheFirst', key, { source: 'memory' });
      return {
        data: memoryEntry.data,
        source: 'memory',
        isStale: false,
        timestamp: memoryEntry.timestamp,
      };
    }

    // Try IndexedDB
    if (this.indexedDBCache) {
      const idbEntry = await this.indexedDBCache.get<T>(key);
      if (idbEntry && !this.isExpired(idbEntry)) {
        // Promote to memory
        this.memoryCache.set(key, idbEntry);
        this.log('cacheFirst', key, { source: 'indexeddb' });
        return {
          data: idbEntry.data,
          source: 'indexeddb',
          isStale: false,
          timestamp: idbEntry.timestamp,
        };
      }
    }

    // Fetch from network
    return this.fetchFromNetwork(key, fetcher, ttl, tags);
  }

  private async networkFirst<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
    tags: string[]
  ): Promise<CacheFetchResult<T>> {
    try {
      return await this.fetchFromNetwork(key, fetcher, ttl, tags);
    } catch (error) {
      // Fall back to cache on network failure
      const cached = await this.get<T>(key);
      if (cached) {
        this.log('networkFirst', key, { source: 'cache-fallback' });
        return {
          data: cached.data,
          source: 'memory',
          isStale: true,
          timestamp: cached.timestamp,
        };
      }
      throw error;
    }
  }

  private async staleWhileRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
    tags: string[],
    staleTime: number
  ): Promise<CacheFetchResult<T>> {
    const cached = await this.get<T>(key);

    if (cached) {
      const isStale = this.isStale(cached, staleTime);

      if (isStale) {
        // Return stale data immediately and revalidate in background
        this.revalidateInBackground(key, fetcher, ttl, tags);
      }

      this.log('staleWhileRevalidate', key, {
        source: 'cache',
        isStale,
        age: Date.now() - cached.timestamp,
      });

      return {
        data: cached.data,
        source: 'memory',
        isStale,
        timestamp: cached.timestamp,
      };
    }

    // No cache, fetch from network
    return this.fetchFromNetwork(key, fetcher, ttl, tags);
  }

  private async cacheOnly<T>(key: string): Promise<CacheFetchResult<T>> {
    const cached = await this.get<T>(key);

    if (!cached) {
      throw new Error(`Cache miss for key: ${key}`);
    }

    return {
      data: cached.data,
      source: 'memory',
      isStale: this.isExpired(cached),
      timestamp: cached.timestamp,
    };
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private async fetchFromNetwork<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
    tags: string[]
  ): Promise<CacheFetchResult<T>> {
    // Deduplicate concurrent requests
    const pending = this.pendingRequests.get(key);
    if (pending) {
      const data = (await pending) as T;
      return {
        data,
        source: 'network',
        isStale: false,
        timestamp: Date.now(),
      };
    }

    const promise = fetcher();
    this.pendingRequests.set(key, promise);

    try {
      const data = await promise;
      await this.set(key, data, { ttl, tags });

      this.log('fetchFromNetwork', key, { success: true });

      return {
        data,
        source: 'network',
        isStale: false,
        timestamp: Date.now(),
      };
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  private revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
    tags: string[]
  ): void {
    // Don't block on revalidation
    this.fetchFromNetwork(key, fetcher, ttl, tags).catch((error) => {
      console.error(`[Cache] Background revalidation failed for ${key}:`, error);
    });
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private isStale(entry: CacheEntry, staleTime: number): boolean {
    return Date.now() - entry.timestamp > staleTime;
  }

  private log(operation: string, key: string, meta?: Record<string, unknown>): void {
    if (this.config.debug) {
      console.log(`[Cache] ${operation}: ${key}`, meta || '');
    }
  }

  // --------------------------------------------------------------------------
  // Stats & Info
  // --------------------------------------------------------------------------

  getStats(): {
    memorySize: number;
    memoryKeys: string[];
  } {
    return {
      memorySize: this.memoryCache.size(),
      memoryKeys: this.memoryCache.keys(),
    };
  }

  async getFullStats(): Promise<{
    memorySize: number;
    indexedDBSize: number;
    totalSize: number;
  }> {
    const memorySize = this.memoryCache.size();
    const indexedDBSize = this.indexedDBCache ? await this.indexedDBCache.size() : 0;

    return {
      memorySize,
      indexedDBSize,
      totalSize: memorySize + indexedDBSize,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let cacheManagerInstance: CacheManager | null = null;

/**
 * Get the global cache manager instance
 */
export function getCacheManager(config?: Partial<CacheConfig>): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(config);
  }
  return cacheManagerInstance;
}

/**
 * Reset cache manager (useful for testing)
 */
export function resetCacheManager(): void {
  cacheManagerInstance = null;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Fetch data with caching
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const result = await getCacheManager().fetch(key, fetcher, options);
  return result.data;
}

/**
 * Invalidate cache entries by tags
 */
export async function invalidateCache(tags: string[]): Promise<number> {
  return getCacheManager().invalidateByTags(tags);
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  return getCacheManager().clear();
}

/**
 * Prefetch data into cache
 */
export function prefetchData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): void {
  getCacheManager().prefetch(key, fetcher, options);
}
