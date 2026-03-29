'use client';

/**
 * PerformanceOverlay Component
 *
 * Development-only overlay showing real-time performance metrics.
 * Displays FPS, memory usage, render counts, and performance warnings.
 * Only visible in development mode.
 *
 * @example
 * ```tsx
 * // Add to app layout (development only)
 * import { PerformanceOverlay } from '@/components/dev/PerformanceOverlay';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       {children}
 *       <PerformanceOverlay />
 *     </>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFps, useMemory } from '@/hooks/usePerformance';
import {
  getMonitorState,
  getCurrentFps,
  getMemoryInfo,
  formatMemorySize,
  getAllComponentPerformance,
  getSlowRenders,
  getLongTasks,
  getBudgetViolations,
  isMonitorActive,
} from '@/lib/performance/monitor';
import type {
  ComponentPerformance,
  SlowRenderInfo,
  LongTaskInfo,
  PerformanceBudget,
  MemoryInfo,
} from '@/lib/performance/types';
import { getCurrentMetrics } from '@/lib/vitals/reporter';
import { formatMetricValue, getRatingColorClass } from '@/lib/vitals/utils';
import type { Metric, MetricName } from '@/lib/vitals/types';

// Only render in development
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Overlay position options
 */
type OverlayPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Overlay props
 */
interface PerformanceOverlayProps {
  /** Initial position */
  position?: OverlayPosition;
  /** Initially expanded */
  defaultExpanded?: boolean;
  /** Show FPS counter */
  showFps?: boolean;
  /** Show memory usage */
  showMemory?: boolean;
  /** Show component renders */
  showRenders?: boolean;
  /** Show Core Web Vitals */
  showVitals?: boolean;
  /** Show slow renders */
  showSlowRenders?: boolean;
  /** Show budget violations */
  showBudgets?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Get position styles
 */
function getPositionStyles(position: OverlayPosition): React.CSSProperties {
  const base: React.CSSProperties = { position: 'fixed', zIndex: 99999 };

  switch (position) {
    case 'top-left':
      return { ...base, top: 8, left: 8 };
    case 'top-right':
      return { ...base, top: 8, right: 8 };
    case 'bottom-left':
      return { ...base, bottom: 8, left: 8 };
    case 'bottom-right':
      return { ...base, bottom: 8, right: 8 };
    default:
      return { ...base, bottom: 8, right: 8 };
  }
}

/**
 * Get FPS color based on value
 */
function getFpsColor(fps: number): string {
  if (fps >= 55) return 'text-success';
  if (fps >= 45) return 'text-warning';
  return 'text-destructive';
}

/**
 * Get memory color based on usage
 */
function getMemoryColor(usagePercent: number): string {
  if (usagePercent < 50) return 'text-success';
  if (usagePercent < 75) return 'text-warning';
  return 'text-destructive';
}

/**
 * Mini badge for collapsed state
 */
const MiniBadge = memo(function MiniBadge({
  fps,
  onClick,
}: {
  fps: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 shadow-lg hover:border-gray-600 transition-colors"
    >
      <span className={`text-xs font-mono font-medium ${getFpsColor(fps)}`}>
        {fps} FPS
      </span>
      <svg
        className="w-3 h-3 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    </motion.button>
  );
});

/**
 * FPS display component
 */
const FpsDisplay = memo(function FpsDisplay({ fps }: { fps: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-xs">FPS</span>
      <span className={`font-mono text-sm font-medium ${getFpsColor(fps)}`}>
        {fps}
      </span>
    </div>
  );
});

/**
 * Memory display component
 */
const MemoryDisplay = memo(function MemoryDisplay({
  memory,
}: {
  memory: MemoryInfo | null;
}) {
  if (!memory) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs">Memory</span>
        <span className="text-gray-500 text-xs">N/A</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs">Memory</span>
        <span
          className={`font-mono text-xs font-medium ${getMemoryColor(memory.usagePercent)}`}
        >
          {formatMemorySize(memory.usedJSHeapSize)}
        </span>
      </div>
      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            memory.usagePercent < 50
              ? 'bg-green-400'
              : memory.usagePercent < 75
                ? 'bg-amber-400'
                : 'bg-red-400'
          }`}
          style={{ width: `${Math.min(memory.usagePercent, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>{Math.round(memory.usagePercent)}% used</span>
        <span>/ {formatMemorySize(memory.jsHeapSizeLimit)}</span>
      </div>
    </div>
  );
});

/**
 * Core Web Vitals display
 */
const VitalsDisplay = memo(function VitalsDisplay() {
  const [metrics, setMetrics] = useState<Map<MetricName, Metric>>(new Map());

  useEffect(() => {
    const update = () => setMetrics(getCurrentMetrics());
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  const metricOrder: MetricName[] = ['LCP', 'FID', 'CLS', 'INP', 'TTFB', 'FCP'];

  return (
    <div className="space-y-1">
      <div className="text-gray-400 text-xs font-medium mb-1">Core Web Vitals</div>
      {metricOrder.map((name) => {
        const metric = metrics.get(name);
        if (!metric) {
          return (
            <div key={name} className="flex items-center justify-between">
              <span className="text-gray-500 text-xs">{name}</span>
              <span className="text-gray-600 text-xs">—</span>
            </div>
          );
        }

        return (
          <div key={name} className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">{name}</span>
            <span
              className={`font-mono text-xs px-1 rounded ${getRatingColorClass(metric.rating)}`}
            >
              {formatMetricValue(name, metric.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
});

/**
 * Component renders display
 */
const RenderDisplay = memo(function RenderDisplay() {
  const [components, setComponents] = useState<ComponentPerformance[]>([]);

  useEffect(() => {
    const update = () => {
      const all = getAllComponentPerformance();
      // Sort by render count, show top 5
      const sorted = all.sort((a, b) => b.renderCount - a.renderCount).slice(0, 5);
      setComponents(sorted);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (components.length === 0) {
    return (
      <div className="text-gray-500 text-xs">No component renders tracked</div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-gray-400 text-xs font-medium mb-1">Top Renders</div>
      {components.map((comp) => (
        <div key={comp.name} className="flex items-center justify-between gap-2">
          <span className="text-gray-400 text-xs truncate max-w-[100px]">
            {comp.name}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-gray-300 font-mono text-xs">
              {comp.renderCount}×
            </span>
            <span
              className={`font-mono text-xs ${
                comp.avgRenderTime > 16 ? 'text-amber-400' : 'text-gray-500'
              }`}
            >
              {comp.avgRenderTime.toFixed(1)}ms
            </span>
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * Slow renders display
 */
const SlowRendersDisplay = memo(function SlowRendersDisplay() {
  const [slowRenders, setSlowRenders] = useState<SlowRenderInfo[]>([]);

  useEffect(() => {
    const update = () => setSlowRenders(getSlowRenders().slice(-5).reverse());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (slowRenders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div className="text-amber-400 text-xs font-medium mb-1">
        ⚠ Slow Renders ({slowRenders.length})
      </div>
      {slowRenders.map((sr, i) => (
        <div key={i} className="flex items-center justify-between gap-2">
          <span className="text-gray-400 text-xs truncate max-w-[100px]">
            {sr.componentName}
          </span>
          <span className="text-amber-400 font-mono text-xs">
            {sr.duration.toFixed(1)}ms
          </span>
        </div>
      ))}
    </div>
  );
});

/**
 * Budget violations display
 */
const BudgetDisplay = memo(function BudgetDisplay() {
  const [violations, setViolations] = useState<PerformanceBudget[]>([]);

  useEffect(() => {
    const update = () => setViolations(getBudgetViolations());
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  if (violations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div className="text-destructive text-xs font-medium mb-1">
        ✗ Budget Violations ({violations.length})
      </div>
      {violations.slice(0, 3).map((v) => (
        <div key={v.name} className="flex items-center justify-between gap-2">
          <span className="text-gray-400 text-xs truncate max-w-[100px]">
            {v.name}
          </span>
          <span
            className={`font-mono text-xs ${
              v.status === 'error' ? 'text-destructive' : 'text-warning'
            }`}
          >
            {v.value?.toFixed(v.type === 'score' ? 3 : 0)}
            {v.type === 'timing' && 'ms'}
          </span>
        </div>
      ))}
    </div>
  );
});

/**
 * Main overlay component
 */
function PerformanceOverlayInternal({
  position = 'bottom-right',
  defaultExpanded = false,
  showFps = true,
  showMemory = true,
  showRenders = true,
  showVitals = true,
  showSlowRenders = true,
  showBudgets = true,
  className = '',
}: PerformanceOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [currentPosition, setCurrentPosition] = useState(position);
  const fps = useFps();
  const memory = useMemory();

  // Toggle expansion
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Cycle position
  const cyclePosition = useCallback(() => {
    const positions: OverlayPosition[] = [
      'top-left',
      'top-right',
      'bottom-right',
      'bottom-left',
    ];
    const currentIndex = positions.indexOf(currentPosition);
    const nextIndex = (currentIndex + 1) % positions.length;
    setCurrentPosition(positions[nextIndex]);
  }, [currentPosition]);

  // Check if monitor is active
  if (!isMonitorActive()) {
    return null;
  }

  return (
    <div style={getPositionStyles(currentPosition)} className={className}>
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <MiniBadge key="mini" fps={fps} onClick={toggleExpanded} />
        ) : (
          <motion.div
            key="expanded"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-64 bg-gray-900/95 backdrop-blur-md rounded-lg border border-gray-700 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse motion-reduce:animate-none" />
                <span className="text-gray-300 text-xs font-medium">
                  Performance
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={cyclePosition}
                  className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                  title="Move overlay"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                </button>
                <button
                  onClick={toggleExpanded}
                  className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                  title="Collapse"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
              {/* FPS & Memory row */}
              <div className="grid grid-cols-2 gap-3">
                {showFps && (
                  <div className="bg-gray-800/50 rounded-md p-2">
                    <FpsDisplay fps={fps} />
                  </div>
                )}
                {showMemory && (
                  <div className="bg-gray-800/50 rounded-md p-2 col-span-1">
                    <MemoryDisplay memory={memory} />
                  </div>
                )}
              </div>

              {/* Core Web Vitals */}
              {showVitals && (
                <div className="bg-gray-800/50 rounded-md p-2">
                  <VitalsDisplay />
                </div>
              )}

              {/* Component Renders */}
              {showRenders && (
                <div className="bg-gray-800/50 rounded-md p-2">
                  <RenderDisplay />
                </div>
              )}

              {/* Warnings section */}
              {showSlowRenders && <SlowRendersDisplay />}
              {showBudgets && <BudgetDisplay />}
            </div>

            {/* Footer */}
            <div className="px-3 py-1.5 border-t border-gray-700 bg-gray-800/30">
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span>Development mode only</span>
                <span className={getFpsColor(fps)}>{fps} FPS</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Exported component - only renders in development
 */
export function PerformanceOverlay(props: PerformanceOverlayProps) {
  if (!isDevelopment) {
    return null;
  }

  return <PerformanceOverlayInternal {...props} />;
}

/**
 * Export mini badge for custom implementations
 */
export { MiniBadge as PerformanceMiniBadge };
