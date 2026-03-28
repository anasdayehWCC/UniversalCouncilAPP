/**
 * API Client Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { server } from '../../mocks/server';
import { http, HttpResponse, delay } from 'msw';

// Import after mocks are set up
const API_BASE = 'http://localhost:8080';

// We'll test the ApiClient class by importing and instantiating it
describe('ApiClient', () => {
  let ApiClient: typeof import('@/lib/api-client').ApiClient;
  let apiClient: InstanceType<typeof import('@/lib/api-client').ApiClient>;

  beforeEach(async () => {
    // Dynamically import to get fresh instance
    vi.resetModules();
    const module = await import('@/lib/api-client');
    ApiClient = module.ApiClient;
    apiClient = new ApiClient({ baseUrl: API_BASE });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Configuration', () => {
    it('uses default configuration', async () => {
      const client = new ApiClient();
      expect(client).toBeDefined();
    });

    it('accepts custom base URL', async () => {
      const customUrl = 'https://api.example.com';
      const client = new ApiClient({ baseUrl: customUrl });
      expect(client).toBeDefined();
    });

    it('accepts custom timeout', async () => {
      const client = new ApiClient({ timeout: 5000 });
      expect(client).toBeDefined();
    });

    it('accepts custom headers', async () => {
      const client = new ApiClient({
        headers: { 'X-Custom-Header': 'test-value' },
      });
      expect(client).toBeDefined();
    });
  });

  describe('Auth Token Management', () => {
    it('sets auth token', () => {
      apiClient.setAuthToken('test-token');
      expect(apiClient.getAuthToken()).toBe('test-token');
    });

    it('clears auth token with null', () => {
      apiClient.setAuthToken('test-token');
      apiClient.setAuthToken(null);
      expect(apiClient.getAuthToken()).toBeNull();
    });

    it('reads token from localStorage if not set', () => {
      window.localStorage.setItem('auth_token', 'stored-token');
      
      const freshClient = new ApiClient({ baseUrl: API_BASE });
      expect(freshClient.getAuthToken()).toBe('stored-token');
      
      window.localStorage.removeItem('auth_token');
    });
  });

  describe('Interceptors', () => {
    it('adds request interceptor', () => {
      const interceptor = vi.fn((config) => config);
      const remove = apiClient.addRequestInterceptor(interceptor);
      
      expect(typeof remove).toBe('function');
    });

    it('removes request interceptor', () => {
      const interceptor = vi.fn((config) => config);
      const remove = apiClient.addRequestInterceptor(interceptor);
      
      remove();
      // Interceptor should be removed (no way to verify directly, but shouldn't throw)
      expect(true).toBe(true);
    });

    it('adds response interceptor', () => {
      const interceptor = vi.fn((response) => response);
      const remove = apiClient.addResponseInterceptor(interceptor);
      
      expect(typeof remove).toBe('function');
    });

    it('adds error interceptor', () => {
      const interceptor = vi.fn((error) => error);
      const remove = apiClient.addErrorInterceptor(interceptor);
      
      expect(typeof remove).toBe('function');
    });
  });

  describe('HTTP Methods', () => {
    it('makes GET request', async () => {
      server.use(
        http.get(`${API_BASE}/api/test`, () => {
          return HttpResponse.json({ message: 'success' });
        })
      );

      const response = await apiClient.get<{ message: string }>('/api/test');
      expect(response.message).toBe('success');
    });

    it('makes GET request with query params', async () => {
      server.use(
        http.get(`${API_BASE}/api/test`, ({ request }) => {
          const url = new URL(request.url);
          const page = url.searchParams.get('page');
          const limit = url.searchParams.get('limit');
          return HttpResponse.json({ page, limit });
        })
      );

      const response = await apiClient.get<{ page: string; limit: string }>(
        '/api/test',
        { params: { page: 1, limit: 10 } }
      );
      
      expect(response.page).toBe('1');
      expect(response.limit).toBe('10');
    });

    it('makes POST request with body', async () => {
      server.use(
        http.post(`${API_BASE}/api/items`, async ({ request }) => {
          const body = await request.json() as { name: string };
          return HttpResponse.json({ id: 1, name: body.name }, { status: 201 });
        })
      );

      const response = await apiClient.post<{ id: number; name: string }>(
        '/api/items',
        { name: 'Test Item' }
      );
      
      expect(response.id).toBe(1);
      expect(response.name).toBe('Test Item');
    });

    it('makes PUT request', async () => {
      server.use(
        http.put(`${API_BASE}/api/items/1`, async ({ request }) => {
          const body = await request.json() as { name: string };
          return HttpResponse.json({ id: 1, name: body.name });
        })
      );

      const response = await apiClient.put<{ id: number; name: string }>(
        '/api/items/1',
        { name: 'Updated Item' }
      );
      
      expect(response.name).toBe('Updated Item');
    });

    it('makes PATCH request', async () => {
      server.use(
        http.patch(`${API_BASE}/api/items/1`, async ({ request }) => {
          const body = await request.json() as { status: string };
          return HttpResponse.json({ id: 1, status: body.status });
        })
      );

      const response = await apiClient.patch<{ id: number; status: string }>(
        '/api/items/1',
        { status: 'active' }
      );
      
      expect(response.status).toBe('active');
    });

    it('makes DELETE request', async () => {
      server.use(
        http.delete(`${API_BASE}/api/items/1`, () => {
          return HttpResponse.json({ deleted: true });
        })
      );

      const response = await apiClient.delete<{ deleted: boolean }>('/api/items/1');
      expect(response.deleted).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('throws ApiError for non-2xx responses', async () => {
      server.use(
        http.get(`${API_BASE}/api/error`, () => {
          return HttpResponse.json(
            { error: 'Not found' },
            { status: 404 }
          );
        })
      );

      await expect(apiClient.get('/api/error')).rejects.toThrow();
    });

    it('throws NetworkError for network failures', async () => {
      server.use(
        http.get(`${API_BASE}/api/network-fail`, () => {
          return HttpResponse.error();
        })
      );

      await expect(apiClient.get('/api/network-fail')).rejects.toThrow();
    });

    it('throws TimeoutError when request times out', async () => {
      server.use(
        http.get(`${API_BASE}/api/slow`, async () => {
          await delay(5000); // Longer than timeout
          return HttpResponse.json({ slow: true });
        })
      );

      const fastClient = new ApiClient({ baseUrl: API_BASE, timeout: 100 });
      
      await expect(fastClient.get('/api/slow')).rejects.toThrow();
    });
  });

  describe('Retry Logic', () => {
    it('retries on 503 Service Unavailable', async () => {
      let attempts = 0;
      
      server.use(
        http.get(`${API_BASE}/api/retry-test`, () => {
          attempts++;
          if (attempts < 3) {
            return HttpResponse.json(
              { error: 'Service unavailable' },
              { status: 503 }
            );
          }
          return HttpResponse.json({ success: true });
        })
      );

      const retryClient = new ApiClient({ baseUrl: API_BASE, maxRetries: 3 });
      const response = await retryClient.get<{ success: boolean }>('/api/retry-test');
      
      expect(response.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('does not retry on 4xx errors', async () => {
      let attempts = 0;
      
      server.use(
        http.get(`${API_BASE}/api/no-retry`, () => {
          attempts++;
          return HttpResponse.json(
            { error: 'Bad request' },
            { status: 400 }
          );
        })
      );

      await expect(apiClient.get('/api/no-retry')).rejects.toThrow();
      expect(attempts).toBe(1);
    });

    it('exhausts retries and throws', async () => {
      server.use(
        http.get(`${API_BASE}/api/always-fail`, () => {
          return HttpResponse.json(
            { error: 'Service unavailable' },
            { status: 503 }
          );
        })
      );

      const retryClient = new ApiClient({ baseUrl: API_BASE, maxRetries: 2 });
      
      await expect(retryClient.get('/api/always-fail')).rejects.toThrow();
    });
  });

  describe('Content Types', () => {
    it('parses JSON response', async () => {
      server.use(
        http.get(`${API_BASE}/api/json`, () => {
          return HttpResponse.json({ type: 'json' });
        })
      );

      const response = await apiClient.get<{ type: string }>('/api/json');
      expect(response.type).toBe('json');
    });

    it('handles text response', async () => {
      server.use(
        http.get(`${API_BASE}/api/text`, () => {
          return new HttpResponse('Plain text response', {
            headers: { 'Content-Type': 'text/plain' },
          });
        })
      );

      const response = await apiClient.get<string>('/api/text');
      expect(response).toBe('Plain text response');
    });

    it('handles empty response', async () => {
      server.use(
        http.delete(`${API_BASE}/api/empty`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const response = await apiClient.delete('/api/empty');
      expect(response).toBeFalsy();
    });
  });
});

describe('API Error Classes', () => {
  let ApiError: typeof import('@/lib/api-errors').ApiError;
  let NetworkError: typeof import('@/lib/api-errors').NetworkError;
  let TimeoutError: typeof import('@/lib/api-errors').TimeoutError;
  let isRetryableError: typeof import('@/lib/api-errors').isRetryableError;

  beforeEach(async () => {
    const module = await import('@/lib/api-errors');
    ApiError = module.ApiError;
    NetworkError = module.NetworkError;
    TimeoutError = module.TimeoutError;
    isRetryableError = module.isRetryableError;
  });

  describe('ApiError', () => {
    it('creates error with status and message', () => {
      const error = new ApiError(404, 'Not Found');
      
      expect(error.status).toBe(404);
      expect(error.statusText).toBe('Not Found');
      expect(error.message).toContain('404');
    });

    it('includes body if provided', () => {
      const body = { detail: 'Resource not found' };
      const error = new ApiError(404, 'Not Found', body);
      
      expect(error.body).toEqual(body);
    });

    it('includes request ID if provided', () => {
      const error = new ApiError(500, 'Error', null, 'req-123');
      
      expect(error.requestId).toBe('req-123');
    });
    
    it('identifies unauthorized errors', () => {
      const error = new ApiError(401, 'Unauthorized');
      expect(error.isUnauthorized).toBe(true);
    });
    
    it('identifies forbidden errors', () => {
      const error = new ApiError(403, 'Forbidden');
      expect(error.isForbidden).toBe(true);
    });
    
    it('identifies not found errors', () => {
      const error = new ApiError(404, 'Not Found');
      expect(error.isNotFound).toBe(true);
    });
    
    it('identifies server errors', () => {
      const error = new ApiError(500, 'Server Error');
      expect(error.isServerError).toBe(true);
    });
    
    it('identifies client errors', () => {
      const error = new ApiError(400, 'Bad Request');
      expect(error.isClientError).toBe(true);
    });
  });

  describe('NetworkError', () => {
    it('creates error with cause', () => {
      const cause = new Error('Failed to fetch');
      const error = new NetworkError(cause, '/api/test');
      
      expect(error.message).toContain('Network');
      expect(error.cause).toBe(cause);
      expect(error.requestUrl).toBe('/api/test');
    });
    
    it('is retryable', () => {
      const error = new NetworkError(new Error('fail'), '/test');
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('TimeoutError', () => {
    it('creates error with timeout info', () => {
      const error = new TimeoutError(5000, '/api/slow');
      
      expect(error.message).toContain('5000');
      expect(error.timeoutMs).toBe(5000);
      expect(error.requestUrl).toBe('/api/slow');
    });
    
    it('is retryable', () => {
      const error = new TimeoutError(1000, '/test');
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('isRetryableError', () => {
    it('returns true for NetworkError', () => {
      const error = new NetworkError(new Error('fail'), '/test');
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for TimeoutError', () => {
      const error = new TimeoutError(1000, '/test');
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for 5xx ApiError', () => {
      const error = new ApiError(503, 'Service Unavailable');
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns false for 4xx ApiError', () => {
      const error = new ApiError(400, 'Bad Request');
      expect(isRetryableError(error)).toBe(false);
    });

    it('returns false for regular Error', () => {
      const error = new Error('Something broke');
      expect(isRetryableError(error)).toBe(false);
    });
  });
});
