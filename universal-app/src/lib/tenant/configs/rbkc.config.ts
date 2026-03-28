/**
 * Royal Borough of Kensington and Chelsea (RBKC) Tenant Configuration
 *
 * Configuration for RBKC services. RBKC shares bi-borough Adult Social Care
 * services with Westminster but has distinct Children's and Housing services.
 */

import type { TenantConfig, ServiceDomainConfig, ModuleStatus } from '../types';
import { DEFAULT_ROLES, DEFAULT_MODULES, DEFAULT_FEATURE_FLAGS, DEFAULT_LOCALIZATION } from '../defaults';

// ============================================================================
// RBKC Theme Colors
// ============================================================================

const RBKC_COLORS = {
  // Primary brand colors (from RBKC brand guidelines)
  astronaut: '#014363', // RBKC Astronaut Blue - primary
  lightBlue: '#A2CDE0', // RBKC Light Blue - accent
  navy: '#002B49', // Deep navy
  teal: '#006B77', // RBKC Teal
  gold: '#C4A84B', // RBKC Gold accent
  
  // Extended palette
  royalBlue: '#026491',
  cream: '#FBF9F4',
  charcoal: '#2D2D2D',
};

// ============================================================================
// RBKC Service Domains
// ============================================================================

const rbkcChildrenDomain: ServiceDomainConfig = {
  id: 'children',
  name: "Children's Services",
  authorityLabel: 'Royal Borough of Kensington and Chelsea',
  personaLabel: 'RBKC • Children',
  theme: {
    primary: RBKC_COLORS.astronaut,
    accent: RBKC_COLORS.gold,
    gradient: `linear-gradient(135deg, ${RBKC_COLORS.astronaut} 0%, ${RBKC_COLORS.royalBlue} 100%)`,
    primaryDark: '#012A3F',
    accentDark: '#9A843B',
  },
  availableRoles: ['social_worker', 'team_lead', 'manager', 'senior_manager', 'admin', 'quality_assurance'],
  enabledModules: [
    'smart_capture',
    'transcription',
    'templates',
    'review_workflow',
    'ai_insights',
    'task_management',
    'team_dashboard',
    'analytics',
    'audit_log',
    'export_pdf',
    'export_word',
    'offline_mode',
  ],
  defaultTemplates: [
    'home_visit',
    'case_conference',
    'supervision',
    'strategy_meeting',
    'child_protection_conference',
    'lac_review',
    'early_help_assessment',
  ],
  settings: {
    requiresApproval: true,
    approvalLevels: 2,
    maxRecordingDuration: 120,
    retentionDays: 2555,
  },
};

const rbkcAdultsDomain: ServiceDomainConfig = {
  id: 'adults',
  name: 'Adult Social Care',
  authorityLabel: 'Bi-borough: Westminster & RBKC',
  personaLabel: 'Bi-borough • Adults',
  theme: {
    primary: RBKC_COLORS.teal,
    accent: RBKC_COLORS.lightBlue,
    gradient: `linear-gradient(135deg, ${RBKC_COLORS.teal} 0%, #008A99 100%)`,
    primaryDark: '#00535C',
    accentDark: '#7AAFC4',
  },
  availableRoles: ['social_worker', 'team_lead', 'manager', 'senior_manager', 'admin', 'quality_assurance'],
  enabledModules: [
    'smart_capture',
    'transcription',
    'templates',
    'review_workflow',
    'ai_insights',
    'task_management',
    'team_dashboard',
    'analytics',
    'audit_log',
    'export_pdf',
    'export_word',
    'offline_mode',
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
    maxRecordingDuration: 90,
    retentionDays: 2555,
    // Bi-borough specific settings
    isBiBorough: true,
    partnerAuthority: 'wcc',
  },
};

const rbkcHousingDomain: ServiceDomainConfig = {
  id: 'housing',
  name: 'Housing Management',
  authorityLabel: 'Royal Borough of Kensington and Chelsea',
  personaLabel: 'RBKC • Housing',
  theme: {
    primary: RBKC_COLORS.gold,
    accent: RBKC_COLORS.astronaut,
    gradient: `linear-gradient(135deg, ${RBKC_COLORS.gold} 0%, #D4B85B 100%)`,
    primaryDark: '#9A843B',
    accentDark: '#012A3F',
  },
  availableRoles: ['housing_officer', 'team_lead', 'manager', 'admin'],
  enabledModules: [
    'smart_capture',
    'transcription',
    'templates',
    'task_management',
    'export_pdf',
    'offline_mode',
  ],
  defaultTemplates: [
    'tenancy_visit',
    'property_inspection',
    'estate_walkabout',
    'leaseholder_consultation',
    'repairs_inspection',
  ],
  settings: {
    requiresApproval: false,
    maxRecordingDuration: 60,
    retentionDays: 1825,
  },
};

const rbkcCorporateDomain: ServiceDomainConfig = {
  id: 'corporate',
  name: 'Corporate Services',
  authorityLabel: 'Royal Borough of Kensington and Chelsea',
  personaLabel: 'RBKC • Corporate',
  theme: {
    primary: RBKC_COLORS.charcoal,
    accent: RBKC_COLORS.gold,
    gradient: `linear-gradient(135deg, ${RBKC_COLORS.charcoal} 0%, #4A4A4A 100%)`,
  },
  availableRoles: ['admin', 'senior_manager'],
  enabledModules: ['analytics', 'audit_log', 'integrations'],
  defaultTemplates: [],
};

// ============================================================================
// RBKC Feature Flags
// ============================================================================

const rbkcFeatureFlags = {
  ...DEFAULT_FEATURE_FLAGS,
  aiInsights: true,
  smartCapture: true,
  offlineMode: true,
  advancedAnalytics: false, // Rolling out Phase 2
  caseManagement: false,
  bulkOperations: false, // Not enabled for RBKC yet
  darkMode: false,
  housingPilot: false, // Housing pilot is WCC-only initially
  newUiExperiment: true, // RBKC is testing new UI
};

// ============================================================================
// RBKC Module Overrides
// ============================================================================

const rbkcModules = Object.values(DEFAULT_MODULES).map((m) => {
  // RBKC uses Liquid Logic instead of Mosaic
  if (m.id === 'liquid_logic_sync') {
    return { ...m, status: 'beta' as ModuleStatus };
  }
  if (m.id === 'mosaic_sync') {
    return { ...m, status: 'disabled' as ModuleStatus };
  }
  // Disable bulk operations for now
  if (m.id === 'bulk_operations') {
    return { ...m, status: 'coming_soon' as ModuleStatus };
  }
  return m;
});

// ============================================================================
// Complete RBKC Configuration
// ============================================================================

export const rbkcConfig: TenantConfig = {
  id: 'rbkc',
  slug: 'rbkc',
  branding: {
    name: 'Royal Borough of Kensington and Chelsea',
    shortName: 'RBKC',
    theme: {
      primary: RBKC_COLORS.astronaut,
      accent: RBKC_COLORS.gold,
      gradient: `linear-gradient(135deg, ${RBKC_COLORS.astronaut} 0%, ${RBKC_COLORS.royalBlue} 100%)`,
      primaryDark: '#012A3F',
      accentDark: '#9A843B',
      fontHeading: 'Inter, system-ui, sans-serif',
      fontBody: 'Inter, system-ui, sans-serif',
      borderRadius: 'md',
    },
    logo: {
      light: '/logos/rbkc-logo.svg',
      dark: '/logos/rbkc-logo-white.svg',
      alt: 'Royal Borough of Kensington and Chelsea',
      favicon: '/logos/rbkc-favicon.ico',
      width: 200,
      height: 52,
    },
    emailDomain: 'rbkc.gov.uk',
    supportEmail: 'digital.support@rbkc.gov.uk',
    termsUrl: 'https://www.rbkc.gov.uk/terms',
    privacyUrl: 'https://www.rbkc.gov.uk/privacy',
  },
  serviceDomains: [
    rbkcChildrenDomain,
    rbkcAdultsDomain,
    rbkcHousingDomain,
    rbkcCorporateDomain,
  ],
  roles: Object.values(DEFAULT_ROLES),
  modules: rbkcModules,
  featureFlags: rbkcFeatureFlags,
  integrations: [
    {
      type: 'azure_ad',
      name: 'Azure Active Directory',
      enabled: true,
      settings: {
        tenantId: process.env.NEXT_PUBLIC_RBKC_AZURE_TENANT_ID || '',
      },
    },
    {
      type: 'liquid_logic',
      name: 'Liquid Logic Case Management',
      enabled: true,
      endpoint: 'https://liquidlogic.rbkc.gov.uk/api',
      syncDirection: 'bidirectional',
      syncFrequency: 15,
      fieldMappings: {
        'case_id': 'llCaseRef',
        'person_id': 'llPersonId',
      },
    },
    {
      type: 'sharepoint',
      name: 'SharePoint Document Store',
      enabled: true,
      settings: {
        siteUrl: 'https://rbkc.sharepoint.com/sites/SocialCare',
      },
    },
    {
      type: 'teams',
      name: 'Microsoft Teams Integration',
      enabled: true,
      settings: {
        notificationsEnabled: true,
      },
    },
  ],
  environment: {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.rbkc.gov.uk',
    authProvider: 'azure_ad',
    azureAdTenantId: process.env.NEXT_PUBLIC_RBKC_AZURE_TENANT_ID,
    azureAdClientId: process.env.NEXT_PUBLIC_RBKC_AZURE_CLIENT_ID,
    posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    debug: process.env.NODE_ENV === 'development',
  },
  localization: {
    ...DEFAULT_LOCALIZATION,
    timezone: 'Europe/London',
  },
  defaultDomain: 'children',
  isActive: true,
  metadata: {
    region: 'london',
    councilType: 'royal_borough',
    population: 156000,
    establishedYear: 1965,
    // Bi-borough relationship
    biBorough: {
      partner: 'wcc',
      sharedServices: ['adults'],
    },
  },
};
