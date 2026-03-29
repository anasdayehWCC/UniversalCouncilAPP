/**
 * Heatmap Component - Grid heatmap visualization
 * Universal Council App - Multi-tenant SaaS Platform
 */

'use client';

import React, { useMemo, useCallback, useState } from 'react';
import type { HeatmapProps } from '@/lib/charts/types';
import { useChart } from '@/hooks/useChart';
import { Legend } from './primitives/Legend';
import { Tooltip } from './primitives/Tooltip';
import { DataLabel } from './primitives/DataLabel';
import {
  generateColorScale,
  calculateCategoricalDomain,
  formatNumber,
  generateAriaDescription,
  hexToRgb,
} from '@/lib/charts/utils';

export function Heatmap({
  data,
  config,
  className,
  id,
  colorScale: colorScaleProp,
  cellRadius = 2,
  cellGap = 2,
  showValues = false,
  minValue: minValueProp,
  maxValue: maxValueProp,
  onPointClick,
  onPointHover,
}: HeatmapProps) {
  const {
    dimensions,
    containerRef,
    colors,
    interaction,
    handlePointHover,
    handlePointClick,
    animatedProgress,
    isDarkMode,
  } = useChart({ data, config, type: 'heatmap' });

  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // Get categories for x and y axes
  const { xCategories, yCategories, cellData, minValue, maxValue } = useMemo(() => {
    // For heatmap, we expect data organized as:
    // - Multiple series (rows)
    // - Each series has data points (columns)
    
    const yLabels = data.series.map(s => s.name);
    const xLabels = calculateCategoricalDomain(data);
    
    // Build cell matrix
    const cells: Array<{
      row: number;
      col: number;
      value: number;
      xLabel: string;
      yLabel: string;
    }> = [];
    
    let min = Infinity;
    let max = -Infinity;
    
    data.series.forEach((series, rowIndex) => {
      series.data.forEach((point, colIndex) => {
        const value = point.y;
        min = Math.min(min, value);
        max = Math.max(max, value);
        
        cells.push({
          row: rowIndex,
          col: colIndex,
          value,
          xLabel: String(point.x),
          yLabel: series.name,
        });
      });
    });

    return {
      xCategories: xLabels,
      yCategories: yLabels,
      cellData: cells,
      minValue: minValueProp ?? min,
      maxValue: maxValueProp ?? max,
    };
  }, [data, minValueProp, maxValueProp]);

  // Generate color scale
  const colorScaleColors = useMemo(() => {
    if (colorScaleProp) return colorScaleProp;
    
    return isDarkMode
      ? generateColorScale(10, 'oklch(25% 0.08 230)', 'var(--primary)')
      : generateColorScale(10, 'oklch(92% 0.03 230)', 'var(--primary)');
  }, [colorScaleProp, isDarkMode]);

  // Calculate cell dimensions
  const cellDimensions = useMemo(() => {
    const numCols = xCategories.length;
    const numRows = yCategories.length;
    
    // Account for labels
    const labelWidth = 80;
    const labelHeight = 30;
    
    const availableWidth = dimensions.innerWidth - labelWidth;
    const availableHeight = dimensions.innerHeight - labelHeight;
    
    const cellWidth = Math.max(10, (availableWidth - (numCols - 1) * cellGap) / numCols);
    const cellHeight = Math.max(10, (availableHeight - (numRows - 1) * cellGap) / numRows);
    
    return {
      width: cellWidth,
      height: cellHeight,
      offsetX: labelWidth,
      offsetY: labelHeight,
    };
  }, [dimensions.innerWidth, dimensions.innerHeight, xCategories.length, yCategories.length, cellGap]);

  // Get color for a value
  const getColorForValue = useCallback((value: number) => {
    const range = maxValue - minValue;
    if (range === 0) return colorScaleColors[Math.floor(colorScaleColors.length / 2)];
    
    const normalized = (value - minValue) / range;
    const index = Math.min(
      colorScaleColors.length - 1,
      Math.max(0, Math.floor(normalized * colorScaleColors.length))
    );
    
    return colorScaleColors[index];
  }, [minValue, maxValue, colorScaleColors]);

  // Determine if text should be light or dark based on cell color
  const getTextColor = useCallback((bgColor: string) => {
    const rgb = hexToRgb(bgColor);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? 'var(--foreground)' : 'var(--card-foreground)';
  }, []);

  // Render cells
  const renderCells = useCallback(() => {
    return cellData.map((cell, index) => {
      const x = cellDimensions.offsetX + cell.col * (cellDimensions.width + cellGap);
      const y = cellDimensions.offsetY + cell.row * (cellDimensions.height + cellGap);
      const color = getColorForValue(cell.value);
      const isHovered = hoveredCell?.row === cell.row && hoveredCell?.col === cell.col;
      
      const point = data.series[cell.row]?.data[cell.col];
      const series = data.series[cell.row];

      return (
        <g key={`cell-${cell.row}-${cell.col}`}>
          <rect
            x={dimensions.margin.left + x}
            y={dimensions.margin.top + y}
            width={cellDimensions.width * animatedProgress}
            height={cellDimensions.height * animatedProgress}
            rx={cellRadius}
            ry={cellRadius}
            fill={color}
            opacity={isHovered ? 1 : 0.9}
            style={{
              cursor: onPointClick ? 'pointer' : 'default',
              transition: 'opacity 150ms ease',
              filter: isHovered ? 'brightness(1.1)' : undefined,
            }}
            onMouseEnter={(e) => {
              setHoveredCell({ row: cell.row, col: cell.col });
              if (point && series) {
                handlePointHover(point, series, e);
                onPointHover?.(point, series);
              }
            }}
            onMouseLeave={() => {
              setHoveredCell(null);
              handlePointHover(null);
              onPointHover?.(null);
            }}
            onClick={() => {
              if (point && series) {
                handlePointClick(point, series);
                onPointClick?.(point, series);
              }
            }}
            role="graphics-symbol"
            aria-label={`${cell.yLabel}, ${cell.xLabel}: ${formatNumber(cell.value)}`}
          />
          
          {/* Value label */}
          {showValues && animatedProgress > 0.8 && (
            <text
              x={dimensions.margin.left + x + cellDimensions.width / 2}
              y={dimensions.margin.top + y + cellDimensions.height / 2}
              fill={getTextColor(color)}
              fontSize={Math.min(11, cellDimensions.height / 2)}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={500}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ pointerEvents: 'none' }}
            >
              {formatNumber(cell.value)}
            </text>
          )}
        </g>
      );
    });
  }, [cellData, cellDimensions, cellGap, cellRadius, dimensions, getColorForValue,
      getTextColor, hoveredCell, animatedProgress, showValues, data.series,
      handlePointHover, handlePointClick, onPointClick, onPointHover]);

  // Render axis labels
  const renderLabels = useCallback(() => {
    const textColor = 'var(--muted-foreground)';
    
    return (
      <>
        {/* X-axis labels */}
        {xCategories.map((label, index) => {
          const x = cellDimensions.offsetX + index * (cellDimensions.width + cellGap) + cellDimensions.width / 2;
          
          return (
            <text
              key={`x-label-${index}`}
              x={dimensions.margin.left + x}
              y={dimensions.margin.top + cellDimensions.offsetY - 8}
              fill={textColor}
              fontSize={10}
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
              dominantBaseline="auto"
            >
              {label.length > 8 ? label.slice(0, 7) + '…' : label}
            </text>
          );
        })}
        
        {/* Y-axis labels */}
        {yCategories.map((label, index) => {
          const y = cellDimensions.offsetY + index * (cellDimensions.height + cellGap) + cellDimensions.height / 2;
          
          return (
            <text
              key={`y-label-${index}`}
              x={dimensions.margin.left + cellDimensions.offsetX - 8}
              y={dimensions.margin.top + y}
              fill={textColor}
              fontSize={10}
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {label.length > 10 ? label.slice(0, 9) + '…' : label}
            </text>
          );
        })}
      </>
    );
  }, [xCategories, yCategories, cellDimensions, cellGap, dimensions, isDarkMode]);

  // Color scale legend
  const renderColorLegend = useCallback(() => {
    const legendWidth = Math.min(150, dimensions.innerWidth / 3);
    const legendHeight = 12;
    const x = dimensions.width - dimensions.margin.right - legendWidth;
    const y = dimensions.margin.top - 20;

    return (
      <g>
        {/* Gradient background */}
        <defs>
          <linearGradient id="heatmap-legend-gradient">
            {colorScaleColors.map((color, i) => (
              <stop
                key={i}
                offset={`${(i / (colorScaleColors.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
        </defs>
        
        <rect
          x={x}
          y={y}
          width={legendWidth}
          height={legendHeight}
          rx={2}
          fill="url(#heatmap-legend-gradient)"
        />
        
        {/* Min/Max labels */}
        <text
          x={x}
          y={y + legendHeight + 12}
          fill="var(--muted-foreground)"
          fontSize={9}
          fontFamily="system-ui, -apple-system, sans-serif"
          textAnchor="start"
        >
          {formatNumber(minValue)}
        </text>
        <text
          x={x + legendWidth}
          y={y + legendHeight + 12}
          fill="var(--muted-foreground)"
          fontSize={9}
          fontFamily="system-ui, -apple-system, sans-serif"
          textAnchor="end"
        >
          {formatNumber(maxValue)}
        </text>
      </g>
    );
  }, [dimensions, colorScaleColors, minValue, maxValue, isDarkMode]);

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
        aria-label={generateAriaDescription(data, 'Heatmap')}
      >
        {/* Background */}
        <rect
          width={dimensions.width}
          height={dimensions.height}
          fill="var(--card)"
        />

        {/* Color scale legend */}
        {renderColorLegend()}

        {/* Axis labels */}
        {renderLabels()}

        {/* Cells */}
        {renderCells()}
      </svg>

      {/* Tooltip */}
      <Tooltip
        visible={interaction.tooltip.visible}
        x={interaction.tooltip.x}
        y={interaction.tooltip.y}
        content={
          hoveredCell && (
            <div>
              <div style={{ fontWeight: 600 }}>
                {yCategories[hoveredCell.row]} × {xCategories[hoveredCell.col]}
              </div>
              <div>
                Value: {formatNumber(cellData.find(
                  c => c.row === hoveredCell.row && c.col === hoveredCell.col
                )?.value || 0)}
              </div>
            </div>
          )
        }
        darkMode={isDarkMode}
      />
    </div>
  );
}
