/**
 * MSW Request Handlers
 * 
 * Mock API handlers for testing. These intercept network requests
 * and return mock responses.
 */

import { http, HttpResponse, delay } from 'msw';
import { 
  mockUser, 
  mockMeetingsList, 
  mockTemplate,
  mockFeatureFlags,
  mockNavigation,
} from './index';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

// ============================================
// Auth Handlers
// ============================================

export const authHandlers = [
  // Get current user
  http.get(`${API_BASE}/api/users/me`, () => {
    return HttpResponse.json({
      user: mockUser,
      organisation: {
        id: 'org-1',
        name: 'Westminster City Council',
        domain: 'wcc',
      },
    });
  }),

  // Token validation
  http.post(`${API_BASE}/api/auth/validate`, () => {
    return HttpResponse.json({ valid: true });
  }),

  // Logout
  http.post(`${API_BASE}/api/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),
];

// ============================================
// Transcription Handlers
// ============================================

export const transcriptionHandlers = [
  // List transcriptions
  http.get(`${API_BASE}/api/transcriptions`, async () => {
    await delay(100);
    return HttpResponse.json({
      transcriptions: mockMeetingsList.map((m) => ({
        id: m.transcriptId,
        meetingId: m.id,
        title: m.title,
        status: m.status,
        createdAt: m.uploadedAt,
        duration: m.duration,
      })),
      total: mockMeetingsList.length,
    });
  }),

  // Get single transcription
  http.get(`${API_BASE}/api/transcriptions/:id`, async ({ params }) => {
    await delay(50);
    const id = params.id as string;
    const meeting = mockMeetingsList.find((m) => m.transcriptId === id || m.id === id);
    
    if (!meeting) {
      return HttpResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      id: meeting.transcriptId,
      meetingId: meeting.id,
      title: meeting.title,
      status: meeting.status,
      transcript: [
        { speaker: 'Social Worker', text: 'Good morning, thank you for meeting with me today.', timestamp: 0 },
        { speaker: 'Parent', text: 'Good morning, happy to help.', timestamp: 5 },
      ],
      duration: meeting.duration,
      createdAt: meeting.uploadedAt,
    });
  }),

  // Upload audio for transcription
  http.post(`${API_BASE}/api/transcriptions`, async () => {
    await delay(200);
    return HttpResponse.json({
      id: 'new-transcript-' + Date.now(),
      status: 'processing',
      message: 'Transcription started',
    }, { status: 201 });
  }),

  // Delete transcription
  http.delete(`${API_BASE}/api/transcriptions/:id`, async () => {
    await delay(50);
    return HttpResponse.json({ success: true });
  }),
];

// ============================================
// Minutes Handlers
// ============================================

export const minutesHandlers = [
  // List minutes
  http.get(`${API_BASE}/api/minutes`, async () => {
    await delay(100);
    return HttpResponse.json({
      minutes: mockMeetingsList
        .filter((m) => m.minuteId)
        .map((m) => ({
          id: m.minuteId,
          transcriptionId: m.transcriptId,
          title: m.title,
          status: m.status,
          createdAt: m.uploadedAt,
        })),
      total: mockMeetingsList.filter((m) => m.minuteId).length,
    });
  }),

  // Get single minute
  http.get(`${API_BASE}/api/minutes/:id`, async ({ params }) => {
    const id = params.id as string;
    const meeting = mockMeetingsList.find((m) => m.minuteId === id);
    
    if (!meeting) {
      return HttpResponse.json(
        { error: 'Minute not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      id: meeting.minuteId,
      transcriptionId: meeting.transcriptId,
      title: meeting.title,
      status: meeting.status,
      content: '## Meeting Minutes\n\nAttendees: Social Worker, Parent, Child',
      createdAt: meeting.uploadedAt,
    });
  }),

  // Generate minute from transcription
  http.post(`${API_BASE}/api/minutes/generate`, async () => {
    await delay(500);
    return HttpResponse.json({
      id: 'minute-' + Date.now(),
      status: 'generating',
      message: 'Minute generation started',
    }, { status: 202 });
  }),

  // Submit minute for review
  http.post(`${API_BASE}/api/minutes/:id/submit`, async () => {
    await delay(100);
    return HttpResponse.json({
      success: true,
      status: 'pending_review',
    });
  }),

  // Approve minute
  http.post(`${API_BASE}/api/minutes/:id/approve`, async () => {
    await delay(100);
    return HttpResponse.json({
      success: true,
      status: 'approved',
    });
  }),
];

// ============================================
// Template Handlers
// ============================================

export const templateHandlers = [
  // List templates
  http.get(`${API_BASE}/api/templates`, async () => {
    await delay(50);
    return HttpResponse.json({
      templates: [mockTemplate],
      total: 1,
    });
  }),

  // Get single template
  http.get(`${API_BASE}/api/templates/:id`, async ({ params }) => {
    const id = params.id as string;
    
    if (id !== mockTemplate.id) {
      return HttpResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(mockTemplate);
  }),

  // Create template
  http.post(`${API_BASE}/api/templates`, async ({ request }) => {
    const body = await request.json() as { name: string; description: string };
    await delay(100);
    return HttpResponse.json({
      id: 'template-' + Date.now(),
      ...body,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),
];

// ============================================
// Config Handlers
// ============================================

export const configHandlers = [
  // Get feature flags
  http.get(`${API_BASE}/api/config/features`, () => {
    return HttpResponse.json(mockFeatureFlags);
  }),

  // Get modules
  http.get(`${API_BASE}/api/modules`, () => {
    return HttpResponse.json({
      modules: ['transcription', 'minutes', 'templates', 'insights'],
      navigation: mockNavigation.items,
    });
  }),

  // Get tenant config
  http.get(`${API_BASE}/api/config/tenant`, () => {
    return HttpResponse.json({
      tenant: 'wcc',
      name: 'Westminster City Council',
      domain: 'children',
      features: mockFeatureFlags,
      branding: {
        primaryColor: '#1a365d',
        logo: '/logo.svg',
      },
    });
  }),
];

// ============================================
// Insights Handlers
// ============================================

export const insightsHandlers = [
  http.get(`${API_BASE}/api/insights`, async () => {
    await delay(100);
    return HttpResponse.json({
      totalMeetings: 42,
      totalMinutes: 38,
      avgDuration: 35,
      pendingReviews: 5,
      approvedThisMonth: 12,
      trendData: [
        { date: '2026-03-01', count: 8 },
        { date: '2026-03-08', count: 12 },
        { date: '2026-03-15', count: 10 },
        { date: '2026-03-22', count: 12 },
      ],
    });
  }),
];

// ============================================
// Health Check Handler
// ============================================

export const healthHandlers = [
  http.get(`${API_BASE}/api/health`, () => {
    return HttpResponse.json({ status: 'healthy', version: '1.0.0' });
  }),
];

// ============================================
// All Handlers Combined
// ============================================

export const handlers = [
  ...authHandlers,
  ...transcriptionHandlers,
  ...minutesHandlers,
  ...templateHandlers,
  ...configHandlers,
  ...insightsHandlers,
  ...healthHandlers,
];
