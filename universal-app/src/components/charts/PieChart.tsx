/**
 * PieChart Component - Pie and donut charts
 * Universal Council App - Multi-tenant SaaS Platform
 */

'use client';

import React, { useMemo, useCallback, useState } from 'react';
import type { PieChartProps, ChartPoint } from '@/lib/charts/types';
import { useChart } from '@/hooks/useChart';
import { Legend } from './primitives/Legend';
import { Tooltip } from './primitives/Tooltip';
import { PercentageLabel } from './primitives/DataLabel';
import {
  generateArcPath,
  calculatePieAngles,
  polarToCartesian,
  generateAriaDescription,
  formatNumber,
  formatPercentage,
} from '@/lib/charts/utils';

export function PieChart({
  data,
  config,
  className,
  id,
  innerRadius = 0,
  outerRadius: outerRadiusProp,
  padAngle = 0.02,
  showLabels = true,
  labelPosition = 'outside',
  startAngle = 0,
  endAngle = Math.PI * 2,
  onPointClick,
  onPointHover,
}: PieChartProps) {
  const {
    dimensions,
    containerRef,
    colors,
    getSeriesColor,
    interaction,
    handlePointHover,
    handlePointClick,
    animatedProgress,
    isDarkMode,
  } = useChart({ data, config, type: 'pie' });

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate center and radius
  const center = useMemo(() => ({
    x: dimensions.width / 2,
    y: dimensions.height / 2,
  }), [dimensions.width, dimensions.height]);

  const maxRadius = Math.min(dimensions.innerWidth, dimensions.innerHeight) / 2;
  const outerRadius = outerRadiusProp || maxRadius * 0.8;
  const actualInnerRadius = innerRadius * outerRadius;

  // Get data points from first series
  const points = useMemo(() => {
    return data.series[0]?.data || [];
  }, [data.series]);

  // Calculate pie segments
  const segments = useMemo(() => {
    const angles = calculatePieAngles(points, startAngle, startAngle + (endAngle - startAngle) * animatedProgress);
    
    return angles.map((segment, index) => ({
      ...segment,
      color: segment.point.color || getSeriesColor(index),
      index,
    }));
  }, [points, startAngle, endAngle, animatedProgress, getSeriesColor]);

  // Render pie segments
  const renderSegments = useCallback(() => {
    return segments.map((segment, index) => {
      const isHovered = hoveredIndex === index;
      const scale = isHovered ? 1.05 : 1;
      const opacity = hoveredIndex !== null && !isHovered ? 0.6 : 1;

      // Apply padding between segments
      const paddedStart = segment.startAngle + padAngle / 2;
      const paddedEnd = segment.endAngle - padAngle / 2;

      if (paddedEnd <= paddedStart) return null;

      const path = generateArcPath(
        center.x,
        center.y,
        actualInnerRadius,
        outerRadius,
        paddedStart,
        paddedEnd
      );

      // Calculate label position
      const midAngle = (paddedStart + paddedEnd) / 2;
      const labelRadius = labelPosition === 'inside'
        ? actualInnerRadius + (outerRadius - actualInnerRadius) / 2
        : outerRadius + 20;
      const labelPos = polarToCartesian(center.x, center.y, labelRadius, midAngle);

      return (
        <g key={`segment-${index}`}>
          <path
            d={path}
            fill={segment.color}
            opacity={opacity}
            style={{
              cursor: onPointClick ? 'pointer' : 'default',
              transform: `scale(${scale})`,
              transformOrigin: `${center.x}px ${center.y}px`,
              transition: 'transform 200ms ease, opacity 200ms ease',
            }}
            onMouseEnter={(e) => {
              setHoveredIndex(index);
              handlePointHover(segment.point, data.series[0], e);
              onPointHover?.(segment.point, data.series[0]);
            }}
            onMouseLeave={() => {
              setHoveredIndex(null);
              handlePointHover(null);
              onPointHover?.(null);
            }}
            onClick={() => {
              handlePointClick(segment.point, data.series[0]);
              onPointClick?.(segment.point, data.series[0]);
            }}
            role="graphics-symbol"
            aria-label={`${segment.point.label || segment.point.x}: ${formatNumber(segment.point.y)} (${formatPercentage(segment.percentage)})`}
          />

          {/* Percentage label inside slice */}
          {showLabels && labelPosition === 'inside' && (
            <PercentageLabel
              x={labelPos.x}
              y={labelPos.y}
              percentage={segment.percentage}
              showIfAbove={0.05}
              darkMode={isDarkMode}
            />
          )}
        </g>
      );
    });
  }, [segments, center, actualInnerRadius, outerRadius, padAngle, labelPosition,
      showLabels, hoveredIndex, handlePointHover, handlePointClick, onPointClick,
      onPointHover, data.series, isDarkMode]);

  // Render outside labels
  const renderOutsideLabels = useCallback(() => {
    if (!showLabels || labelPosition !== 'outside') return null;

    return segments.map((segment, index) => {
      if (segment.percentage < 0.03) return null;

      const midAngle = (segment.startAngle + segment.endAngle) / 2;
      const labelRadius = outerRadius + 20;
      const labelPos = polarToCartesian(center.x, center.y, labelRadius, midAngle);
      
      // Determine text anchor based on position
      const isRightSide = midAngle > -Math.PI / 2 && midAngle < Math.PI / 2;

      return (
        <g key={`label-${index}`}>
          {/* Connector line */}
          <line
            x1={polarToCartesian(center.x, center.y, outerRadius, midAngle).x}
            y1={polarToCartesian(center.x, center.y, outerRadius, midAngle).y}
            x2={labelPos.x}
            y2={labelPos.y}
            stroke={isDarkMode ? '#6B7280' : '#9CA3AF'}
            strokeWidth={1}
          />

          {/* Label text */}
          <text
            x={labelPos.x + (isRightSide ? 4 : -4)}
            y={labelPos.y}
            fill={isDarkMode ? '#E5E7EB' : '#374151'}
            fontSize={11}
            fontFamily="system-ui, -apple-system, sans-serif"
            textAnchor={isRightSide ? 'start' : 'end'}
            dominantBaseline="middle"
          >
            {segment.point.label || String(segment.point.x)}
          </text>
        </g>
      );
    });
  }, [segments, showLabels, labelPosition, center, outerRadius, isDarkMode]);

  // Render center content for donut charts
  const renderCenterContent = useCallback(() => {
    if (actualInnerRadius === 0) return null;

    const total = points.reduce((sum, p) => sum + p.y, 0);
    const hoveredSegment = hoveredIndex !== null ? segments[hoveredIndex] : null;

    return (
      <g>
        <text
          x={center.x}
          y={center.y - 8}
          fill={isDarkMode ? '#F9FAFB' : '#1F2937'}
          fontSize={24}
          fontWeight={600}
          fontFamily="system-ui, -apple-system, sans-serif"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {hoveredSegment 
            ? formatNumber(hoveredSegment.point.y)
            : formatNumber(total)}
        </text>
        <text
          x={center.x}
          y={center.y + 16}
          fill={isDarkMode ? '#9CA3AF' : '#6B7280'}
          fontSize={12}
          fontFamily="system-ui, -apple-system, sans-serif"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {hoveredSegment 
            ? (hoveredSegment.point.label || String(hoveredSegment.point.x))
            : 'Total'}
        </text>
      </g>
    );
  }, [actualInnerRadius, points, hoveredIndex, segments, center, isDarkMode]);

  // Legend items
  const legendItems = useMemo(() => {
    return points.map((point, index) => ({
      id: String(point.x),
      name: point.label || String(point.x),
      color: point.color || getSeriesColor(index),
      active: true,
    }));
  }, [points, getSeriesColor]);

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
        aria-label={generateAriaDescription(data, innerRadius > 0 ? 'Donut' : 'Pie')}
      >
        {/* Background */}
        <rect
          width={dimensions.width}
          height={dimensions.height}
          fill={isDarkMode ? '#1F2937' : '#FFFFFF'}
        />

        {/* Segments */}
        {renderSegments()}

        {/* Outside labels */}
        {renderOutsideLabels()}

        {/* Center content for donut */}
        {renderCenterContent()}
      </svg>

      {/* Legend */}
      {config?.legend?.show !== false && (
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
        content={
          <div>
            <div style={{ fontWeight: 600 }}>
              {interaction.tooltip.point?.label || String(interaction.tooltip.point?.x)}
            </div>
            <div>
              Value: {formatNumber(interaction.tooltip.point?.y || 0)}
            </div>
            {segments.find(s => s.point === interaction.tooltip.point) && (
              <div>
                {formatPercentage(
                  segments.find(s => s.point === interaction.tooltip.point)?.percentage || 0
                )}
              </div>
            )}
          </div>
        }
        darkMode={isDarkMode}
      />
    </div>
  );
}
