/**
 * Sparkline Component - Mini inline charts
 * Universal Council App - Multi-tenant SaaS Platform
 */

'use client';

import React, { useMemo, useId } from 'react';
import type { SparklineProps } from '@/lib/charts/types';
import { generateLinePath, generateCurvedPath, generateAreaPath } from '@/lib/charts/utils';

export function Sparkline({
  data,
  width = 120,
  height = 32,
  color = 'var(--primary)',
  fillColor,
  strokeWidth = 1.5,
  showMinMax = false,
  showLastValue = false,
  curved = true,
  className,
}: SparklineProps) {
  const uniqueId = useId();

  // Calculate min/max and normalize data
  const { normalizedPoints, min, max, minIndex, maxIndex, lastValue } = useMemo(() => {
    if (data.length === 0) {
      return { normalizedPoints: [], min: 0, max: 0, minIndex: -1, maxIndex: -1, lastValue: 0 };
    }

    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal || 1;

    // Add padding for points
    const paddingY = showMinMax ? 8 : 4;
    const paddingX = showLastValue ? 20 : 4;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    const points = data.map((value, index) => ({
      x: paddingX + (index / (data.length - 1)) * chartWidth,
      y: paddingY + (1 - (value - minVal) / range) * chartHeight,
      value,
    }));

    return {
      normalizedPoints: points,
      min: minVal,
      max: maxVal,
      minIndex: data.indexOf(minVal),
      maxIndex: data.indexOf(maxVal),
      lastValue: data[data.length - 1],
    };
  }, [data, width, height, showMinMax, showLastValue]);

  // Generate path
  const linePath = useMemo(() => {
    const points = normalizedPoints.map(p => ({ x: p.x, y: p.y }));
    return curved ? generateCurvedPath(points) : generateLinePath(points);
  }, [normalizedPoints, curved]);

  // Generate area path if fill color is specified
  const areaPath = useMemo(() => {
    if (!fillColor) return '';
    const points = normalizedPoints.map(p => ({ x: p.x, y: p.y }));
    return generateAreaPath(points, height - 4, curved);
  }, [normalizedPoints, fillColor, height, curved]);

  // Gradient ID for fill
  const gradientId = `sparkline-gradient-${uniqueId}`;

  if (data.length < 2) {
    return null;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={`Sparkline chart: minimum ${min}, maximum ${max}, latest ${lastValue}`}
    >
      {/* Gradient definition */}
      {fillColor && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity={0.4} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={0.05} />
          </linearGradient>
        </defs>
      )}

      {/* Area fill */}
      {fillColor && areaPath && (
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
        />
      )}

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Min/Max indicators */}
      {showMinMax && minIndex !== maxIndex && (
        <>
          {/* Min point */}
          <circle
            cx={normalizedPoints[minIndex].x}
            cy={normalizedPoints[minIndex].y}
            r={3}
            fill="var(--destructive)"
          />
          
          {/* Max point */}
          <circle
            cx={normalizedPoints[maxIndex].x}
            cy={normalizedPoints[maxIndex].y}
            r={3}
            fill="var(--success)"
          />
        </>
      )}

      {/* Last value indicator */}
      {showLastValue && normalizedPoints.length > 0 && (
        <>
          {/* Current point */}
          <circle
            cx={normalizedPoints[normalizedPoints.length - 1].x}
            cy={normalizedPoints[normalizedPoints.length - 1].y}
            r={3}
            fill={color}
          />
          
          {/* Value text */}
          <text
            x={width - 4}
            y={normalizedPoints[normalizedPoints.length - 1].y}
            fill={color}
            fontSize={10}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={500}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {formatCompact(lastValue)}
          </text>
        </>
      )}
    </svg>
  );
}

/**
 * Compact number formatting for sparklines
 */
function formatCompact(value: number): string {
  if (Math.abs(value) >= 1e6) {
    return (value / 1e6).toFixed(1) + 'M';
  }
  if (Math.abs(value) >= 1e3) {
    return (value / 1e3).toFixed(1) + 'K';
  }
  if (Math.abs(value) < 10) {
    return value.toFixed(1);
  }
  return Math.round(value).toString();
}

/**
 * Sparkline with trend indicator
 */
export function SparklineWithTrend({
  data,
  width = 120,
  height = 32,
  className,
  ...props
}: SparklineProps) {
  const trend = useMemo(() => {
    if (data.length < 2) return 0;
    const first = data[0];
    const last = data[data.length - 1];
    if (first === 0) return 0;
    return ((last - first) / Math.abs(first)) * 100;
  }, [data]);

  const trendColor = trend >= 0 ? 'var(--success)' : 'var(--destructive)';
  const trendIcon = trend >= 0 ? '↑' : '↓';

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Sparkline
        data={data}
        width={width}
        height={height}
        color={trendColor}
        fillColor={trendColor}
        {...props}
      />
      <span
        style={{
          color: trendColor,
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {trendIcon} {Math.abs(trend).toFixed(1)}%
      </span>
    </div>
  );
}

/**
 * Mini bar sparkline
 */
export function BarSparkline({
  data,
  width = 120,
  height = 32,
  color = 'var(--primary)',
  className,
}: Omit<SparklineProps, 'curved' | 'fillColor' | 'strokeWidth'>) {
  const bars = useMemo(() => {
    if (data.length === 0) return [];

    const max = Math.max(...data.map(Math.abs));
    const barWidth = Math.max(2, (width - data.length * 2) / data.length);
    const padding = 2;

    return data.map((value, index) => {
      const normalizedHeight = max > 0 ? (Math.abs(value) / max) * (height - padding * 2) : 0;
      const isNegative = value < 0;
      
      return {
        x: index * (barWidth + 2),
        y: isNegative ? height / 2 : height / 2 - normalizedHeight,
        width: barWidth,
        height: normalizedHeight,
        value,
        isNegative,
      };
    });
  }, [data, width, height]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={`Bar sparkline with ${data.length} values`}
    >
      {/* Zero line */}
      <line
        x1={0}
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="var(--border)"
        strokeWidth={1}
      />

      {/* Bars */}
      {bars.map((bar, index) => (
        <rect
          key={index}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          rx={1}
          fill={bar.isNegative ? 'var(--destructive)' : color}
          opacity={0.8}
        />
      ))}
    </svg>
  );
}
