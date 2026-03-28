'use client';

/**
 * Session Warning Component
 *
 * Modal warning displayed when the user's session is about to expire.
 * Provides options to stay logged in or logout immediately.
 *
 * @module components/session/SessionWarning
 *
 * @example
 * ```tsx
 * <SessionWarning
 *   open={showWarning}
 *   timeRemaining={120000} // 2 minutes
 *   onStayLoggedIn={handleExtend}
 *   onLogout={handleLogout}
 * />
 * ```
 */

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface SessionWarningProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Time remaining in milliseconds until session expires */
  timeRemaining: number | null;
  /** Callback when user chooses to stay logged in */
  onStayLoggedIn: () => void | Promise<void>;
  /** Callback when user chooses to logout */
  onLogout: () => void | Promise<void>;
  /** Optional custom title */
  title?: string;
  /** Optional custom description */
  description?: string;
  /** Whether actions are loading */
  isLoading?: boolean;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Format milliseconds as countdown timer (MM:SS)
 */
function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00';

  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get urgency level based on time remaining
 */
function getUrgencyLevel(ms: number): 'low' | 'medium' | 'high' | 'critical' {
  if (ms <= 15000) return 'critical'; // < 15 seconds
  if (ms <= 30000) return 'high'; // < 30 seconds
  if (ms <= 60000) return 'medium'; // < 1 minute
  return 'low';
}

// ============================================================================
// Countdown Timer Component
// ============================================================================

interface CountdownTimerProps {
  timeRemaining: number | null;
}

function CountdownTimer({ timeRemaining }: CountdownTimerProps) {
  const [displayTime, setDisplayTime] = useState(timeRemaining ?? 0);

  // Update every second
  useEffect(() => {
    if (timeRemaining === null) return;

    setDisplayTime(timeRemaining);

    const interval = setInterval(() => {
      setDisplayTime((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const urgency = getUrgencyLevel(displayTime);
  const formatted = formatCountdown(displayTime);

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 text-4xl font-mono font-bold tabular-nums',
        'transition-colors duration-300',
        urgency === 'critical' && 'text-red-600 animate-pulse',
        urgency === 'high' && 'text-red-500',
        urgency === 'medium' && 'text-orange-500',
        urgency === 'low' && 'text-slate-700'
      )}
      role="timer"
      aria-live="polite"
      aria-label={`Session expires in ${formatted}`}
    >
      <Clock
        className={cn(
          'h-8 w-8',
          urgency === 'critical' && 'animate-pulse'
        )}
      />
      <span>{formatted}</span>
    </div>
  );
}

// ============================================================================
// Progress Bar Component
// ============================================================================

interface TimeProgressBarProps {
  timeRemaining: number | null;
  totalTime: number;
}

function TimeProgressBar({ timeRemaining, totalTime }: TimeProgressBarProps) {
  const [progress, setProgress] = useState(
    timeRemaining !== null ? (timeRemaining / totalTime) * 100 : 100
  );

  useEffect(() => {
    if (timeRemaining === null) return;

    const initialProgress = (timeRemaining / totalTime) * 100;
    setProgress(initialProgress);

    const decrementPerSecond = (1000 / totalTime) * 100;
    const interval = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - decrementPerSecond));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, totalTime]);

  const urgency = timeRemaining !== null ? getUrgencyLevel(timeRemaining) : 'low';

  return (
    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
      <div
        className={cn(
          'h-full transition-all duration-1000 ease-linear rounded-full',
          urgency === 'critical' && 'bg-red-600',
          urgency === 'high' && 'bg-red-500',
          urgency === 'medium' && 'bg-orange-500',
          urgency === 'low' && 'bg-green-500'
        )}
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

// ============================================================================
// Session Warning Component
// ============================================================================

/**
 * Session Warning Modal
 *
 * Displays a modal warning when the user's session is about to expire,
 * with options to extend the session or logout immediately.
 */
export function SessionWarning({
  open,
  timeRemaining,
  onStayLoggedIn,
  onLogout,
  title = 'Session Expiring',
  description = 'Your session is about to expire due to inactivity. Would you like to stay logged in?',
  isLoading = false,
  className,
}: SessionWarningProps) {
  const [isExtending, setIsExtending] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Reset loading states when dialog closes
  useEffect(() => {
    if (!open) {
      setIsExtending(false);
      setIsLoggingOut(false);
    }
  }, [open]);

  const handleStayLoggedIn = useCallback(async () => {
    setIsExtending(true);
    try {
      await onStayLoggedIn();
    } catch (error) {
      console.error('[SessionWarning] Failed to extend session:', error);
    } finally {
      setIsExtending(false);
    }
  }, [onStayLoggedIn]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch (error) {
      console.error('[SessionWarning] Failed to logout:', error);
    }
    // Don't reset loading state - user is logging out
  }, [onLogout]);

  // Warning period (2 minutes by default)
  const warningPeriod = 2 * 60 * 1000;

  return (
    <Dialog open={open}>
      <DialogContent
        className={cn(
          'sm:max-w-md',
          'bg-gradient-to-b from-white to-slate-50',
          className
        )}
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-600 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          {/* Countdown Timer */}
          <CountdownTimer timeRemaining={timeRemaining} />

          {/* Progress Bar */}
          <TimeProgressBar
            timeRemaining={timeRemaining}
            totalTime={warningPeriod}
          />

          {/* Status Text */}
          <p className="text-center text-sm text-slate-500">
            {timeRemaining !== null && timeRemaining <= 10000
              ? 'Session will expire momentarily...'
              : 'Click "Stay Logged In" to continue your session'}
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoading || isExtending || isLoggingOut}
            className="flex-1 sm:flex-none"
          >
            {isLoggingOut ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </>
            )}
          </Button>

          <Button
            variant="default"
            onClick={handleStayLoggedIn}
            disabled={isLoading || isExtending || isLoggingOut}
            className="flex-1 sm:flex-none"
            autoFocus
          >
            {isExtending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Extending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Stay Logged In
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Pre-connected Session Warning (integrates with useSession)
// ============================================================================

import { useSession } from '@/hooks/useSession';

/**
 * Auto-connected Session Warning
 *
 * Version of SessionWarning that automatically connects to the session hook.
 * Simply drop this component anywhere in your app to enable session warnings.
 *
 * @example
 * ```tsx
 * // In your layout
 * function RootLayout({ children }) {
 *   return (
 *     <>
 *       {children}
 *       <AutoSessionWarning />
 *     </>
 *   );
 * }
 * ```
 */
export function AutoSessionWarning() {
  const { showWarning, timeUntilExpiry, extendSession, logout } = useSession();

  return (
    <SessionWarning
      open={showWarning}
      timeRemaining={timeUntilExpiry}
      onStayLoggedIn={extendSession}
      onLogout={logout}
    />
  );
}

export default SessionWarning;
