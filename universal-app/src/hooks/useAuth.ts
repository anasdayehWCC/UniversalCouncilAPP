'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { InteractionStatus, SilentRequest, AccountInfo } from '@azure/msal-browser';
import { useAccount, useMsal } from '@azure/msal-react';
import { apiScopes, isDemoMode, loginRequest } from '@/lib/auth/msal-config';

/**
 * ID token claims structure from Azure Entra ID
 */
export interface IdTokenClaims {
  /** User's email address */
  email?: string;
  /** Preferred username (usually email) */
  preferred_username?: string;
  /** User's display name */
  name?: string;
  /** Object ID (user's unique identifier in Azure AD) */
  oid?: string;
  /** Subject identifier */
  sub?: string;
  /** Tenant ID */
  tid?: string;
  /** Organization/tenant ID (custom claim) */
  organisation_id?: string;
  /** User roles from app registration */
  roles?: string[];
  /** Group memberships */
  groups?: string[];
}

/**
 * Auth state returned by useAuth hook
 */
export interface AuthState {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth is still loading/initializing */
  isLoading: boolean;
  /** Current access token (null if not authenticated) */
  accessToken: string | null;
  /** Current account info */
  account: AccountInfo | null;
  /** ID token claims containing user info */
  idTokenClaims: IdTokenClaims | null;
  /** MSAL interaction status */
  inProgress: InteractionStatus;
  /** Error if authentication failed */
  error: Error | null;
}

/**
 * Auth actions returned by useAuth hook
 */
export interface AuthActions {
  /** Trigger login redirect */
  login: () => Promise<void>;
  /** Trigger logout redirect */
  logout: () => Promise<void>;
  /** Get a fresh access token (forces refresh if needed) */
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
}

/**
 * Hook for authentication operations using MSAL
 * 
 * Provides access token management, user info, and auth actions.
 * Automatically falls back to demo mode when NEXT_PUBLIC_DEMO_MODE=true.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, accessToken, login, logout } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <button onClick={login}>Sign In</button>;
 *   }
 *   
 *   return <button onClick={logout}>Sign Out</button>;
 * }
 * ```
 */
export function useAuth(): AuthState & AuthActions {
  const { instance, inProgress, accounts } = useMsal();
  const account = useAccount(accounts[0] || null);
  
  // Initialize with demo mode values if applicable
  const [accessToken, setAccessToken] = useState<string | null>(
    isDemoMode ? 'demo-mode-token' : null
  );
  const [idTokenClaims, setIdTokenClaims] = useState<IdTokenClaims | null>(
    isDemoMode ? {
      organisation_id: process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? 'demo-org',
      email: 'demo@example.com',
      name: 'Demo User',
      roles: ['user'],
    } : null
  );
  const [error, setError] = useState<Error | null>(null);

  // Build token request with current account
  const request: SilentRequest | null = useMemo(() => {
    if (!account) return null;
    return {
      account,
      scopes: apiScopes,
    };
  }, [account]);

  // Acquire token effect
  useEffect(() => {
    // Demo mode: already initialized with mock values
    if (isDemoMode) return;

    // Skip if no request or interaction in progress
    if (!request || inProgress !== InteractionStatus.None) return;

    const acquireToken = async () => {
      try {
        const result = await instance.acquireTokenSilent(request);
        setAccessToken(result.accessToken);
        setIdTokenClaims(result.idTokenClaims as IdTokenClaims);
        setError(null);
      } catch (err) {
        const msalError = err as { errorCode?: string };
        
        // If no tokens found or login error, redirect to login
        if (
          msalError.errorCode === 'no_tokens_found' ||
          msalError.errorCode === 'user_login_error' ||
          msalError.errorCode === 'interaction_required'
        ) {
          try {
            await instance.loginRedirect(loginRequest);
          } catch (loginErr) {
            setError(loginErr as Error);
            console.error('[useAuth] Login redirect failed:', loginErr);
          }
        } else {
          setError(err as Error);
          console.error('[useAuth] Token acquisition failed:', err);
        }
      }
    };

    acquireToken();
  }, [instance, request, inProgress]);

  // Login action
  const login = useCallback(async () => {
    if (isDemoMode) {
      // In demo mode, just set authenticated state
      setAccessToken('demo-mode-token');
      setIdTokenClaims({
        organisation_id: process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? 'demo-org',
        email: 'demo@example.com',
        name: 'Demo User',
        roles: ['user'],
      });
      return;
    }

    try {
      await instance.loginRedirect(loginRequest);
    } catch (err) {
      setError(err as Error);
      console.error('[useAuth] Login failed:', err);
      throw err;
    }
  }, [instance]);

  // Logout action
  const logout = useCallback(async () => {
    if (isDemoMode) {
      setAccessToken(null);
      setIdTokenClaims(null);
      return;
    }

    try {
      await instance.logoutRedirect();
    } catch (err) {
      setError(err as Error);
      console.error('[useAuth] Logout failed:', err);
      throw err;
    }
  }, [instance]);

  // Get token action (with optional force refresh)
  const getToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    if (isDemoMode) {
      return 'demo-mode-token';
    }

    if (!account) {
      console.warn('[useAuth] No account available for token acquisition');
      return null;
    }

    try {
      const result = await instance.acquireTokenSilent({
        account,
        scopes: apiScopes,
        forceRefresh,
      });
      setAccessToken(result.accessToken);
      setIdTokenClaims(result.idTokenClaims as IdTokenClaims);
      return result.accessToken;
    } catch (err) {
      console.error('[useAuth] Token acquisition failed:', err);
      // Try interactive login as fallback
      try {
        await instance.loginRedirect(loginRequest);
        return null;
      } catch (loginErr) {
        setError(loginErr as Error);
        throw loginErr;
      }
    }
  }, [instance, account]);

  // Compute authentication status
  const isAuthenticated = isDemoMode ? !!accessToken : !!account && !!accessToken;
  const isLoading = !isDemoMode && inProgress !== InteractionStatus.None;

  return {
    isAuthenticated,
    isLoading,
    accessToken,
    account,
    idTokenClaims,
    inProgress,
    error,
    login,
    logout,
    getToken,
  };
}

/**
 * Hook to get just the access token (simpler API for API calls)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { accessToken } = useAccessToken();
 *   
 *   useEffect(() => {
 *     if (accessToken) {
 *       fetch('/api/data', {
 *         headers: { Authorization: `Bearer ${accessToken}` }
 *       });
 *     }
 *   }, [accessToken]);
 * }
 * ```
 */
export function useAccessToken() {
  const { accessToken, account, idTokenClaims, inProgress, isLoading } = useAuth();
  
  return {
    accessToken,
    account,
    idTokenClaims,
    inProgress,
    isLoading,
  };
}
