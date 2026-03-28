/**
 * Minutes Module Definition
 * 
 * Handles minute generation, editing, and management.
 * This is a core module for social care documentation.
 */

import { FileText, Edit, Clock, Send, History } from 'lucide-react';
import type { ModuleDefinition } from '../types';

export const minutesModule: ModuleDefinition = {
  id: 'minutes',
  name: 'Minutes',
  description: 'Generate, edit, and manage meeting minutes from transcriptions. Supports templates and AI-assisted formatting.',
  version: '1.0.0',
  defaultStatus: 'enabled',
  icon: FileText,
  category: 'output',
  availableDomains: 'all',
  isCore: true, // Core functionality - always enabled
  tags: ['minutes', 'documentation', 'output', 'ai', 'templates'],

  routes: [
    {
      id: 'my-notes',
      path: '/my-notes',
      label: 'My Notes',
      icon: FileText,
      description: 'View and manage your notes and minutes',
      layout: 'default',
      showInNav: true,
      navOrder: 20,
      auth: {
        requiresAuth: true,
        allowedRoles: ['social_worker', 'housing_officer', 'manager'],
        allowedDomains: [],
      },
    },
    {
      id: 'minute-editor',
      path: '/minutes/[minuteId]',
      label: 'Edit Minute',
      icon: Edit,
      description: 'Edit a specific minute',
      layout: 'fullscreen',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['social_worker', 'housing_officer', 'manager'],
        allowedDomains: [],
      },
    },
    {
      id: 'minute-preview',
      path: '/minutes/[minuteId]/preview',
      label: 'Preview Minute',
      icon: FileText,
      description: 'Preview minute before submission',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['social_worker', 'housing_officer', 'manager'],
        allowedDomains: [],
      },
    },
    {
      id: 'minute-submit',
      path: '/minutes/[minuteId]/submit',
      label: 'Submit Minute',
      icon: Send,
      description: 'Submit minute for review',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['social_worker', 'housing_officer'],
        allowedDomains: [],
      },
    },
    {
      id: 'minute-history',
      path: '/minutes/[minuteId]/history',
      label: 'Minute History',
      icon: History,
      description: 'View revision history',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['social_worker', 'housing_officer', 'manager'],
        allowedDomains: [],
      },
    },
    {
      id: 'drafts',
      path: '/drafts',
      label: 'Drafts',
      icon: Clock,
      description: 'View draft minutes',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['social_worker', 'housing_officer'],
        allowedDomains: [],
      },
    },
  ],

  permissions: [
    {
      id: 'minutes:create',
      name: 'Create Minutes',
      description: 'Ability to create new minutes',
      defaultRoles: ['social_worker', 'housing_officer'],
    },
    {
      id: 'minutes:edit',
      name: 'Edit Minutes',
      description: 'Ability to edit own minutes',
      defaultRoles: ['social_worker', 'housing_officer'],
    },
    {
      id: 'minutes:edit-any',
      name: 'Edit Any Minutes',
      description: 'Ability to edit any minutes (manager override)',
      defaultRoles: ['manager', 'admin'],
    },
    {
      id: 'minutes:submit',
      name: 'Submit Minutes',
      description: 'Ability to submit minutes for review',
      defaultRoles: ['social_worker', 'housing_officer'],
    },
    {
      id: 'minutes:delete',
      name: 'Delete Minutes',
      description: 'Ability to delete own draft minutes',
      defaultRoles: ['social_worker', 'housing_officer'],
    },
    {
      id: 'minutes:view-history',
      name: 'View Revision History',
      description: 'Ability to view minute revision history',
      defaultRoles: ['social_worker', 'housing_officer', 'manager'],
    },
  ],

  dependencies: [
    {
      moduleId: 'transcription',
      optional: true,
      reason: 'Minutes can be created from transcriptions',
    },
    {
      moduleId: 'templates',
      optional: true,
      reason: 'Templates provide formatting structure',
    },
  ],

  hooks: {
    onEnable: async () => {
      console.log('[Minutes Module] Enabled');
    },
    onDisable: async () => {
      // Core modules cannot be disabled, but hook is defined for completeness
      console.log('[Minutes Module] Cannot disable core module');
    },
  },

  metadata: {
    supportedExports: ['pdf', 'docx', 'html'],
    aiAssisted: true,
    autoSaveIntervalSeconds: 30,
    maxRevisions: 100,
  },
};
