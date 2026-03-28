/**
 * Workflow State Machine
 * 
 * Implementation of a finite state machine for managing
 * meeting minute approval workflows with role-based transitions.
 * 
 * @module lib/workflow/state-machine
 */

import { UserRole } from '@/config/domains';
import {
  WorkflowStep,
  WorkflowAction,
  WorkflowState,
  WorkflowActionParams,
  WorkflowActionResult,
  WorkflowHistoryEntry,
  WorkflowTransition,
  WorkflowCondition,
  WorkflowActor,
  WORKFLOW_TRANSITIONS,
  WORKFLOW_STEP_CONFIG,
  WORKFLOW_ACTION_CONFIG,
  PRIORITY_CONFIG,
} from './types';

// ============================================================================
// Workflow State Machine
// ============================================================================

/**
 * Manages workflow state transitions with validation and audit trail
 */
export class WorkflowStateMachine {
  private state: WorkflowState;
  private transitions: WorkflowTransition[];

  constructor(
    initialState: WorkflowState,
    customTransitions?: WorkflowTransition[]
  ) {
    this.state = { ...initialState };
    this.transitions = customTransitions ?? WORKFLOW_TRANSITIONS;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // State Accessors
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get current workflow state
   */
  getState(): WorkflowState {
    return { ...this.state };
  }

  /**
   * Get current step
   */
  getCurrentStep(): WorkflowStep {
    return this.state.currentStep;
  }

  /**
   * Get workflow history
   */
  getHistory(): WorkflowHistoryEntry[] {
    return [...this.state.history];
  }

  /**
   * Check if workflow is in a final state
   */
  isFinal(): boolean {
    return WORKFLOW_STEP_CONFIG[this.state.currentStep].isFinal;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Transition Validation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Check if a transition from current state is allowed for an action
   */
  canTransition(action: WorkflowAction, actor: WorkflowActor): boolean {
    const transition = this.findTransition(action);
    if (!transition) {
      return false;
    }

    // Check role permission
    if (!this.hasRequiredRole(actor.role, transition.requiredRole)) {
      return false;
    }

    // Check conditions
    if (transition.conditions && transition.conditions.length > 0) {
      for (const condition of transition.conditions) {
        if (!this.evaluateCondition(condition, actor)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get validation errors for a transition attempt
   */
  getTransitionErrors(action: WorkflowAction, actor: WorkflowActor): string[] {
    const errors: string[] = [];
    const transition = this.findTransition(action);

    if (!transition) {
      const fromSteps = this.transitions
        .filter(t => t.action === action)
        .flatMap(t => Array.isArray(t.from) ? t.from : [t.from]);
      
      if (fromSteps.length > 0) {
        errors.push(
          `Action "${action}" is not valid from step "${this.state.currentStep}". ` +
          `Valid from: ${fromSteps.join(', ')}`
        );
      } else {
        errors.push(`Action "${action}" is not defined in the workflow`);
      }
      return errors;
    }

    // Check role
    if (!this.hasRequiredRole(actor.role, transition.requiredRole)) {
      errors.push(
        `Role "${actor.role}" cannot perform "${action}". ` +
        `Required roles: ${transition.requiredRole.join(', ')}`
      );
    }

    // Check conditions
    if (transition.conditions) {
      for (const condition of transition.conditions) {
        if (!this.evaluateCondition(condition, actor)) {
          errors.push(condition.description);
        }
      }
    }

    // Check for required comment
    const actionConfig = WORKFLOW_ACTION_CONFIG[action];
    if (actionConfig.requiresComment) {
      // Note: Actual comment validation happens in executeTransition
      // This is just informational
    }

    return errors;
  }

  /**
   * Get all available actions for the current step and actor
   */
  getAvailableActions(actor: WorkflowActor): WorkflowAction[] {
    const currentStep = this.state.currentStep;
    const availableActions: WorkflowAction[] = [];

    for (const transition of this.transitions) {
      const fromSteps = Array.isArray(transition.from)
        ? transition.from
        : [transition.from];

      if (fromSteps.includes(currentStep)) {
        if (this.canTransition(transition.action, actor)) {
          availableActions.push(transition.action);
        }
      }
    }

    return availableActions;
  }

  /**
   * Get detailed action info including why some are unavailable
   */
  getActionAvailability(actor: WorkflowActor): Map<WorkflowAction, {
    available: boolean;
    reasons: string[];
  }> {
    const result = new Map<WorkflowAction, { available: boolean; reasons: string[] }>();
    const currentStep = this.state.currentStep;

    for (const transition of this.transitions) {
      const fromSteps = Array.isArray(transition.from)
        ? transition.from
        : [transition.from];

      if (fromSteps.includes(currentStep)) {
        const errors = this.getTransitionErrors(transition.action, actor);
        result.set(transition.action, {
          available: errors.length === 0,
          reasons: errors,
        });
      }
    }

    return result;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Transition Execution
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Execute a workflow transition
   */
  executeTransition(params: WorkflowActionParams): WorkflowActionResult {
    const { action, actor, comment, metadata } = params;

    // Find valid transition
    const transition = this.findTransition(action);
    if (!transition) {
      return {
        success: false,
        error: `No valid transition for action "${action}" from step "${this.state.currentStep}"`,
        errorCode: 'INVALID_TRANSITION',
      };
    }

    // Validate actor role
    if (!this.hasRequiredRole(actor.role, transition.requiredRole)) {
      return {
        success: false,
        error: `Role "${actor.role}" cannot perform action "${action}"`,
        errorCode: 'INSUFFICIENT_PERMISSIONS',
      };
    }

    // Validate conditions
    if (transition.conditions) {
      for (const condition of transition.conditions) {
        if (!this.evaluateCondition(condition, actor)) {
          return {
            success: false,
            error: condition.description,
            errorCode: 'CONDITION_NOT_MET',
          };
        }
      }
    }

    // Check for required comment
    const actionConfig = WORKFLOW_ACTION_CONFIG[action];
    if (actionConfig.requiresComment && !comment?.trim()) {
      return {
        success: false,
        error: `Action "${action}" requires a comment`,
        errorCode: 'COMMENT_REQUIRED',
      };
    }

    // Execute transition
    const previousStep = this.state.currentStep;
    const newStep = transition.to;

    // Create history entry
    const historyEntry: WorkflowHistoryEntry = {
      id: generateId(),
      action,
      fromStep: previousStep,
      toStep: newStep,
      actor: { ...actor },
      timestamp: new Date().toISOString(),
      comment: comment?.trim(),
      metadata: metadata ? { ...metadata } : undefined,
    };

    // Update state
    this.state = {
      ...this.state,
      currentStep: newStep,
      history: [...this.state.history, historyEntry],
      updatedAt: historyEntry.timestamp,
      version: this.state.version + 1,
    };

    // Handle action-specific state updates
    this.handleActionSideEffects(action, params);

    return {
      success: true,
      newState: this.getState(),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Find a valid transition for an action from current step
   */
  private findTransition(action: WorkflowAction): WorkflowTransition | undefined {
    const currentStep = this.state.currentStep;

    return this.transitions.find(t => {
      if (t.action !== action) return false;
      const fromSteps = Array.isArray(t.from) ? t.from : [t.from];
      return fromSteps.includes(currentStep);
    });
  }

  /**
   * Check if actor role is in required roles list
   */
  private hasRequiredRole(actorRole: UserRole, requiredRoles: UserRole[]): boolean {
    // Admin can always perform actions (except author-only ones)
    if (actorRole === 'admin') {
      return true;
    }
    return requiredRoles.includes(actorRole);
  }

  /**
   * Evaluate a workflow condition
   */
  private evaluateCondition(condition: WorkflowCondition, actor: WorkflowActor): boolean {
    switch (condition.type) {
      case 'is_author':
        return this.state.author.id === actor.id;

      case 'has_reviewer':
        return (
          this.state.assignedReviewer?.id === actor.id ||
          actor.role === 'admin'
        );

      case 'has_escalation_path':
        // In a real implementation, check if escalation target exists
        return true;

      case 'sla_not_breached':
        return !this.state.slaBreached;

      case 'custom':
        // Custom conditions would be handled by extending the class
        return true;

      default:
        return true;
    }
  }

  /**
   * Handle side effects of specific actions
   */
  private handleActionSideEffects(action: WorkflowAction, params: WorkflowActionParams): void {
    switch (action) {
      case 'assign':
        this.state.assignedReviewer = params.metadata?.assigneeId
          ? {
              id: params.metadata.assigneeId,
              name: params.metadata.assigneeName ?? 'Unknown',
              role: 'manager',
            }
          : { ...params.actor };
        break;

      case 'unassign':
        this.state.assignedReviewer = undefined;
        break;

      case 'escalate':
        if (params.metadata?.escalationTargetId) {
          this.state.escalationTarget = {
            id: params.metadata.escalationTargetId,
            name: params.metadata.escalationTargetName ?? 'Unknown',
            role: 'manager',
          };
        }
        // Clear assigned reviewer on escalation
        this.state.assignedReviewer = undefined;
        break;

      case 'approve':
      case 'reject':
        // Clear reviewer after decision
        // (keep for audit, but remove active assignment)
        break;

      case 'withdraw':
        // Clear all assignments
        this.state.assignedReviewer = undefined;
        this.state.escalationTarget = undefined;
        break;
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique ID for history entries
 */
function generateId(): string {
  return `wh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create an initial workflow state for a new entity
 */
export function createInitialWorkflowState(
  entityId: string,
  entityType: 'minute' | 'transcription',
  author: WorkflowActor,
  domain: import('@/config/domains').ServiceDomain,
  priority: import('./types').WorkflowPriority = 'normal'
): WorkflowState {
  const now = new Date();
  const slaDays = PRIORITY_CONFIG[priority].slaDays;
  const slaDeadline = new Date(now.getTime() + slaDays * 24 * 60 * 60 * 1000);

  return {
    entityId,
    entityType,
    currentStep: 'draft',
    priority,
    author,
    domain,
    slaDeadline: slaDeadline.toISOString(),
    slaBreached: false,
    history: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    version: 1,
  };
}

/**
 * Check if SLA is breached based on deadline
 */
export function checkSlaBreach(slaDeadline: string | undefined): boolean {
  if (!slaDeadline) return false;
  return new Date() > new Date(slaDeadline);
}

/**
 * Calculate time remaining until SLA breach
 */
export function getTimeUntilSlaBreach(slaDeadline: string | undefined): {
  breached: boolean;
  remainingMs: number;
  remainingFormatted: string;
} {
  if (!slaDeadline) {
    return { breached: false, remainingMs: Infinity, remainingFormatted: 'No deadline' };
  }

  const deadline = new Date(slaDeadline);
  const now = new Date();
  const remainingMs = deadline.getTime() - now.getTime();
  const breached = remainingMs <= 0;

  if (breached) {
    const overdueMs = Math.abs(remainingMs);
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
    const overdueDays = Math.floor(overdueHours / 24);
    
    if (overdueDays > 0) {
      return { breached: true, remainingMs, remainingFormatted: `${overdueDays}d overdue` };
    }
    return { breached: true, remainingMs, remainingFormatted: `${overdueHours}h overdue` };
  }

  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingDays = Math.floor(remainingHours / 24);
  const hoursRemaining = remainingHours % 24;

  if (remainingDays > 0) {
    return { breached: false, remainingMs, remainingFormatted: `${remainingDays}d ${hoursRemaining}h` };
  }

  if (remainingHours > 0) {
    return { breached: false, remainingMs, remainingFormatted: `${remainingHours}h` };
  }

  const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
  return { breached: false, remainingMs, remainingFormatted: `${remainingMinutes}m` };
}

/**
 * Get a summary of workflow state for display
 */
export function getWorkflowSummary(state: WorkflowState): {
  step: string;
  stepLabel: string;
  priority: string;
  author: string;
  reviewer: string | null;
  slaStatus: string;
  historyCount: number;
} {
  const stepConfig = WORKFLOW_STEP_CONFIG[state.currentStep];
  const slaInfo = getTimeUntilSlaBreach(state.slaDeadline);

  return {
    step: state.currentStep,
    stepLabel: stepConfig.label,
    priority: PRIORITY_CONFIG[state.priority].label,
    author: state.author.name,
    reviewer: state.assignedReviewer?.name ?? null,
    slaStatus: slaInfo.remainingFormatted,
    historyCount: state.history.length,
  };
}
