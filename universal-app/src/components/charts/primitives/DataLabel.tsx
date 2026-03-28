/**
 * DataLabel Component - Value labels for chart data points
 * Universal Council App - Multi-tenant SaaS Platform
 */

'use client';

import React from 'react';
import type { DataLabelProps } from '@/lib/charts/types';
import { formatNumber } from '@/lib/charts/utils';

export function DataLabel({
  x,
  y,
  value,
  anchor = 'middle',
  baseline = 'middle',
  offset = { x: 0, y: 0 },
  className,
  darkMode = false,
}: DataLabelProps) {
  const textColor = darkMode ? '#E5E7EB' : '#374151';
  
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <text
      x={x + offset.x}
      y={y + offset.y}
      fill={textColor}
      fontSize={11}
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight={500}
      textAnchor={anchor}
      dominantBaseline={baseline}
      className={className}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {displayValue}
    </text>
  );
}

/**
 * Animated data label with enter animation
 */
export function AnimatedDataLabel({
  x,
  y,
  value,
  anchor = 'middle',
  baseline = 'middle',
  offset = { x: 0, y: 0 },
  delay = 0,
  darkMode = false,
}: DataLabelProps & { delay?: number }) {
  const textColor = darkMode ? '#E5E7EB' : '#374151';
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <text
      x={x + offset.x}
      y={y + offset.y}
      fill={textColor}
      fontSize={11}
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight={500}
      textAnchor={anchor}
      dominantBaseline={baseline}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        opacity: 0,
        animation: `fadeInUp 300ms ease-out ${delay}ms forwards`,
      }}
    >
      {displayValue}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </text>
  );
}

/**
 * Percentage label for pie charts
 */
export function PercentageLabel({
  x,
  y,
  percentage,
  showIfAbove = 0.05,
  darkMode = false,
}: {
  x: number;
  y: number;
  percentage: number;
  showIfAbove?: number;
  darkMode?: boolean;
}) {
  if (percentage < showIfAbove) return null;

  const textColor = darkMode ? '#F9FAFB' : '#FFFFFF';
  const displayValue = `${Math.round(percentage * 100)}%`;

  return (
    <text
      x={x}
      y={y}
      fill={textColor}
      fontSize={12}
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight={600}
      textAnchor="middle"
      dominantBaseline="middle"
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      }}
    >
      {displayValue}
    </text>
  );
}
