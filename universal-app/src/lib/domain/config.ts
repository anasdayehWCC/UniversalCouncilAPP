/**
 * Domain Configuration
 *
 * Configuration for all service domains in the Universal Council App.
 * Each domain represents a distinct department or service area.
 */

import type {
  ServiceDomain,
  DomainConfig,
  DomainNavItem,
  DomainStatus,
} from './types';

// ============================================================================
// Domain Configurations
// ============================================================================

/**
 * Children's Social Care configuration
 */
const childrenConfig: DomainConfig = {
  id: 'children',
  name: "Children's Social Care",
  shortName: 'Children',
  description: 'Child protection, family support, and children looked after services',
  authorityLabel: 'Westminster City Council',
  personaLabel: 'Westminster • Children',
  icon: 'Baby',
  status: 'active',
  branding: {
    primary: '#211551',
    accent: '#9D581F',
    gradient: 'linear-gradient(135deg, #211551 0%, #3E2A88 100%)',
    primaryDark: '#2d1d6b',
    className: 'domain-children',
  },
  navigation: [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'LayoutDashboard',
      primary: true,
    },
    {
      label: 'Case Notes',
      href: '/meetings',
      icon: 'FileText',
      primary: true,
    },
    {
      label: 'Capture',
      href: '/capture',
      icon: 'Mic',
      primary: true,
    },
    {
      label: 'Templates',
      href: '/templates',
      icon: 'Layout',
    },
    {
      label: 'Team',
      href: '/team',
      icon: 'Users',
      permission: 'read:team',
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: 'BarChart3',
      permission: 'admin:audit',
    },
  ],
  features: {
    modules: [
      'smart_capture',
      'transcription',
      'templates',
      'review_workflow',
      'ai_insights',
      'case_management',
      'offline_mode',
      'mosaic_sync',
    ],
    templates: [
      'home_visit',
      'child_protection_conference',
      'lac_review',
      'supervision',
      'family_meeting',
    ],
    flags: {
      aiInsights: true,
      smartCapture: true,
      offlineMode: true,
    },
    integrations: ['mosaic', 'sharepoint'],
  },
  permissions: {
    allowedRoles: ['social_worker', 'manager', 'senior_manager', 'admin', 'team_lead'],
    defaultRole: 'social_worker',
    canSwitchFrom: true,
    crossDomainAccess: false,
  },
  pathPrefix: '/children',
  sortOrder: 1,
};

/**
 * Adult Social Care configuration
 */
const adultsConfig: DomainConfig = {
  id: 'adults',
  name: 'Adult Social Care',
  shortName: 'Adults',
  description: 'Support for vulnerable adults, care planning, and safeguarding',
  authorityLabel: 'Bi-borough: Westminster & RBKC',
  personaLabel: 'RBKC • Adults',
  icon: 'Heart',
  status: 'active',
  branding: {
    primary: '#014363',
    accent: '#A2CDE0',
    gradient: 'linear-gradient(135deg, #014363 0%, #026491 100%)',
    primaryDark: '#015a82',
    className: 'domain-adults',
  },
  navigation: [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'LayoutDashboard',
      primary: true,
    },
    {
      label: 'Assessments',
      href: '/meetings',
      icon: 'ClipboardList',
      primary: true,
    },
    {
      label: 'Capture',
      href: '/capture',
      icon: 'Mic',
      primary: true,
    },
    {
      label: 'Care Plans',
      href: '/care-plans',
      icon: 'FileHeart',
    },
    {
      label: 'Templates',
      href: '/templates',
      icon: 'Layout',
    },
    {
      label: 'Team',
      href: '/team',
      icon: 'Users',
      permission: 'read:team',
    },
  ],
  features: {
    modules: [
      'smart_capture',
      'transcription',
      'templates',
      'review_workflow',
      'ai_insights',
      'case_management',
      'offline_mode',
      'liquid_logic_sync',
    ],
    templates: [
      'care_act_assessment',
      'carers_assessment',
      'safeguarding_enquiry',
      'mental_capacity_assessment',
      'support_plan_review',
    ],
    flags: {
      aiInsights: true,
      smartCapture: true,
      offlineMode: true,
    },
    integrations: ['liquid_logic', 'nhs_spine', 'sharepoint'],
  },
  permissions: {
    allowedRoles: ['social_worker', 'manager', 'senior_manager', 'admin', 'team_lead'],
    defaultRole: 'social_worker',
    canSwitchFrom: true,
    crossDomainAccess: false,
  },
  pathPrefix: '/adults',
  sortOrder: 2,
};

/**
 * Housing Directorate configuration
 */
const housingConfig: DomainConfig = {
  id: 'housing',
  name: 'Housing Directorate',
  shortName: 'Housing',
  description: 'Housing management, repairs, and tenant services',
  authorityLabel: 'Royal Borough of Kensington & Chelsea',
  personaLabel: 'RBKC • Housing',
  icon: 'Home',
  status: 'pilot',
  branding: {
    primary: '#F28E00',
    accent: '#3BA08D',
    gradient: 'linear-gradient(135deg, #F28E00 0%, #FFB347 100%)',
    primaryDark: '#d97d00',
    className: 'domain-housing',
  },
  navigation: [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'LayoutDashboard',
      primary: true,
    },
    {
      label: 'Inspections',
      href: '/meetings',
      icon: 'ClipboardCheck',
      primary: true,
    },
    {
      label: 'Capture',
      href: '/capture',
      icon: 'Mic',
      primary: true,
    },
    {
      label: 'Properties',
      href: '/properties',
      icon: 'Building2',
    },
    {
      label: 'Tenants',
      href: '/tenants',
      icon: 'Users',
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: 'FileBarChart',
      permission: 'read:all',
    },
  ],
  features: {
    modules: [
      'smart_capture',
      'transcription',
      'templates',
      'offline_mode',
      'export_pdf',
    ],
    templates: [
      'property_inspection',
      'tenant_meeting',
      'repairs_assessment',
      'estate_walkabout',
    ],
    flags: {
      aiInsights: false,
      smartCapture: true,
      housingPilot: true,
    },
    integrations: ['northgate', 'sharepoint'],
  },
  permissions: {
    allowedRoles: ['housing_officer', 'manager', 'admin'],
    defaultRole: 'housing_officer',
    canSwitchFrom: true,
    crossDomainAccess: false,
  },
  pathPrefix: '/housing',
  sortOrder: 3,
};

/**
 * Corporate Services configuration
 */
const corporateConfig: DomainConfig = {
  id: 'corporate',
  name: 'Corporate Services',
  shortName: 'Corporate',
  description: 'Administration, HR, and organizational support',
  authorityLabel: 'Westminster City Council',
  personaLabel: 'Westminster • Corporate',
  icon: 'Building',
  status: 'active',
  branding: {
    primary: '#333333',
    accent: '#666666',
    gradient: 'linear-gradient(135deg, #333333 0%, #555555 100%)',
    primaryDark: '#444444',
    className: 'domain-corporate',
  },
  navigation: [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'LayoutDashboard',
      primary: true,
    },
    {
      label: 'Meetings',
      href: '/meetings',
      icon: 'Calendar',
      primary: true,
    },
    {
      label: 'Capture',
      href: '/capture',
      icon: 'Mic',
      primary: true,
    },
    {
      label: 'Admin',
      href: '/admin',
      icon: 'Settings',
      permission: 'admin:config',
    },
  ],
  features: {
    modules: [
      'smart_capture',
      'transcription',
      'templates',
      'audit_log',
      'analytics',
    ],
    templates: [
      'meeting_minutes',
      'supervision',
      'one_to_one',
    ],
    flags: {
      aiInsights: true,
      smartCapture: true,
    },
    integrations: ['sharepoint', 'teams'],
  },
  permissions: {
    allowedRoles: ['admin', 'manager', 'support'],
    defaultRole: 'support',
    canSwitchFrom: true,
    crossDomainAccess: true,
  },
  pathPrefix: '/corporate',
  sortOrder: 4,
};

/**
 * Education Services configuration
 */
const educationConfig: DomainConfig = {
  id: 'education',
  name: 'Education Services',
  shortName: 'Education',
  description: 'Schools support, SEND, and education welfare',
  authorityLabel: 'Westminster City Council',
  personaLabel: 'Westminster • Education',
  icon: 'GraduationCap',
  status: 'coming_soon',
  branding: {
    primary: '#1a5f7a',
    accent: '#57c5b6',
    gradient: 'linear-gradient(135deg, #1a5f7a 0%, #2980b9 100%)',
    primaryDark: '#236b8e',
    className: 'domain-education',
  },
  navigation: [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'LayoutDashboard',
      primary: true,
    },
    {
      label: 'SEND Reviews',
      href: '/meetings',
      icon: 'FileCheck',
      primary: true,
    },
    {
      label: 'Capture',
      href: '/capture',
      icon: 'Mic',
      primary: true,
    },
    {
      label: 'Schools',
      href: '/schools',
      icon: 'School',
    },
  ],
  features: {
    modules: [
      'smart_capture',
      'transcription',
      'templates',
    ],
    templates: [
      'ehcp_review',
      'school_visit',
      'parent_meeting',
    ],
    flags: {
      aiInsights: false,
      smartCapture: true,
    },
    integrations: ['synergy', 'sharepoint'],
  },
  permissions: {
    allowedRoles: ['social_worker', 'manager', 'admin'],
    defaultRole: 'social_worker',
    canSwitchFrom: true,
    crossDomainAccess: false,
  },
  pathPrefix: '/education',
  sortOrder: 5,
};

/**
 * Health Integration configuration
 */
const healthConfig: DomainConfig = {
  id: 'health',
  name: 'Health Integration',
  shortName: 'Health',
  description: 'NHS integration and joint health/social care services',
  authorityLabel: 'NHS Northwest London ICB',
  personaLabel: 'NWL ICB • Health',
  icon: 'Stethoscope',
  status: 'coming_soon',
  branding: {
    primary: '#005eb8',
    accent: '#41b6e6',
    gradient: 'linear-gradient(135deg, #005eb8 0%, #0072ce 100%)',
    primaryDark: '#0072ce',
    className: 'domain-health',
  },
  navigation: [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'LayoutDashboard',
      primary: true,
    },
    {
      label: 'Assessments',
      href: '/meetings',
      icon: 'ClipboardList',
      primary: true,
    },
    {
      label: 'Capture',
      href: '/capture',
      icon: 'Mic',
      primary: true,
    },
    {
      label: 'Patients',
      href: '/patients',
      icon: 'Users',
    },
  ],
  features: {
    modules: [
      'smart_capture',
      'transcription',
      'templates',
    ],
    templates: [
      'chc_assessment',
      'mdt_meeting',
      'discharge_planning',
    ],
    flags: {
      aiInsights: false,
      smartCapture: true,
    },
    integrations: ['nhs_spine', 'emis', 'systmone'],
  },
  permissions: {
    allowedRoles: ['social_worker', 'manager', 'admin'],
    defaultRole: 'social_worker',
    canSwitchFrom: true,
    crossDomainAccess: true,
  },
  pathPrefix: '/health',
  sortOrder: 6,
};

// ============================================================================
// Domain Registry
// ============================================================================

/**
 * All domain configurations
 */
export const DOMAIN_CONFIGS: Record<ServiceDomain, DomainConfig> = {
  children: childrenConfig,
  adults: adultsConfig,
  housing: housingConfig,
  corporate: corporateConfig,
  education: educationConfig,
  health: healthConfig,
};

/**
 * Get all domain configurations as an array, sorted by sortOrder
 */
export function getAllDomains(): DomainConfig[] {
  return Object.values(DOMAIN_CONFIGS).sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get active domain configurations only
 */
export function getActiveDomains(): DomainConfig[] {
  return getAllDomains().filter(
    (d) => d.status === 'active' || d.status === 'pilot'
  );
}

/**
 * Get domain configuration by ID
 */
export function getDomainConfig(domainId: ServiceDomain): DomainConfig {
  const config = DOMAIN_CONFIGS[domainId];
  if (!config) {
    throw new Error(`Unknown domain: ${domainId}`);
  }
  return config;
}

/**
 * Get domain configuration by path prefix
 */
export function getDomainByPath(path: string): DomainConfig | null {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return (
    getAllDomains().find((d) => normalizedPath.startsWith(d.pathPrefix)) ?? null
  );
}

/**
 * Check if a domain is available for a user role
 */
export function isDomainAvailableForRole(
  domainId: ServiceDomain,
  role: string
): boolean {
  const config = DOMAIN_CONFIGS[domainId];
  if (!config) return false;
  if (config.status === 'disabled' || config.status === 'coming_soon') {
    return false;
  }
  return config.permissions.allowedRoles.includes(role);
}

/**
 * Get navigation items for a domain, filtered by permissions
 */
export function getDomainNavigation(
  domainId: ServiceDomain,
  userPermissions: string[] = []
): DomainNavItem[] {
  const config = getDomainConfig(domainId);
  return config.navigation.filter((item) => {
    if (!item.permission) return true;
    return userPermissions.includes(item.permission);
  });
}

/**
 * Default domain for new users or fallback
 */
export const DEFAULT_DOMAIN: ServiceDomain = 'children';

/**
 * Storage key for persisting domain preference
 */
export const DOMAIN_STORAGE_KEY = 'uca_domain_preference';

/**
 * URL parameter name for domain
 */
export const DOMAIN_URL_PARAM = 'domain';

// ============================================================================
// Domain Path Utilities
// ============================================================================

/**
 * Build a full path including domain prefix
 */
export function buildDomainPath(
  domainId: ServiceDomain,
  relativePath: string
): string {
  const config = getDomainConfig(domainId);
  const cleanPath = relativePath.startsWith('/')
    ? relativePath
    : `/${relativePath}`;
  return `${config.pathPrefix}${cleanPath}`;
}

/**
 * Strip domain prefix from a path
 */
export function stripDomainPrefix(path: string): string {
  for (const config of getAllDomains()) {
    if (path.startsWith(config.pathPrefix)) {
      return path.slice(config.pathPrefix.length) || '/';
    }
  }
  return path;
}

/**
 * Replace domain prefix in a path
 */
export function replaceDomainInPath(
  path: string,
  newDomainId: ServiceDomain
): string {
  const relativePath = stripDomainPrefix(path);
  return buildDomainPath(newDomainId, relativePath);
}

// ============================================================================
// Domain Status Utilities
// ============================================================================

/**
 * Get human-readable status label
 */
export function getDomainStatusLabel(status: DomainStatus): string {
  const labels: Record<DomainStatus, string> = {
    active: 'Active',
    pilot: 'Pilot',
    beta: 'Beta',
    coming_soon: 'Coming Soon',
    disabled: 'Unavailable',
  };
  return labels[status];
}

/**
 * Get status badge color class
 */
export function getDomainStatusColor(status: DomainStatus): string {
  const colors: Record<DomainStatus, string> = {
    active: 'bg-green-100 text-green-700',
    pilot: 'bg-blue-100 text-blue-700',
    beta: 'bg-purple-100 text-purple-700',
    coming_soon: 'bg-amber-100 text-amber-700',
    disabled: 'bg-gray-100 text-gray-500',
  };
  return colors[status];
}
