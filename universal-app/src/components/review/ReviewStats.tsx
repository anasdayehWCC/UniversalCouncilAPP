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
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      label: 'Urgent',
      value: stats.urgentCount,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      highlight: stats.urgentCount > 0,
    },
    {
      label: 'Overdue',
      value: stats.overdueCount,
      icon: Timer,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      highlight: stats.overdueCount > 0,
    },
    {
      label: 'Approved Today',
      value: stats.totalApprovedToday,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
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
            <span className="text-sm font-medium text-slate-900">{card.value}</span>
            <span className="text-xs text-slate-500">{card.label}</span>
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
              card.highlight && card.value > 0 && 'ring-red-300',
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
                <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                  Needs attention
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-500">{card.label}</p>
          </Card>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average review time */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Timer className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">
                {formatDuration(stats.avgReviewTimeMs)}
              </p>
              <p className="text-sm text-slate-500">Avg. review time</p>
            </div>
          </div>
        </Card>

        {/* Weekly throughput */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-slate-900">{stats.throughputThisWeek}</p>
                {throughputTrend !== 0 && (
                  <span
                    className={cn(
                      'flex items-center text-xs font-medium',
                      throughputTrend > 0 ? 'text-green-600' : 'text-red-600'
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
              <p className="text-sm text-slate-500">This week&apos;s throughput</p>
            </div>
          </div>
        </Card>

        {/* In review */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{stats.totalInReview}</p>
              <p className="text-sm text-slate-500">Currently in review</p>
            </div>
          </div>
        </Card>
      </div>

      {/* By author breakdown */}
      {Object.keys(stats.byAuthor).length > 0 && (
        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-medium text-slate-700">Pending by Author</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byAuthor)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([author, count]) => (
                <Badge
                  key={author}
                  variant="secondary"
                  className="bg-slate-100 text-slate-700"
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
