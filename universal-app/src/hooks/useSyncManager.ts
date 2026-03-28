'use client';

/**
 * Sync Manager Hook
 *
 * Manages automatic synchronization of offline queue items when connectivity
 * is restored. Provides reactive state for pending items and sync status.
 *
 * @module hooks/useSyncManager
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '@/components/Toast';
import { useDemo } from '@/context/DemoContext';
import {
  getDatabase,
  type OfflineRecording,
  type SyncOperation,
} from '@/lib/storage-adapter';
import {
  syncAllQueued,
  retryFailed,
  getLastSync,
  getTimeSinceLastSync,
  getQueueStats,
} from '@/lib/offline-queue';

// ============================================================================
// Types
// ============================================================================

export interface SyncManagerState {
  /** Current online/offline status */
  isOnline: boolean;
  /** Whether a sync is currently in progress */
  isSyncing: boolean;
  /** Number of items pending sync */
  pendingCount: number;
  /** Number of failed items */
  failedCount: number;
  /** Pending recordings (reactive) */
  pendingRecordings: OfflineRecording[];
  /** Pending sync operations (reactive) */
  pendingSyncOperations: SyncOperation[];
  /** Timestamp of last successful sync */
  lastSyncAt: Date | null;
  /** Human-readable time since last sync */
  lastSyncText: string | null;
  /** Whether auto-sync on reconnect is enabled */
  autoSyncEnabled: boolean;
}

export interface SyncManagerActions {
  /** Manually trigger sync of all pending items */
  syncAll: () => Promise<void>;
  /** Retry failed items */
  retryFailedItems: () => Promise<void>;
  /** Toggle auto-sync behavior */
  setAutoSyncEnabled: (enabled: boolean) => void;
  /** Refresh sync status */
  refreshStats: () => Promise<void>;
}

export type UseSyncManagerReturn = SyncManagerState & SyncManagerActions;

// ============================================================================
// Configuration
// ============================================================================

const AUTO_SYNC_DELAY_MS = 2000; // Delay before auto-sync on reconnect
const STATS_REFRESH_INTERVAL_MS = 30000; // Refresh stats every 30s

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Manages offline queue synchronization
 *
 * @param accessToken - Optional auth token for API calls
 * @returns Sync state and control functions
 *
 * @example
 * ```tsx
 * function SyncIndicator() {
 *   const { isOnline, isSyncing, pendingCount, syncAll } = useSyncManager();
 *
 *   return (
 *     <div>
 *       {!isOnline && <span>Offline</span>}
 *       {pendingCount > 0 && (
 *         <button onClick={syncAll} disabled={isSyncing || !isOnline}>
 *           Sync {pendingCount} items
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSyncManager(accessToken?: string | null): UseSyncManagerReturn {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(() => getLastSync());
  const [lastSyncText, setLastSyncText] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, failed: 0 });

  // Refs for cleanup
  const autoSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hooks
  const toast = useToast();
  // Note: Reserved for future user-scoped sync operations
  useDemo();

  // ---------------------------------------------------------------------------
  // Reactive Queries (Dexie Live Query)
  // ---------------------------------------------------------------------------

  const db = getDatabase();

  // Query pending recordings reactively
  const pendingRecordings = useLiveQuery(
    () => db.recordings.where('status').equals('pending').toArray(),
    [],
    []
  );

  // Query pending sync operations reactively
  const pendingSyncOperations = useLiveQuery(
    () => db.syncOperations.where('status').equals('pending').toArray(),
    [],
    []
  );

  // Combined pending count
  const pendingCount = (pendingRecordings?.length ?? 0) + (pendingSyncOperations?.length ?? 0);

  // ---------------------------------------------------------------------------
  // Online/Offline Detection
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.info('Back online', 'Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Offline', 'Changes will sync when connection returns');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // ---------------------------------------------------------------------------
  // Auto-sync on Reconnect
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isOnline || !autoSyncEnabled || isSyncing) return;
    if (pendingCount === 0) return;
    if (!accessToken) return;

    // Clear any existing timeout
    if (autoSyncTimeoutRef.current) {
      clearTimeout(autoSyncTimeoutRef.current);
    }

    // Schedule auto-sync with delay
    autoSyncTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        const result = await syncAllQueued(accessToken);

        if (result.synced > 0) {
          toast.success(
            'Sync complete',
            `${result.synced} item${result.synced > 1 ? 's' : ''} synced`
          );
        }

        if (result.failed > 0) {
          toast.warning(
            'Some items failed',
            `${result.failed} item${result.failed > 1 ? 's' : ''} could not sync`
          );
        }

        setLastSyncAt(new Date());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed';
        toast.error('Sync failed', message);
      } finally {
        setIsSyncing(false);
      }
    }, AUTO_SYNC_DELAY_MS);

    return () => {
      if (autoSyncTimeoutRef.current) {
        clearTimeout(autoSyncTimeoutRef.current);
      }
    };
  }, [isOnline, autoSyncEnabled, pendingCount, isSyncing, accessToken, toast]);

  // ---------------------------------------------------------------------------
  // Stats Refresh
  // ---------------------------------------------------------------------------

  const refreshStats = useCallback(async () => {
    try {
      const queueStats = await getQueueStats();
      setStats({ pending: queueStats.pending, failed: queueStats.failed });
      setLastSyncAt(getLastSync());
      setLastSyncText(getTimeSinceLastSync());
    } catch (err) {
      console.warn('Failed to refresh queue stats', err);
    }
  }, []);

  // Periodic stats refresh
  useEffect(() => {
    refreshStats();

    statsIntervalRef.current = setInterval(refreshStats, STATS_REFRESH_INTERVAL_MS);

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [refreshStats]);

  // Update last sync text when timestamp changes
  useEffect(() => {
    setLastSyncText(getTimeSinceLastSync());
  }, [lastSyncAt]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const syncAll = useCallback(async () => {
    if (!accessToken) {
      toast.warning('Cannot sync', 'Authentication required');
      return;
    }

    if (!isOnline) {
      toast.warning('Cannot sync', 'No internet connection');
      return;
    }

    if (isSyncing) {
      toast.info('Sync in progress', 'Please wait...');
      return;
    }

    setIsSyncing(true);

    try {
      const result = await syncAllQueued(accessToken);

      if (result.synced > 0) {
        toast.success(
          'Sync complete',
          `${result.synced} item${result.synced > 1 ? 's' : ''} synced successfully`
        );
      } else if (result.failed === 0) {
        toast.info('Nothing to sync', 'Queue is empty');
      }

      if (result.failed > 0) {
        toast.error(
          'Sync errors',
          `${result.failed} item${result.failed > 1 ? 's' : ''} failed to sync`
        );
      }

      setLastSyncAt(new Date());
      await refreshStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Sync failed', message);
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken, isOnline, isSyncing, toast, refreshStats]);

  const retryFailedItems = useCallback(async () => {
    if (!accessToken) {
      toast.warning('Cannot retry', 'Authentication required');
      return;
    }

    if (!isOnline) {
      toast.warning('Cannot retry', 'No internet connection');
      return;
    }

    setIsSyncing(true);

    try {
      const result = await retryFailed(accessToken);

      if (result.retried > 0) {
        toast.success('Retry complete', `${result.retried} item${result.retried > 1 ? 's' : ''} synced`);
      } else {
        toast.info('Nothing to retry', 'No failed items pending retry');
      }

      if (result.stillFailed > 0) {
        toast.warning(
          'Some retries failed',
          `${result.stillFailed} item${result.stillFailed > 1 ? 's' : ''} still failing`
        );
      }

      await refreshStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Retry failed';
      toast.error('Retry failed', message);
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken, isOnline, toast, refreshStats]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State
    isOnline,
    isSyncing,
    pendingCount,
    failedCount: stats.failed,
    pendingRecordings: pendingRecordings ?? [],
    pendingSyncOperations: pendingSyncOperations ?? [],
    lastSyncAt,
    lastSyncText,
    autoSyncEnabled,
    // Actions
    syncAll,
    retryFailedItems,
    setAutoSyncEnabled,
    refreshStats,
  };
}

// ============================================================================
// Utility Hook: Simple Online Status
// ============================================================================

/**
 * Simple hook for just online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
