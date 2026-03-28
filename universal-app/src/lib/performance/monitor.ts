/**
 * Performance Monitor
 *
 * Comprehensive performance monitoring for Universal Council App.
 * Tracks Core Web Vitals, custom timing marks, performance budgets,
 * slow render detection, and user journey tracking.
 *
 * @example
 * ```tsx
 * // Initialize in app entry
 * import { initPerformanceMonitor } from '@/lib/performance/monitor';
 * initPerformanceMonitor({ debug: true });
 *
 * // Track user journey
 * import { startJourney, markJourneyStep, endJourney } from '@/lib/performance/monitor';
 * startJourney('recording');
 * markJourneyStep('recording', 'recorder-init');
 * endJourney('recording');
 * ```
 */

import type {
  PerformanceMonitorConfig,
  PerformanceMonitorState,
  PerformanceBudget,
  SlowRenderInfo,
  SlowRenderConfig,
  JourneyMark,
  JourneyConfig,
  ComponentPerformance,
  MemoryInfo,
  LongTaskInfo,
} from './types';
import { DEFAULT_MONITOR_CONFIG, DEFAULT_BUDGETS, USER_JOURNEYS } from './types';
import { getCurrentMetrics, addPerformanceMark, measureBetweenMarks } from '@/lib/vitals/reporter';
import type { MetricName } from '@/lib/vitals/types';

// ============================================================================
// State
// ============================================================================

let state: PerformanceMonitorState = {
  isActive: false,
  fps: 0,
  memory: null,
  budgets: [...DEFAULT_BUDGETS],
  components: new Map(),
  journeys: new Map(),
  slowRenders: [],
  longTasks: [],
};

let config: PerformanceMonitorConfig = { ...DEFAULT_MONITOR_CONFIG };

// FPS tracking state
let fpsFrameCount = 0;
let fpsLastTime = 0;
let fpsAnimationId: number | null = null;

// Memory tracking interval
let memoryIntervalId: ReturnType<typeof setInterval> | null = null;

// Long tasks observer
let longTasksObserver: PerformanceObserver | null = null;

// Session ID for correlation
let sessionId = '';

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the performance monitor
 */
export function initPerformanceMonitor(
  customConfig?: Partial<PerformanceMonitorConfig>
): void {
  config = { ...DEFAULT_MONITOR_CONFIG, ...customConfig };

  if (!config.enabled) {
    if (config.debug) {
      console.debug('[PerfMon] Monitor disabled');
    }
    return;
  }

  sessionId = generateSessionId();
  state.isActive = true;
  state.budgets = config.budgets;

  // Start FPS tracking
  if (config.trackFps && typeof window !== 'undefined') {
    startFpsTracking();
  }

  // Start memory tracking
  if (config.trackMemory && typeof window !== 'undefined') {
    startMemoryTracking();
  }

  // Start long task detection
  if (config.trackLongTasks && typeof window !== 'undefined') {
    startLongTaskDetection();
  }

  if (config.debug) {
    console.debug('[PerfMon] Monitor initialized', { config, sessionId });
  }
}

/**
 * Shutdown the performance monitor
 */
export function shutdownPerformanceMonitor(): void {
  state.isActive = false;

  // Stop FPS tracking
  if (fpsAnimationId !== null) {
    cancelAnimationFrame(fpsAnimationId);
    fpsAnimationId = null;
  }

  // Stop memory tracking
  if (memoryIntervalId !== null) {
    clearInterval(memoryIntervalId);
    memoryIntervalId = null;
  }

  // Stop long task observer
  if (longTasksObserver) {
    longTasksObserver.disconnect();
    longTasksObserver = null;
  }

  if (config.debug) {
    console.debug('[PerfMon] Monitor shutdown');
  }
}

// ============================================================================
// FPS Tracking
// ============================================================================

/**
 * Start FPS tracking using requestAnimationFrame
 */
function startFpsTracking(): void {
  fpsLastTime = performance.now();
  fpsFrameCount = 0;

  function measureFps(timestamp: number): void {
    fpsFrameCount++;
    const elapsed = timestamp - fpsLastTime;

    // Calculate FPS every second
    if (elapsed >= 1000) {
      state.fps = Math.round((fpsFrameCount * 1000) / elapsed);
      fpsFrameCount = 0;
      fpsLastTime = timestamp;
    }

    fpsAnimationId = requestAnimationFrame(measureFps);
  }

  fpsAnimationId = requestAnimationFrame(measureFps);
}

/**
 * Get current FPS
 */
export function getCurrentFps(): number {
  return state.fps;
}

// ============================================================================
// Memory Tracking
// ============================================================================

/**
 * Start memory tracking
 */
function startMemoryTracking(): void {
  // Check if memory API is available
  const perf = performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };

  if (!perf.memory) {
    if (config.debug) {
      console.debug('[PerfMon] Memory API not available');
    }
    return;
  }

  const updateMemory = (): void => {
    if (!perf.memory) return;

    state.memory = {
      usedJSHeapSize: perf.memory.usedJSHeapSize,
      totalJSHeapSize: perf.memory.totalJSHeapSize,
      jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
      usagePercent: (perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit) * 100,
    };
  };

  // Initial update
  updateMemory();

  // Periodic updates
  memoryIntervalId = setInterval(updateMemory, config.memoryInterval);
}

/**
 * Get current memory info
 */
export function getMemoryInfo(): MemoryInfo | null {
  return state.memory;
}

/**
 * Format memory size for display
 */
export function formatMemorySize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} B`;
}

// ============================================================================
// Long Task Detection
// ============================================================================

/**
 * Start long task detection using PerformanceObserver
 */
function startLongTaskDetection(): void {
  if (typeof PerformanceObserver === 'undefined') {
    if (config.debug) {
      console.debug('[PerfMon] PerformanceObserver not available');
    }
    return;
  }

  try {
    longTasksObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > config.longTaskThreshold) {
          const longTask: LongTaskInfo = {
            duration: entry.duration,
            startTime: entry.startTime,
            attribution: getTaskAttribution(entry),
            timestamp: Date.now(),
          };

          state.longTasks.push(longTask);

          // Keep only recent long tasks
          if (state.longTasks.length > 100) {
            state.longTasks = state.longTasks.slice(-100);
          }

          if (config.debug) {
            console.warn(`[PerfMon] Long task: ${longTask.duration.toFixed(2)}ms - ${longTask.attribution}`);
          }
        }
      }
    });

    longTasksObserver.observe({ type: 'longtask', buffered: true });
  } catch {
    if (config.debug) {
      console.debug('[PerfMon] Long task observation not supported');
    }
  }
}

/**
 * Get attribution for a long task
 */
function getTaskAttribution(entry: PerformanceEntry): string {
  const taskEntry = entry as PerformanceEntry & {
    attribution?: Array<{ containerType?: string; containerSrc?: string; containerName?: string }>;
  };

  if (taskEntry.attribution && taskEntry.attribution.length > 0) {
    const attr = taskEntry.attribution[0];
    return attr.containerSrc || attr.containerName || attr.containerType || 'unknown';
  }
  return 'unknown';
}

/**
 * Get long tasks
 */
export function getLongTasks(): LongTaskInfo[] {
  return [...state.longTasks];
}

// ============================================================================
// Performance Budgets
// ============================================================================

/**
 * Check all performance budgets
 */
export function checkBudgets(): PerformanceBudget[] {
  const metrics = getCurrentMetrics();
  const violations: PerformanceBudget[] = [];

  for (const budget of state.budgets) {
    let value: number | undefined;

    // Get value from Core Web Vitals
    if (metrics.has(budget.metric as MetricName)) {
      value = metrics.get(budget.metric as MetricName)?.value;
    }

    if (value !== undefined) {
      budget.value = value;
      
      if (value > budget.error) {
        budget.status = 'error';
        violations.push(budget);
      } else if (value > budget.warning) {
        budget.status = 'warning';
        violations.push(budget);
      } else {
        budget.status = 'ok';
      }
    }
  }

  return violations;
}

/**
 * Add a custom budget
 */
export function addBudget(budget: PerformanceBudget): void {
  state.budgets.push(budget);
}

/**
 * Remove a budget
 */
export function removeBudget(name: string): void {
  state.budgets = state.budgets.filter((b) => b.name !== name);
}

/**
 * Get all budgets
 */
export function getBudgets(): PerformanceBudget[] {
  return [...state.budgets];
}

/**
 * Get budget violations
 */
export function getBudgetViolations(): PerformanceBudget[] {
  return state.budgets.filter(
    (b) => b.status === 'error' || b.status === 'warning'
  );
}

// ============================================================================
// Slow Render Detection
// ============================================================================

/**
 * Track a component render
 */
export function trackRender(
  componentName: string,
  duration: number,
  phase: 'mount' | 'update'
): void {
  if (!state.isActive) return;

  // Get or create component entry
  let component = state.components.get(componentName);
  if (!component) {
    component = {
      name: componentName,
      renderCount: 0,
      avgRenderTime: 0,
      maxRenderTime: 0,
      lastRenderTime: 0,
      slowRenderCount: 0,
      firstRender: Date.now(),
      lastRender: Date.now(),
      renderHistory: [],
    };
    state.components.set(componentName, component);
  }

  // Update component stats
  component.renderCount++;
  component.lastRenderTime = duration;
  component.lastRender = Date.now();
  component.maxRenderTime = Math.max(component.maxRenderTime, duration);

  // Update average
  component.avgRenderTime =
    (component.avgRenderTime * (component.renderCount - 1) + duration) /
    component.renderCount;

  // Add to history
  component.renderHistory.push(duration);
  if (component.renderHistory.length > config.maxHistorySize) {
    component.renderHistory.shift();
  }

  // Check for slow render
  if (
    config.slowRender.enabled &&
    duration > config.slowRender.threshold &&
    component.renderCount >= config.slowRender.minRenderCount
  ) {
    component.slowRenderCount++;

    const slowRenderInfo: SlowRenderInfo = {
      componentName,
      duration,
      renderCount: component.renderCount,
      phase,
      timestamp: Date.now(),
    };

    state.slowRenders.push(slowRenderInfo);

    // Limit stored slow renders
    if (state.slowRenders.length > config.maxSlowRenders) {
      state.slowRenders.shift();
    }

    // Call callback if provided
    config.slowRender.onSlowRender?.(slowRenderInfo);

    if (config.debug) {
      console.warn(
        `[PerfMon] Slow render: ${componentName} (${duration.toFixed(2)}ms, ${phase})`
      );
    }
  }
}

/**
 * Get component performance data
 */
export function getComponentPerformance(
  componentName: string
): ComponentPerformance | undefined {
  return state.components.get(componentName);
}

/**
 * Get all component performance data
 */
export function getAllComponentPerformance(): ComponentPerformance[] {
  return Array.from(state.components.values());
}

/**
 * Get slow renders
 */
export function getSlowRenders(): SlowRenderInfo[] {
  return [...state.slowRenders];
}

/**
 * Clear slow render history
 */
export function clearSlowRenders(): void {
  state.slowRenders = [];
}

// ============================================================================
// User Journey Tracking
// ============================================================================

/**
 * Start a user journey
 */
export function startJourney(journeyId: string, metadata?: Record<string, unknown>): void {
  const mark: JourneyMark = {
    journeyId,
    name: 'start',
    phase: 'start',
    timestamp: performance.now(),
    durationFromStart: 0,
    durationFromPrevious: 0,
    metadata,
  };

  state.journeys.set(journeyId, [mark]);

  // Also add as a performance mark
  addPerformanceMark(`journey:${journeyId}:start`, metadata);

  if (config.debug) {
    console.debug(`[PerfMon] Journey started: ${journeyId}`);
  }
}

/**
 * Mark a step in a journey
 */
export function markJourneyStep(
  journeyId: string,
  stepName: string,
  metadata?: Record<string, unknown>
): void {
  const journey = state.journeys.get(journeyId);
  if (!journey) {
    if (config.debug) {
      console.warn(`[PerfMon] Journey not found: ${journeyId}`);
    }
    return;
  }

  const now = performance.now();
  const startMark = journey[0];
  const previousMark = journey[journey.length - 1];

  const mark: JourneyMark = {
    journeyId,
    name: stepName,
    phase: 'step',
    timestamp: now,
    durationFromStart: now - startMark.timestamp,
    durationFromPrevious: now - previousMark.timestamp,
    metadata,
  };

  journey.push(mark);

  // Also add as a performance mark
  addPerformanceMark(`journey:${journeyId}:${stepName}`, {
    ...metadata,
    durationFromStart: mark.durationFromStart,
  });

  if (config.debug) {
    console.debug(
      `[PerfMon] Journey step: ${journeyId}:${stepName} (+${mark.durationFromPrevious.toFixed(2)}ms)`
    );
  }
}

/**
 * End a journey
 */
export function endJourney(
  journeyId: string,
  metadata?: Record<string, unknown>
): JourneyMark[] | null {
  const journey = state.journeys.get(journeyId);
  if (!journey) {
    if (config.debug) {
      console.warn(`[PerfMon] Journey not found: ${journeyId}`);
    }
    return null;
  }

  const now = performance.now();
  const startMark = journey[0];
  const previousMark = journey[journey.length - 1];

  const mark: JourneyMark = {
    journeyId,
    name: 'end',
    phase: 'end',
    timestamp: now,
    durationFromStart: now - startMark.timestamp,
    durationFromPrevious: now - previousMark.timestamp,
    metadata,
  };

  journey.push(mark);

  // Check against expected duration
  const journeyConfig = USER_JOURNEYS[journeyId];
  if (journeyConfig) {
    const totalDuration = mark.durationFromStart;
    const status =
      totalDuration > journeyConfig.maxDuration
        ? 'critical'
        : totalDuration > journeyConfig.expectedDuration
          ? 'slow'
          : 'ok';

    if (config.debug) {
      const emoji = status === 'ok' ? '✓' : status === 'slow' ? '⚠' : '✗';
      console.debug(
        `[PerfMon] ${emoji} Journey completed: ${journeyId} (${totalDuration.toFixed(2)}ms, ${status})`
      );
    }
  }

  return journey;
}

/**
 * Get journey marks
 */
export function getJourneyMarks(journeyId: string): JourneyMark[] | undefined {
  return state.journeys.get(journeyId);
}

/**
 * Get all active journeys
 */
export function getActiveJourneys(): Map<string, JourneyMark[]> {
  return new Map(state.journeys);
}

/**
 * Clear journey
 */
export function clearJourney(journeyId: string): void {
  state.journeys.delete(journeyId);
}

// ============================================================================
// Custom Timing Marks
// ============================================================================

/**
 * Mark the start of a timed section
 */
export function startTiming(name: string, metadata?: Record<string, unknown>): void {
  addPerformanceMark(`timing:${name}:start`, metadata);
}

/**
 * Mark the end of a timed section and return duration
 */
export function endTiming(name: string, metadata?: Record<string, unknown>): number | null {
  addPerformanceMark(`timing:${name}:end`, metadata);
  return measureBetweenMarks(`timing:${name}:start`, `timing:${name}:end`);
}

/**
 * Measure a function execution time
 */
export function measureFunction<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): { result: T; duration: number } {
  startTiming(name, metadata);
  const result = fn();
  const duration = endTiming(name) ?? 0;
  return { result, duration };
}

/**
 * Measure an async function execution time
 */
export async function measureAsyncFunction<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<{ result: T; duration: number }> {
  startTiming(name, metadata);
  const result = await fn();
  const duration = endTiming(name) ?? 0;
  return { result, duration };
}

// ============================================================================
// State Access
// ============================================================================

/**
 * Get current monitor state
 */
export function getMonitorState(): PerformanceMonitorState {
  return { ...state };
}

/**
 * Check if monitor is active
 */
export function isMonitorActive(): boolean {
  return state.isActive;
}

/**
 * Get session ID
 */
export function getSessionId(): string {
  return sessionId;
}

/**
 * Reset monitor state
 */
export function resetMonitorState(): void {
  state.components.clear();
  state.journeys.clear();
  state.slowRenders = [];
  state.longTasks = [];
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get performance monitor config
 */
export function getMonitorConfig(): PerformanceMonitorConfig {
  return { ...config };
}

/**
 * Update monitor config
 */
export function updateMonitorConfig(
  updates: Partial<PerformanceMonitorConfig>
): void {
  config = { ...config, ...updates };
}
