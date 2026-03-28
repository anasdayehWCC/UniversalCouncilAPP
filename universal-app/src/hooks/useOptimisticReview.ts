'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/Toast';
import { useDemo } from '@/context/DemoContext';
import { useOptimistic } from './useOptimistic';
import { useOptimisticMutation } from './useOptimisticMutation';
import {
  ReviewItem,
  ReviewStatus,
  ReviewDecision,
  ReviewFeedback,
  FeedbackType,
} from '@/lib/review/types';
import {
  applyOptimisticUpdates,
  applyOptimisticUpdate,
  generateOptimisticId,
} from '@/lib/optimistic';

// ============================================================================
// Types
// ============================================================================

interface ReviewDecisionPayload {
  itemId: string;
  decision: ReviewDecision;
  feedback?: string;
}

interface AddFeedbackPayload {
  itemId: string;
  comment: string;
  section?: string;
  type: FeedbackType;
}

interface ResolveFeedbackPayload {
  itemId: string;
  feedbackId: string;
  resolution?: string;
}

interface BulkActionPayload {
  itemIds: string[];
  action: 'approve' | 'request_changes' | 'assign' | 'prioritize';
  data?: Record<string, unknown>;
}

interface UseOptimisticReviewOptions {
  /** Filter to specific reviewer */
  reviewerId?: string;
  /** Auto-refresh interval */
  refreshInterval?: number;
}

interface UseOptimisticReviewReturn {
  /** Apply optimistic updates to review items */
  withOptimisticUpdates: (items: ReviewItem[]) => ReviewItem[];
  /** Apply optimistic update to single item */
  withOptimisticUpdate: (item: ReviewItem | undefined) => ReviewItem | undefined;
  
  // Decision operations
  makeDecision: ReturnType<typeof useOptimisticMutation<ReviewItem, ReviewDecisionPayload>>;
  approveItem: (itemId: string, feedback?: string) => void;
  requestChanges: (itemId: string, feedback: string) => void;
  
  // Feedback operations
  addFeedback: ReturnType<typeof useOptimisticMutation<ReviewFeedback, AddFeedbackPayload>>;
  resolveFeedback: ReturnType<typeof useOptimisticMutation<ReviewFeedback, ResolveFeedbackPayload>>;
  deleteFeedback: ReturnType<typeof useOptimisticMutation<{ id?: string }, { itemId: string; feedbackId: string }>>;
  
  // Bulk operations
  bulkAction: ReturnType<typeof useOptimisticMutation<ReviewItem[], BulkActionPayload>>;
  bulkApprove: (itemIds: string[]) => void;
  
  // Status operations
  startReview: (itemId: string) => void;
  pauseReview: (itemId: string) => void;
  
  // State
  hasPendingChanges: boolean;
  pendingCount: number;
  isSyncing: boolean;
}

// ============================================================================
// API Stubs
// ============================================================================

const reviewApi = {
  makeDecision: async (payload: ReviewDecisionPayload): Promise<ReviewItem> => {
    const response = await fetch(`/api/review/${payload.itemId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to submit decision');
    return response.json();
  },
  
  addFeedback: async (payload: AddFeedbackPayload): Promise<ReviewFeedback> => {
    const response = await fetch(`/api/review/${payload.itemId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to add feedback');
    return response.json();
  },
  
  resolveFeedback: async (payload: ResolveFeedbackPayload): Promise<ReviewFeedback> => {
    const response = await fetch(`/api/review/${payload.itemId}/feedback/${payload.feedbackId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution: payload.resolution }),
    });
    if (!response.ok) throw new Error('Failed to resolve feedback');
    return response.json();
  },
  
  deleteFeedback: async (itemId: string, feedbackId: string): Promise<void> => {
    const response = await fetch(`/api/review/${itemId}/feedback/${feedbackId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete feedback');
  },
  
  bulkAction: async (payload: BulkActionPayload): Promise<ReviewItem[]> => {
    const response = await fetch('/api/review/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to perform bulk action');
    return response.json();
  },
  
  updateStatus: async (itemId: string, status: ReviewStatus): Promise<ReviewItem> => {
    const response = await fetch(`/api/review/${itemId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update status');
    return response.json();
  },
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useOptimisticReview(
  options: UseOptimisticReviewOptions = {}
): UseOptimisticReviewReturn {
  const { reviewerId: _reviewerId } = options;
  
  const queryClient = useQueryClient();
  const toast = useToast();
  // DemoContext is always active when useDemo() is called
  useDemo();
  const demoMode = true;
  
  // Core optimistic state for review items
  const optimistic = useOptimistic<ReviewItem>({
    entityType: 'review-item',
    onRollback: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
    },
    mergeConfig: {
      strategy: 'shallow_merge',
      serverOnlyFields: ['createdAt', 'submittedAt'],
    },
  });

  // Apply optimistic updates to list
  const withOptimisticUpdates = useCallback(
    (items: ReviewItem[]): ReviewItem[] => {
      return applyOptimisticUpdates(items, 'review-item');
    },
    []
  );

  // Apply optimistic update to single item
  const withOptimisticUpdate = useCallback(
    (item: ReviewItem | undefined): ReviewItem | undefined => {
      if (!item) return undefined;
      return applyOptimisticUpdate(item, 'review-item', item.id);
    },
    []
  );

  // Make decision mutation
  const makeDecision = useOptimisticMutation<ReviewItem, ReviewDecisionPayload>({
    mutationFn: demoMode
      ? async (payload) => {
          // Demo mode: simulate API call
          await new Promise((resolve) => setTimeout(resolve, 500));
          return {
            id: payload.itemId,
            status: payload.decision === 'approve' ? 'approved' : 'changes_requested',
          } as ReviewItem;
        }
      : reviewApi.makeDecision,
    getOptimisticData: (variables) => ({
      id: variables.itemId,
      status: variables.decision === 'approve' 
        ? 'approved' as ReviewStatus
        : 'changes_requested' as ReviewStatus,
      reviewedAt: new Date().toISOString(),
    } as unknown as ReviewItem),
    entityType: 'review-item',
    getEntityId: (variables) => variables.itemId,
    onSuccess: (_, variables) => {
      const action = variables.decision === 'approve' ? 'approved' : 'sent back';
      toast.success(`Item ${action}`);
    },
    invalidateQueries: [['review-queue'], ['minutes']],
  });

  // Convenience methods for decisions
  const approveItem = useCallback(
    (itemId: string, feedback?: string) => {
      makeDecision.mutate({ itemId, decision: 'approve', feedback });
    },
    [makeDecision]
  );

  const requestChanges = useCallback(
    (itemId: string, feedback: string) => {
      makeDecision.mutate({ itemId, decision: 'request_changes', feedback });
    },
    [makeDecision]
  );

  // Add feedback mutation
  const addFeedback = useOptimisticMutation<ReviewFeedback, AddFeedbackPayload>({
    mutationFn: demoMode
      ? async (payload) => {
          await new Promise((resolve) => setTimeout(resolve, 300));
          return {
            id: generateOptimisticId('feedback'),
            reviewItemId: payload.itemId,
            comment: payload.comment,
            section: payload.section,
            type: payload.type,
            resolved: false,
            createdAt: new Date().toISOString(),
            authorId: 'current-user',
            authorName: 'You',
            replies: [],
          };
        }
      : reviewApi.addFeedback,
    getOptimisticData: (variables) => ({
      id: generateOptimisticId('feedback'),
      reviewItemId: variables.itemId,
      comment: variables.comment,
      section: variables.section,
      type: variables.type,
      resolved: false,
      createdAt: new Date().toISOString(),
      authorId: 'current-user',
      authorName: 'You',
      replies: [],
    }),
    entityType: 'review-feedback',
    onSuccess: () => {
      toast.success('Feedback added');
    },
    invalidateQueries: [['review-queue'], ['review-item']],
  });

  // Resolve feedback mutation
  const resolveFeedback = useOptimisticMutation<ReviewFeedback, ResolveFeedbackPayload>({
    mutationFn: demoMode
      ? async (payload) => {
          await new Promise((resolve) => setTimeout(resolve, 300));
          return {
            id: payload.feedbackId,
            reviewItemId: payload.itemId,
            resolved: true,
            resolvedAt: new Date().toISOString(),
          } as ReviewFeedback;
        }
      : reviewApi.resolveFeedback,
    getOptimisticData: (variables) => ({
      id: variables.feedbackId,
      reviewItemId: variables.itemId,
      resolved: true,
      resolvedAt: new Date().toISOString(),
    } as ReviewFeedback),
    entityType: 'review-feedback',
    getEntityId: (variables) => variables.feedbackId,
    onSuccess: () => {
      toast.success('Feedback resolved');
    },
    invalidateQueries: [['review-queue'], ['review-item']],
  });

  // Delete feedback mutation
  const deleteFeedback = useOptimisticMutation<{ id?: string }, { itemId: string; feedbackId: string }>({
    mutationFn: async ({ itemId, feedbackId }) => {
      await reviewApi.deleteFeedback(itemId, feedbackId);
      return { id: feedbackId };
    },
    getOptimisticData: (variables) => ({ id: variables.feedbackId }),
    entityType: 'review-feedback',
    getEntityId: (variables) => variables.feedbackId,
    onSuccess: () => {
      toast.success('Feedback deleted');
    },
    invalidateQueries: [['review-queue'], ['review-item']],
  });

  // Bulk action mutation
  const bulkAction = useOptimisticMutation<ReviewItem[], BulkActionPayload>({
    mutationFn: demoMode
      ? async (payload) => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return payload.itemIds.map((id) => ({
            id,
            status: payload.action === 'approve' ? 'approved' : 'pending',
          })) as ReviewItem[];
        }
      : reviewApi.bulkAction,
    getOptimisticData: (variables) => {
      const newStatus: ReviewStatus = 
        variables.action === 'approve' ? 'approved' : 
        variables.action === 'request_changes' ? 'changes_requested' : 
        'pending';
      
      return variables.itemIds.map((id: string) => ({
        id,
        status: newStatus,
        reviewedAt: new Date().toISOString(),
      })) as unknown as ReviewItem[];
    },
    entityType: 'review-item',
    onSuccess: (_, variables) => {
      toast.success(`${variables.itemIds.length} items updated`);
    },
    invalidateQueries: [['review-queue'], ['minutes']],
  });

  // Convenience method for bulk approve
  const bulkApprove = useCallback(
    (itemIds: string[]) => {
      bulkAction.mutate({ itemIds, action: 'approve' });
    },
    [bulkAction]
  );

  // Status change helpers
  const startReview = useCallback(
    (itemId: string) => {
      if (demoMode) {
        toast.info('Review started');
        return;
      }
      reviewApi.updateStatus(itemId, 'in_review').then(() => {
        queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      });
    },
    [demoMode, queryClient, toast]
  );

  const pauseReview = useCallback(
    (itemId: string) => {
      if (demoMode) {
        toast.info('Review paused');
        return;
      }
      reviewApi.updateStatus(itemId, 'pending').then(() => {
        queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      });
    },
    [demoMode, queryClient, toast]
  );

  // Computed state
  const hasPendingChanges = optimistic.pending.length > 0;
  const pendingCount = optimistic.pending.length;
  const isSyncing = optimistic.isSyncing;

  return {
    withOptimisticUpdates,
    withOptimisticUpdate,
    makeDecision,
    approveItem,
    requestChanges,
    addFeedback,
    resolveFeedback,
    deleteFeedback,
    bulkAction,
    bulkApprove,
    startReview,
    pauseReview,
    hasPendingChanges,
    pendingCount,
    isSyncing,
  };
}

export default useOptimisticReview;
