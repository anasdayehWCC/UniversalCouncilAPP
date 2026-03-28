/**
 * Recent Items Types
 *
 * Type definitions for the recent items system.
 *
 * @module lib/recent/types
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Types of items that can be tracked as recent
 */
export type RecentItemType = 'meeting' | 'template' | 'search' | 'case' | 'document';

/**
 * Base interface for all recent items
 */
export interface RecentItemBase {
  /** Unique identifier for the item */
  id: string;
  /** Type of the recent item */
  type: RecentItemType;
  /** Display title for the item */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Timestamp when the item was accessed */
  accessedAt: string;
  /** Whether the item is pinned to top */
  isPinned: boolean;
  /** Optional icon name (lucide-react) */
  icon?: string;
  /** Optional color for the item */
  color?: string;
  /** Navigation path for the item */
  path: string;
  /** Additional metadata specific to item type */
  metadata?: Record<string, unknown>;
}

/**
 * Recent meeting item
 */
export interface RecentMeetingItem extends RecentItemBase {
  type: 'meeting';
  metadata?: {
    caseReference?: string;
    status?: string;
    templateName?: string;
    duration?: number;
  };
}

/**
 * Recent template item
 */
export interface RecentTemplateItem extends RecentItemBase {
  type: 'template';
  metadata?: {
    category?: string;
    meetingType?: string;
    isSystem?: boolean;
  };
}

/**
 * Recent search item
 */
export interface RecentSearchItem extends RecentItemBase {
  type: 'search';
  metadata?: {
    query: string;
    resultCount?: number;
    filters?: Record<string, unknown>;
  };
}

/**
 * Recent case item
 */
export interface RecentCaseItem extends RecentItemBase {
  type: 'case';
  metadata?: {
    caseReference: string;
    subjectInitials?: string;
    meetingCount?: number;
  };
}

/**
 * Recent document item
 */
export interface RecentDocumentItem extends RecentItemBase {
  type: 'document';
  metadata?: {
    documentType?: string;
    fileSize?: number;
    mimeType?: string;
  };
}

/**
 * Union type for all recent items
 */
export type RecentItem =
  | RecentMeetingItem
  | RecentTemplateItem
  | RecentSearchItem
  | RecentCaseItem
  | RecentDocumentItem;

// ============================================================================
// Storage Types
// ============================================================================

/**
 * Storage structure for recent items by type
 */
export interface RecentItemsState {
  meeting: RecentMeetingItem[];
  template: RecentTemplateItem[];
  search: RecentSearchItem[];
  case: RecentCaseItem[];
  document: RecentDocumentItem[];
}

/**
 * Options for adding a recent item
 */
export interface AddRecentItemOptions {
  /** Force add even if duplicate exists (updates timestamp) */
  forceUpdate?: boolean;
  /** Pin the item immediately */
  pinned?: boolean;
}

/**
 * Filter options for retrieving recent items
 */
export interface RecentItemsFilter {
  /** Filter by item types */
  types?: RecentItemType[];
  /** Include only pinned items */
  pinnedOnly?: boolean;
  /** Maximum number of items to return */
  limit?: number;
  /** Search query to filter by title/subtitle */
  search?: string;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for the recent items system
 */
export interface RecentItemsConfig {
  /** Maximum items per type (default: 20) */
  maxItemsPerType: number;
  /** Maximum total items across all types (default: 100) */
  maxTotalItems: number;
  /** Storage key prefix */
  storageKeyPrefix: string;
  /** Auto-cleanup older items on add */
  autoCleanup: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_RECENT_CONFIG: RecentItemsConfig = {
  maxItemsPerType: 20,
  maxTotalItems: 100,
  storageKeyPrefix: 'recent-items',
  autoCleanup: true,
};

// ============================================================================
// Metadata Helpers
// ============================================================================

/**
 * Metadata for each recent item type
 */
export const RECENT_TYPE_META: Record<
  RecentItemType,
  {
    label: string;
    pluralLabel: string;
    icon: string;
    color: string;
  }
> = {
  meeting: {
    label: 'Meeting',
    pluralLabel: 'Meetings',
    icon: 'Calendar',
    color: '#3b82f6',
  },
  template: {
    label: 'Template',
    pluralLabel: 'Templates',
    icon: 'FileText',
    color: '#8b5cf6',
  },
  search: {
    label: 'Search',
    pluralLabel: 'Searches',
    icon: 'Search',
    color: '#6366f1',
  },
  case: {
    label: 'Case',
    pluralLabel: 'Cases',
    icon: 'Folder',
    color: '#10b981',
  },
  document: {
    label: 'Document',
    pluralLabel: 'Documents',
    icon: 'File',
    color: '#f59e0b',
  },
};
