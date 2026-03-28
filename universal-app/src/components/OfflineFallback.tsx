'use client';

/**
 * Offline Fallback
 *
 * Full-page component shown when completely offline and no cached data available.
 * Provides clear user instructions and retry functionality.
 *
 * @module components/OfflineFallback
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, Cloud, Smartphone, Signal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSyncManager } from '@/hooks/useSyncManager';

// ============================================================================
// Component
// ============================================================================

interface OfflineFallbackProps {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Show pending items count */
  showPendingCount?: boolean;
  /** Custom className for container */
  className?: string;
  /** Children to render when back online */
  children?: React.ReactNode;
  /** Always show offline state (for testing) */
  forceOffline?: boolean;
}

export function OfflineFallback({
  title = "You're offline",
  description = "It looks like you've lost your internet connection. Don't worry — any work you've done is saved locally and will sync when you're back online.",
  showPendingCount = true,
  className,
  children,
  forceOffline = false,
}: OfflineFallbackProps) {
  const { state, checkNow, isChecking } = useNetworkStatus();
  const { pendingCount } = useSyncManager();
  const [retryCount, setRetryCount] = useState(0);

  const isOffline = forceOffline || state === 'offline';

  // Auto-retry every 10 seconds when offline
  useEffect(() => {
    if (!isOffline) return;

    const interval = setInterval(() => {
      checkNow();
    }, 10000);

    return () => clearInterval(interval);
  }, [isOffline, checkNow]);

  const handleRetry = async () => {
    setRetryCount((c) => c + 1);
    await checkNow();
  };

  // If online, render children or nothing
  if (!isOffline) {
    return children ? <>{children}</> : null;
  }

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center p-6',
        'bg-gradient-to-b from-slate-50 to-slate-100',
        'dark:from-slate-900 dark:to-slate-950',
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Animated Icon */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative mx-auto w-24 h-24 mb-8"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
          
          {/* Icon container */}
          <div className="relative flex items-center justify-center w-full h-full bg-red-100 dark:bg-red-950/50 rounded-full">
            <WifiOff className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          
          {/* Orbiting signal dots */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-400 rounded-full opacity-50" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-400 rounded-full opacity-30" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
          {title}
        </h1>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          {description}
        </p>

        {/* Pending items indicator */}
        {showPendingCount && pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-950/50 rounded-full text-sm text-amber-700 dark:text-amber-400"
          >
            <Cloud className="w-4 h-4" />
            <span>
              {pendingCount} item{pendingCount > 1 ? 's' : ''} saved locally
            </span>
          </motion.div>
        )}

        {/* Retry button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRetry}
          disabled={isChecking}
          className={cn(
            'w-full flex items-center justify-center gap-2',
            'px-6 py-3 rounded-xl font-medium',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'shadow-lg shadow-primary/25'
          )}
        >
          <RefreshCw className={cn('w-5 h-5', isChecking && 'animate-spin')} />
          {isChecking ? 'Checking connection...' : 'Try Again'}
        </motion.button>

        {/* Retry count feedback */}
        {retryCount > 0 && !isChecking && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-xs text-slate-500 dark:text-slate-500"
          >
            Checked {retryCount} time{retryCount > 1 ? 's' : ''}
          </motion.p>
        )}

        {/* Tips */}
        <div className="mt-10 space-y-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider">
            Things to try
          </p>
          <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
            <TipItem icon={Signal} text="Check your Wi-Fi or mobile data" />
            <TipItem icon={Smartphone} text="Try toggling airplane mode" />
            <TipItem icon={RefreshCw} text="Restart your browser or app" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

interface TipItemProps {
  icon: typeof Signal;
  text: string;
}

function TipItem({ icon: Icon, text }: TipItemProps) {
  return (
    <div className="flex items-center gap-3 justify-center">
      <Icon className="w-4 h-4 text-slate-400" />
      <span>{text}</span>
    </div>
  );
}

// ============================================================================
// Compact Variant
// ============================================================================

interface OfflineCardProps {
  className?: string;
}

/**
 * Compact card variant for embedding in pages
 */
export function OfflineCard({ className }: OfflineCardProps) {
  const { state, checkNow, isChecking } = useNetworkStatus();
  const { pendingCount } = useSyncManager();

  if (state !== 'offline') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'rounded-xl p-4 flex items-center gap-4',
        'bg-red-50 dark:bg-red-950/30',
        'border border-red-200 dark:border-red-800/50',
        className
      )}
    >
      <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-900/50 rounded-full">
        <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-red-900 dark:text-red-100">
          You&apos;re offline
        </p>
        <p className="text-sm text-red-700 dark:text-red-300">
          {pendingCount > 0
            ? `${pendingCount} item${pendingCount > 1 ? 's' : ''} will sync when reconnected`
            : 'Waiting for connection...'}
        </p>
      </div>

      <button
        onClick={checkNow}
        disabled={isChecking}
        className={cn(
          'shrink-0 p-2 rounded-lg',
          'text-red-600 dark:text-red-400',
          'hover:bg-red-100 dark:hover:bg-red-900/50',
          'transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        aria-label="Retry connection"
      >
        <RefreshCw className={cn('w-5 h-5', isChecking && 'animate-spin')} />
      </button>
    </motion.div>
  );
}
