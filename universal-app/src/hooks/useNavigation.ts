'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useDemo } from '@/context/DemoContext';
import {
  filterNavigationForRole,
  findNavItemByHref,
  getSectionForItem,
  searchNavigation,
  getQuickActions,
  getDefaultExpandedSections,
  type NavigationConfig,
  type NavItem,
  type BreadcrumbItem,
  type QuickAction,
} from '@/lib/navigation';

/**
 * useNavigation Hook
 * 
 * Provides filtered navigation based on current user role and domain.
 * Tracks active items, mobile menu state, and breadcrumbs.
 */
export function useNavigation() {
  const { role, domain, featureFlags, config, currentUser } = useDemo();
  const pathname = usePathname();

  // State
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(getDefaultExpandedSections(role))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Get filtered navigation config
  const filteredConfig: NavigationConfig = useMemo(
    () => filterNavigationForRole(role, domain, featureFlags as unknown as Record<string, boolean>),
    [role, domain, featureFlags]
  );

  // Find active item
  const activeItem: NavItem | null = useMemo(
    () => findNavItemByHref(filteredConfig, pathname),
    [filteredConfig, pathname]
  );

  // Get quick actions for current role
  const quickActions: QuickAction[] = useMemo(
    () => getQuickActions(role, domain, featureFlags as unknown as Record<string, boolean>),
    [role, domain, featureFlags]
  );

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }
    return searchNavigation(filteredConfig, searchQuery);
  }, [filteredConfig, searchQuery]);

  // Auto-expand section containing active item
  useEffect(() => {
    if (activeItem) {
      const section = getSectionForItem(filteredConfig, activeItem.id);
      if (section) {
        setExpandedSections((prev) => {
          const next = new Set(prev);
          next.add(section.id);
          return next;
        });
      }
    }
  }, [activeItem, filteredConfig]);

  // Reset expanded sections when role changes
  useEffect(() => {
    setExpandedSections(new Set(getDefaultExpandedSections(role)));
  }, [role]);

  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  // Actions
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

  return {
    // Config
    filteredConfig,
    domainConfig: config,
    
    // State
    activeItem,
    activeItemId: activeItem?.id ?? null,
    expandedSections,
    isMobileNavOpen,
    breadcrumbs,
    searchQuery,
    searchResults,
    quickActions,
    
    // User context
    role,
    domain,
    user: currentUser,
    
    // Actions
    toggleSection,
    expandSection,
    collapseSection,
    toggleMobileNav,
    openMobileNav,
    closeMobileNav,
    setBreadcrumbs,
    setSearchQuery,
  };
}

/**
 * useBreadcrumbs Hook
 * 
 * Manages breadcrumb state for the current page.
 * Call setBreadcrumbs in useEffect in page components.
 */
export function useBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
  const { setBreadcrumbs } = useNavigation();

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    return () => setBreadcrumbs([]);
  }, [breadcrumbs, setBreadcrumbs]);
}

/**
 * useActiveNavSection Hook
 * 
 * Returns the currently active navigation section.
 */
export function useActiveNavSection() {
  const { filteredConfig, activeItem } = useNavigation();
  
  return useMemo(() => {
    if (!activeItem) {
      return null;
    }
    return getSectionForItem(filteredConfig, activeItem.id);
  }, [filteredConfig, activeItem]);
}

export default useNavigation;
