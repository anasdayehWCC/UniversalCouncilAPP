/**
 * Legend Component - Chart legend with interactive items
 * Universal Council App - Multi-tenant SaaS Platform
 */

'use client';

import React from 'react';
import type { LegendProps } from '@/lib/charts/types';

export function Legend({
  items,
  config = {},
  onItemClick,
  darkMode = false,
}: LegendProps) {
  const {
    show = true,
    position = 'bottom',
    align = 'center',
    orientation = position === 'left' || position === 'right' ? 'vertical' : 'horizontal',
  } = config;

  const textColor = 'var(--foreground)';
  const inactiveColor = 'var(--muted-foreground)';

  if (!show || items.length === 0) return null;

  // Calculate positioning based on config
  const getContainerStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'flex',
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      gap: orientation === 'horizontal' ? '16px' : '8px',
      flexWrap: 'wrap',
    };

    switch (align) {
      case 'start':
        base.justifyContent = 'flex-start';
        break;
      case 'end':
        base.justifyContent = 'flex-end';
        break;
      default:
        base.justifyContent = 'center';
    }

    return base;
  };

  return (
    <div
      className="chart-legend"
      style={getContainerStyle()}
      role="group"
      aria-label="Chart legend"
    >
      {items.map((item) => {
        const isActive = item.active !== false;
        
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick?.(item.id)}
            className="chart-legend-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: onItemClick ? 'pointer' : 'default',
              opacity: isActive ? 1 : 0.5,
              transition: 'opacity 200ms ease, background 200ms ease',
            }}
            onMouseEnter={(e) => {
              if (onItemClick) {
                e.currentTarget.style.background = 'var(--muted)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            aria-pressed={isActive}
            aria-label={`${item.name}: ${isActive ? 'visible' : 'hidden'}`}
          >
            {/* Color indicator */}
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                backgroundColor: isActive ? item.color : inactiveColor,
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            
            {/* Label */}
            <span
              style={{
                fontSize: '12px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: isActive ? textColor : inactiveColor,
                whiteSpace: 'nowrap',
              }}
            >
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
