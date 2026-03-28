/**
 * Feature Flag System - Type Definitions
 *
 * Comprehensive type definitions for runtime feature toggling,
 * A/B testing, percentage rollouts, and tenant-specific flags.
 */

import type { TenantId, ServiceDomainId, RoleId } from '@/lib/tenant/types';

// ============================================================================
// Core Feature Flag Types
// ============================================================================

/**
 * Unique identifier for a feature flag
 */
export type FeatureFlagId = string;

/**
 * Feature flag lifecycle status
 */
export type FeatureFlagStatus = 'development' | 'beta' | 'released' | 'deprecated';

/**
 * Types of conditions that can enable/disable a flag
 */
export type ConditionType =
  | 'tenant'
  | 'role'
  | 'domain'
  | 'percentage'
  | 'date_range'
  | 'user_list'
  | 'environment'
  | 'custom';

/**
 * Operators for condition matching
 */
export type ConditionOperator = 'equals' | 'not_equals' | 'in' | 'not_in' | 'matches' | 'greater_than' | 'less_than';

// ============================================================================
// Feature Conditions
// ============================================================================

/**
 * Base condition interface
 */
export interface BaseCondition {
  /** Condition type */
  type: ConditionType;
  /** Whether condition must match (AND) or can match (OR) */
  required?: boolean;
  /** Human-readable description */
  description?: string;
}

/**
 * Tenant-based condition
 */
export interface TenantCondition extends BaseCondition {
  type: 'tenant';
  /** List of tenant IDs where flag is enabled */
  tenantIds: TenantId[];
  /** Operator for matching */
  operator: 'in' | 'not_in';
}

/**
 * Role-based condition
 */
export interface RoleCondition extends BaseCondition {
  type: 'role';
  /** List of roles where flag is enabled */
  roles: RoleId[];
  /** Operator for matching */
  operator: 'in' | 'not_in';
}

/**
 * Service domain condition
 */
export interface DomainCondition extends BaseCondition {
  type: 'domain';
  /** Domains where flag is enabled */
  domains: ServiceDomainId[];
  /** Operator for matching */
  operator: 'in' | 'not_in';
}

/**
 * Percentage rollout condition
 */
export interface PercentageCondition extends BaseCondition {
  type: 'percentage';
  /** Percentage of users (0-100) */
  percentage: number;
  /** Property to hash for consistent rollout */
  hashProperty: 'userId' | 'tenantId' | 'sessionId';
  /** Salt for hashing to avoid correlation across flags */
  salt?: string;
}

/**
 * Date range condition
 */
export interface DateRangeCondition extends BaseCondition {
  type: 'date_range';
  /** Start date (ISO string) */
  startDate?: string;
  /** End date (ISO string) */
  endDate?: string;
  /** Timezone for date comparison */
  timezone?: string;
}

/**
 * User list condition
 */
export interface UserListCondition extends BaseCondition {
  type: 'user_list';
  /** List of user IDs */
  userIds: string[];
  /** Operator for matching */
  operator: 'in' | 'not_in';
}

/**
 * Environment condition
 */
export interface EnvironmentCondition extends BaseCondition {
  type: 'environment';
  /** Allowed environments */
  environments: Array<'development' | 'staging' | 'production'>;
}

/**
 * Custom condition with arbitrary logic
 */
export interface CustomCondition extends BaseCondition {
  type: 'custom';
  /** Key for custom condition evaluation */
  key: string;
  /** Expected value */
  value: unknown;
  /** Operator for matching */
  operator: ConditionOperator;
}

/**
 * Union of all condition types
 */
export type FeatureCondition =
  | TenantCondition
  | RoleCondition
  | DomainCondition
  | PercentageCondition
  | DateRangeCondition
  | UserListCondition
  | EnvironmentCondition
  | CustomCondition;

// ============================================================================
// Feature Flag Definition
// ============================================================================

/**
 * Feature variant for A/B testing
 */
export interface FeatureVariant {
  /** Variant key */
  key: string;
  /** Display name */
  name: string;
  /** Weight for random selection (0-100) */
  weight: number;
  /** Variant-specific payload */
  payload?: Record<string, unknown>;
}

/**
 * Feature flag analytics configuration
 */
export interface FeatureAnalytics {
  /** Track when flag is evaluated */
  trackEvaluation?: boolean;
  /** Track when feature is used */
  trackUsage?: boolean;
  /** Custom event name for analytics */
  eventName?: string;
  /** Properties to include in analytics */
  properties?: Record<string, unknown>;
}

/**
 * Complete feature flag definition
 */
export interface FeatureFlag {
  /** Unique identifier */
  id: FeatureFlagId;
  /** Human-readable name */
  name: string;
  /** Description of the feature */
  description?: string;
  /** Whether flag is enabled by default */
  defaultEnabled: boolean;
  /** Current status */
  status: FeatureFlagStatus;
  /** Conditions for enabling the flag */
  conditions?: FeatureCondition[];
  /** How to combine conditions: 'all' (AND) or 'any' (OR) */
  conditionLogic?: 'all' | 'any';
  /** A/B test variants */
  variants?: FeatureVariant[];
  /** Default variant if variants exist */
  defaultVariant?: string;
  /** Analytics configuration */
  analytics?: FeatureAnalytics;
  /** Optional payload data */
  payload?: Record<string, unknown>;
  /** Related feature flags */
  dependencies?: FeatureFlagId[];
  /** Tags for organization */
  tags?: string[];
  /** Owner team/person */
  owner?: string;
  /** Creation timestamp */
  createdAt?: string;
  /** Last modified timestamp */
  updatedAt?: string;
}

// ============================================================================
// Feature Context
// ============================================================================

/**
 * Context used for evaluating feature flags
 */
export interface FeatureContext {
  /** Current tenant ID */
  tenantId?: TenantId;
  /** Current user ID */
  userId?: string;
  /** Current user role */
  role?: RoleId;
  /** Current service domain */
  domain?: ServiceDomainId;
  /** Current session ID */
  sessionId?: string;
  /** Current environment */
  environment?: 'development' | 'staging' | 'production';
  /** Additional custom properties */
  properties?: Record<string, unknown>;
}

// ============================================================================
// Feature Bundle
// ============================================================================

/**
 * Collection of related feature flags
 */
export interface FeatureBundle {
  /** Bundle identifier */
  id: string;
  /** Bundle display name */
  name: string;
  /** Bundle description */
  description?: string;
  /** Feature flags in this bundle */
  flags: FeatureFlagId[];
  /** Whether flags should be evaluated together */
  atomic?: boolean;
  /** Tags for organization */
  tags?: string[];
}

// ============================================================================
// Feature Evaluation Result
// ============================================================================

/**
 * Result of evaluating a feature flag
 */
export interface FeatureEvaluationResult {
  /** Flag ID */
  flagId: FeatureFlagId;
  /** Whether feature is enabled */
  enabled: boolean;
  /** Selected variant (if A/B testing) */
  variant?: string;
  /** Variant payload data */
  payload?: Record<string, unknown>;
  /** Source of the decision */
  source: 'default' | 'condition' | 'override' | 'posthog' | 'cache';
  /** Matched conditions (for debugging) */
  matchedConditions?: ConditionType[];
  /** Evaluation timestamp */
  evaluatedAt: string;
}

// ============================================================================
// Feature Override
// ============================================================================

/**
 * Local override for a feature flag
 */
export interface FeatureOverride {
  /** Flag ID to override */
  flagId: FeatureFlagId;
  /** Override enabled state */
  enabled: boolean;
  /** Optional variant override */
  variant?: string;
  /** Expiration timestamp */
  expiresAt?: string;
  /** Reason for override */
  reason?: string;
  /** Who created the override */
  createdBy?: string;
}

// ============================================================================
// PostHog Integration
// ============================================================================

/**
 * PostHog feature flag sync configuration
 */
export interface PostHogSyncConfig {
  /** Whether to sync from PostHog */
  enabled: boolean;
  /** Polling interval in milliseconds */
  pollingInterval?: number;
  /** Flags to sync (empty = all) */
  flagIds?: FeatureFlagId[];
  /** Priority: 'posthog' = PostHog wins, 'local' = local config wins */
  conflictResolution?: 'posthog' | 'local';
}

/**
 * PostHog feature flag data
 */
export interface PostHogFeatureFlag {
  /** Flag key in PostHog */
  key: string;
  /** Whether flag is enabled */
  enabled: boolean;
  /** Variant key if multivariate */
  variantKey?: string;
  /** Payload from PostHog */
  payload?: Record<string, unknown>;
}

// ============================================================================
// Feature Flag Store
// ============================================================================

/**
 * Feature flag store state
 */
export interface FeatureFlagState {
  /** All defined flags */
  flags: Map<FeatureFlagId, FeatureFlag>;
  /** Local overrides */
  overrides: Map<FeatureFlagId, FeatureOverride>;
  /** PostHog synced flags */
  posthogFlags: Map<FeatureFlagId, PostHogFeatureFlag>;
  /** Evaluation cache */
  cache: Map<string, FeatureEvaluationResult>;
  /** Current evaluation context */
  context: FeatureContext;
  /** Last sync timestamp */
  lastSyncedAt?: string;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error?: string;
}

// ============================================================================
// Feature Flag Admin
// ============================================================================

/**
 * Feature flag admin actions
 */
export interface FeatureFlagAdminActions {
  /** Create a new override */
  createOverride: (override: FeatureOverride) => void;
  /** Remove an override */
  removeOverride: (flagId: FeatureFlagId) => void;
  /** Clear all overrides */
  clearOverrides: () => void;
  /** Force sync with PostHog */
  syncPostHog: () => Promise<void>;
  /** Update context */
  updateContext: (context: Partial<FeatureContext>) => void;
  /** Clear evaluation cache */
  clearCache: () => void;
}
