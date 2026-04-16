'use client';

/**
 * Network Status Provider
 *
 * Runs a single useNetworkStatus polling loop and shares the result via context.
 * Without this provider, every component calling useNetworkStatus() creates its
 * own polling interval — 3 components means 3x the health check requests.
 *
 * @module providers/NetworkStatusProvider
 */

import { createContext, useContext } from 'react';
import {
  useNetworkStatus as useNetworkStatusImpl,
  type UseNetworkStatusReturn,
  type ConnectionState,
  type NetworkStatus,
  type NetworkStatusActions,
} from '@/hooks/useNetworkStatus';

// Re-export types so consumers don't need to import from two places
export type { ConnectionState, NetworkStatus, NetworkStatusActions, UseNetworkStatusReturn };

// ============================================================================
// Context
// ============================================================================

const NetworkStatusContext = createContext<UseNetworkStatusReturn | null>(null);

// ============================================================================
// Provider
// ============================================================================

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const status = useNetworkStatusImpl();

  return (
    <NetworkStatusContext.Provider value={status}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

// ============================================================================
// Consumer Hook
// ============================================================================

/**
 * Read shared network status from the provider.
 *
 * Falls back to a standalone polling instance when used outside the provider,
 * so existing code doesn't break during migration.
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  const ctx = useContext(NetworkStatusContext);
  if (!ctx) {
    throw new Error(
      'useNetworkStatus must be used within <NetworkStatusProvider>. ' +
      'Wrap your app (or the relevant subtree) in <NetworkStatusProvider>.'
    );
  }
  return ctx;
}
