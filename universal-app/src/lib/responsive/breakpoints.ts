/**
 * Breakpoint Utilities for Universal Council App
 * 
 * Tailwind CSS v4 compatible breakpoints with media query utilities
 * and container queries for responsive design.
 */

import type { 
  Breakpoint, 
  BreakpointConfig, 
  BreakpointMap, 
  DeviceType,
  ContainerBreakpoints 
} from './types';

/**
 * Breakpoint values in pixels
 * Aligned with Tailwind CSS v4 defaults
 */
export const BREAKPOINT_VALUES: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Breakpoint configurations with device type mappings
 */
export const BREAKPOINTS: BreakpointMap = {
  xs: {
    min: 0,
    max: 640,
    query: '(max-width: 639px)',
    deviceType: 'mobile',
  },
  sm: {
    min: 640,
    max: 768,
    query: '(min-width: 640px) and (max-width: 767px)',
    deviceType: 'mobile',
  },
  md: {
    min: 768,
    max: 1024,
    query: '(min-width: 768px) and (max-width: 1023px)',
    deviceType: 'tablet',
  },
  lg: {
    min: 1024,
    max: 1280,
    query: '(min-width: 1024px) and (max-width: 1279px)',
    deviceType: 'desktop',
  },
  xl: {
    min: 1280,
    max: 1536,
    query: '(min-width: 1280px) and (max-width: 1535px)',
    deviceType: 'desktop',
  },
  '2xl': {
    min: 1536,
    max: Infinity,
    query: '(min-width: 1536px)',
    deviceType: 'desktop',
  },
} as const;

/**
 * Container query breakpoints for component-level responsiveness
 */
export const CONTAINER_BREAKPOINTS: ContainerBreakpoints = {
  xs: '(min-width: 0px)',
  sm: '(min-width: 320px)',
  md: '(min-width: 480px)',
  lg: '(min-width: 640px)',
  xl: '(min-width: 800px)',
} as const;

/**
 * Get the current breakpoint based on viewport width
 */
export function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINT_VALUES.sm) return 'xs';
  if (width < BREAKPOINT_VALUES.md) return 'sm';
  if (width < BREAKPOINT_VALUES.lg) return 'md';
  if (width < BREAKPOINT_VALUES.xl) return 'lg';
  if (width < BREAKPOINT_VALUES['2xl']) return 'xl';
  return '2xl';
}

/**
 * Get the device type based on viewport width
 */
export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINT_VALUES.md) return 'mobile';
  if (width < BREAKPOINT_VALUES.lg) return 'tablet';
  return 'desktop';
}

/**
 * Compare breakpoints
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareBreakpoints(a: Breakpoint, b: Breakpoint): number {
  return BREAKPOINT_VALUES[a] - BREAKPOINT_VALUES[b];
}

/**
 * Check if current breakpoint is at or above the specified breakpoint
 */
export function isBreakpointUp(current: Breakpoint, target: Breakpoint): boolean {
  return BREAKPOINT_VALUES[current] >= BREAKPOINT_VALUES[target];
}

/**
 * Check if current breakpoint is at or below the specified breakpoint
 */
export function isBreakpointDown(current: Breakpoint, target: Breakpoint): boolean {
  return BREAKPOINT_VALUES[current] <= BREAKPOINT_VALUES[target];
}

/**
 * Check if current breakpoint is between two breakpoints (inclusive)
 */
export function isBreakpointBetween(
  current: Breakpoint,
  from: Breakpoint,
  to: Breakpoint
): boolean {
  const currentValue = BREAKPOINT_VALUES[current];
  return currentValue >= BREAKPOINT_VALUES[from] && currentValue <= BREAKPOINT_VALUES[to];
}

/**
 * Generate media query for minimum width
 */
export function minWidth(breakpoint: Breakpoint | number): string {
  const value = typeof breakpoint === 'number' ? breakpoint : BREAKPOINT_VALUES[breakpoint];
  return `(min-width: ${value}px)`;
}

/**
 * Generate media query for maximum width
 */
export function maxWidth(breakpoint: Breakpoint | number): string {
  const value = typeof breakpoint === 'number' ? breakpoint : BREAKPOINT_VALUES[breakpoint] - 1;
  return `(max-width: ${value}px)`;
}

/**
 * Generate media query for width between two breakpoints
 */
export function between(from: Breakpoint | number, to: Breakpoint | number): string {
  const fromValue = typeof from === 'number' ? from : BREAKPOINT_VALUES[from];
  const toValue = typeof to === 'number' ? to : BREAKPOINT_VALUES[to] - 1;
  return `(min-width: ${fromValue}px) and (max-width: ${toValue}px)`;
}

/**
 * Generate media query for portrait orientation
 */
export function portrait(): string {
  return '(orientation: portrait)';
}

/**
 * Generate media query for landscape orientation
 */
export function landscape(): string {
  return '(orientation: landscape)';
}

/**
 * Generate media query for touch devices
 */
export function touchDevice(): string {
  return '(hover: none) and (pointer: coarse)';
}

/**
 * Generate media query for hover-capable devices
 */
export function hoverDevice(): string {
  return '(hover: hover) and (pointer: fine)';
}

/**
 * Generate media query for reduced motion preference
 */
export function reducedMotion(): string {
  return '(prefers-reduced-motion: reduce)';
}

/**
 * Generate media query for high contrast mode
 */
export function highContrast(): string {
  return '(prefers-contrast: more)';
}

/**
 * Generate media query for dark color scheme preference
 */
export function darkMode(): string {
  return '(prefers-color-scheme: dark)';
}

/**
 * CSS custom properties for responsive design
 */
export const CSS_VARIABLES = {
  // Breakpoint values as CSS variables
  '--breakpoint-xs': '0px',
  '--breakpoint-sm': '640px',
  '--breakpoint-md': '768px',
  '--breakpoint-lg': '1024px',
  '--breakpoint-xl': '1280px',
  '--breakpoint-2xl': '1536px',
  
  // Container widths
  '--container-sm': '640px',
  '--container-md': '768px',
  '--container-lg': '1024px',
  '--container-xl': '1280px',
  '--container-2xl': '1536px',
  
  // Touch-friendly minimum sizes
  '--min-tap-target': '44px',
  '--tap-target-spacing': '8px',
  
  // Safe area insets (for notched devices)
  '--safe-area-inset-top': 'env(safe-area-inset-top, 0px)',
  '--safe-area-inset-right': 'env(safe-area-inset-right, 0px)',
  '--safe-area-inset-bottom': 'env(safe-area-inset-bottom, 0px)',
  '--safe-area-inset-left': 'env(safe-area-inset-left, 0px)',
} as const;

/**
 * Container query size classes for Tailwind
 */
export const CONTAINER_QUERIES = {
  '@xs': '@container (min-width: 0px)',
  '@sm': '@container (min-width: 320px)',
  '@md': '@container (min-width: 480px)',
  '@lg': '@container (min-width: 640px)',
  '@xl': '@container (min-width: 800px)',
} as const;

/**
 * Utility function to create responsive value object
 */
export function responsive<T>(
  base: T,
  overrides?: Partial<Record<Breakpoint, T>>
): Record<Breakpoint, T> {
  return {
    xs: overrides?.xs ?? base,
    sm: overrides?.sm ?? overrides?.xs ?? base,
    md: overrides?.md ?? overrides?.sm ?? overrides?.xs ?? base,
    lg: overrides?.lg ?? overrides?.md ?? overrides?.sm ?? overrides?.xs ?? base,
    xl: overrides?.xl ?? overrides?.lg ?? overrides?.md ?? overrides?.sm ?? overrides?.xs ?? base,
    '2xl': overrides?.['2xl'] ?? overrides?.xl ?? overrides?.lg ?? overrides?.md ?? overrides?.sm ?? overrides?.xs ?? base,
  };
}

/**
 * Get the value for a specific breakpoint, cascading down to smaller breakpoints
 */
export function getResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  breakpoint: Breakpoint
): T | undefined {
  const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpoints.indexOf(breakpoint);
  
  // Look for value at current breakpoint, then cascade down
  for (let i = currentIndex; i >= 0; i--) {
    const value = values[breakpoints[i]];
    if (value !== undefined) return value;
  }
  
  return undefined;
}

/**
 * Create a CSS clamp value for fluid typography/spacing
 */
export function fluidValue(
  minValue: number,
  maxValue: number,
  minBreakpoint: Breakpoint = 'sm',
  maxBreakpoint: Breakpoint = 'xl',
  unit: string = 'rem'
): string {
  const minVw = BREAKPOINT_VALUES[minBreakpoint];
  const maxVw = BREAKPOINT_VALUES[maxBreakpoint];
  
  // Calculate the slope
  const slope = (maxValue - minValue) / (maxVw - minVw);
  const yIntercept = minValue - slope * minVw;
  
  // Convert to vw and pixel values
  const slopeVw = (slope * 100).toFixed(4);
  const interceptPx = (yIntercept * 16).toFixed(2); // Assuming 1rem = 16px
  
  return `clamp(${minValue}${unit}, ${interceptPx}px + ${slopeVw}vw, ${maxValue}${unit})`;
}

/**
 * Tailwind v4 theme extension for responsive utilities
 */
export const tailwindResponsiveConfig = {
  screens: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  containers: {
    xs: '0px',
    sm: '320px',
    md: '480px',
    lg: '640px',
    xl: '800px',
  },
};
