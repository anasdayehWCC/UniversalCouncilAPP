/**
 * Grid Component - Background grid lines for charts
 * Universal Council App - Multi-tenant SaaS Platform
 */

'use client';

import React, { useMemo } from 'react';
import type { GridProps } from '@/lib/charts/types';
import { generateTicks } from '@/lib/charts/utils';

export function Grid({
  width,
  height,
  xScale,
  yScale,
  config = {},
  darkMode = false,
}: GridProps) {
  const {
    show = true,
    strokeDasharray = '4 4',
    opacity = 0.3,
    horizontal = true,
    vertical = true,
  } = config;

  const lineColor = darkMode ? '#4B5563' : '#E5E7EB';

  // Generate horizontal lines
  const horizontalLines = useMemo(() => {
    if (!horizontal || !yScale) return [];
    const ticks = generateTicks([0, height], 6);
    return ticks.map(tick => yScale(tick));
  }, [horizontal, yScale, height]);

  // Generate vertical lines
  const verticalLines = useMemo(() => {
    if (!vertical || !xScale) return [];
    const ticks = generateTicks([0, width], 6);
    return ticks.map(tick => xScale(tick));
  }, [vertical, xScale, width]);

  if (!show) return null;

  return (
    <g className="chart-grid" role="presentation" aria-hidden="true">
      {/* Horizontal lines */}
      {horizontal && horizontalLines.map((y, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke={lineColor}
          strokeWidth={1}
          strokeDasharray={strokeDasharray}
          opacity={opacity}
        />
      ))}

      {/* Vertical lines */}
      {vertical && verticalLines.map((x, i) => (
        <line
          key={`v-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke={lineColor}
          strokeWidth={1}
          strokeDasharray={strokeDasharray}
          opacity={opacity}
        />
      ))}
    </g>
  );
}
