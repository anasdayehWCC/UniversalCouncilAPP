/**
 * Review Module Definition
 * 
 * Handles manager review queue and approval workflows.
 * Provides QA and oversight capabilities.
 */

import { CheckSquare, Clock, XCircle, CheckCircle, MessageSquare, Eye } from 'lucide-react';
import type { ModuleDefinition } from '../types';

export const reviewModule: ModuleDefinition = {
  id: 'review',
  name: 'Review Queue',
  description: 'Manager review queue for approving or returning submitted minutes. Supports feedback and revision workflows.',
  version: '1.0.0',
  defaultStatus: 'enabled',
  icon: CheckSquare,
  category: 'review',
  availableDomains: ['children', 'adults', 'housing'],
  isCore: false,
  tags: ['review', 'approval', 'qa', 'workflow', 'manager'],

  routes: [
    {
      id: 'review-queue',
      path: '/review-queue',
      label: 'Review Queue',
      icon: CheckSquare,
      description: 'Review pending submissions',
      layout: 'default',
      showInNav: true,
      navOrder: 50,
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager'],
        allowedDomains: [],
      },
    },
    {
      id: 'review-detail',
      path: '/review/[minuteId]',
      label: 'Review Detail',
      icon: Eye,
      description: 'Review a specific submission',
      layout: 'fullscreen',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager'],
        allowedDomains: [],
      },
    },
    {
      id: 'review-approve',
      path: '/review/[minuteId]/approve',
      label: 'Approve Submission',
      icon: CheckCircle,
      description: 'Approve a submission',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager'],
        allowedDomains: [],
      },
    },
    {
      id: 'review-return',
      path: '/review/[minuteId]/return',
      label: 'Return Submission',
      icon: XCircle,
      description: 'Return a submission for revisions',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager'],
        allowedDomains: [],
      },
    },
    {
      id: 'review-feedback',
      path: '/review/[minuteId]/feedback',
      label: 'Add Feedback',
      icon: MessageSquare,
      description: 'Add feedback to a submission',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager'],
        allowedDomains: [],
      },
    },
    {
      id: 'review-pending',
      path: '/review/pending',
      label: 'Pending Reviews',
      icon: Clock,
      description: 'View all pending reviews',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager'],
        allowedDomains: [],
      },
    },
  ],

  permissions: [
    {
      id: 'review:view-queue',
      name: 'View Review Queue',
      description: 'Ability to view the review queue',
      defaultRoles: ['manager'],
    },
    {
      id: 'review:approve',
      name: 'Approve Submissions',
      description: 'Ability to approve submitted minutes',
      defaultRoles: ['manager'],
    },
    {
      id: 'review:return',
      name: 'Return Submissions',
      description: 'Ability to return submissions for revision',
      defaultRoles: ['manager'],
    },
    {
      id: 'review:add-feedback',
      name: 'Add Feedback',
      description: 'Ability to add feedback to submissions',
      defaultRoles: ['manager'],
    },
    {
      id: 'review:bulk-actions',
      name: 'Bulk Review Actions',
      description: 'Ability to perform bulk approve/reject actions',
      defaultRoles: ['manager'],
    },
  ],

  dependencies: [
    {
      moduleId: 'minutes',
      optional: false,
      reason: 'Review module reviews submitted minutes',
    },
  ],

  hooks: {
    onEnable: async () => {
      console.log('[Review Module] Enabled - Review queue activated');
    },
    onDisable: async () => {
      console.log('[Review Module] Disabled - Review queue deactivated');
    },
  },

  metadata: {
    slaHours: 24, // Default SLA for reviews
    notificationsEnabled: true,
    escalationEnabled: true,
    bulkActionsEnabled: true,
  },
};
