import { useMemo } from 'react';
import { Meeting } from '@/types/demo';
import type { ServiceDomain } from '@/config/domains';
import { PENDING_REVIEW_STATUSES } from '@/config/constants';

export function useTenantMetrics(meetings: Meeting[], domain: ServiceDomain) {
  return useMemo(() => {
    const domainMeetings = meetings.filter(m => m.domain === domain);
    const drafts = domainMeetings.filter(m => m.status === 'draft').length;
    const dueToday = domainMeetings.reduce((acc, m) => acc + m.tasks.filter(t => isToday(t.dueDate)).length, 0);
    const approvalsPending = domainMeetings.filter(m => PENDING_REVIEW_STATUSES.includes(m.status)).length;
    const templateCounts = domainMeetings.reduce<Record<string, number>>((acc, m) => {
      acc[m.templateId] = (acc[m.templateId] || 0) + 1;
      return acc;
    }, {});
    const statusCounts = domainMeetings.reduce<Record<string, number>>((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {});
    return { domainMeetings, drafts, dueToday, approvalsPending, templateCounts, statusCounts };
  }, [meetings, domain]);
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
