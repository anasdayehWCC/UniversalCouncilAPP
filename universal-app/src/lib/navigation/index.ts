/**
 * Navigation System Index
 * 
 * Main entry point for the navigation system.
 * Re-exports all public APIs.
 */

// Types
export type {
  NavItem,
  NavSection,
  NavigationConfig,
  QuickAction,
  FooterItem,
  BreadcrumbItem,
  Permission,
  NavigationState,
  NavigationActions,
  NavigationContextValue,
  NavigationUserContext,
} from './types';

// Configuration
export {
  navigationConfig,
  getDefaultExpandedSections,
  getHomeRoute,
} from './config';

// Filtering utilities
export {
  filterNavigationForRole,
  filterNavigationForContext,
  filterNavigationForPermissions,
  getQuickActions,
  getPrimaryQuickAction,
  getPermissionsForRole,
  searchNavigation,
  getFlatNavItems,
  findNavItemByHref,
  findNavItemById,
  getSectionForItem,
} from './filter';
