'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Meeting } from '@/types/demo';
import type { PersonaMetadata } from '@/config/personas';
import type { ServiceDomain } from '@/config/domains';
import { PENDING_REVIEW_STATUSES } from '@/config/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkerCompliance {
  id: string;
  name: string;
  avatar: string;
  role: string;
  recordingsThisWeek: number;
  recordingsThisMonth: number;
  notesPendingReview: number;
  approvalRate: number;
  overdueItems: number;
  status: 'good' | 'attention' | 'critical';
}

interface TeamComplianceWidgetProps {
  meetings: Meeting[];
  personas: Record<string, PersonaMetadata>;
  domain: ServiceDomain;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function deriveCompliance(
  meetings: Meeting[],
  personas: Record<string, PersonaMetadata>,
  domain: ServiceDomain,
): WorkerCompliance[] {
  const now = Date.now();
  const weekAgo = now - ONE_WEEK_MS;
  const monthAgo = now - ONE_MONTH_MS;

  // Only include practitioners (social_worker / housing_officer) within the manager's domain
  const teamMembers = Object.values(personas).filter(
    (p) =>
      (p.role === 'social_worker' || p.role === 'housing_officer') &&
      p.domain === domain,
  );

  return teamMembers.map((member) => {
    const memberMeetings = meetings.filter(
      (m) => m.submittedById === member.id || m.submittedBy === member.name,
    );

    const meetingDate = (m: Meeting) =>
      new Date(m.uploadedAt || m.submittedAt || m.date).getTime();

    const recordingsThisWeek = memberMeetings.filter(
      (m) => meetingDate(m) >= weekAgo,
    ).length;

    const recordingsThisMonth = memberMeetings.filter(
      (m) => meetingDate(m) >= monthAgo,
    ).length;

    const notesPendingReview = memberMeetings.filter((m) =>
      PENDING_REVIEW_STATUSES.includes(m.status),
    ).length;

    const totalReviewed = memberMeetings.filter(
      (m) => m.status === 'approved' || m.lastAction === 'approved',
    ).length;
    const totalSubmitted = memberMeetings.filter(
      (m) => m.status !== 'draft' && m.status !== 'processing',
    ).length;
    const approvalRate =
      totalSubmitted > 0
        ? Math.round((totalReviewed / totalSubmitted) * 100)
        : 0;

    // Overdue = items submitted > 48 hours ago still pending review
    const OVERDUE_THRESHOLD_MS = 48 * 60 * 60 * 1000;
    const overdueItems = memberMeetings.filter((m) => {
      if (!PENDING_REVIEW_STATUSES.includes(m.status)) return false;
      const submittedTime = m.submittedAt ? new Date(m.submittedAt).getTime() : 0;
      return submittedTime > 0 && now - submittedTime > OVERDUE_THRESHOLD_MS;
    }).length;

    // Status thresholds
    let status: WorkerCompliance['status'] = 'good';
    if (overdueItems >= 3 || approvalRate < 50) {
      status = 'critical';
    } else if (overdueItems >= 1 || approvalRate < 75 || notesPendingReview >= 3) {
      status = 'attention';
    }

    return {
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      role: member.role,
      recordingsThisWeek,
      recordingsThisMonth,
      notesPendingReview,
      approvalRate,
      overdueItems,
      status,
    };
  });
}

function statusConfig(status: WorkerCompliance['status']) {
  switch (status) {
    case 'good':
      return {
        label: 'On Track',
        dotClass: 'bg-success',
        badgeClass: 'bg-success/10 text-success border-success/20',
      };
    case 'attention':
      return {
        label: 'Needs Attention',
        dotClass: 'bg-warning',
        badgeClass: 'bg-warning/10 text-warning border-warning/20',
      };
    case 'critical':
      return {
        label: 'At Risk',
        dotClass: 'bg-destructive',
        badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
      };
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ComplianceRow({ worker }: { worker: WorkerCompliance }) {
  const cfg = statusConfig(worker.status);

  return (
    <div className="p-4 border-b border-border last:border-0 flex items-center gap-4 hover:bg-muted/50 transition-colors group">
      {/* Avatar */}
      <Image
        src={worker.avatar}
        alt={worker.name}
        width={40}
        height={40}
        className="rounded-full border border-border object-cover"
        sizes="40px"
      />

      {/* Name + Role */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-foreground truncate">
            {worker.name}
          </h4>
          <Badge
            variant="outline"
            className={cn('text-[10px] h-5 px-1.5', cfg.badgeClass)}
          >
            {cfg.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
          {worker.role.replace('_', ' ')}
        </p>
      </div>

      {/* Metrics */}
      <div className="hidden sm:flex items-center gap-6 text-sm">
        <MetricCell
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="This week"
          value={String(worker.recordingsThisWeek)}
        />
        <MetricCell
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          label="Approval"
          value={`${worker.approvalRate}%`}
          valueClass={
            worker.approvalRate >= 75
              ? 'text-success'
              : worker.approvalRate >= 50
                ? 'text-warning'
                : 'text-destructive'
          }
        />
        <MetricCell
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Pending"
          value={String(worker.notesPendingReview)}
          valueClass={
            worker.notesPendingReview >= 3 ? 'text-warning' : undefined
          }
        />
        {worker.overdueItems > 0 && (
          <MetricCell
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            label="Overdue"
            value={String(worker.overdueItems)}
            valueClass="text-destructive"
          />
        )}
      </div>

      {/* Mobile summary */}
      <div className="flex sm:hidden items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full', cfg.dotClass)} />
        <span className="text-xs text-muted-foreground">
          {worker.recordingsThisWeek} rec / {worker.notesPendingReview} pending
        </span>
      </div>
    </div>
  );
}

function MetricCell({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
      <span className="text-muted-foreground">{icon}</span>
      <span className={cn('text-sm font-bold text-foreground', valueClass)}>
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TeamComplianceWidget({
  meetings,
  personas,
  domain,
  className,
}: TeamComplianceWidgetProps) {
  const workers = useMemo(
    () => deriveCompliance(meetings, personas, domain),
    [meetings, personas, domain],
  );

  const summary = useMemo(() => {
    const good = workers.filter((w) => w.status === 'good').length;
    const attention = workers.filter((w) => w.status === 'attention').length;
    const critical = workers.filter((w) => w.status === 'critical').length;
    return { good, attention, critical, total: workers.length };
  }, [workers]);

  if (workers.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground font-display">
              Team Compliance
            </h2>
            <p className="text-sm text-muted-foreground">
              Per-worker recording activity and approval metrics
            </p>
          </div>
        </div>
        <Link href="/insights">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-muted-foreground"
          >
            Full Insights <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          {summary.good} on track
        </span>
        {summary.attention > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-warning/10 text-warning border border-warning/20">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            {summary.attention} need attention
          </span>
        )}
        {summary.critical > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
            {summary.critical} at risk
          </span>
        )}
      </div>

      {/* Worker list */}
      <Card
        variant="glass"
        className="bg-card/80 dark:bg-card/60 border border-border overflow-hidden"
        hoverEffect={false}
      >
        {workers.map((worker) => (
          <ComplianceRow key={worker.id} worker={worker} />
        ))}
      </Card>
    </div>
  );
}

export default TeamComplianceWidget;
