/**
 * Microsoft Planner Integration Types
 * 
 * Type definitions for Microsoft Graph API integration with Planner
 * for task management and action item tracking.
 * 
 * @module lib/planner/types
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Planner integration configuration
 */
export interface PlannerConfig {
  /** Microsoft Graph API base URL */
  graphBaseUrl: string;
  /** Default group ID for team plans */
  defaultGroupId?: string;
  /** Default plan ID */
  defaultPlanId?: string;
  /** Auto-sync enabled */
  autoSyncEnabled: boolean;
  /** Sync interval in milliseconds */
  syncIntervalMs: number;
  /** Enable bi-directional sync */
  bidirectionalSync: boolean;
}

/**
 * Default Planner configuration
 */
export const defaultPlannerConfig: PlannerConfig = {
  graphBaseUrl: 'https://graph.microsoft.com/v1.0',
  autoSyncEnabled: false,
  syncIntervalMs: 60000, // 1 minute
  bidirectionalSync: false,
};

// ============================================================================
// Core Entity Types
// ============================================================================

/**
 * Planner plan information
 */
export interface PlannerPlan {
  /** Unique plan ID */
  id: string;
  /** Plan title */
  title: string;
  /** Microsoft 365 group ID that owns the plan */
  owner: string;
  /** Plan creation timestamp */
  createdDateTime: string;
  /** Plan creation user */
  createdBy?: PlannerUserInfo;
  /** Container information */
  container?: {
    containerId: string;
    type: 'group' | 'user' | 'roster' | 'unknownFutureValue';
    url: string;
  };
}

/**
 * Planner bucket for task organization
 */
export interface PlannerBucket {
  /** Unique bucket ID */
  id: string;
  /** Bucket name */
  name: string;
  /** Parent plan ID */
  planId: string;
  /** Order hint for positioning */
  orderHint: string;
}

/**
 * Planner task priority levels
 */
export type PlannerTaskPriority = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Planner task completion percentage
 */
export type PlannerTaskPercentComplete = 0 | 50 | 100;

/**
 * User information in Planner
 */
export interface PlannerUserInfo {
  /** User principal ID */
  user?: {
    id: string;
    displayName?: string;
  };
  /** Application info if created by app */
  application?: {
    id: string;
    displayName?: string;
  };
}

/**
 * Checklist item within a task
 */
export interface PlannerChecklistItem {
  /** Whether the item is checked */
  isChecked: boolean;
  /** Order hint for positioning */
  orderHint?: string;
  /** Display title */
  title: string;
}

/**
 * Checklist items collection (keyed by GUID)
 */
export interface PlannerChecklistItems {
  [key: string]: PlannerChecklistItem;
}

/**
 * External reference in a task
 */
export interface PlannerExternalReference {
  /** Reference alias/title */
  alias?: string;
  /** Resource type */
  type?: 'PowerPoint' | 'Word' | 'Excel' | 'Pdf' | 'OneNote' | 'OneNotePage' | 'Project' | 'SharePoint' | 'Visio' | 'Other';
  /** Preview priority */
  previewPriority?: string;
  /** Last modified timestamp */
  lastModifiedDateTime?: string;
  /** Last modified user */
  lastModifiedBy?: PlannerUserInfo;
}

/**
 * External references collection (keyed by URL-encoded URL)
 */
export interface PlannerExternalReferences {
  [key: string]: PlannerExternalReference;
}

/**
 * Applied categories (up to 25 categories)
 */
export interface PlannerAppliedCategories {
  category1?: boolean;
  category2?: boolean;
  category3?: boolean;
  category4?: boolean;
  category5?: boolean;
  category6?: boolean;
  category7?: boolean;
  category8?: boolean;
  category9?: boolean;
  category10?: boolean;
  category11?: boolean;
  category12?: boolean;
  category13?: boolean;
  category14?: boolean;
  category15?: boolean;
  category16?: boolean;
  category17?: boolean;
  category18?: boolean;
  category19?: boolean;
  category20?: boolean;
  category21?: boolean;
  category22?: boolean;
  category23?: boolean;
  category24?: boolean;
  category25?: boolean;
}

/**
 * Planner task
 */
export interface PlannerTask {
  /** Unique task ID */
  id: string;
  /** Task title */
  title: string;
  /** Parent plan ID */
  planId: string;
  /** Parent bucket ID */
  bucketId?: string;
  /** Task priority (0=urgent, 10=low) */
  priority: PlannerTaskPriority;
  /** Completion percentage (0, 50, or 100) */
  percentComplete: PlannerTaskPercentComplete;
  /** Due date (ISO 8601) */
  dueDateTime?: string;
  /** Start date (ISO 8601) */
  startDateTime?: string;
  /** Completed timestamp */
  completedDateTime?: string;
  /** Completed by user info */
  completedBy?: PlannerUserInfo;
  /** Order hint for positioning */
  orderHint?: string;
  /** Assignee priority ordering */
  assigneePriority?: string;
  /** Applied categories */
  appliedCategories?: PlannerAppliedCategories;
  /** Assignments (user ID -> assignment info) */
  assignments?: PlannerTaskAssignments;
  /** Conversation thread ID */
  conversationThreadId?: string;
  /** Has description flag */
  hasDescription?: boolean;
  /** Reference count */
  referenceCount?: number;
  /** Checklist item count */
  checklistItemCount?: number;
  /** Active checklist item count */
  activeChecklistItemCount?: number;
  /** Preview type */
  previewType?: 'automatic' | 'noPreview' | 'checklist' | 'description' | 'reference';
  /** Creation timestamp */
  createdDateTime: string;
  /** Created by user info */
  createdBy?: PlannerUserInfo;
  /** ETag for optimistic concurrency */
  '@odata.etag'?: string;
}

/**
 * Task assignment info
 */
export interface PlannerTaskAssignment {
  /** Graph discriminator for planner assignment payloads */
  '@odata.type'?: string;
  /** Assigned by user ID */
  assignedBy?: PlannerUserInfo;
  /** Assignment timestamp */
  assignedDateTime?: string;
  /** Order hint for this assignee */
  orderHint?: string;
}

/**
 * Task assignments collection (keyed by user ID)
 */
export interface PlannerTaskAssignments {
  [userId: string]: PlannerTaskAssignment;
}

/**
 * Task details (extended task information)
 */
export interface PlannerTaskDetails {
  /** Task ID */
  id: string;
  /** Task description (rich text) */
  description?: string;
  /** Preview type */
  previewType?: 'automatic' | 'noPreview' | 'checklist' | 'description' | 'reference';
  /** Checklist items */
  checklist?: PlannerChecklistItems;
  /** External references */
  references?: PlannerExternalReferences;
  /** ETag for optimistic concurrency */
  '@odata.etag'?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Paginated response wrapper
 */
export interface PlannerPagedResponse<T> {
  /** Response items */
  value: T[];
  /** Next page URL */
  '@odata.nextLink'?: string;
  /** Item count */
  '@odata.count'?: number;
}

// ============================================================================
// Sync Types
// ============================================================================

/**
 * Action item from minutes to sync
 */
export interface ActionItem {
  /** Unique action item ID */
  id: string;
  /** Action item title/description */
  title: string;
  /** Assigned user ID or name */
  assignee?: string;
  /** Assigned user email (for Graph lookup) */
  assigneeEmail?: string;
  /** Due date (ISO 8601) */
  dueDate?: string;
  /** Priority level */
  priority?: 'high' | 'medium' | 'low';
  /** Whether completed */
  isCompleted: boolean;
  /** Source minute ID */
  minuteId: string;
  /** Source minute title */
  minuteTitle?: string;
  /** Meeting date */
  meetingDate?: string;
}

/**
 * Linked Planner task
 */
export interface LinkedPlannerTask {
  /** Link ID */
  id: string;
  /** Source action item ID */
  actionItemId: string;
  /** Source minute ID */
  minuteId: string;
  /** Planner task ID */
  plannerTaskId: string;
  /** Planner plan ID */
  planId: string;
  /** Last sync timestamp */
  lastSyncedAt: string;
  /** Sync status */
  syncStatus: 'synced' | 'pending' | 'error' | 'conflict';
  /** Error message if sync failed */
  errorMessage?: string;
  /** Task snapshot at sync time */
  taskSnapshot?: Partial<PlannerTask>;
}

/**
 * Sync result for batch operations
 */
export interface PlannerSyncResult {
  /** Successfully synced items */
  synced: LinkedPlannerTask[];
  /** Failed items with errors */
  failed: Array<{
    actionItem: ActionItem;
    error: string;
  }>;
  /** Items with conflicts */
  conflicts: Array<{
    actionItem: ActionItem;
    linkedTask: LinkedPlannerTask;
    plannerTask: PlannerTask;
  }>;
}

/**
 * Sync direction
 */
export type SyncDirection = 'toPlanner' | 'fromPlanner' | 'bidirectional';

/**
 * Sync options
 */
export interface SyncOptions {
  /** Sync direction */
  direction: SyncDirection;
  /** Resolve conflicts automatically */
  autoResolveConflicts: boolean;
  /** Conflict resolution strategy */
  conflictStrategy: 'useLocal' | 'useRemote' | 'newest';
  /** Include completed items */
  includeCompleted: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Planner API error codes
 */
export type PlannerErrorCode =
  | 'accessDenied'
  | 'generalException'
  | 'invalidRequest'
  | 'itemNotFound'
  | 'notAllowed'
  | 'preconditionFailed'
  | 'resourceModified'
  | 'serviceNotAvailable'
  | 'throttledRequest'
  | 'tooManyRequests'
  | 'unauthenticated'
  | 'unknown';

/**
 * Planner API error
 */
export interface PlannerApiError {
  /** Error code */
  code: PlannerErrorCode;
  /** Error message */
  message: string;
  /** Inner error details */
  innerError?: {
    code?: string;
    message?: string;
    'request-id'?: string;
    date?: string;
  };
  /** HTTP status code */
  statusCode: number;
}

// ============================================================================
// Connection State
// ============================================================================

/**
 * Planner connection state
 */
export interface PlannerConnectionState {
  /** Whether connected */
  isConnected: boolean;
  /** Whether currently connecting */
  isConnecting: boolean;
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Last successful sync timestamp */
  lastSyncedAt?: string;
  /** Connection error */
  error?: PlannerApiError | null;
  /** Current user info */
  currentUser?: {
    id: string;
    displayName: string;
    email: string;
  };
}

/**
 * Default connection state
 */
export const defaultConnectionState: PlannerConnectionState = {
  isConnected: false,
  isConnecting: false,
  isSyncing: false,
  error: null,
};

// ============================================================================
// Create/Update Types
// ============================================================================

/**
 * Create task request
 */
export interface CreatePlannerTaskRequest {
  /** Task title (required) */
  title: string;
  /** Plan ID (required) */
  planId: string;
  /** Bucket ID */
  bucketId?: string;
  /** Due date */
  dueDateTime?: string;
  /** Start date */
  startDateTime?: string;
  /** Priority (0-10) */
  priority?: PlannerTaskPriority;
  /** Assignments */
  assignments?: PlannerTaskAssignments;
  /** Applied categories */
  appliedCategories?: PlannerAppliedCategories;
  /** Order hint */
  orderHint?: string;
}

/**
 * Update task request
 */
export interface UpdatePlannerTaskRequest {
  /** Task title */
  title?: string;
  /** Bucket ID */
  bucketId?: string;
  /** Due date */
  dueDateTime?: string;
  /** Start date */
  startDateTime?: string;
  /** Priority (0-10) */
  priority?: PlannerTaskPriority;
  /** Completion percentage */
  percentComplete?: PlannerTaskPercentComplete;
  /** Assignments */
  assignments?: PlannerTaskAssignments;
  /** Applied categories */
  appliedCategories?: PlannerAppliedCategories;
  /** Order hint */
  orderHint?: string;
}

/**
 * Update task details request
 */
export interface UpdatePlannerTaskDetailsRequest {
  /** Description */
  description?: string;
  /** Preview type */
  previewType?: 'automatic' | 'noPreview' | 'checklist' | 'description' | 'reference';
  /** Checklist items */
  checklist?: PlannerChecklistItems;
  /** External references */
  references?: PlannerExternalReferences;
}

/**
 * Create bucket request
 */
export interface CreatePlannerBucketRequest {
  /** Bucket name (required) */
  name: string;
  /** Plan ID (required) */
  planId: string;
  /** Order hint */
  orderHint?: string;
}
