"use client"

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useOrgTheme } from '@/hooks/use-org-theme'

export const OrgThemeSetter = () => {
  const { setTheme } = useTheme()
  const orgTheme = useOrgTheme()

  useEffect(() => {
    setTheme(orgTheme)
  }, [orgTheme, setTheme])

  return null
}
