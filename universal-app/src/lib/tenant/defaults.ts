/**
 * Default Tenant Configuration
 *
 * Provides baseline defaults for all tenants. Tenant-specific configs
 * override these defaults via deep merging.
 */

import type {
  TenantConfig,
  ServiceDomainConfig,
  RoleConfig,
  ModuleConfig,
  FeatureFlags,
  ServiceDomainId,
  RoleId,
  ModuleId,
  ThemeConfig,
  LocalizationConfig,
  Permission,
  NavItemConfig,
} from './types';

// ============================================================================
// Default Theme
// ============================================================================

export const DEFAULT_THEME: ThemeConfig = {
  primary: '#1E3A5F',
  accent: '#3BA08D',
  gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8A 100%)',
  primaryDark: '#0F1D2F',
  accentDark: '#2D7A6A',
  fontHeading: 'Inter, system-ui, sans-serif',
  fontBody: 'Inter, system-ui, sans-serif',
  borderRadius: 'md',
};

// ============================================================================
// Default Localization
// ============================================================================

export const DEFAULT_LOCALIZATION: LocalizationConfig = {
  defaultLocale: 'en-GB',
  availableLocales: ['en-GB'],
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  timezone: 'Europe/London',
  currency: 'GBP',
};

// ============================================================================
// Default Feature Flags
// ============================================================================

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  aiInsights: true,
  housingPilot: false,
  smartCapture: true,
  offlineMode: true,
  advancedAnalytics: false,
  caseManagement: false,
  bulkOperations: false,
  darkMode: false,
  newUiExperiment: false,
};

// ============================================================================
// Default Service Domains
// ============================================================================

export const DEFAULT_SERVICE_DOMAINS: Record<ServiceDomainId, ServiceDomainConfig> = {
  children: {
    id: 'children',
    name: "Children's Social Care",
    authorityLabel: 'Council',
    personaLabel: 'Children',
    theme: {
      primary: '#211551',
      accent: '#9D581F',
      gradient: 'linear-gradient(135deg, #211551 0%, #3E2A88 100%)',
    },
    availableRoles: ['social_worker', 'manager', 'senior_manager', 'admin', 'quality_assurance', 'team_lead'],
    enabledModules: [
      'smart_capture',
      'transcription',
      'templates',
      'review_workflow',
      'ai_insights',
      'task_management',
      'team_dashboard',
      'analytics',
      'export_pdf',
      'export_word',
      'offline_mode',
    ],
    defaultTemplates: ['home_visit', 'case_conference', 'supervision', 'strategy_meeting'],
  },
  adults: {
    id: 'adults',
    name: 'Adult Social Care',
    authorityLabel: 'Council',
    personaLabel: 'Adults',
    theme: {
      primary: '#014363',
      accent: '#A2CDE0',
      gradient: 'linear-gradient(135deg, #014363 0%, #026491 100%)',
    },
    availableRoles: ['social_worker', 'manager', 'senior_manager', 'admin', 'quality_assurance', 'team_lead'],
    enabledModules: [
      'smart_capture',
      'transcription',
      'templates',
      'review_workflow',
      'ai_insights',
      'task_management',
      'team_dashboard',
      'analytics',
      'export_pdf',
      'export_word',
      'offline_mode',
    ],
    defaultTemplates: ['assessment', 'care_review', 'safeguarding', 'best_interest'],
  },
  housing: {
    id: 'housing',
    name: 'Housing Directorate',
    authorityLabel: 'Council',
    personaLabel: 'Housing',
    theme: {
      primary: '#F28E00',
      accent: '#3BA08D',
      gradient: 'linear-gradient(135deg, #F28E00 0%, #FFB347 100%)',
    },
    availableRoles: ['housing_officer', 'manager', 'admin'],
    enabledModules: ['smart_capture', 'transcription', 'templates', 'task_management', 'export_pdf'],
    defaultTemplates: ['tenancy_visit', 'property_inspection', 'complaint_resolution'],
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate Services',
    authorityLabel: 'Council',
    personaLabel: 'Corporate',
    theme: {
      primary: '#333333',
      accent: '#666666',
      gradient: 'linear-gradient(135deg, #333333 0%, #555555 100%)',
    },
    availableRoles: ['admin', 'manager'],
    enabledModules: ['analytics', 'audit_log', 'team_dashboard'],
    defaultTemplates: [],
  },
  education: {
    id: 'education',
    name: 'Education Services',
    authorityLabel: 'Council',
    personaLabel: 'Education',
    theme: {
      primary: '#2E7D32',
      accent: '#81C784',
      gradient: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
    },
    availableRoles: ['social_worker', 'manager', 'admin'],
    enabledModules: ['smart_capture', 'transcription', 'templates', 'task_management'],
    defaultTemplates: ['school_visit', 'education_review', 'transition_planning'],
  },
  health: {
    id: 'health',
    name: 'Health Integration',
    authorityLabel: 'Council & NHS',
    personaLabel: 'Health',
    theme: {
      primary: '#0072CE',
      accent: '#41B6E6',
      gradient: 'linear-gradient(135deg, #0072CE 0%, #41B6E6 100%)',
    },
    availableRoles: ['social_worker', 'manager', 'admin'],
    enabledModules: ['smart_capture', 'transcription', 'templates', 'integrations'],
    defaultTemplates: ['joint_assessment', 'discharge_planning', 'health_review'],
  },
};

// ============================================================================
// Default Navigation by Role
// ============================================================================

const SOCIAL_WORKER_NAV: NavItemConfig[] = [
  { label: 'Home', href: '/', icon: 'Home' },
  { label: 'My Notes', href: '/my-notes', icon: 'FileText' },
  { label: 'Smart Capture', href: '/record', icon: 'Mic', featureFlag: 'smartCapture', description: 'Audio recording' },
  { label: 'Upload', href: '/upload', icon: 'Upload' },
  { label: 'Templates', href: '/templates', icon: 'Clipboard' },
];

const MANAGER_NAV: NavItemConfig[] = [
  { label: 'Home', href: '/', icon: 'Home' },
  { label: 'Team Notes', href: '/my-notes', icon: 'FileText' },
  { label: 'Review Queue', href: '/review-queue', icon: 'CheckSquare' },
  { label: 'Team Dashboard', href: '/insights/dashboard', icon: 'LayoutDashboard' },
  { label: 'Team Insights', href: '/insights', icon: 'BarChart', featureFlag: 'aiInsights' },
  { label: 'Users & Teams', href: '/admin/users', icon: 'Users' },
];

const ADMIN_NAV: NavItemConfig[] = [
  { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
  { label: 'Modules', href: '/admin/modules', icon: 'Building' },
  { label: 'Analytics', href: '/insights', icon: 'BarChart', featureFlag: 'aiInsights' },
  { label: 'Users & Teams', href: '/admin/users', icon: 'Users' },
  { label: 'Audit Log', href: '/admin/audit', icon: 'ClipboardList' },
  { label: 'Templates', href: '/admin/templates', icon: 'Clipboard' },
];

const QA_NAV: NavItemConfig[] = [
  { label: 'Home', href: '/', icon: 'Home' },
  { label: 'All Notes', href: '/my-notes', icon: 'FileText' },
  { label: 'Quality Review', href: '/review-queue', icon: 'SearchCheck' },
  { label: 'Audit Reports', href: '/admin/audit', icon: 'FileBarChart' },
  { label: 'Analytics', href: '/insights', icon: 'BarChart', featureFlag: 'aiInsights' },
];

const HOUSING_OFFICER_NAV: NavItemConfig[] = [
  { label: 'Home', href: '/', icon: 'Home' },
  { label: 'My Notes', href: '/my-notes', icon: 'FileText' },
  { label: 'Capture', href: '/record', icon: 'Mic', featureFlag: 'smartCapture' },
  { label: 'Upload', href: '/upload', icon: 'Upload' },
];

// ============================================================================
// Default Roles
// ============================================================================

export const DEFAULT_ROLES: Record<RoleId, RoleConfig> = {
  social_worker: {
    id: 'social_worker',
    name: 'Social Worker',
    description: 'Frontline practitioner responsible for case work and documentation',
    permissions: ['read:own', 'write:own', 'delete:own', 'export:basic'],
    navigation: SOCIAL_WORKER_NAV,
    modules: ['smart_capture', 'transcription', 'templates', 'task_management', 'offline_mode', 'export_pdf'],
    dashboardWidgets: ['recent_notes', 'tasks_due', 'quick_capture'],
    quickActions: ['new_recording', 'upload_file', 'create_note'],
    canSwitchDomain: false,
    hierarchyLevel: 1,
  },
  team_lead: {
    id: 'team_lead',
    name: 'Team Lead',
    description: 'Supervises a team of practitioners',
    permissions: ['read:own', 'read:team', 'write:own', 'write:team', 'approve:team', 'export:basic'],
    navigation: [...SOCIAL_WORKER_NAV, { label: 'Team View', href: '/review-queue', icon: 'Users' }],
    modules: ['smart_capture', 'transcription', 'templates', 'task_management', 'team_dashboard', 'export_pdf'],
    dashboardWidgets: ['team_overview', 'pending_reviews', 'team_workload'],
    quickActions: ['new_recording', 'review_queue', 'team_report'],
    canSwitchDomain: false,
    hierarchyLevel: 2,
  },
  manager: {
    id: 'manager',
    name: 'Manager',
    description: 'Service manager with oversight and approval responsibilities',
    permissions: ['read:own', 'read:team', 'write:own', 'write:team', 'delete:team', 'approve:team', 'admin:users', 'export:basic', 'export:bulk'],
    navigation: MANAGER_NAV,
    modules: ['review_workflow', 'team_dashboard', 'analytics', 'ai_insights', 'export_pdf', 'export_word', 'bulk_operations'],
    dashboardWidgets: ['team_overview', 'pending_approvals', 'insights_summary', 'workload_distribution'],
    quickActions: ['review_queue', 'team_report', 'export_data'],
    canSwitchDomain: true,
    hierarchyLevel: 3,
  },
  senior_manager: {
    id: 'senior_manager',
    name: 'Senior Manager',
    description: 'Senior leadership with cross-team oversight',
    permissions: ['read:all', 'write:all', 'delete:team', 'approve:all', 'admin:users', 'admin:config', 'export:basic', 'export:bulk'],
    navigation: [...MANAGER_NAV, { label: 'Service Overview', href: '/insights/dashboard', icon: 'Building2' }],
    modules: ['review_workflow', 'team_dashboard', 'analytics', 'ai_insights', 'export_pdf', 'export_word', 'bulk_operations', 'audit_log'],
    dashboardWidgets: ['service_overview', 'all_teams', 'strategic_insights', 'compliance_summary'],
    quickActions: ['service_report', 'compliance_check', 'export_all'],
    canSwitchDomain: true,
    hierarchyLevel: 4,
  },
  quality_assurance: {
    id: 'quality_assurance',
    name: 'Quality Assurance',
    description: 'Quality and compliance monitoring role',
    permissions: ['read:all', 'admin:audit', 'export:basic', 'export:bulk'],
    navigation: QA_NAV,
    modules: ['analytics', 'ai_insights', 'audit_log', 'export_pdf', 'export_word'],
    dashboardWidgets: ['quality_metrics', 'compliance_dashboard', 'audit_findings'],
    quickActions: ['run_audit', 'generate_report', 'quality_review'],
    canSwitchDomain: true,
    hierarchyLevel: 3,
  },
  admin: {
    id: 'admin',
    name: 'Administrator',
    description: 'System administrator with full configuration access',
    permissions: [
      'read:all',
      'write:all',
      'delete:all',
      'approve:all',
      'admin:users',
      'admin:config',
      'admin:audit',
      'admin:modules',
      'export:basic',
      'export:bulk',
      'integrations:read',
      'integrations:write',
    ],
    navigation: ADMIN_NAV,
    modules: [
      'review_workflow',
      'team_dashboard',
      'analytics',
      'ai_insights',
      'audit_log',
      'integrations',
      'bulk_operations',
      'export_pdf',
      'export_word',
    ],
    dashboardWidgets: ['system_health', 'user_activity', 'integration_status', 'config_overview'],
    quickActions: ['manage_users', 'configure_modules', 'view_audit_log', 'manage_integrations'],
    canSwitchDomain: true,
    hierarchyLevel: 5,
  },
  housing_officer: {
    id: 'housing_officer',
    name: 'Housing Officer',
    description: 'Housing management and tenancy support',
    permissions: ['read:own', 'write:own', 'delete:own', 'export:basic'],
    navigation: HOUSING_OFFICER_NAV,
    modules: ['smart_capture', 'transcription', 'templates', 'task_management', 'export_pdf'],
    dashboardWidgets: ['recent_visits', 'tasks_due', 'property_summary'],
    quickActions: ['new_visit', 'upload_inspection', 'create_task'],
    canSwitchDomain: false,
    hierarchyLevel: 1,
  },
  support: {
    id: 'support',
    name: 'Support Staff',
    description: 'Administrative support role',
    permissions: ['read:team', 'export:basic'],
    navigation: [
      { label: 'Home', href: '/', icon: 'Home' },
      { label: 'Notes', href: '/my-notes', icon: 'FileText' },
      { label: 'Templates', href: '/templates', icon: 'Search' },
    ],
    modules: ['export_pdf'],
    dashboardWidgets: ['search', 'recent_activity'],
    quickActions: ['search'],
    canSwitchDomain: false,
    hierarchyLevel: 0,
  },
};

// ============================================================================
// Default Modules
// ============================================================================

export const DEFAULT_MODULES: Record<ModuleId, ModuleConfig> = {
  smart_capture: {
    id: 'smart_capture',
    name: 'Smart Capture',
    description: 'AI-powered audio recording with real-time transcription',
    status: 'enabled',
    allowedRoles: ['social_worker', 'team_lead', 'manager', 'housing_officer'],
    allowedDomains: ['children', 'adults', 'housing', 'education', 'health'],
    routes: ['/record', '/capture'],
    version: '2.0.0',
  },
  transcription: {
    id: 'transcription',
    name: 'Transcription',
    description: 'Automated audio-to-text transcription',
    status: 'enabled',
    allowedRoles: ['social_worker', 'team_lead', 'manager', 'senior_manager', 'housing_officer'],
    allowedDomains: ['children', 'adults', 'housing', 'education', 'health'],
    routes: ['/my-notes', '/minutes/[id]'],
    version: '2.0.0',
  },
  templates: {
    id: 'templates',
    name: 'Templates',
    description: 'Document templates for structured note-taking',
    status: 'enabled',
    allowedRoles: ['social_worker', 'team_lead', 'manager', 'housing_officer', 'admin'],
    allowedDomains: ['children', 'adults', 'housing', 'education', 'health'],
    routes: ['/templates', '/templates/[id]'],
    version: '1.5.0',
  },
  review_workflow: {
    id: 'review_workflow',
    name: 'Review Workflow',
    description: 'Multi-stage approval workflow for documents',
    status: 'enabled',
    allowedRoles: ['team_lead', 'manager', 'senior_manager', 'admin', 'quality_assurance'],
    allowedDomains: ['children', 'adults'],
    routes: ['/review-queue', '/review-queue/[id]'],
    version: '1.2.0',
  },
  ai_insights: {
    id: 'ai_insights',
    name: 'AI Insights',
    description: 'AI-powered analytics and recommendations',
    status: 'enabled',
    allowedRoles: ['manager', 'senior_manager', 'admin', 'quality_assurance'],
    allowedDomains: ['children', 'adults'],
    routes: ['/insights', '/insights/[category]'],
    version: '1.0.0',
  },
  case_management: {
    id: 'case_management',
    name: 'Case Management',
    description: 'Integrated case management features',
    status: 'coming_soon',
    allowedRoles: ['social_worker', 'team_lead', 'manager', 'senior_manager'],
    allowedDomains: ['children', 'adults'],
    routes: ['/cases', '/cases/[id]'],
    version: '0.1.0',
  },
  task_management: {
    id: 'task_management',
    name: 'Task Management',
    description: 'Task tracking and assignment',
    status: 'enabled',
    allowedRoles: ['social_worker', 'team_lead', 'manager', 'senior_manager', 'housing_officer'],
    allowedDomains: ['children', 'adults', 'housing', 'education', 'health'],
    routes: ['/my-notes/[id]', '/review-queue/[id]'],
    version: '1.3.0',
  },
  team_dashboard: {
    id: 'team_dashboard',
    name: 'Team Dashboard',
    description: 'Team performance and workload overview',
    status: 'enabled',
    allowedRoles: ['team_lead', 'manager', 'senior_manager', 'admin'],
    allowedDomains: ['children', 'adults', 'housing'],
    routes: ['/insights/dashboard', '/review-queue'],
    version: '1.1.0',
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    description: 'Reporting and analytics dashboards',
    status: 'enabled',
    allowedRoles: ['manager', 'senior_manager', 'admin', 'quality_assurance'],
    allowedDomains: ['children', 'adults', 'housing', 'corporate'],
    routes: ['/analytics', '/reports'],
    version: '1.4.0',
  },
  audit_log: {
    id: 'audit_log',
    name: 'Audit Log',
    description: 'System audit trail and compliance logging',
    status: 'enabled',
    allowedRoles: ['senior_manager', 'admin', 'quality_assurance'],
    allowedDomains: ['children', 'adults', 'housing', 'corporate'],
    routes: ['/admin/audit'],
    version: '1.0.0',
  },
  integrations: {
    id: 'integrations',
    name: 'Integrations',
    description: 'External system integrations',
    status: 'enabled',
    allowedRoles: ['admin'],
    allowedDomains: ['children', 'adults', 'housing', 'corporate'],
    routes: ['/admin/integrations'],
    version: '1.0.0',
  },
  bulk_operations: {
    id: 'bulk_operations',
    name: 'Bulk Operations',
    description: 'Bulk document and data operations',
    status: 'beta',
    allowedRoles: ['manager', 'senior_manager', 'admin'],
    allowedDomains: ['children', 'adults'],
    routes: ['/bulk'],
    version: '0.9.0',
  },
  offline_mode: {
    id: 'offline_mode',
    name: 'Offline Mode',
    description: 'Work offline with automatic sync',
    status: 'enabled',
    allowedRoles: ['social_worker', 'team_lead', 'housing_officer'],
    allowedDomains: ['children', 'adults', 'housing'],
    version: '1.1.0',
  },
  export_pdf: {
    id: 'export_pdf',
    name: 'Export to PDF',
    description: 'Export documents as PDF files',
    status: 'enabled',
    allowedRoles: ['social_worker', 'team_lead', 'manager', 'senior_manager', 'admin', 'quality_assurance', 'housing_officer'],
    allowedDomains: ['children', 'adults', 'housing', 'education', 'health'],
    version: '1.0.0',
  },
  export_word: {
    id: 'export_word',
    name: 'Export to Word',
    description: 'Export documents as Word files',
    status: 'enabled',
    allowedRoles: ['manager', 'senior_manager', 'admin', 'quality_assurance'],
    allowedDomains: ['children', 'adults'],
    version: '1.0.0',
  },
  mosaic_sync: {
    id: 'mosaic_sync',
    name: 'Mosaic Sync',
    description: 'Synchronize with Mosaic case management system',
    status: 'disabled',
    allowedRoles: ['admin'],
    allowedDomains: ['children', 'adults'],
    dependencies: ['integrations'],
    version: '0.5.0',
  },
  liquid_logic_sync: {
    id: 'liquid_logic_sync',
    name: 'Liquid Logic Sync',
    description: 'Synchronize with Liquid Logic system',
    status: 'disabled',
    allowedRoles: ['admin'],
    allowedDomains: ['children', 'adults'],
    dependencies: ['integrations'],
    version: '0.5.0',
  },
};

// ============================================================================
// Default Complete Configuration
// ============================================================================

export const DEFAULT_TENANT_CONFIG: Omit<TenantConfig, 'id' | 'slug' | 'branding'> = {
  serviceDomains: [
    DEFAULT_SERVICE_DOMAINS.children,
    DEFAULT_SERVICE_DOMAINS.adults,
    DEFAULT_SERVICE_DOMAINS.housing,
    DEFAULT_SERVICE_DOMAINS.corporate,
  ],
  roles: Object.values(DEFAULT_ROLES),
  modules: Object.values(DEFAULT_MODULES),
  featureFlags: DEFAULT_FEATURE_FLAGS,
  integrations: [],
  localization: DEFAULT_LOCALIZATION,
  defaultDomain: 'children',
  isActive: true,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get default navigation for a role and domain
 */
export function getDefaultNavigation(roleId: RoleId, domainId: ServiceDomainId): NavItemConfig[] {
  const role = DEFAULT_ROLES[roleId];
  if (!role) return [];
  return role.navigation;
}

/**
 * Get enabled modules for a role and domain
 */
export function getDefaultModules(roleId: RoleId, domainId: ServiceDomainId): ModuleConfig[] {
  const role = DEFAULT_ROLES[roleId];
  const domain = DEFAULT_SERVICE_DOMAINS[domainId];
  if (!role || !domain) return [];

  return Object.values(DEFAULT_MODULES).filter(
    (m) =>
      m.allowedRoles.includes(roleId) &&
      m.allowedDomains.includes(domainId) &&
      role.modules.includes(m.id)
  );
}

/**
 * Create a minimal tenant config from required fields
 */
export function createTenantConfig(
  id: string,
  slug: string,
  name: string,
  overrides: Partial<TenantConfig> = {}
): TenantConfig {
  return {
    id,
    slug,
    branding: {
      name,
      shortName: name,
      theme: DEFAULT_THEME,
      logo: {
        light: `/logos/${slug}-light.svg`,
        dark: `/logos/${slug}-dark.svg`,
        alt: `${name} Logo`,
      },
      ...overrides.branding,
    },
    ...DEFAULT_TENANT_CONFIG,
    ...overrides,
  };
}
