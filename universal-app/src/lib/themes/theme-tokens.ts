/**
 * Theme Token Definitions
 * 
 * Multi-tenant theme engine using OKLCH color space for precise color manipulation.
 * Supports council-specific branding (WCC, RBKC, etc.) with light/dark mode.
 * 
 * OKLCH advantages:
 * - Perceptually uniform: equal steps in L produce equal perceived lightness changes
 * - Predictable chroma: easier to create color palettes with consistent saturation
 * - Hue stability: adjusting lightness/chroma doesn't shift the hue unexpectedly
 */

export type ColorMode = 'light' | 'dark' | 'system';

export type CouncilId = 'wcc' | 'rbkc' | 'default';

export type ServiceDomain = 'children' | 'adults' | 'housing' | 'corporate';

/**
 * OKLCH color definition
 * L: Lightness (0-100%)
 * C: Chroma (0-0.4 typical, 0-0.5 max)
 * H: Hue (0-360 degrees)
 */
export interface OKLCHColor {
  l: number; // 0-1
  c: number; // 0-0.4
  h: number; // 0-360
  a?: number; // alpha 0-1
}

/**
 * Semantic color palette structure
 */
export interface SemanticPalette {
  // Primary brand colors
  primary: string;
  primaryForeground: string;
  primarySoft: string;
  primaryMuted: string;

  // Accent colors
  accent: string;
  accentForeground: string;
  accentSoft: string;

  // Semantic colors
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  error: string;
  errorForeground: string;
  info: string;
  infoForeground: string;

  // Surface colors
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;

  // Interactive states
  muted: string;
  mutedForeground: string;
  secondary: string;
  secondaryForeground: string;
  destructive: string;
  destructiveForeground: string;

  // Border & input
  border: string;
  input: string;
  ring: string;

  // Overlay/glass effects
  overlay: string;
  glassBackground: string;
  glassBorder: string;
}

/**
 * Glassmorphism effect tokens
 */
export interface GlassTokens {
  blur: string;
  saturation: string;
  backdropBlur: string;
  panelBackground: string;
  panelBorder: string;
  cardBackground: string;
  cardBorder: string;
  navBackground: string;
  navBorder: string;
}

/**
 * Gradient definitions
 */
export interface GradientTokens {
  primary: string;
  primarySubtle: string;
  accent: string;
  heroBackground: string;
  cardShine: string;
  meshColors: string[]; // For mesh gradients
}

/**
 * Animation/transition tokens
 */
export interface MotionTokens {
  durationFast: string;
  durationNormal: string;
  durationSlow: string;
  easingDefault: string;
  easingIn: string;
  easingOut: string;
  easingInOut: string;
  easingSpring: string;
}

/**
 * Typography tokens
 */
export interface TypographyTokens {
  fontSans: string;
  fontDisplay: string;
  fontMono: string;
  fontWeightNormal: number;
  fontWeightMedium: number;
  fontWeightSemibold: number;
  fontWeightBold: number;
  lineHeightTight: number;
  lineHeightNormal: number;
  lineHeightRelaxed: number;
  letterSpacingTight: string;
  letterSpacingNormal: string;
  letterSpacingWide: string;
}

/**
 * Radius tokens
 */
export interface RadiusTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
}

/**
 * Shadow tokens for premium depth
 */
export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
  glassShadow: string;
  cardHover: string;
  elevated: string;
}

/**
 * Complete theme definition
 */
export interface ThemeDefinition {
  name: string;
  councilId: CouncilId;
  colorMode: 'light' | 'dark';
  palette: SemanticPalette;
  glass: GlassTokens;
  gradients: GradientTokens;
  motion: MotionTokens;
  typography: TypographyTokens;
  radius: RadiusTokens;
  shadows: ShadowTokens;
}

/**
 * Council branding configuration
 */
export interface CouncilBranding {
  id: CouncilId;
  name: string;
  shortName: string;
  logo?: string;
  favicon?: string;
  domains: ServiceDomain[];
  light: ThemeDefinition;
  dark: ThemeDefinition;
}

/**
 * Convert OKLCH to CSS string
 */
export function oklch(l: number, c: number, h: number, a?: number): string {
  if (a !== undefined && a < 1) {
    return `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)} / ${a.toFixed(2)})`;
  }
  return `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)})`;
}

/**
 * Create a color scale from a base OKLCH color
 */
export function createColorScale(
  baseL: number,
  baseC: number,
  baseH: number,
  steps: number = 11
): Record<number, string> {
  const scale: Record<number, string> = {};
  const stepKeys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    // Light colors have high L, dark colors have low L
    const l = 0.98 - (ratio * 0.85);
    // Chroma peaks in the middle, lower at extremes
    const chromaMultiplier = 1 - Math.abs(ratio - 0.5) * 0.6;
    const c = baseC * chromaMultiplier;
    
    scale[stepKeys[i]] = oklch(l, c, baseH);
  }
  
  return scale;
}

/**
 * Shared motion tokens (same across all themes)
 */
export const sharedMotion: MotionTokens = {
  durationFast: '150ms',
  durationNormal: '300ms',
  durationSlow: '500ms',
  easingDefault: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easingIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easingOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easingInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easingSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};

/**
 * Shared typography tokens
 */
export const sharedTypography: TypographyTokens = {
  fontSans: 'var(--font-inter), ui-sans-serif, system-ui, -apple-system, sans-serif',
  fontDisplay: 'var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif',
  fontMono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightSemibold: 600,
  fontWeightBold: 700,
  lineHeightTight: 1.25,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,
  letterSpacingTight: '-0.025em',
  letterSpacingNormal: '0em',
  letterSpacingWide: '0.025em',
};

/**
 * Shared radius tokens
 */
export const sharedRadius: RadiusTokens = {
  none: '0',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
};

// ============================================================================
// WESTMINSTER CITY COUNCIL (WCC) THEME
// ============================================================================

/**
 * WCC Colors (OKLCH)
 * Primary: Deep Night Blue (#211551) → oklch(25% 0.15 285)
 * Accent: Copper (#9D581F) → oklch(55% 0.14 55)
 */
const WCC_PRIMARY_H = 285; // Deep blue-violet
const WCC_ACCENT_H = 55;   // Copper/amber

export const wccLightPalette: SemanticPalette = {
  // Primary (Deep Night Blue)
  primary: oklch(0.25, 0.15, WCC_PRIMARY_H),
  primaryForeground: oklch(0.99, 0, 0),
  primarySoft: oklch(0.95, 0.03, WCC_PRIMARY_H),
  primaryMuted: oklch(0.85, 0.06, WCC_PRIMARY_H),

  // Accent (Copper)
  accent: oklch(0.55, 0.14, WCC_ACCENT_H),
  accentForeground: oklch(0.99, 0, 0),
  accentSoft: oklch(0.95, 0.04, WCC_ACCENT_H),

  // Semantic
  success: oklch(0.55, 0.16, 145),
  successForeground: oklch(0.99, 0, 0),
  warning: oklch(0.7, 0.15, 75),
  warningForeground: oklch(0.15, 0.02, 75),
  error: oklch(0.55, 0.2, 25),
  errorForeground: oklch(0.99, 0, 0),
  info: oklch(0.55, 0.12, 230),
  infoForeground: oklch(0.99, 0, 0),

  // Surfaces
  background: oklch(0.99, 0.002, 250),
  foreground: oklch(0.15, 0.02, 250),
  card: oklch(0.99, 0.002, 250),
  cardForeground: oklch(0.15, 0.02, 250),
  popover: oklch(0.99, 0.002, 250),
  popoverForeground: oklch(0.15, 0.02, 250),

  // Interactive
  muted: oklch(0.96, 0.01, 250),
  mutedForeground: oklch(0.50, 0.02, 250),
  secondary: oklch(0.96, 0.01, 250),
  secondaryForeground: oklch(0.15, 0.02, 250),
  destructive: oklch(0.55, 0.2, 25),
  destructiveForeground: oklch(0.99, 0, 0),

  // Border & input
  border: oklch(0.90, 0.01, 250),
  input: oklch(0.90, 0.01, 250),
  ring: oklch(0.25, 0.15, WCC_PRIMARY_H),

  // Glass
  overlay: oklch(0.15, 0.02, 250, 0.5),
  glassBackground: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
};

export const wccDarkPalette: SemanticPalette = {
  // Primary (Deep Night Blue - lighter in dark mode for contrast)
  primary: oklch(0.65, 0.12, WCC_PRIMARY_H),
  primaryForeground: oklch(0.99, 0, 0),
  primarySoft: oklch(0.25, 0.08, WCC_PRIMARY_H),
  primaryMuted: oklch(0.35, 0.1, WCC_PRIMARY_H),

  // Accent (Copper - slightly brighter in dark)
  accent: oklch(0.65, 0.14, WCC_ACCENT_H),
  accentForeground: oklch(0.99, 0, 0),
  accentSoft: oklch(0.25, 0.06, WCC_ACCENT_H),

  // Semantic
  success: oklch(0.65, 0.15, 145),
  successForeground: oklch(0.15, 0, 0),
  warning: oklch(0.75, 0.14, 75),
  warningForeground: oklch(0.15, 0.02, 75),
  error: oklch(0.65, 0.18, 25),
  errorForeground: oklch(0.15, 0, 0),
  info: oklch(0.65, 0.11, 230),
  infoForeground: oklch(0.15, 0, 0),

  // Surfaces
  background: oklch(0.13, 0.02, 250),
  foreground: oklch(0.95, 0.01, 250),
  card: oklch(0.18, 0.02, 250),
  cardForeground: oklch(0.95, 0.01, 250),
  popover: oklch(0.18, 0.02, 250),
  popoverForeground: oklch(0.95, 0.01, 250),

  // Interactive
  muted: oklch(0.22, 0.02, 250),
  mutedForeground: oklch(0.65, 0.02, 250),
  secondary: oklch(0.22, 0.02, 250),
  secondaryForeground: oklch(0.95, 0.01, 250),
  destructive: oklch(0.55, 0.2, 25),
  destructiveForeground: oklch(0.99, 0, 0),

  // Border & input
  border: oklch(0.28, 0.02, 250),
  input: oklch(0.28, 0.02, 250),
  ring: oklch(0.65, 0.12, WCC_PRIMARY_H),

  // Glass (darker glass effects)
  overlay: oklch(0.05, 0.02, 250, 0.7),
  glassBackground: 'rgba(15, 23, 42, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

export const wccLightGlass: GlassTokens = {
  blur: '12px',
  saturation: '180%',
  backdropBlur: 'blur(16px) saturate(180%)',
  panelBackground: 'rgba(255, 255, 255, 0.65)',
  panelBorder: 'rgba(255, 255, 255, 0.3)',
  cardBackground: 'rgba(255, 255, 255, 0.8)',
  cardBorder: 'rgba(255, 255, 255, 0.25)',
  navBackground: 'rgba(255, 255, 255, 0.75)',
  navBorder: 'rgba(255, 255, 255, 0.2)',
};

export const wccDarkGlass: GlassTokens = {
  blur: '16px',
  saturation: '150%',
  backdropBlur: 'blur(20px) saturate(150%)',
  panelBackground: 'rgba(15, 23, 42, 0.65)',
  panelBorder: 'rgba(255, 255, 255, 0.08)',
  cardBackground: 'rgba(30, 41, 59, 0.7)',
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  navBackground: 'rgba(15, 23, 42, 0.8)',
  navBorder: 'rgba(255, 255, 255, 0.05)',
};

export const wccLightGradients: GradientTokens = {
  primary: `linear-gradient(135deg, ${oklch(0.25, 0.15, WCC_PRIMARY_H)} 0%, ${oklch(0.35, 0.18, WCC_PRIMARY_H + 15)} 100%)`,
  primarySubtle: `linear-gradient(135deg, ${oklch(0.96, 0.02, WCC_PRIMARY_H)} 0%, ${oklch(0.94, 0.03, WCC_PRIMARY_H + 10)} 100%)`,
  accent: `linear-gradient(135deg, ${oklch(0.55, 0.14, WCC_ACCENT_H)} 0%, ${oklch(0.65, 0.12, WCC_ACCENT_H + 10)} 100%)`,
  heroBackground: `linear-gradient(180deg, ${oklch(0.99, 0.002, 250)} 0%, ${oklch(0.96, 0.01, 250)} 100%)`,
  cardShine: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)',
  meshColors: [
    oklch(0.95, 0.03, WCC_PRIMARY_H),
    oklch(0.95, 0.04, WCC_ACCENT_H),
    oklch(0.97, 0.02, 200),
  ],
};

export const wccDarkGradients: GradientTokens = {
  primary: `linear-gradient(135deg, ${oklch(0.35, 0.15, WCC_PRIMARY_H)} 0%, ${oklch(0.45, 0.18, WCC_PRIMARY_H + 15)} 100%)`,
  primarySubtle: `linear-gradient(135deg, ${oklch(0.18, 0.04, WCC_PRIMARY_H)} 0%, ${oklch(0.22, 0.05, WCC_PRIMARY_H + 10)} 100%)`,
  accent: `linear-gradient(135deg, ${oklch(0.55, 0.14, WCC_ACCENT_H)} 0%, ${oklch(0.65, 0.12, WCC_ACCENT_H + 10)} 100%)`,
  heroBackground: `linear-gradient(180deg, ${oklch(0.13, 0.02, 250)} 0%, ${oklch(0.15, 0.025, 250)} 100%)`,
  cardShine: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%)',
  meshColors: [
    oklch(0.2, 0.06, WCC_PRIMARY_H),
    oklch(0.2, 0.05, WCC_ACCENT_H),
    oklch(0.15, 0.03, 200),
  ],
};

export const wccLightShadows: ShadowTokens = {
  sm: '0 1px 2px 0 rgba(33, 21, 81, 0.05)',
  md: '0 4px 6px -1px rgba(33, 21, 81, 0.08), 0 2px 4px -2px rgba(33, 21, 81, 0.04)',
  lg: '0 10px 15px -3px rgba(33, 21, 81, 0.1), 0 4px 6px -4px rgba(33, 21, 81, 0.05)',
  xl: '0 20px 25px -5px rgba(33, 21, 81, 0.12), 0 8px 10px -6px rgba(33, 21, 81, 0.06)',
  inner: 'inset 0 2px 4px 0 rgba(33, 21, 81, 0.05)',
  glassShadow: '0 8px 32px rgba(33, 21, 81, 0.12)',
  cardHover: '0 14px 28px rgba(33, 21, 81, 0.15), 0 10px 10px rgba(33, 21, 81, 0.1)',
  elevated: '0 25px 50px -12px rgba(33, 21, 81, 0.18)',
};

export const wccDarkShadows: ShadowTokens = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.35), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.45), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
  glassShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  cardHover: '0 14px 28px rgba(0, 0, 0, 0.5), 0 10px 10px rgba(0, 0, 0, 0.35)',
  elevated: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
};

export const wccLight: ThemeDefinition = {
  name: 'Westminster Light',
  councilId: 'wcc',
  colorMode: 'light',
  palette: wccLightPalette,
  glass: wccLightGlass,
  gradients: wccLightGradients,
  motion: sharedMotion,
  typography: sharedTypography,
  radius: sharedRadius,
  shadows: wccLightShadows,
};

export const wccDark: ThemeDefinition = {
  name: 'Westminster Dark',
  councilId: 'wcc',
  colorMode: 'dark',
  palette: wccDarkPalette,
  glass: wccDarkGlass,
  gradients: wccDarkGradients,
  motion: sharedMotion,
  typography: sharedTypography,
  radius: sharedRadius,
  shadows: wccDarkShadows,
};

// ============================================================================
// ROYAL BOROUGH OF KENSINGTON & CHELSEA (RBKC) THEME
// ============================================================================

/**
 * RBKC Colors (OKLCH)
 * Primary: Astronaut Blue (#014363) → oklch(35% 0.08 220)
 * Accent: Light Blue (#A2CDE0) → oklch(80% 0.06 220)
 */
const RBKC_PRIMARY_H = 220; // Teal-blue
const RBKC_ACCENT_H = 220;  // Same hue family, lighter

export const rbkcLightPalette: SemanticPalette = {
  // Primary (Astronaut Blue)
  primary: oklch(0.35, 0.08, RBKC_PRIMARY_H),
  primaryForeground: oklch(0.99, 0, 0),
  primarySoft: oklch(0.95, 0.02, RBKC_PRIMARY_H),
  primaryMuted: oklch(0.88, 0.04, RBKC_PRIMARY_H),

  // Accent (Light Blue)
  accent: oklch(0.80, 0.06, RBKC_ACCENT_H),
  accentForeground: oklch(0.2, 0.02, RBKC_ACCENT_H),
  accentSoft: oklch(0.92, 0.03, RBKC_ACCENT_H),

  // Semantic
  success: oklch(0.55, 0.16, 145),
  successForeground: oklch(0.99, 0, 0),
  warning: oklch(0.7, 0.15, 75),
  warningForeground: oklch(0.15, 0.02, 75),
  error: oklch(0.55, 0.2, 25),
  errorForeground: oklch(0.99, 0, 0),
  info: oklch(0.55, 0.12, 230),
  infoForeground: oklch(0.99, 0, 0),

  // Surfaces
  background: oklch(0.99, 0.002, 220),
  foreground: oklch(0.15, 0.02, 220),
  card: oklch(0.99, 0.002, 220),
  cardForeground: oklch(0.15, 0.02, 220),
  popover: oklch(0.99, 0.002, 220),
  popoverForeground: oklch(0.15, 0.02, 220),

  // Interactive
  muted: oklch(0.96, 0.01, 220),
  mutedForeground: oklch(0.50, 0.02, 220),
  secondary: oklch(0.96, 0.01, 220),
  secondaryForeground: oklch(0.15, 0.02, 220),
  destructive: oklch(0.55, 0.2, 25),
  destructiveForeground: oklch(0.99, 0, 0),

  // Border & input
  border: oklch(0.90, 0.01, 220),
  input: oklch(0.90, 0.01, 220),
  ring: oklch(0.35, 0.08, RBKC_PRIMARY_H),

  // Glass
  overlay: oklch(0.15, 0.02, 220, 0.5),
  glassBackground: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(162, 205, 224, 0.3)',
};

export const rbkcDarkPalette: SemanticPalette = {
  // Primary (Astronaut Blue - lighter in dark mode)
  primary: oklch(0.60, 0.08, RBKC_PRIMARY_H),
  primaryForeground: oklch(0.99, 0, 0),
  primarySoft: oklch(0.22, 0.05, RBKC_PRIMARY_H),
  primaryMuted: oklch(0.32, 0.06, RBKC_PRIMARY_H),

  // Accent (Light Blue)
  accent: oklch(0.75, 0.07, RBKC_ACCENT_H),
  accentForeground: oklch(0.15, 0.02, RBKC_ACCENT_H),
  accentSoft: oklch(0.22, 0.04, RBKC_ACCENT_H),

  // Semantic
  success: oklch(0.65, 0.15, 145),
  successForeground: oklch(0.15, 0, 0),
  warning: oklch(0.75, 0.14, 75),
  warningForeground: oklch(0.15, 0.02, 75),
  error: oklch(0.65, 0.18, 25),
  errorForeground: oklch(0.15, 0, 0),
  info: oklch(0.65, 0.11, 230),
  infoForeground: oklch(0.15, 0, 0),

  // Surfaces
  background: oklch(0.12, 0.015, 220),
  foreground: oklch(0.95, 0.01, 220),
  card: oklch(0.17, 0.018, 220),
  cardForeground: oklch(0.95, 0.01, 220),
  popover: oklch(0.17, 0.018, 220),
  popoverForeground: oklch(0.95, 0.01, 220),

  // Interactive
  muted: oklch(0.22, 0.018, 220),
  mutedForeground: oklch(0.65, 0.02, 220),
  secondary: oklch(0.22, 0.018, 220),
  secondaryForeground: oklch(0.95, 0.01, 220),
  destructive: oklch(0.55, 0.2, 25),
  destructiveForeground: oklch(0.99, 0, 0),

  // Border & input
  border: oklch(0.28, 0.018, 220),
  input: oklch(0.28, 0.018, 220),
  ring: oklch(0.60, 0.08, RBKC_PRIMARY_H),

  // Glass
  overlay: oklch(0.05, 0.015, 220, 0.7),
  glassBackground: 'rgba(1, 67, 99, 0.4)',
  glassBorder: 'rgba(162, 205, 224, 0.12)',
};

export const rbkcLightGlass: GlassTokens = {
  blur: '14px',
  saturation: '175%',
  backdropBlur: 'blur(18px) saturate(175%)',
  panelBackground: 'rgba(255, 255, 255, 0.6)',
  panelBorder: 'rgba(162, 205, 224, 0.35)',
  cardBackground: 'rgba(255, 255, 255, 0.75)',
  cardBorder: 'rgba(162, 205, 224, 0.25)',
  navBackground: 'rgba(255, 255, 255, 0.7)',
  navBorder: 'rgba(162, 205, 224, 0.2)',
};

export const rbkcDarkGlass: GlassTokens = {
  blur: '18px',
  saturation: '140%',
  backdropBlur: 'blur(22px) saturate(140%)',
  panelBackground: 'rgba(1, 67, 99, 0.5)',
  panelBorder: 'rgba(162, 205, 224, 0.1)',
  cardBackground: 'rgba(1, 67, 99, 0.6)',
  cardBorder: 'rgba(162, 205, 224, 0.08)',
  navBackground: 'rgba(1, 67, 99, 0.7)',
  navBorder: 'rgba(162, 205, 224, 0.05)',
};

export const rbkcLightGradients: GradientTokens = {
  primary: `linear-gradient(135deg, ${oklch(0.35, 0.08, RBKC_PRIMARY_H)} 0%, ${oklch(0.42, 0.1, RBKC_PRIMARY_H + 10)} 100%)`,
  primarySubtle: `linear-gradient(135deg, ${oklch(0.96, 0.015, RBKC_PRIMARY_H)} 0%, ${oklch(0.94, 0.02, RBKC_PRIMARY_H + 5)} 100%)`,
  accent: `linear-gradient(135deg, ${oklch(0.80, 0.06, RBKC_ACCENT_H)} 0%, ${oklch(0.85, 0.05, RBKC_ACCENT_H + 5)} 100%)`,
  heroBackground: `linear-gradient(180deg, ${oklch(0.99, 0.002, 220)} 0%, ${oklch(0.96, 0.01, 220)} 100%)`,
  cardShine: 'linear-gradient(135deg, rgba(162, 205, 224, 0.3) 0%, rgba(162, 205, 224, 0) 60%)',
  meshColors: [
    oklch(0.95, 0.02, RBKC_PRIMARY_H),
    oklch(0.92, 0.03, RBKC_ACCENT_H),
    oklch(0.97, 0.015, 200),
  ],
};

export const rbkcDarkGradients: GradientTokens = {
  primary: `linear-gradient(135deg, ${oklch(0.30, 0.07, RBKC_PRIMARY_H)} 0%, ${oklch(0.38, 0.09, RBKC_PRIMARY_H + 10)} 100%)`,
  primarySubtle: `linear-gradient(135deg, ${oklch(0.16, 0.03, RBKC_PRIMARY_H)} 0%, ${oklch(0.2, 0.04, RBKC_PRIMARY_H + 5)} 100%)`,
  accent: `linear-gradient(135deg, ${oklch(0.70, 0.06, RBKC_ACCENT_H)} 0%, ${oklch(0.75, 0.05, RBKC_ACCENT_H + 5)} 100%)`,
  heroBackground: `linear-gradient(180deg, ${oklch(0.12, 0.015, 220)} 0%, ${oklch(0.14, 0.02, 220)} 100%)`,
  cardShine: 'linear-gradient(135deg, rgba(162, 205, 224, 0.1) 0%, rgba(162, 205, 224, 0) 60%)',
  meshColors: [
    oklch(0.18, 0.04, RBKC_PRIMARY_H),
    oklch(0.2, 0.035, RBKC_ACCENT_H),
    oklch(0.15, 0.025, 200),
  ],
};

export const rbkcLightShadows: ShadowTokens = {
  sm: '0 1px 2px 0 rgba(1, 67, 99, 0.06)',
  md: '0 4px 6px -1px rgba(1, 67, 99, 0.1), 0 2px 4px -2px rgba(1, 67, 99, 0.05)',
  lg: '0 10px 15px -3px rgba(1, 67, 99, 0.12), 0 4px 6px -4px rgba(1, 67, 99, 0.06)',
  xl: '0 20px 25px -5px rgba(1, 67, 99, 0.14), 0 8px 10px -6px rgba(1, 67, 99, 0.07)',
  inner: 'inset 0 2px 4px 0 rgba(1, 67, 99, 0.06)',
  glassShadow: '0 8px 32px rgba(1, 67, 99, 0.14)',
  cardHover: '0 14px 28px rgba(1, 67, 99, 0.16), 0 10px 10px rgba(1, 67, 99, 0.1)',
  elevated: '0 25px 50px -12px rgba(1, 67, 99, 0.2)',
};

export const rbkcDarkShadows: ShadowTokens = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.35)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.22)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.45), 0 4px 6px -4px rgba(0, 0, 0, 0.22)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.28)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.35)',
  glassShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
  cardHover: '0 14px 28px rgba(0, 0, 0, 0.55), 0 10px 10px rgba(0, 0, 0, 0.38)',
  elevated: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
};

export const rbkcLight: ThemeDefinition = {
  name: 'Kensington & Chelsea Light',
  councilId: 'rbkc',
  colorMode: 'light',
  palette: rbkcLightPalette,
  glass: rbkcLightGlass,
  gradients: rbkcLightGradients,
  motion: sharedMotion,
  typography: sharedTypography,
  radius: sharedRadius,
  shadows: rbkcLightShadows,
};

export const rbkcDark: ThemeDefinition = {
  name: 'Kensington & Chelsea Dark',
  councilId: 'rbkc',
  colorMode: 'dark',
  palette: rbkcDarkPalette,
  glass: rbkcDarkGlass,
  gradients: rbkcDarkGradients,
  motion: sharedMotion,
  typography: sharedTypography,
  radius: sharedRadius,
  shadows: rbkcDarkShadows,
};

// ============================================================================
// DEFAULT THEME (Neutral fallback)
// ============================================================================

const DEFAULT_PRIMARY_H = 230; // Neutral blue
const DEFAULT_ACCENT_H = 145; // Green

export const defaultLightPalette: SemanticPalette = {
  primary: oklch(0.45, 0.1, DEFAULT_PRIMARY_H),
  primaryForeground: oklch(0.99, 0, 0),
  primarySoft: oklch(0.95, 0.025, DEFAULT_PRIMARY_H),
  primaryMuted: oklch(0.88, 0.04, DEFAULT_PRIMARY_H),

  accent: oklch(0.55, 0.12, DEFAULT_ACCENT_H),
  accentForeground: oklch(0.99, 0, 0),
  accentSoft: oklch(0.94, 0.03, DEFAULT_ACCENT_H),

  success: oklch(0.55, 0.16, 145),
  successForeground: oklch(0.99, 0, 0),
  warning: oklch(0.7, 0.15, 75),
  warningForeground: oklch(0.15, 0.02, 75),
  error: oklch(0.55, 0.2, 25),
  errorForeground: oklch(0.99, 0, 0),
  info: oklch(0.55, 0.12, 230),
  infoForeground: oklch(0.99, 0, 0),

  background: oklch(0.99, 0.002, 230),
  foreground: oklch(0.15, 0.015, 230),
  card: oklch(0.99, 0.002, 230),
  cardForeground: oklch(0.15, 0.015, 230),
  popover: oklch(0.99, 0.002, 230),
  popoverForeground: oklch(0.15, 0.015, 230),

  muted: oklch(0.96, 0.008, 230),
  mutedForeground: oklch(0.50, 0.015, 230),
  secondary: oklch(0.96, 0.008, 230),
  secondaryForeground: oklch(0.15, 0.015, 230),
  destructive: oklch(0.55, 0.2, 25),
  destructiveForeground: oklch(0.99, 0, 0),

  border: oklch(0.90, 0.008, 230),
  input: oklch(0.90, 0.008, 230),
  ring: oklch(0.45, 0.1, DEFAULT_PRIMARY_H),

  overlay: oklch(0.15, 0.015, 230, 0.5),
  glassBackground: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
};

export const defaultDarkPalette: SemanticPalette = {
  primary: oklch(0.65, 0.1, DEFAULT_PRIMARY_H),
  primaryForeground: oklch(0.99, 0, 0),
  primarySoft: oklch(0.22, 0.05, DEFAULT_PRIMARY_H),
  primaryMuted: oklch(0.32, 0.06, DEFAULT_PRIMARY_H),

  accent: oklch(0.65, 0.11, DEFAULT_ACCENT_H),
  accentForeground: oklch(0.15, 0, 0),
  accentSoft: oklch(0.22, 0.04, DEFAULT_ACCENT_H),

  success: oklch(0.65, 0.15, 145),
  successForeground: oklch(0.15, 0, 0),
  warning: oklch(0.75, 0.14, 75),
  warningForeground: oklch(0.15, 0.02, 75),
  error: oklch(0.65, 0.18, 25),
  errorForeground: oklch(0.15, 0, 0),
  info: oklch(0.65, 0.11, 230),
  infoForeground: oklch(0.15, 0, 0),

  background: oklch(0.12, 0.012, 230),
  foreground: oklch(0.95, 0.008, 230),
  card: oklch(0.17, 0.012, 230),
  cardForeground: oklch(0.95, 0.008, 230),
  popover: oklch(0.17, 0.012, 230),
  popoverForeground: oklch(0.95, 0.008, 230),

  muted: oklch(0.22, 0.012, 230),
  mutedForeground: oklch(0.65, 0.015, 230),
  secondary: oklch(0.22, 0.012, 230),
  secondaryForeground: oklch(0.95, 0.008, 230),
  destructive: oklch(0.55, 0.2, 25),
  destructiveForeground: oklch(0.99, 0, 0),

  border: oklch(0.28, 0.012, 230),
  input: oklch(0.28, 0.012, 230),
  ring: oklch(0.65, 0.1, DEFAULT_PRIMARY_H),

  overlay: oklch(0.05, 0.012, 230, 0.7),
  glassBackground: 'rgba(15, 23, 42, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

export const defaultLightGlass: GlassTokens = {
  blur: '12px',
  saturation: '180%',
  backdropBlur: 'blur(16px) saturate(180%)',
  panelBackground: 'rgba(255, 255, 255, 0.65)',
  panelBorder: 'rgba(255, 255, 255, 0.3)',
  cardBackground: 'rgba(255, 255, 255, 0.8)',
  cardBorder: 'rgba(255, 255, 255, 0.25)',
  navBackground: 'rgba(255, 255, 255, 0.75)',
  navBorder: 'rgba(255, 255, 255, 0.2)',
};

export const defaultDarkGlass: GlassTokens = {
  blur: '16px',
  saturation: '150%',
  backdropBlur: 'blur(20px) saturate(150%)',
  panelBackground: 'rgba(15, 23, 42, 0.65)',
  panelBorder: 'rgba(255, 255, 255, 0.08)',
  cardBackground: 'rgba(30, 41, 59, 0.7)',
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  navBackground: 'rgba(15, 23, 42, 0.8)',
  navBorder: 'rgba(255, 255, 255, 0.05)',
};

export const defaultLightGradients: GradientTokens = {
  primary: `linear-gradient(135deg, ${oklch(0.45, 0.1, DEFAULT_PRIMARY_H)} 0%, ${oklch(0.52, 0.12, DEFAULT_PRIMARY_H + 10)} 100%)`,
  primarySubtle: `linear-gradient(135deg, ${oklch(0.96, 0.015, DEFAULT_PRIMARY_H)} 0%, ${oklch(0.94, 0.02, DEFAULT_PRIMARY_H + 5)} 100%)`,
  accent: `linear-gradient(135deg, ${oklch(0.55, 0.12, DEFAULT_ACCENT_H)} 0%, ${oklch(0.62, 0.1, DEFAULT_ACCENT_H + 5)} 100%)`,
  heroBackground: `linear-gradient(180deg, ${oklch(0.99, 0.002, 230)} 0%, ${oklch(0.96, 0.008, 230)} 100%)`,
  cardShine: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)',
  meshColors: [
    oklch(0.95, 0.02, DEFAULT_PRIMARY_H),
    oklch(0.94, 0.025, DEFAULT_ACCENT_H),
    oklch(0.97, 0.015, 200),
  ],
};

export const defaultDarkGradients: GradientTokens = {
  primary: `linear-gradient(135deg, ${oklch(0.35, 0.1, DEFAULT_PRIMARY_H)} 0%, ${oklch(0.42, 0.12, DEFAULT_PRIMARY_H + 10)} 100%)`,
  primarySubtle: `linear-gradient(135deg, ${oklch(0.16, 0.03, DEFAULT_PRIMARY_H)} 0%, ${oklch(0.2, 0.04, DEFAULT_PRIMARY_H + 5)} 100%)`,
  accent: `linear-gradient(135deg, ${oklch(0.55, 0.11, DEFAULT_ACCENT_H)} 0%, ${oklch(0.62, 0.1, DEFAULT_ACCENT_H + 5)} 100%)`,
  heroBackground: `linear-gradient(180deg, ${oklch(0.12, 0.012, 230)} 0%, ${oklch(0.14, 0.015, 230)} 100%)`,
  cardShine: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%)',
  meshColors: [
    oklch(0.18, 0.04, DEFAULT_PRIMARY_H),
    oklch(0.2, 0.035, DEFAULT_ACCENT_H),
    oklch(0.15, 0.025, 200),
  ],
};

export const defaultLightShadows: ShadowTokens = {
  sm: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
  lg: '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.05)',
  xl: '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
  inner: 'inset 0 2px 4px 0 rgba(15, 23, 42, 0.05)',
  glassShadow: '0 8px 32px rgba(15, 23, 42, 0.12)',
  cardHover: '0 14px 28px rgba(15, 23, 42, 0.15), 0 10px 10px rgba(15, 23, 42, 0.1)',
  elevated: '0 25px 50px -12px rgba(15, 23, 42, 0.18)',
};

export const defaultDarkShadows: ShadowTokens = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.35), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.45), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
  glassShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  cardHover: '0 14px 28px rgba(0, 0, 0, 0.5), 0 10px 10px rgba(0, 0, 0, 0.35)',
  elevated: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
};

export const defaultLight: ThemeDefinition = {
  name: 'Default Light',
  councilId: 'default',
  colorMode: 'light',
  palette: defaultLightPalette,
  glass: defaultLightGlass,
  gradients: defaultLightGradients,
  motion: sharedMotion,
  typography: sharedTypography,
  radius: sharedRadius,
  shadows: defaultLightShadows,
};

export const defaultDark: ThemeDefinition = {
  name: 'Default Dark',
  councilId: 'default',
  colorMode: 'dark',
  palette: defaultDarkPalette,
  glass: defaultDarkGlass,
  gradients: defaultDarkGradients,
  motion: sharedMotion,
  typography: sharedTypography,
  radius: sharedRadius,
  shadows: defaultDarkShadows,
};

// ============================================================================
// COUNCIL BRANDING REGISTRY
// ============================================================================

export const councilBranding: Record<CouncilId, CouncilBranding> = {
  wcc: {
    id: 'wcc',
    name: 'Westminster City Council',
    shortName: 'Westminster',
    domains: ['children', 'corporate'],
    light: wccLight,
    dark: wccDark,
  },
  rbkc: {
    id: 'rbkc',
    name: 'Royal Borough of Kensington & Chelsea',
    shortName: 'RBKC',
    domains: ['adults', 'housing'],
    light: rbkcLight,
    dark: rbkcDark,
  },
  default: {
    id: 'default',
    name: 'Universal Council App',
    shortName: 'Universal',
    domains: ['children', 'adults', 'housing', 'corporate'],
    light: defaultLight,
    dark: defaultDark,
  },
};

/**
 * Get theme for a specific council and color mode
 */
export function getTheme(councilId: CouncilId, colorMode: 'light' | 'dark'): ThemeDefinition {
  const branding = councilBranding[councilId] ?? councilBranding.default;
  return colorMode === 'dark' ? branding.dark : branding.light;
}

/**
 * Get council branding by service domain
 */
export function getCouncilByDomain(domain: ServiceDomain): CouncilBranding {
  for (const council of Object.values(councilBranding)) {
    if (council.id !== 'default' && council.domains.includes(domain)) {
      return council;
    }
  }
  return councilBranding.default;
}

/**
 * Generate CSS custom properties from a theme
 */
export function themeToCSSProperties(theme: ThemeDefinition): Record<string, string> {
  const props: Record<string, string> = {};
  
  // Palette
  Object.entries(theme.palette).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    props[`--${cssKey}`] = value;
  });
  
  // Glass
  Object.entries(theme.glass).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    props[`--glass-${cssKey}`] = value;
  });
  
  // Gradients
  Object.entries(theme.gradients).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      props[`--gradient-${cssKey}`] = value;
    }
  });
  
  // Motion
  Object.entries(theme.motion).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    props[`--motion-${cssKey}`] = value;
  });
  
  // Typography
  Object.entries(theme.typography).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    props[`--typography-${cssKey}`] = String(value);
  });
  
  // Radius
  Object.entries(theme.radius).forEach(([key, value]) => {
    props[`--radius-${key}`] = value;
  });
  
  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    props[`--shadow-${cssKey}`] = value;
  });
  
  return props;
}

export default {
  councilBranding,
  getTheme,
  getCouncilByDomain,
  themeToCSSProperties,
};
