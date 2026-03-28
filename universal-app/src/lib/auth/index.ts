/**
 * Authentication module exports
 * 
 * This module provides Azure Entra ID (MSAL) authentication for the Universal Council App.
 * 
 * @example
 * ```tsx
 * import { AuthProvider, useAuth, AuthGate } from '@/lib/auth';
 * 
 * // In your root layout
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * // In your components
 * const { isAuthenticated, login, logout } = useAuth();
 * ```
 */

// Configuration
export {
  msalConfig,
  apiScopes,
  isDemoMode,
  loginRequest,
  tokenRequest,
  IDLE_TIMEOUT_MS,
  TOKEN_REFRESH_INTERVAL_MS,
} from './msal-config';

// Re-export types but note that hooks and components should be imported from their modules
// to avoid client/server boundary issues

/**
 * Import hooks from '@/hooks/useAuth':
 * - useAuth: Full auth state and actions
 * - useAccessToken: Simplified token access
 * 
 * Import provider from '@/providers/AuthProvider':
 * - AuthProvider: Root auth provider component
 * 
 * Import gate from '@/components/AuthGate':
 * - AuthGate: Route protection component
 * - withAuthGate: HOC for route protection
 */
