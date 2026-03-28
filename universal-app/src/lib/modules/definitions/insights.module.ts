/**
 * Insights Module Definition
 * 
 * Provides analytics dashboard and AI-powered insights.
 * Shows team performance, trends, and recommendations.
 */

import { BarChart, TrendingUp, Users, Clock, AlertTriangle, Lightbulb } from 'lucide-react';
import type { ModuleDefinition } from '../types';

export const insightsModule: ModuleDefinition = {
  id: 'insights',
  name: 'Team Insights',
  description: 'Analytics dashboard with AI-powered insights. Track team performance, identify trends, and get actionable recommendations.',
  version: '1.0.0',
  defaultStatus: 'enabled',
  icon: BarChart,
  category: 'analytics',
  availableDomains: ['children', 'adults'],
  isCore: false,
  tags: ['analytics', 'insights', 'dashboard', 'ai', 'reports'],

  routes: [
    {
      id: 'insights-dashboard',
      path: '/insights',
      label: 'Team Insights',
      icon: BarChart,
      description: 'View team analytics and insights',
      layout: 'default',
      showInNav: true,
      navOrder: 60,
      featureFlag: 'aiInsights',
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager', 'admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'insights-trends',
      path: '/insights/trends',
      label: 'Trends',
      icon: TrendingUp,
      description: 'View trend analysis',
      layout: 'default',
      showInNav: false,
      featureFlag: 'aiInsights',
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager', 'admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'insights-team',
      path: '/insights/team',
      label: 'Team Performance',
      icon: Users,
      description: 'View team performance metrics',
      layout: 'default',
      showInNav: false,
      featureFlag: 'aiInsights',
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager', 'admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'insights-sla',
      path: '/insights/sla',
      label: 'SLA Tracking',
      icon: Clock,
      description: 'Track SLA compliance',
      layout: 'default',
      showInNav: false,
      featureFlag: 'aiInsights',
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager', 'admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'insights-alerts',
      path: '/insights/alerts',
      label: 'Alerts',
      icon: AlertTriangle,
      description: 'View system alerts and warnings',
      layout: 'default',
      showInNav: false,
      featureFlag: 'aiInsights',
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager', 'admin'],
        allowedDomains: [],
      },
    },
    {
      id: 'insights-recommendations',
      path: '/insights/recommendations',
      label: 'AI Recommendations',
      icon: Lightbulb,
      description: 'View AI-generated recommendations',
      layout: 'default',
      showInNav: false,
      featureFlag: 'aiInsights',
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager', 'admin'],
        allowedDomains: [],
      },
    },
  ],

  permissions: [
    {
      id: 'insights:view',
      name: 'View Insights',
      description: 'Ability to view the insights dashboard',
      defaultRoles: ['manager', 'admin'],
    },
    {
      id: 'insights:view-team',
      name: 'View Team Analytics',
      description: 'Ability to view team-level analytics',
      defaultRoles: ['manager', 'admin'],
    },
    {
      id: 'insights:view-individual',
      name: 'View Individual Analytics',
      description: 'Ability to view individual performance metrics',
      defaultRoles: ['manager'],
    },
    {
      id: 'insights:export',
      name: 'Export Analytics',
      description: 'Ability to export analytics reports',
      defaultRoles: ['manager', 'admin'],
    },
    {
      id: 'insights:configure',
      name: 'Configure Insights',
      description: 'Ability to configure dashboard and alerts',
      defaultRoles: ['admin'],
    },
  ],

  dependencies: [
    {
      moduleId: 'minutes',
      optional: false,
      reason: 'Insights are generated from minutes data',
    },
    {
      moduleId: 'review',
      optional: true,
      reason: 'Review data enhances insights accuracy',
    },
  ],

  hooks: {
    onEnable: async () => {
      console.log('[Insights Module] Enabled - Analytics activated');
    },
    onDisable: async () => {
      console.log('[Insights Module] Disabled - Analytics deactivated');
    },
  },

  metadata: {
    refreshIntervalMinutes: 15,
    historicalDataMonths: 12,
    aiModelVersion: 'gpt-4o-mini',
    supportedExports: ['pdf', 'csv', 'xlsx'],
  },
};
