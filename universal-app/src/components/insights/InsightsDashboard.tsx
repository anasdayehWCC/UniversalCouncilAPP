'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  Clock,
  CheckCircle2,
  Users,
  FileText,
} from 'lucide-react';

import { KpiCard, type SparklineData } from './KpiCard';
import { TeamActivityChart } from './TeamActivityChart';
import { WorkloadHeatmap } from './WorkloadHeatmap';
import { SentimentPieChart } from './SentimentPieChart';
import { TopPerformers } from './TopPerformers';
import { RecentActivityFeed } from './RecentActivityFeed';
import { InsightFilters } from './InsightFilters';

import type { InsightsData, InsightFilters as IFilters } from '@/lib/insights/types';

interface InsightsDashboardProps {
  data: InsightsData | null;
  filters: IFilters;
  onFiltersChange: (filters: Partial<IFilters>) => void;
  onExport?: () => void;
  isLoading?: boolean;
  domains?: { value: string; label: string }[];
  teams?: { value: string; label: string }[];
  users?: { value: string; label: string }[];
  headerGradient?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  className?: string;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card variant="glass" className="p-6 bg-card">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} variant="glass" className="p-6 bg-card">
            <Skeleton className="h-10 w-10 rounded-xl mb-4" />
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-24" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass" className="p-6 bg-white/80 h-80">
          <Skeleton className="h-full" />
        </Card>
        <Card variant="glass" className="p-6 bg-white/80 h-80">
          <Skeleton className="h-full" />
        </Card>
      </div>
    </div>
  );
}

export function InsightsDashboard({
  data,
  filters,
  onFiltersChange,
  onExport,
  isLoading = false,
  domains = [],
  teams = [],
  users = [],
  headerGradient = 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  headerTitle = 'Insights Dashboard',
  headerSubtitle = 'Team performance, adoption metrics, and workload distribution',
  className = '',
}: InsightsDashboardProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!data) {
    return (
      <Card variant="glass" className="p-12 text-center bg-card">
        <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Data Available</h3>
        <p className="text-sm text-muted-foreground">
          There are no records for the selected period and filters.
        </p>
      </Card>
    );
  }

  const { teamMetrics, userMetrics, sentimentTrend, workloadData, trendData, recentActivity, topPerformers } = data;

  // Generate sparkline data from trend data
  const recordingsSparkline: SparklineData[] = trendData.map(d => ({ value: d.recordings, label: d.label }));
  const minutesSparkline: SparklineData[] = trendData.map(d => ({ value: d.minutes, label: d.label }));
  const completionSparkline: SparklineData[] = trendData.map(d => ({ value: d.completionRate, label: d.label }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card
        variant="glass"
        className="p-6 border-none text-white relative overflow-hidden"
        style={{ background: headerGradient }}
        hoverEffect={false}
      >
        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 p-24 bg-black/5 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />
        
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-wide opacity-80 font-medium">Analytics</p>
          <h1 className="text-3xl font-display font-bold mt-1 mb-2">{headerTitle}</h1>
          <p className="text-base opacity-90">{headerSubtitle}</p>

          {/* Quick Stats Rail */}
          <div className="info-rail mt-6">
            <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
              <span className="info-rail__dot" style={{ background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
              Completion {teamMetrics.completionRate}%
            </span>
            <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
              <span className="info-rail__dot" style={{ background: 'var(--info)', boxShadow: '0 0 8px var(--info)' }} />
              Active Users {teamMetrics.activeUsers}
            </span>
            <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
              <span className="info-rail__dot" style={{ background: 'var(--warning)', boxShadow: '0 0 8px var(--warning)' }} />
              Avg Turnaround {teamMetrics.avgTurnaroundTime}h
            </span>
            <span className="info-rail__item bg-white/10 border-white/20 text-white backdrop-blur-md">
              <span className="info-rail__dot" style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
              Audio Minutes {teamMetrics.totalAudioMinutes}
            </span>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <InsightFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onExport={onExport}
        domains={domains}
        teams={teams}
        users={users}
        isLoading={isLoading}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Recordings"
          value={teamMetrics.totalRecordings}
          trend={teamMetrics.changeFromPrevious.recordings}
          trendLabel="vs previous period"
          icon={FileText}
          color="blue"
          sparklineData={recordingsSparkline}
        />
        <KpiCard
          title="Avg Duration"
          value={`${teamMetrics.avgDuration} min`}
          trend={teamMetrics.changeFromPrevious.duration}
          trendLabel="vs previous period"
          icon={Clock}
          color="green"
          sparklineData={minutesSparkline}
        />
        <KpiCard
          title="Completion Rate"
          value={`${teamMetrics.completionRate}%`}
          trend={teamMetrics.changeFromPrevious.completionRate}
          trendLabel="vs previous period"
          icon={CheckCircle2}
          color="purple"
          sparklineData={completionSparkline}
        />
        <KpiCard
          title="Active Users"
          value={teamMetrics.activeUsers}
          subtitle={`${userMetrics.length} total team members`}
          icon={Users}
          color="orange"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamActivityChart data={trendData} title="Team Activity Over Time" />
        <SentimentPieChart data={sentimentTrend} title="Outcome Distribution" />
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkloadHeatmap data={workloadData} title="Workload by User & Day" />
        <TopPerformers data={topPerformers} title="Top Performers" />
      </div>

      {/* Activity Feed */}
      <RecentActivityFeed activities={recentActivity} title="Recent Activity" maxItems={10} />
    </div>
  );
}

export default InsightsDashboard;
