"use client"

import { ReactNode, useEffect } from 'react'
import { MsalProvider } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig, apiScopes } from '@/lib/auth/msalConfig'
import { AuthGate } from '@/components/auth/AuthGate'

// Create a singleton MSAL instance
const msalInstance = new PublicClientApplication(msalConfig)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    let lastActive = Date.now()
    const reset = () => {
      lastActive = Date.now()
    }
    const interval = setInterval(async () => {
      if (Date.now() - lastActive > 30 * 60 * 1000) {
        try {
          await msalInstance.acquireTokenSilent({ scopes: apiScopes })
          lastActive = Date.now()
        } catch (e) {
          console.warn('Idle timeout - forcing re-auth', e)
          msalInstance.logoutRedirect()
        }
      }
    }, 5 * 60 * 1000)
    window.addEventListener('mousemove', reset)
    window.addEventListener('keydown', reset)
    return () => {
      clearInterval(interval)
      window.removeEventListener('mousemove', reset)
      window.removeEventListener('keydown', reset)
    }
  }, [])

  return (
    <MsalProvider instance={msalInstance}>
      <AuthGate scopes={apiScopes}>{children}</AuthGate>
    </MsalProvider>
  )
}
