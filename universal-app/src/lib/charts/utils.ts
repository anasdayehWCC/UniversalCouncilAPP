/**
 * Chart Utilities - Scale calculations, color generation, animation helpers
 * Universal Council App - Multi-tenant SaaS Platform
 */

import type {
  ChartPoint,
  ChartSeries,
  ChartData,
  ChartConfig,
  ChartDimensions,
  ChartColors,
  ScaleFunction,
  Domain,
} from './types';

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_COLORS: ChartColors = {
  primary: [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#06B6D4', // cyan-500
    '#F97316', // orange-500
  ],
  secondary: [
    '#93C5FD', // blue-300
    '#6EE7B7', // emerald-300
    '#FCD34D', // amber-300
    '#FCA5A5', // red-300
    '#C4B5FD', // violet-300
    '#F9A8D4', // pink-300
    '#67E8F9', // cyan-300
    '#FDBA74', // orange-300
  ],
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  neutral: '#6B7280',
  background: '#FFFFFF',
  text: '#1F2937',
  grid: '#E5E7EB',
  axis: '#9CA3AF',
};

export const DARK_MODE_COLORS: Partial<ChartColors> = {
  background: '#1F2937',
  text: '#F9FAFB',
  grid: '#374151',
  axis: '#6B7280',
};

export const DEFAULT_MARGIN = {
  top: 20,
  right: 20,
  bottom: 40,
  left: 50,
};

export const DEFAULT_ANIMATION = {
  enabled: true,
  duration: 500,
  easing: 'ease-out' as const,
  delay: 0,
  stagger: 50,
};

// ============================================================================
// Scale Functions
// ============================================================================

/**
 * Creates a linear scale function
 */
export function createLinearScale(
  domain: [number, number],
  range: [number, number]
): ScaleFunction {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const scale = (r1 - r0) / (d1 - d0);
  
  return (value: number | string | Date) => {
    const numValue = typeof value === 'number' ? value : Number(value);
    return r0 + (numValue - d0) * scale;
  };
}

/**
 * Creates a band scale function for categorical data
 */
export function createBandScale(
  domain: string[],
  range: [number, number],
  padding = 0.1
): ScaleFunction & { bandwidth: () => number } {
  const [r0, r1] = range;
  const totalRange = r1 - r0;
  const step = totalRange / domain.length;
  const bandwidth = step * (1 - padding);
  const offset = (step * padding) / 2;
  
  const scale = ((value: number | string | Date) => {
    const strValue = String(value);
    const index = domain.indexOf(strValue);
    if (index === -1) return r0;
    return r0 + index * step + offset;
  }) as ScaleFunction & { bandwidth: () => number };
  
  scale.bandwidth = () => bandwidth;
  
  return scale;
}

/**
 * Creates a time scale function
 */
export function createTimeScale(
  domain: [Date, Date],
  range: [number, number]
): ScaleFunction {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const t0 = d0.getTime();
  const t1 = d1.getTime();
  const scale = (r1 - r0) / (t1 - t0);
  
  return (value: number | string | Date) => {
    const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
    return r0 + (time - t0) * scale;
  };
}

/**
 * Inverts a linear scale
 */
export function invertLinearScale(
  domain: [number, number],
  range: [number, number],
  value: number
): number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const scale = (d1 - d0) / (r1 - r0);
  return d0 + (value - r0) * scale;
}

// ============================================================================
// Domain Calculations
// ============================================================================

/**
 * Calculates the numeric domain from chart data
 */
export function calculateDomain(
  data: ChartData,
  axis: 'x' | 'y',
  padding = 0.1
): Domain {
  const values: number[] = [];
  
  for (const series of data.series) {
    for (const point of series.data) {
      const value = axis === 'x' ? point.x : point.y;
      if (typeof value === 'number') {
        values.push(value);
      }
    }
  }
  
  if (values.length === 0) return [0, 100];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const paddedMin = axis === 'y' ? Math.min(0, min - range * padding) : min - range * padding;
  const paddedMax = max + range * padding;
  
  return [paddedMin, paddedMax];
}

/**
 * Calculates categorical domain from chart data
 */
export function calculateCategoricalDomain(data: ChartData): string[] {
  if (data.categories) return data.categories;
  
  const categories = new Set<string>();
  for (const series of data.series) {
    for (const point of series.data) {
      categories.add(String(point.x));
    }
  }
  
  return Array.from(categories);
}

/**
 * Generates nice tick values for an axis
 */
export function generateTicks(
  domain: [number, number],
  count = 5
): number[] {
  const [min, max] = domain;
  const range = max - min;
  const step = range / (count - 1);
  
  // Find a "nice" step value
  const magnitude = Math.pow(10, Math.floor(Math.log10(step)));
  const residual = step / magnitude;
  let niceStep: number;
  
  if (residual <= 1.5) niceStep = magnitude;
  else if (residual <= 3) niceStep = 2 * magnitude;
  else if (residual <= 7) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;
  
  const niceMin = Math.floor(min / niceStep) * niceStep;
  const ticks: number[] = [];
  
  for (let v = niceMin; v <= max + niceStep * 0.5; v += niceStep) {
    if (v >= min - niceStep * 0.1) {
      ticks.push(Math.round(v * 1000) / 1000);
    }
  }
  
  return ticks;
}

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Gets a color for a series by index
 */
export function getSeriesColor(
  index: number,
  colors: ChartColors = DEFAULT_COLORS
): string {
  return colors.primary[index % colors.primary.length];
}

/**
 * Generates a color scale for heatmaps
 */
export function generateColorScale(
  steps: number,
  startColor = '#E0F2FE',
  endColor = '#0369A1'
): string[] {
  const colors: string[] = [];
  
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);
  
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(start.r + (end.r - start.r) * t);
    const g = Math.round(start.g + (end.g - start.g) * t);
    const b = Math.round(start.b + (end.b - start.b) * t);
    colors.push(rgbToHex(r, g, b));
  }
  
  return colors;
}

/**
 * Converts hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Converts RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Adjusts color brightness
 */
export function adjustBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  return rgbToHex(
    Math.min(255, Math.round(r * factor)),
    Math.min(255, Math.round(g * factor)),
    Math.min(255, Math.round(b * factor))
  );
}

/**
 * Makes a color semi-transparent
 */
export function withOpacity(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ============================================================================
// Animation Helpers
// ============================================================================

/**
 * Easing functions
 */
export const easings = {
  linear: (t: number) => t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => 1 - (1 - t) * (1 - t),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  spring: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/**
 * Interpolates between two values
 */
export function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

/**
 * Interpolates arrays of values
 */
export function interpolateArray(
  start: number[],
  end: number[],
  progress: number
): number[] {
  return start.map((s, i) => interpolate(s, end[i] ?? s, progress));
}

/**
 * Generates CSS animation keyframes
 */
export function generateKeyframes(
  from: Record<string, string | number>,
  to: Record<string, string | number>
): string {
  const fromStr = Object.entries(from).map(([k, v]) => `${k}: ${v}`).join('; ');
  const toStr = Object.entries(to).map(([k, v]) => `${k}: ${v}`).join('; ');
  return `@keyframes chartAnim { from { ${fromStr} } to { ${toStr} } }`;
}

// ============================================================================
// Path Generators
// ============================================================================

/**
 * Generates SVG path for a line
 */
export function generateLinePath(
  points: Array<{ x: number; y: number }>,
  curved = false
): string {
  if (points.length === 0) return '';
  
  if (curved) {
    return generateCurvedPath(points);
  }
  
  return points.reduce((path, point, i) => {
    return path + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
  }, '');
}

/**
 * Generates curved SVG path using Catmull-Rom splines
 */
export function generateCurvedPath(
  points: Array<{ x: number; y: number }>
): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  
  return path;
}

/**
 * Generates SVG path for an area
 */
export function generateAreaPath(
  points: Array<{ x: number; y: number }>,
  baseline: number,
  curved = false
): string {
  if (points.length === 0) return '';
  
  const linePath = curved ? generateCurvedPath(points) : generateLinePath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  
  return `${linePath} L ${lastPoint.x} ${baseline} L ${firstPoint.x} ${baseline} Z`;
}

/**
 * Generates SVG arc path for pie slices
 */
export function generateArcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, outerRadius, endAngle);
  const end = polarToCartesian(cx, cy, outerRadius, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle);
  
  const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;
  
  if (innerRadius === 0) {
    // Pie slice
    return [
      `M ${cx} ${cy}`,
      `L ${start.x} ${start.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      'Z',
    ].join(' ');
  }
  
  // Donut slice
  return [
    `M ${start.x} ${start.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

/**
 * Converts polar coordinates to cartesian
 */
export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angle: number
): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angle - Math.PI / 2),
    y: cy + radius * Math.sin(angle - Math.PI / 2),
  };
}

// ============================================================================
// Dimension Calculations
// ============================================================================

/**
 * Calculates chart dimensions from config and container
 */
export function calculateDimensions(
  containerWidth: number,
  containerHeight: number,
  config?: ChartConfig
): ChartDimensions {
  const margin = { ...DEFAULT_MARGIN, ...config?.margin };
  
  const width = config?.width === 'auto' || !config?.width 
    ? containerWidth 
    : config.width;
    
  const height = config?.height === 'auto' || !config?.height
    ? config?.aspectRatio 
      ? width / config.aspectRatio
      : containerHeight
    : config.height;
  
  return {
    width,
    height,
    innerWidth: Math.max(0, width - margin.left - margin.right),
    innerHeight: Math.max(0, height - margin.top - margin.bottom),
    margin,
  };
}

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Normalizes chart data for stacked charts
 */
export function stackData(data: ChartData): ChartData {
  const categories = calculateCategoricalDomain(data);
  const stacked: ChartSeries[] = [];
  
  const baselines: Record<string, number> = {};
  categories.forEach(cat => baselines[cat] = 0);
  
  for (const series of data.series) {
    const stackedPoints: ChartPoint[] = [];
    
    for (const point of series.data) {
      const cat = String(point.x);
      const baseline = baselines[cat];
      stackedPoints.push({
        ...point,
        y: baseline + point.y,
        metadata: { ...point.metadata, baseline },
      });
      baselines[cat] = baseline + point.y;
    }
    
    stacked.push({ ...series, data: stackedPoints });
  }
  
  return { ...data, series: stacked };
}

/**
 * Calculates percentage values for pie charts
 */
export function calculatePieAngles(
  data: ChartPoint[],
  startAngle = 0,
  endAngle = Math.PI * 2
): Array<{ point: ChartPoint; startAngle: number; endAngle: number; percentage: number }> {
  const total = data.reduce((sum, p) => sum + p.y, 0);
  const range = endAngle - startAngle;
  
  let currentAngle = startAngle;
  
  return data.map(point => {
    const percentage = total > 0 ? point.y / total : 0;
    const angle = percentage * range;
    const result = {
      point,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      percentage,
    };
    currentAngle += angle;
    return result;
  });
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Formats a number for display
 */
export function formatNumber(value: number, decimals = 0): string {
  if (Math.abs(value) >= 1e9) {
    return (value / 1e9).toFixed(decimals) + 'B';
  }
  if (Math.abs(value) >= 1e6) {
    return (value / 1e6).toFixed(decimals) + 'M';
  }
  if (Math.abs(value) >= 1e3) {
    return (value / 1e3).toFixed(decimals) + 'K';
  }
  return value.toFixed(decimals);
}

/**
 * Formats a percentage for display
 */
export function formatPercentage(value: number, decimals = 1): string {
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * Formats a date for axis labels
 */
export function formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'short'): string {
  const options: Intl.DateTimeFormatOptions = 
    format === 'short' ? { month: 'short', day: 'numeric' }
    : format === 'medium' ? { month: 'short', day: 'numeric', year: '2-digit' }
    : { month: 'long', day: 'numeric', year: 'numeric' };
  
  return date.toLocaleDateString('en-GB', options);
}

// ============================================================================
// Accessibility Helpers
// ============================================================================

/**
 * Generates ARIA description for chart data
 */
export function generateAriaDescription(data: ChartData, chartType: string): string {
  const seriesDesc = data.series.map(s => {
    const values = s.data.map(p => p.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return `${s.name}: minimum ${formatNumber(min)}, maximum ${formatNumber(max)}, average ${formatNumber(avg, 1)}`;
  }).join('. ');
  
  return `${chartType} chart${data.title ? ` showing ${data.title}` : ''}. ${data.series.length} series. ${seriesDesc}`;
}

/**
 * Generates screen reader text for a data point
 */
export function generatePointDescription(point: ChartPoint, series: ChartSeries): string {
  const xLabel = point.label || String(point.x);
  return `${series.name}: ${xLabel}, value ${formatNumber(point.y)}`;
}
