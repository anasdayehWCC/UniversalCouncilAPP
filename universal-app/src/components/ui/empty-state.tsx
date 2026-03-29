'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  FileSearch, 
  Search, 
  Inbox, 
  FolderOpen, 
  AlertCircle,
  type LucideIcon 
} from 'lucide-react';

type EmptyStateVariant = 'default' | 'compact' | 'inline';
type EmptyStateType = 'search' | 'data' | 'files' | 'error' | 'custom';

const defaultIcons: Record<EmptyStateType, LucideIcon> = {
  search: Search,
  data: Inbox,
  files: FolderOpen,
  error: AlertCircle,
  custom: FileSearch,
};

const defaultTitles: Record<EmptyStateType, string> = {
  search: 'No results found',
  data: 'No data yet',
  files: 'No files',
  error: 'Something went wrong',
  custom: 'Nothing here',
};

const defaultDescriptions: Record<EmptyStateType, string> = {
  search: 'Try adjusting your search or filters.',
  data: 'Data will appear here once available.',
  files: 'Upload or create files to see them here.',
  error: 'We encountered an issue. Please try again.',
  custom: 'This area is empty.',
};

export interface EmptyStateProps {
  /** Type of empty state - determines default icon and messaging */
  type?: EmptyStateType;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Custom icon component */
  icon?: LucideIcon;
  /** Size variant */
  variant?: EmptyStateVariant;
  /** Primary action button */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Additional class names */
  className?: string;
  /** Children to render below the description */
  children?: React.ReactNode;
}

/**
 * EmptyState component for displaying meaningful empty states
 * 
 * @example
 * // Search results empty state
 * <EmptyState
 *   type="search"
 *   description="Try a different search term."
 *   action={{ label: "Clear filters", onClick: () => {} }}
 * />
 * 
 * @example
 * // Custom empty state
 * <EmptyState
 *   icon={Users}
 *   title="No team members"
 *   description="Invite people to collaborate."
 *   action={{ label: "Invite", onClick: handleInvite }}
 * />
 */
export function EmptyState({
  type = 'custom',
  title,
  description,
  icon,
  variant = 'default',
  action,
  secondaryAction,
  className,
  children,
}: EmptyStateProps) {
  const Icon = icon || defaultIcons[type];
  const displayTitle = title || defaultTitles[type];
  const displayDescription = description || defaultDescriptions[type];

  const ActionButton = action?.href ? 'a' : 'button';
  const SecondaryButton = secondaryAction?.href ? 'a' : 'button';

  return (
    <div
      className={cn(
        'empty-state',
        variant === 'compact' && 'empty-state--compact',
        variant === 'inline' && 'empty-state--inline',
        className
      )}
      role="status"
      aria-label={displayTitle}
    >
      <div className="empty-state__icon">
        <Icon aria-hidden="true" />
      </div>
      
      <div className={cn(variant === 'inline' && 'flex-1')}>
        <h3 className="empty-state__title">{displayTitle}</h3>
        <p className="empty-state__description">{displayDescription}</p>
        
        {children}
        
        {(action || secondaryAction) && (
          <div className="empty-state__action flex gap-3 justify-center">
            {action && (
              <Button
                asChild={!!action.href}
                onClick={action.onClick}
              >
                {action.href ? (
                  <a href={action.href}>{action.label}</a>
                ) : (
                  action.label
                )}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant="outline"
                asChild={!!secondaryAction.href}
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.href ? (
                  <a href={secondaryAction.href}>{secondaryAction.label}</a>
                ) : (
                  secondaryAction.label
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * NoSearchResults - Specialized empty state for search
 */
export function NoSearchResults({
  query,
  onClear,
  className,
}: {
  query?: string;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      type="search"
      title="No results found"
      description={
        query
          ? `No results match "${query}". Try a different search.`
          : 'Try adjusting your search or filters.'
      }
      action={onClear ? { label: 'Clear search', onClick: onClear } : undefined}
      className={className}
    />
  );
}

/**
 * NoData - Specialized empty state for empty data tables/lists
 */
export function NoData({
  title = 'No data yet',
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}) {
  return (
    <EmptyState
      type="data"
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}
