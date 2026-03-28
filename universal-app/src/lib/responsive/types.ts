/**
 * Responsive Types for Universal Council App
 * 
 * Defines breakpoints, device types, and orientation for mobile-first design.
 * Optimized for social workers using tablets and phones in the field.
 */

/** Standard breakpoint names matching Tailwind CSS v4 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Device type categories */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/** Screen orientation */
export type OrientationType = 'portrait' | 'landscape';

/** Breakpoint configuration with pixel values */
export interface BreakpointConfig {
  /** Minimum width in pixels */
  min: number;
  /** Maximum width in pixels (exclusive) */
  max: number;
  /** CSS media query string */
  query: string;
  /** Device type this breakpoint typically represents */
  deviceType: DeviceType;
}

/** Map of all breakpoint configurations */
export type BreakpointMap = Record<Breakpoint, BreakpointConfig>;

/** Responsive state returned by hooks */
export interface ResponsiveState {
  /** Current breakpoint name */
  breakpoint: Breakpoint;
  /** Current device type */
  deviceType: DeviceType;
  /** Current orientation */
  orientation: OrientationType;
  /** Whether device is mobile (phone) */
  isMobile: boolean;
  /** Whether device is tablet */
  isTablet: boolean;
  /** Whether device is desktop */
  isDesktop: boolean;
  /** Whether viewport is in portrait mode */
  isPortrait: boolean;
  /** Whether viewport is in landscape mode */
  isLandscape: boolean;
  /** Current viewport width */
  width: number;
  /** Current viewport height */
  height: number;
  /** Whether touch is supported */
  isTouchDevice: boolean;
  /** Whether device has a notch (safe area insets) */
  hasNotch: boolean;
  /** Safe area insets for notched devices */
  safeAreaInsets: SafeAreaInsets;
}

/** Safe area insets for notched devices */
export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Container query breakpoints */
export interface ContainerBreakpoints {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/** Touch gesture configuration */
export interface TouchConfig {
  /** Minimum tap target size in pixels (44px recommended by Apple/Google) */
  minTapTarget: number;
  /** Minimum spacing between tap targets */
  tapTargetSpacing: number;
  /** Swipe threshold in pixels */
  swipeThreshold: number;
  /** Swipe velocity threshold (px/ms) */
  swipeVelocityThreshold: number;
}

/** Default touch configuration for social worker field use */
export const DEFAULT_TOUCH_CONFIG: TouchConfig = {
  minTapTarget: 44,
  tapTargetSpacing: 8,
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.3,
};

/** Responsive layout modes */
export type LayoutMode = 'stack' | 'row' | 'grid';

/** Responsive container sizes */
export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Grid column configurations */
export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'auto';

/** Responsive grid configuration */
export interface ResponsiveGridConfig {
  xs: GridColumns;
  sm?: GridColumns;
  md?: GridColumns;
  lg?: GridColumns;
  xl?: GridColumns;
  '2xl'?: GridColumns;
}

/** Swipeable view configuration */
export interface SwipeableConfig {
  /** Enable infinite loop */
  loop?: boolean;
  /** Auto-play interval in ms (0 = disabled) */
  autoPlay?: number;
  /** Show pagination dots */
  showDots?: boolean;
  /** Show navigation arrows */
  showArrows?: boolean;
  /** Allow keyboard navigation */
  keyboard?: boolean;
  /** Resistance when swiping past bounds */
  resistance?: number;
}

/** Bottom sheet configuration */
export interface BottomSheetConfig {
  /** Snap points as percentages of screen height */
  snapPoints: number[];
  /** Initial snap point index */
  initialSnap?: number;
  /** Allow dismissing by swiping down */
  dismissible?: boolean;
  /** Show drag handle */
  showHandle?: boolean;
  /** Modal backdrop */
  modal?: boolean;
  /** Blur backdrop */
  blurBackdrop?: boolean;
}

/** Pull to refresh configuration */
export interface PullToRefreshConfig {
  /** Pull threshold in pixels */
  threshold: number;
  /** Resistance factor (0-1) */
  resistance: number;
  /** Maximum pull distance */
  maxPull: number;
  /** Refresh indicator style */
  indicatorStyle?: 'spinner' | 'dots' | 'custom';
}

/** Swipe action configuration */
export interface SwipeActionConfig {
  /** Action color */
  color: string;
  /** Action icon */
  icon: React.ReactNode;
  /** Action label */
  label: string;
  /** Action callback */
  onAction: () => void;
  /** Whether this is a destructive action */
  destructive?: boolean;
}

/** FAB position options */
export type FABPosition = 
  | 'bottom-right' 
  | 'bottom-left' 
  | 'bottom-center'
  | 'top-right'
  | 'top-left';

/** FAB configuration */
export interface FABConfig {
  /** Position on screen */
  position: FABPosition;
  /** Primary action icon */
  icon: React.ReactNode;
  /** Primary action label (for accessibility) */
  label: string;
  /** Primary action callback */
  onPress: () => void;
  /** Extended FAB (shows label) */
  extended?: boolean;
  /** Speed dial actions */
  actions?: FABAction[];
  /** Hide on scroll */
  hideOnScroll?: boolean;
}

/** FAB speed dial action */
export interface FABAction {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}
