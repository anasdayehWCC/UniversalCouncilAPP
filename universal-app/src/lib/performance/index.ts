/**
 * Performance Monitoring Module
 *
 * Comprehensive performance monitoring for Universal Council App.
 * Provides Core Web Vitals tracking, performance budgets, slow render
 * detection, user journey tracking, and analytics integration.
 *
 * @example
 * ```tsx
 * // Initialize in app entry
 * import { initPerformanceMonitor, initPerformanceReporter } from '@/lib/performance';
 *
 * initPerformanceMonitor({ debug: true });
 * initPerformanceReporter({ sampleRate: 0.1 });
 *
 * // Track component renders
 * import { usePerformance } from '@/hooks/usePerformance';
 *
 * function MyComponent() {
 *   const perf = usePerformance('MyComponent');
 *   // Component automatically tracked
 * }
 *
 * // Track user journeys
 * import { startJourney, markJourneyStep, endJourney } from '@/lib/performance';
 *
 * startJourney('recording');
 * markJourneyStep('recording', 'recorder-init');
 * endJourney('recording');
 * ```
 */

// Types
export type {
  PerformanceBudget,
  SlowRenderInfo,
  SlowRenderConfig,
  JourneyMark,
  JourneyConfig,
  ComponentPerformance,
  MemoryInfo,
  LongTaskInfo,
  PerformanceMonitorConfig,
  PerformanceMonitorState,
  PerformanceBatchReport,
  JourneySummary,
  ComponentSummary,
  DeviceInfo,
} from './types';

export { DEFAULT_BUDGETS, DEFAULT_MONITOR_CONFIG, USER_JOURNEYS } from './types';

// Monitor
export {
  initPerformanceMonitor,
  shutdownPerformanceMonitor,
  // FPS
  getCurrentFps,
  // Memory
  getMemoryInfo,
  formatMemorySize,
  // Long tasks
  getLongTasks,
  // Budgets
  checkBudgets,
  addBudget,
  removeBudget,
  getBudgets,
  getBudgetViolations,
  // Slow renders
  trackRender,
  getComponentPerformance,
  getAllComponentPerformance,
  getSlowRenders,
  clearSlowRenders,
  // Journeys
  startJourney,
  markJourneyStep,
  endJourney,
  getJourneyMarks,
  getActiveJourneys,
  clearJourney,
  // Timing
  startTiming,
  endTiming,
  measureFunction,
  measureAsyncFunction,
  // State
  getMonitorState,
  isMonitorActive,
  getSessionId,
  resetMonitorState,
  getMonitorConfig,
  updateMonitorConfig,
} from './monitor';

// Reporter
export {
  initPerformanceReporter,
  shutdownPerformanceReporter,
  generateBatchReport,
  queueReport,
  flushReports,
  getReporterConfig,
  updateReporterConfig,
  isReporterActive,
  getPendingReportCount,
} from './reporter';

export type { PerformanceReporterConfig } from './reporter';
