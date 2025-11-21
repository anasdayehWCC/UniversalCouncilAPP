import { Configuration, LogLevel } from '@azure/msal-browser'

const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID || ''
const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || ''
const defaultRedirect =
  process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

export const apiScopes = (
  process.env.NEXT_PUBLIC_AZURE_API_SCOPE ||
  (clientId ? `api://${clientId}/.default` : 'user.read')
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: tenantId ? `https://login.microsoftonline.com/${tenantId}` : undefined,
    redirectUri: defaultRedirect,
    postLogoutRedirectUri: defaultRedirect,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
  system: {
    loggerOptions: {
      loggerCallback: () => undefined,
      piiLoggingEnabled: false,
      logLevel: LogLevel.Warning,
    },
  },
}

export const isDevPreviewEnabled =
  process.env.NEXT_PUBLIC_DEV_PREVIEW_MODE === 'true' ||
  process.env.NEXT_PUBLIC_DEV_PREVIEW_MODE === '1'
