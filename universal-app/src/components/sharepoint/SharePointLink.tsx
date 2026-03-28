'use client';

/**
 * SharePoint Link Component
 * 
 * Displays a linked SharePoint document with quick actions
 * for viewing, downloading, and unlinking.
 * 
 * @module components/sharepoint/SharePointLink
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LinkedSharePointDocument, SharePointFile } from '@/lib/sharepoint';
import { useSharePoint } from '@/hooks/useSharePoint';
import { cn } from '@/lib/utils';

// ============================================================================
// Icons
// ============================================================================

const SharePointIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="5" fill="#036C70" />
    <circle cx="7" cy="13" r="4" fill="#1A9BA1" />
    <circle cx="16" cy="15" r="3" fill="#03787C" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4V16M12 16L8 12M12 16L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UnlinkIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.84 12.25L21.26 9.83001C21.6598 9.43073 21.9766 8.95635 22.1921 8.43414C22.4077 7.91193 22.5177 7.35231 22.5156 6.78746C22.5135 6.22261 22.3994 5.66389 22.1799 5.14341C21.9605 4.62292 21.6402 4.15101 21.2373 3.75484C20.8345 3.35868 20.3574 3.04633 19.8334 2.83548C19.3095 2.62462 18.7493 2.51963 18.1844 2.52656C17.6196 2.53348 17.0625 2.65222 16.5442 2.87586C16.026 3.0995 15.5574 3.42301 15.16 3.82801L12.74 6.25001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.16 11.75L2.74 14.17C2.34022 14.5693 2.02346 15.0436 1.80787 15.5659C1.59228 16.0881 1.48234 16.6477 1.48441 17.2126C1.48648 17.7774 1.6005 18.3361 1.81994 18.8566C2.03938 19.3771 2.35975 19.849 2.76261 20.2452C3.16547 20.6413 3.64262 20.9537 4.16656 21.1645C4.69051 21.3754 5.25067 21.4804 5.81556 21.4734C6.38044 21.4665 6.93752 21.3478 7.45578 21.1241C7.97405 20.9005 8.44262 20.577 8.84 20.172L11.26 17.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 2L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FileIcon = ({ mimeType, className }: { mimeType?: string; className?: string }) => {
  const getColor = () => {
    if (!mimeType) return '#6B7280';
    if (mimeType.includes('pdf')) return '#DC2626';
    if (mimeType.includes('word')) return '#2563EB';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '#16A34A';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '#EA580C';
    if (mimeType.includes('image')) return '#7C3AED';
    if (mimeType.includes('audio')) return '#2DD4BF';
    if (mimeType.includes('video')) return '#F43F5E';
    return '#6B7280';
  };

  return (
    <svg className={cn("w-5 h-5", className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill={getColor()} />
      <path d="M14 2V8H20" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
    </svg>
  );
};

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
    <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ============================================================================
// Types
// ============================================================================

interface SharePointLinkProps {
  /** Linked document to display */
  document: LinkedSharePointDocument;
  /** Called when unlink is clicked */
  onUnlink?: (linkId: string) => void;
  /** Called when file is downloaded */
  onDownload?: (file: SharePointFile) => void;
  /** Show compact version */
  compact?: boolean;
  /** Show unlink action */
  showUnlink?: boolean;
  /** Show download action */
  showDownload?: boolean;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SharePointLink({
  document,
  onUnlink,
  onDownload,
  compact = false,
  showUnlink = true,
  showDownload = true,
  className,
}: SharePointLinkProps) {
  const { downloadFile } = useSharePoint();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const file = document.file;
  
  const handleOpenInSharePoint = useCallback(() => {
    if (file.webUrl) {
      window.open(file.webUrl, '_blank', 'noopener,noreferrer');
    }
  }, [file.webUrl]);

  const handleDownload = useCallback(async () => {
    if (!file.parentReference?.driveId) return;
    
    setIsDownloading(true);
    try {
      const blob = await downloadFile(file.id);
      
      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = globalThis.document.createElement('a');
      a.href = url;
      a.download = file.name;
      globalThis.document.body.appendChild(a);
      a.click();
      globalThis.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      onDownload?.(file);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [file, downloadFile, onDownload]);

  const handleUnlink = useCallback(() => {
    onUnlink?.(document.id);
  }, [document.id, onUnlink]);

  const getLinkTypeBadge = () => {
    const badges: Record<string, { label: string; className: string }> = {
      minute: { label: 'Minute', className: 'bg-blue-100 text-blue-700' },
      recording: { label: 'Recording', className: 'bg-purple-100 text-purple-700' },
      attachment: { label: 'Attachment', className: 'bg-slate-100 text-slate-700' },
    };
    return badges[document.linkType] || badges.attachment;
  };

  const badge = getLinkTypeBadge();

  if (compact) {
    return (
      <div
        className={cn(
          "group flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer",
          className
        )}
        onClick={handleOpenInSharePoint}
      >
        <FileIcon mimeType={file.mimeType} className="w-4 h-4" />
        <span className="flex-1 text-sm truncate">{file.name}</span>
        <SharePointIcon />
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "group relative rounded-xl border bg-white shadow-sm transition-all hover:shadow-md",
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* File icon */}
        <div className="flex-shrink-0 p-2 bg-slate-50 rounded-lg">
          <FileIcon mimeType={file.mimeType} className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-slate-900 truncate">{file.name}</h4>
            <div className="flex items-center gap-1">
              <SharePointIcon />
              <span className={cn("text-xs px-1.5 py-0.5 rounded", badge.className)}>
                {badge.label}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
            <span>{formatBytes(file.size)}</span>
            <span>•</span>
            <span>{formatDate(file.lastModifiedDateTime)}</span>
          </div>

          {file.createdBy?.user && (
            <p className="text-xs text-slate-400 mt-1">
              Added by {file.createdBy.user.displayName}
            </p>
          )}
        </div>

        {/* Actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-1"
            >
              {/* Open in SharePoint */}
              <button
                onClick={handleOpenInSharePoint}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                title="Open in SharePoint"
              >
                <ExternalLinkIcon />
              </button>

              {/* Download */}
              {showDownload && (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                  title="Download"
                >
                  {isDownloading ? <SpinnerIcon /> : <DownloadIcon />}
                </button>
              )}

              {/* Unlink */}
              {showUnlink && (
                <button
                  onClick={handleUnlink}
                  className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                  title="Unlink from minute"
                >
                  <UnlinkIcon />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#036C70] via-[#1A9BA1] to-[#03787C] opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl" />
    </motion.div>
  );
}

// ============================================================================
// SharePoint Links List Component
// ============================================================================

interface SharePointLinksListProps {
  /** List of linked documents */
  documents: LinkedSharePointDocument[];
  /** Called when a document is unlinked */
  onUnlink?: (linkId: string) => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Compact view */
  compact?: boolean;
}

export function SharePointLinksList({
  documents,
  onUnlink,
  emptyMessage = 'No linked SharePoint documents',
  isLoading = false,
  compact = false,
}: SharePointLinksListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <SpinnerIcon />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <SharePointIcon />
        <p className="mt-2 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-1")}>
      {documents.map((doc) => (
        <SharePointLink
          key={doc.id}
          document={doc}
          onUnlink={onUnlink}
          compact={compact}
        />
      ))}
    </div>
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default SharePointLink;
