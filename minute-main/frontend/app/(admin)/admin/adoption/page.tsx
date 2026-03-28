'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@careminutes/ui'
import {
  Users,
  Mic,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DailyRecordingCount {
  date: string
  count: number
}

interface ModuleUsageItem {
  module_id: string
  access_count: number
  unique_users: number
}

interface OfflineQueueStats {
  pending: number
  in_progress: number
  completed_today: number
  failed_today: number
}

interface AdoptionMetrics {
  total_users: number
  active_users_today: number
  active_users_week: number
  total_recordings: number
  recordings_today: number
  total_minutes_generated: number
  minutes_today: number
}

interface AdoptionDashboardData {
  metrics: AdoptionMetrics
  recordings_by_day: DailyRecordingCount[]
  top_modules: ModuleUsageItem[]
  offline_queue: OfflineQueueStats
}

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  trendLabel,
}: {
  title: string
  value: number | string
  subValue?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
}) {
  return (
    <Card className="glass-card hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
        {trend && trendLabel && (
          <div className="flex items-center mt-1">
            {trend === 'up' && (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            )}
            {trend === 'down' && (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span
              className={`text-xs ${
                trend === 'up'
                  ? 'text-green-500'
                  : trend === 'down'
                  ? 'text-red-500'
                  : 'text-muted-foreground'
              }`}
            >
              {trendLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SparklineChart({ data }: { data: DailyRecordingCount[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="h-24 flex items-end gap-[2px]">
      {data.map((d) => {
        const height = (d.count / maxCount) * 100
        return (
          <div
            key={d.date}
            className="group relative flex-1 flex items-end"
            style={{ height: '100%' }}
          >
            <div
              className="w-full bg-primary/60 hover:bg-primary transition-colors rounded-t-sm"
              style={{ height: `${Math.max(height, 2)}%` }}
            />
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {d.date}: {d.count} recordings
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ModuleUsageList({ modules }: { modules: ModuleUsageItem[] }) {
  if (!modules || modules.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No module usage data yet
      </div>
    )
  }

  const maxAccess = Math.max(...modules.map((m) => m.access_count), 1)

  return (
    <div className="space-y-3">
      {modules.map((module) => {
        const percentage = (module.access_count / maxAccess) * 100
        return (
          <div key={module.module_id} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium capitalize">
                {module.module_id.replace(/_/g, ' ')}
              </span>
              <span className="text-muted-foreground">
                {module.access_count} uses · {module.unique_users} users
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OfflineQueueStatus({ stats }: { stats: OfflineQueueStats }) {
  const items = [
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'In Progress',
      value: stats.in_progress,
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Completed Today',
      value: stats.completed_today,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Failed Today',
      value: stats.failed_today,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`p-3 rounded-lg ${item.bgColor} flex items-center gap-3`}
        >
          <item.icon className={`h-5 w-5 ${item.color}`} />
          <div>
            <div className="text-lg font-bold">{item.value}</div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdoptionDashboardPage() {
  const [data, setData] = useState<AdoptionDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState(30)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/proxy/admin/adoption?days=${timeRange}`)
      if (!res.ok) throw new Error('Failed to fetch adoption data')
      const json = await res.json()
      setData(json)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Adoption Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
        <p className="text-muted-foreground mb-4">{error || 'No data available'}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    )
  }

  const { metrics, recordings_by_day, top_modules, offline_queue } = data

  // Calculate trends
  const recentRecordings = recordings_by_day.slice(-7)
  const olderRecordings = recordings_by_day.slice(-14, -7)
  const recentTotal = recentRecordings.reduce((acc, d) => acc + d.count, 0)
  const olderTotal = olderRecordings.reduce((acc, d) => acc + d.count, 0)
  const recordingTrend =
    recentTotal > olderTotal ? 'up' : recentTotal < olderTotal ? 'down' : 'neutral'
  const trendPercentage =
    olderTotal > 0
      ? Math.round(((recentTotal - olderTotal) / olderTotal) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Adoption Dashboard</h1>
          <p className="text-muted-foreground">
            Track usage trends and platform adoption
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Time range:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="bg-background border rounded-md px-3 py-1.5 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={metrics.total_users}
          subValue={`${metrics.active_users_today} active today`}
          icon={Users}
        />
        <MetricCard
          title="Total Recordings"
          value={metrics.total_recordings}
          subValue={`${metrics.recordings_today} today`}
          icon={Mic}
          trend={recordingTrend}
          trendLabel={`${trendPercentage >= 0 ? '+' : ''}${trendPercentage}% vs last week`}
        />
        <MetricCard
          title="Minutes Generated"
          value={metrics.total_minutes_generated}
          subValue={`${metrics.minutes_today} today`}
          icon={FileText}
        />
        <MetricCard
          title="Active This Week"
          value={metrics.active_users_week}
          subValue="unique users"
          icon={Activity}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recordings Trend */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recordings Trend
            </CardTitle>
            <CardDescription>
              Daily recording volume over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SparklineChart data={recordings_by_day} />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{recordings_by_day[0]?.date || ''}</span>
              <span>{recordings_by_day[recordings_by_day.length - 1]?.date || ''}</span>
            </div>
          </CardContent>
        </Card>

        {/* Top Modules */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Top Modules
            </CardTitle>
            <CardDescription>
              Most used features across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModuleUsageList modules={top_modules} />
          </CardContent>
        </Card>
      </div>

      {/* Offline Queue Status */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-5 w-5" />
            Offline Queue Health
          </CardTitle>
          <CardDescription>
            Status of offline recordings being synced to the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OfflineQueueStatus stats={offline_queue} />
        </CardContent>
      </Card>
    </div>
  )
}
