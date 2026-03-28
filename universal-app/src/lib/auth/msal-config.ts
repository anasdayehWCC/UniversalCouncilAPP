import { Configuration, LogLevel } from '@azure/msal-browser';

/**
 * Azure Entra ID (formerly Azure AD) configuration for MSAL
 * 
 * Environment variables:
 * - NEXT_PUBLIC_AZURE_TENANT_ID: Your Azure tenant ID
 * - NEXT_PUBLIC_AZURE_CLIENT_ID: Your app registration client ID
 * - NEXT_PUBLIC_AZURE_REDIRECT_URI: OAuth redirect URI (defaults to window.location.origin)
 * - NEXT_PUBLIC_AZURE_API_SCOPE: API scopes (comma-separated, defaults to api://{clientId}/.default)
 * - NEXT_PUBLIC_DEMO_MODE: Set to 'true' to enable demo mode (bypasses Azure auth)
 */

const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID || '';
const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '';
const defaultRedirect =
  process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

/**
 * API scopes required for token acquisition
 * Defaults to the .default scope if only client ID is provided
 */
export const apiScopes = (
  process.env.NEXT_PUBLIC_AZURE_API_SCOPE ||
  (clientId ? `api://${clientId}/.default` : 'user.read')
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * MSAL configuration object
 * @see https://learn.microsoft.com/en-us/entra/identity-platform/msal-js-initializing-client-applications
 */
export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: tenantId ? `https://login.microsoftonline.com/${tenantId}` : undefined,
    redirectUri: defaultRedirect,
    postLogoutRedirectUri: defaultRedirect,
    // Required for single-page app scenarios
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true, // Required for IE11/Edge
    secureCookies: process.env.NODE_ENV === 'production',
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return; // Never log PII
        if (process.env.NODE_ENV === 'development') {
          switch (level) {
            case LogLevel.Error:
              console.error('[MSAL]', message);
              break;
            case LogLevel.Warning:
              console.warn('[MSAL]', message);
              break;
            case LogLevel.Info:
              console.info('[MSAL]', message);
              break;
            case LogLevel.Verbose:
              console.debug('[MSAL]', message);
              break;
          }
        }
      },
      piiLoggingEnabled: false,
      logLevel: process.env.NODE_ENV === 'development' ? LogLevel.Warning : LogLevel.Error,
    },
    // Allow async operations to complete
    allowNativeBroker: false,
  },
};

/**
 * Demo mode flag - when true, auth is bypassed and mock tokens are used
 * Enable via NEXT_PUBLIC_DEMO_MODE=true in .env.local
 */
export const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
  process.env.NEXT_PUBLIC_DEMO_MODE === '1' ||
  // Also support the legacy env var name for backwards compatibility
  process.env.NEXT_PUBLIC_DEV_PREVIEW_MODE === 'true' ||
  process.env.NEXT_PUBLIC_DEV_PREVIEW_MODE === '1';

/**
 * Login request configuration
 */
export const loginRequest = {
  scopes: apiScopes,
};

/**
 * Token request configuration for silent token acquisition
 */
export const tokenRequest = {
  scopes: apiScopes,
  forceRefresh: false,
};

/**
 * Idle timeout in milliseconds (30 minutes)
 * After this period of inactivity, the session will be refreshed or user re-authenticated
 */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Token refresh interval in milliseconds (5 minutes)
 * How often to check if token needs refreshing
 */
export const TOKEN_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
