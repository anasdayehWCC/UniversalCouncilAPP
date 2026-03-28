/**
 * Templates Module Definition
 * 
 * Manages minute templates for different meeting types.
 * Templates provide structure and consistency across minutes.
 */

import { Clipboard, Plus, Edit, Copy, Archive, Tag } from 'lucide-react';
import type { ModuleDefinition } from '../types';

export const templatesModule: ModuleDefinition = {
  id: 'templates',
  name: 'Templates',
  description: 'Manage minute templates for different meeting and visit types. Templates ensure consistency and compliance.',
  version: '1.0.0',
  defaultStatus: 'enabled',
  icon: Clipboard,
  category: 'utility',
  availableDomains: 'all',
  isCore: false,
  tags: ['templates', 'formatting', 'structure', 'compliance'],

  routes: [
    {
      id: 'templates-list',
      path: '/templates',
      label: 'Templates',
      icon: Clipboard,
      description: 'View and manage templates',
      layout: 'default',
      showInNav: true,
      navOrder: 45,
      auth: {
        requiresAuth: true,
        allowedRoles: ['social_worker', 'housing_officer', 'manager', 'admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'templates-create',
      path: '/templates/new',
      label: 'Create Template',
      icon: Plus,
      description: 'Create a new template',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager', 'admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'templates-edit',
      path: '/templates/[templateId]/edit',
      label: 'Edit Template',
      icon: Edit,
      description: 'Edit an existing template',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager', 'admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'templates-preview',
      path: '/templates/[templateId]/preview',
      label: 'Preview Template',
      icon: Clipboard,
      description: 'Preview a template',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['social_worker', 'housing_officer', 'manager', 'admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'templates-duplicate',
      path: '/templates/[templateId]/duplicate',
      label: 'Duplicate Template',
      icon: Copy,
      description: 'Create a copy of a template',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager', 'admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'templates-archive',
      path: '/templates/archive',
      label: 'Archived Templates',
      icon: Archive,
      description: 'View archived templates',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager', 'admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'templates-categories',
      path: '/templates/categories',
      label: 'Template Categories',
      icon: Tag,
      description: 'Manage template categories',
      layout: 'default',
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
      id: 'templates:view',
      name: 'View Templates',
      description: 'Ability to view and use templates',
      defaultRoles: ['social_worker', 'housing_officer', 'manager', 'admin'],
    },
    {
      id: 'templates:create',
      name: 'Create Templates',
      description: 'Ability to create new templates',
      defaultRoles: ['manager', 'admin'],
    },
    {
      id: 'templates:edit',
      name: 'Edit Templates',
      description: 'Ability to edit existing templates',
      defaultRoles: ['manager', 'admin'],
    },
    {
      id: 'templates:delete',
      name: 'Delete Templates',
      description: 'Ability to delete/archive templates',
      defaultRoles: ['admin'],
    },
    {
      id: 'templates:manage-categories',
      name: 'Manage Categories',
      description: 'Ability to manage template categories',
      defaultRoles: ['admin'],
    },
    {
      id: 'templates:set-default',
      name: 'Set Default Templates',
      description: 'Ability to set domain-wide default templates',
      defaultRoles: ['admin'],
    },
  ],

  dependencies: [],

  hooks: {
    onEnable: async () => {
      console.log('[Templates Module] Enabled');
    },
    onDisable: async () => {
      console.log('[Templates Module] Disabled');
    },
  },

  metadata: {
    maxTemplatesPerTenant: 100,
    supportedFieldTypes: ['text', 'date', 'select', 'multiselect', 'checkbox', 'textarea', 'richtext'],
    versioningEnabled: true,
    inheritanceEnabled: true,
  },
};
