'use client';

import * as React from 'react';
import type {
  FilterConfig,
  FilterDefinition,
  FilterGroup,
  FilterState,
  PaginatedResults,
  PaginationConfig,
  SortConfig,
  SortDirection,
} from '@/lib/search/types';
import { and, applyFilters, eq, inArray } from '@/lib/search/filters';

// ============================================================================
// Types
// ============================================================================

export interface UseFiltersOptions<T> {
  /** Items to filter */
  items: T[];
  /** Filter definitions */
  definitions: FilterDefinition<T>[];
  /** Initial filter values */
  initialFilters?: Record<string, unknown>;
  /** Initial sort config */
  initialSort?: SortConfig<T>;
  /** Initial pagination */
  initialPagination?: PaginationConfig;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Callback when filters change */
  onFiltersChange?: (filters: Map<string, unknown>) => void;
  /** Persist filters to URL */
  persistToUrl?: boolean;
}

export interface UseFiltersReturn<T> {
  /** Filtered and paginated results */
  results: PaginatedResults<T>;
  /** Filter state */
  state: FilterState<T>;
  /** Active filters map */
  activeFilters: Map<string, unknown>;
  /** Set a single filter */
  setFilter: (filterId: string, value: unknown) => void;
  /** Clear a single filter */
  clearFilter: (filterId: string) => void;
  /** Clear all filters */
  clearAllFilters: () => void;
  /** Set multiple filters at once */
  setFilters: (filters: Record<string, unknown>) => void;
  /** Set sort configuration */
  setSort: (field: keyof T | string, direction?: SortDirection) => void;
  /** Clear sort */
  clearSort: () => void;
  /** Go to page */
  goToPage: (page: number) => void;
  /** Set page size */
  setPageSize: (size: number) => void;
  /** Next page */
  nextPage: () => void;
  /** Previous page */
  prevPage: () => void;
  /** Has active filters */
  hasActiveFilters: boolean;
  /** Active filter count */
  activeFilterCount: number;
  /** Get filter value */
  getFilterValue: (filterId: string) => unknown;
  /** Is filter active */
  isFilterActive: (filterId: string) => boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useFilters<T>(options: UseFiltersOptions<T>): UseFiltersReturn<T> {
  const {
    items,
    definitions,
    initialFilters = {},
    initialSort,
    initialPagination = { page: 1, pageSize: 10 },
    onFiltersChange,
  } = options;

  // State
  const [activeFilters, setActiveFilters] = React.useState<Map<string, unknown>>(() => {
    const map = new Map<string, unknown>();
    Object.entries(initialFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        map.set(key, value);
      }
    });
    return map;
  });

  const [sort, setSort] = React.useState<SortConfig<T> | null>(initialSort ?? null);
  const [pagination, setPagination] = React.useState<PaginationConfig>(initialPagination);

  // Build filter config
  const buildFilterConfig = React.useCallback((): FilterConfig<T> => {
    const conditions: Array<ReturnType<typeof eq<T>>> = [];

    activeFilters.forEach((value, filterId) => {
      const definition = definitions.find((d) => d.id === filterId);
      if (!definition || value === undefined || value === null) return;

      if (Array.isArray(value) && value.length > 0) {
        conditions.push(inArray<T>(definition.field, value));
      } else if (value !== '') {
        conditions.push(eq<T>(definition.field, value));
      }
    });

    const filters: FilterGroup<T> = conditions.length > 0 ? and(...conditions) : { type: 'and', conditions: [] };

    return {
      filters,
      sort: sort ? [sort] : undefined,
      pagination,
    };
  }, [activeFilters, definitions, sort, pagination]);

  // Apply filters and get results
  const results = React.useMemo(() => {
    const config = buildFilterConfig();
    return applyFilters(items, config);
  }, [items, buildFilterConfig]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [activeFilters]);

  // Notify on filter change
  React.useEffect(() => {
    onFiltersChange?.(activeFilters);
  }, [activeFilters, onFiltersChange]);

  // Filter actions
  const setFilter = React.useCallback((filterId: string, value: unknown) => {
    setActiveFilters((prev) => {
      const next = new Map(prev);
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        next.delete(filterId);
      } else {
        next.set(filterId, value);
      }
      return next;
    });
  }, []);

  const clearFilter = React.useCallback((filterId: string) => {
    setActiveFilters((prev) => {
      const next = new Map(prev);
      next.delete(filterId);
      return next;
    });
  }, []);

  const clearAllFilters = React.useCallback(() => {
    setActiveFilters(new Map());
  }, []);

  const setFilters = React.useCallback((filters: Record<string, unknown>) => {
    setActiveFilters((prev) => {
      const next = new Map(prev);
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' ||
            (Array.isArray(value) && value.length === 0)) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      return next;
    });
  }, []);

  // Sort actions
  const setSortConfig = React.useCallback((field: keyof T | string, direction: SortDirection = 'asc') => {
    setSort({ field, direction });
  }, []);

  const clearSort = React.useCallback(() => {
    setSort(null);
  }, []);

  // Pagination actions
  const goToPage = React.useCallback((page: number) => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(1, Math.min(page, results.totalPages || 1)),
    }));
  }, [results.totalPages]);

  const setPageSize = React.useCallback((size: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: size,
      page: 1, // Reset to first page
    }));
  }, []);

  const nextPage = React.useCallback(() => {
    if (results.hasNext) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  }, [results.hasNext]);

  const prevPage = React.useCallback(() => {
    if (results.hasPrev) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  }, [results.hasPrev]);

  // Utility functions
  const getFilterValue = React.useCallback(
    (filterId: string) => activeFilters.get(filterId),
    [activeFilters]
  );

  const isFilterActive = React.useCallback(
    (filterId: string) => activeFilters.has(filterId),
    [activeFilters]
  );

  // Computed values
  const hasActiveFilters = activeFilters.size > 0;
  const activeFilterCount = activeFilters.size;

  // Build state object
  const state: FilterState<T> = {
    activeFilters,
    definitions,
    sort,
    pagination,
  };

  return {
    results,
    state,
    activeFilters,
    setFilter,
    clearFilter,
    clearAllFilters,
    setFilters,
    setSort: setSortConfig,
    clearSort,
    goToPage,
    setPageSize,
    nextPage,
    prevPage,
    hasActiveFilters,
    activeFilterCount,
    getFilterValue,
    isFilterActive,
  };
}

// ============================================================================
// URL Persistence Hook
// ============================================================================

export interface UseUrlFiltersOptions<T> extends Omit<UseFiltersOptions<T>, 'initialFilters'> {
  /** URL param prefix */
  paramPrefix?: string;
  /** Parse value from URL */
  parseValue?: (key: string, value: string) => unknown;
  /** Serialize value for URL */
  serializeValue?: (key: string, value: unknown) => string;
}

export function useUrlFilters<T>(options: UseUrlFiltersOptions<T>): UseFiltersReturn<T> {
  const {
    paramPrefix = 'filter_',
    parseValue = (_key, value) => value,
    serializeValue = (_key, value) => String(value),
    ...filterOptions
  } = options;

  // Parse initial filters from URL
  const initialFilters = React.useMemo(() => {
    if (typeof window === 'undefined') return {};
    
    const params = new URLSearchParams(window.location.search);
    const filters: Record<string, unknown> = {};
    
    params.forEach((value, key) => {
      if (key.startsWith(paramPrefix)) {
        const filterId = key.slice(paramPrefix.length);
        filters[filterId] = parseValue(filterId, value);
      }
    });
    
    return filters;
  }, [paramPrefix, parseValue]);

  const filterResult = useFilters({
    ...filterOptions,
    initialFilters,
    onFiltersChange: React.useCallback(
      (filters: Map<string, unknown>) => {
        if (typeof window === 'undefined') return;
        
        const params = new URLSearchParams(window.location.search);
        
        // Remove old filter params
        [...params.keys()].forEach((key) => {
          if (key.startsWith(paramPrefix)) {
            params.delete(key);
          }
        });
        
        // Add new filter params
        filters.forEach((value, filterId) => {
          if (value !== undefined && value !== null) {
            params.set(`${paramPrefix}${filterId}`, serializeValue(filterId, value));
          }
        });
        
        // Update URL without reload
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, '', newUrl);
        
        filterOptions.onFiltersChange?.(filters);
      },
      [paramPrefix, serializeValue, filterOptions]
    ),
  });

  return filterResult;
}

// ============================================================================
// Filter Presets
// ============================================================================

export interface FilterPreset<T = unknown> {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  sort?: SortConfig<T>;
}

export interface UseFilterPresetsOptions<T> {
  /** Available presets */
  presets: FilterPreset<T>[];
  /** Storage key for saved presets */
  storageKey?: string;
  /** Filters hook return */
  filtersHook: UseFiltersReturn<T>;
}

export interface UseFilterPresetsReturn<T> {
  /** Available presets */
  presets: FilterPreset<T>[];
  /** Apply a preset */
  applyPreset: (presetId: string) => void;
  /** Save current filters as preset */
  saveAsPreset: (name: string) => FilterPreset<T>;
  /** Delete a saved preset */
  deletePreset: (presetId: string) => void;
  /** Check if preset matches current filters */
  isPresetActive: (presetId: string) => boolean;
}

export function useFilterPresets<T>(options: UseFilterPresetsOptions<T>): UseFilterPresetsReturn<T> {
  const { presets: initialPresets, storageKey, filtersHook } = options;
  const [presets, setPresets] = React.useState<FilterPreset<T>[]>(initialPresets);

  // Load saved presets
  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedPresets = JSON.parse(saved) as FilterPreset<T>[];
        setPresets([...initialPresets, ...savedPresets]);
      }
    } catch {
      // Ignore errors
    }
  }, [storageKey, initialPresets]);

  const applyPreset = React.useCallback(
    (presetId: string) => {
      const preset = presets.find((p) => p.id === presetId);
      if (!preset) return;

      filtersHook.clearAllFilters();
      filtersHook.setFilters(preset.filters);
      if (preset.sort) {
        filtersHook.setSort(preset.sort.field, preset.sort.direction);
      }
    },
    [presets, filtersHook]
  );

  const saveAsPreset = React.useCallback(
    (name: string): FilterPreset<T> => {
      const preset: FilterPreset<T> = {
        id: `custom_${Date.now()}`,
        name,
        filters: Object.fromEntries(filtersHook.activeFilters),
        sort: filtersHook.state.sort ?? undefined,
      };

      setPresets((prev) => {
        const updated = [...prev, preset];
        if (storageKey) {
          const customPresets = updated.filter((p) => p.id.startsWith('custom_'));
          try {
            localStorage.setItem(storageKey, JSON.stringify(customPresets));
          } catch {
            // Ignore errors
          }
        }
        return updated;
      });

      return preset;
    },
    [filtersHook.activeFilters, filtersHook.state.sort, storageKey]
  );

  const deletePreset = React.useCallback(
    (presetId: string) => {
      setPresets((prev) => {
        const updated = prev.filter((p) => p.id !== presetId);
        if (storageKey) {
          const customPresets = updated.filter((p) => p.id.startsWith('custom_'));
          try {
            localStorage.setItem(storageKey, JSON.stringify(customPresets));
          } catch {
            // Ignore errors
          }
        }
        return updated;
      });
    },
    [storageKey]
  );

  const isPresetActive = React.useCallback(
    (presetId: string): boolean => {
      const preset = presets.find((p) => p.id === presetId);
      if (!preset) return false;

      const currentFilters = Object.fromEntries(filtersHook.activeFilters);
      return JSON.stringify(preset.filters) === JSON.stringify(currentFilters);
    },
    [presets, filtersHook.activeFilters]
  );

  return {
    presets,
    applyPreset,
    saveAsPreset,
    deletePreset,
    isPresetActive,
  };
}

export default useFilters;
