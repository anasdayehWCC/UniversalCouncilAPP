'use client';

/**
 * SharePoint Location Picker
 * 
 * Modal component for selecting SharePoint/OneDrive locations
 * (sites, drives, folders) for saving or linking documents.
 * 
 * @module components/sharepoint/SharePointPicker
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSharePoint } from '@/hooks/useSharePoint';
import { SharePointLocation, SharePointSite, SharePointDrive, SharePointFolder } from '@/lib/sharepoint';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// Icons (Inline SVG for premium look)
// ============================================================================

const SharePointIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="6" fill="url(#sp-gradient-1)" />
    <circle cx="7" cy="14" r="5" fill="url(#sp-gradient-2)" />
    <circle cx="16" cy="16" r="4" fill="url(#sp-gradient-3)" />
    <defs>
      <linearGradient id="sp-gradient-1" x1="6" y1="2" x2="18" y2="14">
        <stop stopColor="#036C70" />
        <stop offset="1" stopColor="#05A6A6" />
      </linearGradient>
      <linearGradient id="sp-gradient-2" x1="2" y1="9" x2="12" y2="19">
        <stop stopColor="#1A9BA1" />
        <stop offset="1" stopColor="#37C6D0" />
      </linearGradient>
      <linearGradient id="sp-gradient-3" x1="12" y1="12" x2="20" y2="20">
        <stop stopColor="#03787C" />
        <stop offset="1" stopColor="#038387" />
      </linearGradient>
    </defs>
  </svg>
);

const FolderIcon = ({ className }: { className?: string }) => (
  <svg className={cn("w-5 h-5", className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8C3 6.34315 4.34315 5 6 5H9.17157C9.70201 5 10.2107 5.21071 10.5858 5.58579L11.4142 6.41421C11.7893 6.78929 12.298 7 12.8284 7H18C19.6569 7 21 8.34315 21 10V16C21 17.6569 19.6569 19 18 19H6C4.34315 19 3 17.6569 3 16V8Z" fill="url(#folder-gradient)" />
    <defs>
      <linearGradient id="folder-gradient" x1="3" y1="5" x2="21" y2="19">
        <stop stopColor="#FFB900" />
        <stop offset="1" stopColor="#FF8C00" />
      </linearGradient>
    </defs>
  </svg>
);

const DriveIcon = ({ className }: { className?: string }) => (
  <svg className={cn("w-5 h-5", className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="18" height="12" rx="2" fill="url(#drive-gradient)" />
    <path d="M7 10H17M7 14H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <defs>
      <linearGradient id="drive-gradient" x1="3" y1="6" x2="21" y2="18">
        <stop stopColor="#0078D4" />
        <stop offset="1" stopColor="#106EBE" />
      </linearGradient>
    </defs>
  </svg>
);

const SiteIcon = ({ className }: { className?: string }) => (
  <svg className={cn("w-5 h-5", className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="18" height="14" rx="2" fill="url(#site-gradient)" />
    <rect x="5" y="7" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.8" />
    <rect x="5" y="13" width="14" height="1" rx="0.5" fill="white" fillOpacity="0.6" />
    <rect x="5" y="16" width="10" height="1" rx="0.5" fill="white" fillOpacity="0.4" />
    <defs>
      <linearGradient id="site-gradient" x1="3" y1="5" x2="21" y2="19">
        <stop stopColor="#107C10" />
        <stop offset="1" stopColor="#0B6A0B" />
      </linearGradient>
    </defs>
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12L10 17L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
    <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ============================================================================
// Props
// ============================================================================

interface SharePointPickerProps {
  /** Whether the picker is open */
  isOpen: boolean;
  /** Callback when picker is closed */
  onClose: () => void;
  /** Callback when location is selected */
  onSelect: (location: SharePointLocation) => void;
  /** Dialog title */
  title?: string;
  /** Whether to allow creating new folders */
  allowCreateFolder?: boolean;
  /** Initial location to browse */
  initialLocation?: SharePointLocation;
}

// ============================================================================
// Component
// ============================================================================

export function SharePointPicker({
  isOpen,
  onClose,
  onSelect,
  title = 'Select SharePoint Location',
  allowCreateFolder = true,
  initialLocation,
}: SharePointPickerProps) {
  const {
    isConnected,
    isConnecting,
    connectionState,
    sites,
    drives,
    currentSite,
    currentDrive,
    currentFolder,
    currentPath,
    items,
    isLoading,
    recentLocations,
    connect,
    selectSite,
    selectDrive,
    browse,
    navigateUp,
    createFolder,
    error,
  } = useSharePoint();

  const [step, setStep] = useState<'connect' | 'site' | 'drive' | 'folder'>('connect');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Reset step when opening
  useEffect(() => {
    if (isOpen) {
      if (isConnected) {
        setStep('folder');
        if (initialLocation) {
          // Navigate to initial location
          selectDrive(initialLocation.drive.id).then(() => {
            browse(initialLocation.folderId);
          });
        }
      } else {
        setStep('connect');
      }
    }
  }, [isOpen, isConnected, initialLocation, selectDrive, browse]);

  // Auto-advance after connecting
  useEffect(() => {
    if (isConnected && step === 'connect') {
      setStep(sites.length > 0 ? 'site' : 'drive');
    }
  }, [isConnected, step, sites.length]);

  const handleConnect = useCallback(async () => {
    await connect();
  }, [connect]);

  const handleSelectSite = useCallback(async (site: SharePointSite) => {
    await selectSite(site.id);
    setStep('drive');
  }, [selectSite]);

  const handleSelectDrive = useCallback(async (drive: SharePointDrive) => {
    await selectDrive(drive.id);
    setStep('folder');
  }, [selectDrive]);

  const handleFolderClick = useCallback(async (folder: SharePointFolder) => {
    await browse(folder.id);
  }, [browse]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch {
      // Error handled by hook
    }
  }, [createFolder, newFolderName]);

  const handleSelectLocation = useCallback(() => {
    if (!currentDrive) return;

    const location: SharePointLocation = {
      site: currentSite || {
        id: 'personal',
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

    onSelect(location);
    onClose();
  }, [currentSite, currentDrive, currentFolder, currentPath, onSelect, onClose]);

  const handleSelectRecent = useCallback((location: SharePointLocation) => {
    onSelect(location);
    onClose();
  }, [onSelect, onClose]);

  // Filter items to show only folders
  const folders = items.filter((item): item is SharePointFolder => 'folder' in item && !!item.folder);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg mx-4"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <Card variant="glass" className="bg-white/95 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-3">
                <SharePointIcon />
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </CardHeader>

            <CardContent className="min-h-[320px]">
              {/* Connection Step */}
              {step === 'connect' && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  {isConnecting ? (
                    <>
                      <SpinnerIcon />
                      <p className="text-slate-600">Connecting to SharePoint...</p>
                    </>
                  ) : error ? (
                    <>
                      <div className="p-4 bg-red-50 rounded-lg text-red-700 text-sm">
                        {error.message}
                      </div>
                      <Button onClick={handleConnect} variant="outline">
                        Try Again
                      </Button>
                    </>
                  ) : (
                    <>
                      <SharePointIcon />
                      <p className="text-slate-600 text-center">
                        Connect to your SharePoint or OneDrive to browse files
                      </p>
                      <Button onClick={handleConnect}>
                        Connect to SharePoint
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Site Selection Step */}
              {step === 'site' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">Select a SharePoint site</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setStep('drive')}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                    >
                      <DriveIcon />
                      <div className="flex-1">
                        <p className="font-medium">My OneDrive</p>
                        <p className="text-sm text-slate-500">Personal files</p>
                      </div>
                      <ChevronRightIcon />
                    </button>
                    {sites.map((site) => (
                      <button
                        key={site.id}
                        onClick={() => handleSelectSite(site)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                      >
                        <SiteIcon />
                        <div className="flex-1">
                          <p className="font-medium">{site.displayName}</p>
                          {site.description && (
                            <p className="text-sm text-slate-500 truncate">{site.description}</p>
                          )}
                        </div>
                        <ChevronRightIcon />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Drive Selection Step */}
              {step === 'drive' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <button
                      onClick={() => setStep(sites.length > 0 ? 'site' : 'connect')}
                      className="hover:text-slate-700"
                    >
                      ← Back
                    </button>
                    <span>•</span>
                    <span>Select a drive</span>
                  </div>
                  <div className="space-y-2">
                    {drives.map((drive) => (
                      <button
                        key={drive.id}
                        onClick={() => handleSelectDrive(drive)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
                      >
                        <DriveIcon />
                        <div className="flex-1">
                          <p className="font-medium">{drive.name}</p>
                          {drive.quota && (
                            <p className="text-sm text-slate-500">
                              {formatBytes(drive.quota.used)} of {formatBytes(drive.quota.total)} used
                            </p>
                          )}
                        </div>
                        <ChevronRightIcon />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Folder Browsing Step */}
              {step === 'folder' && (
                <div className="space-y-4">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <button
                      onClick={() => setStep('drive')}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      ← Drives
                    </button>
                    <span className="text-slate-400">/</span>
                    <button
                      onClick={() => browse('root')}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      {currentDrive?.name || 'Root'}
                    </button>
                    {currentPath.map((part, index) => (
                      <React.Fragment key={index}>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-700">{part}</span>
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Folders List */}
                  <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <SpinnerIcon />
                      </div>
                    ) : folders.length === 0 && !isCreatingFolder ? (
                      <div className="flex items-center justify-center h-32 text-slate-400">
                        No folders here
                      </div>
                    ) : (
                      <div className="divide-y">
                        {currentFolder && (
                          <button
                            onClick={navigateUp}
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                          >
                            <span className="text-slate-400">←</span>
                            <span className="text-slate-600">Up one level</span>
                          </button>
                        )}
                        {folders.map((folder) => (
                          <button
                            key={folder.id}
                            onClick={() => handleFolderClick(folder)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                          >
                            <FolderIcon />
                            <span className="flex-1 truncate">{folder.name}</span>
                            <ChevronRightIcon />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Create Folder */}
                  {allowCreateFolder && (
                    <div>
                      {isCreatingFolder ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="New folder name"
                            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCreateFolder();
                              if (e.key === 'Escape') {
                                setIsCreatingFolder(false);
                                setNewFolderName('');
                              }
                            }}
                          />
                          <Button size="sm" onClick={handleCreateFolder}>
                            Create
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setIsCreatingFolder(false);
                              setNewFolderName('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsCreatingFolder(true)}
                          className="text-sm text-[var(--primary)] hover:underline"
                        >
                          + Create new folder
                        </button>
                      )}
                    </div>
                  )}

                  {/* Recent Locations */}
                  {recentLocations.length > 0 && !currentFolder && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-slate-500 mb-2">Recent locations</p>
                      <div className="space-y-1">
                        {recentLocations.slice(0, 3).map((location, index) => (
                          <button
                            key={index}
                            onClick={() => handleSelectRecent(location)}
                            className="w-full flex items-center gap-2 p-2 text-sm text-left hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            <FolderIcon className="w-4 h-4" />
                            <span className="truncate">{location.displayPath}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSelectLocation}
                disabled={step !== 'folder' || !currentDrive}
                className="gap-2"
              >
                <CheckIcon />
                Select This Location
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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

export default SharePointPicker;
