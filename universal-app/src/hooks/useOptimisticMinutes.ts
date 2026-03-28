'use client';

import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/Toast';
import { useOptimistic } from './useOptimistic';
import { useOptimisticMutation } from './useOptimisticMutation';
import {
  Minute,
  MinuteSection,
  ActionItem,
  MinuteStatus,
} from '@/lib/minutes/types';
import {
  applyOptimisticUpdates,
  applyOptimisticUpdate,
  generateOptimisticId,
  isOptimisticId,
} from '@/lib/optimistic';

// ============================================================================
// Types
// ============================================================================

interface MinuteUpdate extends Partial<Minute> {
  id: string;
}

interface SectionUpdate extends Partial<MinuteSection> {
  id: string;
  minuteId: string;
}

interface ActionItemUpdate extends Partial<ActionItem> {
  id: string;
  minuteId: string;
}

interface UseOptimisticMinutesOptions {
  /** Current minute being edited */
  minute?: Minute;
  /** Callback when minute changes */
  onMinuteChange?: (minute: Minute) => void;
  /** Enable auto-save on changes */
  autoSave?: boolean;
  /** Auto-save debounce interval (ms) */
  autoSaveInterval?: number;
}

interface UseOptimisticMinutesReturn {
  /** Apply optimistic updates to server data */
  withOptimisticUpdates: (minutes: Minute[]) => Minute[];
  /** Apply optimistic update to single minute */
  withOptimisticUpdate: (minute: Minute | undefined) => Minute | undefined;
  
  // Minute CRUD
  updateMinute: ReturnType<typeof useOptimisticMutation<Minute, MinuteUpdate>>;
  createMinute: ReturnType<typeof useOptimisticMutation<Minute, Partial<Minute>>>;
  deleteMinute: ReturnType<typeof useOptimisticMutation<{ id?: string }, string>>;
  
  // Section operations
  updateSection: ReturnType<typeof useOptimisticMutation<MinuteSection, SectionUpdate>>;
  addSection: ReturnType<typeof useOptimisticMutation<MinuteSection, Omit<MinuteSection, 'id'> & { minuteId: string }>>;
  deleteSection: ReturnType<typeof useOptimisticMutation<{ id?: string }, { minuteId: string; sectionId: string }>>;
  
  // Action item operations
  updateActionItem: ReturnType<typeof useOptimisticMutation<ActionItem, ActionItemUpdate>>;
  addActionItem: ReturnType<typeof useOptimisticMutation<ActionItem, Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'> & { minuteId: string }>>;
  deleteActionItem: ReturnType<typeof useOptimisticMutation<{ id?: string }, { minuteId: string; actionItemId: string }>>;
  
  // Workflow operations
  submitForReview: ReturnType<typeof useOptimisticMutation<Minute, string>>;
  approve: ReturnType<typeof useOptimisticMutation<Minute, string>>;
  requestChanges: ReturnType<typeof useOptimisticMutation<Minute, { minuteId: string; reason: string }>>;
  publish: ReturnType<typeof useOptimisticMutation<Minute, string>>;
  
  // State
  hasPendingChanges: boolean;
  pendingCount: number;
  isSyncing: boolean;
}

// ============================================================================
// API Stubs (would be replaced with actual API calls)
// ============================================================================

// These would be replaced with actual API client calls
const minuteApi = {
  update: async (data: MinuteUpdate): Promise<Minute> => {
    const response = await fetch(`/api/minutes/${data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update minute');
    return response.json();
  },
  
  create: async (data: Partial<Minute>): Promise<Minute> => {
    const response = await fetch('/api/minutes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create minute');
    return response.json();
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/minutes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete minute');
  },
  
  updateSection: async (data: SectionUpdate): Promise<MinuteSection> => {
    const response = await fetch(`/api/minutes/${data.minuteId}/sections/${data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update section');
    return response.json();
  },
  
  addSection: async (data: Omit<MinuteSection, 'id'> & { minuteId: string }): Promise<MinuteSection> => {
    const response = await fetch(`/api/minutes/${data.minuteId}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add section');
    return response.json();
  },
  
  deleteSection: async (minuteId: string, sectionId: string): Promise<void> => {
    const response = await fetch(`/api/minutes/${minuteId}/sections/${sectionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete section');
  },
  
  submitForReview: async (id: string): Promise<Minute> => {
    const response = await fetch(`/api/minutes/${id}/submit`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to submit for review');
    return response.json();
  },
  
  approve: async (id: string): Promise<Minute> => {
    const response = await fetch(`/api/minutes/${id}/approve`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to approve');
    return response.json();
  },
  
  requestChanges: async (id: string, reason: string): Promise<Minute> => {
    const response = await fetch(`/api/minutes/${id}/request-changes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to request changes');
    return response.json();
  },
  
  publish: async (id: string): Promise<Minute> => {
    const response = await fetch(`/api/minutes/${id}/publish`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to publish');
    return response.json();
  },
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useOptimisticMinutes(
  options: UseOptimisticMinutesOptions = {}
): UseOptimisticMinutesReturn {
  const { minute: currentMinute, onMinuteChange } = options;
  
  const queryClient = useQueryClient();
  const toast = useToast();
  
  // Core optimistic state for minutes
  const optimistic = useOptimistic<Minute>({
    entityType: 'minute',
    onRollback: (update) => {
      // Restore previous data
      if (update.previousData && onMinuteChange) {
        onMinuteChange(update.previousData);
      }
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['minutes'] });
    },
    onConfirm: (_update, serverData) => {
      // Update with server data
      if (onMinuteChange) {
        onMinuteChange(serverData);
      }
    },
    mergeConfig: {
      strategy: 'deep_merge',
      serverOnlyFields: ['createdAt', 'updatedAt', 'version'],
    },
  });

  // Apply optimistic updates to list
  const withOptimisticUpdates = useCallback(
    (minutes: Minute[]): Minute[] => {
      return applyOptimisticUpdates(minutes, 'minute');
    },
    []
  );

  // Apply optimistic update to single minute
  const withOptimisticUpdate = useCallback(
    (minute: Minute | undefined): Minute | undefined => {
      if (!minute) return undefined;
      return applyOptimisticUpdate(minute, 'minute', minute.id);
    },
    []
  );

  // Update minute mutation
  const updateMinute = useOptimisticMutation<Minute, MinuteUpdate>({
    mutationFn: minuteApi.update,
    getOptimisticData: (variables) => ({
      ...(currentMinute || {} as Minute),
      ...variables,
      updatedAt: new Date().toISOString(),
    }),
    getPreviousData: () => currentMinute,
    entityType: 'minute',
    getEntityId: (variables) => variables.id,
    onSuccess: (data) => {
      toast.success('Minute saved');
      onMinuteChange?.(data);
    },
    invalidateQueries: [['minutes'], ['minute']],
  });

  // Create minute mutation
  const createMinute = useOptimisticMutation<Minute, Partial<Minute>>({
    mutationFn: minuteApi.create,
    getOptimisticData: (variables) => ({
      id: generateOptimisticId('minute'),
      status: 'draft' as MinuteStatus,
      sections: [],
      actionItems: [],
      attendees: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...variables,
    } as Minute),
    entityType: 'minute',
    onSuccess: (data) => {
      toast.success('Minute created');
      onMinuteChange?.(data);
    },
    invalidateQueries: [['minutes']],
  });

  // Delete minute mutation
  const deleteMinute = useOptimisticMutation<{ id?: string }, string>({
    mutationFn: async (id) => {
      await minuteApi.delete(id);
      return { id };
    },
    getOptimisticData: (id) => ({ id }),
    getPreviousData: () => ({ id: currentMinute?.id }),
    entityType: 'minute',
    getEntityId: (id) => id,
    onSuccess: () => {
      toast.success('Minute deleted');
    },
    invalidateQueries: [['minutes']],
  });

  // Section update mutation
  const updateSection = useOptimisticMutation<MinuteSection, SectionUpdate>({
    mutationFn: minuteApi.updateSection,
    getOptimisticData: (variables) => {
      const existingSection = currentMinute?.sections?.find((s) => s.id === variables.id);
      return {
        ...(existingSection || {} as MinuteSection),
        ...variables,
      };
    },
    getPreviousData: () => {
      return currentMinute?.sections?.find((s) => s.id === currentMinute.id);
    },
    entityType: 'minute-section',
    getEntityId: (variables) => variables.id,
    invalidateQueries: [['minute']],
  });

  // Add section mutation
  const addSection = useOptimisticMutation<MinuteSection, Omit<MinuteSection, 'id'> & { minuteId: string }>({
    mutationFn: minuteApi.addSection,
    getOptimisticData: (variables) => ({
      ...variables,
      id: generateOptimisticId('section'),
    } as MinuteSection),
    entityType: 'minute-section',
    onSuccess: () => {
      toast.success('Section added');
    },
    invalidateQueries: [['minute']],
  });

  // Delete section mutation
  const deleteSection = useOptimisticMutation<{ id?: string }, { minuteId: string; sectionId: string }>({
    mutationFn: async ({ minuteId, sectionId }) => {
      await minuteApi.deleteSection(minuteId, sectionId);
      return { id: sectionId };
    },
    getOptimisticData: (variables) => ({ id: variables.sectionId }),
    getPreviousData: () => ({ id: currentMinute?.sections?.find((s) => isOptimisticId(s.id))?.id }),
    entityType: 'minute-section',
    getEntityId: (variables) => variables.sectionId,
    onSuccess: () => {
      toast.success('Section deleted');
    },
    invalidateQueries: [['minute']],
  });

  // Action item mutations (similar pattern)
  const updateActionItem = useOptimisticMutation<ActionItem, ActionItemUpdate>({
    mutationFn: async (variables) => {
      const response = await fetch(`/api/minutes/${variables.minuteId}/actions/${variables.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variables),
      });
      if (!response.ok) throw new Error('Failed to update action item');
      return response.json();
    },
    getOptimisticData: (variables) => {
      const existing = currentMinute?.actionItems?.find((a) => a.id === variables.id);
      return {
        ...(existing || {} as ActionItem),
        ...variables,
        updatedAt: new Date().toISOString(),
      };
    },
    entityType: 'action-item',
    getEntityId: (variables) => variables.id,
    invalidateQueries: [['minute']],
  });

  const addActionItem = useOptimisticMutation<ActionItem, Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'> & { minuteId: string }>({
    mutationFn: async (variables) => {
      const response = await fetch(`/api/minutes/${variables.minuteId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variables),
      });
      if (!response.ok) throw new Error('Failed to add action item');
      return response.json();
    },
    getOptimisticData: (variables) => ({
      ...variables,
      id: generateOptimisticId('action'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as ActionItem),
    entityType: 'action-item',
    onSuccess: () => {
      toast.success('Action item added');
    },
    invalidateQueries: [['minute']],
  });

  const deleteActionItem = useOptimisticMutation<{ id?: string }, { minuteId: string; actionItemId: string }>({
    mutationFn: async ({ minuteId, actionItemId }) => {
      const response = await fetch(`/api/minutes/${minuteId}/actions/${actionItemId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete action item');
      return { id: actionItemId };
    },
    getOptimisticData: (variables) => ({ id: variables.actionItemId }),
    entityType: 'action-item',
    getEntityId: (variables) => variables.actionItemId,
    onSuccess: () => {
      toast.success('Action item deleted');
    },
    invalidateQueries: [['minute']],
  });

  // Workflow mutations
  const submitForReview = useOptimisticMutation<Minute, string>({
    mutationFn: minuteApi.submitForReview,
    getOptimisticData: () => ({
      ...(currentMinute || {} as Minute),
      status: 'pending_review' as MinuteStatus,
      updatedAt: new Date().toISOString(),
    }),
    getPreviousData: () => currentMinute,
    entityType: 'minute',
    getEntityId: (id) => id,
    onSuccess: () => {
      toast.success('Submitted for review');
    },
    invalidateQueries: [['minutes'], ['minute'], ['review-queue']],
  });

  const approve = useOptimisticMutation<Minute, string>({
    mutationFn: minuteApi.approve,
    getOptimisticData: () => ({
      ...(currentMinute || {} as Minute),
      status: 'approved' as MinuteStatus,
      updatedAt: new Date().toISOString(),
    }),
    getPreviousData: () => currentMinute,
    entityType: 'minute',
    getEntityId: (id) => id,
    onSuccess: () => {
      toast.success('Minute approved');
    },
    invalidateQueries: [['minutes'], ['minute'], ['review-queue']],
  });

  const requestChanges = useOptimisticMutation<Minute, { minuteId: string; reason: string }>({
    mutationFn: ({ minuteId, reason }) => minuteApi.requestChanges(minuteId, reason),
    getOptimisticData: () => ({
      ...(currentMinute || {} as Minute),
      status: 'draft' as MinuteStatus,
      updatedAt: new Date().toISOString(),
    }),
    getPreviousData: () => currentMinute,
    entityType: 'minute',
    getEntityId: (variables) => variables.minuteId,
    onSuccess: () => {
      toast.info('Changes requested');
    },
    invalidateQueries: [['minutes'], ['minute'], ['review-queue']],
  });

  const publish = useOptimisticMutation<Minute, string>({
    mutationFn: minuteApi.publish,
    getOptimisticData: () => ({
      ...(currentMinute || {} as Minute),
      status: 'published' as MinuteStatus,
      updatedAt: new Date().toISOString(),
    }),
    getPreviousData: () => currentMinute,
    entityType: 'minute',
    getEntityId: (id) => id,
    onSuccess: () => {
      toast.success('Minute published');
    },
    invalidateQueries: [['minutes'], ['minute']],
  });

  // Computed state
  const hasPendingChanges = optimistic.pending.length > 0;
  const pendingCount = optimistic.pending.length;
  const isSyncing = optimistic.isSyncing;

  return {
    withOptimisticUpdates,
    withOptimisticUpdate,
    updateMinute,
    createMinute,
    deleteMinute,
    updateSection,
    addSection,
    deleteSection,
    updateActionItem,
    addActionItem,
    deleteActionItem,
    submitForReview,
    approve,
    requestChanges,
    publish,
    hasPendingChanges,
    pendingCount,
    isSyncing,
  };
}

export default useOptimisticMinutes;
