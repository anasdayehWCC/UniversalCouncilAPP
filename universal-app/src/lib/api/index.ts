/**
 * API Module
 * 
 * Unified exports for API client, types, and hooks.
 * 
 * @example
 * // Import configured client and utilities
 * import { api, configureApiClient, setAuthToken } from '@/lib/api'
 * 
 * // Import generated SDK functions
 * import { listTranscriptionsTranscriptionsGet } from '@/lib/api'
 * 
 * // Import React Query hooks (preferred for components)
 * import { useListTranscriptionsTranscriptionsGetQuery } from '@/lib/api'
 * 
 * // Import types
 * import type { TranscriptionMetadata } from '@/lib/api'
 */

// Re-export client configuration and utilities
export {
  api,
  client,
  configureApiClient,
  setAuthToken,
  getAuthToken,
  createServerPrefetcher,
} from './client'

// Re-export all generated types and SDK functions
export * from './generated'
