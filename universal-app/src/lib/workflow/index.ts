/**
 * Workflow Module
 * 
 * Manager approval workflow system for meeting minutes.
 * Exports types, state machine, and notification utilities.
 * 
 * @module lib/workflow
 */

// Types
export type {
  WorkflowStep,
  WorkflowAction,
  WorkflowTransition,
  WorkflowCondition,
  WorkflowHistoryEntry,
  WorkflowActor,
  WorkflowMetadata,
  WorkflowState,
  WorkflowActionParams,
  WorkflowActionResult,
  WorkflowStepConfig,
  WorkflowActionConfig,
  WorkflowPriority,
  EscalationReason,
} from './types';

// Constants
export {
  WORKFLOW_STEP_CONFIG,
  WORKFLOW_ACTION_CONFIG,
  WORKFLOW_TRANSITIONS,
  PRIORITY_CONFIG,
  ESCALATION_REASONS,
} from './types';

// State Machine
export {
  WorkflowStateMachine,
  createInitialWorkflowState,
  checkSlaBreach,
  getTimeUntilSlaBreach,
  getWorkflowSummary,
} from './state-machine';

// Notifications
export {
  notifyOnSubmit,
  notifyOnApproval,
  notifyOnChangesRequested,
  notifyOnRejection,
  notifyOnEscalation,
  notifyOnAssignment,
  notifySlaBreach,
  processWorkflowNotifications,
  getNotificationRecipients,
  createNotificationFromHistory,
} from './notifications';
