'use client';

/**
 * SharePoint Hook
 * 
 * Hook for managing SharePoint/OneDrive operations including
 * file browsing, uploads, downloads, and connection state.
 * 
 * @module hooks/useSharePoint
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  SharePointClient,
  getSharePointClient,
  SharePointIntegration,
  createSharePointIntegration,
  SharePointSite,
  SharePointDrive,
  SharePointFolder,
  SharePointFile,
  SharePointLocation,
  SharePointConnectionState,
  SharePointPagedResponse,
  SharePointApiError,
  UploadOptions,
  DownloadOptions,
  ListItemsOptions,
  SharePointSearchOptions,
  SharePointSearchResult,
  LinkedSharePointDocument,
  AutoSaveRule,
  SHAREPOINT_SCOPES,
} from '@/lib/sharepoint';

// ============================================================================
// Types
// ============================================================================

export interface UseSharePointOptions {
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Default site ID */
  defaultSiteId?: string;
  /** Default drive ID */
  defaultDriveId?: string;
}

export interface UseSharePointReturn {
  // Connection State
  connectionState: SharePointConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  hasError: boolean;
  
  // Sites & Drives
  sites: SharePointSite[];
  drives: SharePointDrive[];
  currentSite: SharePointSite | null;
  currentDrive: SharePointDrive | null;
  
  // Browsing State
  currentFolder: SharePointFolder | null;
  currentPath: string[];
  items: (SharePointFile | SharePointFolder)[];
  isLoading: boolean;
  hasMore: boolean;
  
  // Recent & Linked
  recentLocations: SharePointLocation[];
  linkedDocuments: LinkedSharePointDocument[];
  
  // Connection Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  selectSite: (siteId: string) => Promise<void>;
  selectDrive: (driveId: string) => Promise<void>;
  
  // Navigation Actions
  browse: (folderId?: string) => Promise<void>;
  navigateUp: () => Promise<void>;
  navigateToPath: (path: string[]) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  
  // File Operations
  uploadFile: (file: File | Blob, options?: Partial<UploadOptions>) => Promise<SharePointFile>;
  downloadFile: (fileId: string, options?: DownloadOptions) => Promise<Blob>;
  deleteItem: (itemId: string) => Promise<void>;
  createFolder: (name: string) => Promise<SharePointFolder>;
  moveItem: (itemId: string, newParentId: string, newName?: string) => Promise<void>;
  
  // Search
  search: (options: SharePointSearchOptions) => Promise<SharePointSearchResult>;
  
  // Integration
  linkFileToMinute: (file: SharePointFile, minuteId: string) => Promise<LinkedSharePointDocument>;
  unlinkFile: (linkId: string) => Promise<void>;
  getLinkedDocumentsForMinute: (minuteId: string) => Promise<LinkedSharePointDocument[]>;
  autoSaveMinutes: (
    content: Blob | File,
    options: {
      minuteId: string;
      title: string;
      caseReference?: string;
      meetingDate?: Date;
    }
  ) => Promise<LinkedSharePointDocument>;
  
  // Auto-Save Rules
  autoSaveRules: AutoSaveRule[];
  saveAutoSaveRule: (rule: AutoSaveRule) => Promise<void>;
  deleteAutoSaveRule: (ruleId: string) => Promise<void>;
  
  // Error handling
  error: SharePointApiError | null;
  clearError: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSharePoint(options: UseSharePointOptions = {}): UseSharePointReturn {
  const { autoConnect = false, defaultSiteId, defaultDriveId } = options;
  const { isAuthenticated, getToken, account } = useAuth();

  // State
  const [connectionState, setConnectionState] = useState<SharePointConnectionState>({
    status: 'disconnected',
  });
  const [sites, setSites] = useState<SharePointSite[]>([]);
  const [drives, setDrives] = useState<SharePointDrive[]>([]);
  const [currentSite, setCurrentSite] = useState<SharePointSite | null>(null);
  const [currentDrive, setCurrentDrive] = useState<SharePointDrive | null>(null);
  const [currentFolder, setCurrentFolder] = useState<SharePointFolder | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [items, setItems] = useState<(SharePointFile | SharePointFolder)[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SharePointApiError | null>(null);
  const [recentLocations, setRecentLocations] = useState<SharePointLocation[]>([]);
  const [linkedDocuments, setLinkedDocuments] = useState<LinkedSharePointDocument[]>([]);
  const [autoSaveRules, setAutoSaveRules] = useState<AutoSaveRule[]>([]);

  // Memoized client and integration
  const client = useMemo(() => {
    if (!isAuthenticated) return null;
    return getSharePointClient(async () => {
      // Request token with SharePoint scopes
      return getToken(true);
    });
  }, [isAuthenticated, getToken]);

  const integration = useMemo(() => {
    if (!client || !account) return null;
    return createSharePointIntegration(client, account.localAccountId || 'unknown');
  }, [client, account]);

  // Derived state
  const isConnected = connectionState.status === 'connected';
  const isConnecting = connectionState.status === 'connecting';
  const hasError = connectionState.status === 'error' || error !== null;
  const hasMore = !!nextPageToken;

  // ==========================================================================
  // Connection Actions
  // ==========================================================================

  const connect = useCallback(async () => {
    if (!client) {
      setError({
        code: 'accessDenied',
        message: 'Not authenticated. Please sign in first.',
        statusCode: 401,
      });
      return;
    }

    setConnectionState({ status: 'connecting' });
    setError(null);

    try {
      // Get user's OneDrive and followed sites
      const [myDrive, followedSites] = await Promise.all([
        client.getMyDrive(),
        client.getFollowedSites().catch(() => []),
      ]);

      setSites(followedSites);
      setDrives([myDrive]);
      setCurrentDrive(myDrive);

      setConnectionState({
        status: 'connected',
        connectedDrive: myDrive,
        lastConnectedAt: new Date().toISOString(),
      });

      // Load root folder contents
      await browse('root');

      // Load recent locations and linked docs
      if (integration) {
        const [recent, linked, rules] = await Promise.all([
          integration.getRecentLocations(),
          integration.getLinkedDocuments(),
          integration.getAutoSaveRules(),
        ]);
        setRecentLocations(recent);
        setLinkedDocuments(linked);
        setAutoSaveRules(rules);
      }
    } catch (err) {
      const apiError = err as SharePointApiError;
      setConnectionState({
        status: 'error',
        lastError: apiError,
      });
      setError(apiError);
    }
  }, [client, integration]);

  const disconnect = useCallback(() => {
    setConnectionState({ status: 'disconnected' });
    setSites([]);
    setDrives([]);
    setCurrentSite(null);
    setCurrentDrive(null);
    setCurrentFolder(null);
    setCurrentPath([]);
    setItems([]);
    setNextPageToken(undefined);
    setError(null);
  }, []);

  const selectSite = useCallback(async (siteId: string) => {
    if (!client) return;

    setIsLoading(true);
    try {
      const [site, siteDrives] = await Promise.all([
        client.getSite(siteId),
        client.getSiteDrives(siteId),
      ]);

      setCurrentSite(site);
      setDrives(siteDrives);

      if (siteDrives.length > 0) {
        const defaultDrive = siteDrives.find(d => d.name === 'Documents') || siteDrives[0];
        setCurrentDrive(defaultDrive);
        await browse('root');
      }

      setConnectionState(prev => ({
        ...prev,
        connectedSite: site,
      }));
    } catch (err) {
      setError(err as SharePointApiError);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const selectDrive = useCallback(async (driveId: string) => {
    if (!client) return;

    setIsLoading(true);
    try {
      const drive = await client.getDrive(driveId);
      setCurrentDrive(drive);
      setCurrentFolder(null);
      setCurrentPath([]);
      await browse('root');

      setConnectionState(prev => ({
        ...prev,
        connectedDrive: drive,
      }));
    } catch (err) {
      setError(err as SharePointApiError);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  // ==========================================================================
  // Navigation Actions
  // ==========================================================================

  const browse = useCallback(async (folderId: string = 'root', append = false) => {
    if (!client || !currentDrive) return;

    setIsLoading(true);
    try {
      const options: ListItemsOptions = {
        top: 50,
        orderBy: 'name',
        orderDirection: 'asc',
        expand: ['thumbnails'],
      };

      if (append && nextPageToken) {
        options.skipToken = nextPageToken;
      }

      const response = await client.listFolderContents(
        currentDrive.id,
        folderId,
        options
      );

      if (append) {
        setItems(prev => [...prev, ...response.items]);
      } else {
        setItems(response.items);
      }
      setNextPageToken(response.nextPageToken);

      // Update current folder
      if (folderId !== 'root') {
        const folder = await client.getFolder(currentDrive.id, folderId);
        setCurrentFolder(folder as SharePointFolder);

        // Build path from parent references
        const path: string[] = [];
        let current = folder;
        while (current.parentReference?.name && current.parentReference.name !== 'root') {
          path.unshift(current.name);
          // Note: In real implementation, you'd traverse up the tree
          break;
        }
        path.push(folder.name);
        setCurrentPath(path);
      } else {
        setCurrentFolder(null);
        setCurrentPath([]);
      }
    } catch (err) {
      setError(err as SharePointApiError);
    } finally {
      setIsLoading(false);
    }
  }, [client, currentDrive, nextPageToken]);

  const navigateUp = useCallback(async () => {
    if (currentFolder?.parentReference?.id) {
      await browse(currentFolder.parentReference.id);
    } else {
      await browse('root');
    }
  }, [currentFolder, browse]);

  const navigateToPath = useCallback(async (path: string[]) => {
    if (!client || !currentDrive) return;

    if (path.length === 0) {
      await browse('root');
      return;
    }

    setIsLoading(true);
    try {
      const fullPath = path.join('/');
      const folder = await client.getFolderByPath(currentDrive.id, fullPath);
      await browse(folder.id);
    } catch (err) {
      setError(err as SharePointApiError);
    } finally {
      setIsLoading(false);
    }
  }, [client, currentDrive, browse]);

  const refresh = useCallback(async () => {
    await browse(currentFolder?.id || 'root');
  }, [browse, currentFolder]);

  const loadMore = useCallback(async () => {
    if (hasMore) {
      await browse(currentFolder?.id || 'root', true);
    }
  }, [browse, currentFolder, hasMore]);

  // ==========================================================================
  // File Operations
  // ==========================================================================

  const uploadFile = useCallback(async (
    file: File | Blob,
    uploadOptions: Partial<UploadOptions> = {}
  ): Promise<SharePointFile> => {
    if (!client || !currentDrive) {
      throw new Error('Not connected to SharePoint');
    }

    const options: UploadOptions = {
      destinationFolder: currentFolder?.id || 'root',
      driveId: currentDrive.id,
      conflictBehavior: 'rename',
      ...uploadOptions,
    };

    const uploadedFile = await client.uploadFile(file, options);
    await refresh();
    return uploadedFile;
  }, [client, currentDrive, currentFolder, refresh]);

  const downloadFile = useCallback(async (
    fileId: string,
    downloadOptions: DownloadOptions = {}
  ): Promise<Blob> => {
    if (!client || !currentDrive) {
      throw new Error('Not connected to SharePoint');
    }

    return client.downloadFile(currentDrive.id, fileId, downloadOptions);
  }, [client, currentDrive]);

  const deleteItem = useCallback(async (itemId: string): Promise<void> => {
    if (!client || !currentDrive) {
      throw new Error('Not connected to SharePoint');
    }

    await client.deleteItem(currentDrive.id, itemId);
    await refresh();
  }, [client, currentDrive, refresh]);

  const createFolder = useCallback(async (name: string): Promise<SharePointFolder> => {
    if (!client || !currentDrive) {
      throw new Error('Not connected to SharePoint');
    }

    const folder = await client.createFolder({
      driveId: currentDrive.id,
      parentFolder: currentFolder?.id || 'root',
      name,
      conflictBehavior: 'fail',
    });

    await refresh();
    return folder;
  }, [client, currentDrive, currentFolder, refresh]);

  const moveItem = useCallback(async (
    itemId: string,
    newParentId: string,
    newName?: string
  ): Promise<void> => {
    if (!client || !currentDrive) {
      throw new Error('Not connected to SharePoint');
    }

    await client.moveItem(currentDrive.id, itemId, newParentId, newName);
    await refresh();
  }, [client, currentDrive, refresh]);

  // ==========================================================================
  // Search
  // ==========================================================================

  const search = useCallback(async (
    searchOptions: SharePointSearchOptions
  ): Promise<SharePointSearchResult> => {
    if (!client) {
      throw new Error('Not connected to SharePoint');
    }

    return client.search({
      ...searchOptions,
      driveId: searchOptions.driveId || currentDrive?.id,
    });
  }, [client, currentDrive]);

  // ==========================================================================
  // Integration
  // ==========================================================================

  const linkFileToMinute = useCallback(async (
    file: SharePointFile,
    minuteId: string
  ): Promise<LinkedSharePointDocument> => {
    if (!integration) {
      throw new Error('Integration not available');
    }

    const linked = await integration.linkFileToMinute(file, minuteId);
    setLinkedDocuments(prev => [...prev, linked]);
    return linked;
  }, [integration]);

  const unlinkFile = useCallback(async (linkId: string): Promise<void> => {
    if (!integration) {
      throw new Error('Integration not available');
    }

    await integration.unlinkFile(linkId);
    setLinkedDocuments(prev => prev.filter(doc => doc.id !== linkId));
  }, [integration]);

  const getLinkedDocumentsForMinute = useCallback(async (
    minuteId: string
  ): Promise<LinkedSharePointDocument[]> => {
    if (!integration) {
      return [];
    }

    return integration.getLinkedDocumentsForMinute(minuteId);
  }, [integration]);

  const autoSaveMinutes = useCallback(async (
    content: Blob | File,
    saveOptions: {
      minuteId: string;
      title: string;
      caseReference?: string;
      meetingDate?: Date;
    }
  ): Promise<LinkedSharePointDocument> => {
    if (!integration || !currentDrive || !currentSite) {
      throw new Error('Not connected to SharePoint');
    }

    const location: SharePointLocation = {
      site: currentSite || {
        id: 'default',
        displayName: 'My Drive',
        webUrl: '',
        createdDateTime: '',
        lastModifiedDateTime: '',
      },
      drive: currentDrive,
      folderId: currentFolder?.id || 'root',
      folderPath: currentPath.join('/'),
      displayPath: currentPath.length > 0 ? currentPath.join(' > ') : 'Root',
    };

    const linked = await integration.autoSaveMinutes(content, {
      ...saveOptions,
      location,
    });

    setLinkedDocuments(prev => [...prev, linked]);
    await refresh();
    return linked;
  }, [integration, currentDrive, currentSite, currentFolder, currentPath, refresh]);

  // ==========================================================================
  // Auto-Save Rules
  // ==========================================================================

  const saveAutoSaveRule = useCallback(async (rule: AutoSaveRule): Promise<void> => {
    if (!integration) {
      throw new Error('Integration not available');
    }

    await integration.saveAutoSaveRule(rule);
    const rules = await integration.getAutoSaveRules();
    setAutoSaveRules(rules);
  }, [integration]);

  const deleteAutoSaveRule = useCallback(async (ruleId: string): Promise<void> => {
    if (!integration) {
      throw new Error('Integration not available');
    }

    await integration.deleteAutoSaveRule(ruleId);
    setAutoSaveRules(prev => prev.filter(r => r.id !== ruleId));
  }, [integration]);

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  const clearError = useCallback(() => {
    setError(null);
    if (connectionState.status === 'error') {
      setConnectionState({ status: 'disconnected' });
    }
  }, [connectionState.status]);

  // ==========================================================================
  // Effects
  // ==========================================================================

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && isAuthenticated && connectionState.status === 'disconnected') {
      connect();
    }
  }, [autoConnect, isAuthenticated, connectionState.status, connect]);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // Connection State
    connectionState,
    isConnected,
    isConnecting,
    hasError,

    // Sites & Drives
    sites,
    drives,
    currentSite,
    currentDrive,

    // Browsing State
    currentFolder,
    currentPath,
    items,
    isLoading,
    hasMore,

    // Recent & Linked
    recentLocations,
    linkedDocuments,

    // Connection Actions
    connect,
    disconnect,
    selectSite,
    selectDrive,

    // Navigation Actions
    browse,
    navigateUp,
    navigateToPath,
    refresh,
    loadMore,

    // File Operations
    uploadFile,
    downloadFile,
    deleteItem,
    createFolder,
    moveItem,

    // Search
    search,

    // Integration
    linkFileToMinute,
    unlinkFile,
    getLinkedDocumentsForMinute,
    autoSaveMinutes,

    // Auto-Save Rules
    autoSaveRules,
    saveAutoSaveRule,
    deleteAutoSaveRule,

    // Error handling
    error,
    clearError,
  };
}

// ==========================================================================
// Simplified Hooks
// ==========================================================================

/**
 * Hook for just checking SharePoint connection status
 */
export function useSharePointStatus() {
  const { isConnected, isConnecting, hasError, error, connect } = useSharePoint();
  return { isConnected, isConnecting, hasError, error, connect };
}

/**
 * Hook for browsing SharePoint files
 */
export function useSharePointBrowser() {
  const {
    isConnected,
    currentFolder,
    currentPath,
    items,
    isLoading,
    hasMore,
    browse,
    navigateUp,
    loadMore,
    refresh,
    search,
  } = useSharePoint({ autoConnect: true });

  return {
    isConnected,
    currentFolder,
    currentPath,
    items,
    isLoading,
    hasMore,
    browse,
    navigateUp,
    loadMore,
    refresh,
    search,
  };
}

/**
 * Hook for uploading files to SharePoint
 */
export function useSharePointUpload() {
  const { isConnected, currentDrive, currentFolder, uploadFile, error } = useSharePoint();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const upload = useCallback(async (
    file: File | Blob,
    options?: Partial<UploadOptions>
  ): Promise<SharePointFile> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadFile(file, {
        ...options,
        onProgress: (progress) => {
          setUploadProgress(progress.percentage);
          options?.onProgress?.(progress);
        },
      });
      return result;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [uploadFile]);

  return {
    isConnected,
    currentDrive,
    currentFolder,
    upload,
    isUploading,
    uploadProgress,
    error,
  };
}
