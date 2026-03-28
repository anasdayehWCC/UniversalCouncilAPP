'use client';

import { useMemo, useState, useCallback } from 'react';
import type { Meeting } from '@/types/demo';
import type { PersonaMetadata } from '@/config/personas';
import {
  InsightPeriod,
  InsightsData,
  InsightFilters,
  TeamMetrics,
  UserMetrics,
  SentimentTrend,
  WorkloadData,
  TrendDataPoint,
  ActivityItem,
  TopPerformer,
  getPeriodDays,
  DAY_NAMES,
} from '@/lib/insights/types';

interface UseInsightsOptions {
  meetings: Meeting[];
  personas: Record<string, PersonaMetadata>;
  currentDomain?: string;
}

interface UseInsightsReturn {
  data: InsightsData | null;
  filters: InsightFilters;
  setFilters: (filters: Partial<InsightFilters>) => void;
  isLoading: boolean;
  exportToCsv: () => void;
  filteredMeetings: Meeting[];
}

/**
 * Hook for computing insights data from meetings.
 * Provides filtering, aggregation, and export functionality.
 */
export function useInsights({ meetings, personas, currentDomain }: UseInsightsOptions): UseInsightsReturn {
  const [filters, setFiltersState] = useState<InsightFilters>({
    period: 'month',
    domain: currentDomain ?? null,
    team: null,
    userId: null,
  });

  const setFilters = useCallback((partial: Partial<InsightFilters>) => {
    setFiltersState(prev => ({ ...prev, ...partial }));
  }, []);

  // Filter meetings by period
  const filteredMeetings = useMemo(() => {
    const periodDays = getPeriodDays(filters.period);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);
    const cutoffTime = cutoff.getTime();

    return meetings.filter(m => {
      const meetingDate = new Date(m.uploadedAt || m.submittedAt || m.date).getTime();
      if (meetingDate < cutoffTime) return false;
      if (filters.domain && m.domain !== filters.domain) return false;
      if (filters.userId && m.submittedById !== filters.userId) return false;
      return true;
    });
  }, [meetings, filters]);

  // Compute all insights data
  const data = useMemo((): InsightsData | null => {
    if (filteredMeetings.length === 0 && meetings.length === 0) return null;

    const periodDays = getPeriodDays(filters.period);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Team metrics
    const teamMetrics = computeTeamMetrics(filteredMeetings, periodDays);

    // User metrics
    const userMetrics = computeUserMetrics(filteredMeetings, personas);

    // Sentiment trend (simulated based on risk scores)
    const sentimentTrend = computeSentimentTrend(filteredMeetings);

    // Workload data
    const workloadData = computeWorkloadData(filteredMeetings, personas);

    // Trend data
    const trendData = computeTrendData(filteredMeetings, periodDays);

    // Recent activity
    const recentActivity = computeRecentActivity(filteredMeetings, personas);

    // Top performers
    const topPerformers = computeTopPerformers(userMetrics);

    return {
      period: filters.period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      teamMetrics,
      userMetrics,
      sentimentTrend,
      workloadData,
      trendData,
      recentActivity,
      topPerformers,
    };
  }, [filteredMeetings, meetings.length, personas, filters.period]);

  // Export to CSV
  const exportToCsv = useCallback(() => {
    if (!data) return;

    const headers = [
      'Metric',
      'Value',
      'Period',
      'Date Range',
    ];

    const rows = [
      ['Total Recordings', data.teamMetrics.totalRecordings.toString(), data.period, `${data.dateRange.start.split('T')[0]} to ${data.dateRange.end.split('T')[0]}`],
      ['Average Duration (min)', data.teamMetrics.avgDuration.toFixed(1), data.period, ''],
      ['Completion Rate', `${data.teamMetrics.completionRate}%`, data.period, ''],
      ['Active Users', data.teamMetrics.activeUsers.toString(), data.period, ''],
      ['Avg Turnaround (hrs)', data.teamMetrics.avgTurnaroundTime.toFixed(1), data.period, ''],
      ['', '', '', ''],
      ['User', 'Recordings', 'Minutes', 'Completion Rate'],
      ...data.userMetrics.map(u => [u.userName, u.recordings.toString(), u.minutes.toString(), `${u.completionRate}%`]),
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `insights_report_${filters.period}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, filters.period]);

  return {
    data,
    filters,
    setFilters,
    isLoading: false,
    exportToCsv,
    filteredMeetings,
  };
}

// Helper functions

function computeTeamMetrics(meetings: Meeting[], periodDays: number): TeamMetrics {
  const total = meetings.length;
  const approved = meetings.filter(m => m.status === 'approved').length;
  const ready = meetings.filter(m => m.status === 'ready').length;
  const completionRate = total > 0 ? Math.round(((approved + ready) / total) * 100) : 0;

  const durations = meetings
    .map(m => parseDuration(m.duration))
    .filter((d): d is number => d !== null);
  const avgDuration = durations.length > 0
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
    : 0;
  const totalAudioMinutes = Math.round(durations.reduce((a, b) => a + b, 0));

  const uniqueUsers = new Set(meetings.map(m => m.submittedById || m.submittedBy).filter(Boolean));

  // Turnaround time (simulated - in real app, calculate from submission to approval)
  const approvedMeetings = meetings.filter(m => m.status === 'approved' && m.submittedAt && m.lastActionAt);
  const turnaroundTimes = approvedMeetings.map(m => {
    const submitted = new Date(m.submittedAt!).getTime();
    const approved = new Date(m.lastActionAt!).getTime();
    return (approved - submitted) / (1000 * 60 * 60); // hours
  });
  const avgTurnaroundTime = turnaroundTimes.length > 0
    ? Math.round((turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length) * 10) / 10
    : 0;

  return {
    totalRecordings: total,
    avgDuration,
    completionRate,
    totalAudioMinutes,
    avgTurnaroundTime,
    activeUsers: uniqueUsers.size,
    changeFromPrevious: {
      recordings: Math.round((Math.random() - 0.3) * 30), // Simulated
      duration: Math.round((Math.random() - 0.5) * 20),
      completionRate: Math.round((Math.random() - 0.3) * 15),
    },
  };
}

function computeUserMetrics(meetings: Meeting[], personas: Record<string, PersonaMetadata>): UserMetrics[] {
  const userMap = new Map<string, UserMetrics>();

  for (const meeting of meetings) {
    const userId = meeting.submittedById || meeting.submittedBy || 'unknown';
    const persona = personas[userId];

    if (!userMap.has(userId)) {
      userMap.set(userId, {
        userId,
        userName: persona?.name || meeting.submittedBy || 'Unknown User',
        userRole: persona?.role || 'unknown',
        userAvatar: persona?.avatar,
        recordings: 0,
        minutes: 0,
        avgReviewTime: 0,
        approved: 0,
        flagged: 0,
        completionRate: 0,
        lastActivity: null,
      });
    }

    const metrics = userMap.get(userId)!;
    metrics.recordings += 1;
    metrics.minutes += parseDuration(meeting.duration) || 0;
    
    if (meeting.status === 'approved') metrics.approved += 1;
    if (meeting.status === 'flagged') metrics.flagged += 1;
    
    const activityDate = meeting.uploadedAt || meeting.submittedAt || meeting.date;
    if (!metrics.lastActivity || activityDate > metrics.lastActivity) {
      metrics.lastActivity = activityDate;
    }
  }

  // Calculate completion rates
  for (const metrics of userMap.values()) {
    metrics.completionRate = metrics.recordings > 0
      ? Math.round((metrics.approved / metrics.recordings) * 100)
      : 0;
    metrics.avgReviewTime = Math.round(Math.random() * 24 * 10) / 10; // Simulated
  }

  return Array.from(userMap.values()).sort((a, b) => b.recordings - a.recordings);
}

function computeSentimentTrend(meetings: Meeting[]): SentimentTrend {
  // Map risk scores to sentiment (simplified)
  let positive = 0;
  let neutral = 0;
  let negative = 0;

  for (const meeting of meetings) {
    if (meeting.riskScore === 'low' || meeting.status === 'approved') {
      positive += 1;
    } else if (meeting.riskScore === 'high' || meeting.status === 'flagged') {
      negative += 1;
    } else {
      neutral += 1;
    }
  }

  return { positive, neutral, negative };
}

function computeWorkloadData(meetings: Meeting[], personas: Record<string, PersonaMetadata>): WorkloadData {
  const byUser: Record<string, number> = {};
  const byDay: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const byDomain: Record<string, number> = {};
  const byHour: Record<number, number> = {};
  
  for (let i = 0; i < 24; i++) byHour[i] = 0;

  for (const meeting of meetings) {
    const userId = meeting.submittedById || meeting.submittedBy || 'unknown';
    const persona = personas[userId];
    const userName = persona?.name || meeting.submittedBy || 'Unknown';
    
    byUser[userName] = (byUser[userName] || 0) + 1;
    byDomain[meeting.domain] = (byDomain[meeting.domain] || 0) + 1;
    
    const date = new Date(meeting.uploadedAt || meeting.submittedAt || meeting.date);
    byDay[date.getDay()] += 1;
    byHour[date.getHours()] += 1;
  }

  return { byUser, byDay, byDomain, byHour };
}

function computeTrendData(meetings: Meeting[], periodDays: number): TrendDataPoint[] {
  const dataPoints: Map<string, TrendDataPoint> = new Map();
  const bucketSize = periodDays <= 7 ? 1 : periodDays <= 30 ? 1 : 7;
  
  // Initialize buckets
  for (let i = periodDays; i >= 0; i -= bucketSize) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    const label = bucketSize === 1 
      ? DAY_NAMES[date.getDay()]
      : `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    
    dataPoints.set(key, {
      date: key,
      label,
      recordings: 0,
      minutes: 0,
      approvals: 0,
      completionRate: 0,
    });
  }

  // Fill in data
  for (const meeting of meetings) {
    const meetingDate = new Date(meeting.uploadedAt || meeting.submittedAt || meeting.date);
    const key = meetingDate.toISOString().split('T')[0];
    
    const point = dataPoints.get(key);
    if (point) {
      point.recordings += 1;
      point.minutes += parseDuration(meeting.duration) || 0;
      if (meeting.status === 'approved') point.approvals += 1;
    }
  }

  // Calculate completion rates
  for (const point of dataPoints.values()) {
    point.completionRate = point.recordings > 0
      ? Math.round((point.approvals / point.recordings) * 100)
      : 0;
  }

  return Array.from(dataPoints.values());
}

function computeRecentActivity(meetings: Meeting[], personas: Record<string, PersonaMetadata>): ActivityItem[] {
  const activities: ActivityItem[] = [];

  const sortedMeetings = [...meetings]
    .sort((a, b) => {
      const dateA = new Date(a.uploadedAt || a.submittedAt || a.date).getTime();
      const dateB = new Date(b.uploadedAt || b.submittedAt || b.date).getTime();
      return dateB - dateA;
    })
    .slice(0, 20);

  for (const meeting of sortedMeetings) {
    const userId = meeting.submittedById || meeting.submittedBy || 'unknown';
    const persona = personas[userId];

    let type: ActivityItem['type'] = 'recording';
    let description = 'Created a new recording';

    if (meeting.status === 'approved') {
      type = 'approval';
      description = `Approved by ${meeting.lastActionBy || 'manager'}`;
    } else if (meeting.status === 'flagged') {
      type = 'flagged';
      description = 'Flagged for review';
    } else if (meeting.lastAction === 'returned') {
      type = 'returned';
      description = 'Returned for revisions';
    } else if (meeting.status === 'ready') {
      type = 'completion';
      description = 'Ready for review';
    }

    activities.push({
      id: `${meeting.id}-${type}`,
      type,
      title: meeting.title,
      description,
      userId,
      userName: persona?.name || meeting.submittedBy || 'Unknown User',
      userAvatar: persona?.avatar,
      timestamp: meeting.lastActionAt || meeting.submittedAt || meeting.uploadedAt || meeting.date,
    });
  }

  return activities;
}

function computeTopPerformers(userMetrics: UserMetrics[]): {
  completion: TopPerformer[];
  turnaround: TopPerformer[];
  volume: TopPerformer[];
} {
  const createPerformers = (
    sorted: UserMetrics[],
    metricFn: (u: UserMetrics) => number,
    labelFn: (u: UserMetrics) => string
  ): TopPerformer[] => {
    return sorted.slice(0, 5).map((u, i) => ({
      userId: u.userId,
      userName: u.userName,
      userAvatar: u.userAvatar,
      userRole: u.userRole,
      metric: metricFn(u),
      metricLabel: labelFn(u),
      rank: i + 1,
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
      trendValue: Math.round(Math.random() * 20),
    }));
  };

  const byCompletion = [...userMetrics]
    .filter(u => u.recordings >= 2)
    .sort((a, b) => b.completionRate - a.completionRate);
  
  const byTurnaround = [...userMetrics]
    .filter(u => u.recordings >= 2)
    .sort((a, b) => a.avgReviewTime - b.avgReviewTime);
  
  const byVolume = [...userMetrics].sort((a, b) => b.recordings - a.recordings);

  return {
    completion: createPerformers(byCompletion, u => u.completionRate, u => `${u.completionRate}% completion`),
    turnaround: createPerformers(byTurnaround, u => u.avgReviewTime, u => `${u.avgReviewTime}h avg`),
    volume: createPerformers(byVolume, u => u.recordings, u => `${u.recordings} recordings`),
  };
}

function parseDuration(duration: string): number | null {
  if (!duration) return null;
  const lower = duration.toLowerCase();
  if (lower.includes('processing')) return null;

  if (lower.includes(':')) {
    const parts = lower.split(':').map(Number);
    if (parts.every(p => Number.isFinite(p))) {
      if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
      if (parts.length === 2) return parts[0] + parts[1] / 60;
    }
  }

  const hMatch = lower.match(/(\d+(?:\.\d+)?)\s*h/);
  const mMatch = lower.match(/(\d+(?:\.\d+)?)\s*m/);
  if (hMatch || mMatch) {
    const hours = hMatch ? Number(hMatch[1]) : 0;
    const mins = mMatch ? Number(mMatch[1]) : 0;
    const totalMins = hours * 60 + mins;
    return Number.isFinite(totalMins) ? totalMins : null;
  }

  const numMatch = lower.match(/(\d+(?:\.\d+)?)/);
  return numMatch ? Number(numMatch[1]) : null;
}
