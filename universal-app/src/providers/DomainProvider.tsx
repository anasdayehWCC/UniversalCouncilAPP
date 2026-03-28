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
import { useRouter, usePathname } from 'next/navigation';
import type {
  ServiceDomain,
  DomainConfig,
  DomainContextValue,
  UserDomainProfile,
  UserDomainAccess,
} from '@/lib/domain/types';
import {
  DOMAIN_CONFIGS,
  getDomainConfig,
  getDomainByPath,
  getActiveDomains,
  DEFAULT_DOMAIN,
  DOMAIN_STORAGE_KEY,
  replaceDomainInPath,
  isDomainAvailableForRole,
} from '@/lib/domain/config';

// ============================================================================
// Context
// ============================================================================

const DomainContext = createContext<DomainContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

interface DomainProviderProps {
  children: ReactNode;
  /** Initial domain (overrides URL detection) */
  initialDomain?: ServiceDomain;
  /** User's domain access profile */
  userProfile?: UserDomainProfile;
  /** User's current role (for access checks) */
  userRole?: string;
  /** Enable URL-based domain detection */
  enableUrlDetection?: boolean;
  /** Enable domain persistence to localStorage */
  enablePersistence?: boolean;
  /** Navigate on domain switch */
  navigateOnSwitch?: boolean;
  /** Callback when domain changes */
  onDomainChange?: (domain: ServiceDomain) => void;
  /** Callback on domain error */
  onDomainError?: (error: Error) => void;
}

// ============================================================================
// Provider Implementation
// ============================================================================

export function DomainProvider({
  children,
  initialDomain,
  userProfile: initialProfile,
  userRole = 'social_worker',
  enableUrlDetection = true,
  enablePersistence = true,
  navigateOnSwitch = true,
  onDomainChange,
  onDomainError,
}: DomainProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine initial domain from URL, storage, or fallback
  const getInitialDomain = useCallback((): ServiceDomain => {
    // 1. Use explicit initial domain if provided
    if (initialDomain && DOMAIN_CONFIGS[initialDomain]) {
      return initialDomain;
    }

    // 2. Try URL detection (server-side safe)
    if (enableUrlDetection && pathname) {
      const domainFromPath = getDomainByPath(pathname);
      if (domainFromPath) {
        return domainFromPath.id;
      }
    }

    // 3. Try localStorage (client-side only)
    if (enablePersistence && typeof window !== 'undefined') {
      const stored = localStorage.getItem(DOMAIN_STORAGE_KEY);
      if (stored && DOMAIN_CONFIGS[stored as ServiceDomain]) {
        return stored as ServiceDomain;
      }
    }

    // 4. Use profile's preferred domain
    if (initialProfile?.preferredDomain) {
      return initialProfile.preferredDomain;
    }

    // 5. Use profile's primary domain
    const primaryDomain = initialProfile?.domains.find((d) => d.isPrimary);
    if (primaryDomain) {
      return primaryDomain.domain;
    }

    // 6. Fall back to default
    return DEFAULT_DOMAIN;
  }, [initialDomain, pathname, enableUrlDetection, enablePersistence, initialProfile]);

  // State
  const [current, setCurrent] = useState<ServiceDomain>(getInitialDomain);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userProfile, setUserProfile] = useState<UserDomainProfile | null>(
    initialProfile ?? null
  );

  // Derived state
  const config = useMemo(() => getDomainConfig(current), [current]);
  const available = useMemo(() => {
    if (!userProfile) {
      // If no profile, filter by role
      return getActiveDomains().filter((d) =>
        isDomainAvailableForRole(d.id, userRole)
      );
    }
    // Filter by user's accessible domains
    return getActiveDomains().filter((d) =>
      userProfile.domains.some((access) => access.domain === d.id)
    );
  }, [userProfile, userRole]);

  // Initialize on mount
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Persist domain preference
  useEffect(() => {
    if (enablePersistence && isInitialized && typeof window !== 'undefined') {
      localStorage.setItem(DOMAIN_STORAGE_KEY, current);
    }
  }, [current, enablePersistence, isInitialized]);

  // Sync with URL changes
  useEffect(() => {
    if (enableUrlDetection && pathname && isInitialized) {
      const domainFromPath = getDomainByPath(pathname);
      if (domainFromPath && domainFromPath.id !== current) {
        setCurrent(domainFromPath.id);
      }
    }
  }, [pathname, enableUrlDetection, current, isInitialized]);

  // ============================================================================
  // Actions
  // ============================================================================

  const hasAccess = useCallback(
    (domain: ServiceDomain): boolean => {
      if (!userProfile) {
        return isDomainAvailableForRole(domain, userRole);
      }
      return userProfile.domains.some((d) => d.domain === domain);
    },
    [userProfile, userRole]
  );

  const getRoleInDomain = useCallback(
    (domain: ServiceDomain): string | null => {
      if (!userProfile) {
        return isDomainAvailableForRole(domain, userRole) ? userRole : null;
      }
      const access = userProfile.domains.find((d) => d.domain === domain);
      return access?.role ?? null;
    },
    [userProfile, userRole]
  );

  const isFeatureEnabled = useCallback(
    (featureId: string): boolean => {
      return config.features.flags[featureId] ?? false;
    },
    [config]
  );

  const isModuleAvailable = useCallback(
    (moduleId: string): boolean => {
      return config.features.modules.includes(moduleId);
    },
    [config]
  );

  const switchDomain = useCallback(
    async (newDomain: ServiceDomain): Promise<void> => {
      // Validate domain exists
      if (!DOMAIN_CONFIGS[newDomain]) {
        const err = new Error(`Invalid domain: ${newDomain}`);
        setError(err.message);
        onDomainError?.(err);
        return;
      }

      // Check access
      if (!hasAccess(newDomain)) {
        const err = new Error(`Access denied to domain: ${newDomain}`);
        setError(err.message);
        onDomainError?.(err);
        return;
      }

      // Check if already current
      if (newDomain === current) {
        return;
      }

      try {
        setIsSwitching(true);
        setError(null);

        // Update state
        setCurrent(newDomain);

        // Notify callback
        onDomainChange?.(newDomain);

        // Navigate if enabled
        if (navigateOnSwitch && pathname) {
          const newPath = replaceDomainInPath(pathname, newDomain);
          router.push(newPath);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Domain switch failed');
        setError(error.message);
        onDomainError?.(error);
      } finally {
        setIsSwitching(false);
      }
    },
    [current, pathname, hasAccess, navigateOnSwitch, router, onDomainChange, onDomainError]
  );

  const refreshConfig = useCallback(async (): Promise<void> => {
    // In a real implementation, this would fetch config from API
    // For now, just re-initialize from static config
    setError(null);
  }, []);

  const clearDomain = useCallback((): void => {
    if (enablePersistence && typeof window !== 'undefined') {
      localStorage.removeItem(DOMAIN_STORAGE_KEY);
    }
    setCurrent(DEFAULT_DOMAIN);
    setError(null);
    setUserProfile(null);
  }, [enablePersistence]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue = useMemo<DomainContextValue>(
    () => ({
      // State
      current,
      config,
      available,
      access: userProfile,
      isSwitching,
      error,
      isInitialized,
      // Actions
      switchDomain,
      hasAccess,
      getRoleInDomain,
      isFeatureEnabled,
      isModuleAvailable,
      refreshConfig,
      clearDomain,
    }),
    [
      current,
      config,
      available,
      userProfile,
      isSwitching,
      error,
      isInitialized,
      switchDomain,
      hasAccess,
      getRoleInDomain,
      isFeatureEnabled,
      isModuleAvailable,
      refreshConfig,
      clearDomain,
    ]
  );

  return (
    <DomainContext.Provider value={contextValue}>
      {children}
    </DomainContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useDomainContext(): DomainContextValue {
  const context = useContext(DomainContext);
  if (context === undefined) {
    throw new Error('useDomainContext must be used within a DomainProvider');
  }
  return context;
}

// ============================================================================
// Export alias for backwards compatibility
// ============================================================================

export { DomainContext };
