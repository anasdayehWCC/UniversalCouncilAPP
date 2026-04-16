'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, Clock, FileText, AlertCircle } from 'lucide-react';
import { Meeting } from '@/types/demo';
import { cn } from '@/lib/utils';
import { useDemo } from '@/context/DemoContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { PENDING_REVIEW_STATUSES } from '@/config/constants';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { PageHeader, PageSection, ShellPage } from '@/components/layout';

import dynamic from 'next/dynamic';

const PendingReviews = dynamic(() => import('@/components/review/PendingReviews'), {
  loading: () => <div className="h-64 bg-muted rounded-lg animate-pulse motion-reduce:animate-none" />,
  ssr: false
});

const ChangesRequested = dynamic(() => import('@/components/review/ChangesRequested'), {
  loading: () => <div className="h-64 bg-muted rounded-lg animate-pulse motion-reduce:animate-none" />,
  ssr: false
});

const ApprovedHistory = dynamic(() => import('@/components/review/ApprovedHistory'), {
  loading: () => <div className="h-64 bg-muted rounded-lg animate-pulse motion-reduce:animate-none" />,
  ssr: false
});

export default function ReviewQueuePage() {
  const { isReady, isAuthorized } = useRoleGuard(['manager', 'admin']);
  const { meetings, currentUser, updateMeetingStatus, config } = useDemo();
  const toast = useToast();
  const [filter, setFilter] = useState<'all' | 'flagged' | 'high'>('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'changes' | 'approved'>('pending');
  const [showBulkApproveDialog, setShowBulkApproveDialog] = useState(false);

  const queueCandidates = useMemo(
    () => meetings.filter(m => m.domain === currentUser.domain && PENDING_REVIEW_STATUSES.includes(m.status)),
    [meetings, currentUser.domain]
  );

  const approvedItems = useMemo(
    () => meetings.filter(m => m.domain === currentUser.domain && m.status === 'approved'),
    [meetings, currentUser.domain]
  );

  const filteredQueue = useMemo(() => {
    return queueCandidates.filter(m => {
      if (filter === 'flagged') return m.status === 'flagged';
      if (filter === 'high') return m.riskScore === 'high';
      return true;
    });
  }, [queueCandidates, filter]);

  const flaggedCount = queueCandidates.filter(m => m.status === 'flagged').length;
  const highRiskCount = queueCandidates.filter(m => m.riskScore === 'high').length;
  const lowRiskItems = filteredQueue.filter(m => m.riskScore === 'low' && m.status !== 'approved');

  const handleAction = (meeting: Meeting, action: 'approve' | 'return') => {
    updateMeetingStatus(meeting.id, action === 'approve' ? 'approved' : 'flagged', {
      action: action === 'approve' ? 'approved' : 'returned',
      by: currentUser.name,
    });
  };

  const handleBulkApproveLowRisk = () => {
    if (lowRiskItems.length === 0) {
      toast.info('No low-risk items ready', 'Adjust the filter or wait for more items to enter the queue.');
      return;
    }
    setShowBulkApproveDialog(true);
  };

  if (!isReady || !isAuthorized) {
    return null;
  }

  return (
    <ShellPage
      padded={false}
      header={
        <PageHeader
          eyebrow="Manager Review"
          title="Review Queue"
          description="Manage sign-offs, risk, and quality assurance without losing sight of the working queue."
          gradient={config.theme.gradient}
          inverted
          metrics={[
            { label: 'Pending', value: queueCandidates.length, tone: 'brand' },
            { label: 'Flagged', value: flaggedCount, tone: 'destructive' },
            { label: 'High risk', value: highRiskCount, tone: 'warning' },
            { label: 'Approved', value: approvedItems.length, tone: 'success' },
          ]}
          actions={
            <>
              <Button
                variant="outline"
                className="gap-2 border-white/22 bg-white/12 text-white hover:bg-white/20"
                onClick={handleBulkApproveLowRisk}
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Low Risk
              </Button>
              <Button variant="outline" className="gap-2 border-white/22 bg-white/12 text-white hover:bg-white/20">
                <FileText className="w-4 h-4" />
                Bulk Export
              </Button>
            </>
          }
        />
      }
      contentClassName="space-y-6"
    >
      <PageSection
        title="Queue filters"
        description="Narrow the queue to the items that need immediate intervention while keeping the tabs stable."
      >
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'flagged', label: `Flagged (${flaggedCount})` },
            { key: 'high', label: `High Risk (${highRiskCount})` },
          ].map(f => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key as typeof filter)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </PageSection>

      <Tabs value={activeTab} className="w-full">
        <div role="tablist" aria-label="Review queue tabs" className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
          {([
            { key: 'pending' as const, label: 'Pending Review', icon: <Clock className="w-4 h-4" />, count: filteredQueue.length },
            { key: 'changes' as const, label: 'Changes Requested', icon: <AlertCircle className="w-4 h-4" />, count: flaggedCount },
            { key: 'approved' as const, label: 'Approved History', icon: <CheckCircle2 className="w-4 h-4" />, count: approvedItems.length },
          ] as const).map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center",
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted-foreground/20 text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <TabsContent value="pending" className="space-y-4" role="tabpanel" id="tabpanel-pending" aria-labelledby="tab-pending">
          <PendingReviews items={filteredQueue} onAction={handleAction} />
        </TabsContent>

        <TabsContent value="changes" role="tabpanel" id="tabpanel-changes" aria-labelledby="tab-changes">
          <ChangesRequested
            items={queueCandidates.filter(m => m.status === 'flagged')}
            onAction={handleAction}
          />
        </TabsContent>

        <TabsContent value="approved" role="tabpanel" id="tabpanel-approved" aria-labelledby="tab-approved">
          <ApprovedHistory items={approvedItems} filteredQueueLength={filteredQueue.length} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={showBulkApproveDialog}
        onOpenChange={setShowBulkApproveDialog}
        title="Approve low-risk items?"
        description={`This will approve ${lowRiskItems.length} low-risk ${lowRiskItems.length === 1 ? 'item' : 'items'} in the current queue filter.`}
        confirmText="Approve items"
        cancelText="Keep reviewing"
        onConfirm={() => {
          lowRiskItems.forEach((meeting) => {
            updateMeetingStatus(meeting.id, 'approved', {
              action: 'approved',
              by: currentUser.name,
            });
          });
          toast.success(
            'Low-risk items approved',
            `${lowRiskItems.length} ${lowRiskItems.length === 1 ? 'item was' : 'items were'} approved.`
          );
        }}
      />
    </ShellPage>
  );
}
