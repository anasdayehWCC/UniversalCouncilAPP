/**
 * Planner Sync Service
 * 
 * Handles synchronization between action items and Planner tasks.
 * Supports one-way and bidirectional sync with conflict resolution.
 * 
 * @module lib/planner/sync
 */

import { v4 as uuidv4 } from 'uuid';
import { PlannerClient } from './client';
import {
  ActionItem,
  LinkedPlannerTask,
  PlannerSyncResult,
  PlannerTask,
  PlannerTaskPriority,
  SyncOptions,
  CreatePlannerTaskRequest,
  UpdatePlannerTaskRequest,
  PlannerApiError,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'planner_linked_tasks';

// Priority mapping: ActionItem priority -> Planner priority (0-10, lower is higher)
const PRIORITY_MAP: Record<string, PlannerTaskPriority> = {
  high: 1,
  medium: 5,
  low: 9,
};

const REVERSE_PRIORITY_MAP: Record<number, 'high' | 'medium' | 'low'> = {
  0: 'high',
  1: 'high',
  2: 'high',
  3: 'medium',
  4: 'medium',
  5: 'medium',
  6: 'medium',
  7: 'low',
  8: 'low',
  9: 'low',
  10: 'low',
};

// ============================================================================
// Storage Helpers
// ============================================================================

/**
 * Load linked tasks from local storage
 */
function loadLinkedTasks(): LinkedPlannerTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save linked tasks to local storage
 */
function saveLinkedTasks(tasks: LinkedPlannerTask[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Get linked task for an action item
 */
export function getLinkedTask(actionItemId: string): LinkedPlannerTask | undefined {
  const tasks = loadLinkedTasks();
  return tasks.find(t => t.actionItemId === actionItemId);
}

/**
 * Get all linked tasks for a minute
 */
export function getLinkedTasksForMinute(minuteId: string): LinkedPlannerTask[] {
  const tasks = loadLinkedTasks();
  return tasks.filter(t => t.minuteId === minuteId);
}

/**
 * Add or update a linked task
 */
function upsertLinkedTask(task: LinkedPlannerTask): void {
  const tasks = loadLinkedTasks();
  const index = tasks.findIndex(t => t.actionItemId === task.actionItemId);
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }
  saveLinkedTasks(tasks);
}

/**
 * Remove a linked task
 */
export function removeLinkedTask(actionItemId: string): void {
  const tasks = loadLinkedTasks();
  const filtered = tasks.filter(t => t.actionItemId !== actionItemId);
  saveLinkedTasks(filtered);
}

// ============================================================================
// Sync Service Class
// ============================================================================

export class PlannerSyncService {
  private client: PlannerClient;
  private defaultPlanId: string | null = null;
  private defaultBucketId: string | null = null;

  constructor(client: PlannerClient) {
    this.client = client;
  }

  /**
   * Set default plan for task creation
   */
  setDefaultPlan(planId: string, bucketId?: string): void {
    this.defaultPlanId = planId;
    this.defaultBucketId = bucketId ?? null;
  }

  /**
   * Convert action item to Planner task request
   */
  private actionItemToTaskRequest(
    item: ActionItem,
    planId: string,
    bucketId?: string,
    assigneeUserId?: string
  ): CreatePlannerTaskRequest {
    const request: CreatePlannerTaskRequest = {
      title: item.title,
      planId,
      bucketId,
      priority: item.priority ? PRIORITY_MAP[item.priority] : 5,
    };

    if (item.dueDate) {
      request.dueDateTime = new Date(item.dueDate).toISOString();
    }

    if (assigneeUserId) {
      request.assignments = {
        [assigneeUserId]: {
          orderHint: ' !',
        },
      };
    }

    return request;
  }

  /**
   * Build task description with meeting context
   */
  private buildTaskDescription(item: ActionItem): string {
    const lines: string[] = [];
    
    if (item.minuteTitle) {
      lines.push(`**From Meeting:** ${item.minuteTitle}`);
    }
    if (item.meetingDate) {
      lines.push(`**Meeting Date:** ${new Date(item.meetingDate).toLocaleDateString()}`);
    }
    if (item.assignee) {
      lines.push(`**Assigned To:** ${item.assignee}`);
    }
    
    lines.push('');
    lines.push('---');
    lines.push('*This task was created from meeting action items.*');
    
    return lines.join('\n');
  }

  /**
   * Sync a single action item to Planner
   */
  async syncActionItem(
    item: ActionItem,
    options: {
      planId?: string;
      bucketId?: string;
      assigneeUserId?: string;
    } = {}
  ): Promise<LinkedPlannerTask> {
    const planId = options.planId ?? this.defaultPlanId;
    if (!planId) {
      throw new Error('No plan ID specified. Set a default plan or provide planId in options.');
    }

    const existingLink = getLinkedTask(item.id);

    try {
      if (existingLink && existingLink.syncStatus !== 'error') {
        // Update existing task
        const task = await this.client.getTask(existingLink.plannerTaskId);
        const etag = task['@odata.etag']!;

        const update: UpdatePlannerTaskRequest = {
          title: item.title,
          priority: item.priority ? PRIORITY_MAP[item.priority] : undefined,
          percentComplete: item.isCompleted ? 100 : 0,
        };

        if (item.dueDate) {
          update.dueDateTime = new Date(item.dueDate).toISOString();
        }

        const updatedTask = await this.client.updateTask(
          existingLink.plannerTaskId,
          update,
          etag
        );

        const linkedTask: LinkedPlannerTask = {
          ...existingLink,
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'synced',
          errorMessage: undefined,
          taskSnapshot: updatedTask,
        };

        upsertLinkedTask(linkedTask);
        return linkedTask;
      } else {
        // Create new task
        const taskRequest = this.actionItemToTaskRequest(
          item,
          planId,
          options.bucketId ?? this.defaultBucketId ?? undefined,
          options.assigneeUserId
        );

        const createdTask = await this.client.createTask(taskRequest);

        // Add description with meeting context
        if (item.minuteTitle || item.meetingDate) {
          const details = await this.client.getTaskDetails(createdTask.id);
          const detailsEtag = details['@odata.etag']!;
          await this.client.updateTaskDetails(
            createdTask.id,
            { description: this.buildTaskDescription(item) },
            detailsEtag
          );
        }

        const linkedTask: LinkedPlannerTask = {
          id: uuidv4(),
          actionItemId: item.id,
          minuteId: item.minuteId,
          plannerTaskId: createdTask.id,
          planId,
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'synced',
          taskSnapshot: createdTask,
        };

        upsertLinkedTask(linkedTask);
        return linkedTask;
      }
    } catch (error) {
      const apiError = error as PlannerApiError;
      const linkedTask: LinkedPlannerTask = {
        id: existingLink?.id ?? uuidv4(),
        actionItemId: item.id,
        minuteId: item.minuteId,
        plannerTaskId: existingLink?.plannerTaskId ?? '',
        planId,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'error',
        errorMessage: apiError.message || 'Unknown error during sync',
        taskSnapshot: existingLink?.taskSnapshot,
      };

      upsertLinkedTask(linkedTask);
      throw error;
    }
  }

  /**
   * Sync multiple action items to Planner
   */
  async syncActionItems(
    items: ActionItem[],
    options: SyncOptions & {
      planId?: string;
      bucketId?: string;
    } = {
      direction: 'toPlanner',
      autoResolveConflicts: true,
      conflictStrategy: 'useLocal',
      includeCompleted: true,
    }
  ): Promise<PlannerSyncResult> {
    const result: PlannerSyncResult = {
      synced: [],
      failed: [],
      conflicts: [],
    };

    const itemsToSync = options.includeCompleted
      ? items
      : items.filter(i => !i.isCompleted);

    for (const item of itemsToSync) {
      try {
        // Check for conflicts if bidirectional
        if (options.direction === 'bidirectional' || options.direction === 'fromPlanner') {
          const existingLink = getLinkedTask(item.id);
          if (existingLink && existingLink.plannerTaskId) {
            const plannerTask = await this.client.getTask(existingLink.plannerTaskId);
            
            // Check if Planner task was modified after our last sync
            const plannerModified = new Date(plannerTask.createdDateTime) > 
              new Date(existingLink.lastSyncedAt);
            
            if (plannerModified && !options.autoResolveConflicts) {
              result.conflicts.push({
                actionItem: item,
                linkedTask: existingLink,
                plannerTask,
              });
              continue;
            }
          }
        }

        const linkedTask = await this.syncActionItem(item, {
          planId: options.planId,
          bucketId: options.bucketId,
        });
        result.synced.push(linkedTask);
      } catch (error) {
        result.failed.push({
          actionItem: item,
          error: (error as Error).message || 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Sync from Planner to action items (reverse sync)
   */
  async syncFromPlanner(
    linkedTasks: LinkedPlannerTask[]
  ): Promise<{
    updated: Array<{ linkedTask: LinkedPlannerTask; plannerTask: PlannerTask }>;
    deleted: LinkedPlannerTask[];
    unchanged: LinkedPlannerTask[];
  }> {
    const result = {
      updated: [] as Array<{ linkedTask: LinkedPlannerTask; plannerTask: PlannerTask }>,
      deleted: [] as LinkedPlannerTask[],
      unchanged: [] as LinkedPlannerTask[],
    };

    for (const link of linkedTasks) {
      try {
        const plannerTask = await this.client.getTask(link.plannerTaskId);
        
        // Check if task was modified
        const wasModified = 
          plannerTask.title !== link.taskSnapshot?.title ||
          plannerTask.percentComplete !== link.taskSnapshot?.percentComplete ||
          plannerTask.priority !== link.taskSnapshot?.priority ||
          plannerTask.dueDateTime !== link.taskSnapshot?.dueDateTime;

        if (wasModified) {
          const updatedLink: LinkedPlannerTask = {
            ...link,
            lastSyncedAt: new Date().toISOString(),
            syncStatus: 'synced',
            taskSnapshot: plannerTask,
          };
          upsertLinkedTask(updatedLink);
          result.updated.push({ linkedTask: updatedLink, plannerTask });
        } else {
          result.unchanged.push(link);
        }
      } catch (error) {
        const apiError = error as PlannerApiError;
        if (apiError.statusCode === 404) {
          // Task was deleted in Planner
          removeLinkedTask(link.actionItemId);
          result.deleted.push(link);
        }
      }
    }

    return result;
  }

  /**
   * Convert Planner task back to action item format
   */
  plannerTaskToActionItem(
    task: PlannerTask,
    link: LinkedPlannerTask
  ): Partial<ActionItem> {
    return {
      id: link.actionItemId,
      title: task.title,
      isCompleted: task.percentComplete === 100,
      priority: REVERSE_PRIORITY_MAP[task.priority] || 'medium',
      dueDate: task.dueDateTime,
      minuteId: link.minuteId,
    };
  }

  /**
   * Unlink an action item from Planner (does not delete the Planner task)
   */
  async unlinkActionItem(actionItemId: string): Promise<void> {
    removeLinkedTask(actionItemId);
  }

  /**
   * Unlink and delete the Planner task
   */
  async deleteLinkedTask(actionItemId: string): Promise<void> {
    const link = getLinkedTask(actionItemId);
    if (link && link.plannerTaskId) {
      const task = await this.client.getTask(link.plannerTaskId);
      const etag = task['@odata.etag']!;
      await this.client.deleteTask(link.plannerTaskId, etag);
    }
    removeLinkedTask(actionItemId);
  }

  /**
   * Get sync status for a minute
   */
  getMinuteSyncStatus(minuteId: string): {
    total: number;
    synced: number;
    pending: number;
    errors: number;
    conflicts: number;
  } {
    const links = getLinkedTasksForMinute(minuteId);
    return {
      total: links.length,
      synced: links.filter(l => l.syncStatus === 'synced').length,
      pending: links.filter(l => l.syncStatus === 'pending').length,
      errors: links.filter(l => l.syncStatus === 'error').length,
      conflicts: links.filter(l => l.syncStatus === 'conflict').length,
    };
  }
}

// ============================================================================
// Factory
// ============================================================================

let syncServiceInstance: PlannerSyncService | null = null;

/**
 * Get or create the sync service singleton
 */
export function getPlannerSyncService(client: PlannerClient): PlannerSyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new PlannerSyncService(client);
  }
  return syncServiceInstance;
}

/**
 * Reset the sync service (useful for testing or logout)
 */
export function resetPlannerSyncService(): void {
  syncServiceInstance = null;
}
