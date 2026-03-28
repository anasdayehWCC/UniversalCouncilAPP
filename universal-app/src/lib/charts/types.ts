/**
 * Chart Types - Pure SVG Chart Components
 * Universal Council App - Multi-tenant SaaS Platform
 */

// ============================================================================
// Core Data Types
// ============================================================================

/** Single data point in a chart */
export interface ChartPoint {
  x: number | string | Date;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

/** Series of data points for multi-series charts */
export interface ChartSeries {
  id: string;
  name: string;
  data: ChartPoint[];
  color?: string;
  /** For line/area charts */
  strokeWidth?: number;
  /** For area charts */
  fillOpacity?: number;
  /** For bar charts */
  stackGroup?: string;
}

/** Generic chart data container */
export interface ChartData {
  series: ChartSeries[];
  categories?: string[];
  title?: string;
  subtitle?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

/** Color palette configuration */
export interface ChartColors {
  primary: string[];
  secondary: string[];
  success: string;
  warning: string;
  error: string;
  neutral: string;
  background: string;
  text: string;
  grid: string;
  axis: string;
}

/** Animation configuration */
export interface ChartAnimation {
  enabled: boolean;
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  delay?: number;
  stagger?: number;
}

/** Responsive breakpoints */
export interface ChartBreakpoints {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

/** Axis configuration */
export interface AxisConfig {
  show: boolean;
  title?: string;
  tickCount?: number;
  tickFormat?: (value: number | string) => string;
  min?: number;
  max?: number;
  gridLines?: boolean;
}

/** Legend configuration */
export interface LegendConfig {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  orientation?: 'horizontal' | 'vertical';
}

/** Tooltip configuration */
export interface TooltipConfig {
  enabled: boolean;
  followCursor?: boolean;
  format?: (point: ChartPoint, series?: ChartSeries) => string;
  showSeries?: boolean;
}

/** Grid configuration */
export interface GridConfig {
  show: boolean;
  strokeDasharray?: string;
  opacity?: number;
  horizontal?: boolean;
  vertical?: boolean;
}

/** Complete chart configuration */
export interface ChartConfig {
  width?: number | 'auto';
  height?: number | 'auto';
  aspectRatio?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors?: Partial<ChartColors>;
  animation?: Partial<ChartAnimation>;
  xAxis?: Partial<AxisConfig>;
  yAxis?: Partial<AxisConfig>;
  legend?: Partial<LegendConfig>;
  tooltip?: Partial<TooltipConfig>;
  grid?: Partial<GridConfig>;
  accessibility?: {
    ariaLabel?: string;
    ariaDescribedBy?: string;
    announceDataChanges?: boolean;
  };
  responsive?: boolean;
  darkMode?: boolean;
}

// ============================================================================
// Component Props Types
// ============================================================================

/** Base props for all chart components */
export interface BaseChartProps {
  data: ChartData;
  config?: ChartConfig;
  className?: string;
  id?: string;
  onPointClick?: (point: ChartPoint, series: ChartSeries) => void;
  onPointHover?: (point: ChartPoint | null, series?: ChartSeries) => void;
}

/** Bar chart specific props */
export interface BarChartProps extends BaseChartProps {
  orientation?: 'vertical' | 'horizontal';
  grouped?: boolean;
  stacked?: boolean;
  barRadius?: number;
  barGap?: number;
  showValues?: boolean;
}

/** Line chart specific props */
export interface LineChartProps extends BaseChartProps {
  curved?: boolean;
  showPoints?: boolean;
  pointRadius?: number;
  strokeWidth?: number;
  showArea?: boolean;
  areaOpacity?: number;
}

/** Pie chart specific props */
export interface PieChartProps extends BaseChartProps {
  innerRadius?: number;
  outerRadius?: number;
  padAngle?: number;
  showLabels?: boolean;
  labelPosition?: 'inside' | 'outside';
  startAngle?: number;
  endAngle?: number;
}

/** Area chart specific props */
export interface AreaChartProps extends BaseChartProps {
  stacked?: boolean;
  curved?: boolean;
  fillOpacity?: number;
  showLine?: boolean;
  showPoints?: boolean;
}

/** Sparkline specific props */
export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
  showMinMax?: boolean;
  showLastValue?: boolean;
  curved?: boolean;
  className?: string;
}

/** Heatmap specific props */
export interface HeatmapProps extends BaseChartProps {
  colorScale?: string[];
  cellRadius?: number;
  cellGap?: number;
  showValues?: boolean;
  minValue?: number;
  maxValue?: number;
}

// ============================================================================
// Primitive Component Props
// ============================================================================

/** Axis component props */
export interface AxisProps {
  type: 'x' | 'y';
  scale: ScaleFunction;
  position: number;
  length: number;
  config?: Partial<AxisConfig>;
  darkMode?: boolean;
}

/** Grid component props */
export interface GridProps {
  width: number;
  height: number;
  xScale?: ScaleFunction;
  yScale?: ScaleFunction;
  config?: Partial<GridConfig>;
  darkMode?: boolean;
}

/** Legend component props */
export interface LegendProps {
  items: Array<{
    id: string;
    name: string;
    color: string;
    active?: boolean;
  }>;
  config?: Partial<LegendConfig>;
  onItemClick?: (id: string) => void;
  darkMode?: boolean;
}

/** Tooltip component props */
export interface TooltipProps {
  visible: boolean;
  x: number;
  y: number;
  content: React.ReactNode;
  config?: Partial<TooltipConfig>;
  darkMode?: boolean;
}

/** Data label component props */
export interface DataLabelProps {
  x: number;
  y: number;
  value: string | number;
  anchor?: 'start' | 'middle' | 'end';
  baseline?: 'auto' | 'middle' | 'hanging';
  offset?: { x: number; y: number };
  className?: string;
  darkMode?: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/** Scale function type */
export type ScaleFunction = (value: number | string | Date) => number;

/** Domain type for scales */
export type Domain = [number, number] | string[];

/** Chart dimensions after margin calculation */
export interface ChartDimensions {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/** Animation state for charts */
export interface AnimationState {
  progress: number;
  isAnimating: boolean;
  phase: 'idle' | 'entering' | 'updating' | 'exiting';
}

/** Tooltip state */
export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: React.ReactNode;
  point?: ChartPoint;
  series?: ChartSeries;
}

/** Chart interaction state */
export interface ChartInteractionState {
  hoveredPoint: ChartPoint | null;
  hoveredSeries: ChartSeries | null;
  selectedPoints: ChartPoint[];
  tooltip: TooltipState;
}
