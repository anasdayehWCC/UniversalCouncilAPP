"use client"

import { ReactNode, useEffect, useState } from 'react'
import { InteractionStatus } from '@azure/msal-browser'
import { useMsal } from '@azure/msal-react'
import { apiScopes, isDevPreviewEnabled } from '@/lib/auth/msalConfig'
import { useAccessToken } from '@/hooks/use-access-token'

export const AuthGate = ({ children }: { children: ReactNode; scopes?: string[] }) => {
  const { instance, inProgress, accounts } = useMsal()
  const { accessToken } = useAccessToken()
  const [hasStartedLogin, setHasStartedLogin] = useState(false)

  useEffect(() => {
    if (isDevPreviewEnabled) return
    if (inProgress !== InteractionStatus.None) return
    if (accounts.length > 0 || hasStartedLogin) return
    setHasStartedLogin(true)
    instance.loginRedirect({ scopes: apiScopes })
  }, [accounts.length, inProgress, instance, hasStartedLogin])

  if (!isDevPreviewEnabled && !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 text-sm text-foreground">
        Signing you in with Microsoft Entra...
      </div>
    )
  }

  return <>{children}</>
}
