/**
 * Admin Module Definition
 * 
 * Provides administration panel for system configuration,
 * user management, and module control.
 */

import { Settings, Users, Building, Shield, Key, Activity, Database } from 'lucide-react';
import type { ModuleDefinition } from '../types';

export const adminModule: ModuleDefinition = {
  id: 'admin',
  name: 'Administration',
  description: 'System administration panel. Manage users, configure modules, and monitor system health.',
  version: '1.0.0',
  defaultStatus: 'enabled',
  icon: Settings,
  category: 'admin',
  availableDomains: 'all',
  isCore: true, // Admin is a core module
  tags: ['admin', 'configuration', 'users', 'management'],

  routes: [
    {
      id: 'admin-dashboard',
      path: '/admin',
      label: 'Administration',
      icon: Settings,
      description: 'System administration dashboard',
      layout: 'admin',
      showInNav: true,
      navOrder: 90,
      auth: {
        requiresAuth: true,
        allowedRoles: ['admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'admin-users',
      path: '/admin/users',
      label: 'Users & Teams',
      icon: Users,
      description: 'Manage users and teams',
      layout: 'admin',
      showInNav: true,
      navOrder: 91,
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager', 'admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'admin-modules',
      path: '/admin/modules',
      label: 'Modules',
      icon: Building,
      description: 'Configure system modules',
      layout: 'admin',
      showInNav: true,
      navOrder: 92,
      auth: {
        requiresAuth: true,
        allowedRoles: ['admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'admin-roles',
      path: '/admin/roles',
      label: 'Roles & Permissions',
      icon: Shield,
      description: 'Manage roles and permissions',
      layout: 'admin',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'admin-api-keys',
      path: '/admin/api-keys',
      label: 'API Keys',
      icon: Key,
      description: 'Manage API keys and integrations',
      layout: 'admin',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'admin-audit',
      path: '/admin/audit',
      label: 'Audit Log',
      icon: Activity,
      description: 'View system audit log',
      layout: 'admin',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'admin-data',
      path: '/admin/data',
      label: 'Data Management',
      icon: Database,
      description: 'Manage data retention and exports',
      layout: 'admin',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['admin'],
        allowedDomains: [],
      },
    },
  ],

  permissions: [
    {
      id: 'admin:access',
      name: 'Access Administration',
      description: 'Ability to access the admin panel',
      defaultRoles: ['admin'],
    },
    {
      id: 'admin:manage-users',
      name: 'Manage Users',
      description: 'Ability to create, edit, and delete users',
      defaultRoles: ['admin'],
    },
    {
      id: 'admin:manage-teams',
      name: 'Manage Teams',
      description: 'Ability to create and manage teams',
      defaultRoles: ['manager', 'admin'],
    },
    {
      id: 'admin:manage-modules',
      name: 'Manage Modules',
      description: 'Ability to enable/disable modules',
      defaultRoles: ['admin'],
    },
    {
      id: 'admin:manage-roles',
      name: 'Manage Roles',
      description: 'Ability to define and assign roles',
      defaultRoles: ['admin'],
    },
    {
      id: 'admin:view-audit',
      name: 'View Audit Log',
      description: 'Ability to view the audit log',
      defaultRoles: ['admin'],
    },
    {
      id: 'admin:manage-data',
      name: 'Manage Data',
      description: 'Ability to manage data retention and exports',
      defaultRoles: ['admin'],
    },
  ],

  dependencies: [],

  hooks: {
    onEnable: async () => {
      console.log('[Admin Module] Enabled');
    },
    onDisable: async () => {
      // Core modules cannot be disabled
      console.log('[Admin Module] Cannot disable core module');
    },
  },

  metadata: {
    auditLogRetentionDays: 365,
    sessionTimeoutMinutes: 30,
    maxApiKeysPerUser: 5,
  },
};
