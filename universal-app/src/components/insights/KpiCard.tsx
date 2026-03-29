'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type KpiColor = 'blue' | 'green' | 'purple' | 'orange' | 'emerald' | 'rose' | 'amber' | 'cyan';

export interface SparklineData {
  value: number;
  label?: string;
}

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon?: LucideIcon;
  color?: KpiColor;
  sparklineData?: SparklineData[];
  onClick?: () => void;
  className?: string;
}

const colorStyles: Record<KpiColor, { bg: string; text: string; fill: string; border: string }> = {
  blue: { bg: 'bg-primary/10', text: 'text-primary', fill: '#3b82f6', border: 'border-primary/20' },
  green: { bg: 'bg-success/10', text: 'text-success', fill: '#22c55e', border: 'border-success/20' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-600 dark:text-purple-400', fill: '#a855f7', border: 'border-purple-100 dark:border-purple-900' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/50', text: 'text-orange-600 dark:text-orange-400', fill: '#f97316', border: 'border-orange-100 dark:border-orange-900' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-600 dark:text-emerald-400', fill: '#10b981', border: 'border-emerald-100 dark:border-emerald-900' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-600 dark:text-rose-400', fill: '#f43f5e', border: 'border-rose-100 dark:border-rose-900' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-600 dark:text-amber-400', fill: '#f59e0b', border: 'border-amber-100 dark:border-amber-900' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/50', text: 'text-cyan-600 dark:text-cyan-400', fill: '#06b6d4', border: 'border-cyan-100 dark:border-cyan-900' },
};

function Sparkline({ data, color }: { data: SparklineData[]; color: string }) {
  const { path, area, width, height } = useMemo(() => {
    const w = 80;
    const h = 24;
    const padding = 2;
    
    if (data.length < 2) {
      return { path: '', area: '', width: w, height: h };
    }

    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values.map((v, i) => ({
      x: padding + (i / (values.length - 1)) * (w - padding * 2),
      y: h - padding - ((v - min) / range) * (h - padding * 2),
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

    return { path: linePath, area: areaPath, width: w, height: h };
  }, [data]);

  if (data.length < 2) return null;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sparkline-gradient-${color})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  color = 'blue',
  sparklineData,
  onClick,
  className = '',
}: KpiCardProps) {
  const styles = colorStyles[color];
  const hasTrend = typeof trend === 'number';
  const isPositive = hasTrend && trend > 0;
  const isNeutral = hasTrend && trend === 0;

  const TrendIcon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown;
  const trendColor = isPositive
    ? 'text-success bg-success/10 border-success/20'
    : isNeutral
    ? 'text-muted-foreground bg-muted border-border'
    : 'text-destructive bg-destructive/10 border-destructive/20';

  return (
    <Card
      variant="glass"
      className={`p-6 hover:shadow-xl transition-all bg-card/80 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      hoverEffect={!!onClick}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        {Icon && (
          <div className={`p-3 rounded-xl ${styles.bg} ${styles.border} border shadow-sm`}>
            <Icon className={`w-5 h-5 ${styles.text}`} />
          </div>
        )}
        {hasTrend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span>{isPositive ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div className="flex-1">
          <h3 className="text-3xl font-bold text-foreground mb-1 font-display">
            {value}
          </h3>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          {(subtitle || trendLabel) && (
            <p className="text-xs text-muted-foreground mt-1">
              {subtitle || trendLabel}
            </p>
          )}
        </div>

        {sparklineData && sparklineData.length > 1 && (
          <div className="ml-4 flex-shrink-0">
            <Sparkline data={sparklineData} color={styles.fill} />
          </div>
        )}
      </div>
    </Card>
  );
}

export default KpiCard;
