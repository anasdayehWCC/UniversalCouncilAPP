'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { db, OfflineRecording } from '@/lib/db';

export function useSyncManager() {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [isSyncing, setIsSyncing] = useState(false);

    // Query pending recordings
    const pendingRecordings = useLiveQuery(
        () => db.recordings.where('status').equals('pending').toArray()
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

    // Auto-sync when back online
    useEffect(() => {
        if (isOnline && pendingRecordings && pendingRecordings.length > 0 && !isSyncing) {
            syncRecordings();
        }
    }, [isOnline, pendingRecordings, isSyncing]);

    const syncRecordings = async () => {
        if (!pendingRecordings || pendingRecordings.length === 0) return;

        setIsSyncing(true);
        let successCount = 0;
        let failCount = 0;

        for (const recording of pendingRecordings) {
            try {
                await db.recordings.update(recording.id!, { status: 'syncing' });

                // TODO: Replace with actual API upload call
                // await uploadRecording(recording.blob, recording.fileName);

                // Simulate upload delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                await db.recordings.update(recording.id!, { status: 'synced' });
                successCount++;
            } catch (error) {
                console.error('Sync failed for recording:', recording.id, error);
                await db.recordings.update(recording.id!, {
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                failCount++;
            }
        }

        setIsSyncing(false);

        if (successCount > 0) {
            toast.success(`Synced ${successCount} recordings`);
        }
        if (failCount > 0) {
            toast.error(`Failed to sync ${failCount} recordings`);
        }
    };

    return {
        isOnline,
        isSyncing,
        pendingCount: pendingRecordings?.length || 0,
        syncRecordings
    };
}
