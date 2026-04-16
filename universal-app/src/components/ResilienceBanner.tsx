'use client';

/**
 * Resilience Banner - Dynamic Island Style
 *
 * A compact, expandable pill that appears at the top center of the screen
 * when offline or when there are pending sync operations.
 * Inspired by Apple's Dynamic Island design.
 *
 * @module components/ResilienceBanner
 */

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, CloudOff, RefreshCw, AlertTriangle, CheckCircle, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNetworkStatus, type ConnectionState } from '@/providers/NetworkStatusProvider';
import { useSyncManager } from '@/hooks/useSyncManager';
import { useAuth } from '@/hooks/useAuth';

// ============================================================================
// Configuration
// ============================================================================

const BANNER_CONFIG: Record<
  ConnectionState,
  {
    show: boolean;
    bgClass: string;
    bgClassDark: string;
    icon: typeof WifiOff;
    message: string;
    shortMessage: string;
  }
> = {
  online: {
    show: false,
    bgClass: 'bg-emerald-600',
    bgClassDark: 'dark:bg-emerald-700',
    icon: CheckCircle,
    message: 'Connected',
    shortMessage: 'Online',
  },
  degraded: {
    show: true,
    bgClass: 'bg-amber-500',
    bgClassDark: 'dark:bg-amber-600',
    icon: CloudOff,
    message: 'Limited connectivity — some features may be unavailable',
    shortMessage: 'Limited',
  },
  offline: {
    show: true,
    bgClass: 'bg-red-600',
    bgClassDark: 'dark:bg-red-700',
    icon: WifiOff,
    message: "You're offline — changes will sync when reconnected",
    shortMessage: 'Offline',
  },
};

// Auto-collapse delay in ms
const AUTO_COLLAPSE_DELAY = 5000;

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
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);
  const autoExpandTimerRef = useRef<number | null>(null);
  const autoCollapseTimerRef = useRef<number | null>(null);

  const { accessToken } = useAuth();
  const { state, checkNow, isChecking } = useNetworkStatus();
  const { pendingCount, isSyncing, syncAll, failedCount, retryFailedItems } = useSyncManager(accessToken);

  const config = BANNER_CONFIG[state];
  const Icon = config.icon;

  // Auto-expand on state change, then auto-collapse
  useEffect(() => {
    if (autoExpandTimerRef.current !== null) {
      window.clearTimeout(autoExpandTimerRef.current);
      autoExpandTimerRef.current = null;
    }

    if (autoCollapseTimerRef.current !== null) {
      window.clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }

    if (state === 'online' && pendingCount === 0) {
      return;
    }

    autoExpandTimerRef.current = window.setTimeout(() => {
      setIsExpanded(true);
      setUserDismissed(false);
      autoCollapseTimerRef.current = window.setTimeout(() => {
        setIsExpanded(false);
        autoCollapseTimerRef.current = null;
      }, AUTO_COLLAPSE_DELAY);
      autoExpandTimerRef.current = null;
    }, 0);

    return () => {
      if (autoExpandTimerRef.current !== null) {
        window.clearTimeout(autoExpandTimerRef.current);
        autoExpandTimerRef.current = null;
      }
      if (autoCollapseTimerRef.current !== null) {
        window.clearTimeout(autoCollapseTimerRef.current);
        autoCollapseTimerRef.current = null;
      }
    };
  }, [state, pendingCount]);

  const shouldShow = isMounted && !userDismissed && (forceShow || config.show || pendingCount > 0);

  const handleDismiss = useCallback(() => {
    setUserDismissed(true);
    setIsExpanded(false);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Dynamic Island animation variants
  const islandVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: -20,
    },
    collapsed: {
      opacity: 1,
      scale: 1,
      y: 0,
      width: 'auto',
      height: 'auto',
      borderRadius: 9999,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 30,
      },
    },
    expanded: {
      opacity: 1,
      scale: 1,
      y: 0,
      width: 'auto',
      height: 'auto',
      borderRadius: 20,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: { duration: 0.2 },
    },
  };

  const contentVariants = {
    collapsed: {
      opacity: 1,
      height: 'auto',
    },
    expanded: {
      opacity: 1,
      height: 'auto',
    },
  };

  if (!shouldShow) return null;

  const statusBgClass = state === 'online' && pendingCount > 0
    ? 'bg-amber-500 dark:bg-amber-600'
    : `${config.bgClass} ${config.bgClassDark}`;

  return (
    <div
      className={cn(
        position === 'fixed' && 'fixed top-[calc(env(safe-area-inset-top)+var(--shell-header-height)+0.5rem)] left-1/2 -translate-x-1/2 z-[45]',
        'pointer-events-none',
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isExpanded ? 'expanded' : 'collapsed'}
          variants={islandVariants}
          initial="hidden"
          animate={isExpanded ? 'expanded' : 'collapsed'}
          exit="exit"
          className={cn(
            'pointer-events-auto shadow-lg',
            statusBgClass,
            'backdrop-blur-md'
          )}
          onClick={!isExpanded ? handleToggleExpand : undefined}
          style={{ cursor: !isExpanded ? 'pointer' : 'default' }}
        >
          <motion.div
            variants={contentVariants}
            animate={isExpanded ? 'expanded' : 'collapsed'}
            className="overflow-hidden"
          >
            {isExpanded ? (
              // Expanded view
              <div className="p-4 min-w-[280px] max-w-[360px]">
                {/* Header with dismiss button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-white">
                    <motion.div
                      animate={state === 'offline' ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                    <span className="font-semibold text-sm">
                      {state === 'online' && pendingCount > 0
                        ? 'Sync Pending'
                        : config.shortMessage}
                    </span>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Message */}
                <p className="text-white/90 text-sm mb-3">
                  {state === 'online' && pendingCount > 0
                    ? `${pendingCount} change${pendingCount > 1 ? 's' : ''} waiting to sync`
                    : config.message}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {pendingCount > 0 && (
                    <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 text-white">
                      {pendingCount} pending
                    </span>
                  )}
                  {failedCount > 0 && (
                    <span className="text-xs bg-red-700/50 rounded-full px-2 py-0.5 flex items-center gap-1 text-white">
                      <AlertTriangle className="w-3 h-3" />
                      {failedCount} failed
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {state !== 'online' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={checkNow}
                      disabled={isChecking}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                        'text-xs font-medium text-white/90',
                        'bg-white/20 hover:bg-white/30 transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isChecking && 'animate-spin motion-reduce:animate-none')} />
                      {isChecking ? 'Checking...' : 'Retry'}
                    </motion.button>
                  )}

                  {state === 'online' && pendingCount > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => syncAll()}
                      disabled={isSyncing}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                        'text-xs font-medium',
                        'bg-white text-amber-700',
                        'hover:bg-white/90 transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin motion-reduce:animate-none')} />
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </motion.button>
                  )}

                  {failedCount > 0 && state === 'online' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => retryFailedItems()}
                      disabled={isSyncing}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                        'text-xs font-medium text-white/90',
                        'bg-white/20 hover:bg-white/30 transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      Retry Failed
                    </motion.button>
                  )}

                  <button
                    onClick={handleToggleExpand}
                    className="ml-auto p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
                    aria-label="Collapse notification"
                  >
                    <ChevronDown className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            ) : (
              // Collapsed pill view
              <div className="flex items-center gap-2 px-3 py-2 text-white">
                <motion.div
                  animate={state === 'offline' ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Icon className="w-4 h-4" />
                </motion.div>
                <span className="text-xs font-medium whitespace-nowrap">
                  {state === 'online' && pendingCount > 0
                    ? `${pendingCount} pending`
                    : config.shortMessage}
                </span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
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
 * Uses the same Dynamic Island styling as the main banner
 */
export function CompactResilienceBanner({ className }: CompactResilienceBannerProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { accessToken } = useAuth();
  const { state } = useNetworkStatus();
  const { pendingCount } = useSyncManager(accessToken);

  if (!isMounted || (state === 'online' && pendingCount === 0)) {
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
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer',
        state === 'offline' && 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600',
        state === 'degraded' && 'bg-amber-500 dark:bg-amber-600 text-white hover:bg-amber-600 dark:hover:bg-amber-500',
        state === 'online' && pendingCount > 0 && 'bg-amber-500 dark:bg-amber-600 text-white hover:bg-amber-600 dark:hover:bg-amber-500',
        'transition-colors shadow-md',
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
