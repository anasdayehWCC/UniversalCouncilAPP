"use client"

import { useEffect, useMemo, useState } from 'react'
import { InteractionStatus, SilentRequest } from '@azure/msal-browser'
import { useAccount, useMsal } from '@azure/msal-react'
import { apiScopes, isDevPreviewEnabled } from '@/lib/auth/msalConfig'

export const useAccessToken = () => {
  const { instance, inProgress, accounts } = useMsal()
  const account = useAccount(accounts[0] || null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [idTokenClaims, setIdTokenClaims] = useState<any>(null)

  const request: SilentRequest | null = useMemo(() => {
    if (!account) return null
    return {
      account,
      scopes: apiScopes,
    }
  }, [account])

  useEffect(() => {
    if (isDevPreviewEnabled) {
      setAccessToken('dev-preview-token')
      setIdTokenClaims({
        organisation_id: process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? 'wcc',
      })
      return
    }

    if (!request || inProgress !== InteractionStatus.None) return

    instance
      .acquireTokenSilent(request)
      .then((result) => {
        setAccessToken(result.accessToken)
        setIdTokenClaims(result.idTokenClaims)
      })
      .catch((error) => {
        if (error.errorCode === 'no_tokens_found' || error.errorCode === 'user_login_error') {
          instance.loginRedirect({ scopes: apiScopes })
        }
      })
  }, [instance, request, inProgress])

  return { accessToken, account, idTokenClaims, inProgress }
}
