/**
 * API Error Classes
 * 
 * Structured error types for consistent error handling across the application.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body?: unknown,
    public readonly requestId?: string
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isRetryable(): boolean {
    // Retry on server errors, rate limits, or network issues
    return this.isServerError || this.status === 429 || this.status === 0;
  }
}

export class NetworkError extends Error {
  constructor(
    public readonly cause?: Error,
    public readonly requestUrl?: string
  ) {
    super('Network request failed');
    this.name = 'NetworkError';
  }

  get isRetryable(): boolean {
    return true;
  }
}

export class TimeoutError extends Error {
  constructor(
    public readonly timeoutMs: number,
    public readonly requestUrl?: string
  ) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }

  get isRetryable(): boolean {
    return true;
  }
}

export class ValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(`Validation failed for ${field}: ${message}`);
    this.name = 'ValidationError';
  }
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard to check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError || error instanceof NetworkError || error instanceof TimeoutError) {
    return error.isRetryable;
  }
  return false;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return 'Please sign in to continue.';
      case 403:
        return 'You don\'t have permission to access this resource.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please try again in a moment.';
      default:
        if (error.isServerError) {
          return 'Something went wrong on our end. Please try again.';
        }
        return error.message;
    }
  }

  if (error instanceof NetworkError) {
    return 'Unable to connect. Please check your internet connection.';
  }

  if (error instanceof TimeoutError) {
    return 'Request timed out. Please try again.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}
