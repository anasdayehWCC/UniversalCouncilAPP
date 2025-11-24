'use client';

import { useSyncManager } from '@/hooks/use-sync-manager';
import { useAccessToken } from '@/hooks/use-access-token';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
    const { accessToken } = useAccessToken();
    const { isOnline, isSyncing, pendingCount } = useSyncManager(accessToken);

    if (isOnline && pendingCount === 0) return null;

    return (
        <div className={cn(
            "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg transition-all",
            isOnline ? "bg-blue-500 text-white" : "bg-slate-800 text-white"
        )}>
            {isSyncing ? (
                <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Syncing {pendingCount}...</span>
                </>
            ) : !isOnline ? (
                <>
                    <WifiOff className="h-4 w-4" />
                    <span>Offline ({pendingCount} pending)</span>
                </>
            ) : (
                <>
                    <Wifi className="h-4 w-4" />
                    <span>Online</span>
                </>
            )}
        </div>
    );
}
