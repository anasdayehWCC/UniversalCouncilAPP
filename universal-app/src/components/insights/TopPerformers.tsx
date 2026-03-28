'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, TrendingDown, Minus, Clock, BarChart3, Target } from 'lucide-react';
import type { TopPerformer, LeaderboardCategory } from '@/lib/insights/types';

interface TopPerformersProps {
  data: {
    completion: TopPerformer[];
    turnaround: TopPerformer[];
    volume: TopPerformer[];
  };
  title?: string;
  className?: string;
}

const CATEGORY_CONFIG: Record<LeaderboardCategory, { label: string; icon: typeof Trophy; description: string }> = {
  completion: {
    label: 'Completion Rate',
    icon: Target,
    description: 'Highest approval rates',
  },
  turnaround: {
    label: 'Turnaround Time',
    icon: Clock,
    description: 'Fastest processing times',
  },
  volume: {
    label: 'Volume',
    icon: BarChart3,
    description: 'Most recordings submitted',
  },
};

const RANK_STYLES = [
  { bg: 'bg-gradient-to-r from-yellow-400 to-amber-500', text: 'text-white', shadow: 'shadow-amber-200' },
  { bg: 'bg-gradient-to-r from-slate-300 to-slate-400', text: 'text-white', shadow: 'shadow-slate-200' },
  { bg: 'bg-gradient-to-r from-orange-400 to-amber-600', text: 'text-white', shadow: 'shadow-orange-200' },
];

function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLES[rank - 1] || { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', shadow: '' };
  
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${style.bg} ${style.text} ${style.shadow} shadow-sm`}
    >
      {rank <= 3 ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : rank}
    </div>
  );
}

function TrendIndicator({ trend, value }: { trend: TopPerformer['trend']; value: number }) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const colors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    stable: 'text-slate-400 dark:text-slate-500',
  };

  return (
    <div className={`flex items-center gap-1 ${colors[trend]}`}>
      <Icon className="w-3 h-3" />
      {trend !== 'stable' && (
        <span className="text-xs font-medium">{value}%</span>
      )}
    </div>
  );
}

function PerformerRow({ performer, showMetric = true }: { performer: TopPerformer; showMetric?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <RankBadge rank={performer.rank} />
      
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300 border-2 border-white dark:border-slate-700 shadow-sm">
        {performer.userName.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
            {performer.userName}
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
            {performer.userRole.replace('_', ' ')}
          </Badge>
        </div>
        {showMetric && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {performer.metricLabel}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {typeof performer.metric === 'number'
              ? performer.metric % 1 === 0
                ? performer.metric
                : performer.metric.toFixed(1)
              : performer.metric}
          </div>
        </div>
        <TrendIndicator trend={performer.trend} value={performer.trendValue} />
      </div>
    </div>
  );
}

export function TopPerformers({ data, title = 'Top Performers', className = '' }: TopPerformersProps) {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('completion');
  const performers = data[activeCategory] || [];
  const config = CATEGORY_CONFIG[activeCategory];
  const CategoryIcon = config.icon;

  return (
    <Card variant="glass" className={`p-6 bg-white/80 dark:bg-slate-900/80 ${className}`} hoverEffect={false}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 shadow-sm">
          <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 font-display">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{config.description}</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-4">
        {(Object.keys(CATEGORY_CONFIG) as LeaderboardCategory[]).map(category => {
          const Icon = CATEGORY_CONFIG[category].icon;
          return (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className={`flex-1 text-xs gap-1.5 ${
                activeCategory === category
                  ? 'bg-white dark:bg-slate-700 shadow-sm'
                  : 'hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{CATEGORY_CONFIG[category].label}</span>
            </Button>
          );
        })}
      </div>

      {/* Performers List */}
      <div className="space-y-1">
        {performers.length > 0 ? (
          performers.map(performer => (
            <PerformerRow key={performer.userId} performer={performer} />
          ))
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <CategoryIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No data available</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {performers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            View all team members →
          </Button>
        </div>
      )}
    </Card>
  );
}

export default TopPerformers;
