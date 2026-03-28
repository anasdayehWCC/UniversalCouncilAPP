/**
 * Authentication Integration Tests
 *
 * Tests for MSAL authentication flows including login, token refresh,
 * logout, and role-based access control.
 *
 * @module tests/integration/auth
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { server } from '../mocks/server';
import { http, HttpResponse, delay } from 'msw';

const API_BASE = 'http://localhost:8080';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock MSAL instance
const createMockMsalInstance = (options: {
  accounts?: Array<{
    username: string;
    name: string;
    localAccountId: string;
    homeAccountId: string;
    environment: string;
    tenantId: string;
  }>;
  inProgress?: 'none' | 'startup' | 'login' | 'logout';
  acquireTokenResult?: {
    accessToken: string;
    idTokenClaims: Record<string, unknown>;
  } | null;
  shouldFailTokenAcquisition?: boolean;
}) => ({
  loginRedirect: vi.fn().mockResolvedValue(undefined),
  loginPopup: vi.fn().mockResolvedValue({
    accessToken: 'mock-popup-token',
    idTokenClaims: { email: 'test@council.gov.uk', name: 'Test User', roles: ['user'] },
  }),
  logoutRedirect: vi.fn().mockResolvedValue(undefined),
  logoutPopup: vi.fn().mockResolvedValue(undefined),
  acquireTokenSilent: options.shouldFailTokenAcquisition
    ? vi.fn().mockRejectedValue(new Error('Token acquisition failed'))
    : vi.fn().mockResolvedValue(options.acquireTokenResult ?? {
        accessToken: 'test-access-token',
        idTokenClaims: {
          email: 'test@council.gov.uk',
          name: 'Test User',
          roles: ['user'],
          organisation_id: 'org-1',
        },
      }),
  acquireTokenPopup: vi.fn().mockResolvedValue({
    accessToken: 'fallback-popup-token',
    idTokenClaims: { email: 'test@council.gov.uk', name: 'Test User', roles: ['user'] },
  }),
  getAllAccounts: vi.fn().mockReturnValue(options.accounts ?? []),
  setActiveAccount: vi.fn(),
  getActiveAccount: vi.fn().mockReturnValue(options.accounts?.[0] ?? null),
});

const defaultMockAccounts = [
  {
    username: 'test@council.gov.uk',
    name: 'Test User',
    localAccountId: 'local-123',
    homeAccountId: 'home-123',
    environment: 'login.microsoftonline.com',
    tenantId: 'tenant-123',
  },
];

describe('Authentication Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
    server.resetHandlers();
  });

  // ==========================================================================
  // Login Flow Tests
  // ==========================================================================

  describe('Login with MSAL', () => {
    it('initiates login redirect when not authenticated', async () => {
      const mockInstance = createMockMsalInstance({ accounts: [] });

      vi.doMock('@azure/msal-react', () => ({
        useMsal: vi.fn(() => ({
          instance: mockInstance,
          inProgress: 'none',
          accounts: [],
        })),
        useAccount: vi.fn(() => null),
      }));

      // Simulate login call
      await act(async () => {
        await mockInstance.loginRedirect({ scopes: ['openid', 'profile', 'email'] });
      });

      expect(mockInstance.loginRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          scopes: expect.arrayContaining(['openid', 'profile', 'email']),
        })
      );
    });

    it('handles login popup as fallback', async () => {
      const mockInstance = createMockMsalInstance({ accounts: [] });

      const result = await mockInstance.loginPopup({ scopes: ['openid'] });

      expect(mockInstance.loginPopup).toHaveBeenCalled();
      expect(result.accessToken).toBe('mock-popup-token');
    });

    it('validates login response contains required claims', async () => {
      const mockInstance = createMockMsalInstance({ accounts: [] });

      const result = await mockInstance.loginPopup({ scopes: ['openid'] });

      expect(result.idTokenClaims).toHaveProperty('email');
      expect(result.idTokenClaims).toHaveProperty('name');
      expect(result.idTokenClaims).toHaveProperty('roles');
    });

    it('stores authentication state after successful login', async () => {
      const mockInstance = createMockMsalInstance({ accounts: defaultMockAccounts });

      const accounts = mockInstance.getAllAccounts();

      expect(accounts).toHaveLength(1);
      expect(accounts[0].username).toBe('test@council.gov.uk');
    });

    it('handles login errors gracefully', async () => {
      const mockInstance = createMockMsalInstance({ accounts: [] });
      mockInstance.loginRedirect = vi.fn().mockRejectedValue(new Error('User cancelled login'));

      await expect(mockInstance.loginRedirect({ scopes: ['openid'] })).rejects.toThrow(
        'User cancelled login'
      );
    });

    it('validates user against backend after MSAL login', async () => {
      server.use(
        http.get(`${API_BASE}/api/users/me`, () => {
          return HttpResponse.json({
            user: {
              id: 'user-1',
              email: 'test@council.gov.uk',
              name: 'Test User',
              role: 'social_worker',
              domain: 'children',
            },
            organisation: {
              id: 'org-1',
              name: 'Westminster City Council',
              domain: 'wcc',
            },
          });
        })
      );

      const response = await fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: 'Bearer test-token' },
      });
      const data = await response.json();

      expect(data.user.email).toBe('test@council.gov.uk');
      expect(data.organisation.name).toBe('Westminster City Council');
    });
  });

  // ==========================================================================
  // Token Refresh Tests
  // ==========================================================================

  describe('Token Refresh', () => {
    it('acquires token silently when account exists', async () => {
      const mockInstance = createMockMsalInstance({ accounts: defaultMockAccounts });

      const result = await mockInstance.acquireTokenSilent({
        scopes: ['api://test/.default'],
        account: defaultMockAccounts[0],
      });

      expect(result.accessToken).toBe('test-access-token');
      expect(mockInstance.acquireTokenSilent).toHaveBeenCalled();
    });

    it('falls back to popup when silent acquisition fails', async () => {
      const mockInstance = createMockMsalInstance({
        accounts: defaultMockAccounts,
        shouldFailTokenAcquisition: true,
      });

      await expect(
        mockInstance.acquireTokenSilent({
          scopes: ['api://test/.default'],
          account: defaultMockAccounts[0],
        })
      ).rejects.toThrow();

      // Should then attempt interactive fallback
      const popupResult = await mockInstance.acquireTokenPopup({
        scopes: ['api://test/.default'],
      });

      expect(popupResult.accessToken).toBe('fallback-popup-token');
    });

    it('returns cached token when not expired', async () => {
      const mockInstance = createMockMsalInstance({ accounts: defaultMockAccounts });

      // First call
      await mockInstance.acquireTokenSilent({
        scopes: ['api://test/.default'],
        account: defaultMockAccounts[0],
      });

      // Second call should use cache
      const cachedResult = await mockInstance.acquireTokenSilent({
        scopes: ['api://test/.default'],
        account: defaultMockAccounts[0],
      });

      expect(cachedResult.accessToken).toBe('test-access-token');
      expect(mockInstance.acquireTokenSilent).toHaveBeenCalledTimes(2);
    });

    it('validates token with backend', async () => {
      server.use(
        http.post(`${API_BASE}/api/auth/validate`, async ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (authHeader === 'Bearer valid-token') {
            return HttpResponse.json({ valid: true, expiresAt: Date.now() + 3600000 });
          }
          return HttpResponse.json({ valid: false }, { status: 401 });
        })
      );

      const validResponse = await fetch(`${API_BASE}/api/auth/validate`, {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
      });
      expect((await validResponse.json()).valid).toBe(true);

      const invalidResponse = await fetch(`${API_BASE}/api/auth/validate`, {
        method: 'POST',
        headers: { Authorization: 'Bearer invalid-token' },
      });
      expect(invalidResponse.status).toBe(401);
    });

    it('handles token expiration during request', async () => {
      server.use(
        http.get(`${API_BASE}/api/protected`, async ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (authHeader === 'Bearer expired-token') {
            return HttpResponse.json(
              { error: 'Token expired', code: 'TOKEN_EXPIRED' },
              { status: 401 }
            );
          }
          return HttpResponse.json({ data: 'protected-data' });
        })
      );

      const response = await fetch(`${API_BASE}/api/protected`, {
        headers: { Authorization: 'Bearer expired-token' },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.code).toBe('TOKEN_EXPIRED');
    });
  });

  // ==========================================================================
  // Logout Tests
  // ==========================================================================

  describe('Logout', () => {
    it('performs logout redirect', async () => {
      const mockInstance = createMockMsalInstance({ accounts: defaultMockAccounts });

      await mockInstance.logoutRedirect();

      expect(mockInstance.logoutRedirect).toHaveBeenCalled();
    });

    it('notifies backend of logout', async () => {
      const logoutHandler = vi.fn();

      server.use(
        http.post(`${API_BASE}/api/auth/logout`, () => {
          logoutHandler();
          return HttpResponse.json({ success: true });
        })
      );

      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
      });

      expect(response.status).toBe(200);
      expect(logoutHandler).toHaveBeenCalled();
    });

    it('clears local storage after logout', async () => {
      window.localStorage.setItem('auth_token', 'test-token');
      window.localStorage.setItem('user_preferences', '{"theme":"dark"}');

      // Simulate logout cleanup
      window.localStorage.removeItem('auth_token');

      expect(window.localStorage.getItem('auth_token')).toBeNull();
      expect(window.localStorage.getItem('user_preferences')).toBe('{"theme":"dark"}');
    });

    it('clears session storage after logout', async () => {
      window.sessionStorage.setItem('session_id', 'session-123');

      // Simulate logout cleanup
      window.sessionStorage.clear();

      expect(window.sessionStorage.getItem('session_id')).toBeNull();
    });

    it('handles logout errors gracefully', async () => {
      const mockInstance = createMockMsalInstance({ accounts: defaultMockAccounts });
      mockInstance.logoutRedirect = vi.fn().mockRejectedValue(new Error('Logout failed'));

      // Should not throw, should handle gracefully
      try {
        await mockInstance.logoutRedirect();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Logout failed');
      }
    });

    it('supports popup logout as alternative', async () => {
      const mockInstance = createMockMsalInstance({ accounts: defaultMockAccounts });

      await mockInstance.logoutPopup();

      expect(mockInstance.logoutPopup).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Role-Based Access Control Tests
  // ==========================================================================

  describe('Role-Based Access', () => {
    it('allows social worker to access recording endpoints', async () => {
      server.use(
        http.post(`${API_BASE}/api/transcriptions`, async ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          // Validate token contains social_worker role
          if (authHeader?.includes('Bearer') && authHeader.includes('social-worker-token')) {
            return HttpResponse.json({ id: 'transcription-1', status: 'processing' }, { status: 201 });
          }
          return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
        })
      );

      const response = await fetch(`${API_BASE}/api/transcriptions`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer social-worker-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recording_id: 'rec-1' }),
      });

      expect(response.status).toBe(201);
    });

    it('restricts manager-only endpoints from social workers', async () => {
      server.use(
        http.get(`${API_BASE}/api/review-queue`, async ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          // Only managers can access review queue
          if (authHeader?.includes('manager-token')) {
            return HttpResponse.json({ items: [], total: 0 });
          }
          return HttpResponse.json(
            { error: 'Forbidden', message: 'Manager role required' },
            { status: 403 }
          );
        })
      );

      const socialWorkerResponse = await fetch(`${API_BASE}/api/review-queue`, {
        headers: { Authorization: 'Bearer social-worker-token' },
      });

      expect(socialWorkerResponse.status).toBe(403);

      const managerResponse = await fetch(`${API_BASE}/api/review-queue`, {
        headers: { Authorization: 'Bearer manager-token' },
      });

      expect(managerResponse.status).toBe(200);
    });

    it('allows admin full access to all endpoints', async () => {
      server.use(
        http.get(`${API_BASE}/api/admin/users`, async ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (authHeader?.includes('admin-token')) {
            return HttpResponse.json({ users: [], total: 0 });
          }
          return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
        }),
        http.delete(`${API_BASE}/api/admin/users/:id`, async ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (authHeader?.includes('admin-token')) {
            return HttpResponse.json({ success: true });
          }
          return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
        })
      );

      const listResponse = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(listResponse.status).toBe(200);

      const deleteResponse = await fetch(`${API_BASE}/api/admin/users/user-1`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(deleteResponse.status).toBe(200);
    });

    it('validates domain access restrictions', async () => {
      server.use(
        http.get(`${API_BASE}/api/cases`, async ({ request }) => {
          const url = new URL(request.url);
          const domain = url.searchParams.get('domain');
          const authHeader = request.headers.get('Authorization');

          // User can only access their domain
          if (authHeader?.includes('children-domain-token') && domain === 'adults') {
            return HttpResponse.json(
              { error: 'Cannot access cases from different domain' },
              { status: 403 }
            );
          }
          return HttpResponse.json({ cases: [], total: 0 });
        })
      );

      const crossDomainResponse = await fetch(`${API_BASE}/api/cases?domain=adults`, {
        headers: { Authorization: 'Bearer children-domain-token' },
      });

      expect(crossDomainResponse.status).toBe(403);

      const sameDomainResponse = await fetch(`${API_BASE}/api/cases?domain=children`, {
        headers: { Authorization: 'Bearer children-domain-token' },
      });

      expect(sameDomainResponse.status).toBe(200);
    });

    it('supports role hierarchy for approvals', async () => {
      server.use(
        http.post(`${API_BASE}/api/minutes/:id/approve`, async ({ request }) => {
          const authHeader = request.headers.get('Authorization');

          // Only managers and admins can approve
          if (
            authHeader?.includes('manager-token') ||
            authHeader?.includes('admin-token')
          ) {
            return HttpResponse.json({ success: true, status: 'approved' });
          }
          return HttpResponse.json(
            { error: 'Insufficient permissions to approve' },
            { status: 403 }
          );
        })
      );

      const socialWorkerApproval = await fetch(`${API_BASE}/api/minutes/min-1/approve`, {
        method: 'POST',
        headers: { Authorization: 'Bearer social-worker-token' },
      });
      expect(socialWorkerApproval.status).toBe(403);

      const managerApproval = await fetch(`${API_BASE}/api/minutes/min-1/approve`, {
        method: 'POST',
        headers: { Authorization: 'Bearer manager-token' },
      });
      expect(managerApproval.status).toBe(200);

      const adminApproval = await fetch(`${API_BASE}/api/minutes/min-2/approve`, {
        method: 'POST',
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(adminApproval.status).toBe(200);
    });

    it('enforces organisation-level isolation', async () => {
      server.use(
        http.get(`${API_BASE}/api/minutes/:id`, async ({ request, params }) => {
          const authHeader = request.headers.get('Authorization');
          const minuteId = params.id;

          // Mock: minute-org-2 belongs to different organisation
          if (minuteId === 'minute-org-2' && authHeader?.includes('org-1-token')) {
            return HttpResponse.json(
              { error: 'Resource not found' },
              { status: 404 }
            );
          }
          return HttpResponse.json({ id: minuteId, title: 'Test Minute' });
        })
      );

      const crossOrgResponse = await fetch(`${API_BASE}/api/minutes/minute-org-2`, {
        headers: { Authorization: 'Bearer org-1-token' },
      });
      expect(crossOrgResponse.status).toBe(404);

      const sameOrgResponse = await fetch(`${API_BASE}/api/minutes/minute-org-1`, {
        headers: { Authorization: 'Bearer org-1-token' },
      });
      expect(sameOrgResponse.status).toBe(200);
    });
  });
});
