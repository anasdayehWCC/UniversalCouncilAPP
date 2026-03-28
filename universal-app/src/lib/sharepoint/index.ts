/**
 * SharePoint Integration Module
 * 
 * Provides SharePoint/OneDrive integration for document management.
 * 
 * @module lib/sharepoint
 * 
 * @example
 * ```tsx
 * import { useSharePoint } from '@/hooks/useSharePoint';
 * import { SharePointPicker, SharePointBrowser } from '@/components/sharepoint';
 * 
 * function MyComponent() {
 *   const { isConnected, browse, upload, download } = useSharePoint();
 *   
 *   // Browse files
 *   const files = await browse('/Documents');
 *   
 *   // Upload a file
 *   await upload(file, { destinationFolder: '/Documents' });
 * }
 * ```
 */

// Types
export * from './types';

// Client
export {
  SharePointClient,
  getSharePointClient,
  resetSharePointClient,
  SHAREPOINT_SCOPES,
} from './client';

// Integration
export {
  SharePointIntegration,
  createSharePointIntegration,
} from './integration';
