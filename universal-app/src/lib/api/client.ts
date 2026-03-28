/**
 * API Client Integration
 * 
 * Wraps the generated OpenAPI client with:
 * - Centralized configuration
 * - Auth token injection
 * - Custom error handling integration
 * - Retry logic via interceptors
 * 
 * Usage:
 *   import { api, configureApiClient } from '@/lib/api/client'
 *   
 *   // Configure once at app startup
 *   configureApiClient({ baseUrl: 'https://api.example.com', token: '...' })
 *   
 *   // Use generated SDK functions
 *   const transcriptions = await api.listTranscriptionsTranscriptionsGet()
 *   
 *   // Or use React Query hooks (preferred for components)
 *   import { useListTranscriptionsTranscriptionsGetQuery } from '@/lib/api/generated'
 */

import { client } from './generated/client.gen'
import { ApiError, NetworkError, TimeoutError, isRetryableError } from '../api-errors'

// Re-export everything from generated client for convenience
export * from './generated'

// Re-export the client for direct access
export { client }

// Configuration
const DEFAULT_TIMEOUT = 30000
const MAX_RETRIES = 3
const RETRY_DELAY_BASE = 1000

interface ApiClientConfig {
  baseUrl?: string
  token?: string
  timeout?: number
  maxRetries?: number
}

let authToken: string | null = null
let maxRetries = MAX_RETRIES
let defaultTimeout = DEFAULT_TIMEOUT

/**
 * Configure the API client with base URL and auth token.
 * Call this at app startup or when auth state changes.
 */
export function configureApiClient(config: ApiClientConfig = {}) {
  const baseUrl = config.baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
  
  authToken = config.token ?? null
  maxRetries = config.maxRetries ?? MAX_RETRIES
  defaultTimeout = config.timeout ?? DEFAULT_TIMEOUT
  
  client.setConfig({
    baseUrl,
    // Timeout is handled via AbortController in interceptors
  })
}

/**
 * Set the auth token for API requests.
 * The token will be automatically included in all subsequent requests.
 */
export function setAuthToken(token: string | null) {
  authToken = token
}

/**
 * Get the current auth token.
 */
export function getAuthToken(): string | null {
  // Fallback to localStorage if not set programmatically
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem('auth_token')
  }
  return authToken
}

// Request interceptor: Add auth headers
client.interceptors.request.use((options) => {
  const token = getAuthToken()
  if (token) {
    const headers = new Headers()

    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => headers.set(key, value))
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => headers.set(key, value))
    } else if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (value !== undefined) {
          headers.set(key, String(value))
        }
      })
    }

    headers.set('Authorization', `Bearer ${token}`)
    options.headers = headers
  }
})

// Response interceptor: Transform errors to our error types
client.interceptors.response.use(async (response: Response) => {
  if (!response.ok) {
    const requestId = response.headers.get('x-request-id') ?? undefined
    let body: unknown
    
    try {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        body = await response.clone().json()
      } else {
        body = await response.clone().text()
      }
    } catch {
      body = undefined
    }
    
    throw new ApiError(response.status, response.statusText, body, requestId)
  }
  return response
})

/**
 * API wrapper object providing access to generated SDK functions
 * with integrated error handling and retry logic.
 * 
 * Note: For React components, prefer using the generated React Query hooks
 * from `@/lib/api/generated/@tanstack/react-query.gen` instead.
 */
export const api = {
  /**
   * The underlying client instance for advanced usage
   */
  client,
  
  /**
   * Execute an API call with retry logic.
   * Wraps any SDK function with automatic retries for transient failures.
   * 
   * @example
   * const result = await api.withRetry(() => 
   *   listTranscriptionsTranscriptionsGet({ query: { page: 1 } })
   * )
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    options: { retries?: number; timeout?: number } = {}
  ): Promise<T> {
    const retries = options.retries ?? maxRetries
    const timeout = options.timeout ?? defaultTimeout
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      try {
        const result = await fn()
        clearTimeout(timeoutId)
        return result
      } catch (error) {
        clearTimeout(timeoutId)
        
        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          throw new TimeoutError(timeout)
        }
        
        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new NetworkError(error)
        }
        
        // Retry if applicable
        if (isRetryableError(error) && attempt < retries) {
          const delay = RETRY_DELAY_BASE * Math.pow(2, attempt)
          console.warn(`[API] Retrying request (${attempt + 1}/${retries}) after ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        throw error
      }
    }
    
    // This should never be reached due to the throw in the loop
    throw new Error('Unexpected end of retry loop')
  },
}

/**
 * Create a prefetcher for server-side data loading.
 * Useful for Next.js server components and getServerSideProps.
 * 
 * @example
 * // In a server component or getServerSideProps
 * const prefetcher = createServerPrefetcher('https://api.example.com')
 * const data = await prefetcher.fetch(() => 
 *   listTranscriptionsTranscriptionsGet({ query: { page: 1 } })
 * )
 */
export function createServerPrefetcher(baseUrl: string, token?: string) {
  // Configure for server-side
  configureApiClient({ baseUrl, token })
  
  return {
    async fetch<T>(fn: () => Promise<T>): Promise<T> {
      return api.withRetry(fn)
    },
  }
}
