/**
 * SharePoint/OneDrive Integration Types
 * 
 * Type definitions for Microsoft Graph API integration with SharePoint
 * and OneDrive for document management.
 * 
 * @module lib/sharepoint/types
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * SharePoint integration configuration
 */
export interface SharePointConfig {
  /** Microsoft Graph API base URL */
  graphBaseUrl: string;
  /** Default site ID for tenant SharePoint */
  defaultSiteId?: string;
  /** Default drive ID */
  defaultDriveId?: string;
  /** Auto-save enabled */
  autoSaveEnabled: boolean;
  /** Auto-organization by case/date */
  autoOrganize: boolean;
  /** Max file size for upload (bytes) */
  maxFileSize: number;
  /** Supported file types */
  supportedFileTypes: string[];
  /** Version history enabled */
  versionHistoryEnabled: boolean;
}

/**
 * Default SharePoint configuration
 */
export const defaultSharePointConfig: SharePointConfig = {
  graphBaseUrl: 'https://graph.microsoft.com/v1.0',
  autoSaveEnabled: false,
  autoOrganize: true,
  maxFileSize: 250 * 1024 * 1024, // 250MB
  supportedFileTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'video/mp4',
    'image/jpeg',
    'image/png',
  ],
  versionHistoryEnabled: true,
};

// ============================================================================
// Core Entity Types
// ============================================================================

/**
 * SharePoint site information
 */
export interface SharePointSite {
  /** Unique site ID */
  id: string;
  /** Display name */
  displayName: string;
  /** Site description */
  description?: string;
  /** Web URL */
  webUrl: string;
  /** Site creation timestamp */
  createdDateTime: string;
  /** Last modified timestamp */
  lastModifiedDateTime: string;
  /** Site collection hostname */
  siteCollection?: {
    hostname: string;
    root: Record<string, unknown>;
  };
  /** Whether user has write access */
  isPersonalSite?: boolean;
}

/**
 * SharePoint/OneDrive drive information
 */
export interface SharePointDrive {
  /** Unique drive ID */
  id: string;
  /** Display name */
  name: string;
  /** Drive type (documentLibrary, personal, business) */
  driveType: 'documentLibrary' | 'personal' | 'business';
  /** Web URL */
  webUrl: string;
  /** Drive owner */
  owner?: {
    user?: {
      id: string;
      displayName: string;
      email?: string;
    };
    group?: {
      id: string;
      displayName: string;
    };
  };
  /** Quota information */
  quota?: {
    total: number;
    used: number;
    remaining: number;
    state: 'normal' | 'nearing' | 'critical' | 'exceeded';
  };
  /** Creation timestamp */
  createdDateTime: string;
  /** Last modified timestamp */
  lastModifiedDateTime?: string;
}

/**
 * SharePoint folder information
 */
export interface SharePointFolder {
  /** Unique folder ID */
  id: string;
  /** Folder name */
  name: string;
  /** Web URL */
  webUrl: string;
  /** Parent folder reference */
  parentReference?: SharePointItemReference;
  /** Folder metadata */
  folder: {
    childCount: number;
    view?: {
      sortBy: string;
      sortOrder: 'ascending' | 'descending';
    };
  };
  /** Size of folder contents */
  size: number;
  /** Creation timestamp */
  createdDateTime: string;
  /** Last modified timestamp */
  lastModifiedDateTime: string;
  /** Created by */
  createdBy?: SharePointIdentity;
  /** Last modified by */
  lastModifiedBy?: SharePointIdentity;
}

/**
 * SharePoint file information
 */
export interface SharePointFile {
  /** Unique file ID */
  id: string;
  /** File name */
  name: string;
  /** Web URL */
  webUrl: string;
  /** Download URL (expires quickly) */
  downloadUrl?: string;
  /** MIME type */
  mimeType?: string;
  /** File size in bytes */
  size: number;
  /** Creation timestamp */
  createdDateTime: string;
  /** Last modified timestamp */
  lastModifiedDateTime: string;
  /** Parent folder reference */
  parentReference?: SharePointItemReference;
  /** File metadata */
  file?: {
    mimeType: string;
    hashes?: {
      quickXorHash?: string;
      sha1Hash?: string;
      sha256Hash?: string;
    };
  };
  /** Created by */
  createdBy?: SharePointIdentity;
  /** Last modified by */
  lastModifiedBy?: SharePointIdentity;
  /** Thumbnail URLs */
  thumbnails?: SharePointThumbnail[];
  /** Whether file is shared */
  shared?: {
    scope: 'anonymous' | 'organization' | 'users';
    owner: SharePointIdentity;
    sharedDateTime: string;
  };
  /** Version information */
  versions?: SharePointFileVersion[];
  /** Custom metadata for linking to minutes */
  customFields?: SharePointCustomFields;
}

/**
 * SharePoint file version
 */
export interface SharePointFileVersion {
  /** Version ID */
  id: string;
  /** Version label */
  versionLabel: string;
  /** Last modified timestamp */
  lastModifiedDateTime: string;
  /** Modified by */
  lastModifiedBy?: SharePointIdentity;
  /** File size */
  size: number;
}

/**
 * SharePoint item reference (parent info)
 */
export interface SharePointItemReference {
  /** Drive ID */
  driveId: string;
  /** Drive type */
  driveType?: string;
  /** Item ID */
  id: string;
  /** Item name */
  name?: string;
  /** Path from root */
  path?: string;
  /** Site ID */
  siteId?: string;
}

/**
 * SharePoint identity (user/app info)
 */
export interface SharePointIdentity {
  user?: {
    id: string;
    displayName: string;
    email?: string;
  };
  application?: {
    id: string;
    displayName: string;
  };
  device?: {
    id: string;
  };
}

/**
 * SharePoint thumbnail info
 */
export interface SharePointThumbnail {
  id: string;
  large?: { url: string; width: number; height: number };
  medium?: { url: string; width: number; height: number };
  small?: { url: string; width: number; height: number };
  source?: { url: string; width: number; height: number };
}

/**
 * Custom fields for linking SharePoint files to minutes
 */
export interface SharePointCustomFields {
  /** Linked minute ID */
  minuteId?: string;
  /** Linked recording ID */
  recordingId?: string;
  /** Case reference */
  caseReference?: string;
  /** Meeting date */
  meetingDate?: string;
  /** Document type */
  documentType?: 'minute' | 'recording' | 'attachment' | 'export';
  /** Tags */
  tags?: string[];
}

// ============================================================================
// Operation Types
// ============================================================================

/**
 * Options for uploading files to SharePoint
 */
export interface UploadOptions {
  /** Destination folder path or ID */
  destinationFolder: string;
  /** Drive ID (uses default if not specified) */
  driveId?: string;
  /** Site ID (uses default if not specified) */
  siteId?: string;
  /** Custom file name (uses original if not specified) */
  fileName?: string;
  /** Conflict behavior */
  conflictBehavior?: 'fail' | 'replace' | 'rename';
  /** Description/comment for the upload */
  description?: string;
  /** Custom fields to attach */
  customFields?: SharePointCustomFields;
  /** Progress callback */
  onProgress?: (progress: UploadProgress) => void;
  /** Chunk size for large files (default: 5MB) */
  chunkSize?: number;
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  /** Bytes uploaded */
  bytesUploaded: number;
  /** Total file size */
  totalBytes: number;
  /** Upload percentage (0-100) */
  percentage: number;
  /** Current chunk being uploaded */
  currentChunk?: number;
  /** Total number of chunks */
  totalChunks?: number;
  /** Estimated time remaining (seconds) */
  estimatedTimeRemaining?: number;
}

/**
 * Options for downloading files from SharePoint
 */
export interface DownloadOptions {
  /** Save as blob instead of triggering download */
  returnBlob?: boolean;
  /** Custom filename for download */
  saveAs?: string;
  /** Specific version to download */
  versionId?: string;
  /** Progress callback */
  onProgress?: (progress: DownloadProgress) => void;
}

/**
 * Download progress information
 */
export interface DownloadProgress {
  /** Bytes downloaded */
  bytesDownloaded: number;
  /** Total file size (if known) */
  totalBytes?: number;
  /** Download percentage (0-100) */
  percentage?: number;
}

/**
 * Options for creating folders
 */
export interface CreateFolderOptions {
  /** Parent folder path or ID */
  parentFolder: string;
  /** Folder name */
  name: string;
  /** Drive ID */
  driveId?: string;
  /** Site ID */
  siteId?: string;
  /** Conflict behavior */
  conflictBehavior?: 'fail' | 'replace' | 'rename';
}

/**
 * Options for listing items
 */
export interface ListItemsOptions {
  /** Folder path or ID */
  folderId?: string;
  /** Drive ID */
  driveId?: string;
  /** Site ID */
  siteId?: string;
  /** Max items to return */
  top?: number;
  /** Skip token for pagination */
  skipToken?: string;
  /** Order by field */
  orderBy?: 'name' | 'lastModifiedDateTime' | 'size' | 'createdDateTime';
  /** Order direction */
  orderDirection?: 'asc' | 'desc';
  /** Filter expression */
  filter?: string;
  /** Select specific fields */
  select?: string[];
  /** Expand related entities */
  expand?: ('thumbnails' | 'children' | 'versions')[];
}

/**
 * Paginated response
 */
export interface SharePointPagedResponse<T> {
  /** Items in this page */
  items: T[];
  /** Next page token */
  nextPageToken?: string;
  /** Total count (if available) */
  totalCount?: number;
}

// ============================================================================
// Search Types
// ============================================================================

/**
 * Search options
 */
export interface SharePointSearchOptions {
  /** Search query */
  query: string;
  /** Search scope */
  scope?: 'site' | 'drive' | 'all';
  /** Site ID for scoped search */
  siteId?: string;
  /** Drive ID for scoped search */
  driveId?: string;
  /** File types to include */
  fileTypes?: string[];
  /** Max results */
  top?: number;
  /** Include folder results */
  includeFolders?: boolean;
}

/**
 * Search result
 */
export interface SharePointSearchResult {
  /** Matching files */
  files: SharePointFile[];
  /** Matching folders */
  folders: SharePointFolder[];
  /** Total hits */
  totalHits: number;
  /** More results available */
  hasMore: boolean;
}

// ============================================================================
// Integration Types
// ============================================================================

/**
 * SharePoint location for saving/linking
 */
export interface SharePointLocation {
  /** Site info */
  site: SharePointSite;
  /** Drive info */
  drive: SharePointDrive;
  /** Folder path */
  folderPath: string;
  /** Folder ID */
  folderId: string;
  /** Display path for UI */
  displayPath: string;
}

/**
 * Linked SharePoint document
 */
export interface LinkedSharePointDocument {
  /** Link ID */
  id: string;
  /** SharePoint file info */
  file: SharePointFile;
  /** Link type */
  linkType: 'minute' | 'recording' | 'attachment';
  /** Linked entity ID (minute/recording) */
  linkedEntityId: string;
  /** Link created timestamp */
  linkedAt: string;
  /** Linked by user */
  linkedBy: string;
}

/**
 * Auto-save rule configuration
 */
export interface AutoSaveRule {
  /** Rule ID */
  id: string;
  /** Rule name */
  name: string;
  /** Enabled status */
  enabled: boolean;
  /** Trigger event */
  trigger: 'minute_finalized' | 'recording_completed' | 'export_generated';
  /** Destination location */
  destination: SharePointLocation;
  /** Folder naming pattern */
  folderPattern: string;
  /** File naming pattern */
  filePattern: string;
  /** Document types to include */
  documentTypes: ('minute' | 'recording' | 'export')[];
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * SharePoint error codes
 */
export type SharePointErrorCode =
  | 'accessDenied'
  | 'activityLimitReached'
  | 'cannotSnapshotTree'
  | 'childItemCountExceeded'
  | 'entityTagDoesNotMatch'
  | 'fragmentLengthMismatch'
  | 'fragmentOutOfOrder'
  | 'fragmentOverlap'
  | 'generalException'
  | 'invalidRange'
  | 'invalidRequest'
  | 'itemNotFound'
  | 'lockMismatch'
  | 'lockNotFoundOrAlreadyExpired'
  | 'lockOwnerMismatch'
  | 'malformedEntityTag'
  | 'malwareDetected'
  | 'nameAlreadyExists'
  | 'notAllowed'
  | 'notSupported'
  | 'parameterIsTooLong'
  | 'parameterIsTooSmall'
  | 'pathIsTooLong'
  | 'quotaLimitReached'
  | 'resourceModified'
  | 'resyncRequired'
  | 'serviceNotAvailable'
  | 'serviceReadOnly'
  | 'throttledRequest'
  | 'tooManyRequests'
  | 'totalAffectedItemCountExceeded'
  | 'truncationNotAllowed'
  | 'uploadSessionFailed'
  | 'uploadSessionIncomplete'
  | 'uploadSessionNotFound'
  | 'virusSuspicious'
  | 'unknown';

/**
 * SharePoint API error
 */
export interface SharePointApiError {
  /** Error code */
  code: SharePointErrorCode;
  /** Error message */
  message: string;
  /** Inner error details */
  innerError?: {
    code?: string;
    message?: string;
    'request-id'?: string;
    date?: string;
  };
  /** HTTP status code */
  statusCode: number;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * SharePoint event types for hooks
 */
export type SharePointEventType =
  | 'connected'
  | 'disconnected'
  | 'upload_started'
  | 'upload_completed'
  | 'upload_failed'
  | 'download_started'
  | 'download_completed'
  | 'download_failed'
  | 'folder_created'
  | 'file_linked'
  | 'file_unlinked'
  | 'error';

/**
 * SharePoint event payload
 */
export interface SharePointEvent {
  type: SharePointEventType;
  timestamp: string;
  data?: unknown;
  error?: SharePointApiError;
}

// ============================================================================
// State Types
// ============================================================================

/**
 * SharePoint connection state
 */
export interface SharePointConnectionState {
  /** Connection status */
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  /** Last error */
  lastError?: SharePointApiError;
  /** Connected site (if any) */
  connectedSite?: SharePointSite;
  /** Connected drive (if any) */
  connectedDrive?: SharePointDrive;
  /** Last successful connection */
  lastConnectedAt?: string;
}

/**
 * Recent SharePoint location (for picker history)
 */
export interface RecentSharePointLocation {
  /** Location details */
  location: SharePointLocation;
  /** Last accessed timestamp */
  lastAccessedAt: string;
  /** Access count */
  accessCount: number;
}
