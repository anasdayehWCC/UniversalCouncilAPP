'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from '@azure/msal-browser';
import {
  msalConfig,
  apiScopes,
  isDemoMode,
  IDLE_TIMEOUT_MS,
  TOKEN_REFRESH_INTERVAL_MS,
} from '@/lib/auth/msal-config';
import { AuthGate } from '@/components/AuthGate';

// Create a singleton MSAL instance (only if not in demo mode)
let msalInstance: PublicClientApplication | null = null;

/**
 * Get or create the MSAL PublicClientApplication instance
 * Uses singleton pattern to ensure only one instance exists
 */
function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    
    // Register event callbacks for token acquisition
    msalInstance.addEventCallback((event: EventMessage) => {
      if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        const payload = event.payload as AuthenticationResult;
        // Set the active account after successful login
        if (payload.account) {
          msalInstance?.setActiveAccount(payload.account);
        }
      }
    });
  }
  return msalInstance;
}

interface AuthProviderProps {
  children: ReactNode;
  /**
   * If true, skips the AuthGate protection (useful for public pages)
   * @default false
   */
  skipAuthGate?: boolean;
}

/**
 * Authentication provider that wraps the app with MSAL context
 * 
 * Features:
 * - Manages Azure Entra ID authentication via MSAL
 * - Automatic token refresh on idle timeout
 * - Demo mode bypass for development
 * - Integrates with AuthGate for route protection
 * 
 * @example
 * ```tsx
 * // In your root layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <AuthProvider>
 *       {children}
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children, skipAuthGate = false }: AuthProviderProps) {
  const lastActiveRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize last active time on mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      lastActiveRef.current = Date.now();
      isInitializedRef.current = true;
    }
  }, []);

  // Set up idle timeout and token refresh (only in non-demo mode)
  useEffect(() => {
    if (isDemoMode) return;

    const instance = getMsalInstance();
    
    // Track user activity
    const resetActivity = () => {
      lastActiveRef.current = Date.now();
    };

    // Periodic token refresh check
    const checkIdleAndRefresh = async () => {
      // Skip check if not initialized
      if (lastActiveRef.current === 0) return;
      
      const idleTime = Date.now() - lastActiveRef.current;
      
      if (idleTime > IDLE_TIMEOUT_MS) {
        // User has been idle for too long, try to refresh token silently
        try {
          const accounts = instance.getAllAccounts();
          if (accounts.length > 0) {
            await instance.acquireTokenSilent({
              account: accounts[0],
              scopes: apiScopes,
            });
            lastActiveRef.current = Date.now();
          }
        } catch (err) {
          console.warn('[AuthProvider] Idle timeout - forcing re-auth:', err);
          // Force logout if silent refresh fails
          try {
            await instance.logoutRedirect();
          } catch (logoutErr) {
            console.error('[AuthProvider] Logout failed:', logoutErr);
          }
        }
      }
    };

    // Start interval
    intervalRef.current = setInterval(checkIdleAndRefresh, TOKEN_REFRESH_INTERVAL_MS);

    // Track activity events
    window.addEventListener('mousemove', resetActivity);
    window.addEventListener('keydown', resetActivity);
    window.addEventListener('click', resetActivity);
    window.addEventListener('touchstart', resetActivity);
    window.addEventListener('scroll', resetActivity);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keydown', resetActivity);
      window.removeEventListener('click', resetActivity);
      window.removeEventListener('touchstart', resetActivity);
      window.removeEventListener('scroll', resetActivity);
    };
  }, []);

  // Demo mode: skip MSAL entirely
  if (isDemoMode) {
    return <>{children}</>;
  }

  const instance = getMsalInstance();

  return (
    <MsalProvider instance={instance}>
      {skipAuthGate ? children : <AuthGate>{children}</AuthGate>}
    </MsalProvider>
  );
}

/**
 * Export the MSAL instance for direct access when needed
 * Note: Prefer using useAuth hook instead
 */
export function getMsalInstanceDirect(): PublicClientApplication | null {
  if (isDemoMode) return null;
  return getMsalInstance();
}
