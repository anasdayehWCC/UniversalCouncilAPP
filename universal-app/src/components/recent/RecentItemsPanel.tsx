/**
 * Recent Items Panel Component
 *
 * Sidebar panel displaying recent items with category tabs
 * and search functionality.
 *
 * @module components/recent/RecentItemsPanel
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Search,
  X,
  Calendar,
  FileText,
  Folder,
  File,
  ChevronLeft,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { RecentItemsList } from './RecentItemsList';
import { useRecentItems } from '@/hooks/useRecentItems';
import { RecentItemType, RECENT_TYPE_META, RecentItem } from '@/lib/recent';

// ============================================================================
// Types
// ============================================================================

type TabValue = 'all' | RecentItemType;

interface RecentItemsPanelProps {
  /** Panel is open/visible */
  isOpen?: boolean;
  /** Called when panel should close */
  onClose?: () => void;
  /** Show as collapsible sidebar */
  collapsible?: boolean;
  /** Default tab to show */
  defaultTab?: TabValue;
  /** Filter to specific types */
  allowedTypes?: RecentItemType[];
  /** Custom header content */
  headerContent?: React.ReactNode;
  /** Maximum items per tab */
  maxItemsPerTab?: number;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Tab Configuration
// ============================================================================

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}

const DEFAULT_TABS: TabConfig[] = [
  { value: 'all', label: 'All', icon: Clock },
  { value: 'meeting', label: 'Meetings', icon: Calendar, color: RECENT_TYPE_META.meeting.color },
  { value: 'template', label: 'Templates', icon: FileText, color: RECENT_TYPE_META.template.color },
  { value: 'case', label: 'Cases', icon: Folder, color: RECENT_TYPE_META.case.color },
  { value: 'search', label: 'Searches', icon: Search, color: RECENT_TYPE_META.search.color },
  { value: 'document', label: 'Documents', icon: File, color: RECENT_TYPE_META.document.color },
];

// ============================================================================
// Loading Skeleton
// ============================================================================

function RecentItemsSkeleton() {
  return (
    <div className="space-y-2 px-3 py-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RecentItemsPanel({
  isOpen = true,
  onClose,
  collapsible = false,
  defaultTab = 'all',
  allowedTypes,
  headerContent,
  maxItemsPerTab = 10,
  className,
}: RecentItemsPanelProps) {
  // Local state
  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Recent items hook
  const {
    items,
    meetings,
    templates,
    searches,
    cases,
    documents,
    isLoading,
    togglePin,
    removeRecent,
    clearRecent,
    searchRecent,
    navigateToItem,
  } = useRecentItems();

  // Filter tabs based on allowed types
  const visibleTabs = useMemo(() => {
    if (!allowedTypes) return DEFAULT_TABS;
    return DEFAULT_TABS.filter(
      (tab) => tab.value === 'all' || allowedTypes.includes(tab.value as RecentItemType)
    );
  }, [allowedTypes]);

  // Get items for current tab
  const currentItems = useMemo(() => {
    const getByTab = () => {
      switch (activeTab) {
        case 'meeting':
          return meetings;
        case 'template':
          return templates;
        case 'search':
          return searches;
        case 'case':
          return cases;
        case 'document':
          return documents;
        default:
          return items;
      }
    };

    let tabItems = getByTab();

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      tabItems = tabItems.filter(
        (item: RecentItem) =>
          item.title.toLowerCase().includes(query) ||
          item.subtitle?.toLowerCase().includes(query)
      );
    }

    return tabItems;
  }, [activeTab, items, meetings, templates, searches, cases, documents, searchQuery]);

  // Handlers
  const handleItemClick = useCallback(
    (item: RecentItem) => {
      navigateToItem(item);
      onClose?.();
    },
    [navigateToItem, onClose]
  );

  const handleClearTab = useCallback(() => {
    if (activeTab === 'all') {
      clearRecent();
    } else {
      clearRecent(activeTab as RecentItemType);
    }
  }, [activeTab, clearRecent]);

  const handleSearchToggle = useCallback(() => {
    setIsSearching((prev) => !prev);
    if (isSearching) {
      setSearchQuery('');
    }
  }, [isSearching]);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setIsSearching(false);
  }, []);

  // Animation variants
  const panelVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: -20, opacity: 0 },
  };

  if (!isOpen && collapsible) {
    return null;
  }

  return (
    <motion.div
      initial={collapsible ? 'closed' : false}
      animate="open"
      exit="closed"
      variants={panelVariants}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex flex-col h-full',
        'bg-card text-card-foreground',
        'border-r border-border',
        className
      )}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {collapsible && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
                aria-label="Close panel"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">
              Recent
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8',
                isSearching && 'bg-muted'
              )}
              onClick={handleSearchToggle}
              aria-label="Toggle search"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search input */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search recent items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 h-9"
                  autoFocus
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={handleSearchClear}
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom header content */}
        {headerContent}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="flex-shrink-0 px-2 py-2 border-b border-border/60">
          <TabsList className="w-full h-auto flex-wrap gap-1 bg-transparent p-0">
            {visibleTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  'h-7 px-2.5 text-xs font-medium rounded-md',
                  'data-[state=active]:bg-muted',
                  'data-[state=active]:shadow-none'
                )}
              >
                <tab.icon
                  className={cn(
                    "w-3.5 h-3.5 mr-1.5",
                    tab.color && activeTab === tab.value && `text-[${tab.color}]`
                  )}
                />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <RecentItemsSkeleton />
          ) : (
            <TabsContent value={activeTab} className="m-0 p-0">
              <RecentItemsList
                items={currentItems}
                onItemClick={handleItemClick}
                onTogglePin={togglePin}
                onRemove={removeRecent}
                onClearAll={handleClearTab}
                showClearAll={currentItems.length > 0}
                showEmptyState
                emptyMessage={
                  searchQuery
                    ? `No results for "${searchQuery}"`
                    : activeTab === 'all'
                    ? 'No recent items yet'
                    : `No recent ${RECENT_TYPE_META[activeTab as RecentItemType]?.pluralLabel.toLowerCase() || 'items'}`
                }
                maxVisible={maxItemsPerTab}
                category={activeTab === 'all' ? 'all' : (activeTab as RecentItemType)}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>

      {/* Footer */}
      {items.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-border/60">
          <p className="text-xs text-muted-foreground text-center">
            {items.length} recent {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default RecentItemsPanel;
