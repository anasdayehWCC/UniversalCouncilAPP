# API Documentation

> Comprehensive API documentation for the Universal Council App.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Authentication Flow](#authentication-flow)
- [API Endpoints](#api-endpoints)
- [Error Codes & Handling](#error-codes--handling)
- [Rate Limiting](#rate-limiting)
- [WebSocket Events](#websocket-events)
- [API Client Reference](#api-client-reference)

---

## Architecture Overview

The Universal Council App uses a **proxy-based API architecture** where the Next.js frontend proxies requests to the `minute-main` Python backend.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ API Client  │  │ useApiQuery │  │ TanStack    │                 │
│  │ (fetch)     │  │ (hook)      │  │ React Query │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         │                │                │                         │
│         └────────────────┼────────────────┘                         │
│                          ▼                                          │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │         Interceptors (Auth Token, Error Transform)            │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND (Server)                        │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │           /api/proxy/[...path] (API Proxy Route)               │ │
│  │  • Auth token forwarding                                       │ │
│  │  • CORS handling                                               │ │
│  │  • Request/response transformation                             │ │
│  │  • Rate limit header forwarding                                │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   MINUTE-MAIN BACKEND (FastAPI)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ /auth/*     │  │ /api/v1/*   │  │ /health     │                 │
│  │ Auth routes │  │ Core API    │  │ Health check│                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                          │                                          │
│         ┌────────────────┼────────────────┐                        │
│         ▼                ▼                ▼                        │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐                  │
│  │ PostgreSQL│    │  Redis    │    │ Azure     │                  │
│  │ (Data)    │    │ (Cache)   │    │ Blob/S3   │                  │
│  └───────────┘    └───────────┘    └───────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| API Client | `src/lib/api-client.ts` | Low-level HTTP client with retry logic |
| Generated Client | `src/lib/api/generated/` | OpenAPI-generated TypeScript SDK |
| API Proxy | `src/app/api/proxy/[...path]/route.ts` | Next.js route that proxies to backend |
| Query Hooks | `src/lib/useApiQuery.ts` | React hooks for data fetching with caching |

---

## Authentication Flow

The app uses **Azure Entra ID (MSAL)** for OAuth 2.0 authentication with a demo mode fallback.

```
┌──────────┐     ┌───────────────┐     ┌─────────────┐     ┌──────────┐
│  User    │     │  Universal    │     │  Azure      │     │  Backend │
│          │     │  App          │     │  Entra ID   │     │  API     │
└────┬─────┘     └───────┬───────┘     └──────┬──────┘     └────┬─────┘
     │                   │                    │                  │
     │  1. Click Login   │                    │                  │
     │──────────────────▶│                    │                  │
     │                   │                    │                  │
     │                   │  2. MSAL Redirect  │                  │
     │                   │───────────────────▶│                  │
     │                   │                    │                  │
     │  3. User authenticates at Azure portal │                  │
     │◀──────────────────────────────────────▶│                  │
     │                   │                    │                  │
     │                   │  4. ID Token       │                  │
     │                   │◀───────────────────│                  │
     │                   │                    │                  │
     │                   │  5. Get Access     │                  │
     │                   │     Token (silent) │                  │
     │                   │───────────────────▶│                  │
     │                   │                    │                  │
     │                   │  6. Access Token   │                  │
     │                   │◀───────────────────│                  │
     │                   │                    │                  │
     │                   │  7. API Request    │                  │
     │                   │  Authorization:    │                  │
     │                   │  Bearer <token>    │                  │
     │                   │────────────────────────────────────▶│
     │                   │                    │                  │
     │                   │  8. Validated      │                  │
     │                   │     Response       │                  │
     │                   │◀────────────────────────────────────│
     │                   │                    │                  │
     │  9. Content       │                    │                  │
     │◀──────────────────│                    │                  │
```

### Demo Mode

When `NEXT_PUBLIC_DEMO_MODE=true`, authentication is bypassed with mock tokens:

```typescript
// Demo mode token
{
  organisation_id: 'demo-org',
  email: 'demo@example.com',
  name: 'Demo User',
  roles: ['user']
}
```

### Environment Variables

```env
# Azure Entra ID Configuration
NEXT_PUBLIC_AZURE_TENANT_ID=your-tenant-id
NEXT_PUBLIC_AZURE_CLIENT_ID=your-client-id
NEXT_PUBLIC_AZURE_REDIRECT_URI=http://localhost:3000
NEXT_PUBLIC_AZURE_API_SCOPE=api://your-client-id/.default

# Demo Mode
NEXT_PUBLIC_DEMO_MODE=true

# Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8080
BACKEND_URL=http://localhost:8080
```

---

## API Endpoints

### Proxy Route

All API requests are proxied through `/api/proxy/[...path]`:

| Frontend Path | Backend Path | Description |
|---------------|--------------|-------------|
| `/api/proxy/health` | `/health` | Health check |
| `/api/proxy/api/v1/transcriptions` | `/api/v1/transcriptions` | Transcriptions API |
| `/api/proxy/api/v1/minutes` | `/api/v1/minutes` | Minutes API |
| `/api/proxy/api/v1/recordings` | `/api/v1/recordings` | Recordings API |

### Demo API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/demos/personas` | GET | Returns persona, meeting, and template data for demo mode |

**Response:**
```json
{
  "personas": {
    "sarah": {
      "id": "sarah",
      "name": "Sarah Johnson",
      "role": "social_worker",
      "domain": "children",
      "team": "Child Protection",
      "avatar": "/avatars/sarah.png",
      "email": "sarah.johnson@council.gov.uk"
    }
  },
  "meetings": [...],
  "templates": [...],
  "generatedAt": "2026-03-28T12:00:00.000Z"
}
```

### Backend API Endpoints (via Proxy)

#### Transcriptions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/transcriptions` | GET | List all transcriptions |
| `/api/v1/transcriptions` | POST | Create new transcription |
| `/api/v1/transcriptions/{id}` | GET | Get transcription by ID |
| `/api/v1/transcriptions/{id}` | PUT | Update transcription |
| `/api/v1/transcriptions/{id}` | DELETE | Delete transcription |

**GET /api/v1/transcriptions**
```typescript
// Request
const transcriptions = await apiClient.get<Transcription[]>('/api/proxy/api/v1/transcriptions', {
  params: { status: 'completed', limit: 20, page: 1 }
});

// Response
{
  "items": [
    {
      "id": "trans-001",
      "title": "Home Visit - Smith Family",
      "status": "completed",
      "case_reference": "SW-2026-001",
      "created_at": "2026-03-28T10:00:00Z",
      "duration_seconds": 1845,
      "word_count": 3200
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 20
}
```

#### Minutes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/minutes` | GET | List all minutes |
| `/api/v1/minutes` | POST | Generate minutes from transcription |
| `/api/v1/minutes/{id}` | GET | Get minute by ID |
| `/api/v1/minutes/{id}` | PUT | Update minute |
| `/api/v1/minutes/{id}/approve` | POST | Approve minute |
| `/api/v1/minutes/{id}/reject` | POST | Reject minute |

**POST /api/v1/minutes**
```typescript
// Request
const minute = await apiClient.post<Minute>('/api/proxy/api/v1/minutes', {
  transcription_id: 'trans-001',
  template_id: 'visit-note',
  case_reference: 'SW-2026-001'
});

// Response
{
  "id": "min-001",
  "transcription_id": "trans-001",
  "status": "draft",
  "content": {
    "sections": [
      { "title": "Purpose of Visit", "content": "..." },
      { "title": "Observations", "content": "..." }
    ]
  },
  "created_at": "2026-03-28T10:30:00Z"
}
```

#### Recordings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/recordings` | POST | Upload audio recording |
| `/api/v1/recordings/{id}` | GET | Get recording status |

**POST /api/v1/recordings** (Multipart)
```typescript
const formData = new FormData();
formData.append('file', audioBlob, 'recording.webm');
formData.append('case_reference', 'SW-2026-001');
formData.append('template_id', 'visit-note');

const response = await fetch('/api/proxy/api/v1/recordings', {
  method: 'POST',
  body: formData,
  headers: { Authorization: `Bearer ${token}` }
});

// Response
{
  "id": "rec-001",
  "status": "processing",
  "estimated_duration_seconds": 120
}
```

---

## Error Codes & Handling

### HTTP Status Codes

| Code | Name | Description | Retryable |
|------|------|-------------|-----------|
| 200 | OK | Request successful | N/A |
| 201 | Created | Resource created | N/A |
| 204 | No Content | Request successful, no body | N/A |
| 400 | Bad Request | Invalid request parameters | No |
| 401 | Unauthorized | Missing or invalid auth token | No* |
| 403 | Forbidden | Insufficient permissions | No |
| 404 | Not Found | Resource does not exist | No |
| 409 | Conflict | Resource conflict | No |
| 422 | Unprocessable Entity | Validation error | No |
| 429 | Too Many Requests | Rate limit exceeded | Yes |
| 500 | Internal Server Error | Server error | Yes |
| 502 | Bad Gateway | Backend unavailable | Yes |
| 503 | Service Unavailable | Service temporarily down | Yes |
| 504 | Gateway Timeout | Backend timeout | Yes |

*401 errors trigger automatic redirect to login

### Error Response Format

```typescript
interface ApiErrorResponse {
  error: string;          // Error code/type
  message: string;        // Human-readable message
  code?: string;          // Application-specific code
  details?: {
    field?: string;       // Field with error
    reason?: string;      // Specific reason
  }[];
  request_id?: string;    // For debugging/support
}
```

**Example Error Responses:**

```json
// 400 Bad Request
{
  "error": "validation_error",
  "message": "Invalid request parameters",
  "details": [
    { "field": "case_reference", "reason": "Must be in format XX-YYYY-NNN" }
  ]
}

// 401 Unauthorized
{
  "error": "unauthorized",
  "message": "Authentication required"
}

// 429 Rate Limited
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again in 60 seconds.",
  "code": "RATE_LIMIT"
}

// 503 Backend Unavailable
{
  "error": "Backend unavailable",
  "message": "Unable to connect to the backend service. Please try again later.",
  "code": "BACKEND_UNAVAILABLE"
}
```

---

## Rate Limiting

The API enforces rate limits to ensure fair usage.

### Rate Limit Headers

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Requests remaining in window |
| `X-RateLimit-Reset` | Unix timestamp when window resets |

### Default Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 req | 1 minute |
| Recording Upload | 10 req | 1 minute |
| Transcription | 20 req | 1 minute |
| Authentication | 5 req | 1 minute |

### Handling Rate Limits

```typescript
// The API client automatically retries on 429 with exponential backoff
try {
  await apiClient.get('/api/data');
} catch (error) {
  if (error instanceof ApiError && error.status === 429) {
    // Already retried 3 times, show user message
    showNotification('Too many requests. Please wait a moment.');
  }
}
```

---

## WebSocket Events

> **Note:** WebSocket support is planned for real-time transcription updates. Current implementation uses polling.

### Planned WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `transcription.progress` | Server → Client | Real-time transcription progress |
| `transcription.complete` | Server → Client | Transcription finished |
| `transcription.error` | Server → Client | Transcription failed |
| `sync.status` | Server → Client | Offline sync progress |

**Planned Usage:**
```typescript
// Future implementation
const ws = new WebSocket('wss://api.example.com/ws');

ws.onmessage = (event) => {
  const { type, payload } = JSON.parse(event.data);
  
  switch (type) {
    case 'transcription.progress':
      setProgress(payload.percent);
      break;
    case 'transcription.complete':
      refetchTranscription(payload.id);
      break;
  }
};
```

### Current Polling Alternative

```typescript
// Poll for transcription status every 5 seconds
function useTranscriptionPolling(id: string) {
  return useApiQuery(
    `transcription-${id}`,
    () => apiClient.get(`/api/proxy/api/v1/transcriptions/${id}`),
    {
      refetchInterval: 5000,
      enabled: status !== 'completed'
    }
  );
}
```

---

## API Client Reference

The API client (`src/lib/api-client.ts`) provides a typed HTTP client with:

- Automatic retry with exponential backoff
- Request/response interceptors
- Auth token management
- Type-safe responses
- Error handling with custom error classes

## Quick Start

```typescript
import { apiClient } from '@/lib/api-client';

// GET request
const transcriptions = await apiClient.get<Transcription[]>('/api/transcriptions');

// POST request
const newRecording = await apiClient.post<Recording>('/api/recordings', {
  body: { caseReference: 'SW-2026-001' }
});

// With query parameters
const filtered = await apiClient.get<Transcription[]>('/api/transcriptions', {
  params: { status: 'completed', limit: 10 }
});
```

## Configuration

```typescript
interface ApiClientConfig {
  baseUrl?: string;      // Default: process.env.NEXT_PUBLIC_API_URL
  timeout?: number;      // Default: 30000ms
  maxRetries?: number;   // Default: 3
  headers?: Record<string, string>;
}
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## HTTP Methods

### GET

```typescript
const data = await apiClient.get<T>(path, options?);

// With params
const users = await apiClient.get<User[]>('/api/users', {
  params: { role: 'admin', active: true }
});
```

### POST

```typescript
const data = await apiClient.post<T>(path, { body, ...options });

// Create recording
const recording = await apiClient.post<Recording>('/api/recordings', {
  body: {
    caseReference: 'SW-2026-001',
    templateId: 'visit-note'
  }
});
```

### PUT

```typescript
const data = await apiClient.put<T>(path, { body, ...options });

// Update minute
await apiClient.put<Minute>(`/api/minutes/${id}`, {
  body: { status: 'approved', content: updatedContent }
});
```

### PATCH

```typescript
const data = await apiClient.patch<T>(path, { body, ...options });
```

### DELETE

```typescript
await apiClient.delete(path, options?);
```

## Request Options

```typescript
interface RequestOptions {
  timeout?: number;       // Override default timeout
  retries?: number;       // Override retry count
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
}
```

## Interceptors

### Request Interceptor

```typescript
// Add custom header to all requests
const removeInterceptor = apiClient.addRequestInterceptor((config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Custom-Header': 'value'
    }
  };
});

// Remove interceptor when done
removeInterceptor();
```

### Response Interceptor

```typescript
// Log all responses
apiClient.addResponseInterceptor((response) => {
  console.log(`${response.status}: ${response.url}`);
  return response;
});
```

### Error Interceptor

```typescript
// Handle errors globally
apiClient.addErrorInterceptor((error) => {
  if (error instanceof ApiError && error.isUnauthorized) {
    // Redirect to login
    window.location.href = '/login';
  }
  throw error;
});
```

## Authentication

### Setting Auth Token

```typescript
// Set token after login
apiClient.setAuthToken(accessToken);

// Token is automatically included in Authorization header
// Authorization: Bearer <token>
```

### Getting Current Token

```typescript
const token = apiClient.getAuthToken();
```

## Error Handling

### Error Classes

```typescript
import { ApiError, NetworkError, TimeoutError, ValidationError } from '@/lib/api-errors';

try {
  await apiClient.get('/api/data');
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.status);      // 404
    console.log(error.statusText);  // "Not Found"
    console.log(error.body);        // Response body
    console.log(error.requestId);   // X-Request-ID header value
    
    // Helper methods
    if (error.isUnauthorized) { /* 401 */ }
    if (error.isForbidden) { /* 403 */ }
    if (error.isNotFound) { /* 404 */ }
    if (error.isServerError) { /* 5xx */ }
    if (error.isRetryable) { /* Can retry */ }
  }
  
  if (error instanceof NetworkError) {
    console.log('Network failed:', error.requestUrl);
  }
  
  if (error instanceof TimeoutError) {
    console.log(`Timed out after ${error.timeoutMs}ms`);
  }
}
```

### Type Guards

```typescript
import { isApiError, isRetryableError } from '@/lib/api-errors';

if (isApiError(error)) {
  // Handle API error
}

if (isRetryableError(error)) {
  // Retry the request
}
```

## useApiQuery Hook

React hook for data fetching with caching.

```typescript
import { useApiQuery } from '@/lib/useApiQuery';

function TranscriptionList() {
  const {
    data,
    error,
    isLoading,
    isRefetching,
    isStale,
    refetch,
    reset
  } = useApiQuery<Transcription[]>(
    'transcriptions',
    () => apiClient.get('/api/transcriptions'),
    {
      staleTime: 30000,          // 30s before stale
      refetchOnWindowFocus: true,
      enabled: true,
      onSuccess: (data) => console.log('Loaded', data.length),
      onError: (error) => console.error('Failed:', error)
    }
  );

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <ul>
      {data?.map(t => <li key={t.id}>{t.title}</li>)}
    </ul>
  );
}
```

### Query Options

```typescript
interface QueryOptions {
  enabled?: boolean;              // Enable/disable query
  staleTime?: number;             // Time until data is stale (ms)
  cacheTime?: number;             // Cache retention time (ms)
  refetchOnMount?: boolean;       // Refetch on component mount
  refetchOnWindowFocus?: boolean; // Refetch when window regains focus
  retry?: number;                 // Retry attempts
  retryDelay?: number;            // Delay between retries (ms)
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}
```

## Generated OpenAPI Client

Auto-generated TypeScript client from the backend OpenAPI spec.

```typescript
import { client, type operations, type components } from '@/lib/api';

// Typed request based on OpenAPI spec
const response = await client.GET('/api/v1/transcriptions/{id}', {
  params: { path: { id: 'trans-123' } }
});

// Type-safe response
const transcription: components['schemas']['TranscriptionResponse'] = response.data;
```

### Regenerating Client

```bash
npm run openapi-ts
```

Configuration in `openapi-ts.config.ts`:

```typescript
export default defineConfig({
  input: '../minute-main/openapi-temp.json',
  output: './src/lib/api/generated',
  plugins: ['@hey-api/typescript']
});
```

## Best Practices

### 1. Use Type Parameters

```typescript
// ✅ Good - type-safe response
const users = await apiClient.get<User[]>('/api/users');

// ❌ Avoid - untyped
const users = await apiClient.get('/api/users');
```

### 2. Handle Errors Gracefully

```typescript
// ✅ Good - specific error handling
try {
  await apiClient.post('/api/recordings', { body: data });
} catch (error) {
  if (isApiError(error)) {
    if (error.isNotFound) {
      showNotification('Resource not found');
    } else if (error.isServerError) {
      showNotification('Server error - please try again');
    }
  }
}
```

### 3. Use Query Hook for UI

```typescript
// ✅ Good - handles loading, caching, refetching
function DataComponent() {
  const { data, isLoading, error } = useApiQuery('key', fetcher);
  // ...
}

// ❌ Avoid - manual state management
function DataComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { /* manual fetch */ }, []);
}
```

### 4. Configure Request Timeouts

```typescript
// For long-running operations, increase timeout
const report = await apiClient.get('/api/reports/generate', {
  timeout: 120000  // 2 minutes
});
```

## Common Patterns

### Pagination

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

async function fetchPage<T>(endpoint: string, page: number) {
  return apiClient.get<PaginatedResponse<T>>(endpoint, {
    params: { page, limit: 20 }
  });
}
```

### Polling

```typescript
function usePolling<T>(key: string, fetcher: () => Promise<T>, interval: number) {
  const query = useApiQuery(key, fetcher, {
    refetchOnWindowFocus: false,
    staleTime: interval / 2,
  });

  useEffect(() => {
    const id = setInterval(query.refetch, interval);
    return () => clearInterval(id);
  }, [interval, query.refetch]);

  return query;
}
```

### Optimistic Updates

```typescript
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';

const { mutate } = useOptimisticMutation({
  mutationFn: (data) => apiClient.post('/api/items', { body: data }),
  onMutate: (newItem) => {
    // Optimistically update cache
    queryCache.set('items', [...currentItems, newItem]);
  },
  onError: (error, newItem, context) => {
    // Rollback on error
    queryCache.set('items', context.previousItems);
  }
});
```

## TypeScript Types

```typescript
// Core types from api-client.ts
type RequestInterceptor = (config: RequestInit & { url: string }) => RequestInit & { url: string };
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
type ErrorInterceptor = (error: unknown) => unknown;

interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  timeout?: number;
  retries?: number;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

// Error types from api-errors.ts
class ApiError extends Error {
  status: number;
  statusText: string;
  body?: unknown;
  requestId?: string;
  isUnauthorized: boolean;
  isForbidden: boolean;
  isNotFound: boolean;
  isServerError: boolean;
  isClientError: boolean;
  isRetryable: boolean;
}

class NetworkError extends Error {
  cause?: Error;
  requestUrl?: string;
  isRetryable: boolean;
}

class TimeoutError extends Error {
  timeoutMs: number;
  requestUrl?: string;
  isRetryable: boolean;
}

class ValidationError extends Error {
  field: string;
  details?: Record<string, unknown>;
}
```
