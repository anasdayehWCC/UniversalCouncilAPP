'use client';

/**
 * VitalsReport - Full Performance Report Component
 *
 * Displays detailed performance analysis with metrics breakdown,
 * historical data, and recommendations.
 *
 * @example
 * ```tsx
 * <VitalsReport showHistory />
 * ```
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebVitals } from '@/hooks/useWebVitals';
import {
  formatMetricValue,
  getRatingColor,
  getRatingColorClass,
  getRatingIcon,
  getMetricFullName,
  getMetricDescription,
  getThresholds,
  formatTimestamp,
  calculatePercentile,
} from '@/lib/vitals/utils';
import type { MetricName, PerformanceReport as PerformanceReportType, Metric } from '@/lib/vitals/types';

// Display order for metrics
const METRIC_ORDER: MetricName[] = ['LCP', 'FID', 'CLS', 'TTFB', 'INP', 'FCP'];

interface VitalsReportProps {
  /** Show historical reports */
  showHistory?: boolean;
  /** Max history items to show */
  maxHistory?: number;
  /** Show recommendations */
  showRecommendations?: boolean;
  /** Custom className */
  className?: string;
}

export function VitalsReport({
  showHistory = false,
  maxHistory = 10,
  showRecommendations = true,
  className = '',
}: VitalsReportProps) {
  const [expandedMetric, setExpandedMetric] = useState<MetricName | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  const { metricsArray, score, scoreRating, marks, getReports, generateReport } = useWebVitals({
    refreshInterval: 1000,
  });

  // Get historical reports
  const reports = useMemo(() => getReports().slice(-maxHistory), [getReports, maxHistory]);

  // Sort metrics by display order
  const sortedMetrics = useMemo(() => {
    return METRIC_ORDER.map((name) => metricsArray.find((m) => m.name === name)).filter(
      (m): m is Metric => m !== undefined
    );
  }, [metricsArray]);

  // Calculate historical percentiles for each metric
  const historicalStats = useMemo(() => {
    const stats: Partial<Record<MetricName, { p50: number; p75: number; p95: number }>> = {};

    METRIC_ORDER.forEach((name) => {
      const values = reports
        .map((r) => r.metrics[name]?.value)
        .filter((v): v is number => v !== undefined);

      if (values.length >= 3) {
        stats[name] = {
          p50: calculatePercentile(values, 50),
          p75: calculatePercentile(values, 75),
          p95: calculatePercentile(values, 95),
        };
      }
    });

    return stats;
  }, [reports]);

  // Get recommendations based on metrics
  const recommendations = useMemo(() => {
    const recs: { metric: MetricName; message: string; priority: 'high' | 'medium' | 'low' }[] = [];

    sortedMetrics.forEach((metric) => {
      if (metric.rating === 'poor') {
        recs.push({
          metric: metric.name,
          message: getRecommendation(metric.name, 'poor'),
          priority: 'high',
        });
      } else if (metric.rating === 'needs-improvement') {
        recs.push({
          metric: metric.name,
          message: getRecommendation(metric.name, 'needs-improvement'),
          priority: 'medium',
        });
      }
    });

    return recs;
  }, [sortedMetrics]);

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Performance Report
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Core Web Vitals Analysis
            </p>
          </div>

          {/* Overall Score */}
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{ backgroundColor: `${getRatingColor(scoreRating)}15` }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center border-4 font-bold text-2xl"
              style={{
                borderColor: getRatingColor(scoreRating),
                color: getRatingColor(scoreRating),
              }}
            >
              {score}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Overall Score
              </div>
              <div
                className="text-lg font-bold capitalize"
                style={{ color: getRatingColor(scoreRating) }}
              >
                {scoreRating.replace('-', ' ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedMetrics.map((metric) => {
            const isExpanded = expandedMetric === metric.name;
            const thresholds = getThresholds(metric.name);
            const stats = historicalStats[metric.name];

            return (
              <motion.div
                key={metric.name}
                layout
                className={`rounded-lg border transition-colors cursor-pointer ${
                  isExpanded
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setExpandedMetric(isExpanded ? null : metric.name)}
              >
                <div className="p-4">
                  {/* Metric Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={getRatingColorClass(metric.rating)}>
                          {getRatingIcon(metric.rating)}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {metric.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {getMetricFullName(metric.name)}
                      </div>
                    </div>
                    <div
                      className="text-xl font-bold"
                      style={{ color: getRatingColor(metric.rating) }}
                    >
                      {formatMetricValue(metric.name, metric.value)}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (metric.value / thresholds.poor) * 100)}%`,
                        backgroundColor: getRatingColor(metric.rating),
                      }}
                    />
                  </div>

                  {/* Thresholds */}
                  <div className="mt-2 flex justify-between text-xs text-gray-400">
                    <span>Good: &lt;{formatMetricValue(metric.name, thresholds.good)}</span>
                    <span>Poor: &gt;{formatMetricValue(metric.name, thresholds.poor)}</span>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {getMetricDescription(metric.name)}
                          </p>

                          {stats && (
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <div className="text-xs text-gray-400">P50</div>
                                <div className="font-mono font-bold text-sm">
                                  {formatMetricValue(metric.name, stats.p50)}
                                </div>
                              </div>
                              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <div className="text-xs text-gray-400">P75</div>
                                <div className="font-mono font-bold text-sm">
                                  {formatMetricValue(metric.name, stats.p75)}
                                </div>
                              </div>
                              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <div className="text-xs text-gray-400">P95</div>
                                <div className="font-mono font-bold text-sm">
                                  {formatMetricValue(metric.name, stats.p95)}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-gray-400">
                            Delta: {formatMetricValue(metric.name, metric.delta)} | Nav: {metric.navigationType}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty state */}
        {sortedMetrics.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-3">📊</div>
            <div className="font-medium">Collecting metrics...</div>
            <div className="text-sm">Navigate the app to start gathering performance data</div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Recommendations
          </h3>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  rec.priority === 'high'
                    ? 'bg-destructive/10'
                    : 'bg-warning/10'
                }`}
              >
                <span className={rec.priority === 'high' ? 'text-destructive' : 'text-warning'}>
                  {rec.priority === 'high' ? '🔴' : '🟡'}
                </span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {rec.metric}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{rec.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Marks */}
      {marks.size > 0 && (
        <div className="px-6 pb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Custom Performance Marks
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(marks.values()).map((mark) => (
              <div
                key={mark.name}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-mono"
              >
                {mark.name}
                {mark.duration !== undefined && (
                  <span className="ml-1 text-gray-500">{mark.duration.toFixed(1)}ms</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Toggle */}
      {showHistory && reports.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            className="w-full px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
          >
            <span>Historical Reports ({reports.length})</span>
            <span className={`transform transition-transform ${showHistoryPanel ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          <AnimatePresence>
            {showHistoryPanel && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 space-y-2">
                  {reports
                    .slice()
                    .reverse()
                    .map((report, i) => (
                      <ReportHistoryItem key={report.id} report={report} />
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-3">
        <button
          onClick={() => {
            const report = generateReport();
            console.log('[Vitals] Report:', report);
            navigator.clipboard?.writeText(JSON.stringify(report, null, 2));
          }}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Export Report
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

/**
 * History item component
 */
function ReportHistoryItem({ report }: { report: PerformanceReportType }) {
  const metricValues = Object.entries(report.metrics)
    .map(([name, metric]) => (metric ? `${name}: ${formatMetricValue(metric.name, metric.value)}` : null))
    .filter(Boolean)
    .join(' | ');

  return (
    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-500 dark:text-gray-400">
          {formatTimestamp(report.timestamp)}
        </span>
        <span className="font-bold" style={{ color: getRatingColor(report.score >= 90 ? 'good' : report.score >= 50 ? 'needs-improvement' : 'poor') }}>
          {report.score}
        </span>
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-300 font-mono truncate">
        {metricValues || 'No metrics'}
      </div>
    </div>
  );
}

/**
 * Get recommendation message for a metric
 */
function getRecommendation(
  metric: MetricName,
  rating: 'poor' | 'needs-improvement'
): string {
  const recs: Record<MetricName, { poor: string; 'needs-improvement': string }> = {
    LCP: {
      poor: 'Optimize images, preload critical resources, and reduce server response time.',
      'needs-improvement': 'Consider lazy loading off-screen images and optimizing CSS delivery.',
    },
    FID: {
      poor: 'Break up long tasks, use a web worker for heavy computations, and defer non-critical JavaScript.',
      'needs-improvement': 'Review third-party scripts and consider code splitting.',
    },
    CLS: {
      poor: 'Add size attributes to images/videos, avoid inserting content above existing content.',
      'needs-improvement': 'Reserve space for dynamic content and use CSS aspect-ratio.',
    },
    TTFB: {
      poor: 'Optimize server response time, use a CDN, and implement caching strategies.',
      'needs-improvement': 'Review database queries and consider edge computing.',
    },
    INP: {
      poor: 'Optimize event handlers, use requestAnimationFrame for visual updates.',
      'needs-improvement': 'Debounce/throttle frequent events and minimize main thread work.',
    },
    FCP: {
      poor: 'Eliminate render-blocking resources and inline critical CSS.',
      'needs-improvement': 'Preconnect to required origins and optimize font loading.',
    },
  };

  return recs[metric]?.[rating] || 'Review and optimize this metric.';
}

export default VitalsReport;
