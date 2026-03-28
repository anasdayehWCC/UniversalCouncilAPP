'use client';

/**
 * useWorkflow Hook
 * 
 * React hook for managing workflow state, executing transitions,
 * and loading workflow history. Integrates with the state machine
 * and notification systems.
 * 
 * @module hooks/useWorkflow
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDemo } from '@/context/DemoContext';
import {
  type WorkflowStep,
  type WorkflowAction,
  type WorkflowState,
  type WorkflowActor,
  type WorkflowHistoryEntry,
  type WorkflowPriority,
  type WorkflowActionResult,
  WORKFLOW_STEP_CONFIG,
} from '@/lib/workflow/types';
import {
  WorkflowStateMachine,
  createInitialWorkflowState,
  getTimeUntilSlaBreach,
  getWorkflowSummary,
} from '@/lib/workflow/state-machine';
import { processWorkflowNotifications } from '@/lib/workflow/notifications';
import type { ServiceDomain, UserRole } from '@/config/domains';

// ============================================================================
// Types
// ============================================================================

export interface UseWorkflowOptions {
  entityId: string;
  entityType: 'minute' | 'transcription';
  domain: ServiceDomain;
  initialState?: Partial<WorkflowState>;
}

export interface UseWorkflowReturn {
  // State
  state: WorkflowState | null;
  currentStep: WorkflowStep | null;
  isLoading: boolean;
  error: string | null;

  // Computed Values
  availableActions: WorkflowAction[];
  canEdit: boolean;
  canReview: boolean;
  isFinal: boolean;
  slaInfo: {
    breached: boolean;
    remainingMs: number;
    remainingFormatted: string;
  } | null;

  // Actions
  executeAction: (
    action: WorkflowAction,
    comment?: string,
    metadata?: Record<string, string>
  ) => Promise<WorkflowActionResult>;
  refreshState: () => Promise<void>;
  
  // History
  history: WorkflowHistoryEntry[];
  
  // Summary
  summary: ReturnType<typeof getWorkflowSummary> | null;
}

// ============================================================================
// Mock Data for Demo
// ============================================================================

const createMockWorkflowState = (
  entityId: string,
  entityType: 'minute' | 'transcription',
  domain: ServiceDomain,
  author: WorkflowActor
): WorkflowState => {
  return createInitialWorkflowState(entityId, entityType, author, domain, 'normal');
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useWorkflow({
  entityId,
  entityType,
  domain,
  initialState,
}: UseWorkflowOptions): UseWorkflowReturn {
  const { currentUser } = useDemo();
  
  // State
  const [state, setState] = useState<WorkflowState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateMachine, setStateMachine] = useState<WorkflowStateMachine | null>(null);

  // Current actor from demo context
  const actor: WorkflowActor = useMemo(() => ({
    id: currentUser?.id ?? 'demo-user',
    name: currentUser?.name ?? 'Demo User',
    email: currentUser?.email,
    role: (currentUser?.role ?? 'social_worker') as UserRole,
    avatarUrl: currentUser?.avatar,
  }), [currentUser]);

  // Initialize workflow state
  useEffect(() => {
    const initializeWorkflow = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // In a real app, fetch from API
        // For demo, create initial state or use provided
        let workflowState: WorkflowState;

        if (initialState && initialState.currentStep) {
          workflowState = {
            ...createMockWorkflowState(entityId, entityType, domain, actor),
            ...initialState,
          } as WorkflowState;
        } else {
          workflowState = createMockWorkflowState(entityId, entityType, domain, actor);
        }

        setState(workflowState);
        setStateMachine(new WorkflowStateMachine(workflowState));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workflow state');
      } finally {
        setIsLoading(false);
      }
    };

    initializeWorkflow();
  }, [entityId, entityType, domain, actor, initialState]);

  // Available actions for current user
  const availableActions = useMemo(() => {
    if (!stateMachine) return [];
    return stateMachine.getAvailableActions(actor);
  }, [stateMachine, actor]);

  // Computed: Can the current user edit?
  const canEdit = useMemo(() => {
    if (!state) return false;
    const editableSteps: WorkflowStep[] = ['draft', 'changes_requested'];
    const isAuthor = state.author.id === actor.id;
    return editableSteps.includes(state.currentStep) && isAuthor;
  }, [state, actor]);

  // Computed: Can the current user review?
  const canReview = useMemo(() => {
    if (!state) return false;
    const reviewSteps: WorkflowStep[] = ['submitted', 'in_review'];
    const canReviewRoles: UserRole[] = ['manager', 'admin'];
    return (
      reviewSteps.includes(state.currentStep) &&
      canReviewRoles.includes(actor.role)
    );
  }, [state, actor]);

  // Computed: Is workflow in final state?
  const isFinal = useMemo(() => {
    if (!state) return false;
    return WORKFLOW_STEP_CONFIG[state.currentStep].isFinal;
  }, [state]);

  // Computed: SLA info
  const slaInfo = useMemo(() => {
    if (!state?.slaDeadline) return null;
    return getTimeUntilSlaBreach(state.slaDeadline);
  }, [state]);

  // Computed: Summary
  const summary = useMemo(() => {
    if (!state) return null;
    return getWorkflowSummary(state);
  }, [state]);

  // Execute a workflow action
  const executeAction = useCallback(
    async (
      action: WorkflowAction,
      comment?: string,
      metadata?: Record<string, string>
    ): Promise<WorkflowActionResult> => {
      if (!stateMachine || !state) {
        return {
          success: false,
          error: 'Workflow not initialized',
          errorCode: 'NOT_INITIALIZED',
        };
      }

      setError(null);

      try {
        // Execute the transition
        const result = stateMachine.executeTransition({
          entityId,
          action,
          actor,
          comment,
          metadata,
        });

        if (result.success && result.newState) {
          // Update local state
          setState(result.newState);

          // Send notifications
          await processWorkflowNotifications(
            result.newState,
            action,
            actor,
            comment,
            metadata
          );

          // In a real app, persist to API
          // await api.updateWorkflow(entityId, result.newState);
        } else {
          setError(result.error ?? 'Action failed');
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Action failed';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
          errorCode: 'EXECUTION_ERROR',
        };
      }
    },
    [stateMachine, state, entityId, actor]
  );

  // Refresh state from server
  const refreshState = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, fetch from API
      // const freshState = await api.getWorkflow(entityId);
      // setState(freshState);
      // setStateMachine(new WorkflowStateMachine(freshState));
      
      // For demo, just re-use current state
      if (state) {
        setStateMachine(new WorkflowStateMachine(state));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  }, [state]);

  // History accessor
  const history = useMemo(() => {
    return state?.history ?? [];
  }, [state]);

  return {
    // State
    state,
    currentStep: state?.currentStep ?? null,
    isLoading,
    error,

    // Computed
    availableActions,
    canEdit,
    canReview,
    isFinal,
    slaInfo,

    // Actions
    executeAction,
    refreshState,

    // History
    history,

    // Summary
    summary,
  };
}

// ============================================================================
// Workflow Queue Hook (for managers viewing all items)
// ============================================================================

export interface WorkflowQueueItem {
  entityId: string;
  entityType: 'minute' | 'transcription';
  currentStep: WorkflowStep;
  priority: WorkflowPriority;
  author: WorkflowActor;
  submittedAt: string;
  slaDeadline?: string;
  title?: string;
}

export interface UseWorkflowQueueOptions {
  filter?: {
    step?: WorkflowStep[];
    priority?: WorkflowPriority[];
    domain?: ServiceDomain;
  };
  sortBy?: 'submittedAt' | 'priority' | 'slaDeadline';
  sortOrder?: 'asc' | 'desc';
}

export interface UseWorkflowQueueReturn {
  items: WorkflowQueueItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  stats: {
    total: number;
    pending: number;
    inReview: number;
    urgent: number;
    slaBreached: number;
  };
}

// Mock data for the queue
const MOCK_QUEUE_ITEMS: WorkflowQueueItem[] = [
  {
    entityId: 'min-001',
    entityType: 'minute',
    currentStep: 'submitted',
    priority: 'high',
    author: { id: 'sarah', name: 'Sarah Johnson', role: 'social_worker' },
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    title: 'Home Visit - Smith Family',
  },
  {
    entityId: 'min-002',
    entityType: 'minute',
    currentStep: 'in_review',
    priority: 'normal',
    author: { id: 'james', name: 'James Okonkwo', role: 'social_worker' },
    submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    title: 'Initial Assessment - Chen',
  },
  {
    entityId: 'min-003',
    entityType: 'minute',
    currentStep: 'submitted',
    priority: 'urgent',
    author: { id: 'emma', name: 'Emma Williams', role: 'social_worker' },
    submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    title: 'Safeguarding Follow-up - Davis',
  },
];

export function useWorkflowQueue(options: UseWorkflowQueueOptions = {}): UseWorkflowQueueReturn {
  const { filter, sortBy = 'submittedAt', sortOrder = 'desc' } = options;

  const [items, setItems] = useState<WorkflowQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load queue items
  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, fetch from API with filters
      // const data = await api.getWorkflowQueue(filter, sortBy, sortOrder);
      
      // For demo, use mock data
      let filteredItems = [...MOCK_QUEUE_ITEMS];

      // Apply filters
      if (filter?.step?.length) {
        filteredItems = filteredItems.filter(item => 
          filter.step!.includes(item.currentStep)
        );
      }
      if (filter?.priority?.length) {
        filteredItems = filteredItems.filter(item => 
          filter.priority!.includes(item.priority)
        );
      }

      // Apply sorting
      filteredItems.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'submittedAt':
            comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
            break;
          case 'priority': {
            const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
            comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
            break;
          }
          case 'slaDeadline':
            comparison = (
              (a.slaDeadline ? new Date(a.slaDeadline).getTime() : Infinity) -
              (b.slaDeadline ? new Date(b.slaDeadline).getTime() : Infinity)
            );
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      setItems(filteredItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setIsLoading(false);
    }
  }, [filter, sortBy, sortOrder]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Compute stats
  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: items.length,
      pending: items.filter(i => i.currentStep === 'submitted').length,
      inReview: items.filter(i => i.currentStep === 'in_review').length,
      urgent: items.filter(i => i.priority === 'urgent').length,
      slaBreached: items.filter(i => {
        if (!i.slaDeadline) return false;
        return new Date(i.slaDeadline) < now;
      }).length,
    };
  }, [items]);

  return {
    items,
    isLoading,
    error,
    refresh: loadQueue,
    stats,
  };
}

export default useWorkflow;
