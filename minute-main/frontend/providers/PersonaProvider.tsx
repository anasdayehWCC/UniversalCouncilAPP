'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAccessToken } from '@/hooks/use-access-token'

type Persona = 'social_worker' | 'manager'

type PersonaContextValue = {
  persona: Persona
  setPersona: (p: Persona) => void
}

const PersonaContext = createContext<PersonaContextValue | null>(null)

const STORAGE_KEY = 'careminutes.persona'

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const { idTokenClaims } = useAccessToken()
  const [persona, setPersonaState] = useState<Persona>('social_worker')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Persona | null
    if (stored === 'social_worker' || stored === 'manager') {
      setPersonaState(stored)
    }
  }, [])

  useEffect(() => {
    if (!idTokenClaims) return
    const roles: string[] = idTokenClaims.roles || idTokenClaims.role || []
    if (Array.isArray(roles) && roles.some((r) => r.toLowerCase().includes('manager'))) {
      setPersonaState((prev) => prev ?? 'manager')
    }
  }, [idTokenClaims])

  const setPersona = (p: Persona) => {
    setPersonaState(p)
    window.localStorage.setItem(STORAGE_KEY, p)
  }

  const value = useMemo<PersonaContextValue>(
    () => ({
      persona,
      setPersona,
    }),
    [persona],
  )

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>
}

export function usePersona() {
  const ctx = useContext(PersonaContext)
  if (!ctx) throw new Error('usePersona must be used within PersonaProvider')
  return ctx
}
