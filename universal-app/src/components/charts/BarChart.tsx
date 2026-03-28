/**
 * BarChart Component - Vertical/horizontal bar charts
 * Universal Council App - Multi-tenant SaaS Platform
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import type { BarChartProps, ChartPoint, ChartSeries } from '@/lib/charts/types';
import { useChart } from '@/hooks/useChart';
import { Grid } from './primitives/Grid';
import { Legend } from './primitives/Legend';
import { Tooltip } from './primitives/Tooltip';
import { DataLabel } from './primitives/DataLabel';
import {
  createBandScale,
  calculateCategoricalDomain,
  calculateDomain,
  createLinearScale,
  generateAriaDescription,
  formatNumber,
} from '@/lib/charts/utils';

export function BarChart({
  data,
  config,
  className,
  id,
  orientation = 'vertical',
  grouped = false,
  stacked = false,
  barRadius = 4,
  barGap = 0.1,
  showValues = false,
  onPointClick,
  onPointHover,
}: BarChartProps) {
  const {
    dimensions,
    containerRef,
    colors,
    getSeriesColor,
    interaction,
    handlePointHover,
    handlePointClick,
    hideTooltip,
    animatedProgress,
    isDarkMode,
  } = useChart({ data, config, type: 'bar' });

  const isVertical = orientation === 'vertical';
  
  // Calculate scales
  const categories = useMemo(() => calculateCategoricalDomain(data), [data]);
  
  const valuesDomain = useMemo(() => {
    if (stacked) {
      // Calculate stacked max
      const stackedTotals: Record<string, number> = {};
      for (const series of data.series) {
        for (const point of series.data) {
          const cat = String(point.x);
          stackedTotals[cat] = (stackedTotals[cat] || 0) + point.y;
        }
      }
      const max = Math.max(...Object.values(stackedTotals), 0);
      return [0, max * 1.1] as [number, number];
    }
    return calculateDomain(data, 'y') as [number, number];
  }, [data, stacked]);

  const categoryScale = useMemo(() => {
    const range: [number, number] = isVertical 
      ? [0, dimensions.innerWidth]
      : [0, dimensions.innerHeight];
    return createBandScale(categories, range, barGap);
  }, [categories, dimensions.innerWidth, dimensions.innerHeight, isVertical, barGap]);

  const valueScale = useMemo(() => {
    const range: [number, number] = isVertical
      ? [dimensions.innerHeight, 0]
      : [0, dimensions.innerWidth];
    return createLinearScale(valuesDomain, range);
  }, [valuesDomain, dimensions.innerHeight, dimensions.innerWidth, isVertical]);

  // Calculate bar dimensions
  const barWidth = useMemo(() => {
    const bandwidth = categoryScale.bandwidth();
    if (grouped && data.series.length > 1) {
      return (bandwidth - (data.series.length - 1) * 2) / data.series.length;
    }
    return bandwidth;
  }, [categoryScale, data.series.length, grouped]);

  // Render bars
  const renderBars = useCallback(() => {
    const bars: React.ReactNode[] = [];
    const labels: React.ReactNode[] = [];
    
    // Track stacked baselines
    const stackBaselines: Record<string, number> = {};
    categories.forEach(cat => {
      stackBaselines[cat] = isVertical ? dimensions.innerHeight : 0;
    });

    data.series.forEach((series, seriesIndex) => {
      const color = series.color || getSeriesColor(seriesIndex);
      
      series.data.forEach((point, pointIndex) => {
        const category = String(point.x);
        const categoryPos = categoryScale(category);
        const value = point.y * animatedProgress;
        const valuePos = valueScale(value);
        const zeroPos = valueScale(0);
        
        let barX: number, barY: number, barHeight: number, barWidthFinal: number;
        
        if (isVertical) {
          barX = categoryPos;
          if (grouped && data.series.length > 1) {
            barX += seriesIndex * (barWidth + 2);
          }
          
          if (stacked) {
            barY = stackBaselines[category] - (zeroPos - valuePos);
            barHeight = zeroPos - valuePos;
            stackBaselines[category] = barY;
          } else {
            barY = Math.min(valuePos, zeroPos);
            barHeight = Math.abs(valuePos - zeroPos);
          }
          barWidthFinal = barWidth;
        } else {
          barY = categoryPos;
          if (grouped && data.series.length > 1) {
            barY += seriesIndex * (barWidth + 2);
          }
          
          if (stacked) {
            barX = stackBaselines[category];
            barWidthFinal = valuePos;
            stackBaselines[category] = barX + valuePos;
          } else {
            barX = Math.min(valuePos, zeroPos);
            barWidthFinal = Math.abs(valuePos - zeroPos);
          }
          barHeight = barWidth;
        }

        const isHovered = interaction.hoveredPoint?.x === point.x && 
                          interaction.hoveredSeries?.id === series.id;

        bars.push(
          <rect
            key={`bar-${series.id}-${pointIndex}`}
            x={dimensions.margin.left + barX}
            y={dimensions.margin.top + (isVertical ? barY : barY)}
            width={isVertical ? barWidthFinal : barWidthFinal}
            height={isVertical ? barHeight : barHeight}
            rx={barRadius}
            ry={barRadius}
            fill={color}
            opacity={isHovered ? 1 : 0.9}
            style={{
              cursor: onPointClick ? 'pointer' : 'default',
              transition: 'opacity 150ms ease',
              filter: isHovered ? 'brightness(1.1)' : undefined,
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
            aria-label={`${series.name}: ${category}, value ${formatNumber(point.y)}`}
          />
        );

        // Add value labels
        if (showValues && animatedProgress > 0.8) {
          const labelX = dimensions.margin.left + (isVertical ? barX + barWidthFinal / 2 : barX + barWidthFinal + 4);
          const labelY = dimensions.margin.top + (isVertical ? barY - 6 : barY + barHeight / 2);
          
          labels.push(
            <DataLabel
              key={`label-${series.id}-${pointIndex}`}
              x={labelX}
              y={labelY}
              value={point.y}
              anchor={isVertical ? 'middle' : 'start'}
              baseline="middle"
              darkMode={isDarkMode}
            />
          );
        }
      });
    });

    return [...bars, ...labels];
  }, [
    data.series,
    categories,
    categoryScale,
    valueScale,
    barWidth,
    barRadius,
    grouped,
    stacked,
    isVertical,
    dimensions,
    animatedProgress,
    getSeriesColor,
    interaction.hoveredPoint,
    interaction.hoveredSeries,
    handlePointHover,
    handlePointClick,
    onPointClick,
    onPointHover,
    showValues,
    isDarkMode,
  ]);

  // Legend items
  const legendItems = useMemo(() => {
    return data.series.map((series, index) => ({
      id: series.id,
      name: series.name,
      color: series.color || getSeriesColor(index),
      active: true,
    }));
  }, [data.series, getSeriesColor]);

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
        aria-label={generateAriaDescription(data, 'Bar')}
      >
        {/* Background */}
        <rect
          width={dimensions.width}
          height={dimensions.height}
          fill={isDarkMode ? '#1F2937' : '#FFFFFF'}
        />

        {/* Grid */}
        <g transform={`translate(${dimensions.margin.left}, ${dimensions.margin.top})`}>
          <Grid
            width={dimensions.innerWidth}
            height={dimensions.innerHeight}
            config={{ horizontal: isVertical, vertical: !isVertical }}
            darkMode={isDarkMode}
          />
        </g>

        {/* Bars */}
        {renderBars()}

        {/* X-axis labels */}
        {categories.map((category, i) => {
          const pos = categoryScale(category) + categoryScale.bandwidth() / 2;
          return (
            <text
              key={`x-label-${i}`}
              x={isVertical ? dimensions.margin.left + pos : dimensions.margin.left - 8}
              y={isVertical 
                ? dimensions.height - dimensions.margin.bottom + 20 
                : dimensions.margin.top + pos}
              fill={isDarkMode ? '#9CA3AF' : '#6B7280'}
              fontSize={11}
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor={isVertical ? 'middle' : 'end'}
              dominantBaseline={isVertical ? 'auto' : 'middle'}
            >
              {category}
            </text>
          );
        })}
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
