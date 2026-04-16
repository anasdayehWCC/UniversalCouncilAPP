'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, Clock, FileText, AlertCircle } from 'lucide-react';
import { Meeting } from '@/types/demo';
import { cn } from '@/lib/utils';
import { useDemo } from '@/context/DemoContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { PENDING_REVIEW_STATUSES } from '@/config/constants';

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
  useRoleGuard(['manager', 'admin']);
  const { meetings, currentUser, updateMeetingStatus, config } = useDemo();
  const [filter, setFilter] = useState<'all' | 'flagged' | 'high'>('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'changes' | 'approved'>('pending');

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

  const handleAction = (meeting: Meeting, action: 'approve' | 'return') => {
    updateMeetingStatus(meeting.id, action === 'approve' ? 'approved' : 'flagged', {
      action: action === 'approve' ? 'approved' : 'returned',
      by: currentUser.name,
    });
  };

  const handleBulkApproveLowRisk = () => {
    const lowRiskItems = filteredQueue.filter(m => m.riskScore === 'low' && m.status !== 'approved');
    if (lowRiskItems.length === 0) {
      alert('No low risk items to approve.');
      return;
    }
    if (confirm(`Approve ${lowRiskItems.length} low risk items?`)) {
      lowRiskItems.forEach(m => {
         updateMeetingStatus(m.id, 'approved', { action: 'approved', by: currentUser.name });
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card
        className="p-6 border-none text-white"
        style={{ background: config.theme.gradient }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide opacity-80">Manager</p>
            <h1 className="text-2xl font-display font-bold">Review Queue</h1>
            <p className="text-sm opacity-80">Manage sign-offs and quality assurance for your team.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-white/30">Approvals pending: {queueCandidates.length}</Badge>
            <Button 
              variant="outline" 
              className="bg-white/10 text-white border-white/40 hover:bg-white/20 gap-2"
              onClick={handleBulkApproveLowRisk}
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Low Risk
            </Button>
            <Button variant="outline" className="bg-white/10 text-white border-white/40 hover:bg-white/20 gap-2">
              <FileText className="w-4 h-4" />
              Bulk Export
            </Button>
          </div>
        </div>
        <div className="info-rail mt-4">
          <span className="info-rail__item">
            <span className="info-rail__dot" style={{ background: 'var(--error)' }} />
            Flagged: {flaggedCount}
          </span>
          <span className="info-rail__item">
            <span className="info-rail__dot" style={{ background: 'var(--warning)' }} />
            High risk: {highRiskCount}
          </span>
          <span className="info-rail__item">
            <span className="info-rail__dot" style={{ background: 'var(--success)' }} />
            Approved: {approvedItems.length}
          </span>
        </div>
      </Card>

      <div className="flex gap-3 items-center">
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'flagged', label: `Flagged (${flaggedCount})` },
            { key: 'high', label: `High Risk (${highRiskCount})` },
          ].map(f => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key as typeof filter)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

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
    </div>
  );
}
