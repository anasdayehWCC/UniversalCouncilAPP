/**
 * Microsoft Planner Integration Module
 * 
 * Provides Microsoft Planner integration for task management
 * and action item tracking from meeting minutes.
 * 
 * @module lib/planner
 * 
 * @example
 * ```tsx
 * import { usePlanner } from '@/hooks/usePlanner';
 * import { PlannerSync, TaskCard } from '@/components/planner';
 * 
 * function MyComponent() {
 *   const { isConnected, plans, syncActionItems } = usePlanner();
 *   
 *   // Sync action items to a plan
 *   await syncActionItems(actionItems, { planId: 'plan-123' });
 * }
 * ```
 */

// Types
export * from './types';

// Client
export {
  PlannerClient,
  getPlannerClient,
  resetPlannerClient,
  PLANNER_SCOPES,
} from './client';

// Sync Service
export {
  PlannerSyncService,
  getPlannerSyncService,
  resetPlannerSyncService,
  getLinkedTask,
  getLinkedTasksForMinute,
  removeLinkedTask,
} from './sync';
