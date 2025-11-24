"use client"

import { useMemo } from 'react'
import { useAccessToken } from './use-access-token'

const themeMap: Record<string, string> = {
  wcc: 'theme-wcc',
  rbkc: 'theme-rbkc',
}

export const useOrgTheme = () => {
  const { idTokenClaims } = useAccessToken()

  const claimOrg = (idTokenClaims as any)?.organisation_id || (idTokenClaims as any)?.org || null
  const stored =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('preferred_org_theme')
      : null

  return useMemo(() => {
    if (stored && themeMap[stored]) return themeMap[stored]
    if (claimOrg && themeMap[claimOrg]) return themeMap[claimOrg]
    const envDefault = process.env.NEXT_PUBLIC_DEFAULT_ORG_THEME ?? 'wcc'
    return themeMap[envDefault] || 'theme-wcc'
  }, [claimOrg, stored])
}
