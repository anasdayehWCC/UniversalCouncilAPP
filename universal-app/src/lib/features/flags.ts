/**
 * Feature Flag Definitions
 *
 * Central registry of all feature flags for the Universal Council App.
 * Flags are organized by category and include sensible defaults.
 */

import type { FeatureFlag, FeatureBundle, FeatureFlagId } from './types';

// ============================================================================
// Feature Flag IDs (Type-Safe Constants)
// ============================================================================

export const FLAG_IDS = {
  // Core Features
  SMART_CAPTURE_V2: 'smart_capture_v2',
  AI_INSIGHTS: 'ai_insights',
  BULK_UPLOAD: 'bulk_upload',
  OFFLINE_MODE: 'offline_mode',

  // Integrations
  MICROSOFT_365_INTEGRATION: 'microsoft_365_integration',
  MOSAIC_SYNC: 'mosaic_sync',
  LIQUID_LOGIC_SYNC: 'liquid_logic_sync',
  TEAMS_INTEGRATION: 'teams_integration',

  // Notifications
  PUSH_NOTIFICATIONS: 'push_notifications',
  EMAIL_NOTIFICATIONS: 'email_notifications',
  IN_APP_NOTIFICATIONS: 'in_app_notifications',

  // AI Features
  AI_QUALITY_SCORING: 'ai_quality_scoring',
  AI_RISK_DETECTION: 'ai_risk_detection',
  AI_SUGGESTED_TEMPLATES: 'ai_suggested_templates',
  AI_AUTO_SUMMARIZE: 'ai_auto_summarize',
  AI_SENTIMENT_ANALYSIS: 'ai_sentiment_analysis',

  // Workflow
  REVIEW_WORKFLOW_V2: 'review_workflow_v2',
  BATCH_APPROVAL: 'batch_approval',
  DELEGATION: 'delegation',
  ESCALATION_RULES: 'escalation_rules',

  // Export & Reporting
  ADVANCED_EXPORT: 'advanced_export',
  CUSTOM_REPORTS: 'custom_reports',
  ANALYTICS_DASHBOARD: 'analytics_dashboard',
  DATA_EXPORT_API: 'data_export_api',

  // Admin Features
  AUDIT_LOG_ADVANCED: 'audit_log_advanced',
  TENANT_BRANDING: 'tenant_branding',
  CUSTOM_ROLES: 'custom_roles',
  SSO_CONFIGURATION: 'sso_configuration',

  // Experimental
  VOICE_COMMANDS: 'voice_commands',
  REAL_TIME_COLLAB: 'real_time_collab',
  MOBILE_NATIVE: 'mobile_native',
  DARK_MODE: 'dark_mode',
} as const;

export type KnownFlagId = (typeof FLAG_IDS)[keyof typeof FLAG_IDS];

// ============================================================================
// Feature Flag Definitions
// ============================================================================

/**
 * All feature flags in the system
 */
export const FEATURE_FLAGS: Record<KnownFlagId, FeatureFlag> = {
  // ---------------------------------------------------------------------------
  // Core Features
  // ---------------------------------------------------------------------------
  [FLAG_IDS.SMART_CAPTURE_V2]: {
    id: FLAG_IDS.SMART_CAPTURE_V2,
    name: 'Smart Capture V2',
    description: 'Enhanced audio capture with background noise reduction and speaker diarization',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'percentage',
        percentage: 25,
        hashProperty: 'userId',
        salt: 'smart_capture_v2_rollout',
      },
    ],
    analytics: {
      trackEvaluation: true,
      trackUsage: true,
      eventName: 'feature_smart_capture_v2',
    },
    tags: ['core', 'audio', 'ai'],
    owner: 'platform-team',
  },

  [FLAG_IDS.AI_INSIGHTS]: {
    id: FLAG_IDS.AI_INSIGHTS,
    name: 'AI Insights',
    description: 'AI-powered insights and recommendations from meeting transcripts',
    defaultEnabled: true,
    status: 'released',
    conditions: [
      {
        type: 'domain',
        domains: ['children', 'adults'],
        operator: 'in',
      },
    ],
    analytics: {
      trackUsage: true,
      eventName: 'feature_ai_insights',
    },
    tags: ['ai', 'insights'],
    owner: 'ai-team',
  },

  [FLAG_IDS.BULK_UPLOAD]: {
    id: FLAG_IDS.BULK_UPLOAD,
    name: 'Bulk Upload',
    description: 'Upload multiple audio files at once for batch processing',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'role',
        roles: ['admin', 'manager', 'senior_manager'],
        operator: 'in',
      },
    ],
    tags: ['productivity', 'bulk'],
    owner: 'platform-team',
  },

  [FLAG_IDS.OFFLINE_MODE]: {
    id: FLAG_IDS.OFFLINE_MODE,
    name: 'Offline Mode',
    description: 'Full offline support with sync when back online',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'tenant',
        tenantIds: ['wcc', 'rbkc'],
        operator: 'in',
      },
    ],
    analytics: {
      trackUsage: true,
      eventName: 'feature_offline_mode',
    },
    tags: ['pwa', 'offline'],
    owner: 'mobile-team',
  },

  // ---------------------------------------------------------------------------
  // Integrations
  // ---------------------------------------------------------------------------
  [FLAG_IDS.MICROSOFT_365_INTEGRATION]: {
    id: FLAG_IDS.MICROSOFT_365_INTEGRATION,
    name: 'Microsoft 365 Integration',
    description: 'Deep integration with Microsoft 365 for calendar, Teams, and SharePoint',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'tenant',
        tenantIds: ['wcc'],
        operator: 'in',
      },
    ],
    dependencies: [FLAG_IDS.TEAMS_INTEGRATION],
    tags: ['integration', 'microsoft'],
    owner: 'integrations-team',
  },

  [FLAG_IDS.MOSAIC_SYNC]: {
    id: FLAG_IDS.MOSAIC_SYNC,
    name: 'Mosaic Sync',
    description: 'Bidirectional sync with Mosaic case management system',
    defaultEnabled: false,
    status: 'released',
    conditions: [
      {
        type: 'tenant',
        tenantIds: ['wcc'],
        operator: 'in',
      },
      {
        type: 'domain',
        domains: ['children'],
        operator: 'in',
      },
    ],
    conditionLogic: 'all',
    tags: ['integration', 'mosaic'],
    owner: 'integrations-team',
  },

  [FLAG_IDS.LIQUID_LOGIC_SYNC]: {
    id: FLAG_IDS.LIQUID_LOGIC_SYNC,
    name: 'Liquid Logic Sync',
    description: 'Bidirectional sync with Liquid Logic case management system',
    defaultEnabled: false,
    status: 'development',
    conditions: [
      {
        type: 'tenant',
        tenantIds: ['rbkc'],
        operator: 'in',
      },
    ],
    tags: ['integration', 'liquid-logic'],
    owner: 'integrations-team',
  },

  [FLAG_IDS.TEAMS_INTEGRATION]: {
    id: FLAG_IDS.TEAMS_INTEGRATION,
    name: 'Teams Integration',
    description: 'Microsoft Teams meeting integration for direct capture',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'environment',
        environments: ['production', 'staging'],
      },
    ],
    tags: ['integration', 'teams'],
    owner: 'integrations-team',
  },

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------
  [FLAG_IDS.PUSH_NOTIFICATIONS]: {
    id: FLAG_IDS.PUSH_NOTIFICATIONS,
    name: 'Push Notifications',
    description: 'Browser and mobile push notifications for real-time updates',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'percentage',
        percentage: 50,
        hashProperty: 'userId',
        salt: 'push_notifications_rollout',
      },
    ],
    analytics: {
      trackUsage: true,
    },
    tags: ['notifications', 'pwa'],
    owner: 'mobile-team',
  },

  [FLAG_IDS.EMAIL_NOTIFICATIONS]: {
    id: FLAG_IDS.EMAIL_NOTIFICATIONS,
    name: 'Email Notifications',
    description: 'Email notifications for workflow updates and reminders',
    defaultEnabled: true,
    status: 'released',
    tags: ['notifications', 'email'],
    owner: 'platform-team',
  },

  [FLAG_IDS.IN_APP_NOTIFICATIONS]: {
    id: FLAG_IDS.IN_APP_NOTIFICATIONS,
    name: 'In-App Notifications',
    description: 'Real-time in-app notification center',
    defaultEnabled: true,
    status: 'released',
    tags: ['notifications'],
    owner: 'platform-team',
  },

  // ---------------------------------------------------------------------------
  // AI Features
  // ---------------------------------------------------------------------------
  [FLAG_IDS.AI_QUALITY_SCORING]: {
    id: FLAG_IDS.AI_QUALITY_SCORING,
    name: 'AI Quality Scoring',
    description: 'AI-powered quality scoring of meeting minutes',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'role',
        roles: ['manager', 'senior_manager', 'quality_assurance'],
        operator: 'in',
      },
    ],
    analytics: {
      trackUsage: true,
      eventName: 'feature_ai_quality_scoring',
    },
    tags: ['ai', 'quality'],
    owner: 'ai-team',
  },

  [FLAG_IDS.AI_RISK_DETECTION]: {
    id: FLAG_IDS.AI_RISK_DETECTION,
    name: 'AI Risk Detection',
    description: 'Automatic detection of safeguarding risks and concerns',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'domain',
        domains: ['children', 'adults'],
        operator: 'in',
      },
    ],
    analytics: {
      trackUsage: true,
      eventName: 'feature_ai_risk_detection',
    },
    tags: ['ai', 'safeguarding'],
    owner: 'ai-team',
  },

  [FLAG_IDS.AI_SUGGESTED_TEMPLATES]: {
    id: FLAG_IDS.AI_SUGGESTED_TEMPLATES,
    name: 'AI Suggested Templates',
    description: 'AI recommends the best template based on meeting content',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'percentage',
        percentage: 30,
        hashProperty: 'userId',
        salt: 'ai_suggested_templates',
      },
    ],
    tags: ['ai', 'templates'],
    owner: 'ai-team',
  },

  [FLAG_IDS.AI_AUTO_SUMMARIZE]: {
    id: FLAG_IDS.AI_AUTO_SUMMARIZE,
    name: 'AI Auto-Summarize',
    description: 'Automatic generation of meeting summaries and key points',
    defaultEnabled: true,
    status: 'released',
    analytics: {
      trackUsage: true,
    },
    tags: ['ai', 'summarization'],
    owner: 'ai-team',
  },

  [FLAG_IDS.AI_SENTIMENT_ANALYSIS]: {
    id: FLAG_IDS.AI_SENTIMENT_ANALYSIS,
    name: 'AI Sentiment Analysis',
    description: 'Analyze sentiment and emotional tone in conversations',
    defaultEnabled: false,
    status: 'development',
    conditions: [
      {
        type: 'environment',
        environments: ['development', 'staging'],
      },
    ],
    tags: ['ai', 'sentiment', 'experimental'],
    owner: 'ai-team',
  },

  // ---------------------------------------------------------------------------
  // Workflow
  // ---------------------------------------------------------------------------
  [FLAG_IDS.REVIEW_WORKFLOW_V2]: {
    id: FLAG_IDS.REVIEW_WORKFLOW_V2,
    name: 'Review Workflow V2',
    description: 'Enhanced review workflow with inline editing and comments',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'percentage',
        percentage: 20,
        hashProperty: 'tenantId',
        salt: 'review_workflow_v2',
      },
    ],
    variants: [
      { key: 'control', name: 'Original Workflow', weight: 50 },
      { key: 'enhanced', name: 'Enhanced Workflow', weight: 50 },
    ],
    analytics: {
      trackEvaluation: true,
      trackUsage: true,
    },
    tags: ['workflow', 'review'],
    owner: 'product-team',
  },

  [FLAG_IDS.BATCH_APPROVAL]: {
    id: FLAG_IDS.BATCH_APPROVAL,
    name: 'Batch Approval',
    description: 'Approve multiple minutes at once',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'role',
        roles: ['manager', 'senior_manager'],
        operator: 'in',
      },
    ],
    tags: ['workflow', 'bulk'],
    owner: 'product-team',
  },

  [FLAG_IDS.DELEGATION]: {
    id: FLAG_IDS.DELEGATION,
    name: 'Delegation',
    description: 'Delegate approval authority to team members',
    defaultEnabled: false,
    status: 'development',
    conditions: [
      {
        type: 'role',
        roles: ['manager', 'senior_manager'],
        operator: 'in',
      },
    ],
    tags: ['workflow', 'delegation'],
    owner: 'product-team',
  },

  [FLAG_IDS.ESCALATION_RULES]: {
    id: FLAG_IDS.ESCALATION_RULES,
    name: 'Escalation Rules',
    description: 'Automatic escalation based on configurable rules',
    defaultEnabled: false,
    status: 'development',
    tags: ['workflow', 'escalation'],
    owner: 'product-team',
  },

  // ---------------------------------------------------------------------------
  // Export & Reporting
  // ---------------------------------------------------------------------------
  [FLAG_IDS.ADVANCED_EXPORT]: {
    id: FLAG_IDS.ADVANCED_EXPORT,
    name: 'Advanced Export',
    description: 'Enhanced export options including custom templates and formats',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'role',
        roles: ['admin', 'manager', 'senior_manager'],
        operator: 'in',
      },
    ],
    tags: ['export'],
    owner: 'platform-team',
  },

  [FLAG_IDS.CUSTOM_REPORTS]: {
    id: FLAG_IDS.CUSTOM_REPORTS,
    name: 'Custom Reports',
    description: 'Build and save custom reports',
    defaultEnabled: false,
    status: 'development',
    conditions: [
      {
        type: 'role',
        roles: ['admin', 'senior_manager'],
        operator: 'in',
      },
    ],
    tags: ['reporting'],
    owner: 'analytics-team',
  },

  [FLAG_IDS.ANALYTICS_DASHBOARD]: {
    id: FLAG_IDS.ANALYTICS_DASHBOARD,
    name: 'Analytics Dashboard',
    description: 'Real-time analytics dashboard with custom metrics',
    defaultEnabled: true,
    status: 'released',
    conditions: [
      {
        type: 'role',
        roles: ['admin', 'manager', 'senior_manager', 'quality_assurance'],
        operator: 'in',
      },
    ],
    tags: ['analytics', 'dashboard'],
    owner: 'analytics-team',
  },

  [FLAG_IDS.DATA_EXPORT_API]: {
    id: FLAG_IDS.DATA_EXPORT_API,
    name: 'Data Export API',
    description: 'API access for data export and integration',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'role',
        roles: ['admin'],
        operator: 'in',
      },
    ],
    tags: ['api', 'export'],
    owner: 'platform-team',
  },

  // ---------------------------------------------------------------------------
  // Admin Features
  // ---------------------------------------------------------------------------
  [FLAG_IDS.AUDIT_LOG_ADVANCED]: {
    id: FLAG_IDS.AUDIT_LOG_ADVANCED,
    name: 'Advanced Audit Log',
    description: 'Enhanced audit log with search, filters, and export',
    defaultEnabled: false,
    status: 'released',
    conditions: [
      {
        type: 'role',
        roles: ['admin'],
        operator: 'in',
      },
    ],
    tags: ['admin', 'audit'],
    owner: 'security-team',
  },

  [FLAG_IDS.TENANT_BRANDING]: {
    id: FLAG_IDS.TENANT_BRANDING,
    name: 'Tenant Branding',
    description: 'Custom branding configuration for tenants',
    defaultEnabled: true,
    status: 'released',
    conditions: [
      {
        type: 'role',
        roles: ['admin'],
        operator: 'in',
      },
    ],
    tags: ['admin', 'branding'],
    owner: 'platform-team',
  },

  [FLAG_IDS.CUSTOM_ROLES]: {
    id: FLAG_IDS.CUSTOM_ROLES,
    name: 'Custom Roles',
    description: 'Define custom roles with granular permissions',
    defaultEnabled: false,
    status: 'development',
    conditions: [
      {
        type: 'role',
        roles: ['admin'],
        operator: 'in',
      },
    ],
    tags: ['admin', 'rbac'],
    owner: 'security-team',
  },

  [FLAG_IDS.SSO_CONFIGURATION]: {
    id: FLAG_IDS.SSO_CONFIGURATION,
    name: 'SSO Configuration',
    description: 'Self-service SSO configuration for tenants',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'role',
        roles: ['admin'],
        operator: 'in',
      },
    ],
    tags: ['admin', 'sso'],
    owner: 'security-team',
  },

  // ---------------------------------------------------------------------------
  // Experimental
  // ---------------------------------------------------------------------------
  [FLAG_IDS.VOICE_COMMANDS]: {
    id: FLAG_IDS.VOICE_COMMANDS,
    name: 'Voice Commands',
    description: 'Control the app with voice commands',
    defaultEnabled: false,
    status: 'development',
    conditions: [
      {
        type: 'environment',
        environments: ['development'],
      },
    ],
    tags: ['experimental', 'voice'],
    owner: 'innovation-team',
  },

  [FLAG_IDS.REAL_TIME_COLLAB]: {
    id: FLAG_IDS.REAL_TIME_COLLAB,
    name: 'Real-Time Collaboration',
    description: 'Collaborate on minutes in real-time with other users',
    defaultEnabled: false,
    status: 'development',
    conditions: [
      {
        type: 'environment',
        environments: ['development'],
      },
    ],
    tags: ['experimental', 'collaboration'],
    owner: 'innovation-team',
  },

  [FLAG_IDS.MOBILE_NATIVE]: {
    id: FLAG_IDS.MOBILE_NATIVE,
    name: 'Mobile Native Features',
    description: 'Native mobile features for iOS and Android',
    defaultEnabled: false,
    status: 'beta',
    conditions: [
      {
        type: 'custom',
        key: 'platform',
        value: 'mobile',
        operator: 'equals',
      },
    ],
    tags: ['mobile'],
    owner: 'mobile-team',
  },

  [FLAG_IDS.DARK_MODE]: {
    id: FLAG_IDS.DARK_MODE,
    name: 'Dark Mode',
    description: 'Dark mode theme option',
    defaultEnabled: true,
    status: 'released',
    analytics: {
      trackUsage: true,
    },
    tags: ['ui', 'theme'],
    owner: 'platform-team',
  },
};

// ============================================================================
// Feature Bundles
// ============================================================================

/**
 * Feature bundles for grouped rollouts
 */
export const FEATURE_BUNDLES: Record<string, FeatureBundle> = {
  ai_suite: {
    id: 'ai_suite',
    name: 'AI Suite',
    description: 'All AI-powered features',
    flags: [
      FLAG_IDS.AI_INSIGHTS,
      FLAG_IDS.AI_QUALITY_SCORING,
      FLAG_IDS.AI_RISK_DETECTION,
      FLAG_IDS.AI_SUGGESTED_TEMPLATES,
      FLAG_IDS.AI_AUTO_SUMMARIZE,
      FLAG_IDS.AI_SENTIMENT_ANALYSIS,
    ],
    tags: ['ai'],
  },

  enterprise_integrations: {
    id: 'enterprise_integrations',
    name: 'Enterprise Integrations',
    description: 'Enterprise system integrations',
    flags: [
      FLAG_IDS.MICROSOFT_365_INTEGRATION,
      FLAG_IDS.MOSAIC_SYNC,
      FLAG_IDS.LIQUID_LOGIC_SYNC,
      FLAG_IDS.TEAMS_INTEGRATION,
    ],
    tags: ['enterprise', 'integrations'],
  },

  advanced_workflow: {
    id: 'advanced_workflow',
    name: 'Advanced Workflow',
    description: 'Advanced workflow features',
    flags: [
      FLAG_IDS.REVIEW_WORKFLOW_V2,
      FLAG_IDS.BATCH_APPROVAL,
      FLAG_IDS.DELEGATION,
      FLAG_IDS.ESCALATION_RULES,
    ],
    tags: ['workflow'],
  },

  offline_capabilities: {
    id: 'offline_capabilities',
    name: 'Offline Capabilities',
    description: 'Features for offline usage',
    flags: [FLAG_IDS.OFFLINE_MODE, FLAG_IDS.PUSH_NOTIFICATIONS],
    tags: ['offline', 'pwa'],
  },

  admin_tools: {
    id: 'admin_tools',
    name: 'Admin Tools',
    description: 'Administrative features',
    flags: [
      FLAG_IDS.AUDIT_LOG_ADVANCED,
      FLAG_IDS.TENANT_BRANDING,
      FLAG_IDS.CUSTOM_ROLES,
      FLAG_IDS.SSO_CONFIGURATION,
    ],
    tags: ['admin'],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a feature flag by ID
 */
export function getFlag(flagId: FeatureFlagId): FeatureFlag | undefined {
  return FEATURE_FLAGS[flagId as KnownFlagId];
}

/**
 * Get all flags matching a tag
 */
export function getFlagsByTag(tag: string): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS).filter((flag) => flag.tags?.includes(tag));
}

/**
 * Get all flags with a specific status
 */
export function getFlagsByStatus(status: FeatureFlag['status']): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS).filter((flag) => flag.status === status);
}

/**
 * Get all flags owned by a team
 */
export function getFlagsByOwner(owner: string): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS).filter((flag) => flag.owner === owner);
}

/**
 * Get a feature bundle by ID
 */
export function getBundle(bundleId: string): FeatureBundle | undefined {
  return FEATURE_BUNDLES[bundleId];
}

/**
 * Get all flags in a bundle
 */
export function getBundleFlags(bundleId: string): FeatureFlag[] {
  const bundle = FEATURE_BUNDLES[bundleId];
  if (!bundle) return [];
  return bundle.flags.map((flagId) => FEATURE_FLAGS[flagId as KnownFlagId]).filter(Boolean);
}

/**
 * Get all flag IDs as an array
 */
export function getAllFlagIds(): FeatureFlagId[] {
  return Object.keys(FEATURE_FLAGS);
}

/**
 * Get all flags as an array
 */
export function getAllFlags(): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS);
}
