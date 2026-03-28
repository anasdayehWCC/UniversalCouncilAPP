import { Meeting } from '@/types/demo';
import { formatDateTime } from '@/lib/dates';
import { PENDING_REVIEW_STATUSES } from '@/config/constants';
import type { ServiceDomain } from '@/config/domains';

export type ApprovalsMetrics = {
  pending: number;
  avgApprovalMinutes: number | null;
  slaLabel: string;
};

export function getApprovalsMetrics(meetings: Meeting[], domain: ServiceDomain): ApprovalsMetrics {
  const approvals = meetings.filter(m => PENDING_REVIEW_STATUSES.includes(m.status) && m.domain === domain);
  const pending = approvals.length;
  const durations = approvals
    .map(m => {
      if (!m.submittedAt || !m.lastActionAt) return null;
      const submitted = new Date(m.submittedAt).getTime();
      const resolved = new Date(m.lastActionAt).getTime();
      if (Number.isFinite(submitted) && Number.isFinite(resolved)) {
        return Math.max(0, resolved - submitted);
      }
      return null;
    })
    .filter((ms): ms is number => ms !== null);
  const avgMs = durations.length ? durations.reduce((sum, val) => sum + val, 0) / durations.length : null;
  const avgApprovalMinutes = avgMs !== null ? Math.round(avgMs / 60000) : null;
  const slaLabel = avgApprovalMinutes === null ? 'SLA pending' : `${avgApprovalMinutes}m SLA`;
  return { pending, avgApprovalMinutes, slaLabel };
}

export type SyncStatus = {
  label: string;
  healthy: boolean;
  lastSync: string;
};

export function getSyncStatus(meetings: Meeting[]): SyncStatus {
  const timestamps = meetings
    .map(m => m.uploadedAt || m.submittedAt || m.date)
    .map(t => new Date(t).getTime())
    .filter(num => !Number.isNaN(num));
  const latest = timestamps.length ? Math.max(...timestamps) : Date.now();
  const deltaMinutes = Math.round((Date.now() - latest) / 60000);
  const healthy = deltaMinutes < 15;
  const label = healthy ? 'Sync healthy' : 'Sync aging';
  const lastSync = formatDateTime(new Date(latest).toISOString());
  return { label, healthy, lastSync };
}
