import type { MeetingStatus } from '@/types/demo';

export const MAX_MODULES = 7;

// Items that require manager/admin review actions.
export const PENDING_REVIEW_STATUSES: MeetingStatus[] = ['ready', 'flagged'];
