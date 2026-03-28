/**
 * Recent Items Hook
 *
 * Provides recent items management including retrieval, adding,
 * clearing, and pin/unpin functionality.
 *
 * @module hooks/useRecentItems
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  RecentItem,
  RecentItemType,
  RecentItemsFilter,
  AddRecentItemOptions,
  RECENT_TYPE_META,
  RecentMeetingItem,
  RecentTemplateItem,
  RecentSearchItem,
  RecentCaseItem,
  RecentDocumentItem,
} from '@/lib/recent';
import { getRecentItemsStorage, RecentItemsStorage } from '@/lib/recent/storage';

// ============================================================================
// Hook Options & Return Types
// ============================================================================

interface UseRecentItemsOptions {
  /** Filter to specific types */
  types?: RecentItemType[];
  /** Maximum items to return */
  limit?: number;
  /** Auto-refresh interval in ms (0 = disabled) */
  refreshInterval?: number;
}

interface UseRecentItemsReturn {
  // State
  items: RecentItem[];
  pinnedItems: RecentItem[];
  isLoading: boolean;

  // By type accessors
  meetings: RecentMeetingItem[];
  templates: RecentTemplateItem[];
  searches: RecentSearchItem[];
  cases: RecentCaseItem[];
  documents: RecentDocumentItem[];

  // Operations
  addRecent: <T extends RecentItem>(
    item: Omit<T, 'accessedAt' | 'isPinned'>,
    options?: AddRecentItemOptions
  ) => T;
  removeRecent: (type: RecentItemType, id: string) => boolean;
  clearRecent: (type?: RecentItemType) => void;

  // Search within recent
  searchRecent: (query: string, filter?: RecentItemsFilter) => RecentItem[];

  // Pin operations
  pinItem: (id: string) => void;
  unpinItem: (id: string) => void;
  togglePin: (id: string) => boolean;
  isPinned: (id: string) => boolean;

  // Navigation
  navigateToItem: (item: RecentItem) => void;

  // Refresh
  refresh: () => void;

  // Stats
  getCountByType: (type: RecentItemType) => number;
  totalCount: number;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useRecentItems(
  options: UseRecentItemsOptions = {}
): UseRecentItemsReturn {
  const { types, limit, refreshInterval = 0 } = options;
  const router = useRouter();

  // Storage instance
  const storage = useMemo(() => getRecentItemsStorage(), []);

  // State
  const [items, setItems] = useState<RecentItem[]>([]);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load items from storage
  const loadItems = useCallback(() => {
    setIsLoading(true);
    try {
      const filter: RecentItemsFilter = { types, limit };
      const loaded = storage.getFilteredItems(filter);
      setItems(loaded);
      setPinnedIds(storage.getPinnedIds());
    } catch (error) {
      console.error('[useRecentItems] Failed to load items:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [storage, types, limit]);

  // Initial load and refresh
  useEffect(() => {
    loadItems();
  }, [loadItems, refreshKey]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      loadItems();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, loadItems]);

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('recent-items')) {
        loadItems();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadItems]);

  // Computed: items by type
  const meetings = useMemo(
    () => items.filter((i): i is RecentMeetingItem => i.type === 'meeting'),
    [items]
  );

  const templates = useMemo(
    () => items.filter((i): i is RecentTemplateItem => i.type === 'template'),
    [items]
  );

  const searches = useMemo(
    () => items.filter((i): i is RecentSearchItem => i.type === 'search'),
    [items]
  );

  const cases = useMemo(
    () => items.filter((i): i is RecentCaseItem => i.type === 'case'),
    [items]
  );

  const documents = useMemo(
    () => items.filter((i): i is RecentDocumentItem => i.type === 'document'),
    [items]
  );

  // Computed: pinned items
  const pinnedItems = useMemo(
    () => items.filter(i => i.isPinned),
    [items]
  );

  // --------------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------------

  const addRecent = useCallback(
    <T extends RecentItem>(
      item: Omit<T, 'accessedAt' | 'isPinned'>,
      opts?: AddRecentItemOptions
    ): T => {
      const result = storage.addItem<T>(item, opts);
      // Trigger refresh
      setRefreshKey(k => k + 1);
      return result;
    },
    [storage]
  );

  const removeRecent = useCallback(
    (type: RecentItemType, id: string): boolean => {
      const result = storage.removeItem(type, id);
      if (result) {
        setRefreshKey(k => k + 1);
      }
      return result;
    },
    [storage]
  );

  const clearRecent = useCallback(
    (type?: RecentItemType): void => {
      if (type) {
        storage.clearType(type);
      } else {
        storage.clearAll();
      }
      setRefreshKey(k => k + 1);
    },
    [storage]
  );

  const searchRecent = useCallback(
    (query: string, filter?: RecentItemsFilter): RecentItem[] => {
      return storage.getFilteredItems({
        ...filter,
        search: query,
      });
    },
    [storage]
  );

  // --------------------------------------------------------------------------
  // Pin Operations
  // --------------------------------------------------------------------------

  const pinItem = useCallback(
    (id: string): void => {
      storage.pinItem(id);
      setPinnedIds(prev => new Set([...prev, id]));
      setRefreshKey(k => k + 1);
    },
    [storage]
  );

  const unpinItem = useCallback(
    (id: string): void => {
      storage.unpinItem(id);
      setPinnedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setRefreshKey(k => k + 1);
    },
    [storage]
  );

  const togglePin = useCallback(
    (id: string): boolean => {
      const newPinned = storage.togglePin(id);
      setPinnedIds(storage.getPinnedIds());
      setRefreshKey(k => k + 1);
      return newPinned;
    },
    [storage]
  );

  const isPinned = useCallback(
    (id: string): boolean => {
      return pinnedIds.has(id);
    },
    [pinnedIds]
  );

  // --------------------------------------------------------------------------
  // Navigation
  // --------------------------------------------------------------------------

  const navigateToItem = useCallback(
    (item: RecentItem): void => {
      // Update access time
      storage.addItem(item, { forceUpdate: true });
      setRefreshKey(k => k + 1);
      // Navigate
      router.push(item.path);
    },
    [storage, router]
  );

  // --------------------------------------------------------------------------
  // Stats
  // --------------------------------------------------------------------------

  const getCountByType = useCallback(
    (type: RecentItemType): number => {
      return storage.getItemsByType(type).length;
    },
    [storage]
  );

  const totalCount = useMemo(() => items.length, [items]);

  // --------------------------------------------------------------------------
  // Refresh
  // --------------------------------------------------------------------------

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return {
    // State
    items,
    pinnedItems,
    isLoading,

    // By type
    meetings,
    templates,
    searches,
    cases,
    documents,

    // Operations
    addRecent,
    removeRecent,
    clearRecent,
    searchRecent,

    // Pin operations
    pinItem,
    unpinItem,
    togglePin,
    isPinned,

    // Navigation
    navigateToItem,

    // Refresh
    refresh,

    // Stats
    getCountByType,
    totalCount,
  };
}

// ============================================================================
// Helpers for Adding Items
// ============================================================================

/**
 * Helper to create a recent meeting item
 */
export function createRecentMeeting(
  id: string,
  title: string,
  path: string,
  metadata?: RecentMeetingItem['metadata']
): Omit<RecentMeetingItem, 'accessedAt' | 'isPinned'> {
  return {
    id,
    type: 'meeting',
    title,
    subtitle: metadata?.caseReference,
    icon: RECENT_TYPE_META.meeting.icon,
    color: RECENT_TYPE_META.meeting.color,
    path,
    metadata,
  };
}

/**
 * Helper to create a recent template item
 */
export function createRecentTemplate(
  id: string,
  title: string,
  path: string,
  metadata?: RecentTemplateItem['metadata']
): Omit<RecentTemplateItem, 'accessedAt' | 'isPinned'> {
  return {
    id,
    type: 'template',
    title,
    subtitle: metadata?.category,
    icon: RECENT_TYPE_META.template.icon,
    color: RECENT_TYPE_META.template.color,
    path,
    metadata,
  };
}

/**
 * Helper to create a recent search item
 */
export function createRecentSearch(
  query: string,
  resultCount?: number,
  filters?: Record<string, unknown>
): Omit<RecentSearchItem, 'accessedAt' | 'isPinned'> {
  const id = `search-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return {
    id,
    type: 'search',
    title: query,
    subtitle: resultCount !== undefined ? `${resultCount} results` : undefined,
    icon: RECENT_TYPE_META.search.icon,
    color: RECENT_TYPE_META.search.color,
    path: `/search?q=${encodeURIComponent(query)}`,
    metadata: { query, resultCount, filters },
  };
}

/**
 * Helper to create a recent case item
 */
export function createRecentCase(
  id: string,
  caseReference: string,
  path: string,
  metadata?: { subjectInitials?: string; meetingCount?: number }
): Omit<RecentCaseItem, 'accessedAt' | 'isPinned'> {
  return {
    id,
    type: 'case',
    title: caseReference,
    subtitle: metadata?.subjectInitials,
    icon: RECENT_TYPE_META.case.icon,
    color: RECENT_TYPE_META.case.color,
    path,
    metadata: metadata ? { ...metadata, caseReference } : { caseReference },
  };
}

/**
 * Helper to create a recent document item
 */
export function createRecentDocument(
  id: string,
  title: string,
  path: string,
  metadata?: RecentDocumentItem['metadata']
): Omit<RecentDocumentItem, 'accessedAt' | 'isPinned'> {
  return {
    id,
    type: 'document',
    title,
    subtitle: metadata?.documentType,
    icon: RECENT_TYPE_META.document.icon,
    color: RECENT_TYPE_META.document.color,
    path,
    metadata,
  };
}
