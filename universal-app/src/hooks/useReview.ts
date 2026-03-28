'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDemo } from '@/context/DemoContext';
import {
  ReviewItem,
  ReviewFilter,
  ReviewStats,
  ReviewFeedback,
  ReviewStatus,
  ReviewDecision,
  ReviewPriority,
  DEFAULT_FILTER,
  meetingStatusToReviewStatus,
  calculatePriority,
  isOverdue,
  FeedbackType,
  FeedbackReply,
} from '@/lib/review/types';
import { Meeting } from '@/types/demo';
import { PENDING_REVIEW_STATUSES } from '@/config/constants';

// ─────────────────────────────────────────────────────────────
// Mock feedback data (would come from API in production)
// ─────────────────────────────────────────────────────────────

const MOCK_FEEDBACK: ReviewFeedback[] = [
  {
    id: 'fb-1',
    reviewItemId: 'sarah-m1',
    authorId: 'marcus',
    authorName: 'Marcus Williams',
    comment: 'Please add more detail about the safeguarding concerns raised during the visit.',
    section: 'Safeguarding',
    type: 'required',
    resolved: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    replies: [],
  },
  {
    id: 'fb-2',
    reviewItemId: 'sarah-m1',
    authorId: 'marcus',
    authorName: 'Marcus Williams',
    comment: 'Excellent documentation of the family context. This is exactly what we need.',
    section: 'Family Context',
    type: 'praising',
    resolved: true,
    resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    replies: [],
  },
];

// ─────────────────────────────────────────────────────────────
// useReview Hook
// ─────────────────────────────────────────────────────────────

export interface UseReviewOptions {
  initialFilter?: ReviewFilter;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseReviewReturn {
  // Queue state
  items: ReviewItem[];
  filteredItems: ReviewItem[];
  selectedIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  
  // Current filter and sort
  filter: ReviewFilter;
  sortBy: 'submittedAt' | 'priority' | 'author' | 'slaDeadline';
  sortOrder: 'asc' | 'desc';
  
  // Statistics
  stats: ReviewStats;
  
  // Feedback
  feedbackByItem: Map<string, ReviewFeedback[]>;

  // Actions
  setFilter: (filter: ReviewFilter) => void;
  setSortBy: (sortBy: 'submittedAt' | 'priority' | 'author' | 'slaDeadline') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Review actions
  submitReview: (itemId: string, decision: ReviewDecision, comment?: string) => Promise<void>;
  bulkReview: (decision: ReviewDecision, comment?: string) => Promise<void>;
  startReview: (itemId: string) => void;
  
  // Feedback actions
  addFeedback: (itemId: string, feedback: Omit<ReviewFeedback, 'id' | 'createdAt' | 'replies'>) => void;
  resolveFeedback: (feedbackId: string) => void;
  replyToFeedback: (feedbackId: string, reply: Omit<FeedbackReply, 'id' | 'createdAt'>) => void;
  
  // Refresh
  refresh: () => void;
  
  // Get single item
  getItem: (id: string) => ReviewItem | undefined;
  getFeedback: (itemId: string) => ReviewFeedback[];
}

export function useReview(options: UseReviewOptions = {}): UseReviewReturn {
  const {
    initialFilter = DEFAULT_FILTER,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const { meetings, currentUser, updateMeetingStatus, config } = useDemo();
  
  // State
  const [filter, setFilter] = useState<ReviewFilter>(initialFilter);
  const [sortBy, setSortBy] = useState<'submittedAt' | 'priority' | 'author' | 'slaDeadline'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ReviewFeedback[]>(MOCK_FEEDBACK);

  // Convert meetings to review items
  const items = useMemo<ReviewItem[]>(() => {
    return meetings
      .filter(m => m.domain === currentUser.domain && PENDING_REVIEW_STATUSES.includes(m.status))
      .map((meeting): ReviewItem => {
        const submittedAt = meeting.submittedAt || meeting.uploadedAt || meeting.date;
        const status = meetingStatusToReviewStatus(meeting.status);
        const priority = calculatePriority(meeting, submittedAt);
        
        const itemFeedback = feedback.filter(f => f.reviewItemId === meeting.id);
        const unresolvedCount = itemFeedback.filter(f => !f.resolved).length;

        return {
          id: meeting.id,
          minute: meeting,
          author: {
            id: meeting.submittedById || 'unknown',
            name: meeting.submittedBy || 'Unknown',
            role: 'social_worker',
            team: meeting.domain,
          },
          submittedAt,
          status,
          priority,
          feedbackCount: itemFeedback.length,
          unresolvedCount,
          caseReference: meeting.id,
          wordCount: meeting.summary?.split(' ').length || 0,
        };
      });
  }, [meetings, currentUser.domain, feedback]);

  // Approved items (for stats)
  const approvedItems = useMemo(() => {
    return meetings.filter(m => m.domain === currentUser.domain && m.status === 'approved');
  }, [meetings, currentUser.domain]);

  // Apply filters
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Status filter
    if (filter.status && filter.status.length > 0) {
      result = result.filter(item => filter.status!.includes(item.status));
    }

    // Priority filter
    if (filter.priority && filter.priority.length > 0) {
      result = result.filter(item => filter.priority!.includes(item.priority));
    }

    // Author filter
    if (filter.authorId && filter.authorId.length > 0) {
      result = result.filter(item => filter.authorId!.includes(item.author.id));
    }

    // Domain filter
    if (filter.domain && filter.domain.length > 0) {
      result = result.filter(item => filter.domain!.includes(item.minute.domain));
    }

    // Search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      result = result.filter(item =>
        item.minute.title.toLowerCase().includes(query) ||
        item.author.name.toLowerCase().includes(query) ||
        item.minute.summary?.toLowerCase().includes(query)
      );
    }

    // Date range
    if (filter.dateRange?.from) {
      result = result.filter(item =>
        new Date(item.submittedAt) >= filter.dateRange!.from!
      );
    }
    if (filter.dateRange?.to) {
      result = result.filter(item =>
        new Date(item.submittedAt) <= filter.dateRange!.to!
      );
    }

    // Overdue filter
    if (filter.isOverdue) {
      result = result.filter(item => isOverdue(item.submittedAt));
    }

    // Has unresolved feedback
    if (filter.hasUnresolvedFeedback) {
      result = result.filter(item => item.unresolvedCount > 0);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'submittedAt':
          comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
        case 'priority':
          const priorityOrder: Record<ReviewPriority, number> = {
            urgent: 4,
            high: 3,
            normal: 2,
            low: 1,
          };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'author':
          comparison = a.author.name.localeCompare(b.author.name);
          break;
        case 'slaDeadline':
          comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [items, filter, sortBy, sortOrder]);

  // Build feedback map
  const feedbackByItem = useMemo(() => {
    const map = new Map<string, ReviewFeedback[]>();
    for (const fb of feedback) {
      const existing = map.get(fb.reviewItemId) || [];
      existing.push(fb);
      map.set(fb.reviewItemId, existing);
    }
    return map;
  }, [feedback]);

  // Calculate stats
  const stats = useMemo<ReviewStats>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const approvedToday = approvedItems.filter(
      m => m.lastActionAt && new Date(m.lastActionAt) >= today
    );

    const byAuthor: Record<string, number> = {};
    const byDomain: Record<string, number> = {};

    items.forEach(item => {
      byAuthor[item.author.name] = (byAuthor[item.author.name] || 0) + 1;
      byDomain[item.minute.domain] = (byDomain[item.minute.domain] || 0) + 1;
    });

    return {
      totalPending: items.filter(i => i.status === 'pending').length,
      totalInReview: items.filter(i => i.status === 'in_review').length,
      totalChangesRequested: items.filter(i => i.status === 'changes_requested').length,
      totalApprovedToday: approvedToday.length,
      totalRejectedToday: 0,
      avgReviewTimeMs: 45 * 60 * 1000, // 45 minutes mock
      overdueCount: items.filter(i => isOverdue(i.submittedAt)).length,
      urgentCount: items.filter(i => i.priority === 'urgent').length,
      byAuthor,
      byDomain: byDomain as Record<'children' | 'adults' | 'housing' | 'corporate', number>,
      throughputThisWeek: approvedItems.length,
      throughputLastWeek: Math.floor(approvedItems.length * 0.8),
    };
  }, [items, approvedItems]);

  // Actions
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredItems.map(i => i.id)));
  }, [filteredItems]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const submitReview = useCallback(async (
    itemId: string,
    decision: ReviewDecision,
    comment?: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Map decision to meeting status
      const newStatus = decision === 'approve'
        ? 'approved'
        : decision === 'reject'
        ? 'flagged'
        : 'flagged';

      const action = decision === 'approve' ? 'approved' : 'returned';

      updateMeetingStatus(itemId, newStatus, {
        action,
        by: currentUser.name,
      });

      // Clear from selection
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsLoading(false);
    }
  }, [updateMeetingStatus, currentUser.name]);

  const bulkReview = useCallback(async (
    decision: ReviewDecision,
    comment?: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      for (const id of selectedIds) {
        await submitReview(id, decision, comment);
      }
      clearSelection();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process bulk review');
    } finally {
      setIsLoading(false);
    }
  }, [selectedIds, submitReview, clearSelection]);

  const startReview = useCallback((itemId: string) => {
    // Mark as in review (in real app, this would call API)
    // For demo, we just track locally
    console.log(`Starting review of ${itemId}`);
  }, []);

  const addFeedback = useCallback((
    itemId: string,
    newFeedback: Omit<ReviewFeedback, 'id' | 'createdAt' | 'replies'>
  ) => {
    const feedbackItem: ReviewFeedback = {
      ...newFeedback,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setFeedback(prev => [...prev, feedbackItem]);
  }, []);

  const resolveFeedback = useCallback((feedbackId: string) => {
    setFeedback(prev =>
      prev.map(f =>
        f.id === feedbackId
          ? {
              ...f,
              resolved: true,
              resolvedAt: new Date().toISOString(),
              resolvedBy: currentUser.name,
            }
          : f
      )
    );
  }, [currentUser.name]);

  const replyToFeedback = useCallback((
    feedbackId: string,
    reply: Omit<FeedbackReply, 'id' | 'createdAt'>
  ) => {
    const replyItem: FeedbackReply = {
      ...reply,
      id: `reply-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setFeedback(prev =>
      prev.map(f =>
        f.id === feedbackId
          ? { ...f, replies: [...(f.replies || []), replyItem] }
          : f
      )
    );
  }, []);

  const refresh = useCallback(() => {
    // In real app, this would refetch from API
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const getItem = useCallback((id: string) => {
    return items.find(i => i.id === id);
  }, [items]);

  const getFeedback = useCallback((itemId: string) => {
    return feedbackByItem.get(itemId) || [];
  }, [feedbackByItem]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    items,
    filteredItems,
    selectedIds,
    isLoading,
    error,
    filter,
    sortBy,
    sortOrder,
    stats,
    feedbackByItem,
    setFilter,
    setSortBy,
    setSortOrder,
    toggleSelection,
    selectAll,
    clearSelection,
    submitReview,
    bulkReview,
    startReview,
    addFeedback,
    resolveFeedback,
    replyToFeedback,
    refresh,
    getItem,
    getFeedback,
  };
}
