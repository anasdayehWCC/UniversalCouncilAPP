/**
 * Navigation Configuration
 * 
 * Defines all navigation items grouped by section with role-based visibility.
 * This is the single source of truth for the application's navigation structure.
 */

import {
  Home,
  FileText,
  Mic,
  Upload,
  Clipboard,
  CheckSquare,
  BarChart,
  Users,
  Settings,
  Building,
  Bell,
  HelpCircle,
  Shield,
  Clock,
  Search,
  FolderOpen,
  MessageSquare,
  ClipboardCheck,
  Layers,
  Database,
  Activity,
  PieChart,
  Calendar,
  BookOpen,
  Zap,
  Plus,
} from 'lucide-react';

import type {
  NavigationConfig,
  NavSection,
  NavItem,
  QuickAction,
  FooterItem,
} from './types';
import type { UserRole } from '@/config/domains';

/**
 * All roles for convenience
 */
const ALL_ROLES: UserRole[] = ['social_worker', 'manager', 'admin', 'housing_officer'];

/**
 * Frontline worker roles
 */
const FRONTLINE_ROLES: UserRole[] = ['social_worker', 'housing_officer'];

/**
 * Management roles
 */
const MANAGEMENT_ROLES: UserRole[] = ['manager', 'admin'];

/**
 * Capture section - Recording and uploading
 */
const captureSection: NavSection = {
  id: 'capture',
  title: 'Capture',
  order: 1,
  collapsible: true,
  icon: Mic,
  showFor: [...FRONTLINE_ROLES, 'manager'],
  items: [
    {
      id: 'smart-capture',
      label: 'Smart Capture',
      href: '/record',
      icon: Mic,
      description: 'AI-powered audio recording',
      roles: FRONTLINE_ROLES,
      featureFlag: 'smartCapture',
      badge: 'Live',
      badgeVariant: 'success',
      order: 1,
    },
    {
      id: 'upload',
      label: 'Upload Audio',
      href: '/upload',
      icon: Upload,
      description: 'Upload existing recordings',
      roles: FRONTLINE_ROLES,
      order: 2,
    },
    {
      id: 'batch-upload',
      label: 'Batch Upload',
      href: '/upload/batch',
      icon: FolderOpen,
      description: 'Upload multiple files at once',
      roles: MANAGEMENT_ROLES,
      permissions: ['bulk_operations'],
      order: 3,
    },
  ],
};

/**
 * Notes section - View and manage notes/transcriptions
 */
const notesSection: NavSection = {
  id: 'notes',
  title: 'Notes',
  order: 2,
  collapsible: true,
  icon: FileText,
  showFor: ALL_ROLES,
  items: [
    {
      id: 'my-notes',
      label: 'My Notes',
      href: '/my-notes',
      icon: FileText,
      description: 'View your transcriptions and minutes',
      roles: FRONTLINE_ROLES,
      order: 1,
    },
    {
      id: 'team-notes',
      label: 'Team Notes',
      href: '/my-notes',
      icon: Users,
      description: 'View team transcriptions',
      roles: ['manager'],
      order: 1,
    },
    {
      id: 'all-notes',
      label: 'All Notes',
      href: '/admin/notes',
      icon: Database,
      description: 'View all transcriptions',
      roles: ['admin'],
      permissions: ['view_transcriptions'],
      order: 1,
    },
    {
      id: 'templates',
      label: 'Templates',
      href: '/templates',
      icon: Clipboard,
      description: 'Minute templates',
      roles: ALL_ROLES,
      order: 2,
    },
    {
      id: 'schedule',
      label: 'Scheduled',
      href: '/schedule',
      icon: Calendar,
      description: 'Scheduled recordings',
      roles: ALL_ROLES,
      featureFlag: 'scheduledRecordings',
      badge: 'Beta',
      badgeVariant: 'info',
      order: 3,
    },
  ],
};

/**
 * Review section - Quality assurance workflows
 */
const reviewSection: NavSection = {
  id: 'review',
  title: 'Review',
  order: 3,
  collapsible: true,
  icon: CheckSquare,
  showFor: MANAGEMENT_ROLES,
  items: [
    {
      id: 'review-queue',
      label: 'Review Queue',
      href: '/review-queue',
      icon: ClipboardCheck,
      description: 'Items awaiting review',
      roles: MANAGEMENT_ROLES,
      permissions: ['approve_minutes'],
      order: 1,
    },
    {
      id: 'qa-dashboard',
      label: 'QA Dashboard',
      href: '/qa',
      icon: Shield,
      description: 'Quality assurance metrics',
      roles: ['manager', 'admin'],
      permissions: ['approve_minutes'],
      featureFlag: 'qaDashboard',
      order: 2,
    },
    {
      id: 'approval-history',
      label: 'Approval History',
      href: '/review/history',
      icon: Clock,
      description: 'Past approvals and rejections',
      roles: MANAGEMENT_ROLES,
      order: 3,
    },
  ],
};

/**
 * Insights section - Analytics and reporting
 */
const insightsSection: NavSection = {
  id: 'insights',
  title: 'Insights',
  order: 4,
  collapsible: true,
  icon: BarChart,
  showFor: MANAGEMENT_ROLES,
  items: [
    {
      id: 'team-insights',
      label: 'Team Insights',
      href: '/insights',
      icon: BarChart,
      description: 'Team performance metrics',
      roles: ['manager'],
      featureFlag: 'aiInsights',
      order: 1,
    },
    {
      id: 'org-analytics',
      label: 'Organization Analytics',
      href: '/insights',
      icon: PieChart,
      description: 'Organization-wide analytics',
      roles: ['admin'],
      featureFlag: 'aiInsights',
      order: 1,
    },
    {
      id: 'usage-reports',
      label: 'Usage Reports',
      href: '/insights/usage',
      icon: Activity,
      description: 'Platform usage statistics',
      roles: ['admin'],
      permissions: ['view_insights', 'export_insights'],
      order: 2,
    },
    {
      id: 'export-data',
      label: 'Export Data',
      href: '/insights/export',
      icon: Database,
      description: 'Export analytics data',
      roles: ['admin'],
      permissions: ['export_insights'],
      order: 3,
    },
  ],
};

/**
 * Admin section - System administration
 */
const adminSection: NavSection = {
  id: 'admin',
  title: 'Administration',
  order: 5,
  collapsible: true,
  icon: Settings,
  showFor: ['admin'],
  items: [
    {
      id: 'configuration',
      label: 'Configuration',
      href: '/admin',
      icon: Settings,
      description: 'System settings',
      roles: ['admin'],
      permissions: ['manage_settings'],
      order: 1,
    },
    {
      id: 'modules',
      label: 'Modules',
      href: '/admin/modules',
      icon: Building,
      description: 'Enable/disable features',
      roles: ['admin'],
      permissions: ['manage_modules'],
      order: 2,
    },
    {
      id: 'users',
      label: 'Users & Teams',
      href: '/admin/users',
      icon: Users,
      description: 'Manage users and teams',
      roles: ['manager', 'admin'],
      permissions: ['manage_users'],
      order: 3,
    },
    {
      id: 'templates-admin',
      label: 'Template Manager',
      href: '/admin/templates',
      icon: Layers,
      description: 'Manage minute templates',
      roles: ['admin'],
      permissions: ['manage_templates'],
      order: 4,
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      href: '/admin/audit',
      icon: BookOpen,
      description: 'View system audit logs',
      roles: ['admin'],
      permissions: ['view_audit_logs'],
      order: 5,
    },
  ],
};

/**
 * Footer items - Always visible at bottom of navigation
 */
const footerItems: FooterItem[] = [
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ALL_ROLES,
  },
  {
    id: 'help',
    label: 'Help & Support',
    href: '/help',
    icon: HelpCircle,
    roles: ALL_ROLES,
  },
];

/**
 * Quick actions - Role-specific action buttons
 */
const quickActions: QuickAction[] = [
  {
    id: 'new-recording',
    label: 'New Recording',
    href: '/record',
    icon: Mic,
    roles: FRONTLINE_ROLES,
    variant: 'primary',
    isPrimary: true,
    shortcut: 'N',
  },
  {
    id: 'upload-audio',
    label: 'Upload',
    href: '/upload',
    icon: Upload,
    roles: FRONTLINE_ROLES,
    variant: 'secondary',
    shortcut: 'U',
  },
  {
    id: 'search',
    label: 'Search',
    href: '/search',
    icon: Search,
    roles: ALL_ROLES,
    variant: 'ghost',
    shortcut: '/',
  },
  {
    id: 'review-next',
    label: 'Review Next',
    href: '/review-queue',
    icon: CheckSquare,
    roles: MANAGEMENT_ROLES,
    variant: 'primary',
    isPrimary: true,
  },
  {
    id: 'create-template',
    label: 'New Template',
    href: '/templates/new',
    icon: Plus,
    roles: ['admin'],
    variant: 'secondary',
  },
  {
    id: 'quick-insights',
    label: 'Quick Insights',
    href: '/insights',
    icon: Zap,
    roles: MANAGEMENT_ROLES,
    variant: 'ghost',
  },
];

/**
 * Complete navigation configuration
 */
export const navigationConfig: NavigationConfig = {
  sections: [
    captureSection,
    notesSection,
    reviewSection,
    insightsSection,
    adminSection,
  ],
  footerItems,
  quickActions,
  domainOverrides: {
    housing: {
      sections: [
        {
          ...captureSection,
          items: captureSection.items.map((item) =>
            item.id === 'templates'
              ? { ...item, featureFlag: 'housingPilot' }
              : item
          ),
        },
        notesSection,
        // Housing doesn't have insights section
      ],
    },
    corporate: {
      sections: [
        adminSection,
        insightsSection,
      ],
      quickActions: quickActions.filter(
        (action) => !['new-recording', 'upload-audio'].includes(action.id)
      ),
    },
  },
};

/**
 * Get default expanded sections for a role
 */
export function getDefaultExpandedSections(role: UserRole): string[] {
  switch (role) {
    case 'social_worker':
    case 'housing_officer':
      return ['capture', 'notes'];
    case 'manager':
      return ['review', 'notes'];
    case 'admin':
      return ['admin', 'insights'];
    default:
      return [];
  }
}

/**
 * Get home route for a role
 */
export function getHomeRoute(role: UserRole): string {
  switch (role) {
    case 'social_worker':
    case 'housing_officer':
      return '/';
    case 'manager':
      return '/review-queue';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
}

export default navigationConfig;
