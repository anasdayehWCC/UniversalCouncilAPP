'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { TrendDataPoint } from '@/lib/insights/types';

interface TeamActivityChartProps {
  data: TrendDataPoint[];
  title?: string;
  className?: string;
}

type MetricToggle = 'recordings' | 'minutes' | 'approvals';

const METRIC_CONFIG: Record<MetricToggle, { label: string; color: string; gradient: string }> = {
  recordings: {
    label: 'Recordings',
    color: '#3b82f6',
    gradient: 'from-blue-500/20 to-blue-500/0',
  },
  minutes: {
    label: 'Minutes',
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-emerald-500/0',
  },
  approvals: {
    label: 'Approvals',
    color: '#a855f7',
    gradient: 'from-purple-500/20 to-purple-500/0',
  },
};

export function TeamActivityChart({ data, title = 'Team Activity', className = '' }: TeamActivityChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricToggle>('recordings');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { values, maxValue, barWidth, chartHeight } = useMemo(() => {
    const vals = data.map(d => d[activeMetric]);
    const max = Math.max(...vals, 1);
    const bw = data.length > 0 ? Math.min(40, 280 / data.length) : 40;
    return { values: vals, maxValue: max, barWidth: bw, chartHeight: 200 };
  }, [data, activeMetric]);

  const config = METRIC_CONFIG[activeMetric];

  return (
    <Card variant="glass" className={`p-6 bg-card/80 ${className}`} hoverEffect={false}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="font-bold text-lg text-foreground font-display">{title}</h3>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(Object.keys(METRIC_CONFIG) as MetricToggle[]).map(metric => (
            <Button
              key={metric}
              variant={activeMetric === metric ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveMetric(metric)}
              className={`text-xs px-3 ${
                activeMetric === metric
                  ? 'bg-background shadow-sm'
                  : 'hover:bg-background/50'
              }`}
            >
              {METRIC_CONFIG[metric].label}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative" style={{ height: chartHeight + 40 }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-muted-foreground">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue / 2)}</span>
          <span>0</span>
        </div>

        {/* Grid lines */}
        <div className="absolute left-12 right-0 top-0 bottom-8">
          {[0, 0.5, 1].map(pct => (
            <div
              key={pct}
              className="absolute w-full border-t border-border"
              style={{ top: `${pct * 100}%` }}
            />
          ))}
        </div>

        {/* Bars */}
        <div
          className="absolute left-12 right-0 top-0 flex items-end justify-around gap-1"
          style={{ height: chartHeight }}
        >
          {data.map((point, i) => {
            const height = maxValue > 0 ? (values[i] / maxValue) * chartHeight : 0;
            const isHovered = hoveredIndex === i;

            return (
              <div
                key={point.date}
                className="relative flex flex-col items-center"
                style={{ width: barWidth }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 z-10 bg-popover text-popover-foreground text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap border border-border">
                    <div className="font-semibold">{point.label}</div>
                    <div className="text-muted-foreground">
                      {values[i]} {config.label.toLowerCase()}
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-popover border-r border-b border-border" />
                  </div>
                )}

                {/* Bar */}
                <div
                  className={`rounded-t-md transition-all duration-300 cursor-pointer ${
                    isHovered ? 'opacity-100 scale-105' : 'opacity-80'
                  }`}
                  style={{
                    width: barWidth - 4,
                    height: Math.max(4, height),
                    background: `linear-gradient(180deg, ${config.color} 0%, ${config.color}99 100%)`,
                    boxShadow: isHovered ? `0 4px 20px ${config.color}40` : 'none',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="absolute left-12 right-0 bottom-0 flex justify-around">
          {data.map((point, i) => (
            <div
              key={point.date}
              className={`text-xs text-center transition-colors ${
                hoveredIndex === i
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              }`}
              style={{ width: barWidth }}
            >
              {point.label.substring(0, 3)}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-sm text-muted-foreground">
            Total {config.label}: <span className="font-semibold text-foreground">{values.reduce((a, b) => a + b, 0)}</span>
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {data.length} data points
        </div>
      </div>
    </Card>
  );
}

export default TeamActivityChart;
