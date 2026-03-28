'use client';

/**
 * Planner Hook
 * 
 * Hook for managing Microsoft Planner operations including
 * plan/bucket browsing, task management, and sync operations.
 * 
 * @module hooks/usePlanner
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  PlannerClient,
  getPlannerClient,
  PLANNER_SCOPES,
  PlannerPlan,
  PlannerBucket,
  PlannerTask,
  PlannerConnectionState,
  PlannerApiError,
  ActionItem,
  LinkedPlannerTask,
  PlannerSyncResult,
  PlannerSyncService,
  getPlannerSyncService,
  getLinkedTask,
  getLinkedTasksForMinute,
  removeLinkedTask,
  defaultConnectionState,
} from '@/lib/planner';

// ============================================================================
// Types
// ============================================================================

export interface UsePlannerOptions {
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Default plan ID */
  defaultPlanId?: string;
  /** Default bucket ID */
  defaultBucketId?: string;
}

export interface UsePlannerReturn {
  // Connection State
  connectionState: PlannerConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isSyncing: boolean;
  hasError: boolean;
  error: PlannerApiError | null;
  
  // Data
  plans: PlannerPlan[];
  buckets: PlannerBucket[];
  tasks: PlannerTask[];
  myTasks: PlannerTask[];
  selectedPlan: PlannerPlan | null;
  selectedBucket: PlannerBucket | null;
  
  // Loading States
  isLoadingPlans: boolean;
  isLoadingBuckets: boolean;
  isLoadingTasks: boolean;
  
  // Connection Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Plan/Bucket Actions
  loadPlans: () => Promise<void>;
  selectPlan: (plan: PlannerPlan) => Promise<void>;
  selectBucket: (bucket: PlannerBucket | null) => void;
  
  // Task Actions
  loadTasks: () => Promise<void>;
  loadMyTasks: () => Promise<void>;
  createTask: (title: string, options?: {
    bucketId?: string;
    dueDate?: string;
    priority?: number;
    assigneeId?: string;
  }) => Promise<PlannerTask>;
  updateTask: (taskId: string, updates: Partial<PlannerTask>) => Promise<PlannerTask>;
  completeTask: (taskId: string) => Promise<PlannerTask>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // Sync Actions
  syncActionItems: (items: ActionItem[], options?: {
    planId?: string;
    bucketId?: string;
  }) => Promise<PlannerSyncResult>;
  syncFromPlanner: (minuteId: string) => Promise<void>;
  getLinkedTask: (actionItemId: string) => LinkedPlannerTask | undefined;
  getLinkedTasksForMinute: (minuteId: string) => LinkedPlannerTask[];
  unlinkTask: (actionItemId: string) => Promise<void>;
  
  // Refresh
  refresh: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePlanner(options: UsePlannerOptions = {}): UsePlannerReturn {
  const { autoConnect = false, defaultPlanId, defaultBucketId } = options;
  const { getToken, isAuthenticated } = useAuth();

  // State
  const [connectionState, setConnectionState] = useState<PlannerConnectionState>(defaultConnectionState);
  const [plans, setPlans] = useState<PlannerPlan[]>([]);
  const [buckets, setBuckets] = useState<PlannerBucket[]>([]);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [myTasks, setMyTasks] = useState<PlannerTask[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlannerPlan | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<PlannerBucket | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isLoadingBuckets, setIsLoadingBuckets] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Memoized client accessor
  const getClient = useCallback(async (): Promise<PlannerClient | null> => {
    if (!isAuthenticated) return null;
    
    const tokenGetter = async () => {
      // getToken returns a generic access token - for Planner, need to ensure proper scopes
      return getToken();
    };
    
    return getPlannerClient(tokenGetter);
  }, [isAuthenticated, getToken]);

  // Memoized sync service accessor
  const getSyncService = useCallback(async (): Promise<PlannerSyncService | null> => {
    const client = await getClient();
    if (!client) return null;
    return getPlannerSyncService(client);
  }, [getClient]);

  // Connect to Planner
  const connect = useCallback(async () => {
    setConnectionState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Not authenticated');
      }

      // Verify connection by fetching current user
      const user = await client.getCurrentUser();
      
      setConnectionState({
        isConnected: true,
        isConnecting: false,
        isSyncing: false,
        error: null,
        currentUser: {
          id: user.id,
          displayName: user.displayName,
          email: user.mail || user.userPrincipalName,
        },
      });

      // Load plans after connecting
      await loadPlans();
    } catch (error) {
      const apiError = error as PlannerApiError;
      setConnectionState({
        isConnected: false,
        isConnecting: false,
        isSyncing: false,
        error: apiError,
      });
    }
  }, [getClient]);

  // Disconnect
  const disconnect = useCallback(() => {
    setConnectionState(defaultConnectionState);
    setPlans([]);
    setBuckets([]);
    setTasks([]);
    setMyTasks([]);
    setSelectedPlan(null);
    setSelectedBucket(null);
  }, []);

  // Load plans
  const loadPlans = useCallback(async () => {
    setIsLoadingPlans(true);
    try {
      const client = await getClient();
      if (!client) return;

      const userPlans = await client.getMyPlans();
      setPlans(userPlans);

      // Auto-select default plan if specified
      if (defaultPlanId) {
        const defaultPlan = userPlans.find(p => p.id === defaultPlanId);
        if (defaultPlan) {
          setSelectedPlan(defaultPlan);
          // Load buckets for default plan
          const planBuckets = await client.getBuckets(defaultPlanId);
          setBuckets(planBuckets);
          
          // Auto-select default bucket
          if (defaultBucketId) {
            const defaultBucket = planBuckets.find(b => b.id === defaultBucketId);
            if (defaultBucket) {
              setSelectedBucket(defaultBucket);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setIsLoadingPlans(false);
    }
  }, [getClient, defaultPlanId, defaultBucketId]);

  // Select plan
  const selectPlan = useCallback(async (plan: PlannerPlan) => {
    setSelectedPlan(plan);
    setSelectedBucket(null);
    setIsLoadingBuckets(true);
    
    try {
      const client = await getClient();
      if (!client) return;

      const planBuckets = await client.getBuckets(plan.id);
      setBuckets(planBuckets);

      // Update sync service default plan
      const syncService = await getSyncService();
      syncService?.setDefaultPlan(plan.id);
    } catch (error) {
      console.error('Failed to load buckets:', error);
    } finally {
      setIsLoadingBuckets(false);
    }
  }, [getClient, getSyncService]);

  // Select bucket
  const selectBucketFn = useCallback((bucket: PlannerBucket | null) => {
    setSelectedBucket(bucket);
  }, []);

  // Load tasks for selected plan
  const loadTasks = useCallback(async () => {
    if (!selectedPlan) return;
    
    setIsLoadingTasks(true);
    try {
      const client = await getClient();
      if (!client) return;

      const planTasks = await client.getTasks(selectedPlan.id);
      setTasks(planTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [getClient, selectedPlan]);

  // Load tasks assigned to current user
  const loadMyTasks = useCallback(async () => {
    setIsLoadingTasks(true);
    try {
      const client = await getClient();
      if (!client) return;

      const userTasks = await client.getMyTasks();
      setMyTasks(userTasks);
    } catch (error) {
      console.error('Failed to load my tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [getClient]);

  // Create task
  const createTask = useCallback(async (
    title: string,
    taskOptions?: {
      bucketId?: string;
      dueDate?: string;
      priority?: number;
      assigneeId?: string;
    }
  ): Promise<PlannerTask> => {
    if (!selectedPlan) {
      throw new Error('No plan selected');
    }

    const client = await getClient();
    if (!client) {
      throw new Error('Not connected');
    }

    const task = await client.createTask({
      title,
      planId: selectedPlan.id,
      bucketId: taskOptions?.bucketId ?? selectedBucket?.id,
      dueDateTime: taskOptions?.dueDate,
      priority: (taskOptions?.priority ?? 5) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
      assignments: taskOptions?.assigneeId ? {
        [taskOptions.assigneeId]: { orderHint: ' !' },
      } : undefined,
    });

    // Refresh tasks list
    await loadTasks();
    return task;
  }, [getClient, selectedPlan, selectedBucket, loadTasks]);

  // Update task
  const updateTask = useCallback(async (
    taskId: string,
    updates: Partial<PlannerTask>
  ): Promise<PlannerTask> => {
    const client = await getClient();
    if (!client) {
      throw new Error('Not connected');
    }

    const currentTask = await client.getTask(taskId);
    const etag = currentTask['@odata.etag']!;

    const task = await client.updateTask(taskId, {
      title: updates.title,
      bucketId: updates.bucketId,
      dueDateTime: updates.dueDateTime,
      priority: updates.priority,
      percentComplete: updates.percentComplete,
    }, etag);

    // Refresh tasks list
    await loadTasks();
    return task;
  }, [getClient, loadTasks]);

  // Complete task
  const completeTask = useCallback(async (taskId: string): Promise<PlannerTask> => {
    const client = await getClient();
    if (!client) {
      throw new Error('Not connected');
    }

    const currentTask = await client.getTask(taskId);
    const etag = currentTask['@odata.etag']!;

    const task = await client.completeTask(taskId, etag);
    await loadTasks();
    return task;
  }, [getClient, loadTasks]);

  // Delete task
  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    const client = await getClient();
    if (!client) {
      throw new Error('Not connected');
    }

    const currentTask = await client.getTask(taskId);
    const etag = currentTask['@odata.etag']!;

    await client.deleteTask(taskId, etag);
    await loadTasks();
  }, [getClient, loadTasks]);

  // Sync action items to Planner
  const syncActionItems = useCallback(async (
    items: ActionItem[],
    syncOptions?: {
      planId?: string;
      bucketId?: string;
    }
  ): Promise<PlannerSyncResult> => {
    setIsSyncing(true);
    setConnectionState(prev => ({ ...prev, isSyncing: true }));

    try {
      const syncService = await getSyncService();
      if (!syncService) {
        throw new Error('Not connected');
      }

      const result = await syncService.syncActionItems(items, {
        direction: 'toPlanner',
        autoResolveConflicts: true,
        conflictStrategy: 'useLocal',
        includeCompleted: true,
        planId: syncOptions?.planId ?? selectedPlan?.id,
        bucketId: syncOptions?.bucketId ?? selectedBucket?.id,
      });

      setConnectionState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
      }));

      // Refresh tasks
      await loadTasks();

      return result;
    } finally {
      setIsSyncing(false);
      setConnectionState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [getSyncService, selectedPlan, selectedBucket, loadTasks]);

  // Sync from Planner (reverse sync)
  const syncFromPlanner = useCallback(async (minuteId: string): Promise<void> => {
    setIsSyncing(true);
    try {
      const syncService = await getSyncService();
      if (!syncService) return;

      const linkedTasks = getLinkedTasksForMinute(minuteId);
      await syncService.syncFromPlanner(linkedTasks);
    } finally {
      setIsSyncing(false);
    }
  }, [getSyncService]);

  // Unlink task
  const unlinkTask = useCallback(async (actionItemId: string): Promise<void> => {
    const syncService = await getSyncService();
    if (!syncService) return;

    await syncService.unlinkActionItem(actionItemId);
  }, [getSyncService]);

  // Refresh all data
  const refresh = useCallback(async () => {
    if (!connectionState.isConnected) return;
    await loadPlans();
    if (selectedPlan) {
      await loadTasks();
    }
    await loadMyTasks();
  }, [connectionState.isConnected, loadPlans, selectedPlan, loadTasks, loadMyTasks]);

  // Auto-connect on mount if requested
  useEffect(() => {
    if (autoConnect && isAuthenticated && !connectionState.isConnected && !connectionState.isConnecting) {
      connect();
    }
  }, [autoConnect, isAuthenticated, connectionState.isConnected, connectionState.isConnecting, connect]);

  // Derived state
  const derivedState = useMemo(() => ({
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,
    hasError: !!connectionState.error,
    error: connectionState.error ?? null,
  }), [connectionState]);

  return {
    // Connection State
    connectionState,
    ...derivedState,
    isSyncing,
    
    // Data
    plans,
    buckets,
    tasks,
    myTasks,
    selectedPlan,
    selectedBucket,
    
    // Loading States
    isLoadingPlans,
    isLoadingBuckets,
    isLoadingTasks,
    
    // Connection Actions
    connect,
    disconnect,
    
    // Plan/Bucket Actions
    loadPlans,
    selectPlan,
    selectBucket: selectBucketFn,
    
    // Task Actions
    loadTasks,
    loadMyTasks,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    
    // Sync Actions
    syncActionItems,
    syncFromPlanner,
    getLinkedTask,
    getLinkedTasksForMinute,
    unlinkTask,
    
    // Refresh
    refresh,
  };
}

export default usePlanner;
