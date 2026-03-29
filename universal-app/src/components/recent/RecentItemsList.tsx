/**
 * Recent Items List Component
 *
 * Displays a list of recent items with quick actions on hover,
 * clear all functionality, and pin/unpin support.
 *
 * @module components/recent/RecentItemsList
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import {
  Pin,
  X,
  Clock,
  Trash2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  TooltipRoot as Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import {
  RecentItem,
  RecentItemType,
  RECENT_TYPE_META,
} from '@/lib/recent';

// ============================================================================
// Types
// ============================================================================

interface RecentItemsListProps {
  /** Recent items to display */
  items: RecentItem[];
  /** Called when an item is clicked */
  onItemClick?: (item: RecentItem) => void;
  /** Called when pin is toggled */
  onTogglePin?: (id: string) => void;
  /** Called when an item is removed */
  onRemove?: (type: RecentItemType, id: string) => void;
  /** Called when clear all is clicked */
  onClearAll?: () => void;
  /** Show clear all button */
  showClearAll?: boolean;
  /** Show empty state */
  showEmptyState?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Maximum visible items before "show more" */
  maxVisible?: number;
  /** Category being displayed (for styling) */
  category?: RecentItemType | 'all';
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

// ============================================================================
// List Item Component
// ============================================================================

interface RecentItemRowProps {
  item: RecentItem;
  onItemClick?: (item: RecentItem) => void;
  onTogglePin?: (id: string) => void;
  onRemove?: (type: RecentItemType, id: string) => void;
  compact?: boolean;
}

function RecentItemRow({
  item,
  onItemClick,
  onTogglePin,
  onRemove,
  compact = false,
}: RecentItemRowProps) {
  const typeMeta = RECENT_TYPE_META[item.type];
  const IconComponent =
    (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
      item.icon || typeMeta.icon
    ] || Icons.File;

  const handleClick = useCallback(() => {
    onItemClick?.(item);
  }, [item, onItemClick]);

  const handleTogglePin = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTogglePin?.(item.id);
    },
    [item.id, onTogglePin]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.(item.type, item.id);
    },
    [item.type, item.id, onRemove]
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
          layout
        >
          <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg cursor-pointer',
              'transition-all duration-150',
              'hover:bg-muted/80',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              compact ? 'px-2 py-1.5' : 'px-3 py-2.5'
            )}
          >
            {/* Pin indicator */}
            {item.isPinned && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full" />
            )}

            {/* Icon */}
            <div
              className={cn(
                'flex-shrink-0 rounded-lg flex items-center justify-center',
                'transition-colors duration-150',
                compact ? 'w-7 h-7' : 'w-9 h-9'
              )}
              style={{
                backgroundColor: `${item.color || typeMeta.color}15`,
                color: item.color || typeMeta.color,
              }}
            >
              <IconComponent
                className={cn(compact ? 'w-3.5 h-3.5' : 'w-4 h-4')}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-medium text-foreground truncate',
                    compact ? 'text-sm' : 'text-sm'
                  )}
                >
                  {item.title}
                </span>
                {item.isPinned && (
                  <Pin className="w-3 h-3 text-primary flex-shrink-0" />
                )}
              </div>
              {item.subtitle && !compact && (
                <p className="text-xs text-muted-foreground truncate">
                  {item.subtitle}
                </p>
              )}
            </div>

            {/* Time & Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs text-muted-foreground group-hover:hidden">
                {formatRelativeTime(item.accessedAt)}
              </span>

              {/* Quick actions (shown on hover) */}
              <div className="hidden group-hover:flex items-center gap-0.5">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-muted"
                        onClick={handleTogglePin}
                        aria-label={item.isPinned ? 'Unpin item' : 'Pin to top'}
                      >
                        <Pin
                          className={cn(
                            'w-3.5 h-3.5',
                            item.isPinned
                              ? 'text-primary fill-primary'
                              : 'text-muted-foreground'
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {item.isPinned ? 'Unpin' : 'Pin to top'}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-destructive/10"
                        onClick={handleRemove}
                        aria-label="Remove from recent items"
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Remove
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
            </div>
          </div>
        </motion.div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={handleClick}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Open
        </ContextMenuItem>
        <ContextMenuItem onClick={handleTogglePin}>
          <Pin
            className={cn(
              'w-4 h-4 mr-2',
              item.isPinned && 'text-primary fill-primary'
            )}
          />
          {item.isPinned ? 'Unpin' : 'Pin to top'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={handleRemove}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RecentItemsList({
  items,
  onItemClick,
  onTogglePin,
  onRemove,
  onClearAll,
  showClearAll = true,
  showEmptyState = true,
  emptyMessage = 'No recent items',
  compact = false,
  maxVisible,
  category = 'all',
  className,
}: RecentItemsListProps) {
  // Separate pinned and unpinned
  const { pinnedItems, unpinnedItems } = useMemo(() => {
    const pinned = items.filter((i) => i.isPinned);
    const unpinned = items.filter((i) => !i.isPinned);
    return { pinnedItems: pinned, unpinnedItems: unpinned };
  }, [items]);

  // Apply max visible limit
  const visibleUnpinned = useMemo(() => {
    if (!maxVisible) return unpinnedItems;
    const remaining = maxVisible - pinnedItems.length;
    return unpinnedItems.slice(0, Math.max(0, remaining));
  }, [unpinnedItems, pinnedItems.length, maxVisible]);

  const hiddenCount = unpinnedItems.length - visibleUnpinned.length;

  // Empty state
  if (items.length === 0 && showEmptyState) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-8 text-center',
          className
        )}
      >
        <Clock className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* Clear all header */}
      {showClearAll && items.length > 0 && (
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {category === 'all'
              ? 'Recent'
              : RECENT_TYPE_META[category as RecentItemType]?.pluralLabel}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={onClearAll}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* Pinned items section */}
      {pinnedItems.length > 0 && (
        <div className="space-y-0.5">
          <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pinned
          </span>
          <AnimatePresence mode="popLayout">
            {pinnedItems.map((item) => (
              <RecentItemRow
                key={item.id}
                item={item}
                onItemClick={onItemClick}
                onTogglePin={onTogglePin}
                onRemove={onRemove}
                compact={compact}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Unpinned items */}
      {visibleUnpinned.length > 0 && (
        <div className="space-y-0.5">
          {pinnedItems.length > 0 && (
            <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recent
            </span>
          )}
          <AnimatePresence mode="popLayout">
            {visibleUnpinned.map((item) => (
              <RecentItemRow
                key={item.id}
                item={item}
                onItemClick={onItemClick}
                onTogglePin={onTogglePin}
                onRemove={onRemove}
                compact={compact}
              />
            ))}
          </AnimatePresence>

          {/* Show more indicator */}
          {hiddenCount > 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground text-center">
              +{hiddenCount} more items
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default RecentItemsList;
