/**
 * Recent Items Storage
 *
 * LocalStorage-based persistence for recent items with deduplication
 * and automatic cleanup.
 *
 * @module lib/recent/storage
 */

import {
  RecentItem,
  RecentItemType,
  RecentItemsState,
  RecentItemsConfig,
  DEFAULT_RECENT_CONFIG,
  AddRecentItemOptions,
  RecentItemsFilter,
} from './types';

// ============================================================================
// Storage Keys
// ============================================================================

function getStorageKey(prefix: string, type: RecentItemType): string {
  return `${prefix}-${type}`;
}

function getPinnedKey(prefix: string): string {
  return `${prefix}-pinned`;
}

// ============================================================================
// Storage Manager Class
// ============================================================================

/**
 * Manages recent items storage with localStorage
 */
export class RecentItemsStorage {
  private config: RecentItemsConfig;

  constructor(config: Partial<RecentItemsConfig> = {}) {
    this.config = { ...DEFAULT_RECENT_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // Core Operations
  // --------------------------------------------------------------------------

  /**
   * Get all items of a specific type
   */
  getItemsByType<T extends RecentItem>(type: RecentItemType): T[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const key = getStorageKey(this.config.storageKeyPrefix, type);
      const stored = localStorage.getItem(key);
      if (!stored) return [];
      
      const items = JSON.parse(stored) as T[];
      return this.sortByAccess(items);
    } catch (error) {
      console.error(`[RecentItems] Failed to get items for type ${type}:`, error);
      return [];
    }
  }

  /**
   * Get all items across all types
   */
  getAllItems(): RecentItem[] {
    const types: RecentItemType[] = ['meeting', 'template', 'search', 'case', 'document'];
    const allItems = types.flatMap(type => this.getItemsByType(type));
    return this.sortByAccess(allItems);
  }

  /**
   * Get pinned item IDs
   */
  getPinnedIds(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    
    try {
      const key = getPinnedKey(this.config.storageKeyPrefix);
      const stored = localStorage.getItem(key);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }

  /**
   * Add a recent item with deduplication
   */
  addItem<T extends RecentItem>(
    item: Omit<T, 'accessedAt' | 'isPinned'> & { accessedAt?: string; isPinned?: boolean },
    options: AddRecentItemOptions = {}
  ): T {
    if (typeof window === 'undefined') {
      return { ...item, accessedAt: new Date().toISOString(), isPinned: false } as T;
    }

    const type = item.type;
    const key = getStorageKey(this.config.storageKeyPrefix, type);
    const existingItems = this.getItemsByType<T>(type);
    const pinnedIds = this.getPinnedIds();

    // Create the new item
    const newItem: T = {
      ...item,
      accessedAt: item.accessedAt || new Date().toISOString(),
      isPinned: options.pinned ?? pinnedIds.has(item.id),
    } as T;

    // Check for duplicates
    const existingIndex = existingItems.findIndex(i => i.id === item.id);
    
    let updatedItems: T[];
    if (existingIndex >= 0) {
      if (options.forceUpdate !== false) {
        // Update existing item with new timestamp
        updatedItems = [
          newItem,
          ...existingItems.slice(0, existingIndex),
          ...existingItems.slice(existingIndex + 1),
        ];
      } else {
        // Keep existing, just return it
        return existingItems[existingIndex];
      }
    } else {
      // Add new item at the beginning
      updatedItems = [newItem, ...existingItems];
    }

    // Enforce max items limit
    if (this.config.autoCleanup && updatedItems.length > this.config.maxItemsPerType) {
      // Keep pinned items, trim unpinned ones
      const pinned = updatedItems.filter(i => i.isPinned);
      const unpinned = updatedItems.filter(i => !i.isPinned);
      const keepUnpinned = unpinned.slice(0, this.config.maxItemsPerType - pinned.length);
      updatedItems = [...pinned, ...keepUnpinned];
    }

    // Save to storage
    try {
      localStorage.setItem(key, JSON.stringify(updatedItems));
    } catch (error) {
      console.error(`[RecentItems] Failed to save items:`, error);
    }

    return newItem;
  }

  /**
   * Remove an item by ID and type
   */
  removeItem(type: RecentItemType, id: string): boolean {
    if (typeof window === 'undefined') return false;

    const key = getStorageKey(this.config.storageKeyPrefix, type);
    const items = this.getItemsByType(type);
    const filtered = items.filter(i => i.id !== id);

    if (filtered.length === items.length) return false;

    try {
      localStorage.setItem(key, JSON.stringify(filtered));
      // Also remove from pinned if applicable
      this.unpinItem(id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all items of a type
   */
  clearType(type: RecentItemType): void {
    if (typeof window === 'undefined') return;

    const key = getStorageKey(this.config.storageKeyPrefix, type);
    localStorage.removeItem(key);
  }

  /**
   * Clear all recent items
   */
  clearAll(): void {
    if (typeof window === 'undefined') return;

    const types: RecentItemType[] = ['meeting', 'template', 'search', 'case', 'document'];
    types.forEach(type => this.clearType(type));
    localStorage.removeItem(getPinnedKey(this.config.storageKeyPrefix));
  }

  // --------------------------------------------------------------------------
  // Pin Operations
  // --------------------------------------------------------------------------

  /**
   * Pin an item
   */
  pinItem(id: string): void {
    if (typeof window === 'undefined') return;

    const pinnedIds = this.getPinnedIds();
    pinnedIds.add(id);
    
    try {
      localStorage.setItem(
        getPinnedKey(this.config.storageKeyPrefix),
        JSON.stringify([...pinnedIds])
      );
      // Update isPinned flag in stored items
      this.updatePinnedFlag(id, true);
    } catch (error) {
      console.error('[RecentItems] Failed to pin item:', error);
    }
  }

  /**
   * Unpin an item
   */
  unpinItem(id: string): void {
    if (typeof window === 'undefined') return;

    const pinnedIds = this.getPinnedIds();
    if (!pinnedIds.has(id)) return;

    pinnedIds.delete(id);
    
    try {
      localStorage.setItem(
        getPinnedKey(this.config.storageKeyPrefix),
        JSON.stringify([...pinnedIds])
      );
      // Update isPinned flag in stored items
      this.updatePinnedFlag(id, false);
    } catch (error) {
      console.error('[RecentItems] Failed to unpin item:', error);
    }
  }

  /**
   * Toggle pin status
   */
  togglePin(id: string): boolean {
    const pinnedIds = this.getPinnedIds();
    const isPinned = pinnedIds.has(id);
    
    if (isPinned) {
      this.unpinItem(id);
    } else {
      this.pinItem(id);
    }
    
    return !isPinned;
  }

  /**
   * Update isPinned flag in stored item
   */
  private updatePinnedFlag(id: string, isPinned: boolean): void {
    const types: RecentItemType[] = ['meeting', 'template', 'search', 'case', 'document'];
    
    for (const type of types) {
      const key = getStorageKey(this.config.storageKeyPrefix, type);
      const items = this.getItemsByType(type);
      const itemIndex = items.findIndex(i => i.id === id);
      
      if (itemIndex >= 0) {
        items[itemIndex].isPinned = isPinned;
        try {
          localStorage.setItem(key, JSON.stringify(items));
        } catch {
          // Ignore
        }
        break;
      }
    }
  }

  // --------------------------------------------------------------------------
  // Filtering & Search
  // --------------------------------------------------------------------------

  /**
   * Get items with filtering
   */
  getFilteredItems(filter: RecentItemsFilter = {}): RecentItem[] {
    const { types, pinnedOnly, limit, search } = filter;

    let items: RecentItem[];

    if (types && types.length > 0) {
      items = types.flatMap(type => this.getItemsByType(type));
    } else {
      items = this.getAllItems();
    }

    // Apply pinned filter
    if (pinnedOnly) {
      items = items.filter(i => i.isPinned);
    }

    // Apply search filter
    if (search && search.trim()) {
      const query = search.toLowerCase().trim();
      items = items.filter(
        i =>
          i.title.toLowerCase().includes(query) ||
          i.subtitle?.toLowerCase().includes(query)
      );
    }

    // Sort: pinned first, then by access time
    items = this.sortWithPinnedFirst(items);

    // Apply limit
    if (limit && limit > 0) {
      items = items.slice(0, limit);
    }

    return items;
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  /**
   * Sort items by access time (most recent first)
   */
  private sortByAccess<T extends RecentItem>(items: T[]): T[] {
    return [...items].sort(
      (a, b) => new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime()
    );
  }

  /**
   * Sort items with pinned first, then by access time
   */
  private sortWithPinnedFirst<T extends RecentItem>(items: T[]): T[] {
    return [...items].sort((a, b) => {
      // Pinned items first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then by access time
      return new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime();
    });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let storageInstance: RecentItemsStorage | null = null;

/**
 * Get the shared storage instance
 */
export function getRecentItemsStorage(
  config?: Partial<RecentItemsConfig>
): RecentItemsStorage {
  if (!storageInstance || config) {
    storageInstance = new RecentItemsStorage(config);
  }
  return storageInstance;
}

/**
 * Reset the storage instance (useful for testing)
 */
export function resetRecentItemsStorage(): void {
  storageInstance = null;
}
