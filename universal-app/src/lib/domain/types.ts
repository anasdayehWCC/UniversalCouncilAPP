/**
 * Domain Types
 *
 * Type definitions for the service domain switching system.
 * Enables users to switch between different service areas (children, adults, housing, etc.)
 * without logging out.
 */

import type { LucideIcon } from 'lucide-react';

// ============================================================================
// Core Domain Types
// ============================================================================

/**
 * Service domain identifiers.
 * Each represents a distinct department or service area within the council.
 */
export type ServiceDomain =
  | 'children'
  | 'adults'
  | 'housing'
  | 'corporate'
  | 'education'
  | 'health';

/**
 * Domain status for progressive rollout
 */
export type DomainStatus = 
  | 'active'      // Fully operational
  | 'pilot'       // Limited pilot users
  | 'beta'        // Beta testing phase
  | 'coming_soon' // Announced but not available
  | 'disabled';   // Temporarily disabled

// ============================================================================
// Domain Configuration
// ============================================================================

/**
 * Visual branding for a domain
 */
export interface DomainBranding {
  /** Primary brand color (hex or OKLCH) */
  primary: string;
  /** Accent/secondary color */
  accent: string;
  /** Background gradient CSS value */
  gradient: string;
  /** Optional dark mode primary override */
  primaryDark?: string;
  /** Optional dark mode accent override */
  accentDark?: string;
  /** CSS class for domain-specific styling */
  className?: string;
}

/**
 * Domain-specific navigation configuration
 */
export interface DomainNavItem {
  /** Display label */
  label: string;
  /** Route path (relative to domain prefix) */
  href: string;
  /** Lucide icon name */
  icon: string;
  /** Is this a primary nav item */
  primary?: boolean;
  /** Badge content */
  badge?: string | number;
  /** Feature flag to control visibility */
  featureFlag?: string;
  /** Required permission */
  permission?: string;
  /** Child nav items */
  children?: DomainNavItem[];
}

/**
 * Domain feature configuration
 */
export interface DomainFeatures {
  /** Enabled module IDs */
  modules: string[];
  /** Available template IDs */
  templates: string[];
  /** Enabled feature flags */
  flags: Record<string, boolean>;
  /** Integrations available */
  integrations: string[];
}

/**
 * Domain permission set
 */
export interface DomainPermissions {
  /** Roles that can access this domain */
  allowedRoles: string[];
  /** Default role for new users in this domain */
  defaultRole: string;
  /** Can users switch to other domains from here */
  canSwitchFrom: boolean;
  /** Is cross-domain data access allowed */
  crossDomainAccess: boolean;
}

/**
 * Complete domain configuration
 */
export interface DomainConfig {
  /** Unique domain identifier */
  id: ServiceDomain;
  /** Display name */
  name: string;
  /** Short name for compact displays */
  shortName: string;
  /** Description of the service area */
  description: string;
  /** Authority/council label */
  authorityLabel: string;
  /** Persona label for UI display */
  personaLabel: string;
  /** Lucide icon name for the domain */
  icon: string;
  /** Current status */
  status: DomainStatus;
  /** Visual branding */
  branding: DomainBranding;
  /** Navigation configuration */
  navigation: DomainNavItem[];
  /** Feature configuration */
  features: DomainFeatures;
  /** Permission configuration */
  permissions: DomainPermissions;
  /** URL path prefix (e.g., '/children') */
  pathPrefix: string;
  /** Sort order for display */
  sortOrder: number;
  /** Custom settings */
  settings?: Record<string, unknown>;
}

// ============================================================================
// User Domain Access
// ============================================================================

/**
 * Domain access entry for a user
 */
export interface UserDomainAccess {
  /** Domain ID */
  domain: ServiceDomain;
  /** User's role in this domain */
  role: string;
  /** Is this the user's primary domain */
  isPrimary: boolean;
  /** When access was granted */
  grantedAt: string;
  /** When access expires (if applicable) */
  expiresAt?: string;
  /** Custom permissions for this user in this domain */
  customPermissions?: string[];
}

/**
 * User's complete domain access profile
 */
export interface UserDomainProfile {
  /** User ID */
  userId: string;
  /** All domains the user can access */
  domains: UserDomainAccess[];
  /** Currently active domain */
  activeDomain: ServiceDomain;
  /** User's preferred/default domain */
  preferredDomain?: ServiceDomain;
  /** Last domain switch timestamp */
  lastSwitchAt?: string;
}

// ============================================================================
// Domain Context State
// ============================================================================

/**
 * Domain context state
 */
export interface DomainState {
  /** Current active domain */
  current: ServiceDomain;
  /** Current domain configuration */
  config: DomainConfig;
  /** All available domain configurations */
  available: DomainConfig[];
  /** User's domain access profile */
  access: UserDomainProfile | null;
  /** Is domain switching in progress */
  isSwitching: boolean;
  /** Last error during domain operations */
  error: string | null;
}

/**
 * Domain context actions
 */
export interface DomainActions {
  /** Switch to a different domain */
  switchDomain: (domain: ServiceDomain) => Promise<void>;
  /** Check if user has access to a domain */
  hasAccess: (domain: ServiceDomain) => boolean;
  /** Get user's role in a specific domain */
  getRoleInDomain: (domain: ServiceDomain) => string | null;
  /** Check if a feature is enabled in current domain */
  isFeatureEnabled: (featureId: string) => boolean;
  /** Check if a module is available in current domain */
  isModuleAvailable: (moduleId: string) => boolean;
  /** Refresh domain configuration */
  refreshConfig: () => Promise<void>;
  /** Clear domain state */
  clearDomain: () => void;
}

/**
 * Complete domain context value
 */
export interface DomainContextValue extends DomainState, DomainActions {
  /** Is the domain system initialized */
  isInitialized: boolean;
}

// ============================================================================
// Domain Events
// ============================================================================

/**
 * Domain switch event payload
 */
export interface DomainSwitchEvent {
  /** Previous domain */
  from: ServiceDomain;
  /** New domain */
  to: ServiceDomain;
  /** User ID */
  userId: string;
  /** Timestamp */
  timestamp: string;
  /** Whether navigation occurred */
  navigated: boolean;
  /** URL path after switch */
  path: string;
}

/**
 * Domain error event payload
 */
export interface DomainErrorEvent {
  /** Error type */
  type: 'access_denied' | 'config_load_failed' | 'switch_failed' | 'validation_error';
  /** Error message */
  message: string;
  /** Domain involved */
  domain?: ServiceDomain;
  /** Original error */
  cause?: Error;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Domain configuration update payload
 */
export type DomainConfigUpdate = Partial<Omit<DomainConfig, 'id'>>;

/**
 * Props for domain-aware components
 */
export interface DomainAwareProps {
  /** Override the current domain */
  domain?: ServiceDomain;
  /** Filter to specific domains */
  allowedDomains?: ServiceDomain[];
  /** Callback when domain is invalid */
  onDomainMismatch?: (current: ServiceDomain, required: ServiceDomain[]) => void;
}

/**
 * Domain filter options
 */
export interface DomainFilterOptions {
  /** Only include active domains */
  activeOnly?: boolean;
  /** Include pilot domains */
  includePilot?: boolean;
  /** Include beta domains */
  includeBeta?: boolean;
  /** Filter by user access */
  userAccessible?: boolean;
}

/**
 * Result of domain access check
 */
export interface DomainAccessResult {
  /** Whether access is granted */
  granted: boolean;
  /** Reason if denied */
  reason?: 'no_access' | 'role_mismatch' | 'domain_disabled' | 'expired';
  /** User's role if access granted */
  role?: string;
  /** Required permissions if any */
  requiredPermissions?: string[];
}
