/**
 * Recording Module Definition
 * 
 * Handles audio recording and capture functionality.
 * This module provides the Smart Capture feature for recording
 * meetings, visits, and other appointments.
 */

import { Mic, MicOff, Settings } from 'lucide-react';
import type { ModuleDefinition } from '../types';

export const recordingModule: ModuleDefinition = {
  id: 'recording',
  name: 'Smart Capture',
  description: 'Audio recording and capture functionality for meetings and visits. Supports offline recording with automatic sync.',
  version: '1.0.0',
  defaultStatus: 'enabled',
  icon: Mic,
  category: 'capture',
  availableDomains: ['children', 'adults', 'housing'],
  isCore: false,
  tags: ['audio', 'recording', 'capture', 'offline'],

  routes: [
    {
      id: 'record',
      path: '/record',
      label: 'Smart Capture',
      icon: Mic,
      description: 'Record audio for transcription',
      layout: 'default',
      showInNav: true,
      navOrder: 30,
      featureFlag: 'smartCapture',
      auth: {
        requiresAuth: true,
        allowedRoles: ['social_worker', 'housing_officer'],
        allowedDomains: [],
      },
    },
    {
      id: 'record-settings',
      path: '/record/settings',
      label: 'Recording Settings',
      icon: Settings,
      description: 'Configure recording preferences',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['social_worker', 'housing_officer', 'manager'],
        allowedDomains: [],
      },
    },
    {
      id: 'record-offline-queue',
      path: '/record/offline-queue',
      label: 'Offline Recordings',
      icon: MicOff,
      description: 'View pending offline recordings',
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
      id: 'recording:create',
      name: 'Create Recordings',
      description: 'Ability to record audio',
      defaultRoles: ['social_worker', 'housing_officer'],
    },
    {
      id: 'recording:delete',
      name: 'Delete Recordings',
      description: 'Ability to delete own recordings',
      defaultRoles: ['social_worker', 'housing_officer'],
    },
    {
      id: 'recording:configure',
      name: 'Configure Recording Settings',
      description: 'Ability to change recording settings',
      defaultRoles: ['social_worker', 'housing_officer', 'manager'],
    },
  ],

  dependencies: [],

  hooks: {
    onEnable: async () => {
      console.log('[Recording Module] Enabled - Initializing audio capture');
      // Future: Initialize audio capture service
    },
    onDisable: async () => {
      console.log('[Recording Module] Disabled - Cleaning up audio resources');
      // Future: Clean up audio resources
    },
  },

  metadata: {
    requiresMediaAccess: true,
    supportsOffline: true,
    maxRecordingDurationMinutes: 180,
    supportedFormats: ['webm', 'wav'],
  },
};
