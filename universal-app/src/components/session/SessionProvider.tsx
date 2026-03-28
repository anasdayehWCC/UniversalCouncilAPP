'use client';

/**
 * Session Provider Component
 *
 * Context provider that wraps the application with session management.
 * Integrates with MSAL authentication and provides session state to children.
 *
 * @module components/session/SessionProvider
 *
 * @example
 * ```tsx
 * // In your root layout
 * import { SessionProvider } from '@/components/session/SessionProvider';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           <SessionProvider showWarningModal>
 *             {children}
 *           </SessionProvider>
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */

import * as React from 'react';
import { createContext, useContext, useMemo } from 'react';
import { useSession, UseSessionReturn, UseSessionOptions } from '@/hooks/useSession';
import { SessionWarning } from './SessionWarning';

// ============================================================================
// Context
// ============================================================================

const SessionContext = createContext<UseSessionReturn | null>(null);

/**
 * Hook to access session context
 * 
 * @throws Error if used outside SessionProvider
 */
export function useSessionContext(): UseSessionReturn {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}

// ============================================================================
// Provider Props
// ============================================================================

export interface SessionProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Whether to show the warning modal automatically (default: true) */
  showWarningModal?: boolean;
  /** Custom session configuration */
  config?: UseSessionOptions['config'];
  /** Whether to auto-create session on auth (default: true) */
  autoCreateSession?: boolean;
  /** Whether to auto-logout on session expire (default: true) */
  autoLogout?: boolean;
  /** Custom callback when session is expiring */
  onSessionExpiring?: (timeRemaining: number) => void;
  /** Custom callback when session has expired */
  onSessionExpired?: () => void;
  /** Custom warning modal title */
  warningTitle?: string;
  /** Custom warning modal description */
  warningDescription?: string;
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Session Provider
 *
 * Wraps the application with session management context and optionally
 * renders the session warning modal.
 */
export function SessionProvider({
  children,
  showWarningModal = true,
  config,
  autoCreateSession = true,
  autoLogout = true,
  onSessionExpiring,
  onSessionExpired,
  warningTitle,
  warningDescription,
}: SessionProviderProps) {
  // Use the session hook
  const session = useSession({
    config,
    autoCreateSession,
    autoLogout,
    onSessionExpiring,
    onSessionExpired,
  });

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => session, [
    session.isActive,
    session.isIdle,
    session.isExpiring,
    session.isExpired,
    session.isLoading,
    session.session,
    session.status,
    session.timeUntilExpiry,
    session.showWarning,
    session.error,
  ]);

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
      
      {/* Session Warning Modal */}
      {showWarningModal && (
        <SessionWarning
          open={session.showWarning}
          timeRemaining={session.timeUntilExpiry}
          onStayLoggedIn={session.extendSession}
          onLogout={session.logout}
          title={warningTitle}
          description={warningDescription}
        />
      )}
    </SessionContext.Provider>
  );
}

// ============================================================================
// HOC for Route Protection
// ============================================================================

export interface WithSessionProps {
  /** Whether to require an active session (default: true) */
  requireSession?: boolean;
  /** Component to render while loading */
  loadingComponent?: React.ReactNode;
  /** Component to render when session is expired */
  expiredComponent?: React.ReactNode;
  /** Whether to redirect to login on expired session */
  redirectOnExpired?: boolean;
  /** Custom redirect path */
  redirectPath?: string;
}

/**
 * Higher-order component that wraps a component with session protection
 *
 * @example
 * ```tsx
 * const ProtectedPage = withSession(MyPage, {
 *   requireSession: true,
 *   expiredComponent: <ExpiredMessage />,
 * });
 * ```
 */
export function withSession<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithSessionProps = {}
): React.FC<P> {
  const {
    requireSession = true,
    loadingComponent = <div>Loading...</div>,
    expiredComponent,
  } = options;

  return function SessionProtectedComponent(props: P) {
    const { isActive, isLoading, isExpired } = useSessionContext();

    if (isLoading) {
      return <>{loadingComponent}</>;
    }

    if (requireSession && !isActive) {
      if (isExpired && expiredComponent) {
        return <>{expiredComponent}</>;
      }
      // Session required but not active
      // The SessionProvider should handle the redirect/logout
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

// ============================================================================
// Session Gate Component
// ============================================================================

export interface SessionGateProps {
  /** Children to render when session is active */
  children: React.ReactNode;
  /** Content to show while loading */
  loading?: React.ReactNode;
  /** Content to show when session is expired */
  expired?: React.ReactNode;
  /** Content to show when idle (optional) */
  idle?: React.ReactNode;
  /** Whether to require an active session */
  requireActive?: boolean;
}

/**
 * Conditional rendering based on session state
 *
 * @example
 * ```tsx
 * <SessionGate
 *   loading={<Skeleton />}
 *   expired={<LoginPrompt />}
 * >
 *   <Dashboard />
 * </SessionGate>
 * ```
 */
export function SessionGate({
  children,
  loading = null,
  expired = null,
  idle,
  requireActive = true,
}: SessionGateProps) {
  const { isActive, isLoading, isExpired, isIdle } = useSessionContext();

  if (isLoading) {
    return <>{loading}</>;
  }

  if (isExpired) {
    return <>{expired}</>;
  }

  if (requireActive && isIdle && idle) {
    return <>{idle}</>;
  }

  if (requireActive && !isActive) {
    return <>{expired}</>;
  }

  return <>{children}</>;
}

export default SessionProvider;
