/**
 * Workflow Types
 * 
 * Type definitions for the manager approval workflow system that handles
 * meeting minute review, approval, rejection, and escalation.
 * 
 * @module lib/workflow/types
 */

import { UserRole, ServiceDomain } from '@/config/domains';

// ============================================================================
// Core Workflow Enums
// ============================================================================

/**
 * Steps in the approval workflow pipeline
 */
export type WorkflowStep =
  | 'draft'             // Initial state, being worked on by author
  | 'submitted'         // Submitted for review, awaiting assignment
  | 'in_review'         // Currently being reviewed by a manager
  | 'changes_requested' // Review complete, revisions needed
  | 'approved'          // Approved by manager, ready for publish
  | 'published';        // Final state, visible to external systems

/**
 * Actions that can be performed on a workflow item
 */
export type WorkflowAction =
  | 'submit'           // Author submits for review
  | 'approve'          // Manager approves
  | 'reject'           // Manager rejects entirely
  | 'request_changes'  // Manager requests revisions
  | 'escalate'         // Escalate to senior manager
  | 'resubmit'         // Author resubmits after changes
  | 'withdraw'         // Author withdraws submission
  | 'publish'          // System publishes approved item
  | 'assign'           // Assign to specific reviewer
  | 'unassign';        // Remove reviewer assignment

// ============================================================================
// Workflow Configuration
// ============================================================================

/**
 * Configuration for a workflow step
 */
export interface WorkflowStepConfig {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  isFinal: boolean;
  allowedRoles: UserRole[];
}

/**
 * Step configuration map with visual and permission settings
 */
export const WORKFLOW_STEP_CONFIG: Record<WorkflowStep, WorkflowStepConfig> = {
  draft: {
    label: 'Draft',
    description: 'Being edited by the author',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    icon: 'FileEdit',
    isFinal: false,
    allowedRoles: ['social_worker', 'housing_officer'],
  },
  submitted: {
    label: 'Submitted',
    description: 'Awaiting reviewer assignment',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: 'Send',
    isFinal: false,
    allowedRoles: ['manager', 'admin'],
  },
  in_review: {
    label: 'In Review',
    description: 'Being reviewed by a manager',
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    icon: 'Eye',
    isFinal: false,
    allowedRoles: ['manager', 'admin'],
  },
  changes_requested: {
    label: 'Changes Requested',
    description: 'Revisions required from author',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: 'AlertCircle',
    isFinal: false,
    allowedRoles: ['social_worker', 'housing_officer'],
  },
  approved: {
    label: 'Approved',
    description: 'Ready for publication',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: 'CheckCircle2',
    isFinal: false,
    allowedRoles: ['admin'],
  },
  published: {
    label: 'Published',
    description: 'Visible in external systems',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: 'Globe',
    isFinal: true,
    allowedRoles: [],
  },
};

/**
 * Configuration for workflow actions
 */
export interface WorkflowActionConfig {
  label: string;
  description: string;
  icon: string;
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  requiresComment: boolean;
  confirmationRequired: boolean;
  allowedRoles: UserRole[];
}

/**
 * Action configuration map
 */
export const WORKFLOW_ACTION_CONFIG: Record<WorkflowAction, WorkflowActionConfig> = {
  submit: {
    label: 'Submit for Review',
    description: 'Send to managers for approval',
    icon: 'Send',
    variant: 'default',
    requiresComment: false,
    confirmationRequired: false,
    allowedRoles: ['social_worker', 'housing_officer'],
  },
  approve: {
    label: 'Approve',
    description: 'Approve the minutes as submitted',
    icon: 'CheckCircle2',
    variant: 'default',
    requiresComment: false,
    confirmationRequired: true,
    allowedRoles: ['manager', 'admin'],
  },
  reject: {
    label: 'Reject',
    description: 'Reject the submission entirely',
    icon: 'XCircle',
    variant: 'destructive',
    requiresComment: true,
    confirmationRequired: true,
    allowedRoles: ['manager', 'admin'],
  },
  request_changes: {
    label: 'Request Changes',
    description: 'Return to author with feedback',
    icon: 'MessageSquare',
    variant: 'outline',
    requiresComment: true,
    confirmationRequired: false,
    allowedRoles: ['manager', 'admin'],
  },
  escalate: {
    label: 'Escalate',
    description: 'Escalate to senior management',
    icon: 'ArrowUpCircle',
    variant: 'secondary',
    requiresComment: true,
    confirmationRequired: true,
    allowedRoles: ['manager'],
  },
  resubmit: {
    label: 'Resubmit',
    description: 'Resubmit after making changes',
    icon: 'RefreshCw',
    variant: 'default',
    requiresComment: false,
    confirmationRequired: false,
    allowedRoles: ['social_worker', 'housing_officer'],
  },
  withdraw: {
    label: 'Withdraw',
    description: 'Withdraw from review',
    icon: 'Undo',
    variant: 'ghost',
    requiresComment: false,
    confirmationRequired: true,
    allowedRoles: ['social_worker', 'housing_officer'],
  },
  publish: {
    label: 'Publish',
    description: 'Publish to external systems',
    icon: 'Globe',
    variant: 'default',
    requiresComment: false,
    confirmationRequired: true,
    allowedRoles: ['admin'],
  },
  assign: {
    label: 'Assign',
    description: 'Assign to a reviewer',
    icon: 'UserPlus',
    variant: 'outline',
    requiresComment: false,
    confirmationRequired: false,
    allowedRoles: ['manager', 'admin'],
  },
  unassign: {
    label: 'Unassign',
    description: 'Remove reviewer assignment',
    icon: 'UserMinus',
    variant: 'ghost',
    requiresComment: false,
    confirmationRequired: false,
    allowedRoles: ['manager', 'admin'],
  },
};

// ============================================================================
// Workflow Transitions
// ============================================================================

/**
 * Defines a valid state transition in the workflow
 */
export interface WorkflowTransition {
  /** Action that triggers this transition */
  action: WorkflowAction;
  /** Starting step */
  from: WorkflowStep | WorkflowStep[];
  /** Resulting step */
  to: WorkflowStep;
  /** Roles allowed to perform this transition */
  requiredRole: UserRole[];
  /** Additional conditions for the transition */
  conditions?: WorkflowCondition[];
}

/**
 * Condition that must be met for a transition
 */
export interface WorkflowCondition {
  type: 'has_reviewer' | 'is_author' | 'has_escalation_path' | 'sla_not_breached' | 'custom';
  /** Custom condition key for business logic */
  key?: string;
  /** Human-readable description */
  description: string;
}

/**
 * Valid workflow transitions
 */
export const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  // Author submits draft for review
  {
    action: 'submit',
    from: 'draft',
    to: 'submitted',
    requiredRole: ['social_worker', 'housing_officer'],
    conditions: [],
  },
  // Author resubmits after making requested changes
  {
    action: 'resubmit',
    from: 'changes_requested',
    to: 'submitted',
    requiredRole: ['social_worker', 'housing_officer'],
    conditions: [
      { type: 'is_author', description: 'Must be the original author' },
    ],
  },
  // Manager starts review (via assignment)
  {
    action: 'assign',
    from: 'submitted',
    to: 'in_review',
    requiredRole: ['manager', 'admin'],
    conditions: [],
  },
  // Manager approves
  {
    action: 'approve',
    from: 'in_review',
    to: 'approved',
    requiredRole: ['manager', 'admin'],
    conditions: [
      { type: 'has_reviewer', description: 'Must be assigned reviewer' },
    ],
  },
  // Manager rejects
  {
    action: 'reject',
    from: 'in_review',
    to: 'draft',
    requiredRole: ['manager', 'admin'],
    conditions: [
      { type: 'has_reviewer', description: 'Must be assigned reviewer' },
    ],
  },
  // Manager requests changes
  {
    action: 'request_changes',
    from: 'in_review',
    to: 'changes_requested',
    requiredRole: ['manager', 'admin'],
    conditions: [
      { type: 'has_reviewer', description: 'Must be assigned reviewer' },
    ],
  },
  // Escalation from in_review
  {
    action: 'escalate',
    from: 'in_review',
    to: 'submitted',
    requiredRole: ['manager'],
    conditions: [
      { type: 'has_escalation_path', description: 'Escalation path must exist' },
    ],
  },
  // Author withdraws
  {
    action: 'withdraw',
    from: ['submitted', 'in_review', 'changes_requested'],
    to: 'draft',
    requiredRole: ['social_worker', 'housing_officer'],
    conditions: [
      { type: 'is_author', description: 'Must be the original author' },
    ],
  },
  // Admin publishes approved item
  {
    action: 'publish',
    from: 'approved',
    to: 'published',
    requiredRole: ['admin'],
    conditions: [],
  },
];

// ============================================================================
// Workflow History & State
// ============================================================================

/**
 * A single entry in the workflow audit trail
 */
export interface WorkflowHistoryEntry {
  /** Unique identifier for this history entry */
  id: string;
  /** Action that was performed */
  action: WorkflowAction;
  /** Step before the action */
  fromStep: WorkflowStep;
  /** Step after the action */
  toStep: WorkflowStep;
  /** User who performed the action */
  actor: WorkflowActor;
  /** Timestamp of the action (ISO string) */
  timestamp: string;
  /** Optional comment or feedback */
  comment?: string;
  /** Additional metadata */
  metadata?: WorkflowMetadata;
}

/**
 * User who performed a workflow action
 */
export interface WorkflowActor {
  /** User ID */
  id: string;
  /** Display name */
  name: string;
  /** Email address */
  email?: string;
  /** User's role at time of action */
  role: UserRole;
  /** Avatar URL */
  avatarUrl?: string;
}

/**
 * Additional metadata for workflow history
 */
export interface WorkflowMetadata {
  /** Assigned reviewer ID (for assign action) */
  assigneeId?: string;
  /** Assigned reviewer name */
  assigneeName?: string;
  /** Escalation target user ID */
  escalationTargetId?: string;
  /** Escalation target name */
  escalationTargetName?: string;
  /** Escalation reason category */
  escalationReason?: EscalationReason;
  /** Priority level if changed */
  priority?: WorkflowPriority;
  /** SLA deadline if set */
  slaDeadline?: string;
  /** IP address (for audit) */
  ipAddress?: string;
  /** Client identifier */
  clientId?: string;
}

/**
 * Escalation reasons
 */
export type EscalationReason =
  | 'complex_case'
  | 'policy_unclear'
  | 'conflict_of_interest'
  | 'sla_breach_risk'
  | 'senior_review_required'
  | 'other';

/**
 * Escalation reason labels
 */
export const ESCALATION_REASONS: Record<EscalationReason, string> = {
  complex_case: 'Complex case requiring senior input',
  policy_unclear: 'Policy guidance needed',
  conflict_of_interest: 'Potential conflict of interest',
  sla_breach_risk: 'At risk of SLA breach',
  senior_review_required: 'Senior review explicitly requested',
  other: 'Other reason (specify in comments)',
};

/**
 * Priority levels for workflow items
 */
export type WorkflowPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Priority configuration
 */
export const PRIORITY_CONFIG: Record<WorkflowPriority, {
  label: string;
  color: string;
  bgColor: string;
  slaDays: number;
}> = {
  low: {
    label: 'Low',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    slaDays: 7,
  },
  normal: {
    label: 'Normal',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    slaDays: 5,
  },
  high: {
    label: 'High',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    slaDays: 3,
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    slaDays: 1,
  },
};

// ============================================================================
// Complete Workflow State
// ============================================================================

/**
 * Complete workflow state for an entity
 */
export interface WorkflowState {
  /** Entity ID (minute/transcription ID) */
  entityId: string;
  /** Entity type */
  entityType: 'minute' | 'transcription';
  /** Current workflow step */
  currentStep: WorkflowStep;
  /** Current priority */
  priority: WorkflowPriority;
  /** Original author */
  author: WorkflowActor;
  /** Currently assigned reviewer (if any) */
  assignedReviewer?: WorkflowActor;
  /** Escalation target (if escalated) */
  escalationTarget?: WorkflowActor;
  /** Service domain context */
  domain: ServiceDomain;
  /** SLA deadline (ISO string) */
  slaDeadline?: string;
  /** Whether SLA is breached */
  slaBreached: boolean;
  /** Workflow history/audit trail */
  history: WorkflowHistoryEntry[];
  /** When workflow was created */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Current version number */
  version: number;
}

/**
 * Parameters for executing a workflow action
 */
export interface WorkflowActionParams {
  /** Entity ID to act on */
  entityId: string;
  /** Action to perform */
  action: WorkflowAction;
  /** User performing the action */
  actor: WorkflowActor;
  /** Optional comment */
  comment?: string;
  /** Additional metadata */
  metadata?: Partial<WorkflowMetadata>;
}

/**
 * Result of a workflow action
 */
export interface WorkflowActionResult {
  success: boolean;
  newState?: WorkflowState;
  error?: string;
  errorCode?: string;
}
