'use client';

/**
 * Resilience Banner
 *
 * Full-width banner that appears when offline or degraded.
 * Shows pending operations count and sync controls.
 *
 * @module components/ResilienceBanner
 */

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, CloudOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNetworkStatus, type ConnectionState } from '@/hooks/useNetworkStatus';
import { useSyncManager } from '@/hooks/useSyncManager';

// ============================================================================
// Configuration
// ============================================================================

const BANNER_CONFIG: Record<
  ConnectionState,
  {
    show: boolean;
    bgClass: string;
    icon: typeof WifiOff;
    message: string;
  }
> = {
  online: {
    show: false,
    bgClass: 'bg-emerald-600',
    icon: CheckCircle,
    message: 'Connected',
  },
  degraded: {
    show: true,
    bgClass: 'bg-amber-500',
    icon: CloudOff,
    message: 'Limited connectivity — some features may be unavailable',
  },
  offline: {
    show: true,
    bgClass: 'bg-red-600',
    icon: WifiOff,
    message: "You're offline — changes will sync when reconnected",
  },
};

// ============================================================================
// Component
// ============================================================================

interface ResilienceBannerProps {
  /** Always show banner, even when online (for testing) */
  forceShow?: boolean;
  /** Custom className */
  className?: string;
  /** Position: fixed at top or inline */
  position?: 'fixed' | 'inline';
}

export function ResilienceBanner({
  forceShow = false,
  className,
  position = 'fixed',
}: ResilienceBannerProps) {
  const { state, checkNow, isChecking } = useNetworkStatus();
  const { pendingCount, isSyncing, syncAll, failedCount, retryFailedItems } = useSyncManager();

  const config = BANNER_CONFIG[state];
  const Icon = config.icon;

  const shouldShow = forceShow || config.show || pendingCount > 0;

  // Animation variants
  const bannerVariants = {
    hidden: {
      opacity: 0,
      y: -50,
      height: 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      height: 'auto',
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
        height: { duration: 0.3 },
      },
    },
    exit: {
      opacity: 0,
      y: -30,
      height: 0,
      transition: {
        duration: 0.2,
        height: { delay: 0.1 },
      },
    },
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          variants={bannerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'w-full overflow-hidden',
            position === 'fixed' && 'fixed top-0 left-0 right-0 z-[100]',
            className
          )}
        >
          <div
            className={cn(
              'py-2 px-4 sm:px-6',
              state === 'online' && pendingCount > 0
                ? 'bg-amber-500'
                : config.bgClass
            )}
          >
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
              {/* Status Message */}
              <div className="flex items-center gap-3 text-white">
                <motion.div
                  animate={
                    state === 'offline'
                      ? { scale: [1, 1.1, 1] }
                      : {}
                  }
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                </motion.div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <span className="text-sm font-medium">
                    {state === 'online' && pendingCount > 0
                      ? 'Changes pending'
                      : config.message}
                  </span>
                  
                  {/* Pending count */}
                  {pendingCount > 0 && (
                    <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">
                      {pendingCount} pending
                    </span>
                  )}
                  
                  {/* Failed count */}
                  {failedCount > 0 && (
                    <span className="text-xs bg-red-700/50 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {failedCount} failed
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Retry check button - shown when degraded/offline */}
                {state !== 'online' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={checkNow}
                    disabled={isChecking}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
                      'text-xs font-medium text-white/90',
                      'bg-white/20 hover:bg-white/30 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <RefreshCw
                      className={cn('w-3.5 h-3.5', isChecking && 'animate-spin')}
                    />
                    <span className="hidden sm:inline">
                      {isChecking ? 'Checking...' : 'Retry'}
                    </span>
                  </motion.button>
                )}

                {/* Sync button - shown when online with pending items */}
                {state === 'online' && pendingCount > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => syncAll()}
                    disabled={isSyncing}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
                      'text-xs font-medium',
                      'bg-white text-amber-700',
                      'hover:bg-white/90 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <RefreshCw
                      className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')}
                    />
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </motion.button>
                )}

                {/* Retry failed button */}
                {failedCount > 0 && state === 'online' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => retryFailedItems()}
                    disabled={isSyncing}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
                      'text-xs font-medium text-white/90',
                      'bg-white/20 hover:bg-white/30 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    Retry Failed
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Compact Variant
// ============================================================================

interface CompactResilienceBannerProps {
  className?: string;
}

/**
 * Compact version for embedding in headers/navs
 */
export function CompactResilienceBanner({ className }: CompactResilienceBannerProps) {
  const { state } = useNetworkStatus();
  const { pendingCount } = useSyncManager();

  if (state === 'online' && pendingCount === 0) {
    return null;
  }

  const config = BANNER_CONFIG[state];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
        state === 'offline' && 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
        state === 'degraded' && 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
        state === 'online' && pendingCount > 0 && 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>
        {state === 'offline' && 'Offline'}
        {state === 'degraded' && 'Limited'}
        {state === 'online' && pendingCount > 0 && `${pendingCount} pending`}
      </span>
    </motion.div>
  );
}
