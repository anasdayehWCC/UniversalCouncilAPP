/**
 * Review Queue Types
 * 
 * Types for the manager review queue system that handles
 * meeting minute approvals, feedback, and quality assurance.
 */

import { ServiceDomain, UserRole } from '@/config/domains';
import { Meeting, MeetingStatus } from '@/types/demo';

// ─────────────────────────────────────────────────────────────
// Review Status
// ─────────────────────────────────────────────────────────────

export type ReviewStatus =
  | 'pending'          // Waiting for manager review
  | 'in_review'        // Currently being reviewed
  | 'changes_requested' // Needs revisions
  | 'approved'         // Signed off by manager
  | 'rejected';        // Rejected entirely

export const REVIEW_STATUS_CONFIG: Record<ReviewStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
}> = {
  pending: {
    label: 'Pending Review',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'Clock',
  },
  in_review: {
    label: 'In Review',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'Eye',
  },
  changes_requested: {
    label: 'Changes Requested',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: 'AlertCircle',
  },
  approved: {
    label: 'Approved',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'CheckCircle2',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'XCircle',
  },
};

// ─────────────────────────────────────────────────────────────
// Review Priority
// ─────────────────────────────────────────────────────────────

export type ReviewPriority = 'low' | 'normal' | 'high' | 'urgent';

export const PRIORITY_CONFIG: Record<ReviewPriority, {
  label: string;
  color: string;
  bg: string;
  ring: string;
}> = {
  low: {
    label: 'Low',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    ring: 'ring-slate-200',
  },
  normal: {
    label: 'Normal',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    ring: 'ring-blue-200',
  },
  high: {
    label: 'High',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    ring: 'ring-orange-200',
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-600',
    bg: 'bg-red-100',
    ring: 'ring-red-200',
  },
};

// ─────────────────────────────────────────────────────────────
// Review Item
// ─────────────────────────────────────────────────────────────

export interface ReviewAuthor {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: UserRole;
  team?: string;
}

export interface ReviewItem {
  id: string;
  minute: Meeting;
  author: ReviewAuthor;
  submittedAt: string;
  status: ReviewStatus;
  priority: ReviewPriority;
  reviewerId?: string;
  reviewerName?: string;
  reviewStartedAt?: string;
  lastUpdatedAt?: string;
  slaDeadline?: string;
  feedbackCount: number;
  unresolvedCount: number;
  caseType?: string;
  caseReference?: string;
  evidenceCount?: number;
  wordCount?: number;
}

// ─────────────────────────────────────────────────────────────
// Review Feedback
// ─────────────────────────────────────────────────────────────

export type FeedbackType = 
  | 'suggestion'  // Optional improvement
  | 'required'    // Must address before approval
  | 'praising'    // Positive feedback
  | 'question';   // Query needing clarification

export const FEEDBACK_TYPE_CONFIG: Record<FeedbackType, {
  label: string;
  color: string;
  bg: string;
  icon: string;
}> = {
  suggestion: {
    label: 'Suggestion',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    icon: 'Lightbulb',
  },
  required: {
    label: 'Required Change',
    color: 'text-red-700',
    bg: 'bg-red-50',
    icon: 'AlertTriangle',
  },
  praising: {
    label: 'Good Practice',
    color: 'text-green-700',
    bg: 'bg-green-50',
    icon: 'ThumbsUp',
  },
  question: {
    label: 'Question',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    icon: 'HelpCircle',
  },
};

export interface ReviewFeedback {
  id: string;
  reviewItemId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  comment: string;
  section?: string; // Section of the minute this references
  lineNumber?: number;
  highlightedText?: string;
  type: FeedbackType;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt?: string;
  replies?: FeedbackReply[];
  mentions?: string[]; // User IDs mentioned with @
}

export interface FeedbackReply {
  id: string;
  feedbackId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  comment: string;
  createdAt: string;
  mentions?: string[];
}

// ─────────────────────────────────────────────────────────────
// Review Filters
// ─────────────────────────────────────────────────────────────

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface ReviewFilter {
  status?: ReviewStatus[];
  priority?: ReviewPriority[];
  authorId?: string[];
  reviewerId?: string[];
  dateRange?: DateRange;
  domain?: ServiceDomain[];
  caseType?: string[];
  searchQuery?: string;
  hasFeedback?: boolean;
  hasUnresolvedFeedback?: boolean;
  isOverdue?: boolean;
}

export const DEFAULT_FILTER: ReviewFilter = {
  status: ['pending', 'in_review'],
};

// ─────────────────────────────────────────────────────────────
// Review Actions
// ─────────────────────────────────────────────────────────────

export type ReviewDecision = 
  | 'approve'
  | 'reject'
  | 'request_changes';

export interface ReviewAction {
  decision: ReviewDecision;
  comment?: string;
  feedbackIds?: string[]; // Any unresolved feedback items
}

export interface BulkReviewAction {
  itemIds: string[];
  decision: ReviewDecision;
  comment?: string;
}

// ─────────────────────────────────────────────────────────────
// Review Statistics
// ─────────────────────────────────────────────────────────────

export interface ReviewStats {
  totalPending: number;
  totalInReview: number;
  totalChangesRequested: number;
  totalApprovedToday: number;
  totalRejectedToday: number;
  avgReviewTimeMs: number;
  overdueCount: number;
  urgentCount: number;
  byAuthor: Record<string, number>;
  byDomain: Record<ServiceDomain, number>;
  throughputThisWeek: number;
  throughputLastWeek: number;
}

// ─────────────────────────────────────────────────────────────
// Review Queue State
// ─────────────────────────────────────────────────────────────

export interface ReviewQueueState {
  items: ReviewItem[];
  filter: ReviewFilter;
  sortBy: 'submittedAt' | 'priority' | 'author' | 'slaDeadline';
  sortOrder: 'asc' | 'desc';
  selectedIds: string[];
  isLoading: boolean;
  error: string | null;
  stats: ReviewStats;
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

/**
 * Map a Meeting status to a ReviewStatus
 */
export function meetingStatusToReviewStatus(status: MeetingStatus): ReviewStatus {
  switch (status) {
    case 'ready':
      return 'pending';
    case 'processing':
      return 'in_review';
    case 'flagged':
      return 'changes_requested';
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'draft':
    default:
      return 'pending';
  }
}

/**
 * Determine priority based on meeting attributes
 */
export function calculatePriority(meeting: Meeting, submittedAt: string): ReviewPriority {
  const now = new Date();
  const submitted = new Date(submittedAt);
  const hoursSinceSubmission = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);

  // High-risk items are urgent
  if (meeting.riskScore === 'high') return 'urgent';

  // Over 24h is high priority
  if (hoursSinceSubmission > 24) return 'high';

  // High word count might need more attention
  if (meeting.riskScore === 'medium') return 'high';

  // Over 12h is normal priority
  if (hoursSinceSubmission > 12) return 'normal';

  return 'low';
}

/**
 * Check if a review item is overdue (past 24h SLA)
 */
export function isOverdue(submittedAt: string, slaHours = 24): boolean {
  const deadline = new Date(submittedAt).getTime() + slaHours * 60 * 60 * 1000;
  return Date.now() > deadline;
}

/**
 * Calculate SLA remaining time
 */
export function getSlaRemaining(submittedAt: string, slaHours = 24): {
  hours: number;
  isOverdue: boolean;
  label: string;
  color: string;
} {
  const deadline = new Date(submittedAt).getTime() + slaHours * 60 * 60 * 1000;
  const remainingMs = deadline - Date.now();
  const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

  if (remainingHours < 0) {
    const overdueHours = Math.abs(remainingHours);
    const overdueLabel = overdueHours < 24
      ? `${overdueHours}h`
      : overdueHours < 168
        ? `${Math.floor(overdueHours / 24)}d`
        : `${Math.floor(overdueHours / 168)}wk`;
    return {
      hours: overdueHours,
      isOverdue: true,
      label: `Overdue · ${overdueLabel}`,
      color: 'text-red-700',
    };
  }

  if (remainingHours <= 4) {
    return {
      hours: remainingHours,
      isOverdue: false,
      label: `Due in ${remainingHours}h`,
      color: 'text-orange-700',
    };
  }

  return {
    hours: remainingHours,
    isOverdue: false,
    label: `Due in ${remainingHours}h`,
    color: 'text-slate-600',
  };
}
