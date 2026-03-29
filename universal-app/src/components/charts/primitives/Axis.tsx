/**
 * Axis Component - X/Y axis with labels and ticks
 * Universal Council App - Multi-tenant SaaS Platform
 */

'use client';

import React, { useMemo } from 'react';
import type { AxisProps } from '@/lib/charts/types';
import { generateTicks, formatNumber } from '@/lib/charts/utils';

export function Axis({
  type,
  scale,
  position,
  length,
  config = {},
  darkMode = false,
}: AxisProps) {
  const {
    show = true,
    title,
    tickCount = 5,
    tickFormat,
    min,
    max,
    gridLines = false,
  } = config;

  const textColor = 'var(--muted-foreground)';
  const lineColor = 'var(--border)';

  // Generate tick values
  const ticks = useMemo(() => {
    if (min !== undefined && max !== undefined) {
      return generateTicks([min, max], tickCount);
    }
    // If we don't have min/max, generate based on length
    return generateTicks([0, 100], tickCount);
  }, [min, max, tickCount]);

  const formatTick = (value: number) => {
    if (tickFormat) return tickFormat(value);
    return formatNumber(value);
  };

  if (!show) return null;

  const isXAxis = type === 'x';
  const tickSize = 6;
  const labelOffset = 20;

  return (
    <g
      className="chart-axis"
      role="presentation"
      aria-hidden="true"
    >
      {/* Axis line */}
      <line
        x1={isXAxis ? 0 : position}
        y1={isXAxis ? position : 0}
        x2={isXAxis ? length : position}
        y2={isXAxis ? position : length}
        stroke={lineColor}
        strokeWidth={1}
      />

      {/* Ticks and labels */}
      {ticks.map((tick, i) => {
        const tickPosition = scale(tick);
        
        return (
          <g key={`tick-${i}`}>
            {/* Tick mark */}
            <line
              x1={isXAxis ? tickPosition : position}
              y1={isXAxis ? position : tickPosition}
              x2={isXAxis ? tickPosition : position - tickSize}
              y2={isXAxis ? position + tickSize : tickPosition}
              stroke={lineColor}
              strokeWidth={1}
            />
            
            {/* Tick label */}
            <text
              x={isXAxis ? tickPosition : position - labelOffset}
              y={isXAxis ? position + labelOffset : tickPosition}
              fill={textColor}
              fontSize={11}
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor={isXAxis ? 'middle' : 'end'}
              dominantBaseline={isXAxis ? 'auto' : 'middle'}
            >
              {formatTick(tick)}
            </text>

            {/* Grid line (optional) */}
            {gridLines && (
              <line
                x1={isXAxis ? tickPosition : 0}
                y1={isXAxis ? 0 : tickPosition}
                x2={isXAxis ? tickPosition : length}
                y2={isXAxis ? position : tickPosition}
                stroke={lineColor}
                strokeWidth={1}
                strokeDasharray="4 4"
                opacity={0.5}
              />
            )}
          </g>
        );
      })}

      {/* Axis title */}
      {title && (
        <text
          x={isXAxis ? length / 2 : -length / 2}
          y={isXAxis ? position + 40 : position - 45}
          fill={textColor}
          fontSize={12}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={500}
          textAnchor="middle"
          transform={isXAxis ? undefined : `rotate(-90)`}
        >
          {title}
        </text>
      )}
    </g>
  );
}
