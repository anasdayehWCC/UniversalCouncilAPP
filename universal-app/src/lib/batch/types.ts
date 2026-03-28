/**
 * Batch Operations Types
 * 
 * Type definitions for batch selection and bulk operations,
 * enabling multi-select UI patterns with undo support.
 * 
 * @module lib/batch/types
 */

// ============================================================================
// Selection State Types
// ============================================================================

/**
 * Unique identifier for selectable items
 */
export type SelectableId = string;

/**
 * Selection mode for different interaction patterns
 */
export type SelectionMode = 
  | 'single'    // Only one item at a time
  | 'multiple'  // Multiple items via click/toggle
  | 'range';    // Range selection with shift+click

/**
 * Current state of batch selection
 */
export interface BatchSelectionState {
  /** Set of currently selected item IDs */
  selectedIds: Set<SelectableId>;
  /** Last selected item ID (for range selection) */
  lastSelectedId: SelectableId | null;
  /** Whether selection mode is active */
  isSelectionActive: boolean;
  /** Current selection mode */
  mode: SelectionMode;
  /** Anchor point for range selection */
  rangeAnchor: SelectableId | null;
}

// ============================================================================
// Batch Action Types
// ============================================================================

/**
 * Status of a batch operation
 */
export type BatchOperationStatus = 
  | 'idle'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Type of batch action
 */
export type BatchActionType = 
  | 'delete'
  | 'export'
  | 'approve'
  | 'reject'
  | 'archive'
  | 'restore'
  | 'assign'
  | 'tag'
  | 'move'
  | 'custom';

/**
 * Configuration for a batch action
 */
export interface BatchActionConfig<T = unknown> {
  /** Unique action identifier */
  id: BatchActionType | string;
  /** Display label */
  label: string;
  /** Icon name (from lucide-react) */
  icon: string;
  /** Action variant for styling */
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  /** Confirmation message (if required) */
  confirmationMessage?: string;
  /** Whether confirmation is required */
  requiresConfirmation?: boolean;
  /** Minimum items required */
  minItems?: number;
  /** Maximum items allowed */
  maxItems?: number;
  /** Handler function */
  handler: (ids: SelectableId[], payload?: T) => Promise<BatchActionResult>;
  /** Whether action supports undo */
  supportsUndo?: boolean;
  /** Undo handler */
  undoHandler?: (result: BatchActionResult) => Promise<void>;
  /** Permission required */
  permission?: string;
  /** Whether action is currently available */
  isAvailable?: (selectedIds: Set<SelectableId>) => boolean;
}

/**
 * Result of a batch action
 */
export interface BatchActionResult {
  /** Whether the action succeeded */
  success: boolean;
  /** Number of items processed */
  processedCount: number;
  /** Number of items that failed */
  failedCount: number;
  /** IDs of items that failed */
  failedIds: SelectableId[];
  /** Error message if failed */
  errorMessage?: string;
  /** Data for undo operation */
  undoData?: unknown;
  /** ID for undo tracking */
  undoId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Progress Tracking Types
// ============================================================================

/**
 * Progress state for batch operations
 */
export interface BatchProgress {
  /** Unique operation ID */
  operationId: string;
  /** Operation status */
  status: BatchOperationStatus;
  /** Total items to process */
  totalItems: number;
  /** Items processed so far */
  processedItems: number;
  /** Items that failed */
  failedItems: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Current item being processed */
  currentItem?: SelectableId;
  /** Start time */
  startedAt: number;
  /** Estimated completion time */
  estimatedCompletion?: number;
  /** Error messages */
  errors: Array<{ id: SelectableId; message: string }>;
}

// ============================================================================
// Undo Types
// ============================================================================

/**
 * Undo entry for batch operations
 */
export interface BatchUndoEntry {
  /** Unique undo ID */
  id: string;
  /** Action that was performed */
  actionType: BatchActionType | string;
  /** Display label for undo toast */
  label: string;
  /** Items affected */
  affectedIds: SelectableId[];
  /** Data needed to undo */
  undoData: unknown;
  /** Timestamp */
  createdAt: number;
  /** Expiration time (undo window) */
  expiresAt: number;
  /** Handler to execute undo */
  undoHandler: () => Promise<void>;
}

// ============================================================================
// Store Types
// ============================================================================

/**
 * State shape for batch operations store
 */
export interface BatchState {
  /** Current selection state */
  selection: BatchSelectionState;
  /** Active batch operation progress */
  progress: BatchProgress | null;
  /** Undo stack */
  undoStack: BatchUndoEntry[];
  /** Available actions */
  actions: BatchActionConfig[];
  /** Maximum undo stack size */
  maxUndoStackSize: number;
  /** Undo window in milliseconds */
  undoWindowMs: number;
}

/**
 * Actions for batch state management
 */
export interface BatchActions {
  // Selection actions
  select: (id: SelectableId) => void;
  deselect: (id: SelectableId) => void;
  toggle: (id: SelectableId) => void;
  selectAll: (ids: SelectableId[]) => void;
  deselectAll: () => void;
  selectRange: (fromId: SelectableId, toId: SelectableId, allIds: SelectableId[]) => void;
  setMode: (mode: SelectionMode) => void;
  setRangeAnchor: (id: SelectableId | null) => void;
  
  // Action management
  registerAction: (action: BatchActionConfig) => void;
  unregisterAction: (actionId: string) => void;
  executeAction: (actionId: string, payload?: unknown) => Promise<BatchActionResult>;
  
  // Progress tracking
  setProgress: (progress: BatchProgress | null) => void;
  updateProgress: (update: Partial<BatchProgress>) => void;
  
  // Undo management
  pushUndo: (entry: Omit<BatchUndoEntry, 'id' | 'createdAt' | 'expiresAt'>) => string;
  popUndo: () => BatchUndoEntry | undefined;
  executeUndo: (undoId?: string) => Promise<void>;
  clearExpiredUndo: () => void;
  
  // Reset
  reset: () => void;
}

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Options for useBatchSelection hook
 */
export interface UseBatchSelectionOptions {
  /** All available item IDs */
  itemIds: SelectableId[];
  /** Initial selection */
  initialSelection?: SelectableId[];
  /** Selection mode */
  mode?: SelectionMode;
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: Set<SelectableId>) => void;
  /** Maximum selectable items */
  maxSelectable?: number;
  /** Whether multi-select is enabled */
  enableMultiSelect?: boolean;
  /** Whether range select is enabled */
  enableRangeSelect?: boolean;
}

/**
 * Return type for useBatchSelection hook
 */
export interface UseBatchSelectionReturn {
  /** Currently selected IDs */
  selectedIds: Set<SelectableId>;
  /** Number of selected items */
  selectedCount: number;
  /** Whether any items are selected */
  hasSelection: boolean;
  /** Whether all items are selected */
  isAllSelected: boolean;
  /** Whether some items are selected (for indeterminate state) */
  isIndeterminate: boolean;
  /** Check if specific item is selected */
  isSelected: (id: SelectableId) => boolean;
  
  // Actions
  select: (id: SelectableId) => void;
  deselect: (id: SelectableId) => void;
  toggle: (id: SelectableId, event?: React.MouseEvent) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectRange: (toId: SelectableId) => void;
  invertSelection: () => void;
}

/**
 * Props for SelectableItem component
 */
export interface SelectableItemProps {
  /** Item ID */
  id: SelectableId;
  /** Whether item is selected */
  isSelected: boolean;
  /** Toggle selection handler */
  onToggle: (id: SelectableId, event?: React.MouseEvent) => void;
  /** Whether selection is disabled */
  disabled?: boolean;
  /** Child content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Whether to show checkbox */
  showCheckbox?: boolean;
  /** Checkbox position */
  checkboxPosition?: 'left' | 'right';
}

/**
 * Props for BatchActionBar component
 */
export interface BatchActionBarProps {
  /** Number of selected items */
  selectedCount: number;
  /** Available actions */
  actions: BatchActionConfig[];
  /** Handler for action click */
  onAction: (actionId: string) => void;
  /** Handler for cancel/clear selection */
  onCancel: () => void;
  /** Current progress (if operation in progress) */
  progress?: BatchProgress | null;
  /** Additional className */
  className?: string;
  /** Position of the bar */
  position?: 'top' | 'bottom';
  /** Whether to animate entry */
  animate?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default batch state
 */
export const DEFAULT_BATCH_STATE: BatchState = {
  selection: {
    selectedIds: new Set(),
    lastSelectedId: null,
    isSelectionActive: false,
    mode: 'multiple',
    rangeAnchor: null,
  },
  progress: null,
  undoStack: [],
  actions: [],
  maxUndoStackSize: 10,
  undoWindowMs: 10000, // 10 seconds
};

/**
 * Default action configurations
 */
export const DEFAULT_BATCH_ACTIONS: BatchActionConfig[] = [
  {
    id: 'delete',
    label: 'Delete',
    icon: 'Trash2',
    variant: 'destructive',
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to delete the selected items?',
    supportsUndo: true,
    handler: async () => ({ success: true, processedCount: 0, failedCount: 0, failedIds: [] }),
  },
  {
    id: 'export',
    label: 'Export',
    icon: 'Download',
    variant: 'default',
    requiresConfirmation: false,
    handler: async () => ({ success: true, processedCount: 0, failedCount: 0, failedIds: [] }),
  },
  {
    id: 'approve',
    label: 'Approve',
    icon: 'CheckCircle2',
    variant: 'success',
    requiresConfirmation: true,
    confirmationMessage: 'Approve the selected items?',
    supportsUndo: true,
    handler: async () => ({ success: true, processedCount: 0, failedCount: 0, failedIds: [] }),
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: 'Archive',
    variant: 'default',
    requiresConfirmation: true,
    confirmationMessage: 'Archive the selected items?',
    supportsUndo: true,
    handler: async () => ({ success: true, processedCount: 0, failedCount: 0, failedIds: [] }),
  },
];
