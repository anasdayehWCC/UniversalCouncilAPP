'use client';

import * as React from 'react';
import type { SearchQuery, SearchResults, SearchState } from '@/lib/search/types';
import { fuzzySearch, type FuzzyConfig } from '@/lib/search/fuzzy';

// ============================================================================
// Types
// ============================================================================

export interface UseSearchOptions<T> {
  /** Items to search */
  items: T[];
  /** Get searchable text from item */
  getSearchableText: (item: T) => Record<string, string>;
  /** Fields to search (all if empty) */
  fields?: string[];
  /** Minimum query length to trigger search */
  minQueryLength?: number;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Fuzzy matching config */
  fuzzyConfig?: FuzzyConfig;
  /** Max results to return */
  limit?: number;
  /** Callback when search completes */
  onSearchComplete?: (results: SearchResults<T>) => void;
  /** Store recent searches */
  storeRecentSearches?: boolean;
  /** Max recent searches to store */
  maxRecentSearches?: number;
}

export interface UseSearchReturn<T> {
  /** Current search query */
  query: string;
  /** Set search query */
  setQuery: (query: string) => void;
  /** Clear search */
  clear: () => void;
  /** Search state */
  state: SearchState<T>;
  /** Is searching */
  isSearching: boolean;
  /** Search results */
  results: SearchResults<T> | null;
  /** Search error */
  error: Error | null;
  /** Recent searches */
  recentSearches: string[];
  /** Clear recent searches */
  clearRecentSearches: () => void;
  /** Search immediately (skip debounce) */
  searchNow: (query: string) => void;
}

// ============================================================================
// Hook
// ============================================================================

const RECENT_SEARCHES_KEY = 'universal-app-recent-searches';

export function useSearch<T>(options: UseSearchOptions<T>): UseSearchReturn<T> {
  const {
    items,
    getSearchableText,
    fields,
    minQueryLength = 1,
    debounceMs = 300,
    fuzzyConfig,
    limit,
    onSearchComplete,
    storeRecentSearches = true,
    maxRecentSearches = 10,
  } = options;

  // State
  const [query, setQueryState] = React.useState('');
  const [state, setState] = React.useState<SearchState<T>>({
    query: '',
    isSearching: false,
    results: null,
    error: null,
    recentSearches: [],
  });

  // Refs
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  // Load recent searches from storage
  React.useEffect(() => {
    if (!storeRecentSearches) return;
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const recent = JSON.parse(stored) as string[];
        setState((prev) => ({ ...prev, recentSearches: recent }));
      }
    } catch {
      // Ignore storage errors
    }
  }, [storeRecentSearches]);

  // Save recent search
  const saveRecentSearch = React.useCallback(
    (searchQuery: string) => {
      if (!storeRecentSearches || !searchQuery.trim()) return;

      setState((prev) => {
        const recent = [
          searchQuery,
          ...prev.recentSearches.filter((s) => s !== searchQuery),
        ].slice(0, maxRecentSearches);

        try {
          localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
        } catch {
          // Ignore storage errors
        }

        return { ...prev, recentSearches: recent };
      });
    },
    [storeRecentSearches, maxRecentSearches]
  );

  // Perform search
  const performSearch = React.useCallback(
    (searchQuery: string) => {
      // Cancel previous search
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      if (!searchQuery || searchQuery.length < minQueryLength) {
        setState((prev) => ({
          ...prev,
          query: searchQuery,
          isSearching: false,
          results: null,
          error: null,
        }));
        return;
      }

      setState((prev) => ({ ...prev, query: searchQuery, isSearching: true }));

      try {
        const startTime = performance.now();

        const searchQueryObj: SearchQuery = {
          text: searchQuery,
          fields,
          limit,
          fuzzy: true,
          fuzzyThreshold: fuzzyConfig?.threshold,
        };

        const results = fuzzySearch(items, searchQueryObj, getSearchableText, fuzzyConfig);
        const duration = performance.now() - startTime;

        const searchResults: SearchResults<T> = {
          items: results,
          total: results.length,
          query: searchQueryObj,
          duration,
        };

        setState((prev) => ({
          ...prev,
          isSearching: false,
          results: searchResults,
          error: null,
        }));

        onSearchComplete?.(searchResults);
        saveRecentSearch(searchQuery);
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isSearching: false,
          error: err instanceof Error ? err : new Error('Search failed'),
        }));
      }
    },
    [items, getSearchableText, fields, minQueryLength, fuzzyConfig, limit, onSearchComplete, saveRecentSearch]
  );

  // Debounced search
  const setQuery = React.useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (debounceMs > 0) {
        setState((prev) => ({ ...prev, query: newQuery, isSearching: true }));
        debounceRef.current = setTimeout(() => {
          performSearch(newQuery);
        }, debounceMs);
      } else {
        performSearch(newQuery);
      }
    },
    [debounceMs, performSearch]
  );

  // Search immediately
  const searchNow = React.useCallback(
    (searchQuery: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      setQueryState(searchQuery);
      performSearch(searchQuery);
    },
    [performSearch]
  );

  // Clear search
  const clear = React.useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setQueryState('');
    setState((prev) => ({
      ...prev,
      query: '',
      isSearching: false,
      results: null,
      error: null,
    }));
  }, []);

  // Clear recent searches
  const clearRecentSearches = React.useCallback(() => {
    setState((prev) => ({ ...prev, recentSearches: [] }));
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Cleanup
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      abortRef.current?.abort();
    };
  }, []);

  return {
    query,
    setQuery,
    clear,
    state,
    isSearching: state.isSearching,
    results: state.results,
    error: state.error,
    recentSearches: state.recentSearches,
    clearRecentSearches,
    searchNow,
  };
}

// ============================================================================
// Async Search Hook (for API calls)
// ============================================================================

export interface UseAsyncSearchOptions<T> {
  /** Async search function */
  searchFn: (query: SearchQuery, signal: AbortSignal) => Promise<SearchResults<T>>;
  /** Minimum query length */
  minQueryLength?: number;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Callback when search completes */
  onSearchComplete?: (results: SearchResults<T>) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export function useAsyncSearch<T>(options: UseAsyncSearchOptions<T>): UseSearchReturn<T> {
  const {
    searchFn,
    minQueryLength = 1,
    debounceMs = 300,
    onSearchComplete,
    onError,
  } = options;

  const [query, setQueryState] = React.useState('');
  const [state, setState] = React.useState<SearchState<T>>({
    query: '',
    isSearching: false,
    results: null,
    error: null,
    recentSearches: [],
  });

  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const performSearch = React.useCallback(
    async (searchQuery: string) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      if (!searchQuery || searchQuery.length < minQueryLength) {
        setState((prev) => ({
          ...prev,
          query: searchQuery,
          isSearching: false,
          results: null,
          error: null,
        }));
        return;
      }

      setState((prev) => ({ ...prev, query: searchQuery, isSearching: true }));

      try {
        const searchQueryObj: SearchQuery = { text: searchQuery };
        const results = await searchFn(searchQueryObj, abortRef.current.signal);

        setState((prev) => ({
          ...prev,
          isSearching: false,
          results,
          error: null,
        }));

        onSearchComplete?.(results);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Ignore aborted requests
        }

        const error = err instanceof Error ? err : new Error('Search failed');
        setState((prev) => ({
          ...prev,
          isSearching: false,
          error,
        }));
        onError?.(error);
      }
    },
    [searchFn, minQueryLength, onSearchComplete, onError]
  );

  const setQuery = React.useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (debounceMs > 0) {
        setState((prev) => ({ ...prev, isSearching: true }));
        debounceRef.current = setTimeout(() => {
          performSearch(newQuery);
        }, debounceMs);
      } else {
        performSearch(newQuery);
      }
    },
    [debounceMs, performSearch]
  );

  const searchNow = React.useCallback(
    (searchQuery: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      setQueryState(searchQuery);
      performSearch(searchQuery);
    },
    [performSearch]
  );

  const clear = React.useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    abortRef.current?.abort();
    setQueryState('');
    setState((prev) => ({
      ...prev,
      query: '',
      isSearching: false,
      results: null,
      error: null,
    }));
  }, []);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      abortRef.current?.abort();
    };
  }, []);

  return {
    query,
    setQuery,
    clear,
    state,
    isSearching: state.isSearching,
    results: state.results,
    error: state.error,
    recentSearches: state.recentSearches,
    clearRecentSearches: () => {},
    searchNow,
  };
}

export default useSearch;
