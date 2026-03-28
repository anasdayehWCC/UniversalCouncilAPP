/**
 * Tooltip Component - Hover tooltips for chart data points
 * Universal Council App - Multi-tenant SaaS Platform
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { TooltipProps } from '@/lib/charts/types';

export function Tooltip({
  visible,
  x,
  y,
  content,
  darkMode = false,
}: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [mounted, setMounted] = useState(false);

  // Update position with boundary detection
  useEffect(() => {
    if (!visible || !tooltipRef.current) {
      setMounted(false);
      return;
    }

    setMounted(true);
    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const padding = 12;

    let newX = x + padding;
    let newY = y - rect.height / 2;

    // Check right boundary
    if (newX + rect.width > window.innerWidth - padding) {
      newX = x - rect.width - padding;
    }

    // Check left boundary
    if (newX < padding) {
      newX = padding;
    }

    // Check top boundary
    if (newY < padding) {
      newY = padding;
    }

    // Check bottom boundary
    if (newY + rect.height > window.innerHeight - padding) {
      newY = window.innerHeight - rect.height - padding;
    }

    setPosition({ x: newX, y: newY });
  }, [visible, x, y]);

  if (!visible && !mounted) return null;

  return (
    <div
      ref={tooltipRef}
      className="chart-tooltip"
      role="tooltip"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.95)',
        transition: 'opacity 150ms ease, transform 150ms ease',
      }}
    >
      <div
        style={{
          background: darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          color: darkMode ? '#F9FAFB' : '#1F2937',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxShadow: darkMode
            ? '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            : '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          maxWidth: '200px',
          wordWrap: 'break-word',
        }}
      >
        {content}
      </div>
    </div>
  );
}

/**
 * Inline tooltip for use within SVG
 */
export function SVGTooltip({
  visible,
  x,
  y,
  content,
  darkMode = false,
}: TooltipProps & { content: string }) {
  if (!visible) return null;

  const padding = 8;
  const estimatedWidth = content.length * 6 + padding * 2;
  const height = 24;

  return (
    <g
      className="svg-tooltip"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 150ms ease',
      }}
    >
      {/* Background */}
      <rect
        x={x - estimatedWidth / 2}
        y={y - height - 8}
        width={estimatedWidth}
        height={height}
        rx={4}
        fill={darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.98)'}
        stroke={darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
        strokeWidth={1}
      />
      
      {/* Arrow */}
      <polygon
        points={`${x - 5},${y - 8} ${x + 5},${y - 8} ${x},${y - 2}`}
        fill={darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.98)'}
      />
      
      {/* Text */}
      <text
        x={x}
        y={y - height / 2 - 4}
        fill={darkMode ? '#F9FAFB' : '#1F2937'}
        fontSize={11}
        fontFamily="system-ui, -apple-system, sans-serif"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {content}
      </text>
    </g>
  );
}
