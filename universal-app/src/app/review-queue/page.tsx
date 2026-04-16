'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Clock, FileText, AlertCircle, ArrowUpDown, Download } from 'lucide-react';
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
  const [sortBy, setSortBy] = useState<'priority' | 'oldest' | 'newest'>('priority');
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
    const filtered = queueCandidates.filter(m => {
      if (filter === 'flagged') return m.status === 'flagged';
      if (filter === 'high') return m.riskScore === 'high';
      return true;
    });

    const riskWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'oldest': {
          const dateA = new Date(a.submittedAt || a.uploadedAt || a.date).getTime();
          const dateB = new Date(b.submittedAt || b.uploadedAt || b.date).getTime();
          return dateA - dateB;
        }
        case 'newest': {
          const dateA = new Date(a.submittedAt || a.uploadedAt || a.date).getTime();
          const dateB = new Date(b.submittedAt || b.uploadedAt || b.date).getTime();
          return dateB - dateA;
        }
        case 'priority':
        default: {
          const wa = riskWeight[a.riskScore || 'low'];
          const wb = riskWeight[b.riskScore || 'low'];
          if (wa !== wb) return wb - wa;
          // Secondary sort: oldest first within same priority
          const dateA = new Date(a.submittedAt || a.uploadedAt || a.date).getTime();
          const dateB = new Date(b.submittedAt || b.uploadedAt || b.date).getTime();
          return dateA - dateB;
        }
      }
    });
  }, [queueCandidates, filter, sortBy]);

  const flaggedCount = queueCandidates.filter(m => m.status === 'flagged').length;
  const highRiskCount = queueCandidates.filter(m => m.riskScore === 'high').length;

  const handleAction = (meeting: Meeting, action: 'approve' | 'return') => {
    updateMeetingStatus(meeting.id, action === 'approve' ? 'approved' : 'flagged', {
      action: action === 'approve' ? 'approved' : 'returned',
      by: currentUser.name,
    });
  };

  const handleBulkExport = useCallback(() => {
    if (filteredQueue.length === 0) {
      alert('No items to export.');
      return;
    }

    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const header = ['Title', 'Author', 'Status', 'Submitted Date', 'Risk Level'];
    const rows = filteredQueue.map(m => [
      escapeCSV(m.title),
      escapeCSV(m.submittedBy || 'Unknown'),
      escapeCSV(m.status),
      escapeCSV(m.submittedAt || m.uploadedAt || m.date),
      escapeCSV(m.riskScore || 'N/A'),
    ]);

    const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `review-queue-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredQueue]);

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
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/40 hover:bg-white/20 gap-2"
              onClick={handleBulkExport}
            >
              <Download className="w-4 h-4" />
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

      <div className="flex flex-wrap gap-3 items-center justify-between">
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

        <div className="flex gap-2 items-center">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v: string) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[160px] h-9 text-sm" aria-label="Sort queue items">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="newest">Newest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} className="w-full">
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
          {([
            { key: 'pending' as const, label: 'Pending Review', icon: <Clock className="w-4 h-4" />, count: filteredQueue.length },
            { key: 'changes' as const, label: 'Changes Requested', icon: <AlertCircle className="w-4 h-4" />, count: flaggedCount },
            { key: 'approved' as const, label: 'Approved History', icon: <CheckCircle2 className="w-4 h-4" />, count: approvedItems.length },
          ] as const).map(tab => (
            <button
              key={tab.key}
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
