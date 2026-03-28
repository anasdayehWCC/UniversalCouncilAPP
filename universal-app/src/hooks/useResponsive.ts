'use client';

/**
 * Responsive Hooks for Universal Council App
 * 
 * React hooks for responsive design, device detection, and media queries.
 * Optimized for social workers using tablets and phones in the field.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BREAKPOINT_VALUES,
  getBreakpoint,
  getDeviceType,
  isBreakpointUp,
  isBreakpointDown,
} from '@/lib/responsive/breakpoints';
import type {
  Breakpoint,
  DeviceType,
  OrientationType,
  ResponsiveState,
  SafeAreaInsets,
} from '@/lib/responsive/types';

/**
 * Safely get window dimensions (SSR-safe)
 */
function getWindowDimensions() {
  if (typeof window === 'undefined') {
    return { width: 1024, height: 768 }; // Default to desktop for SSR
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Check if device supports touch (SSR-safe)
 */
function checkTouchSupport(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get safe area insets from CSS environment variables
 */
function getSafeAreaInsets(): SafeAreaInsets {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  
  const computedStyle = getComputedStyle(document.documentElement);
  
  const parseInset = (value: string): number => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  };
  
  return {
    top: parseInset(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInset(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInset(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInset(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
  };
}

/**
 * Hook to get current breakpoint
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    const { width } = getWindowDimensions();
    return getBreakpoint(width);
  });

  useEffect(() => {
    const handleResize = () => {
      const { width } = getWindowDimensions();
      const newBreakpoint = getBreakpoint(width);
      setBreakpoint(newBreakpoint);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

/**
 * Hook to check if device is mobile (phone)
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    const { width } = getWindowDimensions();
    return width < BREAKPOINT_VALUES.md;
  });

  useEffect(() => {
    const handleResize = () => {
      const { width } = getWindowDimensions();
      setIsMobile(width < BREAKPOINT_VALUES.md);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

/**
 * Hook to check if device is tablet
 */
export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState<boolean>(() => {
    const { width } = getWindowDimensions();
    return width >= BREAKPOINT_VALUES.md && width < BREAKPOINT_VALUES.lg;
  });

  useEffect(() => {
    const handleResize = () => {
      const { width } = getWindowDimensions();
      setIsTablet(width >= BREAKPOINT_VALUES.md && width < BREAKPOINT_VALUES.lg);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isTablet;
}

/**
 * Hook to get device type (mobile, tablet, desktop)
 */
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    const { width } = getWindowDimensions();
    return getDeviceType(width);
  });

  useEffect(() => {
    const handleResize = () => {
      const { width } = getWindowDimensions();
      setDeviceType(getDeviceType(width));
    };

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
}

/**
 * Hook to get orientation (portrait/landscape)
 */
export function useOrientation(): OrientationType {
  const [orientation, setOrientation] = useState<OrientationType>(() => {
    const { width, height } = getWindowDimensions();
    return height >= width ? 'portrait' : 'landscape';
  });

  useEffect(() => {
    const handleResize = () => {
      const { width, height } = getWindowDimensions();
      setOrientation(height >= width ? 'portrait' : 'landscape');
    };

    // Use orientation change event if available
    if ('orientation' in screen) {
      const handleOrientationChange = () => {
        setTimeout(handleResize, 100); // Small delay for resize to complete
      };
      screen.orientation.addEventListener('change', handleOrientationChange);
      window.addEventListener('resize', handleResize, { passive: true });
      
      return () => {
        screen.orientation.removeEventListener('change', handleOrientationChange);
        window.removeEventListener('resize', handleResize);
      };
    }

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return orientation;
}

/**
 * Hook for custom media query matching
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    // Legacy browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [query]);

  return matches;
}

/**
 * Hook to check if viewport is at or above a breakpoint
 */
export function useBreakpointUp(breakpoint: Breakpoint): boolean {
  const currentBreakpoint = useBreakpoint();
  return isBreakpointUp(currentBreakpoint, breakpoint);
}

/**
 * Hook to check if viewport is at or below a breakpoint
 */
export function useBreakpointDown(breakpoint: Breakpoint): boolean {
  const currentBreakpoint = useBreakpoint();
  return isBreakpointDown(currentBreakpoint, breakpoint);
}

/**
 * Hook to check if device supports touch
 */
export function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    setIsTouchDevice(checkTouchSupport());
  }, []);

  return isTouchDevice;
}

/**
 * Hook to check if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook to check if device has a notch (uses safe area insets)
 */
export function useHasNotch(): boolean {
  const [hasNotch, setHasNotch] = useState<boolean>(false);

  useEffect(() => {
    const insets = getSafeAreaInsets();
    setHasNotch(insets.top > 0 || insets.bottom > 0);
  }, []);

  return hasNotch;
}

/**
 * Hook to get safe area insets
 */
export function useSafeAreaInsets(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({ top: 0, right: 0, bottom: 0, left: 0 });

  useEffect(() => {
    setInsets(getSafeAreaInsets());
    
    // Re-check on orientation change
    const handleResize = () => {
      setInsets(getSafeAreaInsets());
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return insets;
}

/**
 * Hook to get viewport dimensions
 */
export function useViewportSize(): { width: number; height: number } {
  const [size, setSize] = useState(() => getWindowDimensions());

  useEffect(() => {
    const handleResize = () => {
      setSize(getWindowDimensions());
    };

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Comprehensive responsive state hook
 * Returns all responsive information in a single object
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    const { width, height } = getWindowDimensions();
    const breakpoint = getBreakpoint(width);
    const deviceType = getDeviceType(width);
    const orientation: OrientationType = height >= width ? 'portrait' : 'landscape';
    
    return {
      breakpoint,
      deviceType,
      orientation,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      isPortrait: orientation === 'portrait',
      isLandscape: orientation === 'landscape',
      width,
      height,
      isTouchDevice: false,
      hasNotch: false,
      safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
    };
  });

  useEffect(() => {
    const updateState = () => {
      const { width, height } = getWindowDimensions();
      const breakpoint = getBreakpoint(width);
      const deviceType = getDeviceType(width);
      const orientation: OrientationType = height >= width ? 'portrait' : 'landscape';
      const safeAreaInsets = getSafeAreaInsets();
      
      setState({
        breakpoint,
        deviceType,
        orientation,
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop',
        isPortrait: orientation === 'portrait',
        isLandscape: orientation === 'landscape',
        width,
        height,
        isTouchDevice: checkTouchSupport(),
        hasNotch: safeAreaInsets.top > 0 || safeAreaInsets.bottom > 0,
        safeAreaInsets,
      });
    };

    window.addEventListener('resize', updateState, { passive: true });
    updateState();
    
    return () => window.removeEventListener('resize', updateState);
  }, []);

  return state;
}

/**
 * Hook for responsive value selection based on breakpoint
 */
export function useResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T
): T {
  const breakpoint = useBreakpoint();
  
  return useMemo(() => {
    const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpoints.indexOf(breakpoint);
    
    // Look for value at current breakpoint, then cascade down
    for (let i = currentIndex; i >= 0; i--) {
      const value = values[breakpoints[i]];
      if (value !== undefined) return value;
    }
    
    return defaultValue;
  }, [breakpoint, values, defaultValue]);
}

/**
 * Hook for scroll position (useful for hiding elements on scroll)
 */
export function useScrollDirection(): 'up' | 'down' | null {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return scrollDirection;
}

/**
 * Hook for keyboard visibility (mobile keyboards)
 */
export function useKeyboardVisible(): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { height } = useViewportSize();
  const [initialHeight, setInitialHeight] = useState(0);

  useEffect(() => {
    if (initialHeight === 0) {
      setInitialHeight(height);
      return;
    }
    
    // If height decreased significantly, keyboard is likely visible
    const threshold = initialHeight * 0.7;
    setIsKeyboardVisible(height < threshold);
  }, [height, initialHeight]);

  return isKeyboardVisible;
}
