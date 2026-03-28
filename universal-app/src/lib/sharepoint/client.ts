/**
 * SharePoint/OneDrive Graph API Client
 * 
 * Client for Microsoft Graph API operations on SharePoint and OneDrive.
 * Handles authentication, file operations, and folder management.
 * 
 * @module lib/sharepoint/client
 */

import {
  SharePointConfig,
  SharePointSite,
  SharePointDrive,
  SharePointFolder,
  SharePointFile,
  SharePointPagedResponse,
  SharePointSearchResult,
  SharePointSearchOptions,
  SharePointApiError,
  SharePointErrorCode,
  UploadOptions,
  UploadProgress,
  DownloadOptions,
  DownloadProgress,
  CreateFolderOptions,
  ListItemsOptions,
  defaultSharePointConfig,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
const LARGE_FILE_THRESHOLD = 4 * 1024 * 1024; // 4MB - use upload sessions above this
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for large uploads
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// SharePoint Graph API scopes required
export const SHAREPOINT_SCOPES = [
  'Sites.Read.All',
  'Sites.ReadWrite.All',
  'Files.Read.All',
  'Files.ReadWrite.All',
];

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Parse Graph API error response
 */
function parseGraphError(response: Response, body: unknown): SharePointApiError {
  const error = (body as { error?: { code?: string; message?: string; innerError?: unknown } })?.error;
  
  return {
    code: (error?.code as SharePointErrorCode) || 'unknown',
    message: error?.message || `HTTP ${response.status}: ${response.statusText}`,
    innerError: error?.innerError as SharePointApiError['innerError'],
    statusCode: response.status,
  };
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: SharePointApiError): boolean {
  const retryableCodes: SharePointErrorCode[] = [
    'serviceNotAvailable',
    'throttledRequest',
    'tooManyRequests',
    'generalException',
  ];
  return retryableCodes.includes(error.code) || error.statusCode >= 500;
}

// ============================================================================
// SharePoint Client Class
// ============================================================================

export class SharePointClient {
  private config: SharePointConfig;
  private getAccessToken: () => Promise<string | null>;
  
  constructor(
    getAccessToken: () => Promise<string | null>,
    config: Partial<SharePointConfig> = {}
  ) {
    this.getAccessToken = getAccessToken;
    this.config = { ...defaultSharePointConfig, ...config };
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Make authenticated Graph API request
   */
  private async graphRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = MAX_RETRIES
  ): Promise<T> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('No access token available. Please sign in.');
    }

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.config.graphBaseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle successful responses
    if (response.ok) {
      if (response.status === 204) {
        return {} as T;
      }
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return response.json();
      }
      return response.blob() as unknown as T;
    }

    // Parse error
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = { error: { message: response.statusText } };
    }

    const apiError = parseGraphError(response, errorBody);

    // Retry logic
    if (retries > 0 && isRetryableError(apiError)) {
      const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.graphRequest<T>(endpoint, options, retries - 1);
    }

    throw apiError;
  }

  // ==========================================================================
  // Sites
  // ==========================================================================

  /**
   * Get root site
   */
  async getRootSite(): Promise<SharePointSite> {
    return this.graphRequest<SharePointSite>('/sites/root');
  }

  /**
   * Search sites
   */
  async searchSites(query: string): Promise<SharePointSite[]> {
    const response = await this.graphRequest<{ value: SharePointSite[] }>(
      `/sites?search=${encodeURIComponent(query)}`
    );
    return response.value;
  }

  /**
   * Get site by ID
   */
  async getSite(siteId: string): Promise<SharePointSite> {
    return this.graphRequest<SharePointSite>(`/sites/${siteId}`);
  }

  /**
   * Get sites the user has access to
   */
  async getFollowedSites(): Promise<SharePointSite[]> {
    const response = await this.graphRequest<{ value: SharePointSite[] }>(
      '/me/followedSites'
    );
    return response.value;
  }

  // ==========================================================================
  // Drives
  // ==========================================================================

  /**
   * Get user's OneDrive
   */
  async getMyDrive(): Promise<SharePointDrive> {
    return this.graphRequest<SharePointDrive>('/me/drive');
  }

  /**
   * Get drives for a site
   */
  async getSiteDrives(siteId: string): Promise<SharePointDrive[]> {
    const response = await this.graphRequest<{ value: SharePointDrive[] }>(
      `/sites/${siteId}/drives`
    );
    return response.value;
  }

  /**
   * Get drive by ID
   */
  async getDrive(driveId: string): Promise<SharePointDrive> {
    return this.graphRequest<SharePointDrive>(`/drives/${driveId}`);
  }

  /**
   * Get shared drives the user has access to
   */
  async getSharedDrives(): Promise<SharePointDrive[]> {
    const response = await this.graphRequest<{ value: SharePointDrive[] }>(
      '/me/drives'
    );
    return response.value;
  }

  // ==========================================================================
  // Folders
  // ==========================================================================

  /**
   * Get folder by ID
   */
  async getFolder(driveId: string, folderId: string): Promise<SharePointFolder> {
    return this.graphRequest<SharePointFolder>(
      `/drives/${driveId}/items/${folderId}`
    );
  }

  /**
   * Get folder by path
   */
  async getFolderByPath(driveId: string, path: string): Promise<SharePointFolder> {
    const encodedPath = encodeURIComponent(path);
    return this.graphRequest<SharePointFolder>(
      `/drives/${driveId}/root:/${encodedPath}`
    );
  }

  /**
   * List folder contents
   */
  async listFolderContents(
    driveId: string,
    folderId: string = 'root',
    options: ListItemsOptions = {}
  ): Promise<SharePointPagedResponse<SharePointFile | SharePointFolder>> {
    const params = new URLSearchParams();
    
    if (options.top) params.set('$top', options.top.toString());
    if (options.skipToken) params.set('$skipToken', options.skipToken);
    if (options.orderBy) {
      params.set('$orderBy', `${options.orderBy} ${options.orderDirection || 'asc'}`);
    }
    if (options.filter) params.set('$filter', options.filter);
    if (options.select?.length) params.set('$select', options.select.join(','));
    if (options.expand?.length) params.set('$expand', options.expand.join(','));

    const queryString = params.toString();
    const endpoint = `/drives/${driveId}/items/${folderId}/children${queryString ? `?${queryString}` : ''}`;

    const response = await this.graphRequest<{
      value: (SharePointFile | SharePointFolder)[];
      '@odata.nextLink'?: string;
      '@odata.count'?: number;
    }>(endpoint);

    return {
      items: response.value,
      nextPageToken: response['@odata.nextLink'],
      totalCount: response['@odata.count'],
    };
  }

  /**
   * Create a new folder
   */
  async createFolder(options: CreateFolderOptions): Promise<SharePointFolder> {
    const driveId = options.driveId || this.config.defaultDriveId;
    if (!driveId) {
      throw new Error('Drive ID is required');
    }

    const parentId = options.parentFolder || 'root';
    const conflictBehavior = options.conflictBehavior || 'rename';

    return this.graphRequest<SharePointFolder>(
      `/drives/${driveId}/items/${parentId}/children`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: options.name,
          folder: {},
          '@microsoft.graph.conflictBehavior': conflictBehavior,
        }),
      }
    );
  }

  /**
   * Create nested folder path (creates all folders in path)
   */
  async createFolderPath(driveId: string, path: string): Promise<SharePointFolder> {
    const parts = path.split('/').filter(Boolean);
    let currentPath = '';
    let currentFolder: SharePointFolder | null = null;

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      try {
        currentFolder = await this.getFolderByPath(driveId, currentPath);
      } catch (error) {
        const apiError = error as SharePointApiError;
        if (apiError.code === 'itemNotFound') {
          // Create the folder
          const parentPath = currentPath.split('/').slice(0, -1).join('/');
          const parentId = parentPath
            ? (await this.getFolderByPath(driveId, parentPath)).id
            : 'root';
          
          currentFolder = await this.createFolder({
            driveId,
            parentFolder: parentId,
            name: part,
            conflictBehavior: 'fail',
          });
        } else {
          throw error;
        }
      }
    }

    return currentFolder!;
  }

  // ==========================================================================
  // Files
  // ==========================================================================

  /**
   * Get file by ID
   */
  async getFile(driveId: string, fileId: string): Promise<SharePointFile> {
    return this.graphRequest<SharePointFile>(
      `/drives/${driveId}/items/${fileId}`
    );
  }

  /**
   * Get file by path
   */
  async getFileByPath(driveId: string, path: string): Promise<SharePointFile> {
    const encodedPath = encodeURIComponent(path);
    return this.graphRequest<SharePointFile>(
      `/drives/${driveId}/root:/${encodedPath}`
    );
  }

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(driveId: string, fileId: string): Promise<string> {
    const file = await this.graphRequest<SharePointFile & { '@microsoft.graph.downloadUrl': string }>(
      `/drives/${driveId}/items/${fileId}?select=id,@microsoft.graph.downloadUrl`
    );
    return file['@microsoft.graph.downloadUrl'];
  }

  /**
   * Download file content
   */
  async downloadFile(
    driveId: string,
    fileId: string,
    options: DownloadOptions = {}
  ): Promise<Blob> {
    const downloadUrl = await this.getDownloadUrl(driveId, fileId);
    
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw {
        code: 'downloadFailed' as SharePointErrorCode,
        message: `Download failed: ${response.statusText}`,
        statusCode: response.status,
      } as SharePointApiError;
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : undefined;

    if (options.onProgress && totalBytes) {
      // Stream with progress tracking
      const reader = response.body?.getReader();
      if (!reader) {
        return response.blob();
      }

      const chunks: Uint8Array[] = [];
      let bytesDownloaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        bytesDownloaded += value.length;
        
        options.onProgress({
          bytesDownloaded,
          totalBytes,
          percentage: Math.round((bytesDownloaded / totalBytes) * 100),
        });
      }

      return new Blob(chunks);
    }

    return response.blob();
  }

  /**
   * Upload small file (< 4MB)
   */
  async uploadSmallFile(
    file: File | Blob,
    options: UploadOptions
  ): Promise<SharePointFile> {
    const driveId = options.driveId || this.config.defaultDriveId;
    if (!driveId) {
      throw new Error('Drive ID is required');
    }

    const fileName = options.fileName || (file instanceof File ? file.name : 'uploaded-file');
    const conflictBehavior = options.conflictBehavior || 'rename';
    const folderPath = options.destinationFolder.replace(/^\/+|\/+$/g, '');
    
    const endpoint = folderPath
      ? `/drives/${driveId}/root:/${folderPath}/${fileName}:/content`
      : `/drives/${driveId}/root:/${fileName}:/content`;

    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${this.config.graphBaseUrl}${endpoint}?@microsoft.graph.conflictBehavior=${conflictBehavior}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw parseGraphError(response, errorBody);
    }

    return response.json();
  }

  /**
   * Upload large file using upload session (> 4MB)
   */
  async uploadLargeFile(
    file: File | Blob,
    options: UploadOptions
  ): Promise<SharePointFile> {
    const driveId = options.driveId || this.config.defaultDriveId;
    if (!driveId) {
      throw new Error('Drive ID is required');
    }

    const fileName = options.fileName || (file instanceof File ? file.name : 'uploaded-file');
    const conflictBehavior = options.conflictBehavior || 'rename';
    const folderPath = options.destinationFolder.replace(/^\/+|\/+$/g, '');
    const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;

    // Step 1: Create upload session
    const sessionEndpoint = folderPath
      ? `/drives/${driveId}/root:/${folderPath}/${fileName}:/createUploadSession`
      : `/drives/${driveId}/root:/${fileName}:/createUploadSession`;

    const session = await this.graphRequest<{ uploadUrl: string; expirationDateTime: string }>(
      sessionEndpoint,
      {
        method: 'POST',
        body: JSON.stringify({
          item: {
            '@microsoft.graph.conflictBehavior': conflictBehavior,
            name: fileName,
          },
        }),
      }
    );

    // Step 2: Upload in chunks
    const totalSize = file.size;
    const totalChunks = Math.ceil(totalSize / chunkSize);
    let uploadedBytes = 0;
    const startTime = Date.now();

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, totalSize);
      const chunk = file.slice(start, end);

      const response = await fetch(session.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': chunk.size.toString(),
          'Content-Range': `bytes ${start}-${end - 1}/${totalSize}`,
        },
        body: chunk,
      });

      if (!response.ok && response.status !== 202) {
        const errorBody = await response.json().catch(() => ({}));
        throw parseGraphError(response, errorBody);
      }

      uploadedBytes = end;

      // Report progress
      if (options.onProgress) {
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = uploadedBytes / elapsed;
        const remaining = (totalSize - uploadedBytes) / speed;

        options.onProgress({
          bytesUploaded: uploadedBytes,
          totalBytes: totalSize,
          percentage: Math.round((uploadedBytes / totalSize) * 100),
          currentChunk: chunkIndex + 1,
          totalChunks,
          estimatedTimeRemaining: Math.round(remaining),
        });
      }

      // Last chunk returns the completed file
      if (response.status === 200 || response.status === 201) {
        return response.json();
      }
    }

    // Should not reach here
    throw new Error('Upload incomplete');
  }

  /**
   * Upload file (auto-selects small or large file upload)
   */
  async uploadFile(
    file: File | Blob,
    options: UploadOptions
  ): Promise<SharePointFile> {
    // Validate file size
    if (file.size > this.config.maxFileSize) {
      throw {
        code: 'invalidRequest' as SharePointErrorCode,
        message: `File size (${file.size} bytes) exceeds maximum allowed (${this.config.maxFileSize} bytes)`,
        statusCode: 400,
      } as SharePointApiError;
    }

    // Validate file type
    if (file.type && !this.config.supportedFileTypes.includes(file.type)) {
      console.warn(`File type ${file.type} may not be supported`);
    }

    // Use appropriate upload method
    if (file.size < LARGE_FILE_THRESHOLD) {
      return this.uploadSmallFile(file, options);
    } else {
      return this.uploadLargeFile(file, options);
    }
  }

  /**
   * Delete file or folder
   */
  async deleteItem(driveId: string, itemId: string): Promise<void> {
    await this.graphRequest<void>(
      `/drives/${driveId}/items/${itemId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Move or rename item
   */
  async moveItem(
    driveId: string,
    itemId: string,
    newParentId?: string,
    newName?: string
  ): Promise<SharePointFile | SharePointFolder> {
    const body: Record<string, unknown> = {};
    
    if (newParentId) {
      body.parentReference = { id: newParentId };
    }
    if (newName) {
      body.name = newName;
    }

    return this.graphRequest<SharePointFile | SharePointFolder>(
      `/drives/${driveId}/items/${itemId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      }
    );
  }

  /**
   * Copy item
   */
  async copyItem(
    driveId: string,
    itemId: string,
    destinationParentId: string,
    destinationDriveId?: string,
    newName?: string
  ): Promise<{ monitorUrl: string }> {
    const body: Record<string, unknown> = {
      parentReference: {
        driveId: destinationDriveId || driveId,
        id: destinationParentId,
      },
    };
    
    if (newName) {
      body.name = newName;
    }

    const response = await this.graphRequest<unknown>(
      `/drives/${driveId}/items/${itemId}/copy`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    return { monitorUrl: (response as { Location?: string }).Location || '' };
  }

  // ==========================================================================
  // Search
  // ==========================================================================

  /**
   * Search for files and folders
   */
  async search(options: SharePointSearchOptions): Promise<SharePointSearchResult> {
    let endpoint: string;
    
    if (options.driveId) {
      endpoint = `/drives/${options.driveId}/root/search(q='${encodeURIComponent(options.query)}')`;
    } else if (options.siteId) {
      endpoint = `/sites/${options.siteId}/drive/root/search(q='${encodeURIComponent(options.query)}')`;
    } else {
      endpoint = `/me/drive/root/search(q='${encodeURIComponent(options.query)}')`;
    }

    const params = new URLSearchParams();
    if (options.top) params.set('$top', options.top.toString());

    const queryString = params.toString();
    if (queryString) {
      endpoint += `&${queryString}`;
    }

    const response = await this.graphRequest<{
      value: (SharePointFile | SharePointFolder)[];
      '@odata.count'?: number;
      '@odata.nextLink'?: string;
    }>(endpoint);

    const files: SharePointFile[] = [];
    const folders: SharePointFolder[] = [];

    for (const item of response.value) {
      if ('folder' in item && item.folder) {
        if (options.includeFolders !== false) {
          folders.push(item as SharePointFolder);
        }
      } else {
        files.push(item as SharePointFile);
      }
    }

    return {
      files,
      folders,
      totalHits: response['@odata.count'] || response.value.length,
      hasMore: !!response['@odata.nextLink'],
    };
  }

  // ==========================================================================
  // File Versions
  // ==========================================================================

  /**
   * Get file version history
   */
  async getFileVersions(driveId: string, fileId: string): Promise<SharePointFile['versions']> {
    const response = await this.graphRequest<{ value: SharePointFile['versions'] }>(
      `/drives/${driveId}/items/${fileId}/versions`
    );
    return response.value;
  }

  /**
   * Restore a specific version
   */
  async restoreVersion(driveId: string, fileId: string, versionId: string): Promise<void> {
    await this.graphRequest<void>(
      `/drives/${driveId}/items/${fileId}/versions/${versionId}/restoreVersion`,
      { method: 'POST' }
    );
  }

  // ==========================================================================
  // Sharing
  // ==========================================================================

  /**
   * Create sharing link
   */
  async createSharingLink(
    driveId: string,
    itemId: string,
    type: 'view' | 'edit' = 'view',
    scope: 'anonymous' | 'organization' = 'organization'
  ): Promise<{ link: { webUrl: string } }> {
    return this.graphRequest<{ link: { webUrl: string } }>(
      `/drives/${driveId}/items/${itemId}/createLink`,
      {
        method: 'POST',
        body: JSON.stringify({ type, scope }),
      }
    );
  }

  /**
   * Get sharing permissions
   */
  async getPermissions(driveId: string, itemId: string): Promise<unknown[]> {
    const response = await this.graphRequest<{ value: unknown[] }>(
      `/drives/${driveId}/items/${itemId}/permissions`
    );
    return response.value;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let clientInstance: SharePointClient | null = null;

/**
 * Get or create SharePoint client instance
 */
export function getSharePointClient(
  getAccessToken: () => Promise<string | null>,
  config?: Partial<SharePointConfig>
): SharePointClient {
  if (!clientInstance) {
    clientInstance = new SharePointClient(getAccessToken, config);
  }
  return clientInstance;
}

/**
 * Reset client instance (for testing or logout)
 */
export function resetSharePointClient(): void {
  clientInstance = null;
}
