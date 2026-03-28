'use client';

import { useCallback, useMemo } from 'react';
import { useThemeContext, type ThemeContextValue } from '@/providers/ThemeProvider';
import type {
  ColorMode,
  CouncilId,
  ServiceDomain,
  ThemeDefinition,
  SemanticPalette,
  GlassTokens,
  GradientTokens,
  ShadowTokens,
} from '@/lib/themes';

/**
 * Primary theme hook - provides full theme context
 */
export function useTheme(): ThemeContextValue {
  return useThemeContext();
}

/**
 * Hook to access only color mode functionality
 */
export interface ColorModeHook {
  colorMode: ColorMode;
  resolvedColorMode: 'light' | 'dark';
  isDark: boolean;
  isLight: boolean;
  isSystemMode: boolean;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
}

export function useColorMode(): ColorModeHook {
  const {
    colorMode,
    resolvedColorMode,
    isDark,
    isLight,
    isSystemMode,
    setColorMode,
    toggleColorMode,
  } = useThemeContext();
  
  return useMemo(() => ({
    colorMode,
    resolvedColorMode,
    isDark,
    isLight,
    isSystemMode,
    setColorMode,
    toggleColorMode,
  }), [colorMode, resolvedColorMode, isDark, isLight, isSystemMode, setColorMode, toggleColorMode]);
}

/**
 * Hook to access council branding
 */
export interface CouncilHook {
  councilId: CouncilId;
  councilName: string;
  councilShortName: string;
  setCouncilId: (id: CouncilId) => void;
  setCouncilByDomain: (domain: ServiceDomain) => void;
}

export function useCouncil(): CouncilHook {
  const {
    councilId,
    councilName,
    councilShortName,
    setCouncilId,
    setCouncilByDomain,
  } = useThemeContext();
  
  return useMemo(() => ({
    councilId,
    councilName,
    councilShortName,
    setCouncilId,
    setCouncilByDomain,
  }), [councilId, councilName, councilShortName, setCouncilId, setCouncilByDomain]);
}

/**
 * Hook to access current theme palette colors
 */
export function useThemePalette(): SemanticPalette {
  const { theme } = useThemeContext();
  return theme.palette;
}

/**
 * Hook to access glassmorphism tokens
 */
export function useGlassTokens(): GlassTokens {
  const { theme } = useThemeContext();
  return theme.glass;
}

/**
 * Hook to access gradient tokens
 */
export function useGradientTokens(): GradientTokens {
  const { theme } = useThemeContext();
  return theme.gradients;
}

/**
 * Hook to access shadow tokens
 */
export function useShadowTokens(): ShadowTokens {
  const { theme } = useThemeContext();
  return theme.shadows;
}

/**
 * Hook to get a specific color from the palette
 */
export function useThemeColor(colorKey: keyof SemanticPalette): string {
  const { theme } = useThemeContext();
  return theme.palette[colorKey];
}

/**
 * Hook to get theme-aware style objects
 */
export interface ThemeStyles {
  // Primary styles
  primary: React.CSSProperties;
  primaryOutline: React.CSSProperties;
  primaryGhost: React.CSSProperties;
  
  // Accent styles
  accent: React.CSSProperties;
  accentOutline: React.CSSProperties;
  
  // Card styles
  card: React.CSSProperties;
  cardHover: React.CSSProperties;
  
  // Glass styles
  glass: React.CSSProperties;
  glassPanel: React.CSSProperties;
  glassCard: React.CSSProperties;
  glassNav: React.CSSProperties;
  
  // Status styles
  success: React.CSSProperties;
  warning: React.CSSProperties;
  error: React.CSSProperties;
  info: React.CSSProperties;
}

export function useThemeStyles(): ThemeStyles {
  const { theme, reducedMotion } = useThemeContext();
  const { palette, glass, shadows, motion } = theme;
  
  const transition = reducedMotion 
    ? 'none' 
    : `all ${motion.durationNormal} ${motion.easingDefault}`;
  
  return useMemo<ThemeStyles>(() => ({
    // Primary button/element
    primary: {
      background: palette.primary,
      color: palette.primaryForeground,
      transition,
    },
    primaryOutline: {
      background: 'transparent',
      color: palette.primary,
      border: `1px solid ${palette.primary}`,
      transition,
    },
    primaryGhost: {
      background: palette.primarySoft,
      color: palette.primary,
      transition,
    },
    
    // Accent button/element
    accent: {
      background: palette.accent,
      color: palette.accentForeground,
      transition,
    },
    accentOutline: {
      background: 'transparent',
      color: palette.accent,
      border: `1px solid ${palette.accent}`,
      transition,
    },
    
    // Card styles
    card: {
      background: palette.card,
      color: palette.cardForeground,
      border: `1px solid ${palette.border}`,
      boxShadow: shadows.md,
      transition,
    },
    cardHover: {
      boxShadow: shadows.cardHover,
      transform: 'translateY(-2px)',
    },
    
    // Glassmorphism styles
    glass: {
      background: glass.cardBackground,
      backdropFilter: glass.backdropBlur,
      WebkitBackdropFilter: glass.backdropBlur,
      border: `1px solid ${glass.cardBorder}`,
      boxShadow: shadows.glassShadow,
    },
    glassPanel: {
      background: glass.panelBackground,
      backdropFilter: glass.backdropBlur,
      WebkitBackdropFilter: glass.backdropBlur,
      border: `1px solid ${glass.panelBorder}`,
      boxShadow: shadows.glassShadow,
    },
    glassCard: {
      background: glass.cardBackground,
      backdropFilter: glass.backdropBlur,
      WebkitBackdropFilter: glass.backdropBlur,
      border: `1px solid ${glass.cardBorder}`,
      boxShadow: shadows.glassShadow,
    },
    glassNav: {
      background: glass.navBackground,
      backdropFilter: glass.backdropBlur,
      WebkitBackdropFilter: glass.backdropBlur,
      border: `1px solid ${glass.navBorder}`,
    },
    
    // Status styles
    success: {
      background: palette.success,
      color: palette.successForeground,
    },
    warning: {
      background: palette.warning,
      color: palette.warningForeground,
    },
    error: {
      background: palette.error,
      color: palette.errorForeground,
    },
    info: {
      background: palette.info,
      color: palette.infoForeground,
    },
  }), [palette, glass, shadows, motion, reducedMotion, transition]);
}

/**
 * Hook to merge custom styles with theme styles
 */
export function useThemedStyle<T extends React.CSSProperties>(
  baseStyle: keyof ThemeStyles | React.CSSProperties,
  customStyle?: T
): React.CSSProperties {
  const themeStyles = useThemeStyles();
  
  return useMemo(() => {
    const base = typeof baseStyle === 'string' ? themeStyles[baseStyle] : baseStyle;
    return { ...base, ...customStyle };
  }, [themeStyles, baseStyle, customStyle]);
}

/**
 * Hook to get CSS variable value as string
 */
export function useCSSVariable(variableName: string): string {
  const { cssVariables } = useThemeContext();
  return cssVariables[variableName] ?? '';
}

/**
 * Hook to check motion preferences
 */
export interface MotionPreferences {
  reducedMotion: boolean;
  enableTransitions: boolean;
  setReducedMotion: (enabled: boolean) => void;
  setEnableTransitions: (enabled: boolean) => void;
  /** Get duration based on motion preferences */
  getDuration: (normalMs: number) => number;
}

export function useMotionPreferences(): MotionPreferences {
  const {
    reducedMotion,
    enableTransitions,
    setReducedMotion,
    setEnableTransitions,
    theme,
  } = useThemeContext();
  
  const getDuration = useCallback((normalMs: number): number => {
    if (reducedMotion) return 0;
    if (!enableTransitions) return 0;
    return normalMs;
  }, [reducedMotion, enableTransitions]);
  
  return useMemo(() => ({
    reducedMotion,
    enableTransitions,
    setReducedMotion,
    setEnableTransitions,
    getDuration,
  }), [reducedMotion, enableTransitions, setReducedMotion, setEnableTransitions, getDuration]);
}

/**
 * Hook to get gradient CSS for backgrounds
 */
export interface GradientCSS {
  primary: string;
  primarySubtle: string;
  accent: string;
  hero: string;
  mesh: string;
}

export function useGradients(): GradientCSS {
  const { theme } = useThemeContext();
  
  return useMemo(() => ({
    primary: theme.gradients.primary,
    primarySubtle: theme.gradients.primarySubtle,
    accent: theme.gradients.accent,
    hero: theme.gradients.heroBackground,
    mesh: createMeshGradient(theme.gradients.meshColors),
  }), [theme.gradients]);
}

/**
 * Create a mesh gradient from colors
 */
function createMeshGradient(colors: string[]): string {
  if (colors.length < 2) return colors[0] ?? 'transparent';
  
  const positions = [
    '0% 0%',
    '100% 0%',
    '100% 100%',
    '0% 100%',
    '50% 50%',
  ];
  
  const gradients = colors.map((color, i) => {
    const pos = positions[i % positions.length];
    return `radial-gradient(ellipse at ${pos}, ${color} 0%, transparent 70%)`;
  });
  
  return gradients.join(', ');
}

/**
 * Hook to get the full theme definition
 */
export function useThemeDefinition(): ThemeDefinition {
  const { theme } = useThemeContext();
  return theme;
}

export default useTheme;
