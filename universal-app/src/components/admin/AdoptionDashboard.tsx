/**
 * AdoptionDashboard Component
 * Universal Council App - Multi-tenant SaaS Platform
 * 
 * Displays user adoption metrics, feature usage statistics,
 * recording volumes, and department breakdowns.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useDemo } from '@/context/DemoContext';
import {
  Users,
  Activity,
  Mic,
  FileText,
  TrendingUp,
  TrendingDown,
  Building2,
  Sparkles,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

type TimeRange = 'daily' | 'weekly' | 'monthly';

interface MetricData {
  label: string;
  value: number;
  previousValue?: number;
}

interface FeatureUsage {
  name: string;
  usage: number;
  color: string;
}

interface DepartmentData {
  name: string;
  users: number;
  recordings: number;
  color: string;
}

interface TrendPoint {
  label: string;
  value: number;
}

// ============================================================================
// Mock Data Generator (uses Demo context meetings for realistic data)
// ============================================================================

function useAdoptionData() {
  const { meetings, currentUser } = useDemo();

  return useMemo(() => {
    // Active users based on unique interactions with meetings
    const activeUsers = {
      daily: { current: 847, previous: 812 },
      weekly: { current: 2341, previous: 2198 },
      monthly: { current: 4872, previous: 4521 },
    };

    // Feature usage percentages
    const featureUsage: FeatureUsage[] = [
      { name: 'Voice Recording', usage: 89, color: '#3b82f6' },
      { name: 'Minute Generation', usage: 76, color: '#8b5cf6' },
      { name: 'Auto-Transcription', usage: 72, color: '#06b6d4' },
      { name: 'Quick Templates', usage: 64, color: '#10b981' },
      { name: 'AI Summaries', usage: 58, color: '#f59e0b' },
      { name: 'SharePoint Export', usage: 45, color: '#ec4899' },
      { name: 'Offline Mode', usage: 38, color: '#6366f1' },
      { name: 'Collaborative Editing', usage: 31, color: '#14b8a6' },
    ];

    // Recording volume over time (last 12 weeks)
    const recordingVolume: TrendPoint[] = [
      { label: 'W1', value: 423 },
      { label: 'W2', value: 478 },
      { label: 'W3', value: 512 },
      { label: 'W4', value: 489 },
      { label: 'W5', value: 567 },
      { label: 'W6', value: 623 },
      { label: 'W7', value: 701 },
      { label: 'W8', value: 658 },
      { label: 'W9', value: 734 },
      { label: 'W10', value: 812 },
      { label: 'W11', value: 856 },
      { label: 'W12', value: 921 },
    ];

    // Department breakdown
    const departments: DepartmentData[] = [
      { name: 'Children\'s Services', users: 234, recordings: 1847, color: '#3b82f6' },
      { name: 'Adult Social Care', users: 189, recordings: 1423, color: '#8b5cf6' },
      { name: 'Housing', users: 156, recordings: 987, color: '#10b981' },
      { name: 'Corporate Services', users: 98, recordings: 456, color: '#f59e0b' },
      { name: 'Education', users: 87, recordings: 398, color: '#06b6d4' },
      { name: 'Health Integration', users: 45, recordings: 234, color: '#ec4899' },
    ];

    // Current month stats from meetings
    const totalRecordings = meetings.length || 156;
    const avgRecordingLength = '12:34';
    const transcriptionAccuracy = 94.7;
    const timeSavedHours = Math.round(totalRecordings * 0.75);

    return {
      activeUsers,
      featureUsage,
      recordingVolume,
      departments,
      stats: {
        totalRecordings,
        avgRecordingLength,
        transcriptionAccuracy,
        timeSavedHours,
      },
    };
  }, [meetings]);
}

// ============================================================================
// Sub-Components
// ============================================================================

function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}) {
  const options: { value: TimeRange; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-all
            ${
              value === option.value
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function MetricCard({
  title,
  value,
  previousValue,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ElementType;
  color: 'blue' | 'purple' | 'green' | 'amber' | 'cyan' | 'rose';
  subtitle?: string;
}) {
  const change = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const isPositive = change > 0;

  const colorStyles = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/50',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-100 dark:border-purple-900',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950/50',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-100 dark:border-green-900',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900',
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-950/50',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-100 dark:border-cyan-900',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-100 dark:border-rose-900',
    },
  };

  const styles = colorStyles[color];

  return (
    <Card variant="glass" className="p-6 bg-white/80 dark:bg-slate-900/80">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${styles.bg} ${styles.border} border shadow-sm`}>
          <Icon className={`w-5 h-5 ${styles.text}`} />
        </div>
        {previousValue && (
          <div
            className={`
              flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border
              ${
                isPositive
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-900'
                  : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900'
              }
            `}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1 font-display">
        {value.toLocaleString()}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
      {subtitle && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
      )}
    </Card>
  );
}

function FeatureUsageChart({ data }: { data: FeatureUsage[] }) {
  const maxUsage = Math.max(...data.map((d) => d.usage));

  return (
    <Card variant="glass" className="p-6 bg-white/80 dark:bg-slate-900/80">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Feature Adoption
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Usage percentage across all users
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {data.map((feature) => (
          <div key={feature.name} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {feature.name}
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {feature.usage}%
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                style={{
                  width: `${(feature.usage / maxUsage) * 100}%`,
                  backgroundColor: feature.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AreaTrendChart({
  data,
  title,
  subtitle,
  color = '#3b82f6',
}: {
  data: TrendPoint[];
  title: string;
  subtitle: string;
  color?: string;
}) {
  const { path, area, points, maxValue, minValue, avgValue } = useMemo(() => {
    const width = 100;
    const height = 60;
    const padding = { top: 5, right: 5, bottom: 5, left: 5 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    const pts = values.map((v, i) => ({
      x: padding.left + (i / (values.length - 1)) * innerWidth,
      y: padding.top + innerHeight - ((v - min) / range) * innerHeight,
      value: v,
      label: data[i].label,
    }));

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${height - padding.bottom} L ${pts[0].x} ${height - padding.bottom} Z`;

    return {
      path: linePath,
      area: areaPath,
      points: pts,
      maxValue: max,
      minValue: min,
      avgValue: avg,
    };
  }, [data]);

  return (
    <Card variant="glass" className="p-6 bg-white/80 dark:bg-slate-900/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="p-2 rounded-lg shadow-lg"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
          >
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {data[data.length - 1].value.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">Latest</div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative h-32 mt-4">
        <svg
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <g className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.2">
            <line x1="5" y1="15" x2="95" y2="15" />
            <line x1="5" y1="32.5" x2="95" y2="32.5" strokeDasharray="2,2" />
            <line x1="5" y1="50" x2="95" y2="50" />
          </g>
          {/* Area fill */}
          <path d={area} fill="url(#area-gradient)" />
          {/* Line */}
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1.5"
              fill="white"
              stroke={color}
              strokeWidth="1"
            />
          ))}
        </svg>
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 px-1">
          {data.filter((_, i) => i % 3 === 0 || i === data.length - 1).map((d, i) => (
            <span key={i} className="text-xs text-slate-400 dark:text-slate-500">
              {d.label}
            </span>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {minValue.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">Min</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {Math.round(avgValue).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">Avg</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {maxValue.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">Max</div>
        </div>
      </div>
    </Card>
  );
}

function DepartmentBreakdown({ data }: { data: DepartmentData[] }) {
  const totalUsers = data.reduce((sum, d) => sum + d.users, 0);
  const totalRecordings = data.reduce((sum, d) => sum + d.recordings, 0);

  // Calculate pie chart segments
  const pieSegments = useMemo(() => {
    let currentAngle = 0;
    return data.map((dept) => {
      const percentage = (dept.users / totalUsers) * 100;
      const angle = (percentage / 100) * 360;
      const segment = {
        ...dept,
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
      };
      currentAngle += angle;
      return segment;
    });
  }, [data, totalUsers]);

  // SVG arc path generator
  const describeArc = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${x} ${y} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  };

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  return (
    <Card variant="glass" className="p-6 bg-white/80 dark:bg-slate-900/80">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Department Breakdown
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Users and recordings by department
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg width="160" height="160" viewBox="0 0 100 100">
              {pieSegments.map((segment, i) => (
                <path
                  key={i}
                  d={describeArc(50, 50, 40, segment.startAngle, segment.endAngle - 0.5)}
                  fill={segment.color}
                  className="transition-opacity hover:opacity-80 cursor-pointer"
                />
              ))}
              {/* Inner circle for donut effect */}
              <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-slate-900" />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {totalUsers}
              </span>
              <span className="text-xs text-slate-500">Users</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {data.map((dept) => (
            <div
              key={dept.name}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: dept.color }}
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {dept.name}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {dept.users}
                </div>
                <div className="text-xs text-slate-500">{dept.recordings} rec.</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function QuickStats({
  totalRecordings,
  avgLength,
  accuracy,
  timeSaved,
}: {
  totalRecordings: number;
  avgLength: string;
  accuracy: number;
  timeSaved: number;
}) {
  const stats = [
    {
      icon: Mic,
      label: 'Total Recordings',
      value: totalRecordings.toLocaleString(),
      color: 'text-blue-500',
    },
    {
      icon: Calendar,
      label: 'Avg Length',
      value: avgLength,
      color: 'text-purple-500',
    },
    {
      icon: Sparkles,
      label: 'AI Accuracy',
      value: `${accuracy}%`,
      color: 'text-green-500',
    },
    {
      icon: TrendingUp,
      label: 'Time Saved',
      value: `${timeSaved}h`,
      color: 'text-amber-500',
    },
  ];

  return (
    <Card variant="glass" className="p-4 bg-white/80 dark:bg-slate-900/80">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {stat.value}
              </div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export interface AdoptionDashboardProps {
  className?: string;
}

export function AdoptionDashboard({ className = '' }: AdoptionDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const adoptionData = useAdoptionData();

  const currentActiveUsers = adoptionData.activeUsers[timeRange];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            Adoption Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track user engagement and feature adoption across your organization
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Quick Stats Bar */}
      <QuickStats
        totalRecordings={adoptionData.stats.totalRecordings}
        avgLength={adoptionData.stats.avgRecordingLength}
        accuracy={adoptionData.stats.transcriptionAccuracy}
        timeSaved={adoptionData.stats.timeSavedHours}
      />

      {/* Active Users Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Daily Active Users"
          value={adoptionData.activeUsers.daily.current}
          previousValue={adoptionData.activeUsers.daily.previous}
          icon={Users}
          color="blue"
          subtitle="Last 24 hours"
        />
        <MetricCard
          title="Weekly Active Users"
          value={adoptionData.activeUsers.weekly.current}
          previousValue={adoptionData.activeUsers.weekly.previous}
          icon={Activity}
          color="purple"
          subtitle="Last 7 days"
        />
        <MetricCard
          title="Monthly Active Users"
          value={adoptionData.activeUsers.monthly.current}
          previousValue={adoptionData.activeUsers.monthly.previous}
          icon={Layers}
          color="green"
          subtitle="Last 30 days"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeatureUsageChart data={adoptionData.featureUsage} />
        <AreaTrendChart
          data={adoptionData.recordingVolume}
          title="Recording Volume"
          subtitle="Weekly recordings over time"
          color="#8b5cf6"
        />
      </div>

      {/* Department Breakdown */}
      <DepartmentBreakdown data={adoptionData.departments} />

      {/* Engagement Insights */}
      <Card variant="glass" className="p-6 bg-white/80 dark:bg-slate-900/80">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Engagement Insights
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AI-powered recommendations to improve adoption
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              📈 High Growth Area
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Children&apos;s Services saw 34% increase in recordings this month
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
            <div className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
              ⚡ Feature Opportunity
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Offline mode usage is low—consider targeted training sessions
            </p>
          </div>
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900">
            <div className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
              ✅ Success Story
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              AI Summaries adoption increased 23% after last week&apos;s workshop
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AdoptionDashboard;
