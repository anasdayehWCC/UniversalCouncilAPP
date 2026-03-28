"use client"

import { useMemo, useCallback, useEffect, useState } from 'react'
import { useAccessToken } from './use-access-token'

// Static theme map for fallback
const themeMap: Record<string, string> = {
  wcc: 'theme-wcc',
  rbkc: 'theme-rbkc',
}

// Theme token types matching backend
interface ThemeColors {
  background: string
  surface: string
  surfaceAlt: string
  text: string
  textMuted: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  success: string
  warning: string
  error: string
  border: string
}

interface ThemeTokens {
  id: string
  name: string
  colors: ThemeColors
  typography: {
    fontFamily: string
    baseFontSize: number
    scale: number[]
  }
  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    xxl: number
  }
  radius: {
    sm: number
    md: number
    lg: number
    xl: number
  }
  shadows: {
    sm: string
    md: string
    lg: string
  }
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

/**
 * Hook to fetch and apply theme tokens from the API
 */
export const useThemeTokens = (tenant?: string, dark = false) => {
  const [tokens, setTokens] = useState<ThemeTokens | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (tenant) params.set('tenant', tenant)
        if (dark) params.set('dark', 'true')
        
        const res = await fetch(`/api/proxy/theme?${params}`)
        if (!res.ok) throw new Error('Failed to fetch theme')
        
        const data = await res.json()
        setTokens(data)
        setError(null)
      } catch (err: any) {
        setError(err.message)
        setTokens(null)
      } finally {
        setLoading(false)
      }
    }

    fetchTheme()
  }, [tenant, dark])

  const applyTheme = useCallback(() => {
    if (!tokens) return
    
    const root = document.documentElement
    
    // Apply color tokens as CSS custom properties
    Object.entries(tokens.colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      root.style.setProperty(cssVar, value)
    })
    
    // Apply spacing
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, `${value}px`)
    })
    
    // Apply radius
    Object.entries(tokens.radius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, `${value}px`)
    })
    
    // Apply shadows
    Object.entries(tokens.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value)
    })
    
    // Apply typography
    root.style.setProperty('--font-family', tokens.typography.fontFamily)
    root.style.setProperty('--base-font-size', `${tokens.typography.baseFontSize}px`)
    
    // Set data attribute for CSS selectors
    root.setAttribute('data-theme', tokens.id)
  }, [tokens])

  return { tokens, loading, error, applyTheme }
}

/**
 * Provider-style hook that auto-applies theme on mount
 */
export const useAutoApplyTheme = (tenant?: string) => {
  const { idTokenClaims } = useAccessToken()
  const claimTenant = (idTokenClaims as any)?.tenant_id || tenant
  
  const prefersDark = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }, [])
  
  const { tokens, loading, error, applyTheme } = useThemeTokens(claimTenant, prefersDark)
  
  useEffect(() => {
    if (tokens && !loading) {
      applyTheme()
    }
  }, [tokens, loading, applyTheme])

  return { tokens, loading, error }
}
