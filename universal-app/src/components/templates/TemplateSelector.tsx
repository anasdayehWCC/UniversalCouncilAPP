'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Star, 
  Clock,
  Grid,
  List,
  X,
  ChevronDown,
  Check
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TemplateCard } from './TemplateCard';
import { useTemplates } from '@/hooks/useTemplates';
import { 
  Template, 
  TemplateCategory, 
  CATEGORY_META,
} from '@/lib/templates/types';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface TemplateSelectorProps {
  /** Called when a template is selected */
  onSelect: (template: Template) => void;
  /** Currently selected template ID */
  selectedId?: string;
  /** Optional class name */
  className?: string;
  /** Show compact view */
  compact?: boolean;
  /** Filter by domain - if not provided, uses current user's domain */
  domain?: string;
}

type ViewMode = 'grid' | 'list';
type FilterTab = 'all' | 'favorites' | 'recent';

// ============================================================================
// Component
// ============================================================================

export function TemplateSelector({
  onSelect,
  selectedId,
  className,
  compact = false,
  domain,
}: TemplateSelectorProps) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Template hook
  const {
    filteredTemplates,
    filters,
    setSearchQuery,
    setCategoryFilter,
    setFavoritesOnly,
    clearFilters,
    getFavorites,
    getRecentlyUsed,
    toggleFavorite,
    isFavorite,
    recordUsage,
    isLoading,
  } = useTemplates({
    initialFilters: domain ? { domain: domain as 'children' | 'adults' | 'housing' | 'corporate' } : undefined,
  });

  // Get display templates based on active tab
  const displayTemplates = useMemo(() => {
    switch (activeTab) {
      case 'favorites':
        return getFavorites();
      case 'recent':
        return getRecentlyUsed(8);
      default:
        return filteredTemplates;
    }
  }, [activeTab, filteredTemplates, getFavorites, getRecentlyUsed]);

  // Categories for filter
  const categories = Object.values(CATEGORY_META);
  const activeCategory = filters.category ? CATEGORY_META[filters.category] : null;

  // Handle template selection
  const handleSelect = (template: Template) => {
    recordUsage(template.id);
    onSelect(template);
  };

  // Handle tab change
  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    if (tab === 'favorites') {
      setFavoritesOnly(true);
    } else {
      setFavoritesOnly(false);
    }
  };

  // Handle category select
  const handleCategorySelect = (categoryId: TemplateCategory | null) => {
    setCategoryFilter(categoryId ?? undefined);
    setCategoryDropdownOpen(false);
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header & Search */}
      <div className="flex flex-col gap-4 rounded-[24px] border border-border/70 bg-card/88 p-4 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTabChange('all')}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200',
              activeTab === 'all'
                ? 'border-primary/20 bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background/70 text-muted-foreground hover:bg-background hover:text-foreground'
            )}
          >
            All Templates
          </button>
          <button
            onClick={() => handleTabChange('favorites')}
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200',
              activeTab === 'favorites'
                ? 'border-warning/20 bg-warning/12 text-warning'
                : 'border-border bg-background/70 text-muted-foreground hover:bg-background hover:text-foreground'
            )}
          >
            <Star className="w-4 h-4" />
            Favorites
          </button>
          <button
            onClick={() => handleTabChange('recent')}
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200',
              activeTab === 'recent'
                ? 'border-info/20 bg-info/10 text-info'
                : 'border-border bg-background/70 text-muted-foreground hover:bg-background hover:text-foreground'
            )}
          >
            <Clock className="w-4 h-4" />
            Recent
          </button>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          {/* Search */}
            <div className="relative flex-1 lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={filters.search || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-full border-border bg-background/70 pl-9 focus:bg-background"
            />
            {filters.search && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category filter dropdown */}
            <div className="relative">
            <Button
              variant="outline"
              size="default"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className={cn(
                'h-11 gap-2 rounded-full border-border bg-background/70',
                activeCategory && 'border-2'
              )}
              style={activeCategory ? { borderColor: activeCategory.color } : undefined}
            >
              <Filter className="w-4 h-4" />
              {activeCategory?.label || 'Category'}
              <ChevronDown className="w-4 h-4" />
            </Button>

            <AnimatePresence>
              {categoryDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
                >
                  <button
                    onClick={() => handleCategorySelect(null)}
                    className={cn(
                      'w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center justify-between',
                      !activeCategory && 'bg-muted'
                    )}
                  >
                    <span>All Categories</span>
                    {!activeCategory && <Check className="w-4 h-4 text-success" />}
                  </button>
                  {categories.map((cat) => {
                    const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[cat.icon] || Filter;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={cn(
                          'w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center justify-between',
                          filters.category === cat.id && 'bg-muted'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <IconComp className="w-4 h-4 text-muted-foreground" />
                          {cat.label}
                        </span>
                        {filters.category === cat.id && (
                          <Check className="w-4 h-4 text-success" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* View mode toggle */}
            {!compact && (
              <div className="flex rounded-full border border-border bg-background/70 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-full p-2 transition-colors',
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'rounded-full p-2 transition-colors',
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="w-4 h-4" />
              </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active filters */}
      {(filters.search || filters.category) && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-foreground text-sm rounded-lg">
              &quot;{filters.search}&quot;
              <button onClick={() => setSearchQuery('')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {activeCategory && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 text-white text-sm rounded-lg"
              style={{ backgroundColor: activeCategory.color }}
            >
              {activeCategory.label}
              <button onClick={() => setCategoryFilter(undefined)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Template grid/list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-48 animate-pulse motion-reduce:animate-none bg-muted" />
          ))}
        </div>
      ) : displayTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            {activeTab === 'favorites'
              ? 'Star templates to add them to your favorites'
              : activeTab === 'recent'
              ? 'Templates you use will appear here'
              : 'Try adjusting your search or filters'}
          </p>
        </Card>
      ) : (
        <div className="flex gap-6">
          {/* Templates */}
          <div
            className={cn(
              'flex-1',
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex flex-col gap-2'
            )}
          >
            <AnimatePresence mode="popLayout">
              {displayTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <TemplateCard
                    template={template}
                    onSelect={() => handleSelect(template)}
                    onToggleFavorite={() => toggleFavorite(template.id)}
                    isFavorite={isFavorite(template.id)}
                    isSelected={selectedId === template.id}
                    viewMode={viewMode}
                    compact={compact}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

export default TemplateSelector;
