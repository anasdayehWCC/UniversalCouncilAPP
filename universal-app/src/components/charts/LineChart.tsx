/**
 * LineChart Component - Time series line charts
 * Universal Council App - Multi-tenant SaaS Platform
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import type { LineChartProps } from '@/lib/charts/types';
import { useChart } from '@/hooks/useChart';
import { Grid } from './primitives/Grid';
import { Legend } from './primitives/Legend';
import { Tooltip } from './primitives/Tooltip';
import {
  generateLinePath,
  generateCurvedPath,
  generateAreaPath,
  generateAriaDescription,
  formatNumber,
} from '@/lib/charts/utils';

export function LineChart({
  data,
  config,
  className,
  id,
  curved = true,
  showPoints = true,
  pointRadius = 4,
  strokeWidth = 2,
  showArea = false,
  areaOpacity = 0.2,
  onPointClick,
  onPointHover,
}: LineChartProps) {
  const {
    dimensions,
    containerRef,
    xScale,
    yScale,
    colors,
    getSeriesColor,
    interaction,
    handlePointHover,
    handlePointClick,
    hideTooltip,
    animatedProgress,
    isDarkMode,
  } = useChart({ data, config, type: 'line' });

  // Generate line paths
  const paths = useMemo(() => {
    if (!xScale || !yScale) return [];

    return data.series.map((series, seriesIndex) => {
      const color = series.color || getSeriesColor(seriesIndex);
      const width = series.strokeWidth || strokeWidth;

      const points = series.data.map(point => ({
        x: xScale(point.x),
        y: yScale(point.y * animatedProgress + (1 - animatedProgress) * (yScale(0) ? 0 : point.y)),
      }));

      const linePath = curved ? generateCurvedPath(points) : generateLinePath(points);
      const areaPath = showArea 
        ? generateAreaPath(points, dimensions.innerHeight, curved)
        : undefined;

      return {
        series,
        seriesIndex,
        color,
        width,
        points,
        linePath,
        areaPath,
      };
    });
  }, [data.series, xScale, yScale, curved, showArea, strokeWidth, dimensions.innerHeight, getSeriesColor, animatedProgress]);

  // Render lines
  const renderLines = useCallback(() => {
    return paths.map(({ series, seriesIndex, color, width, linePath, areaPath }) => {
      const isSeriesHovered = interaction.hoveredSeries?.id === series.id;
      
      return (
        <g key={`line-${series.id}`}>
          {/* Area fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill={color}
              opacity={areaOpacity * (isSeriesHovered ? 1.5 : 1)}
              style={{ transition: 'opacity 200ms ease' }}
            />
          )}
          
          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={isSeriesHovered ? width + 1 : width}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: 'stroke-width 200ms ease',
              strokeDasharray: animatedProgress < 1 ? '1000' : 'none',
              strokeDashoffset: (1 - animatedProgress) * 1000,
            }}
          />
        </g>
      );
    });
  }, [paths, areaOpacity, interaction.hoveredSeries, animatedProgress]);

  // Render data points
  const renderPoints = useCallback(() => {
    if (!showPoints) return null;

    return paths.flatMap(({ series, seriesIndex, color, points }) => 
      series.data.map((point, pointIndex) => {
        const { x, y } = points[pointIndex];
        const isHovered = interaction.hoveredPoint?.x === point.x &&
                         interaction.hoveredPoint?.y === point.y;
        const radius = isHovered ? pointRadius * 1.5 : pointRadius;

        return (
          <circle
            key={`point-${series.id}-${pointIndex}`}
            cx={x}
            cy={y}
            r={radius * animatedProgress}
            fill="var(--card)"
            stroke={color}
            strokeWidth={2}
            style={{
              cursor: onPointClick ? 'pointer' : 'default',
              transition: 'r 150ms ease',
            }}
            onMouseEnter={(e) => {
              handlePointHover(point, series, e);
              onPointHover?.(point, series);
            }}
            onMouseLeave={() => {
              handlePointHover(null);
              onPointHover?.(null);
            }}
            onClick={() => {
              handlePointClick(point, series);
              onPointClick?.(point, series);
            }}
            role="graphics-symbol"
            aria-label={`${series.name}: value ${formatNumber(point.y)}`}
          />
        );
      })
    );
  }, [paths, showPoints, pointRadius, interaction.hoveredPoint, isDarkMode, 
      handlePointHover, handlePointClick, onPointClick, onPointHover, animatedProgress]);

  // Legend items
  const legendItems = useMemo(() => {
    return data.series.map((series, index) => ({
      id: series.id,
      name: series.name,
      color: series.color || getSeriesColor(index),
      active: true,
    }));
  }, [data.series, getSeriesColor]);

  // Axis ticks
  const yTicks = useMemo(() => {
    if (!yScale) return [];
    const domain = [0, 100]; // Will be replaced with actual domain
    const count = 5;
    return Array.from({ length: count }, (_, i) => {
      const value = (i / (count - 1)) * 100;
      return { value, y: yScale(value) };
    });
  }, [yScale]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', minHeight: 200 }}
    >
      <svg
        id={id}
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        role="img"
        aria-label={generateAriaDescription(data, 'Line')}
      >
        {/* Background */}
        <rect
          width={dimensions.width}
          height={dimensions.height}
          fill="var(--card)"
        />

        {/* Chart area */}
        <g transform={`translate(${dimensions.margin.left}, ${dimensions.margin.top})`}>
          {/* Grid */}
          <Grid
            width={dimensions.innerWidth}
            height={dimensions.innerHeight}
            xScale={xScale || undefined}
            yScale={yScale || undefined}
            config={config?.grid}
            darkMode={isDarkMode}
          />

          {/* Zero line */}
          {yScale && (
            <line
              x1={0}
              y1={yScale(0)}
              x2={dimensions.innerWidth}
              y2={yScale(0)}
              stroke="var(--border)"
              strokeWidth={1}
            />
          )}

          {/* Lines and areas */}
          {renderLines()}

          {/* Data points */}
          {renderPoints()}
        </g>

        {/* Y-axis labels */}
        {yTicks.map(({ value, y }, i) => (
          <text
            key={`y-label-${i}`}
            x={dimensions.margin.left - 8}
            y={dimensions.margin.top + y}
            fill="var(--muted-foreground)"
            fontSize={11}
            fontFamily="system-ui, -apple-system, sans-serif"
            textAnchor="end"
            dominantBaseline="middle"
          >
            {formatNumber(value)}
          </text>
        ))}
      </svg>

      {/* Legend */}
      {config?.legend?.show !== false && data.series.length > 1 && (
        <Legend
          items={legendItems}
          config={config?.legend}
          darkMode={isDarkMode}
        />
      )}

      {/* Tooltip */}
      <Tooltip
        visible={interaction.tooltip.visible}
        x={interaction.tooltip.x}
        y={interaction.tooltip.y}
        content={interaction.tooltip.content}
        darkMode={isDarkMode}
      />
    </div>
  );
}
