/**
 * Common Test Mocks
 * 
 * Reusable mock data and factories for tests.
 */

import type { Meeting, User, Template, MeetingStatus } from '@/types/demo';
import type { FeatureFlags } from '@/types/flags';

// ============================================
// User Mocks
// ============================================

export const mockUser: User = {
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@council.gov.uk',
  role: 'social_worker',
  domain: 'children',
  team: 'Children Services',
  avatar: '/avatars/default.png',
  functionLabel: 'Social Worker',
  authorityLabel: 'Team Member',
  focusArea: 'Child Protection',
};

export const mockManager: User = {
  id: 'test-manager-1',
  name: 'Test Manager',
  email: 'manager@council.gov.uk',
  role: 'manager',
  domain: 'children',
  team: 'Children Services',
  avatar: '/avatars/default.png',
  functionLabel: 'Team Manager',
  authorityLabel: 'Approver',
};

export const mockAdmin: User = {
  id: 'test-admin-1',
  name: 'Test Admin',
  email: 'admin@council.gov.uk',
  role: 'admin',
  domain: 'children',
  team: 'IT',
  avatar: '/avatars/default.png',
  functionLabel: 'System Admin',
  authorityLabel: 'Super Admin',
};

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    ...mockUser,
    id: `user-${Date.now()}`,
    ...overrides,
  };
}

// ============================================
// Meeting Mocks
// ============================================

export const mockMeeting: Meeting = {
  id: 'meeting-1',
  title: 'Test Home Visit',
  date: '2026-03-28T10:00:00Z',
  duration: '45',
  status: 'draft' as MeetingStatus,
  attendees: ['Child', 'Parent', 'Social Worker'],
  templateId: 'template-1',
  domain: 'children',
  summary: 'Initial assessment meeting',
  transcript: [
    { speaker: 'Social Worker', text: 'Good morning.', timestamp: '00:00:05' },
    { speaker: 'Parent', text: 'Hello.', timestamp: '00:00:08' },
  ],
  tasks: [],
  tags: ['assessment', 'initial'],
  riskScore: 'low',
  uploadedAt: '2026-03-28T11:00:00Z',
  submittedById: 'test-user-1',
};

export function createMockMeeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    ...mockMeeting,
    id: `meeting-${Date.now()}`,
    date: new Date().toISOString(),
    uploadedAt: new Date().toISOString(),
    ...overrides,
  };
}

export const mockMeetingsList: Meeting[] = [
  createMockMeeting({ id: 'meeting-1', title: 'Home Visit - Smith Family', status: 'draft' }),
  createMockMeeting({ id: 'meeting-2', title: 'Case Review - Jones Child', status: 'ready' }),
  createMockMeeting({ id: 'meeting-3', title: 'Assessment - Brown Family', status: 'approved' }),
];

// ============================================
// Template Mocks
// ============================================

export const mockTemplate: Template = {
  id: 'template-1',
  name: 'Home Visit Template',
  description: 'Standard template for home visits',
  icon: 'home',
  sections: ['Attendees', 'Observations', 'Action Items'],
  domain: 'children',
};

export function createMockTemplate(overrides: Partial<Template> = {}): Template {
  return {
    ...mockTemplate,
    id: `template-${Date.now()}`,
    ...overrides,
  };
}

// ============================================
// Auth Mocks
// ============================================

export const mockAuthState = {
  isAuthenticated: true,
  isLoading: false,
  accessToken: 'mock-access-token',
  account: {
    username: 'test@council.gov.uk',
    name: 'Test User',
    localAccountId: 'local-id',
    homeAccountId: 'home-id',
    environment: 'login.microsoftonline.com',
    tenantId: 'tenant-id',
  },
  idTokenClaims: {
    email: 'test@council.gov.uk',
    name: 'Test User',
    roles: ['user'],
    organisation_id: 'org-1',
  },
  inProgress: 'none' as const,
  error: null,
};

export const mockAuthActions = {
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  getToken: vi.fn().mockResolvedValue('mock-access-token'),
};

// ============================================
// API Response Mocks
// ============================================

export const mockApiResponse = <T>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  headers: new Headers({ 'content-type': 'application/json' }),
});

export const mockApiError = (message: string, status = 400) => ({
  ok: false,
  status,
  statusText: message,
  json: () => Promise.resolve({ error: message, detail: message }),
  text: () => Promise.resolve(JSON.stringify({ error: message })),
  headers: new Headers({ 'content-type': 'application/json' }),
});

// ============================================
// Feature Flag Mocks
// ============================================

export const mockFeatureFlags: FeatureFlags = {
  aiInsights: true,
  housingPilot: false,
  smartCapture: true,
};

// ============================================
// Navigation Mocks
// ============================================

export const mockNavigation = {
  items: [
    { id: 'home', label: 'Home', href: '/', icon: 'home' },
    { id: 'record', label: 'Record', href: '/record', icon: 'mic' },
    { id: 'minutes', label: 'Minutes', href: '/minutes', icon: 'file' },
    { id: 'templates', label: 'Templates', href: '/templates', icon: 'layout' },
  ],
};

// Global vi for mocks
import { vi } from 'vitest';
