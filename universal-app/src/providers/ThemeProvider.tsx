'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
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
import { getThemeInitScript as buildThemeInitScript } from '@/lib/themes/theme-init';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/context/DemoContext';
import { api, getUserPreferencesUsersMePreferencesGet, updateUserPreferencesUsersMePreferencesPatch } from '@/lib/api/client';
import type { UserPreferencesResponse } from '@/lib/api/generated/types.gen';
import { isDemoMode } from '@/lib/auth/msal-config';

type ThemePreferenceSource = 'default' | 'bootstrap' | 'local' | 'server';
type ThemePreferenceSyncState = 'idle' | 'loading' | 'local' | 'pending' | 'synced' | 'error';

interface StoredThemePreference {
  colorMode: ColorMode;
  updatedAt: string;
  source: ThemePreferenceSource;
}

interface ResolvedThemePreference extends StoredThemePreference {
  syncedAt?: string | null;
}

const THEME_PREFERENCE_PREFIX = 'theme-preference';
const LEGACY_COLOR_MODE_KEY = STORAGE_KEYS.colorMode;
const LEGACY_EPOCH = new Date(0).toISOString();

function isValidColorMode(value: unknown): value is ColorMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function buildPreferenceKey(storageKeyPrefix: string, scopeKey: string): string {
  return `${storageKeyPrefix}${THEME_PREFERENCE_PREFIX}:${scopeKey}`;
}

function getBootstrapKey(storageKeyPrefix: string): string {
  return `${storageKeyPrefix}${THEME_PREFERENCE_PREFIX}:bootstrap`;
}

function getLastScopeKey(storageKeyPrefix: string): string {
  return `${storageKeyPrefix}${THEME_PREFERENCE_PREFIX}:last-scope`;
}

function getStoredScopeValue(lastScopeKey: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(lastScopeKey);
  } catch {
    return null;
  }
}

function parseStoredPreference(rawValue: string | null): StoredThemePreference | null {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredThemePreference> & { colorMode?: unknown };
    if (!isValidColorMode(parsed.colorMode)) return null;

    return {
      colorMode: parsed.colorMode,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : LEGACY_EPOCH,
      source: parsed.source === 'local' || parsed.source === 'server' || parsed.source === 'bootstrap'
        ? parsed.source
        : 'local',
    };
  } catch {
    return null;
  }
}

function readStoredPreference(storageKey: string): StoredThemePreference | null {
  if (typeof window === 'undefined') return null;

  try {
    return parseStoredPreference(localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

function readLegacyPreference(defaultMode: ColorMode, forcedMode?: 'light' | 'dark'): StoredThemePreference {
  if (forcedMode) {
    return {
      colorMode: forcedMode,
      updatedAt: LEGACY_EPOCH,
      source: 'default',
    };
  }

  if (typeof window === 'undefined') {
    return {
      colorMode: defaultMode,
      updatedAt: LEGACY_EPOCH,
      source: 'default',
    };
  }

  try {
    const stored = localStorage.getItem(LEGACY_COLOR_MODE_KEY);
    if (isValidColorMode(stored)) {
      return {
        colorMode: stored,
        updatedAt: LEGACY_EPOCH,
        source: 'bootstrap',
      };
    }
  } catch {
    // Storage access denied
  }

  return {
    colorMode: defaultMode,
    updatedAt: LEGACY_EPOCH,
    source: 'default',
  };
}

function readInitialPreference(
  storageKey: string,
  bootstrapKey: string,
  lastScopeKey: string,
  scopeKey: string,
  defaultMode: ColorMode,
  forcedMode?: 'light' | 'dark'
): StoredThemePreference {
  const stored = readStoredPreference(storageKey);
  if (stored) return stored;

  const storedLastScopeValue = getStoredScopeValue(lastScopeKey);
  const shouldUseBootstrap =
    storedLastScopeValue === scopeKey ||
    storedLastScopeValue === null ||
    scopeKey.startsWith('demo:') ||
    scopeKey === 'anonymous';
  if (shouldUseBootstrap) {
    const bootstrap = readStoredPreference(bootstrapKey);
    if (bootstrap) return { ...bootstrap, source: 'bootstrap' };
  }

  if (storedLastScopeValue !== null && storedLastScopeValue !== scopeKey && !scopeKey.startsWith('demo:') && scopeKey !== 'anonymous') {
    return {
      colorMode: forcedMode ?? defaultMode,
      updatedAt: LEGACY_EPOCH,
      source: 'default',
    };
  }

  return readLegacyPreference(defaultMode, forcedMode);
}

function normalizePreference(
  colorMode: ColorMode,
  source: ThemePreferenceSource,
  updatedAt = new Date().toISOString()
): StoredThemePreference {
  return { colorMode, source, updatedAt };
}

function writeStoredPreference(
  storageKey: string,
  preference: StoredThemePreference,
  bootstrapKey: string,
  lastScopeKey: string,
  scopeKey: string,
  councilKey: string,
  councilId: CouncilId
) {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(preference);
    localStorage.setItem(storageKey, serialized);
    localStorage.setItem(bootstrapKey, serialized);
    localStorage.setItem(lastScopeKey, scopeKey);
    localStorage.setItem(LEGACY_COLOR_MODE_KEY, preference.colorMode);
    localStorage.setItem(councilKey, councilId);
  } catch {
    // Storage access denied
  }
}

function preferenceToStorage(preference: StoredThemePreference, syncedAt?: string | null): ResolvedThemePreference {
  return {
    ...preference,
    syncedAt: syncedAt ?? null,
  };
}

/**
 * Theme context value interface
 */
export interface ThemeContextValue {
  // Current state
  colorMode: ColorMode;
  resolvedColorMode: 'light' | 'dark';
  councilId: CouncilId;
  theme: ThemeDefinition;
  themeScopeKey: string;
  preferenceSource: ThemePreferenceSource;
  preferenceSyncState: ThemePreferenceSyncState;
  preferenceError: string | null;
  preferenceUpdatedAt: string | null;
  preferenceSyncedAt: string | null;
  
  // Council info
  councilName: string;
  councilShortName: string;
  
  // State setters
  setColorMode: (mode: ColorMode) => void;
  setCouncilId: (id: CouncilId) => void;
  setCouncilByDomain: (domain: ServiceDomain) => void;
  
  // Utilities
  toggleColorMode: () => void;
  resetColorMode: () => void;
  isDark: boolean;
  isLight: boolean;
  isSystemMode: boolean;
  refreshPreference: () => Promise<void>;
  syncPreference: () => Promise<void>;
  
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
  bootstrapKey: string,
  lastScopeKey: string,
  scopeKey: string,
  defaultMode: ColorMode,
  forcedMode?: 'light' | 'dark'
): ColorMode {
  return readInitialPreference(storageKey, bootstrapKey, lastScopeKey, scopeKey, defaultMode, forcedMode).colorMode;
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
  const { currentUser } = useDemo();
  const { accessToken, account, idTokenClaims, isAuthenticated } = useAuth();

  // Storage keys with optional prefix
  const councilKey = `${storageKeyPrefix}${STORAGE_KEYS.councilId}`;
  const motionKey = `${storageKeyPrefix}${STORAGE_KEYS.reducedMotion}`;
  const bootstrapKey = getBootstrapKey(storageKeyPrefix);
  const lastScopeKey = getLastScopeKey(storageKeyPrefix);

  const themeScopeKey = useMemo(() => {
    if (isDemoMode) {
      return `demo:${currentUser.id}`;
    }

    const authScopeId =
      isAuthenticated && !isDemoMode
        ? account?.homeAccountId ??
          idTokenClaims?.oid ??
          idTokenClaims?.preferred_username ??
          account?.username ??
          null
        : null;

    return authScopeId ? `auth:${authScopeId}` : 'anonymous';
  }, [account?.homeAccountId, account?.username, currentUser.id, idTokenClaims?.oid, idTokenClaims?.preferred_username, isAuthenticated]);

  const initialPreference = useMemo(
    () => readInitialPreference(
      `${storageKeyPrefix}${THEME_PREFERENCE_PREFIX}:${themeScopeKey}`,
      bootstrapKey,
      lastScopeKey,
      themeScopeKey,
      defaultColorMode,
      forcedColorMode
    ),
    [bootstrapKey, defaultColorMode, forcedColorMode, lastScopeKey, storageKeyPrefix, themeScopeKey]
  );

  // State
  const [colorMode, setColorModeState] = useState<ColorMode>(initialPreference.colorMode);
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
  const [preferenceSource, setPreferenceSource] = useState<ThemePreferenceSource>(initialPreference.source);
  const [preferenceSyncState, setPreferenceSyncState] = useState<ThemePreferenceSyncState>(
    initialPreference.source === 'server' ? 'synced' : initialPreference.source === 'local' ? 'local' : 'idle'
  );
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [preferenceUpdatedAt, setPreferenceUpdatedAt] = useState<string | null>(initialPreference.updatedAt ?? null);
  const [preferenceSyncedAt, setPreferenceSyncedAt] = useState<string | null>(
    initialPreference.source === 'server' ? initialPreference.updatedAt : null
  );

  const syncRequestIdRef = useRef(0);
  const mountedRef = useRef(false);
  
  // Derived state
  const resolvedColorMode = useMemo<'light' | 'dark'>(() => {
    if (forcedColorMode) return forcedColorMode;
    if (colorMode === 'system') return systemMode;
    return colorMode;
  }, [colorMode, systemMode, forcedColorMode]);
  
  const theme = useMemo(() => getTheme(councilId, resolvedColorMode), [councilId, resolvedColorMode]);
  
  const branding = useMemo(() => councilBranding[councilId] ?? councilBranding.default, [councilId]);
  
  const cssVariables = useMemo(() => themeToCSSProperties(theme), [theme]);

  const scopePreferenceKey = useMemo(
    () => buildPreferenceKey(storageKeyPrefix, themeScopeKey),
    [storageKeyPrefix, themeScopeKey]
  );

  const canSyncPreferences = !disablePersistence && !isDemoMode && Boolean(accessToken);

  const persistPreference = useCallback((preference: StoredThemePreference) => {
    if (disablePersistence || typeof window === 'undefined') return;
    writeStoredPreference(scopePreferenceKey, preference, bootstrapKey, lastScopeKey, themeScopeKey, councilKey, councilId);
  }, [bootstrapKey, councilId, councilKey, disablePersistence, lastScopeKey, scopePreferenceKey, themeScopeKey]);

  const applyPreferenceRecord = useCallback((preference: StoredThemePreference, options?: {
    persist?: boolean;
    syncState?: ThemePreferenceSyncState;
    syncedAt?: string | null;
  }) => {
    const next = preferenceToStorage(preference, options?.syncedAt ?? (preference.source === 'server' ? preference.updatedAt : null));

    setColorModeState(next.colorMode);
    setPreferenceSource(next.source);
    setPreferenceUpdatedAt(next.updatedAt);
    setPreferenceSyncedAt(next.syncedAt ?? null);
    setPreferenceSyncState(options?.syncState ?? (next.source === 'server' ? 'synced' : next.source === 'local' ? 'local' : 'idle'));
    setPreferenceError(null);

    if (options?.persist ?? true) {
      persistPreference(next);
    }
  }, [persistPreference]);

  const syncPreferenceToServer = useCallback(async (preference: StoredThemePreference) => {
    if (!canSyncPreferences || forcedColorMode) return;

    const requestId = ++syncRequestIdRef.current;
    setPreferenceSyncState('pending');
    setPreferenceError(null);

    try {
      const { data: response } = await api.withRetry(() =>
        updateUserPreferencesUsersMePreferencesPatch({
          client: api.client,
          body: { color_mode: preference.colorMode },
        })
      );

      const typedResponse = response as UserPreferencesResponse | undefined;
      if (syncRequestIdRef.current !== requestId || !mountedRef.current || !typedResponse) return;

      applyPreferenceRecord(
        normalizePreference(typedResponse.color_mode, 'server', typedResponse.updated_datetime),
        {
          persist: true,
          syncState: 'synced',
          syncedAt: typedResponse.updated_datetime,
        }
      );
    } catch (error) {
      if (syncRequestIdRef.current !== requestId || !mountedRef.current) return;

      setPreferenceSyncState('error');
      setPreferenceError(error instanceof Error ? error.message : 'Unable to sync appearance preference');
    }
  }, [applyPreferenceRecord, canSyncPreferences, forcedColorMode]);

  const refreshPreference = useCallback(async () => {
    const requestId = ++syncRequestIdRef.current;
    const scopedPreference = readStoredPreference(scopePreferenceKey);
    const storedLastScope = getStoredScopeValue(lastScopeKey);
    const shouldUseBootstrap =
      !scopedPreference &&
      (storedLastScope === themeScopeKey ||
        storedLastScope === null ||
        themeScopeKey.startsWith('demo:') ||
        themeScopeKey === 'anonymous');
    const bootstrapPreference = shouldUseBootstrap ? readStoredPreference(bootstrapKey) : null;
    const legacyPreference = shouldUseBootstrap ? readLegacyPreference(defaultColorMode, forcedColorMode) : null;
    const localPreference =
      scopedPreference ??
      bootstrapPreference ??
      legacyPreference ??
      normalizePreference(defaultColorMode, 'default');

    setPreferenceSyncState(canSyncPreferences ? 'loading' : localPreference.source === 'default' ? 'idle' : 'local');
    setPreferenceError(null);

    applyPreferenceRecord(localPreference, {
      persist: localPreference.source !== 'default',
      syncState: canSyncPreferences ? (localPreference.source === 'server' ? 'synced' : 'local') : localPreference.source === 'default' ? 'idle' : 'local',
      syncedAt: localPreference.source === 'server' ? localPreference.updatedAt : null,
    });

    if (!canSyncPreferences || forcedColorMode) return;

    try {
      const { data: serverPreference } = await api.withRetry(() =>
        getUserPreferencesUsersMePreferencesGet({ client: api.client })
      );

      const typedPreference = serverPreference as UserPreferencesResponse | undefined;
      if (syncRequestIdRef.current !== requestId || !mountedRef.current || !typedPreference) return;

      const currentLocalTime = Date.parse(localPreference.updatedAt || LEGACY_EPOCH);
      const serverTime = Date.parse(typedPreference.updated_datetime);

      if (
        localPreference.source === 'default' ||
        !scopedPreference ||
        Number.isNaN(currentLocalTime) ||
        serverTime >= currentLocalTime
      ) {
        applyPreferenceRecord(
          normalizePreference(typedPreference.color_mode, 'server', typedPreference.updated_datetime),
          {
            persist: true,
            syncState: 'synced',
            syncedAt: typedPreference.updated_datetime,
          }
        );
        return;
      }

      await syncPreferenceToServer(localPreference);
    } catch (error) {
      if (syncRequestIdRef.current !== requestId || !mountedRef.current) return;

      setPreferenceSyncState(localPreference.source === 'default' ? 'idle' : 'error');
      setPreferenceError(error instanceof Error ? error.message : 'Unable to load appearance preference');
    }
  }, [applyPreferenceRecord, bootstrapKey, canSyncPreferences, defaultColorMode, forcedColorMode, lastScopeKey, scopePreferenceKey, syncPreferenceToServer, themeScopeKey]);

  // Color mode setter with persistence
  const setColorMode = useCallback((mode: ColorMode) => {
    const preference = normalizePreference(mode, 'local');
    applyPreferenceRecord(preference, {
      persist: true,
      syncState: canSyncPreferences ? 'pending' : 'local',
    });
    void syncPreferenceToServer(preference);
  }, [applyPreferenceRecord, canSyncPreferences, syncPreferenceToServer]);
  
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

  const resetColorMode = useCallback(() => {
    setColorMode('system');
  }, [setColorMode]);

  const syncPreference = useCallback(async () => {
    const currentPreference = normalizePreference(
      colorMode,
      preferenceSource,
      preferenceUpdatedAt ?? new Date().toISOString()
    );
    await syncPreferenceToServer(currentPreference);
  }, [colorMode, preferenceSource, preferenceUpdatedAt, syncPreferenceToServer]);
  
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
    root.classList.remove(
      THEME_CLASSES.light,
      THEME_CLASSES.dark,
      THEME_CLASSES.wcc,
      THEME_CLASSES.rbkc,
      THEME_CLASSES.default,
      'light',
      'dark'
    );
    body.classList.remove(THEME_CLASSES.light, THEME_CLASSES.dark, 'light', 'dark');

    const themeClass = resolvedColorMode === 'dark' ? THEME_CLASSES.dark : THEME_CLASSES.light;
    const modeClass = resolvedColorMode === 'dark' ? 'dark' : 'light';

    root.classList.add(themeClass);
    root.classList.add(modeClass);
    body.classList.add(themeClass);
    body.classList.add(modeClass);
    root.setAttribute('data-theme', resolvedColorMode);
    root.setAttribute('data-council', councilId);
    body.setAttribute('data-theme', resolvedColorMode);
    if (attribute === 'class') {
      // Add council class for theme-specific overrides
      root.classList.add(THEME_CLASSES[councilId] ?? THEME_CLASSES.default);
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

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      syncRequestIdRef.current += 1;
    };
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshPreference();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshPreference]);
  
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
    themeScopeKey,
    preferenceSource,
    preferenceSyncState,
    preferenceError,
    preferenceUpdatedAt,
    preferenceSyncedAt,
    councilName: branding.name,
    councilShortName: branding.shortName,
    setColorMode,
    setCouncilId,
    setCouncilByDomain,
    toggleColorMode,
    resetColorMode,
    isDark: resolvedColorMode === 'dark',
    isLight: resolvedColorMode === 'light',
    isSystemMode: colorMode === 'system',
    refreshPreference,
    syncPreference,
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
    themeScopeKey,
    preferenceSource,
    preferenceSyncState,
    preferenceError,
    preferenceUpdatedAt,
    preferenceSyncedAt,
    branding,
    setColorMode,
    setCouncilId,
    setCouncilByDomain,
    toggleColorMode,
    resetColorMode,
    refreshPreference,
    syncPreference,
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
  return buildThemeInitScript(defaultColorMode);
}

export default ThemeProvider;
