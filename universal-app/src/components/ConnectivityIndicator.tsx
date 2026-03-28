'use client';

/**
 * Connectivity Indicator
 *
 * A small persistent indicator showing connection state.
 * Features:
 * - Color-coded status dot (green/yellow/red)
 * - Subtle animations on state changes
 * - Click to expand for more details
 * - Mobile-friendly positioning
 *
 * @module components/ConnectivityIndicator
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertTriangle, RefreshCw, X, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNetworkStatus, type ConnectionState } from '@/hooks/useNetworkStatus';
import { useSyncManager } from '@/hooks/useSyncManager';

// ============================================================================
// Configuration
// ============================================================================

const STATUS_CONFIG: Record<
  ConnectionState,
  {
    color: string;
    bgColor: string;
    icon: typeof Wifi;
    label: string;
    description: string;
  }
> = {
  online: {
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-500/10',
    icon: Wifi,
    label: 'Connected',
    description: 'All systems operational',
  },
  degraded: {
    color: 'bg-amber-500',
    bgColor: 'bg-amber-500/10',
    icon: AlertTriangle,
    label: 'Degraded',
    description: 'Backend connectivity issues',
  },
  offline: {
    color: 'bg-red-500',
    bgColor: 'bg-red-500/10',
    icon: WifiOff,
    label: 'Offline',
    description: 'No network connection',
  },
};

// ============================================================================
// Component
// ============================================================================

interface ConnectivityIndicatorProps {
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Show expanded details by default */
  defaultExpanded?: boolean;
  /** Hide when online (only show problems) */
  hideWhenOnline?: boolean;
  /** Custom className */
  className?: string;
}

export function ConnectivityIndicator({
  position = 'bottom-right',
  defaultExpanded = false,
  hideWhenOnline = false,
  className,
}: ConnectivityIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showPulse, setShowPulse] = useState(false);
  const [prevState, setPrevState] = useState<ConnectionState | null>(null);

  const { state, latencyMs, isChecking, checkNow, errorMessage, lastBackendPing } =
    useNetworkStatus();
  const { pendingCount, isSyncing, syncAll } = useSyncManager();

  const config = STATUS_CONFIG[state];
  const Icon = config.icon;

  // Trigger pulse animation on state change
  useEffect(() => {
    if (prevState !== null && prevState !== state) {
      setShowPulse(true);
      const timeout = setTimeout(() => setShowPulse(false), 1000);
      return () => clearTimeout(timeout);
    }
    setPrevState(state);
  }, [state, prevState]);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  // Hide when online if configured
  if (hideWhenOnline && state === 'online' && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed z-50',
        positionClasses[position],
        className
      )}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          // Expanded Panel
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
              'backdrop-blur-xl rounded-xl shadow-lg border overflow-hidden',
              'bg-white/90 border-slate-200/60',
              'dark:bg-slate-900/90 dark:border-slate-700/60',
              'w-72'
            )}
          >
            {/* Header */}
            <div
              className={cn(
                'flex items-center justify-between px-4 py-3',
                config.bgColor
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn('w-2.5 h-2.5 rounded-full', config.color)} />
                <span className="font-medium text-sm">{config.label}</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Close details"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {config.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {latencyMs !== null && (
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{latencyMs}ms latency</span>
                  </div>
                )}

                {lastBackendPing && (
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(lastBackendPing).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Error message */}
              {errorMessage && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-md px-2 py-1.5">
                  {errorMessage}
                </div>
              )}

              {/* Pending items */}
              {pendingCount > 0 && (
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-2 py-1.5">
                  {pendingCount} item{pendingCount > 1 ? 's' : ''} pending sync
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={checkNow}
                  disabled={isChecking}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5',
                    'text-xs font-medium px-3 py-2 rounded-lg',
                    'bg-slate-100 hover:bg-slate-200 transition-colors',
                    'dark:bg-slate-800 dark:hover:bg-slate-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <RefreshCw
                    className={cn('w-3.5 h-3.5', isChecking && 'animate-spin')}
                  />
                  {isChecking ? 'Checking...' : 'Check Now'}
                </button>

                {pendingCount > 0 && state !== 'offline' && (
                  <button
                    onClick={() => syncAll()}
                    disabled={isSyncing}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5',
                      'text-xs font-medium px-3 py-2 rounded-lg',
                      'bg-primary text-primary-foreground',
                      'hover:bg-primary/90 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          // Collapsed Indicator
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className={cn(
              'relative flex items-center gap-2 px-3 py-2 rounded-full',
              'backdrop-blur-xl shadow-lg border transition-all',
              'bg-white/90 border-slate-200/60',
              'dark:bg-slate-900/90 dark:border-slate-700/60',
              'hover:shadow-xl'
            )}
            aria-label={`Connection status: ${config.label}`}
          >
            {/* Status dot with pulse */}
            <div className="relative">
              <motion.div
                animate={showPulse ? { scale: [1, 1.8, 1] } : {}}
                transition={{ duration: 0.5 }}
                className={cn('w-2.5 h-2.5 rounded-full', config.color)}
              />
              {showPulse && (
                <motion.div
                  initial={{ opacity: 0.8, scale: 1 }}
                  animate={{ opacity: 0, scale: 2 }}
                  transition={{ duration: 0.6 }}
                  className={cn(
                    'absolute inset-0 rounded-full',
                    config.color
                  )}
                />
              )}
            </div>

            {/* Icon */}
            <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />

            {/* Pending count badge */}
            {pendingCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-amber-500 rounded-full px-1"
              >
                {pendingCount > 99 ? '99+' : pendingCount}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
