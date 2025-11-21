'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { syncAllQueued } from '@/lib/offline-queue';

export function useSyncManager(accessToken?: string | null) {
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
    }, [isOnline, pendingRecordings, isSyncing, accessToken]);

    const syncRecordings = async () => {
        if (!pendingRecordings || pendingRecordings.length === 0) return;
        if (!accessToken) return;

        setIsSyncing(true);
        try {
            await syncAllQueued(accessToken);
            toast.success(`Synced ${pendingRecordings.length} item(s)`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Sync failed';
            toast.error(message);
        } finally {
            setIsSyncing(false);
        }
    };

    return {
        isOnline,
        isSyncing,
        pendingCount: pendingRecordings?.length || 0,
        syncRecordings
    };
}
