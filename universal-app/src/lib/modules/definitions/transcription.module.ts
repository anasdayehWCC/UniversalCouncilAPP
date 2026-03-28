/**
 * Transcription Module Definition
 * 
 * Handles transcription processing of audio recordings.
 * Supports both real-time and batch transcription modes.
 */

import { FileText, Upload, Clock, Settings } from 'lucide-react';
import type { ModuleDefinition } from '../types';

export const transcriptionModule: ModuleDefinition = {
  id: 'transcription',
  name: 'Transcription',
  description: 'Audio-to-text transcription processing. Supports real-time and batch processing modes.',
  version: '1.0.0',
  defaultStatus: 'enabled',
  icon: FileText,
  category: 'processing',
  availableDomains: 'all',
  isCore: false,
  tags: ['transcription', 'speech-to-text', 'processing', 'ai'],

  routes: [
    {
      id: 'upload',
      path: '/upload',
      label: 'Upload',
      icon: Upload,
      description: 'Upload audio files for transcription',
      layout: 'default',
      showInNav: true,
      navOrder: 40,
      auth: {
        requiresAuth: true,
        allowedRoles: ['social_worker', 'housing_officer'],
        allowedDomains: [],
      },
    },
    {
      id: 'notes-workspace',
      path: '/my-notes',
      label: 'Notes Workspace',
      icon: Clock,
      description: 'View active notes, transcripts, and draft minutes',
      layout: 'default',
      showInNav: true,
      auth: {
        requiresAuth: true,
        allowedRoles: ['social_worker', 'housing_officer', 'manager'],
        allowedDomains: [],
      },
    },
    {
      id: 'minute-detail',
      path: '/minutes/[id]',
      label: 'Minute Details',
      icon: FileText,
      description: 'Review transcript-backed minute details',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['social_worker', 'housing_officer', 'manager'],
        allowedDomains: [],
      },
    },
    {
      id: 'transcription-settings',
      path: '/admin/settings',
      label: 'Transcription Settings',
      icon: Settings,
      description: 'Configure transcription preferences',
      layout: 'default',
      showInNav: false,
      auth: {
        requiresAuth: true,
        allowedRoles: ['manager', 'admin'],
        allowedDomains: [],
      },
    },
  ],

  permissions: [
    {
      id: 'transcription:upload',
      name: 'Upload Audio',
      description: 'Ability to upload audio files for transcription',
      defaultRoles: ['social_worker', 'housing_officer'],
    },
    {
      id: 'transcription:view',
      name: 'View Transcriptions',
      description: 'Ability to view transcription results',
      defaultRoles: ['social_worker', 'housing_officer', 'manager'],
    },
    {
      id: 'transcription:process',
      name: 'Process Transcriptions',
      description: 'Ability to initiate transcription processing',
      defaultRoles: ['social_worker', 'housing_officer'],
    },
    {
      id: 'transcription:configure',
      name: 'Configure Transcription',
      description: 'Ability to change transcription settings',
      defaultRoles: ['manager', 'admin'],
    },
  ],

  dependencies: [],

  hooks: {
    onEnable: async () => {
      console.log('[Transcription Module] Enabled');
    },
    onDisable: async () => {
      console.log('[Transcription Module] Disabled');
    },
  },

  metadata: {
    supportedFormats: ['webm', 'wav', 'mp3', 'ogg', 'm4a'],
    maxFileSizeMB: 500,
    processingModes: ['real-time', 'batch', 'economy'],
    supportedLanguages: ['en-GB', 'en-US'],
  },
};
