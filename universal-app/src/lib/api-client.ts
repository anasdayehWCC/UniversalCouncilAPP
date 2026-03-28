/**
 * API Client
 * 
 * Typed HTTP client for communicating with the minute-main backend.
 * Features:
 * - Automatic retry with exponential backoff
 * - Request/response interceptors
 * - Auth token management
 * - Type-safe responses
 */

import { ApiError, NetworkError, TimeoutError, isRetryableError } from './api-errors';

// Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;

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

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private authToken: string | null = null;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? API_BASE;
    this.defaultTimeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.defaultRetries = config.maxRetries ?? MAX_RETRIES;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  // Interceptor registration
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index > -1) this.requestInterceptors.splice(index, 1);
    };
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index > -1) this.responseInterceptors.splice(index, 1);
    };
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor);
      if (index > -1) this.errorInterceptors.splice(index, 1);
    };
  }

  // Auth management
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    // Check for token in localStorage if not set
    if (!this.authToken && typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('auth_token');
    }
    return this.authToken;
  }

  // URL building
  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  // Request execution with retry
  private async executeWithRetry<T>(
    url: string,
    options: RequestInit,
    timeout: number,
    retries: number,
    attempt = 0
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Run response interceptors
      let processedResponse = response;
      for (const interceptor of this.responseInterceptors) {
        processedResponse = await interceptor(processedResponse);
      }

      if (!processedResponse.ok) {
        const body = await this.parseResponseBody(processedResponse);
        const requestId = processedResponse.headers.get('x-request-id') ?? undefined;
        throw new ApiError(processedResponse.status, processedResponse.statusText, body, requestId);
      }

      return this.parseResponseBody(processedResponse);
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(timeout, url);
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError(error, url);
      }

      // Run error interceptors
      let processedError = error;
      for (const interceptor of this.errorInterceptors) {
        processedError = interceptor(processedError);
      }

      // Retry if applicable
      if (isRetryableError(processedError) && attempt < retries) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
        console.warn(`[API] Retrying request (${attempt + 1}/${retries}) after ${delay}ms: ${url}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry<T>(url, options, timeout, retries, attempt + 1);
      }

      throw processedError;
    }
  }

  private async parseResponseBody<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    if (contentType?.includes('text/')) {
      return response.text() as unknown as T;
    }
    
    // For empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }
    
    return response.json();
  }

  // HTTP methods
  async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, timeout, retries, body: _body, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);
    
    let config: RequestInit & { url: string } = {
      url,
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        ...fetchOptions.headers as Record<string, string>,
      },
      ...fetchOptions,
    };

    // Run request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = interceptor(config);
    }

    return this.executeWithRetry<T>(
      config.url,
      config,
      timeout ?? this.defaultTimeout,
      retries ?? this.defaultRetries
    );
  }

  async post<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const { params, timeout, retries, body: _optBody, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);
    
    let config: RequestInit & { url: string } = {
      url,
      method: 'POST',
      headers: {
        ...this.defaultHeaders,
        ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        ...fetchOptions.headers as Record<string, string>,
      },
      ...fetchOptions,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    };

    // Run request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = interceptor(config);
    }

    return this.executeWithRetry<T>(
      config.url,
      config,
      timeout ?? this.defaultTimeout,
      retries ?? this.defaultRetries
    );
  }

  async put<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const { params, timeout, retries, body: _optBody, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);
    
    let config: RequestInit & { url: string } = {
      url,
      method: 'PUT',
      headers: {
        ...this.defaultHeaders,
        ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        ...fetchOptions.headers as Record<string, string>,
      },
      ...fetchOptions,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    };

    // Run request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = interceptor(config);
    }

    return this.executeWithRetry<T>(
      config.url,
      config,
      timeout ?? this.defaultTimeout,
      retries ?? this.defaultRetries
    );
  }

  async patch<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const { params, timeout, retries, body: _optBody, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);
    
    let config: RequestInit & { url: string } = {
      url,
      method: 'PATCH',
      headers: {
        ...this.defaultHeaders,
        ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        ...fetchOptions.headers as Record<string, string>,
      },
      ...fetchOptions,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    };

    // Run request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = interceptor(config);
    }

    return this.executeWithRetry<T>(
      config.url,
      config,
      timeout ?? this.defaultTimeout,
      retries ?? this.defaultRetries
    );
  }

  async delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, timeout, retries, body: _optBody, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);
    
    let config: RequestInit & { url: string } = {
      url,
      method: 'DELETE',
      headers: {
        ...this.defaultHeaders,
        ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        ...fetchOptions.headers as Record<string, string>,
      },
      ...fetchOptions,
    };

    // Run request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = interceptor(config);
    }

    return this.executeWithRetry<T>(
      config.url,
      config,
      timeout ?? this.defaultTimeout,
      retries ?? this.defaultRetries
    );
  }
}

// Default singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
export type { ApiClientConfig, RequestOptions };
