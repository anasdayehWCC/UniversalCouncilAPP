'use client';

/**
 * SharePoint File Browser
 * 
 * Full-featured file browser component for SharePoint/OneDrive
 * with grid/list views, search, and file operations.
 * 
 * @module components/sharepoint/SharePointBrowser
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSharePoint } from '@/hooks/useSharePoint';
import { SharePointFile, SharePointFolder, SharePointSearchOptions } from '@/lib/sharepoint';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// Icons
// ============================================================================

const FolderIcon = ({ className }: { className?: string }) => (
  <svg className={cn("w-6 h-6", className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8C3 6.34315 4.34315 5 6 5H9.17157C9.70201 5 10.2107 5.21071 10.5858 5.58579L11.4142 6.41421C11.7893 6.78929 12.298 7 12.8284 7H18C19.6569 7 21 8.34315 21 10V16C21 17.6569 19.6569 19 18 19H6C4.34315 19 3 17.6569 3 16V8Z" fill="url(#folder-grad)" />
    <defs>
      <linearGradient id="folder-grad" x1="3" y1="5" x2="21" y2="19">
        <stop stopColor="#FFB900" />
        <stop offset="1" stopColor="#FF8C00" />
      </linearGradient>
    </defs>
  </svg>
);

const FileIcon = ({ mimeType, className }: { mimeType?: string; className?: string }) => {
  const getColor = () => {
    if (!mimeType) return ['#6B7280', '#4B5563'];
    if (mimeType.includes('pdf')) return ['#DC2626', '#B91C1C'];
    if (mimeType.includes('word')) return ['#2563EB', '#1D4ED8'];
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return ['#16A34A', '#15803D'];
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return ['#EA580C', '#C2410C'];
    if (mimeType.includes('image')) return ['#7C3AED', '#6D28D9'];
    if (mimeType.includes('audio')) return ['#2DD4BF', '#14B8A6'];
    if (mimeType.includes('video')) return ['#F43F5E', '#E11D48'];
    return ['#6B7280', '#4B5563'];
  };

  const [color1, color2] = getColor();

  return (
    <svg className={cn("w-6 h-6", className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill={`url(#file-${mimeType?.replace(/[^a-z]/g, '')})`} />
      <path d="M14 2V8H20" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
      <defs>
        <linearGradient id={`file-${mimeType?.replace(/[^a-z]/g, '')}`} x1="4" y1="2" x2="20" y2="22">
          <stop stopColor={color1} />
          <stop offset="1" stopColor={color2} />
        </linearGradient>
      </defs>
    </svg>
  );
};

const SearchIcon = ({ 'aria-hidden': ariaHidden }: { 'aria-hidden'?: 'true' | 'false' }) => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden={ariaHidden}>
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4V16M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4V16M12 16L8 12M12 16L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.51 15C4.15839 16.8404 5.38734 18.4202 7.01166 19.5014C8.63598 20.5826 10.5677 21.1066 12.5157 20.9945C14.4637 20.8824 16.3226 20.1402 17.8121 18.8798C19.3017 17.6193 20.3413 15.9085 20.775 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20.49 9C19.8416 7.15958 18.6127 5.57979 16.9883 4.49862C15.364 3.41745 13.4323 2.8934 11.4843 3.00553C9.53627 3.11765 7.67738 3.85977 6.18786 5.12023C4.69833 6.38069 3.65868 8.09151 3.225 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
    <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MoreIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
    <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
    <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'grid' | 'list';

interface SharePointBrowserProps {
  /** Called when a file is selected */
  onFileSelect?: (file: SharePointFile) => void;
  /** Called when a file is double-clicked or action triggered */
  onFileOpen?: (file: SharePointFile) => void;
  /** Allow multiple file selection */
  multiSelect?: boolean;
  /** File types to filter (mime types) */
  acceptedTypes?: string[];
  /** Show upload button */
  showUpload?: boolean;
  /** Custom class name */
  className?: string;
  /** Compact mode */
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function SharePointBrowser({
  onFileSelect,
  onFileOpen,
  multiSelect = false,
  acceptedTypes,
  showUpload = true,
  className,
  compact = false,
}: SharePointBrowserProps) {
  const {
    isConnected,
    isConnecting,
    currentDrive,
    currentFolder,
    currentPath,
    items,
    isLoading,
    hasMore,
    connect,
    browse,
    navigateUp,
    loadMore,
    refresh,
    uploadFile,
    downloadFile,
    deleteItem,
    search,
    error,
    clearError,
  } = useSharePoint({ autoConnect: true });

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SharePointFile[] | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Filter items based on accepted types
  const filteredItems = useMemo(() => {
    const source = searchResults || items;
    if (!acceptedTypes || acceptedTypes.length === 0) return source;
    
    return source.filter((item) => {
      if ('folder' in item && item.folder) return true;
      const file = item as SharePointFile;
      return acceptedTypes.some(type => file.mimeType?.includes(type) || type === '*');
    });
  }, [items, searchResults, acceptedTypes]);

  // Separate folders and files
  const { folders, files } = useMemo(() => {
    const folders: SharePointFolder[] = [];
    const files: SharePointFile[] = [];
    
    for (const item of filteredItems) {
      if ('folder' in item && item.folder) {
        folders.push(item as SharePointFolder);
      } else {
        files.push(item as SharePointFile);
      }
    }
    
    return { folders, files };
  }, [filteredItems]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const results = await search({ query: searchQuery, top: 50 });
      setSearchResults(results.files);
    } catch {
      // Error handled by hook
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, search]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults(null);
  }, []);

  const handleItemClick = useCallback((item: SharePointFile | SharePointFolder) => {
    if ('folder' in item && item.folder) {
      browse(item.id);
      setSelectedItems(new Set());
    } else {
      const file = item as SharePointFile;
      if (multiSelect) {
        setSelectedItems(prev => {
          const next = new Set(prev);
          if (next.has(file.id)) {
            next.delete(file.id);
          } else {
            next.add(file.id);
          }
          return next;
        });
      } else {
        setSelectedItems(new Set([file.id]));
      }
      onFileSelect?.(file);
    }
  }, [browse, multiSelect, onFileSelect]);

  const handleItemDoubleClick = useCallback((item: SharePointFile | SharePointFolder) => {
    if ('folder' in item && item.folder) {
      browse(item.id);
    } else {
      onFileOpen?.(item as SharePointFile);
    }
  }, [browse, onFileOpen]);

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        await uploadFile(file);
      } catch {
        // Error handled by hook
      }
    }
    
    // Reset input
    event.target.value = '';
  }, [uploadFile]);

  const handleDownload = useCallback(async (file: SharePointFile) => {
    try {
      const blob = await downloadFile(file.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Error handled by hook
    }
    setActionMenuId(null);
  }, [downloadFile]);

  const handleDelete = useCallback(async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(itemId);
      } catch {
        // Error handled by hook
      }
    }
    setActionMenuId(null);
  }, [deleteItem]);

  // Not connected state
  if (!isConnected && !isConnecting) {
    return (
      <Card className={cn("p-8", className)}>
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <div className="p-4 bg-muted rounded-full">
            <svg className="w-8 h-8 text-muted-foreground" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="2" />
              <circle cx="7" cy="14" r="4" stroke="currentColor" strokeWidth="2" />
              <circle cx="16" cy="15" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Connect to SharePoint</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Access your SharePoint and OneDrive files
            </p>
          </div>
          <Button onClick={connect}>Connect</Button>
        </div>
      </Card>
    );
  }

  // Connecting state
  if (isConnecting) {
    return (
      <Card className={cn("p-8", className)}>
        <div className="flex flex-col items-center justify-center gap-4">
          <SpinnerIcon />
          <p className="text-muted-foreground">Connecting to SharePoint...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <CardHeader className={cn("space-y-4", compact ? "p-3" : "p-4")}>
        <div className="flex items-center justify-between gap-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm overflow-x-auto">
            <button
              onClick={() => browse('root')}
              className="text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              {currentDrive?.name || 'My Drive'}
            </button>
            {currentPath.map((part, index) => (
              <React.Fragment key={index}>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground whitespace-nowrap">{part}</span>
              </React.Fragment>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={refresh}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              title="Refresh"
            >
              <RefreshIcon />
            </button>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'
                )}
                title="List view"
              >
                <ListIcon />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'
                )}
                title="Grid view"
              >
                <GridIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Upload */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <SearchIcon aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search files..."
              aria-label="Search SharePoint files"
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>
          {showUpload && (
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleUpload}
                className="hidden"
              />
              <Button size="sm" className="gap-2">
                <UploadIcon />
                Upload
              </Button>
            </label>
          )}
        </div>

        {/* Search results indicator */}
        {searchResults && (
          <div className="flex items-center justify-between bg-muted px-3 py-2 rounded-lg">
            <span className="text-sm text-muted-foreground">
              Found {searchResults.length} result(s) for "{searchQuery}"
            </span>
            <button
              onClick={handleClearSearch}
              className="text-sm text-[var(--primary)] hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className={cn("p-0", compact ? "max-h-64 overflow-y-auto" : "max-h-96 overflow-y-auto")}>
        {isLoading || isSearching ? (
          <div className="flex items-center justify-center h-48">
            <SpinnerIcon />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-destructive text-sm">{error.message}</p>
            <Button variant="outline" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <p>No files found</p>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
            {/* Up navigation */}
            {currentFolder && !searchResults && (
              <button
                onClick={navigateUp}
                className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors"
              >
                <FolderIcon className="w-10 h-10 opacity-50" />
                <span className="text-sm text-muted-foreground">← Up</span>
              </button>
            )}
            
            {/* Folders */}
            {folders.map((folder) => (
              <motion.button
                key={folder.id}
                onClick={() => handleItemClick(folder)}
                onDoubleClick={() => handleItemDoubleClick(folder)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FolderIcon className="w-10 h-10" />
                <span className="text-sm text-center truncate w-full">{folder.name}</span>
              </motion.button>
            ))}
            
            {/* Files */}
            {files.map((file) => (
              <motion.button
                key={file.id}
                onClick={() => handleItemClick(file)}
                onDoubleClick={() => handleItemDoubleClick(file)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors relative",
                  selectedItems.has(file.id) && "bg-info/10 ring-2 ring-info"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FileIcon mimeType={file.mimeType} className="w-10 h-10" />
                <span className="text-sm text-center truncate w-full">{file.name}</span>
                <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
              </motion.button>
            ))}
          </div>
        ) : (
          // List View
          <div className="divide-y">
            {/* Up navigation */}
            {currentFolder && !searchResults && (
              <button
                onClick={navigateUp}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
              >
                <span className="text-muted-foreground">←</span>
                <span className="text-muted-foreground">Up one level</span>
              </button>
            )}
            
            {/* Folders */}
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleItemClick(folder)}
                onDoubleClick={() => handleItemDoubleClick(folder)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
              >
                <FolderIcon />
                <span className="flex-1 text-left truncate">{folder.name}</span>
                <span className="text-sm text-muted-foreground">
                  {folder.folder.childCount} items
                </span>
              </button>
            ))}
            
            {/* Files */}
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors group",
                  selectedItems.has(file.id) && "bg-info/10"
                )}
              >
                <button
                  onClick={() => handleItemClick(file)}
                  onDoubleClick={() => handleItemDoubleClick(file)}
                  className="flex-1 flex items-center gap-3"
                >
                  <FileIcon mimeType={file.mimeType} />
                  <div className="flex-1 text-left min-w-0">
                    <p className="truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)} • {formatDate(file.lastModifiedDateTime)}
                    </p>
                  </div>
                </button>
                
                {/* Actions */}
                <div className="relative">
                  <button
                    onClick={() => setActionMenuId(actionMenuId === file.id ? null : file.id)}
                    className="p-2 rounded-lg hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreIcon />
                  </button>
                  
                  <AnimatePresence>
                    {actionMenuId === file.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-full mt-1 z-10 bg-white rounded-lg shadow-lg border py-1 min-w-32"
                      >
                        <button
                          onClick={() => handleDownload(file)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                        >
                          <DownloadIcon />
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive"
                        >
                          <TrashIcon />
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !isLoading && !searchResults && (
          <div className="p-4 text-center">
            <Button variant="outline" onClick={loadMore}>
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default SharePointBrowser;
