/**
 * AreaChart Component - Filled area charts
 * Universal Council App - Multi-tenant SaaS Platform
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import type { AreaChartProps } from '@/lib/charts/types';
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
  withOpacity,
  stackData,
} from '@/lib/charts/utils';

export function AreaChart({
  data: rawData,
  config,
  className,
  id,
  stacked = false,
  curved = true,
  fillOpacity = 0.4,
  showLine = true,
  showPoints = false,
  onPointClick,
  onPointHover,
}: AreaChartProps) {
  // Stack data if needed
  const data = useMemo(() => {
    return stacked ? stackData(rawData) : rawData;
  }, [rawData, stacked]);

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
    animatedProgress,
    isDarkMode,
  } = useChart({ data, config, type: 'area' });

  // Generate area paths
  const areas = useMemo(() => {
    if (!xScale || !yScale) return [];

    // For stacked areas, we need to render in reverse order
    const seriesList = stacked ? [...data.series].reverse() : data.series;

    return seriesList.map((series, i) => {
      const originalIndex = stacked ? data.series.length - 1 - i : i;
      const color = series.color || getSeriesColor(originalIndex);
      
      const points = series.data.map(point => ({
        x: xScale(point.x),
        y: yScale(point.y * animatedProgress),
      }));

      // Get baseline for stacked charts
      let baseline = dimensions.innerHeight;
      if (stacked && i < seriesList.length - 1) {
        const prevSeries = seriesList[i + 1];
        baseline = yScale(0); // Will be overridden per-point for proper stacking
      }

      const linePath = curved ? generateCurvedPath(points) : generateLinePath(points);
      
      // For stacked areas, calculate baseline from previous series
      let areaPath: string;
      if (stacked) {
        const baselinePoints = series.data.map((point, idx) => {
          const pointBaseline = (point.metadata?.baseline as number) || 0;
          return {
            x: xScale(point.x),
            y: yScale(pointBaseline * animatedProgress),
          };
        }).reverse();
        
        // Create area path manually
        const topPath = curved ? generateCurvedPath(points) : generateLinePath(points);
        const bottomPath = curved 
          ? generateCurvedPath(baselinePoints).replace('M', 'L')
          : generateLinePath(baselinePoints).replace('M', 'L');
        
        areaPath = `${topPath} ${bottomPath} Z`;
      } else {
        areaPath = generateAreaPath(points, dimensions.innerHeight, curved);
      }

      return {
        series,
        originalIndex,
        color,
        points,
        linePath,
        areaPath,
      };
    });
  }, [data.series, xScale, yScale, curved, stacked, dimensions.innerHeight, getSeriesColor, animatedProgress]);

  // Render areas
  const renderAreas = useCallback(() => {
    return areas.map(({ series, originalIndex, color, linePath, areaPath }) => {
      const isSeriesHovered = interaction.hoveredSeries?.id === series.id;
      const opacity = isSeriesHovered ? fillOpacity * 1.5 : fillOpacity;

      return (
        <g key={`area-${series.id}`}>
          {/* Area fill */}
          <path
            d={areaPath}
            fill={color}
            opacity={opacity}
            style={{ transition: 'opacity 200ms ease' }}
          />
          
          {/* Line on top */}
          {showLine && (
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth={isSeriesHovered ? 3 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'stroke-width 200ms ease' }}
            />
          )}
        </g>
      );
    });
  }, [areas, fillOpacity, showLine, interaction.hoveredSeries]);

  // Render data points
  const renderPoints = useCallback(() => {
    if (!showPoints) return null;

    return areas.flatMap(({ series, originalIndex, color, points }) =>
      series.data.map((point, pointIndex) => {
        const { x, y } = points[pointIndex];
        const isHovered = interaction.hoveredPoint?.x === point.x &&
                         interaction.hoveredSeries?.id === series.id;

        return (
          <circle
            key={`point-${series.id}-${pointIndex}`}
            cx={x}
            cy={y}
            r={isHovered ? 6 : 4}
            fill={isDarkMode ? '#1F2937' : '#FFFFFF'}
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
  }, [areas, showPoints, interaction.hoveredPoint, interaction.hoveredSeries, isDarkMode,
      handlePointHover, handlePointClick, onPointClick, onPointHover]);

  // Hover detection rectangles (for better hover UX)
  const renderHoverZones = useCallback(() => {
    if (!xScale) return null;

    // Create vertical hover zones for each data point
    const allXValues = new Set<number | string>();
    data.series.forEach(series => {
      series.data.forEach(point => allXValues.add(point.x as number | string));
    });

    const sortedX = Array.from(allXValues).sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b));
    });

    return sortedX.map((xValue, i) => {
      const x = xScale(xValue);
      const prevX = i > 0 ? xScale(sortedX[i - 1]) : 0;
      const nextX = i < sortedX.length - 1 ? xScale(sortedX[i + 1]) : dimensions.innerWidth;
      
      const zoneWidth = ((nextX - prevX) / 2) || 20;
      const zoneStart = x - zoneWidth / 2;

      return (
        <rect
          key={`hover-zone-${i}`}
          x={zoneStart}
          y={0}
          width={zoneWidth}
          height={dimensions.innerHeight}
          fill="transparent"
          style={{ cursor: 'crosshair' }}
          onMouseEnter={(e) => {
            // Find all points at this x value
            const points = data.series.flatMap(series =>
              series.data.filter(p => p.x === xValue).map(p => ({ point: p, series }))
            );
            if (points.length > 0) {
              handlePointHover(points[0].point, points[0].series, e);
            }
          }}
          onMouseLeave={() => handlePointHover(null)}
        />
      );
    });
  }, [data.series, xScale, dimensions.innerWidth, dimensions.innerHeight, handlePointHover]);

  // Legend items
  const legendItems = useMemo(() => {
    return rawData.series.map((series, index) => ({
      id: series.id,
      name: series.name,
      color: series.color || getSeriesColor(index),
      active: true,
    }));
  }, [rawData.series, getSeriesColor]);

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
        aria-label={generateAriaDescription(rawData, stacked ? 'Stacked Area' : 'Area')}
      >
        {/* Background */}
        <rect
          width={dimensions.width}
          height={dimensions.height}
          fill={isDarkMode ? '#1F2937' : '#FFFFFF'}
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

          {/* Areas and lines */}
          {renderAreas()}

          {/* Hover zones */}
          {renderHoverZones()}

          {/* Data points */}
          {renderPoints()}
        </g>
      </svg>

      {/* Legend */}
      {config?.legend?.show !== false && rawData.series.length > 1 && (
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
