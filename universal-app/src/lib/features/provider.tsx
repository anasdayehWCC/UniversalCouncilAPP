/**
 * Feature Flag Provider
 *
 * React context and hooks for feature flag management.
 * Provides reactive flag evaluation with caching, PostHog integration,
 * and admin override support.
 */

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';

import type {
  FeatureFlag,
  FeatureFlagId,
  FeatureContext,
  FeatureEvaluationResult,
  FeatureOverride,
  PostHogFeatureFlag,
  FeatureFlagState,
  FeatureFlagAdminActions,
} from './types';

import { FEATURE_FLAGS, getAllFlags, getFlag, FLAG_IDS, type KnownFlagId } from './flags';
import { evaluateFlag, generateCacheKey, trackFlagEvaluation } from './evaluator';
import posthog from 'posthog-js';

// ============================================================================
// Context Types
// ============================================================================

interface FeatureFlagContextValue {
  /** Check if a flag is enabled */
  isEnabled: (flagId: FeatureFlagId) => boolean;
  /** Get full evaluation result for a flag */
  getEvaluation: (flagId: FeatureFlagId) => FeatureEvaluationResult | undefined;
  /** Get variant for a flag */
  getVariant: (flagId: FeatureFlagId) => string | undefined;
  /** Get all enabled flag IDs */
  getEnabledFlags: () => FeatureFlagId[];
  /** Check if multiple flags are all enabled */
  allEnabled: (...flagIds: FeatureFlagId[]) => boolean;
  /** Check if any of the flags are enabled */
  anyEnabled: (...flagIds: FeatureFlagId[]) => boolean;
  /** Track feature usage */
  trackUsage: (flagId: FeatureFlagId) => void;
  /** Current evaluation context */
  context: FeatureContext;
  /** Current state */
  state: FeatureFlagState;
  /** Admin actions */
  admin: FeatureFlagAdminActions;
  /** Loading state */
  isLoading: boolean;
}

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEY_OVERRIDES = 'feature_flag_overrides';
const STORAGE_KEY_CONTEXT = 'feature_flag_context';

// ============================================================================
// Context
// ============================================================================

const FeatureFlagContext = createContext<FeatureFlagContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

interface FeatureFlagProviderProps {
  children: ReactNode;
  /** Initial context values */
  initialContext?: Partial<FeatureContext>;
  /** Whether to sync with PostHog */
  enablePostHog?: boolean;
  /** PostHog polling interval (ms) */
  posthogPollingInterval?: number;
  /** Custom tracking function */
  trackFunction?: (eventName: string, properties: Record<string, unknown>) => void;
  /** DevTools enabled */
  devTools?: boolean;
}

// ============================================================================
// Provider Component
// ============================================================================

export function FeatureFlagProvider({
  children,
  initialContext = {},
  enablePostHog = true,
  posthogPollingInterval = 300000, // 5 minutes
  trackFunction,
  devTools = process.env.NODE_ENV === 'development',
}: FeatureFlagProviderProps) {
  // Initialize state
  const [flags] = useState(() => new Map(Object.entries(FEATURE_FLAGS)));
  const [overrides, setOverrides] = useState<Map<FeatureFlagId, FeatureOverride>>(() => {
    if (typeof window === 'undefined') return new Map();
    try {
      const stored = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      if (stored) {
        return new Map(Object.entries(JSON.parse(stored)));
      }
    } catch {
      // Ignore parse errors
    }
    return new Map();
  });
  const [posthogFlags, setPosthogFlags] = useState<Map<FeatureFlagId, PostHogFeatureFlag>>(
    new Map()
  );
  const [cache, setCache] = useState<Map<string, FeatureEvaluationResult>>(new Map());
  const [isLoading, setIsLoading] = useState(enablePostHog);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  // Context state
  const [context, setContext] = useState<FeatureContext>(() => ({
    environment: (process.env.NODE_ENV as FeatureContext['environment']) || 'development',
    ...initialContext,
  }));

  // Persist overrides to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const obj = Object.fromEntries(overrides);
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(obj));
  }, [overrides]);

  // Sync from PostHog
  const syncPostHog = useCallback(async () => {
    if (!enablePostHog || typeof window === 'undefined') return;

    try {
      setIsLoading(true);

      // Wait for PostHog to be ready
      await new Promise<void>((resolve) => {
        if (posthog.__loaded) {
          resolve();
        } else {
          posthog.onFeatureFlags(() => resolve());
        }
      });

      // Get all feature flags from PostHog
      const allFlags = posthog.featureFlags.getFlags();
      const newPosthogFlags = new Map<FeatureFlagId, PostHogFeatureFlag>();

      for (const key of allFlags) {
        const value = posthog.getFeatureFlag(key);
        const payload = posthog.getFeatureFlagPayload(key);

        if (typeof value === 'boolean') {
          newPosthogFlags.set(key, {
            key,
            enabled: value,
            payload: payload ? (payload as Record<string, unknown>) : undefined,
          });
        } else if (typeof value === 'string') {
          newPosthogFlags.set(key, {
            key,
            enabled: true,
            variantKey: value,
            payload: payload ? (payload as Record<string, unknown>) : undefined,
          });
        }
      }

      setPosthogFlags(newPosthogFlags);
      setLastSyncedAt(new Date().toISOString());
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync PostHog flags');
    } finally {
      setIsLoading(false);
    }
  }, [enablePostHog]);

  // Initial PostHog sync
  useEffect(() => {
    syncPostHog();
  }, [syncPostHog]);

  // PostHog polling
  useEffect(() => {
    if (!enablePostHog || posthogPollingInterval <= 0) return;

    const interval = setInterval(syncPostHog, posthogPollingInterval);
    return () => clearInterval(interval);
  }, [enablePostHog, posthogPollingInterval, syncPostHog]);

  // Clear cache when context changes
  useEffect(() => {
    setCache(new Map());
  }, [context]);

  // Evaluate a flag with caching
  const evaluateFlagWithCache = useCallback(
    (flagId: FeatureFlagId): FeatureEvaluationResult | undefined => {
      const flag = getFlag(flagId);
      if (!flag) return undefined;

      const cacheKey = generateCacheKey(flagId, context);
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      const result = evaluateFlag(flag, context, {
        override: overrides.get(flagId),
        posthogFlag: posthogFlags.get(flagId),
      });

      // Track evaluation if needed
      if (flag.analytics?.trackEvaluation) {
        trackFlagEvaluation(result, flag, trackFunction);
      }

      // Update cache
      setCache((prev) => new Map(prev).set(cacheKey, result));

      return result;
    },
    [context, overrides, posthogFlags, cache, trackFunction]
  );

  // Check if flag is enabled
  const isEnabled = useCallback(
    (flagId: FeatureFlagId): boolean => {
      const result = evaluateFlagWithCache(flagId);
      return result?.enabled ?? false;
    },
    [evaluateFlagWithCache]
  );

  // Get evaluation result
  const getEvaluation = useCallback(
    (flagId: FeatureFlagId): FeatureEvaluationResult | undefined => {
      return evaluateFlagWithCache(flagId);
    },
    [evaluateFlagWithCache]
  );

  // Get variant
  const getVariant = useCallback(
    (flagId: FeatureFlagId): string | undefined => {
      const result = evaluateFlagWithCache(flagId);
      return result?.variant;
    },
    [evaluateFlagWithCache]
  );

  // Get all enabled flags
  const getEnabledFlags = useCallback((): FeatureFlagId[] => {
    return getAllFlags()
      .filter((flag) => isEnabled(flag.id))
      .map((flag) => flag.id);
  }, [isEnabled]);

  // Check if all flags are enabled
  const allEnabled = useCallback(
    (...flagIds: FeatureFlagId[]): boolean => {
      return flagIds.every((id) => isEnabled(id));
    },
    [isEnabled]
  );

  // Check if any flag is enabled
  const anyEnabled = useCallback(
    (...flagIds: FeatureFlagId[]): boolean => {
      return flagIds.some((id) => isEnabled(id));
    },
    [isEnabled]
  );

  // Track feature usage
  const trackUsage = useCallback(
    (flagId: FeatureFlagId): void => {
      const flag = getFlag(flagId);
      if (!flag || !trackFunction) return;

      if (flag.analytics?.trackUsage) {
        const eventName = flag.analytics.eventName
          ? `${flag.analytics.eventName}_used`
          : `feature_${flag.id}_used`;

        trackFunction(eventName, {
          flagId: flag.id,
          ...flag.analytics.properties,
        });
      }
    },
    [trackFunction]
  );

  // Admin actions
  const admin: FeatureFlagAdminActions = useMemo(
    () => ({
      createOverride: (override: FeatureOverride) => {
        setOverrides((prev) => new Map(prev).set(override.flagId, override));
        setCache(new Map()); // Clear cache
      },
      removeOverride: (flagId: FeatureFlagId) => {
        setOverrides((prev) => {
          const next = new Map(prev);
          next.delete(flagId);
          return next;
        });
        setCache(new Map()); // Clear cache
      },
      clearOverrides: () => {
        setOverrides(new Map());
        setCache(new Map()); // Clear cache
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY_OVERRIDES);
        }
      },
      syncPostHog,
      updateContext: (updates: Partial<FeatureContext>) => {
        setContext((prev) => ({ ...prev, ...updates }));
      },
      clearCache: () => {
        setCache(new Map());
      },
    }),
    [syncPostHog]
  );

  // Build state object
  const state: FeatureFlagState = useMemo(
    () => ({
      flags,
      overrides,
      posthogFlags,
      cache,
      context,
      lastSyncedAt,
      isLoading,
      error,
    }),
    [flags, overrides, posthogFlags, cache, context, lastSyncedAt, isLoading, error]
  );

  // Context value
  const value: FeatureFlagContextValue = useMemo(
    () => ({
      isEnabled,
      getEvaluation,
      getVariant,
      getEnabledFlags,
      allEnabled,
      anyEnabled,
      trackUsage,
      context,
      state,
      admin,
      isLoading,
    }),
    [
      isEnabled,
      getEvaluation,
      getVariant,
      getEnabledFlags,
      allEnabled,
      anyEnabled,
      trackUsage,
      context,
      state,
      admin,
      isLoading,
    ]
  );

  // DevTools logging
  useEffect(() => {
    if (devTools && typeof window !== 'undefined') {
      (window as { __FEATURE_FLAGS__?: FeatureFlagContextValue }).__FEATURE_FLAGS__ = value;
    }
  }, [devTools, value]);

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Access the full feature flag context
 */
export function useFeatureFlagContext(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlagContext must be used within FeatureFlagProvider');
  }
  return context;
}

/**
 * Check if a specific feature flag is enabled
 */
export function useFeatureFlag(flagId: FeatureFlagId): boolean {
  const { isEnabled, isLoading } = useFeatureFlagContext();

  // Return false while loading to prevent flash
  if (isLoading) return false;

  return isEnabled(flagId);
}

/**
 * Get the full evaluation result for a flag
 */
export function useFeatureFlagEvaluation(
  flagId: FeatureFlagId
): FeatureEvaluationResult | undefined {
  const { getEvaluation, isLoading } = useFeatureFlagContext();

  if (isLoading) return undefined;

  return getEvaluation(flagId);
}

/**
 * Get the variant for an A/B test flag
 */
export function useFeatureVariant(flagId: FeatureFlagId): string | undefined {
  const { getVariant, isLoading } = useFeatureFlagContext();

  if (isLoading) return undefined;

  return getVariant(flagId);
}

/**
 * Get all enabled feature flags
 */
export function useFeatureFlags(): {
  flags: Map<FeatureFlagId, boolean>;
  enabledFlags: FeatureFlagId[];
  isLoading: boolean;
} {
  const { isEnabled, getEnabledFlags, isLoading } = useFeatureFlagContext();

  const flags = useMemo(() => {
    const map = new Map<FeatureFlagId, boolean>();
    for (const id of Object.values(FLAG_IDS)) {
      map.set(id, isEnabled(id));
    }
    return map;
  }, [isEnabled]);

  const enabledFlags = useMemo(() => getEnabledFlags(), [getEnabledFlags]);

  return { flags, enabledFlags, isLoading };
}

/**
 * Admin hook for managing feature flags
 */
export function useFeatureFlagAdmin(): FeatureFlagAdminActions {
  const { admin } = useFeatureFlagContext();
  return admin;
}

/**
 * Hook to track feature usage
 */
export function useFeatureUsageTracker(flagId: FeatureFlagId) {
  const { trackUsage, isEnabled } = useFeatureFlagContext();
  const enabled = isEnabled(flagId);

  return useCallback(() => {
    if (enabled) {
      trackUsage(flagId);
    }
  }, [enabled, flagId, trackUsage]);
}

// ============================================================================
// Higher-Order Component
// ============================================================================

interface WithFeatureFlagOptions {
  /** Fallback component when flag is disabled */
  fallback?: React.ComponentType;
  /** Show loading indicator while checking flag */
  showLoading?: boolean;
  /** Loading component */
  loadingComponent?: React.ComponentType;
}

/**
 * HOC that renders component only if feature flag is enabled
 */
export function withFeatureFlag<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  flagId: FeatureFlagId,
  options: WithFeatureFlagOptions = {}
): React.FC<P> {
  const { fallback: Fallback, showLoading, loadingComponent: LoadingComponent } = options;

  const WithFeatureFlag: React.FC<P> = (props) => {
    const { isEnabled, isLoading } = useFeatureFlagContext();

    if (isLoading && showLoading) {
      return LoadingComponent ? <LoadingComponent /> : null;
    }

    if (!isEnabled(flagId)) {
      return Fallback ? <Fallback /> : null;
    }

    return <WrappedComponent {...props} />;
  };

  WithFeatureFlag.displayName = `withFeatureFlag(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithFeatureFlag;
}

// ============================================================================
// Re-exports
// ============================================================================

export { FLAG_IDS } from './flags';
export type { FeatureFlag, FeatureFlagId, FeatureContext, FeatureEvaluationResult } from './types';
