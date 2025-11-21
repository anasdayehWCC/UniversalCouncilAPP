"use client"

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useOrgTheme } from '@/hooks/use-org-theme'
import { applyThemeTokens, type ThemeId } from '@/lib/theme/tokens.mjs'

export const OrgThemeSetter = () => {
  const { setTheme } = useTheme()
  const orgTheme = useOrgTheme()

  useEffect(() => {
    setTheme(orgTheme)
    applyThemeTokens(orgTheme as ThemeId)
  }, [orgTheme, setTheme])

  return null
}
