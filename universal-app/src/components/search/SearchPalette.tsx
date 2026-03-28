'use client';

/**
 * SearchPalette Component
 * 
 * Command palette style search modal triggered by Cmd+K (Mac) or Ctrl+K (Windows/Linux).
 * Features categorized results, keyboard navigation, and recent searches.
 * 
 * @module components/search/SearchPalette
 */

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Clock,
  ArrowRight,
  FileText,
  Users,
  LayoutTemplate,
  Command,
  Loader2,
  Trash2,
  CornerDownLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSearchRegistry,
  type SearchableItem,
  type SearchCategory,
} from '@/lib/search/registry';
import { KeyboardShortcutHint } from '@/components/ui/KeyboardShortcutHint';

// ============================================================================
// Types
// ============================================================================

export interface SearchPaletteProps {
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Categories to search */
  categories?: SearchCategory[];
  /** Placeholder text */
  placeholder?: string;
  /** Called when a result is selected */
  onSelect?: (item: SearchableItem) => void;
  /** Custom result renderer */
  renderResult?: (item: SearchableItem, isSelected: boolean) => React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

interface ResultGroup {
  category: SearchCategory;
  label: string;
  icon: React.ReactNode;
  items: SearchableItem[];
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_CONFIG: Record<SearchCategory, { label: string; icon: React.ReactNode }> = {
  meetings: { label: 'Meetings', icon: <FileText className="h-4 w-4" /> },
  templates: { label: 'Templates', icon: <LayoutTemplate className="h-4 w-4" /> },
  users: { label: 'People', icon: <Users className="h-4 w-4" /> },
  actions: { label: 'Actions', icon: <Command className="h-4 w-4" /> },
};

// ============================================================================
// Animation Variants
// ============================================================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const paletteVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: { 
    opacity: 0, 
    scale: 0.96, 
    y: -10,
    transition: { duration: 0.1 },
  },
};

// ============================================================================
// Main Component
// ============================================================================

export function SearchPalette({
  open: controlledOpen,
  onOpenChange,
  categories = ['meetings', 'templates', 'users', 'actions'],
  placeholder = 'Search meetings, templates, actions...',
  onSelect,
  renderResult,
  className,
}: SearchPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  // State
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchableItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Use controlled or internal state
  const isOpen = controlledOpen ?? internalOpen;
  
  const setOpen = useCallback((value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  }, [onOpenChange]);

  // Get registry instance
  const registry = useMemo(() => getSearchRegistry(), []);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(registry.getRecentSearches());
  }, [registry, isOpen]);

  // Perform search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      setSelectedIndex(0);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const searchResults = registry.search(query, { categories });
      setResults(searchResults);
      setIsSearching(false);
      setSelectedIndex(0);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, categories, registry]);

  // Group results by category
  const groupedResults = useMemo((): ResultGroup[] => {
    const groups: Map<SearchCategory, SearchableItem[]> = new Map();
    
    results.forEach((item) => {
      const existing = groups.get(item.category) ?? [];
      groups.set(item.category, [...existing, item]);
    });

    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      ...CATEGORY_CONFIG[category],
      items,
    }));
  }, [results]);

  // Flatten items for keyboard navigation
  const flatItems = useMemo(() => 
    groupedResults.flatMap((group) => group.items),
    [groupedResults]
  );

  // Handle open/close
  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(0);
  }, [setOpen]);

  // Handle result selection
  const handleSelect = useCallback((item: SearchableItem) => {
    // Save to recent searches
    registry.addRecentSearch(query);
    
    // Handle actions
    if (item.category === 'actions' && item.metadata?.handler) {
      (item.metadata.handler as () => void)();
      handleClose();
      return;
    }

    // Call custom handler or navigate
    if (onSelect) {
      onSelect(item);
    } else if (item.url) {
      router.push(item.url);
    }
    
    handleClose();
  }, [query, registry, onSelect, router, handleClose]);

  // Handle recent search click
  const handleRecentSearchClick = useCallback((searchText: string) => {
    setQuery(searchText);
    inputRef.current?.focus();
  }, []);

  // Clear recent searches
  const handleClearRecent = useCallback(() => {
    registry.clearRecentSearches();
    setRecentSearches([]);
  }, [registry]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < flatItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : flatItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          handleSelect(flatItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'Tab':
        e.preventDefault();
        // Tab cycles through results
        if (e.shiftKey) {
          setSelectedIndex((prev) => 
            prev > 0 ? prev - 1 : flatItems.length - 1
          );
        } else {
          setSelectedIndex((prev) => 
            prev < flatItems.length - 1 ? prev + 1 : 0
          );
        }
        break;
    }
  }, [flatItems, selectedIndex, handleSelect, handleClose]);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Open palette with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, setOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && flatItems.length > 0) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, flatItems.length]);

  // Show recent searches when no query
  const showRecentSearches = !query.trim() && recentSearches.length > 0;

  // Don't render on server
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Palette */}
          <motion.div
            variants={paletteVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2 px-4"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Search"
              className={cn(
                'overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700',
                'bg-white dark:bg-slate-900 shadow-2xl',
                'ring-1 ring-black/5 dark:ring-white/10',
                className
              )}
            >
              {/* Search Input */}
              <div className="flex items-center border-b border-slate-200 dark:border-slate-700 px-4">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className={cn(
                    'flex-1 bg-transparent py-4 px-3 text-base',
                    'text-slate-900 dark:text-slate-100',
                    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                    'focus:outline-none'
                  )}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                {isSearching && (
                  <Loader2 className="h-5 w-5 text-slate-400 animate-spin shrink-0" />
                )}
                {query && !isSearching && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Results */}
              <div
                ref={listRef}
                className="max-h-[60vh] overflow-y-auto overscroll-contain"
              >
                {/* Recent Searches */}
                {showRecentSearches && (
                  <div className="p-2">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        <Clock className="h-3.5 w-3.5" />
                        Recent Searches
                      </span>
                      <button
                        onClick={handleClearRecent}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Clear
                      </button>
                    </div>
                    <ul>
                      {recentSearches.map((search, index) => (
                        <li key={`recent-${index}`}>
                          <button
                            onClick={() => handleRecentSearchClick(search)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left',
                              'text-slate-700 dark:text-slate-300',
                              'hover:bg-slate-100 dark:hover:bg-slate-800',
                              'transition-colors'
                            )}
                          >
                            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="truncate">{search}</span>
                            <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 ml-auto shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Search Results */}
                {query && !isSearching && results.length === 0 && (
                  <div className="px-4 py-12 text-center">
                    <Search className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      No results found
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Try a different search term
                    </p>
                  </div>
                )}

                {groupedResults.length > 0 && (
                  <div className="p-2">
                    {groupedResults.map((group) => (
                      <div key={group.category} className="mb-2 last:mb-0">
                        <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          {group.icon}
                          {group.label}
                          <span className="text-slate-400 dark:text-slate-500 font-normal">
                            ({group.items.length})
                          </span>
                        </div>
                        <ul>
                          {group.items.map((item) => {
                            const itemIndex = flatItems.indexOf(item);
                            const isSelected = itemIndex === selectedIndex;

                            if (renderResult) {
                              return (
                                <li key={item.id} data-index={itemIndex}>
                                  <button
                                    onClick={() => handleSelect(item)}
                                    className="w-full"
                                  >
                                    {renderResult(item, isSelected)}
                                  </button>
                                </li>
                              );
                            }

                            return (
                              <li key={item.id} data-index={itemIndex}>
                                <button
                                  onClick={() => handleSelect(item)}
                                  className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
                                    'transition-colors',
                                    isSelected
                                      ? 'bg-indigo-600 text-white'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  )}
                                >
                                  {/* Icon */}
                                  <span
                                    className={cn(
                                      'flex h-8 w-8 items-center justify-center rounded-lg shrink-0 text-sm',
                                      isSelected
                                        ? 'bg-white/20'
                                        : 'bg-slate-100 dark:bg-slate-800'
                                    )}
                                  >
                                    {item.icon || '📄'}
                                  </span>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">
                                      {item.title}
                                    </div>
                                    {(item.subtitle || item.description) && (
                                      <div
                                        className={cn(
                                          'text-sm truncate',
                                          isSelected
                                            ? 'text-white/70'
                                            : 'text-slate-500 dark:text-slate-400'
                                        )}
                                      >
                                        {item.subtitle || item.description}
                                      </div>
                                    )}
                                  </div>

                                  {/* Shortcut / Arrow */}
                                  {item.category === 'actions' && item.subtitle ? (
                                    <KeyboardShortcutHint
                                      shortcutKey={item.subtitle}
                                      size="xs"
                                      className={cn(
                                        isSelected && 'bg-white/20 text-white border-white/20'
                                      )}
                                    />
                                  ) : (
                                    <ArrowRight
                                      className={cn(
                                        'h-4 w-4 shrink-0',
                                        isSelected
                                          ? 'text-white/50'
                                          : 'text-slate-300 dark:text-slate-600'
                                      )}
                                    />
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                      <CornerDownLeft className="h-3 w-3 inline" />
                    </kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">esc</kbd>
                    Close
                  </span>
                </div>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                  ⌘K
                </kbd>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ============================================================================
// Hook for using SearchPalette
// ============================================================================

export interface UseSearchPaletteReturn {
  /** Open the search palette */
  open: () => void;
  /** Close the search palette */
  close: () => void;
  /** Toggle the search palette */
  toggle: () => void;
  /** Whether the palette is open */
  isOpen: boolean;
  /** Set the open state */
  setOpen: (open: boolean) => void;
}

export function useSearchPalette(): UseSearchPaletteReturn {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    open,
    close,
    toggle,
    isOpen,
    setOpen: setIsOpen,
  };
}
