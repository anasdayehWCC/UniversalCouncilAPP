'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import type { SentimentTrend } from '@/lib/insights/types';

interface SentimentPieChartProps {
  data: SentimentTrend;
  title?: string;
  onSegmentClick?: (segment: 'positive' | 'neutral' | 'negative') => void;
  className?: string;
}

interface Segment {
  key: 'positive' | 'neutral' | 'negative';
  value: number;
  percentage: number;
  color: string;
  label: string;
  startAngle: number;
  endAngle: number;
}

const SEGMENT_CONFIG = {
  positive: { color: '#22c55e', darkColor: '#4ade80', label: 'Positive' },
  neutral: { color: '#94a3b8', darkColor: '#cbd5e1', label: 'Neutral' },
  negative: { color: '#ef4444', darkColor: '#f87171', label: 'Negative' },
};

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'L', x, y,
    'Z',
  ].join(' ');
}

export function SentimentPieChart({
  data,
  title = 'Sentiment Distribution',
  onSegmentClick,
  className = '',
}: SentimentPieChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const { segments, total } = useMemo(() => {
    const tot = data.positive + data.neutral + data.negative;
    const segs: Segment[] = [];

    if (tot === 0) {
      return { segments: [], total: 0 };
    }

    let currentAngle = 0;
    const order: Array<'positive' | 'neutral' | 'negative'> = ['positive', 'neutral', 'negative'];

    for (const key of order) {
      const value = data[key];
      const percentage = tot > 0 ? Math.round((value / tot) * 100) : 0;
      const angleSpan = (value / tot) * 360;

      segs.push({
        key,
        value,
        percentage,
        color: SEGMENT_CONFIG[key].color,
        label: SEGMENT_CONFIG[key].label,
        startAngle: currentAngle,
        endAngle: currentAngle + angleSpan,
      });

      currentAngle += angleSpan;
    }

    return { segments: segs, total: tot };
  }, [data]);

  const size = 200;
  const center = size / 2;
  const radius = 80;
  const innerRadius = 50;

  return (
    <Card variant="glass" className={`p-6 bg-white/80 dark:bg-slate-900/80 ${className}`} hoverEffect={false}>
      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-6 font-display">{title}</h3>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Pie Chart */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="1"
              className="text-slate-100 dark:text-slate-800"
            />

            {/* Segments */}
            {segments.map(segment => {
              const isHovered = hoveredSegment === segment.key;
              const scale = isHovered ? 1.05 : 1;
              const path = describeArc(center, center, radius, segment.startAngle, segment.endAngle);

              return (
                <g key={segment.key}>
                  <path
                    d={path}
                    fill={segment.color}
                    stroke="white"
                    strokeWidth="2"
                    style={{
                      transformOrigin: `${center}px ${center}px`,
                      transform: `scale(${scale})`,
                      transition: 'transform 0.2s ease-out, filter 0.2s ease-out',
                      filter: isHovered ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' : 'none',
                      cursor: onSegmentClick ? 'pointer' : 'default',
                    }}
                    onMouseEnter={() => setHoveredSegment(segment.key)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() => onSegmentClick?.(segment.key)}
                  />
                </g>
              );
            })}

            {/* Inner circle (donut effect) */}
            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              fill="white"
              className="dark:fill-slate-900"
            />

            {/* Center text */}
            <text
              x={center}
              y={center - 8}
              textAnchor="middle"
              className="text-2xl font-bold fill-slate-900 dark:fill-slate-100"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {total}
            </text>
            <text
              x={center}
              y={center + 12}
              textAnchor="middle"
              className="text-xs fill-slate-500 dark:fill-slate-400"
            >
              Total
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 flex-1">
          {segments.map(segment => (
            <div
              key={segment.key}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                hoveredSegment === segment.key
                  ? 'bg-slate-100 dark:bg-slate-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
              onMouseEnter={() => setHoveredSegment(segment.key)}
              onMouseLeave={() => setHoveredSegment(null)}
              onClick={() => onSegmentClick?.(segment.key)}
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {segment.label}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {segment.percentage}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${segment.percentage}%`,
                      backgroundColor: segment.color,
                    }}
                  />
                </div>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-2 w-8 text-right">
                {segment.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {total > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {data.positive > data.negative ? (
              <span className="text-green-600 dark:text-green-400">
                ✓ Overall positive sentiment ({Math.round((data.positive / total) * 100)}%)
              </span>
            ) : data.negative > data.positive ? (
              <span className="text-red-600 dark:text-red-400">
                ⚠ Elevated negative sentiment ({Math.round((data.negative / total) * 100)}%)
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                Balanced sentiment distribution
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default SentimentPieChart;
