'use client';

import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { PostHog } from 'posthog-js';
import {
  initPostHog,
  isPostHogEnabled,
  trackPageView,
  identifyUserInPostHog,
  resetPostHogUser,
  trackEvent,
  getFeatureFlag,
  isFeatureEnabled,
  getFeatureFlagPayload,
  reloadFeatureFlags,
  setGroup,
  setUserProperties,
  optOutCapturing,
  optInCapturing,
  hasOptedOut,
  getPostHog,
} from '@/lib/posthog';
import { isDemoMode } from '@/lib/auth/msal-config';

/**
 * PostHog context type
 */
interface PostHogContextType {
  /** Whether PostHog is enabled and initialized */
  isEnabled: boolean;
  /** Track a custom event */
  track: (event: string, properties?: Record<string, unknown>) => void;
  /** Identify the user */
  identify: (userId: string, traits?: { role?: string; tenantId?: string; domain?: string }) => void;
  /** Reset user (on logout) */
  reset: () => void;
  /** Get a feature flag value */
  getFlag: (flagKey: string) => boolean | string | undefined;
  /** Check if a feature is enabled */
  isFlagEnabled: (flagKey: string) => boolean;
  /** Get feature flag payload */
  getFlagPayload: (flagKey: string) => unknown;
  /** Reload feature flags */
  reloadFlags: () => Promise<void>;
  /** Set group for analytics */
  setAnalyticsGroup: (groupType: string, groupKey: string, properties?: Record<string, unknown>) => void;
  /** Set user properties */
  setProperties: (properties: Record<string, unknown>) => void;
  /** Opt out of tracking (GDPR) */
  optOut: () => void;
  /** Opt in to tracking */
  optIn: () => void;
  /** Check if user has opted out */
  isOptedOut: boolean;
}

const PostHogContext = createContext<PostHogContextType | undefined>(undefined);

/**
 * PostHog provider props
 */
interface PostHogProviderProps {
  children: ReactNode;
}

/**
 * PostHog Provider Component
 *
 * Provides PostHog analytics context to the app with:
 * - Automatic page view tracking
 * - Demo mode awareness (disabled in demo mode)
 * - Do Not Track respect
 * - Feature flag support
 * - Session recording
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <PostHogProvider>
 *   <App />
 * </PostHogProvider>
 *
 * // In component
 * const { track, isEnabled, isFlagEnabled } = usePostHog();
 * track('button_clicked', { button: 'submit' });
 * if (isFlagEnabled('new-feature')) { ... }
 * ```
 */
export function PostHogProvider({ children }: PostHogProviderProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isOptedOut, setIsOptedOut] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize PostHog on mount
  useEffect(() => {
    if (isDemoMode) {
      setIsEnabled(false);
      return;
    }

    const ph = initPostHog();
    setIsEnabled(ph !== null);
    setIsOptedOut(hasOptedOut());
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    // Construct full URL for tracking
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams, isEnabled]);

  // Context value with all PostHog methods
  const contextValue: PostHogContextType = {
    isEnabled,
    track: trackEvent,
    identify: identifyUserInPostHog,
    reset: resetPostHogUser,
    getFlag: getFeatureFlag,
    isFlagEnabled: isFeatureEnabled,
    getFlagPayload: getFeatureFlagPayload,
    reloadFlags: reloadFeatureFlags,
    setAnalyticsGroup: setGroup,
    setProperties: setUserProperties,
    optOut: () => {
      optOutCapturing();
      setIsOptedOut(true);
    },
    optIn: () => {
      optInCapturing();
      setIsOptedOut(false);
    },
    isOptedOut,
  };

  return (
    <PostHogContext.Provider value={contextValue}>
      {children}
    </PostHogContext.Provider>
  );
}

/**
 * Hook to access PostHog context
 *
 * @throws Error if used outside of PostHogProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { track, isFlagEnabled, identify } = usePostHog();
 *
 *   useEffect(() => {
 *     if (user) {
 *       identify(user.id, { role: user.role });
 *     }
 *   }, [user, identify]);
 *
 *   const handleClick = () => {
 *     track('button_clicked', { page: 'home' });
 *   };
 *
 *   if (isFlagEnabled('new-feature')) {
 *     return <NewFeature />;
 *   }
 *
 *   return <LegacyFeature onClick={handleClick} />;
 * }
 * ```
 */
export function usePostHog(): PostHogContextType {
  const context = useContext(PostHogContext);

  if (context === undefined) {
    throw new Error('usePostHog must be used within a PostHogProvider');
  }

  return context;
}

/**
 * Hook to get a specific feature flag value
 *
 * @param flagKey - The feature flag key
 * @returns The flag value or undefined if not available
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const variant = useFeatureFlag('experiment-variant');
 *
 *   if (variant === 'control') {
 *     return <ControlExperience />;
 *   } else if (variant === 'treatment') {
 *     return <TreatmentExperience />;
 *   }
 *
 *   return <DefaultExperience />;
 * }
 * ```
 */
export function useFeatureFlag(flagKey: string): boolean | string | undefined {
  const { getFlag, isEnabled } = usePostHog();
  const [value, setValue] = useState<boolean | string | undefined>(undefined);

  useEffect(() => {
    if (isEnabled) {
      setValue(getFlag(flagKey));
    }
  }, [isEnabled, flagKey, getFlag]);

  return value;
}

/**
 * Hook to check if a feature is enabled (boolean flags)
 *
 * @param flagKey - The feature flag key
 * @returns Whether the feature is enabled
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isNewDashboardEnabled = useFeatureEnabled('new-dashboard');
 *
 *   return isNewDashboardEnabled ? <NewDashboard /> : <OldDashboard />;
 * }
 * ```
 */
export function useFeatureEnabled(flagKey: string): boolean {
  const { isFlagEnabled, isEnabled } = usePostHog();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (isEnabled) {
      setEnabled(isFlagEnabled(flagKey));
    }
  }, [isEnabled, flagKey, isFlagEnabled]);

  return enabled;
}

export { PostHogContext };
