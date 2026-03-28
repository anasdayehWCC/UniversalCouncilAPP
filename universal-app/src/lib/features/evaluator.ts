/**
 * Feature Flag Evaluator
 *
 * Evaluates feature flags against the current context to determine
 * if features should be enabled. Supports percentage rollouts,
 * A/B testing, and complex condition matching.
 */

import type {
  FeatureFlag,
  FeatureCondition,
  FeatureContext,
  FeatureEvaluationResult,
  FeatureOverride,
  PostHogFeatureFlag,
  ConditionType,
  TenantCondition,
  RoleCondition,
  DomainCondition,
  PercentageCondition,
  DateRangeCondition,
  UserListCondition,
  EnvironmentCondition,
  CustomCondition,
  FeatureVariant,
} from './types';

import { getFlag } from './flags';

// ============================================================================
// Hashing Utilities
// ============================================================================

/**
 * Generate a consistent hash for percentage rollout
 * Uses FNV-1a algorithm for fast, uniform distribution
 */
export function hashForPercentage(value: string, salt: string = ''): number {
  const str = `${salt}:${value}`;
  let hash = 2166136261; // FNV offset basis

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }

  // Convert to percentage (0-100)
  return Math.abs(hash % 100);
}

/**
 * Select a variant based on user ID hash
 */
export function selectVariant(
  variants: FeatureVariant[],
  userId: string,
  flagId: string
): FeatureVariant | undefined {
  if (!variants || variants.length === 0) return undefined;

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  const hash = hashForPercentage(userId, flagId);
  const scaled = (hash / 100) * totalWeight;

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (scaled < cumulative) {
      return variant;
    }
  }

  return variants[variants.length - 1];
}

// ============================================================================
// Condition Evaluators
// ============================================================================

/**
 * Evaluate a tenant condition
 */
function evaluateTenantCondition(condition: TenantCondition, context: FeatureContext): boolean {
  const { tenantId } = context;
  if (!tenantId) return false;

  const matches = condition.tenantIds.includes(tenantId);
  return condition.operator === 'in' ? matches : !matches;
}

/**
 * Evaluate a role condition
 */
function evaluateRoleCondition(condition: RoleCondition, context: FeatureContext): boolean {
  const { role } = context;
  if (!role) return false;

  const matches = condition.roles.includes(role);
  return condition.operator === 'in' ? matches : !matches;
}

/**
 * Evaluate a domain condition
 */
function evaluateDomainCondition(condition: DomainCondition, context: FeatureContext): boolean {
  const { domain } = context;
  if (!domain) return false;

  const matches = condition.domains.includes(domain);
  return condition.operator === 'in' ? matches : !matches;
}

/**
 * Evaluate a percentage rollout condition
 */
function evaluatePercentageCondition(
  condition: PercentageCondition,
  context: FeatureContext,
  flagId: string
): boolean {
  const hashValue = condition.hashProperty === 'userId'
    ? context.userId
    : condition.hashProperty === 'tenantId'
    ? context.tenantId
    : context.sessionId;

  if (!hashValue) return false;

  const salt = condition.salt || flagId;
  const hash = hashForPercentage(hashValue, salt);

  return hash < condition.percentage;
}

/**
 * Evaluate a date range condition
 */
function evaluateDateRangeCondition(condition: DateRangeCondition): boolean {
  const now = new Date();

  if (condition.startDate) {
    const start = new Date(condition.startDate);
    if (now < start) return false;
  }

  if (condition.endDate) {
    const end = new Date(condition.endDate);
    if (now > end) return false;
  }

  return true;
}

/**
 * Evaluate a user list condition
 */
function evaluateUserListCondition(condition: UserListCondition, context: FeatureContext): boolean {
  const { userId } = context;
  if (!userId) return false;

  const matches = condition.userIds.includes(userId);
  return condition.operator === 'in' ? matches : !matches;
}

/**
 * Evaluate an environment condition
 */
function evaluateEnvironmentCondition(
  condition: EnvironmentCondition,
  context: FeatureContext
): boolean {
  const env = context.environment || (process.env.NODE_ENV as 'development' | 'staging' | 'production');
  return condition.environments.includes(env);
}

/**
 * Evaluate a custom condition
 */
function evaluateCustomCondition(condition: CustomCondition, context: FeatureContext): boolean {
  const value = context.properties?.[condition.key];

  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'not_equals':
      return value !== condition.value;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(value);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(value);
    case 'matches':
      return typeof value === 'string' &&
        typeof condition.value === 'string' &&
        new RegExp(condition.value).test(value);
    case 'greater_than':
      return typeof value === 'number' &&
        typeof condition.value === 'number' &&
        value > condition.value;
    case 'less_than':
      return typeof value === 'number' &&
        typeof condition.value === 'number' &&
        value < condition.value;
    default:
      return false;
  }
}

/**
 * Evaluate a single condition
 */
export function evaluateCondition(
  condition: FeatureCondition,
  context: FeatureContext,
  flagId: string
): boolean {
  switch (condition.type) {
    case 'tenant':
      return evaluateTenantCondition(condition, context);
    case 'role':
      return evaluateRoleCondition(condition, context);
    case 'domain':
      return evaluateDomainCondition(condition, context);
    case 'percentage':
      return evaluatePercentageCondition(condition, context, flagId);
    case 'date_range':
      return evaluateDateRangeCondition(condition);
    case 'user_list':
      return evaluateUserListCondition(condition, context);
    case 'environment':
      return evaluateEnvironmentCondition(condition, context);
    case 'custom':
      return evaluateCustomCondition(condition, context);
    default:
      return false;
  }
}

/**
 * Evaluate all conditions for a flag
 */
export function evaluateConditions(
  conditions: FeatureCondition[],
  context: FeatureContext,
  flagId: string,
  logic: 'all' | 'any' = 'all'
): { passed: boolean; matchedConditions: ConditionType[] } {
  if (!conditions || conditions.length === 0) {
    return { passed: true, matchedConditions: [] };
  }

  const matchedConditions: ConditionType[] = [];
  const results: boolean[] = [];

  for (const condition of conditions) {
    const passed = evaluateCondition(condition, context, flagId);
    results.push(passed);
    if (passed) {
      matchedConditions.push(condition.type);
    }
  }

  const passed = logic === 'all'
    ? results.every(Boolean)
    : results.some(Boolean);

  return { passed, matchedConditions };
}

// ============================================================================
// Flag Evaluation
// ============================================================================

/**
 * Evaluate a feature flag against the current context
 */
export function evaluateFlag(
  flag: FeatureFlag,
  context: FeatureContext,
  options?: {
    override?: FeatureOverride;
    posthogFlag?: PostHogFeatureFlag;
  }
): FeatureEvaluationResult {
  const now = new Date().toISOString();

  // Check for override first
  if (options?.override) {
    const override = options.override;

    // Check expiration
    if (override.expiresAt && new Date(override.expiresAt) < new Date()) {
      // Override expired, continue with normal evaluation
    } else {
      return {
        flagId: flag.id,
        enabled: override.enabled,
        variant: override.variant,
        source: 'override',
        evaluatedAt: now,
      };
    }
  }

  // Check PostHog flag (if higher priority)
  if (options?.posthogFlag) {
    return {
      flagId: flag.id,
      enabled: options.posthogFlag.enabled,
      variant: options.posthogFlag.variantKey,
      payload: options.posthogFlag.payload,
      source: 'posthog',
      evaluatedAt: now,
    };
  }

  // Check dependencies
  if (flag.dependencies && flag.dependencies.length > 0) {
    for (const depId of flag.dependencies) {
      const depFlag = getFlag(depId);
      if (depFlag) {
        const depResult = evaluateFlag(depFlag, context);
        if (!depResult.enabled) {
          return {
            flagId: flag.id,
            enabled: false,
            source: 'condition',
            matchedConditions: [],
            evaluatedAt: now,
          };
        }
      }
    }
  }

  // Evaluate conditions
  if (flag.conditions && flag.conditions.length > 0) {
    const { passed, matchedConditions } = evaluateConditions(
      flag.conditions,
      context,
      flag.id,
      flag.conditionLogic
    );

    if (!passed) {
      return {
        flagId: flag.id,
        enabled: false,
        source: 'condition',
        matchedConditions: [],
        evaluatedAt: now,
      };
    }

    // Select variant if applicable
    let variant: string | undefined;
    let payload = flag.payload;

    if (flag.variants && flag.variants.length > 0 && context.userId) {
      const selectedVariant = selectVariant(flag.variants, context.userId, flag.id);
      if (selectedVariant) {
        variant = selectedVariant.key;
        payload = { ...payload, ...selectedVariant.payload };
      }
    }

    return {
      flagId: flag.id,
      enabled: true,
      variant: variant || flag.defaultVariant,
      payload,
      source: 'condition',
      matchedConditions,
      evaluatedAt: now,
    };
  }

  // Default to flag's default state
  let variant: string | undefined;
  let payload = flag.payload;

  if (flag.variants && flag.variants.length > 0 && context.userId) {
    const selectedVariant = selectVariant(flag.variants, context.userId, flag.id);
    if (selectedVariant) {
      variant = selectedVariant.key;
      payload = { ...payload, ...selectedVariant.payload };
    }
  }

  return {
    flagId: flag.id,
    enabled: flag.defaultEnabled,
    variant: variant || flag.defaultVariant,
    payload,
    source: 'default',
    evaluatedAt: now,
  };
}

/**
 * Evaluate a flag by ID
 */
export function evaluateFlagById(
  flagId: string,
  context: FeatureContext,
  options?: {
    override?: FeatureOverride;
    posthogFlag?: PostHogFeatureFlag;
  }
): FeatureEvaluationResult | null {
  const flag = getFlag(flagId);
  if (!flag) return null;
  return evaluateFlag(flag, context, options);
}

/**
 * Evaluate multiple flags at once
 */
export function evaluateFlags(
  flagIds: string[],
  context: FeatureContext,
  options?: {
    overrides?: Map<string, FeatureOverride>;
    posthogFlags?: Map<string, PostHogFeatureFlag>;
  }
): Map<string, FeatureEvaluationResult> {
  const results = new Map<string, FeatureEvaluationResult>();

  for (const flagId of flagIds) {
    const flag = getFlag(flagId);
    if (!flag) continue;

    const result = evaluateFlag(flag, context, {
      override: options?.overrides?.get(flagId),
      posthogFlag: options?.posthogFlags?.get(flagId),
    });

    results.set(flagId, result);
  }

  return results;
}

/**
 * Check if a flag is enabled (simple boolean check)
 */
export function isFeatureEnabled(
  flagId: string,
  context: FeatureContext,
  options?: {
    override?: FeatureOverride;
    posthogFlag?: PostHogFeatureFlag;
  }
): boolean {
  const result = evaluateFlagById(flagId, context, options);
  return result?.enabled ?? false;
}

/**
 * Get the variant for a flag
 */
export function getFeatureVariant(
  flagId: string,
  context: FeatureContext
): string | undefined {
  const result = evaluateFlagById(flagId, context);
  return result?.variant;
}

// ============================================================================
// Cache Key Generation
// ============================================================================

/**
 * Generate a cache key for a flag evaluation
 */
export function generateCacheKey(
  flagId: string,
  context: FeatureContext
): string {
  const contextKey = [
    context.tenantId || '',
    context.userId || '',
    context.role || '',
    context.domain || '',
    context.environment || '',
  ].join(':');

  return `${flagId}:${contextKey}`;
}

// ============================================================================
// Analytics Tracking
// ============================================================================

/**
 * Track feature flag evaluation for analytics
 */
export function trackFlagEvaluation(
  result: FeatureEvaluationResult,
  flag: FeatureFlag,
  trackFunction?: (eventName: string, properties: Record<string, unknown>) => void
): void {
  if (!flag.analytics?.trackEvaluation || !trackFunction) return;

  const eventName = flag.analytics.eventName || `feature_${flag.id}_evaluated`;

  trackFunction(eventName, {
    flagId: flag.id,
    enabled: result.enabled,
    variant: result.variant,
    source: result.source,
    ...flag.analytics.properties,
  });
}

/**
 * Track feature usage for analytics
 */
export function trackFeatureUsage(
  flag: FeatureFlag,
  trackFunction?: (eventName: string, properties: Record<string, unknown>) => void
): void {
  if (!flag.analytics?.trackUsage || !trackFunction) return;

  const eventName = flag.analytics.eventName
    ? `${flag.analytics.eventName}_used`
    : `feature_${flag.id}_used`;

  trackFunction(eventName, {
    flagId: flag.id,
    ...flag.analytics.properties,
  });
}
