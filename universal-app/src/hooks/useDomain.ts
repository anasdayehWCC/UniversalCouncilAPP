'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDomainContext } from '@/providers/DomainProvider';
import type {
  ServiceDomain,
  DomainConfig,
  DomainAccessResult,
} from '@/lib/domain/types';
import {
  getDomainConfig,
  getDomainByPath,
  buildDomainPath,
  replaceDomainInPath,
  DOMAIN_CONFIGS,
} from '@/lib/domain/config';

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for domain management and navigation
 *
 * @example
 * ```tsx
 * const { domain, config, switchTo, canAccess } = useDomain();
 *
 * // Check access
 * if (canAccess('adults')) {
 *   // Show option
 * }
 *
 * // Switch domain
 * await switchTo('housing');
 *
 * // Build domain-aware link
 * const href = buildLink('/dashboard'); // /children/dashboard
 * ```
 */
export function useDomain() {
  const context = useDomainContext();
  const pathname = usePathname();
  const router = useRouter();

  // Current domain and config
  const domain = context.current;
  const config = context.config;

  // Quick access helpers
  const isChildren = domain === 'children';
  const isAdults = domain === 'adults';
  const isHousing = domain === 'housing';
  const isCorporate = domain === 'corporate';
  const isEducation = domain === 'education';
  const isHealth = domain === 'health';

  /**
   * Switch to a different domain
   */
  const switchTo = useCallback(
    async (newDomain: ServiceDomain) => {
      await context.switchDomain(newDomain);
    },
    [context]
  );

  /**
   * Check if user can access a domain
   */
  const canAccess = useCallback(
    (domainId: ServiceDomain): boolean => {
      return context.hasAccess(domainId);
    },
    [context]
  );

  /**
   * Get detailed access result for a domain
   */
  const checkAccess = useCallback(
    (domainId: ServiceDomain): DomainAccessResult => {
      const config = DOMAIN_CONFIGS[domainId];

      if (!config) {
        return { granted: false, reason: 'domain_disabled' };
      }

      if (config.status === 'disabled' || config.status === 'coming_soon') {
        return { granted: false, reason: 'domain_disabled' };
      }

      const hasAccess = context.hasAccess(domainId);
      if (!hasAccess) {
        return { granted: false, reason: 'no_access' };
      }

      const role = context.getRoleInDomain(domainId);
      return { granted: true, role: role ?? undefined };
    },
    [context]
  );

  /**
   * Build a domain-prefixed path
   */
  const buildLink = useCallback(
    (relativePath: string, targetDomain?: ServiceDomain): string => {
      const domainId = targetDomain ?? domain;
      return buildDomainPath(domainId, relativePath);
    },
    [domain]
  );

  /**
   * Navigate within the current domain
   */
  const navigate = useCallback(
    (relativePath: string) => {
      const fullPath = buildDomainPath(domain, relativePath);
      router.push(fullPath);
    },
    [domain, router]
  );

  /**
   * Navigate to the same path in a different domain
   */
  const navigateToDomain = useCallback(
    (targetDomain: ServiceDomain) => {
      if (!pathname) return;
      const newPath = replaceDomainInPath(pathname, targetDomain);
      router.push(newPath);
    },
    [pathname, router]
  );

  /**
   * Get all domains the user can switch to
   */
  const switchableDomains = useMemo(() => {
    return context.available.filter(
      (d) => d.id !== domain && d.permissions.canSwitchFrom
    );
  }, [context.available, domain]);

  /**
   * Check if a feature is enabled in the current domain
   */
  const hasFeature = useCallback(
    (featureId: string): boolean => {
      return context.isFeatureEnabled(featureId);
    },
    [context]
  );

  /**
   * Check if a module is available in the current domain
   */
  const hasModule = useCallback(
    (moduleId: string): boolean => {
      return context.isModuleAvailable(moduleId);
    },
    [context]
  );

  /**
   * Get the user's role in the current domain
   */
  const currentRole = useMemo(() => {
    return context.getRoleInDomain(domain);
  }, [context, domain]);

  /**
   * Get domain-specific branding colors
   */
  const branding = useMemo(() => config.branding, [config]);

  /**
   * Get domain-specific navigation items
   */
  const navigation = useMemo(() => config.navigation, [config]);

  return {
    // Current state
    domain,
    config,
    branding,
    navigation,
    currentRole,

    // Domain switching
    switchTo,
    switchableDomains,
    isSwitching: context.isSwitching,
    navigateToDomain,

    // Access checks
    canAccess,
    checkAccess,

    // Feature/module checks
    hasFeature,
    hasModule,

    // Navigation helpers
    buildLink,
    navigate,

    // Quick domain checks
    isChildren,
    isAdults,
    isHousing,
    isCorporate,
    isEducation,
    isHealth,

    // All available domains
    availableDomains: context.available,

    // Error state
    error: context.error,

    // Initialization state
    isInitialized: context.isInitialized,

    // Raw context for advanced use
    _context: context,
  };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for domain-aware routing
 */
export function useDomainRouter() {
  const { domain, buildLink, navigate, navigateToDomain } = useDomain();
  const router = useRouter();

  return {
    /** Current domain */
    domain,

    /** Build a domain-prefixed link */
    href: buildLink,

    /** Push to a path within current domain */
    push: navigate,

    /** Replace with a path within current domain */
    replace: useCallback(
      (path: string) => {
        router.replace(buildLink(path));
      },
      [router, buildLink]
    ),

    /** Navigate to a different domain */
    switchTo: navigateToDomain,
  };
}

/**
 * Hook for domain feature flags
 */
export function useDomainFeatures() {
  const { config, hasFeature, hasModule } = useDomain();

  return {
    /** All feature flags for current domain */
    flags: config.features.flags,

    /** All modules for current domain */
    modules: config.features.modules,

    /** All templates for current domain */
    templates: config.features.templates,

    /** All integrations for current domain */
    integrations: config.features.integrations,

    /** Check if feature is enabled */
    isEnabled: hasFeature,

    /** Check if module is available */
    hasModule,

    /** Check if integration is available */
    hasIntegration: useCallback(
      (integrationId: string) => config.features.integrations.includes(integrationId),
      [config]
    ),

    /** Check if template is available */
    hasTemplate: useCallback(
      (templateId: string) => config.features.templates.includes(templateId),
      [config]
    ),
  };
}

/**
 * Hook for domain branding/theming
 */
export function useDomainBranding() {
  const { config } = useDomain();

  return {
    /** Domain icon name */
    icon: config.icon,

    /** Domain display name */
    name: config.name,

    /** Domain short name */
    shortName: config.shortName,

    /** Domain description */
    description: config.description,

    /** Authority label */
    authorityLabel: config.authorityLabel,

    /** Persona label */
    personaLabel: config.personaLabel,

    /** Primary color */
    primary: config.branding.primary,

    /** Accent color */
    accent: config.branding.accent,

    /** Gradient */
    gradient: config.branding.gradient,

    /** CSS class */
    className: config.branding.className,

    /** Full branding config */
    branding: config.branding,
  };
}

// Default export
export default useDomain;
