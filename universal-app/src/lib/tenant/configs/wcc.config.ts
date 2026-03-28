/**
 * Westminster City Council (WCC) Tenant Configuration
 *
 * Configuration for Westminster City Council services including
 * Children's Social Care, Adult Social Care, and Housing.
 */

import type { TenantConfig, ServiceDomainConfig, ModuleStatus } from '../types';
import { DEFAULT_ROLES, DEFAULT_MODULES, DEFAULT_FEATURE_FLAGS, DEFAULT_LOCALIZATION } from '../defaults';

// ============================================================================
// WCC Theme Colors
// ============================================================================

const WCC_COLORS = {
  // Primary brand colors
  night: '#211551', // WCC Night - deep purple/blue
  copper: '#9D581F', // WCC Copper - accent
  orange: '#F28E00', // WCC Orange
  teal: '#3BA08D', // WCC Teal
  sky: '#0072CE', // WCC Sky Blue
  
  // Extended palette
  violet: '#3E2A88',
  lightTeal: '#A2CDE0',
  cream: '#FFF8F0',
  warmGrey: '#6B5B4F',
};

// ============================================================================
// WCC Service Domains
// ============================================================================

const wccChildrenDomain: ServiceDomainConfig = {
  id: 'children',
  name: "Children's Social Care",
  authorityLabel: 'Westminster City Council',
  personaLabel: 'Westminster • Children',
  theme: {
    primary: WCC_COLORS.night,
    accent: WCC_COLORS.copper,
    gradient: `linear-gradient(135deg, ${WCC_COLORS.night} 0%, ${WCC_COLORS.violet} 100%)`,
    primaryDark: '#0F0A28',
    accentDark: '#7A4418',
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
    'bulk_operations',
  ],
  defaultTemplates: [
    'home_visit',
    'case_conference',
    'supervision',
    'strategy_meeting',
    'child_protection_conference',
    'lac_review',
    'pathway_plan',
  ],
  settings: {
    requiresApproval: true,
    approvalLevels: 2,
    maxRecordingDuration: 120, // minutes
    retentionDays: 2555, // ~7 years
  },
};

const wccAdultsDomain: ServiceDomainConfig = {
  id: 'adults',
  name: 'Adult Social Care',
  authorityLabel: 'Westminster City Council',
  personaLabel: 'Westminster • Adults',
  theme: {
    primary: WCC_COLORS.teal,
    accent: WCC_COLORS.sky,
    gradient: `linear-gradient(135deg, ${WCC_COLORS.teal} 0%, #4DC7AB 100%)`,
    primaryDark: '#2A7A6A',
    accentDark: '#0058A0',
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
  },
};

const wccHousingDomain: ServiceDomainConfig = {
  id: 'housing',
  name: 'Housing Services',
  authorityLabel: 'Westminster City Council',
  personaLabel: 'Westminster • Housing',
  theme: {
    primary: WCC_COLORS.orange,
    accent: WCC_COLORS.teal,
    gradient: `linear-gradient(135deg, ${WCC_COLORS.orange} 0%, #FFB347 100%)`,
    primaryDark: '#C47200',
    accentDark: '#2A7A6A',
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
    'antisocial_behaviour',
    'homeless_assessment',
    'temporary_accommodation_review',
  ],
  settings: {
    requiresApproval: false,
    maxRecordingDuration: 60,
    retentionDays: 1825, // ~5 years
  },
};

const wccCorporateDomain: ServiceDomainConfig = {
  id: 'corporate',
  name: 'Corporate Services',
  authorityLabel: 'Westminster City Council',
  personaLabel: 'Westminster • Corporate',
  theme: {
    primary: WCC_COLORS.warmGrey,
    accent: WCC_COLORS.copper,
    gradient: `linear-gradient(135deg, ${WCC_COLORS.warmGrey} 0%, #8A7A6E 100%)`,
  },
  availableRoles: ['admin', 'senior_manager'],
  enabledModules: ['analytics', 'audit_log', 'integrations'],
  defaultTemplates: [],
};

// ============================================================================
// WCC Feature Flags
// ============================================================================

const wccFeatureFlags = {
  ...DEFAULT_FEATURE_FLAGS,
  aiInsights: true,
  smartCapture: true,
  offlineMode: true,
  advancedAnalytics: true,
  caseManagement: false, // Coming in Phase 3
  bulkOperations: true,
  darkMode: false,
  housingPilot: true, // Westminster housing pilot active
  newUiExperiment: false,
};

// ============================================================================
// WCC Module Overrides
// ============================================================================

const wccModules = DEFAULT_MODULES;

// Enable Mosaic sync for Westminster
const wccModulesWithIntegrations = Object.values(wccModules).map((m) => {
  if (m.id === 'mosaic_sync') {
    return { ...m, status: 'beta' as ModuleStatus };
  }
  return m;
});

// ============================================================================
// Complete WCC Configuration
// ============================================================================

export const wccConfig: TenantConfig = {
  id: 'wcc',
  slug: 'wcc',
  branding: {
    name: 'Westminster City Council',
    shortName: 'Westminster',
    theme: {
      primary: WCC_COLORS.night,
      accent: WCC_COLORS.copper,
      gradient: `linear-gradient(135deg, ${WCC_COLORS.night} 0%, ${WCC_COLORS.violet} 100%)`,
      primaryDark: '#0F0A28',
      accentDark: '#7A4418',
      fontHeading: 'Inter, system-ui, sans-serif',
      fontBody: 'Inter, system-ui, sans-serif',
      borderRadius: 'md',
    },
    logo: {
      light: '/logos/wcc-logo.svg',
      dark: '/logos/wcc-logo-white.svg',
      alt: 'Westminster City Council',
      favicon: '/logos/wcc-favicon.ico',
      width: 180,
      height: 48,
    },
    emailDomain: 'westminster.gov.uk',
    supportEmail: 'digital.support@westminster.gov.uk',
    termsUrl: 'https://www.westminster.gov.uk/terms',
    privacyUrl: 'https://www.westminster.gov.uk/privacy',
  },
  serviceDomains: [
    wccChildrenDomain,
    wccAdultsDomain,
    wccHousingDomain,
    wccCorporateDomain,
  ],
  roles: Object.values(DEFAULT_ROLES),
  modules: wccModulesWithIntegrations,
  featureFlags: wccFeatureFlags,
  integrations: [
    {
      type: 'azure_ad',
      name: 'Azure Active Directory',
      enabled: true,
      settings: {
        tenantId: process.env.NEXT_PUBLIC_WCC_AZURE_TENANT_ID || '',
      },
    },
    {
      type: 'mosaic',
      name: 'Mosaic Case Management',
      enabled: true,
      endpoint: 'https://mosaic.westminster.gov.uk/api',
      syncDirection: 'bidirectional',
      syncFrequency: 15,
      fieldMappings: {
        'case_id': 'mosaicCaseRef',
        'person_id': 'mosaicPersonId',
      },
    },
    {
      type: 'sharepoint',
      name: 'SharePoint Document Store',
      enabled: true,
      settings: {
        siteUrl: 'https://westminster.sharepoint.com/sites/SocialCare',
      },
    },
  ],
  environment: {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.westminster.gov.uk',
    authProvider: 'azure_ad',
    azureAdTenantId: process.env.NEXT_PUBLIC_WCC_AZURE_TENANT_ID,
    azureAdClientId: process.env.NEXT_PUBLIC_WCC_AZURE_CLIENT_ID,
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
    councilType: 'city',
    population: 261000,
    establishedYear: 1965,
  },
};
