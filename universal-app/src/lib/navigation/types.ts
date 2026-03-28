/**
 * Navigation System Type Definitions
 * 
 * Defines types for the role-based navigation system that enables
 * dynamic menu rendering based on user role and permissions.
 */

import type { LucideIcon } from 'lucide-react';
import type { ServiceDomain, UserRole } from '@/config/domains';

/**
 * User roles available in the system
 * Re-exported for convenience
 */
export { type UserRole } from '@/config/domains';

/**
 * Permission types for fine-grained access control
 */
export type Permission =
  | 'view_transcriptions'
  | 'edit_transcriptions'
  | 'delete_transcriptions'
  | 'view_minutes'
  | 'edit_minutes'
  | 'approve_minutes'
  | 'view_insights'
  | 'export_insights'
  | 'manage_users'
  | 'manage_templates'
  | 'manage_modules'
  | 'view_audit_logs'
  | 'manage_settings'
  | 'bulk_operations';

/**
 * Individual navigation item
 */
export interface NavItem {
  /** Unique identifier for the nav item */
  id: string;
  /** Display label */
  label: string;
  /** Target URL */
  href: string;
  /** Icon component from lucide-react */
  icon?: LucideIcon;
  /** Description for tooltips */
  description?: string;
  /** Roles that can see this item. Empty array = all roles */
  roles: UserRole[];
  /** Permissions required to see this item. All must be present */
  permissions?: Permission[];
  /** Child navigation items */
  children?: NavItem[];
  /** Feature flag that controls visibility */
  featureFlag?: string;
  /** Badge text (e.g., "New", "Beta") */
  badge?: string;
  /** Badge variant for styling */
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  /** Whether this item opens in a new tab */
  external?: boolean;
  /** Order within section (lower = higher priority) */
  order?: number;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Reason for being disabled */
  disabledReason?: string;
}

/**
 * Navigation section containing grouped items
 */
export interface NavSection {
  /** Unique identifier for the section */
  id: string;
  /** Section title (displayed as header) */
  title: string;
  /** Navigation items in this section */
  items: NavItem[];
  /** Roles that can see this section. Empty array = all roles */
  showFor: UserRole[];
  /** Domains that can see this section. Empty array = all domains */
  domains?: ServiceDomain[];
  /** Whether section is collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Order in the navigation */
  order?: number;
  /** Section icon (optional header icon) */
  icon?: LucideIcon;
}

/**
 * Quick action button configuration
 */
export interface QuickAction {
  /** Unique identifier */
  id: string;
  /** Button label */
  label: string;
  /** Target URL or action */
  href?: string;
  /** Click handler (if not using href) */
  action?: () => void;
  /** Icon component */
  icon: LucideIcon;
  /** Roles that can see this action */
  roles: UserRole[];
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  /** Whether this is a primary CTA */
  isPrimary?: boolean;
  /** Keyboard shortcut */
  shortcut?: string;
}

/**
 * Footer navigation item (bottom of sidebar)
 */
export interface FooterItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Target URL */
  href: string;
  /** Icon component */
  icon?: LucideIcon;
  /** Roles that can see this item */
  roles: UserRole[];
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Target URL (optional for current page) */
  href?: string;
  /** Icon (optional) */
  icon?: LucideIcon;
}

/**
 * Complete navigation configuration
 */
export interface NavigationConfig {
  /** Main navigation sections */
  sections: NavSection[];
  /** Footer items (bottom of sidebar) */
  footerItems: FooterItem[];
  /** Quick actions for the header area */
  quickActions: QuickAction[];
  /** Domain-specific customizations */
  domainOverrides?: Partial<Record<ServiceDomain, Partial<NavigationConfig>>>;
}

/**
 * Navigation context state
 */
export interface NavigationState {
  /** Currently active navigation item ID */
  activeItemId: string | null;
  /** Expanded section IDs */
  expandedSections: Set<string>;
  /** Whether mobile nav is open */
  isMobileNavOpen: boolean;
  /** Current breadcrumbs */
  breadcrumbs: BreadcrumbItem[];
  /** Search query for nav filtering */
  searchQuery: string;
}

/**
 * Navigation context actions
 */
export interface NavigationActions {
  /** Set active item */
  setActiveItem: (id: string | null) => void;
  /** Toggle section expansion */
  toggleSection: (sectionId: string) => void;
  /** Expand a section */
  expandSection: (sectionId: string) => void;
  /** Collapse a section */
  collapseSection: (sectionId: string) => void;
  /** Toggle mobile nav */
  toggleMobileNav: () => void;
  /** Open mobile nav */
  openMobileNav: () => void;
  /** Close mobile nav */
  closeMobileNav: () => void;
  /** Set breadcrumbs */
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  /** Set search query */
  setSearchQuery: (query: string) => void;
}

/**
 * Complete navigation context value
 */
export interface NavigationContextValue extends NavigationState, NavigationActions {
  /** Filtered navigation config based on current user */
  filteredConfig: NavigationConfig;
  /** Whether navigation is loading */
  isLoading: boolean;
}

/**
 * User context for navigation filtering
 */
export interface NavigationUserContext {
  /** User's role */
  role: UserRole;
  /** User's domain */
  domain: ServiceDomain;
  /** User's permissions */
  permissions: Permission[];
  /** Feature flags */
  featureFlags: Partial<Record<string, boolean>>;
}
