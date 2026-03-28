'use client';

/**
 * useSession Hook
 *
 * React hook for session state management with auto-logout on idle,
 * session persistence, and integration with MSAL authentication.
 *
 * @module hooks/useSession
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     isActive,
 *     session,
 *     timeUntilExpiry,
 *     showWarning,
 *     extendSession,
 *     logout,
 *   } = useSession();
 *
 *   if (showWarning) {
 *     return <SessionWarning onExtend={extendSession} onLogout={logout} />;
 *   }
 *
 *   return <App />;
 * }
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import {
  SessionManager,
  getSessionManager,
  SessionManagerState,
  SessionData,
  SessionConfig,
  SessionEventCallbacks,
} from '@/lib/session';

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Options for configuring the useSession hook
 */
export interface UseSessionOptions {
  /** Custom session configuration */
  config?: Partial<SessionConfig>;
  /** Whether to automatically create session on auth (default: true) */
  autoCreateSession?: boolean;
  /** Whether to automatically logout when session expires (default: true) */
  autoLogout?: boolean;
  /** Callback when session is about to expire */
  onSessionExpiring?: (timeRemaining: number) => void;
  /** Callback when session has expired */
  onSessionExpired?: () => void;
  /** Callback when user activity is detected */
  onActivity?: () => void;
}

/**
 * Return type for useSession hook
 */
export interface UseSessionReturn {
  /** Whether session is active and valid */
  isActive: boolean;
  /** Whether session is idle (user inactive but session valid) */
  isIdle: boolean;
  /** Whether session is about to expire */
  isExpiring: boolean;
  /** Whether session has expired */
  isExpired: boolean;
  /** Whether session is loading/initializing */
  isLoading: boolean;
  /** Current session data (null if not authenticated) */
  session: SessionData | null;
  /** Current session status */
  status: SessionManagerState['status'];
  /** Time until session expires in milliseconds (null if expired) */
  timeUntilExpiry: number | null;
  /** Time until session expires formatted as "X min Y sec" */
  timeUntilExpiryFormatted: string | null;
  /** Whether the warning modal should be shown */
  showWarning: boolean;
  /** Session error if any */
  error: Error | null;
  /** Extend the current session (resets timeout) */
  extendSession: () => Promise<void>;
  /** End the session and logout */
  logout: () => Promise<void>;
  /** Record user activity manually (for custom events) */
  recordActivity: () => void;
  /** Get raw session manager instance (advanced usage) */
  getManager: () => SessionManager;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Format milliseconds as human-readable time
 */
function formatTimeRemaining(ms: number | null): string | null {
  if (ms === null || ms <= 0) return null;

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds} sec`;
  }

  return seconds > 0 ? `${minutes} min ${seconds} sec` : `${minutes} min`;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * React hook for session management
 *
 * Integrates with MSAL authentication and provides:
 * - Automatic session creation on login
 * - Idle timeout handling
 * - Session persistence
 * - Cross-tab synchronization
 * - Warning before expiry
 *
 * @example
 * ```tsx
 * function App() {
 *   const { isActive, showWarning, extendSession, logout } = useSession({
 *     onSessionExpiring: (timeRemaining) => {
 *       console.log(`Session expires in ${timeRemaining}ms`);
 *     },
 *   });
 *
 *   if (showWarning) {
 *     return (
 *       <SessionWarning
 *         onStayLoggedIn={extendSession}
 *         onLogout={logout}
 *       />
 *     );
 *   }
 *
 *   return isActive ? <Dashboard /> : <Login />;
 * }
 * ```
 */
export function useSession(options: UseSessionOptions = {}): UseSessionReturn {
  const {
    config,
    autoCreateSession = true,
    autoLogout = true,
    onSessionExpiring,
    onSessionExpired,
    onActivity,
  } = options;

  // Get auth state from MSAL
  const { isAuthenticated, account, idTokenClaims, logout: msalLogout } = useAuth();

  // Session state
  const [state, setState] = useState<SessionManagerState>({
    session: null,
    status: 'expired',
    isLoading: true,
    error: null,
    timeUntilExpiry: null,
    showWarning: false,
  });

  // Manager ref to avoid recreating
  const managerRef = useRef<SessionManager | null>(null);

  // Track if we've created a session for current auth
  const sessionCreatedRef = useRef(false);

  // Initialize session manager
  useEffect(() => {
    const callbacks: SessionEventCallbacks = {
      onSessionExpiring: (timeRemaining) => {
        onSessionExpiring?.(timeRemaining);
      },
      onSessionExpired: () => {
        onSessionExpired?.();
        if (autoLogout) {
          // Trigger MSAL logout
          msalLogout().catch(console.error);
        }
      },
      onActivity: () => {
        onActivity?.();
      },
      onError: (error) => {
        console.error('[useSession] Session error:', error);
      },
    };

    const manager = getSessionManager(callbacks, config);
    managerRef.current = manager;

    // Subscribe to state changes
    const unsubscribe = manager.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, [config, autoLogout, onSessionExpiring, onSessionExpired, onActivity, msalLogout]);

  // Create session when authenticated
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager || !autoCreateSession) return;

    const createSession = async () => {
      if (!isAuthenticated || !account || sessionCreatedRef.current) return;

      // Check if session already exists
      const existingSession = await manager.validateSession();
      if (existingSession) {
        sessionCreatedRef.current = true;
        return;
      }

      // Create new session from MSAL account
      try {
        await manager.createSession({
          userId: account.localAccountId || account.homeAccountId || account.username,
          organisationId: idTokenClaims?.organisation_id || idTokenClaims?.tid || 'unknown',
          userName: account.name || idTokenClaims?.name,
          userEmail: account.username || idTokenClaims?.email,
          roles: idTokenClaims?.roles,
        });
        sessionCreatedRef.current = true;
      } catch (error) {
        console.error('[useSession] Failed to create session:', error);
      }
    };

    createSession();
  }, [isAuthenticated, account, idTokenClaims, autoCreateSession]);

  // Reset session created flag when auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      sessionCreatedRef.current = false;
    }
  }, [isAuthenticated]);

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Extend the current session
   */
  const extendSession = useCallback(async () => {
    const manager = managerRef.current;
    if (!manager) return;

    await manager.refreshSession();
  }, []);

  /**
   * End session and logout
   */
  const logout = useCallback(async () => {
    const manager = managerRef.current;
    
    // End local session
    if (manager) {
      manager.requestLogout();
    }

    // Logout from MSAL
    try {
      await msalLogout();
    } catch (error) {
      console.error('[useSession] MSAL logout failed:', error);
    }

    sessionCreatedRef.current = false;
  }, [msalLogout]);

  /**
   * Record activity manually
   */
  const recordActivity = useCallback(() => {
    const manager = managerRef.current;
    if (!manager) return;

    manager.recordActivity('api_request');
  }, []);

  /**
   * Get the session manager instance
   */
  const getManager = useCallback(() => {
    if (!managerRef.current) {
      throw new Error('Session manager not initialized');
    }
    return managerRef.current;
  }, []);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const isActive = state.status === 'active' || state.status === 'refreshing';
  const isIdle = state.status === 'idle';
  const isExpiring = state.status === 'expiring';
  const isExpired = state.status === 'expired';

  return {
    isActive,
    isIdle,
    isExpiring,
    isExpired,
    isLoading: state.isLoading,
    session: state.session,
    status: state.status,
    timeUntilExpiry: state.timeUntilExpiry,
    timeUntilExpiryFormatted: formatTimeRemaining(state.timeUntilExpiry),
    showWarning: state.showWarning,
    error: state.error,
    extendSession,
    logout,
    recordActivity,
    getManager,
  };
}

// ============================================================================
// Simplified Hooks
// ============================================================================

/**
 * Simplified hook that just returns session status
 */
export function useSessionStatus(): {
  isActive: boolean;
  isIdle: boolean;
  isExpiring: boolean;
  isExpired: boolean;
  isLoading: boolean;
} {
  const { isActive, isIdle, isExpiring, isExpired, isLoading } = useSession();
  return { isActive, isIdle, isExpiring, isExpired, isLoading };
}

/**
 * Hook for session timeout countdown
 */
export function useSessionTimeout(): {
  timeRemaining: number | null;
  timeRemainingFormatted: string | null;
  isExpiring: boolean;
} {
  const { timeUntilExpiry, timeUntilExpiryFormatted, isExpiring } = useSession();
  return {
    timeRemaining: timeUntilExpiry,
    timeRemainingFormatted: timeUntilExpiryFormatted,
    isExpiring,
  };
}

export default useSession;
