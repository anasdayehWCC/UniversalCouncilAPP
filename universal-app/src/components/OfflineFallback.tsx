'use client';

/**
 * Offline Fallback
 *
 * Full-page component shown when completely offline and no cached data available.
 * Provides clear user instructions and retry functionality.
 *
 * @module components/OfflineFallback
 */

import { useEffect, useState, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, Cloud, Smartphone, Signal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSyncManager } from '@/hooks/useSyncManager';
import { useAuth } from '@/hooks/useAuth';

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
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { state, checkNow, isChecking } = useNetworkStatus();
  const { accessToken } = useAuth();
  const { pendingCount } = useSyncManager(accessToken);
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

  // Don't render until after hydration to prevent SSR mismatch
  // If online (or not yet mounted), render children or nothing
  if (!isMounted || !isOffline) {
    return children ? <>{children}</> : null;
  }

  return (
    <div
      className={cn(
        'min-h-[100dvh] flex items-center justify-center p-6',
        'bg-gradient-to-b from-background to-muted',
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
          <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl" />
          
          {/* Icon container */}
          <div className="relative flex items-center justify-center w-full h-full bg-destructive/10 rounded-full">
            <WifiOff className="w-10 h-10 text-destructive" />
          </div>
          
          {/* Orbiting signal dots */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-destructive rounded-full opacity-50" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-destructive rounded-full opacity-30" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-foreground mb-3">
          {title}
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {description}
        </p>

        {/* Pending items indicator */}
        {showPendingCount && pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-warning/10 rounded-full text-sm text-warning"
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
            'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'shadow-lg shadow-primary/25'
          )}
        >
          <RefreshCw className={cn('w-5 h-5', isChecking && 'animate-spin motion-reduce:animate-none')} />
          {isChecking ? 'Checking connection...' : 'Try Again'}
        </motion.button>

        {/* Retry count feedback */}
        {retryCount > 0 && !isChecking && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          className="mt-3 text-xs text-muted-foreground"
          >
            Checked {retryCount} time{retryCount > 1 ? 's' : ''}
          </motion.p>
        )}

        {/* Tips */}
        <div className="mt-10 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Things to try
          </p>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
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
      <Icon className="w-4 h-4 text-muted-foreground" />
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
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { state, checkNow, isChecking } = useNetworkStatus();
  const { pendingCount } = useSyncManager();

  // Don't render until after hydration to prevent SSR mismatch
  if (!isMounted || state !== 'offline') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'rounded-xl p-4 flex items-center gap-4',
        'bg-destructive/10',
        'border border-destructive/20',
        className
      )}
    >
      <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-destructive/10 rounded-full">
        <WifiOff className="w-5 h-5 text-destructive" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-destructive">
          You&apos;re offline
        </p>
        <p className="text-sm text-destructive/80">
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
          'text-destructive',
          'hover:bg-destructive/10',
          'transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        aria-label="Retry connection"
      >
        <RefreshCw className={cn('w-5 h-5', isChecking && 'animate-spin motion-reduce:animate-none')} />
      </button>
    </motion.div>
  );
}
