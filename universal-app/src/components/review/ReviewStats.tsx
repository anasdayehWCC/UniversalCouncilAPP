'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Timer,
  Users,
  FileText,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReviewStats as ReviewStatsType } from '@/lib/review/types';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface ReviewStatsProps {
  stats: ReviewStatsType;
  className?: string;
  compact?: boolean;
}

export default function ReviewStats({ stats, className, compact = false }: ReviewStatsProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const formatDuration = (ms: number) => {
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const throughputTrend = stats.throughputThisWeek - stats.throughputLastWeek;
  const throughputPercent = stats.throughputLastWeek
    ? Math.round((throughputTrend / stats.throughputLastWeek) * 100)
    : 0;

  const cards = [
    {
      label: 'Pending Review',
      value: stats.totalPending,
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/30',
    },
    {
      label: 'Urgent',
      value: stats.urgentCount,
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      border: 'border-destructive/30',
      highlight: stats.urgentCount > 0,
    },
    {
      label: 'Overdue',
      value: stats.overdueCount,
      icon: Timer,
      color: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      highlight: stats.overdueCount > 0,
    },
    {
      label: 'Approved Today',
      value: stats.totalApprovedToday,
      icon: CheckCircle2,
      color: 'text-success',
      bg: 'bg-success/10',
      border: 'border-success/30',
    },
  ];

  if (compact) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        {cards.map(card => (
          <div
            key={card.label}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border',
              card.bg,
              card.border
            )}
          >
            <card.icon className={cn('w-4 h-4', card.color)} />
            <span className="text-sm font-medium text-foreground">{card.value}</span>
            <span className="text-xs text-muted-foreground">{card.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <Card
            key={card.label}
            className={cn(
              'p-4 border',
              card.border,
              card.highlight && 'ring-2 ring-offset-2',
              card.highlight && card.value > 0 && 'ring-destructive/30',
              !prefersReducedMotion && 'transition-all duration-300 hover:shadow-md'
            )}
            style={
              !prefersReducedMotion
                ? { animationDelay: `${index * 100}ms` }
                : undefined
            }
          >
            <div className="flex items-center justify-between mb-2">
              <div className={cn('p-2 rounded-lg', card.bg)}>
                <card.icon className={cn('w-5 h-5', card.color)} />
              </div>
              {card.highlight && card.value > 0 && (
                <Badge variant="secondary" className="bg-destructive/10 text-destructive text-xs">
                  Needs attention
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </Card>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average review time */}
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Timer className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {formatDuration(stats.avgReviewTimeMs)}
              </p>
              <p className="text-sm text-muted-foreground">Avg. review time</p>
            </div>
          </div>
        </Card>

        {/* Weekly throughput */}
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <BarChart3 className="w-5 h-5 text-info" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-foreground">{stats.throughputThisWeek}</p>
                {throughputTrend !== 0 && (
                  <span
                    className={cn(
                      'flex items-center text-xs font-medium',
                      throughputTrend > 0 ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {throughputTrend > 0 ? (
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                    )}
                    {Math.abs(throughputPercent)}%
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">This week&apos;s throughput</p>
            </div>
          </div>
        </Card>

        {/* In review */}
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{stats.totalInReview}</p>
              <p className="text-sm text-muted-foreground">Currently in review</p>
            </div>
          </div>
        </Card>
      </div>

      {/* By author breakdown */}
      {Object.keys(stats.byAuthor).length > 0 && (
        <Card className="p-4 border-border">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Pending by Author</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byAuthor)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([author, count]) => (
                <Badge
                  key={author}
                  variant="secondary"
                  className="bg-muted text-foreground"
                >
                  {author}: {count}
                </Badge>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
