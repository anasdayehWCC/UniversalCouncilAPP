'use client'

import Link from 'next/link'
import { BarChart3, Users, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@careminutes/ui/card'
import { Skeleton } from '@careminutes/ui/skeleton'
import { useInsights } from '@/lib/insights'

export function DashboardManager() {
  const { data, isLoading, isError, refetch } = useInsights()

  const stat = (label: string, value?: number, suffix = '') => (
    <Card className="bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <p className="text-2xl font-semibold">
            {value !== undefined ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) + suffix : '—'}
          </p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6" />
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/70">Manager cockpit</p>
            <h1 className="text-3xl font-semibold">Team insight snapshot</h1>
            <p className="text-white/80">Monitor throughput and focus areas without digging into each case.</p>
          </div>
        </div>
      </section>

      {isError && (
        <Card className="border-amber-200 bg-amber-50/80">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <CardTitle className="text-sm text-amber-800">Insights unavailable</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-800">
            Check connectivity and retry.{' '}
            <button
              className="underline font-semibold"
              onClick={() => refetch()}
              type="button"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {stat('Time saved (mins)', data?.time_saved_minutes)}
        {stat('Audio processed (mins)', data?.audio_minutes)}
        {stat('Avg recording length (mins)', data?.avg_audio_minutes)}
      </div>

      <Card className="bg-white/90 backdrop-blur">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Flagged reviews</CardTitle>
            <p className="text-sm text-muted-foreground">Coming from QA and task pipeline</p>
          </div>
          <Link href="/tasks" className="text-sm text-primary hover:underline">
            Go to tasks
          </Link>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No flagged items right now. Reviews will surface here when tasks are marked “Needs attention”.
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur">
        <CardHeader className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle>Team activity</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Team trends will render here once telemetry streams per-user counts (hook up to insights API v2).
        </CardContent>
      </Card>
    </div>
  )
}
