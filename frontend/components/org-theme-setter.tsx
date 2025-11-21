"use client"

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useOrgTheme } from '@/hooks/use-org-theme'
import { applyThemeTokens } from '@/lib/theme/tokens.mjs'

export const OrgThemeSetter = () => {
  const { setTheme } = useTheme()
  const orgTheme = useOrgTheme()

  useEffect(() => {
    setTheme(orgTheme)
    applyThemeTokens(orgTheme as any)
  }, [orgTheme, setTheme])

  return null
}
