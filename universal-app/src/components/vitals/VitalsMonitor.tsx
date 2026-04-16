'use client';

/**
 * VitalsMonitor - Dev-only Performance Overlay
 *
 * Displays real-time Core Web Vitals metrics in a floating overlay.
 * Only renders in development mode.
 *
 * @example
 * ```tsx
 * // Add to root layout
 * <VitalsMonitor />
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebVitals } from '@/hooks/useWebVitals';
import { formatMetricValue, getRatingColorClass, getRatingIcon, getMetricFullName } from '@/lib/vitals/utils';
import type { MetricName } from '@/lib/vitals/types';

// Display order for metrics
const METRIC_ORDER: MetricName[] = ['LCP', 'FID', 'CLS', 'TTFB', 'INP', 'FCP'];

interface VitalsMonitorProps {
  /** Force show even in production (not recommended) */
  forceShow?: boolean;
  /** Initial position */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
}

export function VitalsMonitor({
  forceShow = false,
  position = 'bottom-right',
  defaultCollapsed = true,
}: VitalsMonitorProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isHidden, setIsHidden] = useState(false);
  const { metricsArray, score, scoreRating, isActive, generateReport, getReports } = useWebVitals({
    refreshInterval: 500,
  });

  // Only show in development unless forced
  const shouldShow = forceShow || process.env.NODE_ENV === 'development';

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  // Toggle collapse
  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  // Hide monitor
  const hideMonitor = useCallback(() => {
    setIsHidden(true);
  }, []);

  // Show monitor
  const showMonitor = useCallback(() => {
    setIsHidden(false);
  }, []);

  // Export report
  const handleExportReport = useCallback(() => {
    const report = generateReport();
    console.log('[Vitals] Performance Report:', report);

    // Copy to clipboard
    navigator.clipboard?.writeText(JSON.stringify(report, null, 2));
    alert('Performance report copied to clipboard!');
  }, [generateReport]);

  // Get stored reports count
  const [reportsCount, setReportsCount] = useState(0);
  useEffect(() => {
    setReportsCount(getReports().length);
  }, [getReports]);

  if (!shouldShow || isHidden) {
    return (
      <button
        onClick={showMonitor}
        className="fixed bottom-4 right-4 z-[100] w-8 h-8 rounded-full bg-gray-900/80 text-white text-xs flex items-center justify-center hover:bg-gray-800 transition-colors"
        title="Show Vitals Monitor"
      >
        📊
      </button>
    );
  }

  // Sort metrics by display order
  const sortedMetrics = METRIC_ORDER.map((name) =>
    metricsArray.find((m) => m.name === name)
  ).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed ${positionClasses[position]} z-[100] font-mono text-xs`}
    >
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 overflow-hidden min-w-[200px]">
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-gray-800/50 cursor-pointer select-none"
          onClick={toggleCollapse}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">📊</span>
            <span className="text-white font-semibold">Web Vitals</span>
            {isActive && (
              <span className="w-2 h-2 rounded-full bg-success animate-pulse motion-reduce:animate-none" title="Active" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRatingColorClass(scoreRating)}`}>
              {score}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                hideMonitor();
              }}
              className="text-gray-400 hover:text-white transition-colors"
              title="Hide"
            >
              ×
            </button>
          </div>
        </div>

        {/* Metrics */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-3 space-y-2">
                {sortedMetrics.length === 0 ? (
                  <div className="text-gray-400 text-center py-2">
                    Collecting metrics...
                  </div>
                ) : (
                  sortedMetrics.map((metric) => {
                    if (!metric) return null;
                    return (
                      <div
                        key={metric.name}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <span className={getRatingColorClass(metric.rating)}>
                            {getRatingIcon(metric.rating)}
                          </span>
                          <span className="text-gray-300" title={getMetricFullName(metric.name)}>
                            {metric.name}
                          </span>
                        </div>
                        <span className={`font-bold ${getRatingColorClass(metric.rating)}`}>
                          {formatMetricValue(metric.name, metric.value)}
                        </span>
                      </div>
                    );
                  })
                )}

                {/* Actions */}
                <div className="pt-2 mt-2 border-t border-gray-700 flex gap-2">
                  <button
                    onClick={handleExportReport}
                    className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors"
                  >
                    Export Report
                  </button>
                  {reportsCount > 0 && (
                    <span className="text-gray-500 self-center">
                      {reportsCount} saved
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default VitalsMonitor;
