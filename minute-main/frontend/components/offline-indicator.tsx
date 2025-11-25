'use client';

import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResilience } from '@/providers/ResilienceProvider';

export function OfflineIndicator() {
    const { isOnline, isSyncing, pendingCount, retrySync } = useResilience();

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
            {!isSyncing && pendingCount > 0 && (
                <button
                    onClick={retrySync}
                    className="ml-1 rounded-full bg-white/20 px-2 py-1 text-xs font-semibold hover:bg-white/30"
                    type="button"
                >
                    Retry sync
                </button>
            )}
        </div>
    );
}
