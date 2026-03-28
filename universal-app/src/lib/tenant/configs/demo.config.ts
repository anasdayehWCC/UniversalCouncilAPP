/**
 * Demo/Development Tenant Configuration
 *
 * Configuration for development, testing, and demonstration purposes.
 * Features all modules enabled with relaxed restrictions.
 */

import type { TenantConfig, ServiceDomainConfig, ModuleConfig, FeatureFlags } from '../types';
import { DEFAULT_ROLES, DEFAULT_MODULES, DEFAULT_FEATURE_FLAGS, DEFAULT_LOCALIZATION } from '../defaults';

// ============================================================================
// Demo Theme Colors
// ============================================================================

const DEMO_COLORS = {
  // Neutral professional palette
  primary: '#1E3A5F', // Deep blue
  accent: '#3BA08D', // Teal accent
  secondary: '#6366F1', // Indigo
  success: '#10B981', // Emerald
  warning: '#F59E0B', // Amber
  error: '#EF4444', // Red
  
  // Extended palette
  slate: '#475569',
  violet: '#7C3AED',
  cyan: '#06B6D4',
};

// ============================================================================
// Demo Service Domains (All Enabled)
// ============================================================================

const demoChildrenDomain: ServiceDomainConfig = {
  id: 'children',
  name: "Children's Services",
  authorityLabel: 'Demo Council',
  personaLabel: 'Demo • Children',
  theme: {
    primary: DEMO_COLORS.primary,
    accent: DEMO_COLORS.accent,
    gradient: `linear-gradient(135deg, ${DEMO_COLORS.primary} 0%, #2D5A8A 100%)`,
    primaryDark: '#0F1D2F',
    accentDark: '#2D7A6A',
  },
  availableRoles: ['social_worker', 'team_lead', 'manager', 'senior_manager', 'admin', 'quality_assurance', 'support'],
  enabledModules: [
    'smart_capture',
    'transcription',
    'templates',
    'review_workflow',
    'ai_insights',
    'case_management',
    'task_management',
    'team_dashboard',
    'analytics',
    'audit_log',
    'integrations',
    'bulk_operations',
    'offline_mode',
    'export_pdf',
    'export_word',
  ],
  defaultTemplates: [
    'home_visit',
    'case_conference',
    'supervision',
    'strategy_meeting',
    'child_protection_conference',
    'lac_review',
    'pathway_plan',
    'early_help_assessment',
  ],
  settings: {
    requiresApproval: true,
    approvalLevels: 2,
    maxRecordingDuration: 180, // Extended for demo
    retentionDays: 365,
    demoMode: true,
  },
};

const demoAdultsDomain: ServiceDomainConfig = {
  id: 'adults',
  name: 'Adult Social Care',
  authorityLabel: 'Demo Council',
  personaLabel: 'Demo • Adults',
  theme: {
    primary: DEMO_COLORS.accent,
    accent: DEMO_COLORS.cyan,
    gradient: `linear-gradient(135deg, ${DEMO_COLORS.accent} 0%, #4DC7AB 100%)`,
    primaryDark: '#2D7A6A',
    accentDark: '#0891B2',
  },
  availableRoles: ['social_worker', 'team_lead', 'manager', 'senior_manager', 'admin', 'quality_assurance', 'support'],
  enabledModules: [
    'smart_capture',
    'transcription',
    'templates',
    'review_workflow',
    'ai_insights',
    'case_management',
    'task_management',
    'team_dashboard',
    'analytics',
    'audit_log',
    'integrations',
    'bulk_operations',
    'offline_mode',
    'export_pdf',
    'export_word',
  ],
  defaultTemplates: [
    'needs_assessment',
    'care_review',
    'safeguarding_enquiry',
    'mental_capacity_assessment',
    'best_interest_decision',
    'dols_assessment',
    'carers_assessment',
  ],
  settings: {
    requiresApproval: true,
    approvalLevels: 1,
    maxRecordingDuration: 120,
    retentionDays: 365,
    demoMode: true,
  },
};

const demoHousingDomain: ServiceDomainConfig = {
  id: 'housing',
  name: 'Housing Services',
  authorityLabel: 'Demo Council',
  personaLabel: 'Demo • Housing',
  theme: {
    primary: DEMO_COLORS.warning,
    accent: DEMO_COLORS.primary,
    gradient: `linear-gradient(135deg, ${DEMO_COLORS.warning} 0%, #FBBF24 100%)`,
    primaryDark: '#D97706',
    accentDark: '#0F1D2F',
  },
  availableRoles: ['housing_officer', 'team_lead', 'manager', 'admin', 'support'],
  enabledModules: [
    'smart_capture',
    'transcription',
    'templates',
    'task_management',
    'team_dashboard',
    'analytics',
    'export_pdf',
    'offline_mode',
  ],
  defaultTemplates: [
    'tenancy_visit',
    'property_inspection',
    'antisocial_behaviour',
    'homeless_assessment',
    'repairs_inspection',
  ],
  settings: {
    requiresApproval: false,
    maxRecordingDuration: 60,
    retentionDays: 365,
    demoMode: true,
  },
};

const demoCorporateDomain: ServiceDomainConfig = {
  id: 'corporate',
  name: 'Corporate Services',
  authorityLabel: 'Demo Council',
  personaLabel: 'Demo • Corporate',
  theme: {
    primary: DEMO_COLORS.slate,
    accent: DEMO_COLORS.secondary,
    gradient: `linear-gradient(135deg, ${DEMO_COLORS.slate} 0%, #64748B 100%)`,
  },
  availableRoles: ['admin', 'senior_manager', 'support'],
  enabledModules: ['analytics', 'audit_log', 'integrations', 'team_dashboard'],
  defaultTemplates: [],
  settings: {
    demoMode: true,
  },
};

const demoEducationDomain: ServiceDomainConfig = {
  id: 'education',
  name: 'Education Services',
  authorityLabel: 'Demo Council',
  personaLabel: 'Demo • Education',
  theme: {
    primary: DEMO_COLORS.success,
    accent: DEMO_COLORS.accent,
    gradient: `linear-gradient(135deg, ${DEMO_COLORS.success} 0%, #34D399 100%)`,
  },
  availableRoles: ['social_worker', 'manager', 'admin'],
  enabledModules: [
    'smart_capture',
    'transcription',
    'templates',
    'task_management',
    'export_pdf',
  ],
  defaultTemplates: [
    'school_visit',
    'education_review',
    'transition_planning',
    'elective_home_education',
  ],
  settings: {
    demoMode: true,
  },
};

const demoHealthDomain: ServiceDomainConfig = {
  id: 'health',
  name: 'Health Integration',
  authorityLabel: 'Demo Council & NHS',
  personaLabel: 'Demo • Health',
  theme: {
    primary: DEMO_COLORS.violet,
    accent: DEMO_COLORS.cyan,
    gradient: `linear-gradient(135deg, ${DEMO_COLORS.violet} 0%, #8B5CF6 100%)`,
  },
  availableRoles: ['social_worker', 'manager', 'admin'],
  enabledModules: [
    'smart_capture',
    'transcription',
    'templates',
    'integrations',
    'task_management',
  ],
  defaultTemplates: [
    'joint_assessment',
    'discharge_planning',
    'health_review',
    'multi_disciplinary_meeting',
  ],
  settings: {
    demoMode: true,
  },
};

// ============================================================================
// Demo Feature Flags (All Enabled)
// ============================================================================

const demoFeatureFlags: FeatureFlags = {
  aiInsights: true,
  housingPilot: true,
  smartCapture: true,
  offlineMode: true,
  advancedAnalytics: true,
  caseManagement: true,
  bulkOperations: true,
  darkMode: true,
  newUiExperiment: true,
};

// ============================================================================
// Demo Modules (All Enabled)
// ============================================================================

const demoModules: ModuleConfig[] = Object.values(DEFAULT_MODULES).map((m) => ({
  ...m,
  status: 'enabled' as const,
  // Make all modules available to all roles in demo
  allowedRoles: [
    'social_worker',
    'team_lead',
    'manager',
    'senior_manager',
    'admin',
    'quality_assurance',
    'housing_officer',
    'support',
  ],
}));

// ============================================================================
// Complete Demo Configuration
// ============================================================================

export const demoConfig: TenantConfig = {
  id: 'demo',
  slug: 'demo',
  branding: {
    name: 'Demo Council',
    shortName: 'Demo',
    theme: {
      primary: DEMO_COLORS.primary,
      accent: DEMO_COLORS.accent,
      gradient: `linear-gradient(135deg, ${DEMO_COLORS.primary} 0%, #2D5A8A 100%)`,
      primaryDark: '#0F1D2F',
      accentDark: '#2D7A6A',
      fontHeading: 'Inter, system-ui, sans-serif',
      fontBody: 'Inter, system-ui, sans-serif',
      borderRadius: 'lg',
    },
    logo: {
      light: '/logos/demo-logo.svg',
      dark: '/logos/demo-logo-white.svg',
      alt: 'Demo Council',
      favicon: '/logos/demo-favicon.ico',
      width: 160,
      height: 44,
    },
    emailDomain: 'demo.council.gov.uk',
    supportEmail: 'support@demo.council.gov.uk',
    termsUrl: '/legal/terms',
    privacyUrl: '/legal/privacy',
  },
  serviceDomains: [
    demoChildrenDomain,
    demoAdultsDomain,
    demoHousingDomain,
    demoCorporateDomain,
    demoEducationDomain,
    demoHealthDomain,
  ],
  roles: Object.values(DEFAULT_ROLES).map((r) => ({
    ...r,
    // Allow all roles to switch domains in demo
    canSwitchDomain: true,
  })),
  modules: demoModules,
  featureFlags: demoFeatureFlags,
  featureFlagDefinitions: [
    {
      key: 'aiInsights',
      name: 'AI Insights',
      description: 'Enable AI-powered analytics and recommendations',
      defaultValue: true,
      isBeta: false,
    },
    {
      key: 'smartCapture',
      name: 'Smart Capture',
      description: 'Enable audio recording with real-time transcription',
      defaultValue: true,
      isBeta: false,
    },
    {
      key: 'offlineMode',
      name: 'Offline Mode',
      description: 'Enable offline working with automatic sync',
      defaultValue: true,
      isBeta: true,
    },
    {
      key: 'caseManagement',
      name: 'Case Management',
      description: 'Enable integrated case management features',
      defaultValue: true,
      isBeta: true,
    },
    {
      key: 'darkMode',
      name: 'Dark Mode',
      description: 'Enable dark mode theme option',
      defaultValue: true,
      isBeta: false,
    },
    {
      key: 'newUiExperiment',
      name: 'New UI Experiment',
      description: 'Test new user interface components',
      defaultValue: true,
      isBeta: true,
      rolloutPercentage: 50,
    },
  ],
  integrations: [
    {
      type: 'azure_ad',
      name: 'Azure Active Directory',
      enabled: false, // Disabled for demo - use mock auth
    },
    {
      type: 'mosaic',
      name: 'Mosaic (Mock)',
      enabled: true,
      endpoint: '/api/mock/mosaic',
      syncDirection: 'bidirectional',
    },
    {
      type: 'sharepoint',
      name: 'SharePoint (Mock)',
      enabled: true,
      settings: {
        siteUrl: '/api/mock/sharepoint',
      },
    },
  ],
  environment: {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    authProvider: 'mock',
    debug: true,
  },
  localization: {
    ...DEFAULT_LOCALIZATION,
    timezone: 'Europe/London',
  },
  defaultDomain: 'children',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
  metadata: {
    isDemo: true,
    version: '1.0.0',
    features: ['all'],
    description: 'Demo tenant for development and testing. All features and modules are enabled.',
  },
};
