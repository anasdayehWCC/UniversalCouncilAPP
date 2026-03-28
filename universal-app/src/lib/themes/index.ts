/**
 * Theme Engine - Main Export
 * 
 * Multi-tenant theming system for the Universal Council App.
 * Provides council-specific branding with light/dark mode support.
 */

// Core types and tokens
export type {
  ColorMode,
  CouncilId,
  ServiceDomain,
  OKLCHColor,
  SemanticPalette,
  GlassTokens,
  GradientTokens,
  MotionTokens,
  TypographyTokens,
  RadiusTokens,
  ShadowTokens,
  ThemeDefinition,
  CouncilBranding,
} from './theme-tokens';

// Theme definitions
export {
  // Utilities
  oklch,
  createColorScale,
  
  // Shared tokens
  sharedMotion,
  sharedTypography,
  sharedRadius,
  
  // WCC themes
  wccLight,
  wccDark,
  wccLightPalette,
  wccDarkPalette,
  wccLightGlass,
  wccDarkGlass,
  wccLightGradients,
  wccDarkGradients,
  wccLightShadows,
  wccDarkShadows,
  
  // RBKC themes
  rbkcLight,
  rbkcDark,
  rbkcLightPalette,
  rbkcDarkPalette,
  rbkcLightGlass,
  rbkcDarkGlass,
  rbkcLightGradients,
  rbkcDarkGradients,
  rbkcLightShadows,
  rbkcDarkShadows,
  
  // Default themes
  defaultLight,
  defaultDark,
  defaultLightPalette,
  defaultDarkPalette,
  defaultLightGlass,
  defaultDarkGlass,
  defaultLightGradients,
  defaultDarkGradients,
  defaultLightShadows,
  defaultDarkShadows,
  
  // Council branding registry
  councilBranding,
  
  // Utility functions
  getTheme,
  getCouncilByDomain,
  themeToCSSProperties,
} from './theme-tokens';

/**
 * CSS custom property names for runtime theming
 */
export const CSS_PROPERTY_MAP = {
  // Core palette
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  primarySoft: '--primary-soft',
  primaryMuted: '--primary-muted',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  accentSoft: '--accent-soft',
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  border: '--border',
  input: '--input',
  ring: '--ring',
  
  // Semantic
  success: '--success',
  warning: '--warning',
  error: '--error',
  info: '--info',
  destructive: '--destructive',
  
  // Glass
  glassBlur: '--glass-blur',
  glassBackground: '--glass-background',
  glassBorder: '--glass-border',
  glassPanelBackground: '--glass-panel-background',
  glassPanelBorder: '--glass-panel-border',
  glassCardBackground: '--glass-card-background',
  glassCardBorder: '--glass-card-border',
  glassNavBackground: '--glass-nav-background',
  glassNavBorder: '--glass-nav-border',
  
  // Gradients
  gradientPrimary: '--gradient-primary',
  gradientPrimarySubtle: '--gradient-primary-subtle',
  gradientAccent: '--gradient-accent',
  gradientHero: '--gradient-hero',
  
  // Shadows
  shadowSm: '--shadow-sm',
  shadowMd: '--shadow-md',
  shadowLg: '--shadow-lg',
  shadowXl: '--shadow-xl',
  shadowGlass: '--shadow-glass',
  shadowCardHover: '--shadow-card-hover',
  shadowElevated: '--shadow-elevated',
  
  // Motion
  motionDurationFast: '--motion-duration-fast',
  motionDurationNormal: '--motion-duration-normal',
  motionDurationSlow: '--motion-duration-slow',
  motionEasing: '--motion-easing',
  
  // Radius
  radius: '--radius',
  radiusSm: '--radius-sm',
  radiusMd: '--radius-md',
  radiusLg: '--radius-lg',
  radiusFull: '--radius-full',
} as const;

/**
 * Theme class names for body element
 */
export const THEME_CLASSES = {
  light: 'theme-light',
  dark: 'theme-dark',
  wcc: 'council-wcc',
  rbkc: 'council-rbkc',
  default: 'council-default',
} as const;

/**
 * Storage keys for theme persistence
 */
export const STORAGE_KEYS = {
  colorMode: 'theme-color-mode',
  councilId: 'theme-council-id',
  reducedMotion: 'theme-reduced-motion',
} as const;

/**
 * Default theme configuration
 */
export const DEFAULT_THEME_CONFIG = {
  colorMode: 'system' as const,
  councilId: 'default' as const,
  enableTransitions: true,
  respectReducedMotion: true,
} as const;

/**
 * Media queries for theme-related preferences
 */
export const MEDIA_QUERIES = {
  prefersDark: '(prefers-color-scheme: dark)',
  prefersLight: '(prefers-color-scheme: light)',
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
  prefersHighContrast: '(prefers-contrast: more)',
} as const;
