'use client';

/**
 * Network Status Hook
 *
 * Monitors network connectivity with three states:
 * - online: Full connectivity to backend
 * - degraded: Browser online but backend unreachable
 * - offline: No network connection
 *
 * @module hooks/useNetworkStatus
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ConnectionState = 'online' | 'offline' | 'degraded';

export interface NetworkStatus {
  /** Current connection state */
  state: ConnectionState;
  /** Browser's navigator.onLine value */
  isNavigatorOnline: boolean;
  /** Backend health check result */
  isBackendReachable: boolean;
  /** Last successful backend ping timestamp */
  lastBackendPing: Date | null;
  /** Latency of last successful ping in ms */
  latencyMs: number | null;
  /** Error message if backend unreachable */
  errorMessage: string | null;
  /** Whether currently checking connectivity */
  isChecking: boolean;
}

export interface NetworkStatusActions {
  /** Force an immediate connectivity check */
  checkNow: () => Promise<void>;
  /** Reset error state */
  clearError: () => void;
}

export type UseNetworkStatusReturn = NetworkStatus & NetworkStatusActions;

// ============================================================================
// Configuration
// ============================================================================

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_HOST ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8080';

/** Health endpoint for backend ping */
const HEALTH_ENDPOINT = `${API_BASE}/healthcheck`;

/** How often to ping backend when online (ms) */
const PING_INTERVAL_ONLINE = 30000; // 30 seconds

/** How often to ping when degraded (more aggressive) */
const PING_INTERVAL_DEGRADED = 10000; // 10 seconds

/** Timeout for health check requests (ms) */
const PING_TIMEOUT = 5000;

/** Number of consecutive failures before marking degraded */
const FAILURES_BEFORE_DEGRADED = 2;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Monitor network connectivity and backend health
 *
 * @param options Configuration options
 * @returns Network status and control functions
 *
 * @example
 * ```tsx
 * function ConnectionIndicator() {
 *   const { state, latencyMs, checkNow } = useNetworkStatus();
 *
 *   return (
 *     <div>
 *       Status: {state}
 *       {latencyMs && <span>({latencyMs}ms)</span>}
 *       <button onClick={checkNow}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useNetworkStatus(options?: {
  /** Disable automatic backend pinging */
  disableBackendPing?: boolean;
  /** Custom health endpoint */
  healthEndpoint?: string;
}): UseNetworkStatusReturn {
  const { disableBackendPing = false, healthEndpoint = HEALTH_ENDPOINT } = options ?? {};

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [isNavigatorOnline, setIsNavigatorOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isBackendReachable, setIsBackendReachable] = useState(true);
  const [lastBackendPing, setLastBackendPing] = useState<Date | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Track consecutive failures
  const failureCountRef = useRef(0);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------

  const state: ConnectionState = !isNavigatorOnline
    ? 'offline'
    : !isBackendReachable
      ? 'degraded'
      : 'online';

  // ---------------------------------------------------------------------------
  // Backend Health Check
  // ---------------------------------------------------------------------------

  const checkBackendHealth = useCallback(async (): Promise<void> => {
    if (disableBackendPing || !isNavigatorOnline) {
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsChecking(true);

    const startTime = performance.now();

    try {
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        signal: abortControllerRef.current.signal,
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      });

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), PING_TIMEOUT);
      });

      // Race against timeout
      await Promise.race([response, timeoutPromise]);

      if (response.ok) {
        const endTime = performance.now();
        setLatencyMs(Math.round(endTime - startTime));
        setLastBackendPing(new Date());
        setIsBackendReachable(true);
        setErrorMessage(null);
        failureCountRef.current = 0;
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't update state
        return;
      }

      failureCountRef.current++;

      if (failureCountRef.current >= FAILURES_BEFORE_DEGRADED) {
        setIsBackendReachable(false);
        setErrorMessage(err instanceof Error ? err.message : 'Backend unreachable');
        setLatencyMs(null);
      }
    } finally {
      setIsChecking(false);
      abortControllerRef.current = null;
    }
  }, [disableBackendPing, healthEndpoint, isNavigatorOnline]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const checkNow = useCallback(async () => {
    failureCountRef.current = 0; // Reset failures for manual check
    await checkBackendHealth();
  }, [checkBackendHealth]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Online/Offline Detection
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleOnline = () => {
      setIsNavigatorOnline(true);
      // Immediately check backend when coming online
      failureCountRef.current = 0;
      checkBackendHealth();
    };

    const handleOffline = () => {
      setIsNavigatorOnline(false);
      setIsBackendReachable(false);
      setErrorMessage('No network connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkBackendHealth]);

  // ---------------------------------------------------------------------------
  // Periodic Health Checks
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (disableBackendPing || !isNavigatorOnline) {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      return;
    }

    // Initial check
    checkBackendHealth();

    // Set up periodic checks
    const interval = state === 'degraded' ? PING_INTERVAL_DEGRADED : PING_INTERVAL_ONLINE;

    pingIntervalRef.current = setInterval(checkBackendHealth, interval);

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      // Cancel any in-flight request on cleanup
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [disableBackendPing, isNavigatorOnline, state, checkBackendHealth]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    state,
    isNavigatorOnline,
    isBackendReachable,
    lastBackendPing,
    latencyMs,
    errorMessage,
    isChecking,
    checkNow,
    clearError,
  };
}

// ============================================================================
// Utility Hook: Connection State Only
// ============================================================================

/**
 * Simplified hook that only returns the connection state
 * Use when you don't need full status details
 */
export function useConnectionState(): ConnectionState {
  const { state } = useNetworkStatus();
  return state;
}
