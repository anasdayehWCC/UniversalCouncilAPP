/**
 * useChart Hook - Chart data management, animation state, and responsive sizing
 * Universal Council App - Multi-tenant SaaS Platform
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  ChartData,
  ChartConfig,
  ChartDimensions,
  ChartInteractionState,
  ChartPoint,
  ChartSeries,
  TooltipState,
  AnimationState,
  ScaleFunction,
  Domain,
} from '@/lib/charts/types';
import {
  calculateDimensions,
  calculateDomain,
  calculateCategoricalDomain,
  createLinearScale,
  createBandScale,
  createTimeScale,
  DEFAULT_COLORS,
  DARK_MODE_COLORS,
  DEFAULT_ANIMATION,
  easings,
  getSeriesColor,
} from '@/lib/charts/utils';

export interface UseChartOptions {
  data: ChartData;
  config?: ChartConfig;
  type?: 'line' | 'bar' | 'pie' | 'area' | 'heatmap';
}

export interface UseChartReturn {
  // Dimensions
  dimensions: ChartDimensions;
  containerRef: React.RefObject<HTMLDivElement | null>;
  
  // Scales
  xScale: ScaleFunction | null;
  yScale: ScaleFunction | null;
  xDomain: Domain;
  yDomain: Domain;
  
  // Colors
  colors: typeof DEFAULT_COLORS;
  getSeriesColor: (index: number) => string;
  
  // Interaction
  interaction: ChartInteractionState;
  handlePointHover: (point: ChartPoint | null, series?: ChartSeries, event?: React.MouseEvent) => void;
  handlePointClick: (point: ChartPoint, series: ChartSeries) => void;
  hideTooltip: () => void;
  
  // Animation
  animation: AnimationState;
  animatedProgress: number;
  
  // Responsive
  isMobile: boolean;
  isTablet: boolean;
  
  // Theme
  isDarkMode: boolean;
}

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;

export function useChart({
  data,
  config,
  type = 'line',
}: UseChartOptions): UseChartReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Responsive dimensions
  const [containerSize, setContainerSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  
  // Animation state
  const [animation, setAnimation] = useState<AnimationState>({
    progress: 0,
    isAnimating: false,
    phase: 'idle',
  });
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);
  
  // Interaction state
  const [interaction, setInteraction] = useState<ChartInteractionState>({
    hoveredPoint: null,
    hoveredSeries: null,
    selectedPoints: [],
    tooltip: {
      visible: false,
      x: 0,
      y: 0,
      content: null,
    },
  });
  
  // Theme detection
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Responsive detection
  const isMobile = containerSize.width < 640;
  const isTablet = containerSize.width >= 640 && containerSize.width < 1024;
  
  // Observe container size
  useEffect(() => {
    if (!config?.responsive && config?.width !== 'auto') return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize({
          width: width || DEFAULT_WIDTH,
          height: height || DEFAULT_HEIGHT,
        });
      }
    });
    
    resizeObserver.observe(container);
    
    // Initial size
    const rect = container.getBoundingClientRect();
    setContainerSize({
      width: rect.width || DEFAULT_WIDTH,
      height: rect.height || DEFAULT_HEIGHT,
    });
    
    return () => resizeObserver.disconnect();
  }, [config?.responsive, config?.width]);
  
  // Detect dark mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const darkModeFromConfig = config?.darkMode;
    if (darkModeFromConfig !== undefined) {
      setIsDarkMode(darkModeFromConfig);
      return;
    }
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, [config?.darkMode]);
  
  // Calculate dimensions
  const dimensions = useMemo(() => {
    return calculateDimensions(containerSize.width, containerSize.height, config);
  }, [containerSize, config]);
  
  // Calculate domains
  const xDomain = useMemo(() => {
    if (type === 'bar' || type === 'heatmap') {
      return calculateCategoricalDomain(data);
    }
    return calculateDomain(data, 'x');
  }, [data, type]);
  
  const yDomain = useMemo(() => {
    return calculateDomain(data, 'y');
  }, [data]);
  
  // Create scales
  const xScale = useMemo(() => {
    if (!dimensions.innerWidth) return null;
    
    if (Array.isArray(xDomain) && typeof xDomain[0] === 'string') {
      return createBandScale(
        xDomain as string[],
        [0, dimensions.innerWidth]
      );
    }
    
    // Check if dates
    const firstPoint = data.series[0]?.data[0];
    if (firstPoint?.x instanceof Date) {
      return createTimeScale(
        [new Date(xDomain[0]), new Date(xDomain[1])],
        [0, dimensions.innerWidth]
      );
    }
    
    return createLinearScale(
      xDomain as [number, number],
      [0, dimensions.innerWidth]
    );
  }, [xDomain, dimensions.innerWidth, data.series]);
  
  const yScale = useMemo(() => {
    if (!dimensions.innerHeight) return null;
    
    return createLinearScale(
      yDomain as [number, number],
      [dimensions.innerHeight, 0] // Inverted for SVG coordinate system
    );
  }, [yDomain, dimensions.innerHeight]);
  
  // Merge colors with dark mode
  const colors = useMemo(() => {
    const base = { ...DEFAULT_COLORS, ...config?.colors };
    if (isDarkMode) {
      return { ...base, ...DARK_MODE_COLORS };
    }
    return base;
  }, [config?.colors, isDarkMode]);
  
  const getSeriesColorFn = useCallback(
    (index: number) => getSeriesColor(index, colors),
    [colors]
  );
  
  // Animation
  useEffect(() => {
    const animConfig = { ...DEFAULT_ANIMATION, ...config?.animation };
    if (!animConfig.enabled) {
      setAnimatedProgress(1);
      return;
    }
    
    setAnimation({ progress: 0, isAnimating: true, phase: 'entering' });
    setAnimatedProgress(0);
    
    const startTime = performance.now();
    const duration = animConfig.duration;
    const easing = easings[animConfig.easing];
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime - (animConfig.delay || 0);
      
      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(rawProgress);
      
      setAnimatedProgress(easedProgress);
      setAnimation(prev => ({ ...prev, progress: easedProgress }));
      
      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setAnimation({ progress: 1, isAnimating: false, phase: 'idle' });
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, config?.animation]);
  
  // Interaction handlers
  const handlePointHover = useCallback(
    (point: ChartPoint | null, series?: ChartSeries, event?: React.MouseEvent) => {
      if (!point) {
        setInteraction(prev => ({
          ...prev,
          hoveredPoint: null,
          hoveredSeries: null,
          tooltip: { ...prev.tooltip, visible: false },
        }));
        return;
      }
      
      const tooltipConfig = config?.tooltip;
      const format = tooltipConfig?.format;
      const content = format 
        ? format(point, series)
        : `${series?.name || ''}: ${point.y}`;
      
      setInteraction(prev => ({
        ...prev,
        hoveredPoint: point,
        hoveredSeries: series || null,
        tooltip: {
          visible: tooltipConfig?.enabled !== false,
          x: event?.clientX || 0,
          y: event?.clientY || 0,
          content,
          point,
          series,
        },
      }));
    },
    [config?.tooltip]
  );
  
  const handlePointClick = useCallback(
    (point: ChartPoint, series: ChartSeries) => {
      setInteraction(prev => {
        const isSelected = prev.selectedPoints.some(
          p => p.x === point.x && p.y === point.y
        );
        
        return {
          ...prev,
          selectedPoints: isSelected
            ? prev.selectedPoints.filter(p => p.x !== point.x || p.y !== point.y)
            : [...prev.selectedPoints, point],
        };
      });
    },
    []
  );
  
  const hideTooltip = useCallback(() => {
    setInteraction(prev => ({
      ...prev,
      tooltip: { ...prev.tooltip, visible: false },
    }));
  }, []);
  
  return {
    dimensions,
    containerRef,
    xScale,
    yScale,
    xDomain,
    yDomain,
    colors,
    getSeriesColor: getSeriesColorFn,
    interaction,
    handlePointHover,
    handlePointClick,
    hideTooltip,
    animation,
    animatedProgress,
    isMobile,
    isTablet,
    isDarkMode,
  };
}

/**
 * Hook for chart tooltip positioning
 */
export function useChartTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });
  
  const show = useCallback((x: number, y: number, content: React.ReactNode) => {
    setTooltip({ visible: true, x, y, content });
  }, []);
  
  const hide = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);
  
  const move = useCallback((x: number, y: number) => {
    setTooltip(prev => ({ ...prev, x, y }));
  }, []);
  
  return { tooltip, show, hide, move };
}

/**
 * Hook for chart legend interaction
 */
export function useChartLegend(series: ChartSeries[]) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  
  const toggleSeries = useCallback((seriesId: string) => {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(seriesId)) {
        next.delete(seriesId);
      } else {
        next.add(seriesId);
      }
      return next;
    });
  }, []);
  
  const showAll = useCallback(() => {
    setHiddenSeries(new Set());
  }, []);
  
  const visibleSeries = useMemo(() => {
    return series.filter(s => !hiddenSeries.has(s.id));
  }, [series, hiddenSeries]);
  
  const isSeriesVisible = useCallback(
    (seriesId: string) => !hiddenSeries.has(seriesId),
    [hiddenSeries]
  );
  
  return {
    hiddenSeries,
    visibleSeries,
    toggleSeries,
    showAll,
    isSeriesVisible,
  };
}
