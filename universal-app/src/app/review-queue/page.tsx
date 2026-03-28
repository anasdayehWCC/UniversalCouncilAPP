'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, Clock, FileText, AlertCircle } from 'lucide-react';
import { Meeting } from '@/types/demo';
import { cn } from '@/lib/utils';
import { useDemo } from '@/context/DemoContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { PENDING_REVIEW_STATUSES } from '@/config/constants';

import dynamic from 'next/dynamic';

const PendingReviews = dynamic(() => import('@/components/review/PendingReviews'), {
  loading: () => <div className="h-64 bg-slate-50 rounded-lg animate-pulse" />,
  ssr: false
});

const ChangesRequested = dynamic(() => import('@/components/review/ChangesRequested'), {
  loading: () => <div className="h-64 bg-slate-50 rounded-lg animate-pulse" />,
  ssr: false
});

const ApprovedHistory = dynamic(() => import('@/components/review/ApprovedHistory'), {
  loading: () => <div className="h-64 bg-slate-50 rounded-lg animate-pulse" />,
  ssr: false
});

export default function ReviewQueuePage() {
  useRoleGuard(['manager', 'admin']);
  const { meetings, currentUser, updateMeetingStatus, config } = useDemo();
  const [filter, setFilter] = useState<'all' | 'flagged' | 'high'>('all');

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
            <span className="info-rail__dot" style={{ background: '#ef4444' }} />
            Flagged: {flaggedCount}
          </span>
          <span className="info-rail__item">
            <span className="info-rail__dot" style={{ background: '#f59e0b' }} />
            High risk: {highRiskCount}
          </span>
          <span className="info-rail__item">
            <span className="info-rail__dot" style={{ background: '#22c55e' }} />
            Approved: {approvedItems.length}
          </span>
        </div>
      </Card>

      <div className="flex gap-3 items-center">
        <span className="text-sm font-medium text-slate-700">Filter:</span>
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
              className={cn(filter === f.key ? "bg-blue-600 text-white" : "border-slate-200")}
              onClick={() => setFilter(f.key as typeof filter)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending Review
            <Badge variant="secondary" className="ml-1 bg-white text-slate-900 shadow-sm">{filteredQueue.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="changes" className="gap-2">
            <AlertCircle className="w-4 h-4" />
            Changes Requested
            <Badge variant="secondary" className="ml-1 bg-white text-slate-900 shadow-sm">{flaggedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Approved History
            <Badge variant="secondary" className="ml-1 bg-white text-slate-900 shadow-sm">{approvedItems.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <PendingReviews items={filteredQueue} onAction={handleAction} />
        </TabsContent>

        <TabsContent value="changes">
          <ChangesRequested 
            items={queueCandidates.filter(m => m.status === 'flagged')} 
            onAction={handleAction} 
          />
        </TabsContent>

        <TabsContent value="approved">
          <ApprovedHistory items={approvedItems} filteredQueueLength={filteredQueue.length} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
