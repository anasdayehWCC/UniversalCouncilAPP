'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  Clock,
  CheckCircle2,
  Activity,
  LayoutDashboard,
  FileText,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/context/DemoContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FlagGate } from '@/components/ui/flag-gate';
import { useMeetingMetrics } from '@/hooks/useMeetingMetrics';
import { cn } from '@/lib/utils';

import { useRoleGuard } from '@/hooks/useRoleGuard';
import dynamic from 'next/dynamic';

const ChartsArea = dynamic(() => import('@/components/insights/ChartsArea'), {
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card variant="glass" className="p-6 bg-card/80 h-64 animate-pulse motion-reduce:animate-none">
        <div className="h-8 w-48 bg-muted rounded mb-6" />
        <div className="h-full bg-muted rounded" />
      </Card>
      <Card variant="glass" className="p-6 bg-card/80 h-64 animate-pulse motion-reduce:animate-none">
        <div className="h-8 w-48 bg-muted rounded mb-6" />
        <div className="space-y-4">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </Card>
    </div>
  ),
  ssr: false
});

export default function InsightsPage() {
  useRoleGuard(['manager', 'admin']);
  const { meetings, domain, config, featureFlags, role, personas, templates } = useDemo();
  const canViewAllScope = role !== 'social_worker';
  const [scope, setScope] = useState<'current' | 'all'>('current');

  const filteredMeetings = useMemo(() => {
    return scope === 'all' ? meetings : meetings.filter(m => m.domain === domain);
  }, [scope, meetings, domain]);

  const counts = useMeetingMetrics(filteredMeetings, personas);
  const templateNameMap = useMemo(() => {
    return Object.fromEntries(templates.map(t => [t.id, t.name]));
  }, [templates]);

  const handleExport = () => {
    const headers = ['ID', 'Title', 'Date', 'Status', 'Risk Score', 'Submitted By', 'Domain'];
    const rows = filteredMeetings.map(m => [
      m.id,
      `"${m.title.replace(/"/g, '""')}"`, // Escape quotes
      m.date,
      m.status,
      m.riskScore || 'N/A',
      m.submittedBy,
      m.domain
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `insights_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentScope = scope === 'all' ? 'All domains' : config.name;

  return (
    <FlagGate
      flag="aiInsights"
      featureFlags={featureFlags}
      title="AI Insights disabled"
      message="Priya has turned off AI Insights for this demo. Enable it in Admin to unlock trend visualisations."
      tone="warning"
	      actions={
	        <>
	          {role === 'admin' && (
	            <Link href="/admin">
	              <Button className="bg-white/10 text-white border border-white/30 hover:bg-white/20">Open Admin</Button>
	            </Link>
	          )}
	          <Link href="/review-queue">
	            <Button variant="outline" className="bg-card text-foreground">Go to Review Queue</Button>
	          </Link>
	        </>
	      }
    >
      <div className="space-y-8">
      <Card variant="glass" className="p-6 border-none text-white relative overflow-hidden" style={{ background: config.theme.gradient }} hoverEffect={false}>
        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 relative z-10">
          <div>
            <p className="text-sm uppercase tracking-wide opacity-80 font-medium">Analytics</p>
            <h1 className="text-3xl font-display font-bold mt-1 mb-2">Team Insights</h1>
            <p className="text-base opacity-90">Performance metrics and usage analytics for {config.name}.</p>
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/insights/dashboard">
              <Button
                variant="ghost"
                className="bg-white/10 text-white border border-white/30 hover:bg-white/20 font-semibold"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Full Dashboard
              </Button>
            </Link>
            {canViewAllScope ? (
              <Select value={scope} onValueChange={(v: 'current' | 'all') => setScope(v)}>
                <SelectTrigger className="w-[200px] bg-card text-foreground border-0 shadow-lg">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">{config.name} only</SelectItem>
                  <SelectItem value="all">All domains</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary" className="bg-white/10 text-white border-white/30 backdrop-blur-md">Scope: {config.name}</Badge>
            )}
            <Button
              className="bg-card text-foreground hover:bg-card/90 shadow-lg border-0 font-semibold"
              onClick={handleExport}
            >
              Export Report
            </Button>
          </div>
        </div>
        <div className="info-rail mt-6 relative z-10">
          <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
            <span className="info-rail__dot" style={{ background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
            Approved {counts.approved}
          </span>
          <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
            <span className="info-rail__dot" style={{ background: 'var(--warning)', boxShadow: '0 0 8px var(--warning)' }} />
            Processing {counts.processing}
          </span>
          <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
            <span className="info-rail__dot" style={{ background: 'var(--error)', boxShadow: '0 0 8px var(--error)' }} />
            High Risk {counts.highRisk}
          </span>
          <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
            <span className="info-rail__dot" style={{ background: 'var(--info)', boxShadow: '0 0 8px var(--info)' }} />
            Compliance {counts.complianceRate}%
          </span>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {counts.total === 0 ? (
          <div className="col-span-4 flex flex-col items-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <BarChart3 className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No data yet</p>
            <p className="text-xs text-muted-foreground mt-1">Metrics will appear once notes are submitted</p>
          </div>
        ) : (
          <>
            <MetricCard
              icon={FileText}
              value={counts.total}
              label="Total Notes"
              colorClass="text-primary"
              bgClass="bg-primary/10"
              badge={`${counts.processing} processing`}
            />
            <MetricCard
              icon={Clock}
              value={counts.avgDurationMin !== null ? `${counts.avgDurationMin} mins` : '—'}
              label="Avg. Duration"
              colorClass="text-accent"
              bgClass="bg-accent/10"
              badge={`${counts.processing} in queue`}
            />
            <MetricCard
              icon={CheckCircle2}
              value={counts.ready}
              label="Ready for Review"
              colorClass="text-success"
              bgClass="bg-success/10"
              badge={`${counts.approved} approved`}
            />
            <MetricCard
              icon={AlertTriangle}
              value={counts.highRisk}
              label="High Risk Items"
              colorClass="text-destructive"
              bgClass="bg-destructive/10"
              badge={`${counts.mediumRisk} medium`}
            />
          </>
        )}
      </div>

      {/* Risk Distribution */}
      <div className="bg-card border border-border rounded-xl p-5 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Risk Distribution</h3>
          <span className="text-xs text-muted-foreground">Scope: {currentScope}</span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'High', count: counts.highRisk, barClass: 'bg-destructive' },
            { label: 'Medium', count: counts.mediumRisk, barClass: 'bg-warning' },
            { label: 'Low', count: counts.lowRisk, barClass: 'bg-success' },
            { label: 'None', count: counts.noneRisk, barClass: 'bg-muted-foreground/30' },
          ].map(({ label, count, barClass }) => {
            const total = (counts.highRisk + counts.mediumRisk + counts.lowRisk + counts.noneRisk) || 1;
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="w-12 text-xs text-muted-foreground text-right shrink-0">{label}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all', barClass)}
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-xs font-medium text-foreground text-right shrink-0">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Area */}
      <ChartsArea counts={counts} templateNameMap={templateNameMap} />
    </div>
    </FlagGate>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  value: number | string;
  label: string;
  colorClass?: string;
  bgClass?: string;
  badge?: string;
}

function MetricCard({
  icon: Icon,
  value,
  label,
  colorClass = 'text-primary',
  bgClass = 'bg-primary/10',
  badge,
}: MetricCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', bgClass)}>
          <Icon className={cn('w-5 h-5', colorClass)} />
        </div>
        {badge && (
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
