'use client';

/**
 * SharePoint Upload Button
 * 
 * Quick upload button component with drag-and-drop support
 * and progress tracking for SharePoint/OneDrive uploads.
 * 
 * @module components/sharepoint/SharePointUploadButton
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSharePointUpload } from '@/hooks/useSharePoint';
import { SharePointFile, SharePointLocation, UploadProgress } from '@/lib/sharepoint';
import { Button } from '@/components/ui/button';
import { SharePointPicker } from './SharePointPicker';
import { cn } from '@/lib/utils';

// ============================================================================
// Icons
// ============================================================================

const UploadCloudIcon = ({ className }: { className?: string }) => (
  <svg className={cn("w-5 h-5", className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 16.7428C21.2215 15.734 22 14.2195 22 12.5C22 9.46243 19.5376 7 16.5 7C16.2815 7 16.0771 6.886 15.9661 6.69774C14.6621 4.48484 12.2544 3 9.5 3C5.35786 3 2 6.35786 2 10.5C2 12.5661 2.83545 14.4371 4.18695 15.7935" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SharePointIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="5" fill="#036C70" />
    <circle cx="7" cy="13" r="4" fill="#1A9BA1" />
    <circle cx="16" cy="15" r="3" fill="#03787C" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5 text-success" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ErrorCircleIcon = () => (
  <svg className="w-5 h-5 text-destructive" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ============================================================================
// Types
// ============================================================================

interface SharePointUploadButtonProps {
  /** Custom button label */
  label?: string;
  /** Accepted file types (mime types or extensions) */
  accept?: string;
  /** Allow multiple files */
  multiple?: boolean;
  /** Pre-selected destination */
  destination?: SharePointLocation;
  /** Callback when upload completes */
  onUploadComplete?: (files: SharePointFile[]) => void;
  /** Callback on upload error */
  onUploadError?: (error: Error) => void;
  /** Show destination picker */
  showPicker?: boolean;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'glass';
  /** Button size */
  size?: 'sm' | 'default' | 'lg';
  /** Custom class name */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Compact mode (just icon) */
  iconOnly?: boolean;
  /** Custom content fields to add to uploads */
  customFields?: Record<string, string>;
}

interface UploadState {
  status: 'idle' | 'selecting' | 'uploading' | 'success' | 'error';
  files: File[];
  progress: UploadProgress | null;
  uploadedFiles: SharePointFile[];
  error: Error | null;
}

// ============================================================================
// Component
// ============================================================================

export function SharePointUploadButton({
  label = 'Upload to SharePoint',
  accept,
  multiple = true,
  destination,
  onUploadComplete,
  onUploadError,
  showPicker = true,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  iconOnly = false,
  customFields,
}: SharePointUploadButtonProps) {
  const { isConnected, upload, error: hookError } = useSharePointUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    files: [],
    progress: null,
    uploadedFiles: [],
    error: null,
  });
  
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<SharePointLocation | undefined>(destination);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSelectFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    
    setState(prev => ({ ...prev, files, status: 'selecting' }));
    
    if (showPicker && !selectedDestination) {
      setIsPickerOpen(true);
    } else {
      startUpload(files);
    }
    
    // Reset input
    event.target.value = '';
  }, [showPicker, selectedDestination]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;
    
    // Filter by accepted types if specified
    const filteredFiles = accept
      ? files.filter(file => {
          const acceptTypes = accept.split(',').map(t => t.trim());
          return acceptTypes.some(t => {
            if (t.startsWith('.')) {
              return file.name.endsWith(t);
            }
            return file.type.match(t.replace('*', '.*'));
          });
        })
      : files;
    
    if (filteredFiles.length === 0) return;
    
    setState(prev => ({ ...prev, files: filteredFiles, status: 'selecting' }));
    
    if (showPicker && !selectedDestination) {
      setIsPickerOpen(true);
    } else {
      startUpload(filteredFiles);
    }
  }, [accept, showPicker, selectedDestination]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDestinationSelect = useCallback((location: SharePointLocation) => {
    setSelectedDestination(location);
    setIsPickerOpen(false);
    startUpload(state.files, location);
  }, [state.files]);

  const startUpload = useCallback(async (files: File[], dest?: SharePointLocation) => {
    const targetDest = dest || selectedDestination;
    
    setState(prev => ({
      ...prev,
      status: 'uploading',
      progress: { bytesUploaded: 0, totalBytes: 0, percentage: 0 },
      uploadedFiles: [],
      error: null,
    }));

    const uploadedFiles: SharePointFile[] = [];
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    let uploadedBytes = 0;

    try {
      for (const file of files) {
        const uploaded = await upload(file, {
          destinationFolder: targetDest?.folderId || 'root',
          driveId: targetDest?.drive.id,
          customFields: customFields as never,
          onProgress: (progress) => {
            const overallProgress = uploadedBytes + progress.bytesUploaded;
            setState(prev => ({
              ...prev,
              progress: {
                bytesUploaded: overallProgress,
                totalBytes: totalSize,
                percentage: Math.round((overallProgress / totalSize) * 100),
              },
            }));
          },
        });
        
        uploadedFiles.push(uploaded);
        uploadedBytes += file.size;
      }

      setState(prev => ({
        ...prev,
        status: 'success',
        uploadedFiles,
        progress: { bytesUploaded: totalSize, totalBytes: totalSize, percentage: 100 },
      }));

      onUploadComplete?.(uploadedFiles);

      // Reset after delay
      setTimeout(() => {
        setState({
          status: 'idle',
          files: [],
          progress: null,
          uploadedFiles: [],
          error: null,
        });
      }, 3000);
    } catch (err) {
      const error = err as Error;
      setState(prev => ({
        ...prev,
        status: 'error',
        error,
      }));
      onUploadError?.(error);
    }
  }, [selectedDestination, upload, customFields, onUploadComplete, onUploadError]);

  const handleRetry = useCallback(() => {
    startUpload(state.files);
  }, [state.files, startUpload]);

  const handleCancel = useCallback(() => {
    setState({
      status: 'idle',
      files: [],
      progress: null,
      uploadedFiles: [],
      error: null,
    });
  }, []);

  // Content based on state
  const renderContent = () => {
    switch (state.status) {
      case 'uploading':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="relative w-5 h-5">
              <svg className="w-5 h-5 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeOpacity="0.25"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${(state.progress?.percentage || 0) * 0.628} 100`}
                  strokeLinecap="round"
                  transform="rotate(-90 12 12)"
                />
              </svg>
            </div>
            {!iconOnly && (
              <span>Uploading... {state.progress?.percentage}%</span>
            )}
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <CheckCircleIcon />
            {!iconOnly && <span>Uploaded!</span>}
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <ErrorCircleIcon />
            {!iconOnly && (
              <>
                <span>Failed</span>
                <button onClick={handleRetry} className="underline text-sm">
                  Retry
                </button>
              </>
            )}
          </motion.div>
        );

      default:
        return (
          <>
            <SharePointIcon />
            {!iconOnly && <span>{label}</span>}
          </>
        );
    }
  };

  return (
    <>
      <div
        className={cn(
          "relative",
          isDragOver && "ring-2 ring-[var(--accent)] ring-offset-2 rounded-lg"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || !isConnected || state.status === 'uploading'}
        />

        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
          onClick={handleSelectFiles}
          disabled={disabled || !isConnected || state.status === 'uploading'}
        >
          {renderContent()}
        </Button>

        {/* Drag overlay hint */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center pointer-events-none"
            >
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <UploadCloudIcon />
                <span className="font-medium">Drop to upload</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar for uploading state */}
      <AnimatePresence>
        {state.status === 'uploading' && state.progress && !iconOnly && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2"
          >
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--primary)]"
                initial={{ width: 0 }}
                animate={{ width: `${state.progress.percentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {state.files.length} file(s) • {formatBytes(state.progress.bytesUploaded)} / {formatBytes(state.progress.totalBytes)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Destination picker */}
      <SharePointPicker
        isOpen={isPickerOpen}
        onClose={() => {
          setIsPickerOpen(false);
          handleCancel();
        }}
        onSelect={handleDestinationSelect}
        title="Choose upload destination"
        allowCreateFolder
      />
    </>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default SharePointUploadButton;
