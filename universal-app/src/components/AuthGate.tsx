'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { apiScopes, isDemoMode } from '@/lib/auth/msal-config';
import { useAccessToken } from '@/hooks/useAuth';

interface AuthGateProps {
  children: ReactNode;
  /**
   * Custom loading component to show while authenticating
   */
  loadingComponent?: ReactNode;
  /**
   * If true, allows unauthenticated access (useful for public routes)
   * @default false
   */
  allowUnauthenticated?: boolean;
}

/**
 * Default loading component shown during authentication
 */
function DefaultLoadingComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary/10 to-accent/10">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Spinner */}
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <p className="text-sm text-slate-600 font-medium">
          Signing you in with Microsoft Entra...
        </p>
        <p className="text-xs text-slate-400">
          You will be redirected shortly
        </p>
      </div>
    </div>
  );
}

/**
 * Component that gates access to routes, requiring authentication
 * 
 * Features:
 * - Automatically redirects to login if not authenticated
 * - Shows loading state during authentication
 * - Supports demo mode bypass
 * - Customizable loading component
 * 
 * @example
 * ```tsx
 * // Basic usage (already wrapped by AuthProvider)
 * <AuthGate>
 *   <ProtectedContent />
 * </AuthGate>
 * 
 * // With custom loading
 * <AuthGate loadingComponent={<MySpinner />}>
 *   <ProtectedContent />
 * </AuthGate>
 * 
 * // Allow unauthenticated access
 * <AuthGate allowUnauthenticated>
 *   <PublicContent />
 * </AuthGate>
 * ```
 */
export function AuthGate({
  children,
  loadingComponent,
  allowUnauthenticated = false,
}: AuthGateProps) {
  const { instance, inProgress, accounts } = useMsal();
  const { accessToken, isLoading } = useAccessToken();
  const hasStartedLoginRef = useRef(false);

  // Trigger login redirect if not authenticated
  useEffect(() => {
    // Demo mode: skip authentication
    if (isDemoMode) return;
    
    // Allow unauthenticated access if specified
    if (allowUnauthenticated) return;
    
    // Wait for MSAL to finish any current interaction
    if (inProgress !== InteractionStatus.None) return;
    
    // Already authenticated or login already started
    if (accounts.length > 0 || hasStartedLoginRef.current) return;
    
    // Start login redirect
    hasStartedLoginRef.current = true;
    instance.loginRedirect({ scopes: apiScopes }).catch((err) => {
      console.error('[AuthGate] Login redirect failed:', err);
      hasStartedLoginRef.current = false;
    });
  }, [accounts.length, inProgress, instance, allowUnauthenticated]);

  // Demo mode: render children immediately
  if (isDemoMode) {
    return <>{children}</>;
  }

  // Allow unauthenticated: render children regardless of auth state
  if (allowUnauthenticated) {
    return <>{children}</>;
  }

  // Show loading state while authenticating
  if (!accessToken || isLoading) {
    return <>{loadingComponent ?? <DefaultLoadingComponent />}</>;
  }

  // Authenticated: render children
  return <>{children}</>;
}

/**
 * HOC version of AuthGate for wrapping components
 * 
 * @example
 * ```tsx
 * const ProtectedPage = withAuthGate(function MyPage() {
 *   return <div>Protected content</div>;
 * });
 * ```
 */
export function withAuthGate<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthGateProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <AuthGate {...options}>
        <Component {...props} />
      </AuthGate>
    );
  };
}
