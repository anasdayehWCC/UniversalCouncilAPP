'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@careminutes/ui/card'
import { Skeleton } from '@careminutes/ui/skeleton'
import { Badge } from '@careminutes/ui/badge'
import { useInsights } from '@/lib/insights'
import { AlertTriangle, BarChart3, Clock, Headphones, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatCard = {
  key: 'time_saved_minutes' | 'audio_minutes' | 'avg_audio_minutes'
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const statCards: StatCard[] = [
  { key: 'time_saved_minutes', label: 'Time saved (min)', icon: Sparkles },
  { key: 'audio_minutes', label: 'Audio processed (min)', icon: Headphones },
  { key: 'avg_audio_minutes', label: 'Avg recording length (min)', icon: Clock },
]

export default function InsightsPage() {
  const { data, isLoading, isError, refetch } = useInsights()

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Insights</h1>
          <p className="text-sm text-muted-foreground">
            Org/domain scoped metrics to show value delivered and top topics.
          </p>
        </div>
      </div>

      {isError && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
            <CardTitle className="text-amber-800 text-base">Unable to load insights</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-amber-800">Check your connection and try again.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-amber-700 px-3 py-1 text-white text-sm hover:bg-amber-800"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon
          const value = data ? data[card.key] : null
          return (
            <Card key={card.key} className="backdrop-blur bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className="text-2xl font-semibold">
                    {value?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? '—'}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="backdrop-blur bg-white/90">
        <CardHeader>
          <CardTitle>Top topics</CardTitle>
          <p className="text-sm text-muted-foreground">
            Extracted from the most recent minute versions (simple keyword frequency).
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          ) : data?.topics?.length ? (
            <div className="flex flex-wrap gap-2">
              {data.topics.map(({ topic, count }) => (
                <Badge
                  key={topic}
                  className={cn(
                    'bg-primary/10 text-primary border border-primary/20',
                    count > 3 && 'bg-primary/20 text-primary-foreground'
                  )}
                >
                  {topic} · {count}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No topics yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
