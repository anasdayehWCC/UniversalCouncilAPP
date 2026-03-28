'use client';

import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';
import {
  filterNavigationForRole,
  findNavItemByHref,
  getSectionForItem,
  getDefaultExpandedSections,
  type NavigationConfig,
  type NavItem,
  type BreadcrumbItem,
  type NavigationContextValue,
} from '@/lib/navigation';

/**
 * Navigation Context
 */
const NavigationContext = createContext<NavigationContextValue | null>(null);

/**
 * NavigationProvider Component
 * 
 * Provides navigation context to the app including:
 * - Filtered navigation based on user role
 * - Active item tracking
 * - Section expansion state
 * - Mobile menu state
 * - Breadcrumb management
 */
export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, domain, featureFlags } = useDemo();
  const pathname = usePathname();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Navigation state
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set()
  );
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Get filtered navigation config
  const filteredConfig: NavigationConfig = useMemo(
    () => filterNavigationForRole(role, domain, featureFlags as unknown as Partial<Record<string, boolean>>),
    [role, domain, featureFlags]
  );

  // Initialize expanded sections based on role
  useEffect(() => {
    setExpandedSections(new Set(getDefaultExpandedSections(role)));
    setIsLoading(false);
  }, [role]);

  // Update active item based on pathname
  useEffect(() => {
    const item = findNavItemByHref(filteredConfig, pathname);
    setActiveItemId(item?.id ?? null);

    // Auto-expand section containing active item
    if (item) {
      const section = getSectionForItem(filteredConfig, item.id);
      if (section) {
        setExpandedSections((prev) => new Set(prev).add(section.id));
      }
    }
  }, [pathname, filteredConfig]);

  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  // Actions
  const setActiveItem = useCallback((id: string | null) => {
    setActiveItemId(id);
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const expandSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => new Set(prev).add(sectionId));
  }, []);

  const collapseSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
  }, []);

  const toggleMobileNav = useCallback(() => {
    setIsMobileNavOpen((prev) => !prev);
  }, []);

  const openMobileNav = useCallback(() => {
    setIsMobileNavOpen(true);
  }, []);

  const closeMobileNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  // Context value
  const value: NavigationContextValue = useMemo(
    () => ({
      // State
      activeItemId,
      expandedSections,
      isMobileNavOpen,
      breadcrumbs,
      searchQuery,
      
      // Config
      filteredConfig,
      isLoading,

      // Actions
      setActiveItem,
      toggleSection,
      expandSection,
      collapseSection,
      toggleMobileNav,
      openMobileNav,
      closeMobileNav,
      setBreadcrumbs,
      setSearchQuery,
    }),
    [
      activeItemId,
      expandedSections,
      isMobileNavOpen,
      breadcrumbs,
      searchQuery,
      filteredConfig,
      isLoading,
      setActiveItem,
      toggleSection,
      expandSection,
      collapseSection,
      toggleMobileNav,
      openMobileNav,
      closeMobileNav,
    ]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * useNavigationContext Hook
 * 
 * Access the navigation context from within the NavigationProvider.
 */
export function useNavigationContext(): NavigationContextValue {
  const context = useContext(NavigationContext);
  
  if (!context) {
    throw new Error(
      'useNavigationContext must be used within a NavigationProvider'
    );
  }
  
  return context;
}

/**
 * useFilteredNavigation Hook
 * 
 * Get the filtered navigation config from context.
 */
export function useFilteredNavigation(): NavigationConfig {
  const { filteredConfig } = useNavigationContext();
  return filteredConfig;
}

/**
 * useMobileNav Hook
 * 
 * Get mobile navigation state and actions.
 */
export function useMobileNav() {
  const {
    isMobileNavOpen,
    toggleMobileNav,
    openMobileNav,
    closeMobileNav,
  } = useNavigationContext();

  return {
    isOpen: isMobileNavOpen,
    toggle: toggleMobileNav,
    open: openMobileNav,
    close: closeMobileNav,
  };
}

/**
 * usePageBreadcrumbs Hook
 * 
 * Set breadcrumbs for the current page.
 * Cleans up on unmount.
 */
export function usePageBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
  const { setBreadcrumbs } = useNavigationContext();

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    return () => setBreadcrumbs([]);
  }, [breadcrumbs, setBreadcrumbs]);
}

/**
 * useNavExpansion Hook
 * 
 * Get and control section expansion state.
 */
export function useNavExpansion(sectionId: string) {
  const { expandedSections, toggleSection, expandSection, collapseSection } =
    useNavigationContext();

  const isExpanded = expandedSections.has(sectionId);

  return {
    isExpanded,
    toggle: () => toggleSection(sectionId),
    expand: () => expandSection(sectionId),
    collapse: () => collapseSection(sectionId),
  };
}

export default NavigationProvider;
