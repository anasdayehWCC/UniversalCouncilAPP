/**
 * Navigation Filtering Utilities
 * 
 * Functions to filter navigation items based on user role, permissions,
 * and feature flags.
 */

import type {
  NavigationConfig,
  NavSection,
  NavItem,
  QuickAction,
  FooterItem,
  Permission,
  NavigationUserContext,
} from './types';
import type { UserRole, ServiceDomain } from '@/config/domains';
import { navigationConfig } from './config';

/**
 * Check if a nav item is visible for the given context
 */
function isItemVisible(
  item: NavItem,
  context: NavigationUserContext
): boolean {
  // Check role access
  if (item.roles.length > 0 && !item.roles.includes(context.role)) {
    return false;
  }

  // Check permissions
  if (item.permissions && item.permissions.length > 0) {
    const hasAllPermissions = item.permissions.every((perm) =>
      context.permissions.includes(perm)
    );
    if (!hasAllPermissions) {
      return false;
    }
  }

  // Check feature flags
  if (item.featureFlag && !context.featureFlags[item.featureFlag]) {
    return false;
  }

  return true;
}

/**
 * Filter navigation items recursively
 */
function filterItems(
  items: NavItem[],
  context: NavigationUserContext
): NavItem[] {
  return items
    .filter((item) => isItemVisible(item, context))
    .map((item) => ({
      ...item,
      children: item.children
        ? filterItems(item.children, context)
        : undefined,
    }))
    .filter((item) => {
      // Remove items whose children are all filtered out
      if (item.children && item.children.length === 0) {
        return false;
      }
      return true;
    })
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

/**
 * Filter a section based on user context
 */
function filterSection(
  section: NavSection,
  context: NavigationUserContext
): NavSection | null {
  // Check if section is visible for this role
  if (section.showFor.length > 0 && !section.showFor.includes(context.role)) {
    return null;
  }

  // Check domain restrictions
  if (section.domains && section.domains.length > 0) {
    if (!section.domains.includes(context.domain)) {
      return null;
    }
  }

  // Filter items within section
  const filteredItems = filterItems(section.items, context);

  // Don't show empty sections
  if (filteredItems.length === 0) {
    return null;
  }

  return {
    ...section,
    items: filteredItems,
  };
}

/**
 * Filter quick actions based on user context
 */
function filterQuickActions(
  actions: QuickAction[],
  context: NavigationUserContext
): QuickAction[] {
  return actions.filter((action) => {
    if (action.roles.length > 0 && !action.roles.includes(context.role)) {
      return false;
    }
    return true;
  });
}

/**
 * Filter footer items based on user context
 */
function filterFooterItems(
  items: FooterItem[],
  context: NavigationUserContext
): FooterItem[] {
  return items.filter((item) => {
    if (item.roles.length > 0 && !item.roles.includes(context.role)) {
      return false;
    }
    return true;
  });
}

/**
 * Apply domain-specific overrides to navigation config
 */
function applyDomainOverrides(
  config: NavigationConfig,
  domain: ServiceDomain
): NavigationConfig {
  const overrides = config.domainOverrides?.[domain];
  if (!overrides) {
    return config;
  }

  return {
    sections: overrides.sections ?? config.sections,
    footerItems: overrides.footerItems ?? config.footerItems,
    quickActions: overrides.quickActions ?? config.quickActions,
    domainOverrides: config.domainOverrides,
  };
}

/**
 * Filter navigation configuration for a specific user role
 */
export function filterNavigationForRole(
  role: UserRole,
  domain: ServiceDomain,
  featureFlags: Record<string, boolean> = {}
): NavigationConfig {
  const context: NavigationUserContext = {
    role,
    domain,
    permissions: getPermissionsForRole(role),
    featureFlags,
  };

  return filterNavigationForContext(context);
}

/**
 * Filter navigation for a complete user context
 */
export function filterNavigationForContext(
  context: NavigationUserContext
): NavigationConfig {
  // Apply domain overrides first
  const configWithOverrides = applyDomainOverrides(
    navigationConfig,
    context.domain
  );

  // Filter sections
  const filteredSections = configWithOverrides.sections
    .map((section) => filterSection(section, context))
    .filter((section): section is NavSection => section !== null)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  // Filter quick actions
  const filteredQuickActions = filterQuickActions(
    configWithOverrides.quickActions,
    context
  );

  // Filter footer items
  const filteredFooterItems = filterFooterItems(
    configWithOverrides.footerItems,
    context
  );

  return {
    sections: filteredSections,
    footerItems: filteredFooterItems,
    quickActions: filteredQuickActions,
  };
}

/**
 * Filter navigation by specific permissions
 */
export function filterNavigationForPermissions(
  config: NavigationConfig,
  permissions: Permission[]
): NavigationConfig {
  const context: NavigationUserContext = {
    role: 'social_worker', // Default role, permissions take precedence
    domain: 'children',
    permissions,
    featureFlags: {},
  };

  const filteredSections = config.sections
    .map((section) => ({
      ...section,
      items: filterItems(section.items, context),
    }))
    .filter((section) => section.items.length > 0);

  return {
    ...config,
    sections: filteredSections,
  };
}

/**
 * Get role-specific quick actions
 */
export function getQuickActions(
  role: UserRole,
  domain: ServiceDomain,
  featureFlags: Record<string, boolean> = {}
): QuickAction[] {
  const context: NavigationUserContext = {
    role,
    domain,
    permissions: getPermissionsForRole(role),
    featureFlags,
  };

  const config = applyDomainOverrides(navigationConfig, domain);
  return filterQuickActions(config.quickActions, context);
}

/**
 * Get primary quick action for a role
 */
export function getPrimaryQuickAction(
  role: UserRole,
  domain: ServiceDomain
): QuickAction | null {
  const actions = getQuickActions(role, domain);
  return actions.find((action) => action.isPrimary) ?? actions[0] ?? null;
}

/**
 * Default permissions for each role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  const permissionsByRole: Record<UserRole, Permission[]> = {
    social_worker: [
      'view_transcriptions',
      'edit_transcriptions',
      'view_minutes',
      'edit_minutes',
    ],
    housing_officer: [
      'view_transcriptions',
      'edit_transcriptions',
      'view_minutes',
      'edit_minutes',
    ],
    manager: [
      'view_transcriptions',
      'edit_transcriptions',
      'view_minutes',
      'edit_minutes',
      'approve_minutes',
      'view_insights',
      'manage_users',
    ],
    admin: [
      'view_transcriptions',
      'edit_transcriptions',
      'delete_transcriptions',
      'view_minutes',
      'edit_minutes',
      'approve_minutes',
      'view_insights',
      'export_insights',
      'manage_users',
      'manage_templates',
      'manage_modules',
      'view_audit_logs',
      'manage_settings',
      'bulk_operations',
    ],
  };

  return permissionsByRole[role] ?? [];
}

/**
 * Search navigation items
 */
export function searchNavigation(
  config: NavigationConfig,
  query: string
): NavItem[] {
  if (!query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const results: NavItem[] = [];

  function searchItems(items: NavItem[]): void {
    for (const item of items) {
      const matchesLabel = item.label.toLowerCase().includes(normalizedQuery);
      const matchesDescription = item.description
        ?.toLowerCase()
        .includes(normalizedQuery);

      if (matchesLabel || matchesDescription) {
        results.push(item);
      }

      if (item.children) {
        searchItems(item.children);
      }
    }
  }

  for (const section of config.sections) {
    searchItems(section.items);
  }

  return results;
}

/**
 * Get flat list of all nav items
 */
export function getFlatNavItems(config: NavigationConfig): NavItem[] {
  const items: NavItem[] = [];

  function collectItems(navItems: NavItem[]): void {
    for (const item of navItems) {
      items.push(item);
      if (item.children) {
        collectItems(item.children);
      }
    }
  }

  for (const section of config.sections) {
    collectItems(section.items);
  }

  return items;
}

/**
 * Find a nav item by href
 */
export function findNavItemByHref(
  config: NavigationConfig,
  href: string
): NavItem | null {
  const items = getFlatNavItems(config);
  return items.find((item) => item.href === href) ?? null;
}

/**
 * Find a nav item by ID
 */
export function findNavItemById(
  config: NavigationConfig,
  id: string
): NavItem | null {
  const items = getFlatNavItems(config);
  return items.find((item) => item.id === id) ?? null;
}

/**
 * Get section containing a nav item
 */
export function getSectionForItem(
  config: NavigationConfig,
  itemId: string
): NavSection | null {
  for (const section of config.sections) {
    const hasItem = section.items.some(
      (item) =>
        item.id === itemId ||
        item.children?.some((child) => child.id === itemId)
    );
    if (hasItem) {
      return section;
    }
  }
  return null;
}
