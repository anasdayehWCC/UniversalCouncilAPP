'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  type ColorMode,
  type CouncilId,
  type ServiceDomain,
  type ThemeDefinition,
  getTheme,
  getCouncilByDomain,
  councilBranding,
  themeToCSSProperties,
  STORAGE_KEYS,
  MEDIA_QUERIES,
  DEFAULT_THEME_CONFIG,
  THEME_CLASSES,
} from '@/lib/themes';

/**
 * Theme context value interface
 */
export interface ThemeContextValue {
  // Current state
  colorMode: ColorMode;
  resolvedColorMode: 'light' | 'dark';
  councilId: CouncilId;
  theme: ThemeDefinition;
  
  // Council info
  councilName: string;
  councilShortName: string;
  
  // State setters
  setColorMode: (mode: ColorMode) => void;
  setCouncilId: (id: CouncilId) => void;
  setCouncilByDomain: (domain: ServiceDomain) => void;
  
  // Utilities
  toggleColorMode: () => void;
  isDark: boolean;
  isLight: boolean;
  isSystemMode: boolean;
  
  // Preferences
  reducedMotion: boolean;
  enableTransitions: boolean;
  setReducedMotion: (enabled: boolean) => void;
  setEnableTransitions: (enabled: boolean) => void;
  
  // CSS helpers
  cssVariables: Record<string, string>;
  applyTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Props for ThemeProvider
 */
export interface ThemeProviderProps {
  children: ReactNode;
  /** Initial color mode. Defaults to 'system'. */
  defaultColorMode?: ColorMode;
  /** Initial council ID. Defaults to 'default'. */
  defaultCouncilId?: CouncilId;
  /** Whether to enable smooth transitions. Defaults to true. */
  enableTransitions?: boolean;
  /** Whether to respect prefers-reduced-motion. Defaults to true. */
  respectReducedMotion?: boolean;
  /** Storage key prefix for persistence. */
  storageKeyPrefix?: string;
  /** Disable persistence to localStorage. */
  disablePersistence?: boolean;
  /** Force a specific color mode (ignores system preference). */
  forcedColorMode?: 'light' | 'dark';
  /** Attribute to set on document element for color mode. */
  attribute?: 'class' | 'data-theme';
}

/**
 * Get initial color mode from storage or default
 */
function getInitialColorMode(
  storageKey: string,
  defaultMode: ColorMode,
  forcedMode?: 'light' | 'dark'
): ColorMode {
  if (forcedMode) return forcedMode;
  if (typeof window === 'undefined') return defaultMode;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as ColorMode;
    }
  } catch {
    // Storage access denied
  }
  return defaultMode;
}

/**
 * Get initial council ID from storage or default
 */
function getInitialCouncilId(storageKey: string, defaultId: CouncilId): CouncilId {
  if (typeof window === 'undefined') return defaultId;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored && stored in councilBranding) {
      return stored as CouncilId;
    }
  } catch {
    // Storage access denied
  }
  return defaultId;
}

/**
 * Resolve system color mode preference
 */
function getSystemColorMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia(MEDIA_QUERIES.prefersDark).matches ? 'dark' : 'light';
}

/**
 * Check if user prefers reduced motion
 */
function getReducedMotionPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MEDIA_QUERIES.prefersReducedMotion).matches;
}

/**
 * ThemeProvider Component
 * 
 * Provides multi-tenant theming with light/dark mode support.
 * Persists preferences to localStorage and syncs with system preferences.
 */
export function ThemeProvider({
  children,
  defaultColorMode = DEFAULT_THEME_CONFIG.colorMode,
  defaultCouncilId = DEFAULT_THEME_CONFIG.councilId,
  enableTransitions: initialEnableTransitions = DEFAULT_THEME_CONFIG.enableTransitions,
  respectReducedMotion = DEFAULT_THEME_CONFIG.respectReducedMotion,
  storageKeyPrefix = '',
  disablePersistence = false,
  forcedColorMode,
  attribute = 'class',
}: ThemeProviderProps) {
  // Storage keys with optional prefix
  const colorModeKey = `${storageKeyPrefix}${STORAGE_KEYS.colorMode}`;
  const councilKey = `${storageKeyPrefix}${STORAGE_KEYS.councilId}`;
  const motionKey = `${storageKeyPrefix}${STORAGE_KEYS.reducedMotion}`;
  
  // State
  const [colorMode, setColorModeState] = useState<ColorMode>(() =>
    getInitialColorMode(colorModeKey, defaultColorMode, forcedColorMode)
  );
  const [councilId, setCouncilIdState] = useState<CouncilId>(() =>
    getInitialCouncilId(councilKey, defaultCouncilId)
  );
  const [systemMode, setSystemMode] = useState<'light' | 'dark'>(() => getSystemColorMode());
  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    if (respectReducedMotion) {
      return getReducedMotionPreference();
    }
    return false;
  });
  const [enableTransitions, setEnableTransitionsState] = useState(initialEnableTransitions);
  
  // Derived state
  const resolvedColorMode = useMemo<'light' | 'dark'>(() => {
    if (forcedColorMode) return forcedColorMode;
    if (colorMode === 'system') return systemMode;
    return colorMode;
  }, [colorMode, systemMode, forcedColorMode]);
  
  const theme = useMemo(() => getTheme(councilId, resolvedColorMode), [councilId, resolvedColorMode]);
  
  const branding = useMemo(() => councilBranding[councilId] ?? councilBranding.default, [councilId]);
  
  const cssVariables = useMemo(() => themeToCSSProperties(theme), [theme]);
  
  // Color mode setter with persistence
  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    if (!disablePersistence && typeof window !== 'undefined') {
      try {
        localStorage.setItem(colorModeKey, mode);
      } catch {
        // Storage access denied
      }
    }
  }, [colorModeKey, disablePersistence]);
  
  // Council ID setter with persistence
  const setCouncilId = useCallback((id: CouncilId) => {
    setCouncilIdState(id);
    if (!disablePersistence && typeof window !== 'undefined') {
      try {
        localStorage.setItem(councilKey, id);
      } catch {
        // Storage access denied
      }
    }
  }, [councilKey, disablePersistence]);
  
  // Set council by service domain
  const setCouncilByDomain = useCallback((domain: ServiceDomain) => {
    const council = getCouncilByDomain(domain);
    setCouncilId(council.id);
  }, [setCouncilId]);
  
  // Toggle between light and dark
  const toggleColorMode = useCallback(() => {
    setColorMode(resolvedColorMode === 'dark' ? 'light' : 'dark');
  }, [resolvedColorMode, setColorMode]);
  
  // Reduced motion setter
  const setReducedMotion = useCallback((enabled: boolean) => {
    setReducedMotionState(enabled);
    if (!disablePersistence && typeof window !== 'undefined') {
      try {
        localStorage.setItem(motionKey, String(enabled));
      } catch {
        // Storage access denied
      }
    }
  }, [motionKey, disablePersistence]);
  
  // Transitions setter
  const setEnableTransitions = useCallback((enabled: boolean) => {
    setEnableTransitionsState(enabled);
  }, []);
  
  // Apply theme to DOM
  const applyTheme = useCallback(() => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    const body = document.body;
    
    // Apply CSS variables to :root
    Object.entries(cssVariables).forEach(([prop, value]) => {
      root.style.setProperty(prop, value);
    });
    
    // Update color-scheme for native elements
    root.style.colorScheme = resolvedColorMode;
    
    // Apply classes or data attributes
    if (attribute === 'class') {
      // Remove old classes
      root.classList.remove(THEME_CLASSES.light, THEME_CLASSES.dark);
      root.classList.remove(THEME_CLASSES.wcc, THEME_CLASSES.rbkc, THEME_CLASSES.default);
      body.classList.remove(THEME_CLASSES.light, THEME_CLASSES.dark);
      
      // Add new classes
      root.classList.add(resolvedColorMode === 'dark' ? THEME_CLASSES.dark : THEME_CLASSES.light);
      root.classList.add(THEME_CLASSES[councilId] ?? THEME_CLASSES.default);
      body.classList.add(resolvedColorMode === 'dark' ? THEME_CLASSES.dark : THEME_CLASSES.light);
    } else {
      root.setAttribute('data-theme', resolvedColorMode);
      root.setAttribute('data-council', councilId);
    }
    
    // Handle transitions
    if (!enableTransitions || reducedMotion) {
      root.style.setProperty('--motion-duration-fast', '0ms');
      root.style.setProperty('--motion-duration-normal', '0ms');
      root.style.setProperty('--motion-duration-slow', '0ms');
    }
  }, [cssVariables, resolvedColorMode, councilId, attribute, enableTransitions, reducedMotion]);
  
  // Listen for system color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(MEDIA_QUERIES.prefersDark);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemMode(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Listen for reduced motion preference changes
  useEffect(() => {
    if (!respectReducedMotion || typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(MEDIA_QUERIES.prefersReducedMotion);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotionState(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [respectReducedMotion]);
  
  // Apply theme on changes
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);
  
  // Prevent flash of wrong theme on initial load
  useEffect(() => {
    // Add a small delay then enable transitions
    if (!enableTransitions) return;
    
    const timer = setTimeout(() => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('theme-transitions-enabled');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [enableTransitions]);
  
  // Context value
  const value = useMemo<ThemeContextValue>(() => ({
    colorMode,
    resolvedColorMode,
    councilId,
    theme,
    councilName: branding.name,
    councilShortName: branding.shortName,
    setColorMode,
    setCouncilId,
    setCouncilByDomain,
    toggleColorMode,
    isDark: resolvedColorMode === 'dark',
    isLight: resolvedColorMode === 'light',
    isSystemMode: colorMode === 'system',
    reducedMotion,
    enableTransitions,
    setReducedMotion,
    setEnableTransitions,
    cssVariables,
    applyTheme,
  }), [
    colorMode,
    resolvedColorMode,
    councilId,
    theme,
    branding,
    setColorMode,
    setCouncilId,
    setCouncilByDomain,
    toggleColorMode,
    reducedMotion,
    enableTransitions,
    setReducedMotion,
    setEnableTransitions,
    cssVariables,
    applyTheme,
  ]);
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Script to inject before React hydration to prevent theme flash
 * Use this in document head for SSR/SSG
 */
export function getThemeInitScript(defaultColorMode: ColorMode = 'system'): string {
  return `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEYS.colorMode}');
    var mode = stored || '${defaultColorMode}';
    if (mode === 'system') {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.add(mode === 'dark' ? '${THEME_CLASSES.dark}' : '${THEME_CLASSES.light}');
    document.documentElement.style.colorScheme = mode;
    
    var council = localStorage.getItem('${STORAGE_KEYS.councilId}') || 'default';
    document.documentElement.classList.add('council-' + council);
  } catch (e) {}
})();
`.trim();
}

export default ThemeProvider;
