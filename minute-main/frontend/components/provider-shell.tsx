"use client"

import { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { OrgThemeSetter } from '@/components/org-theme-setter'
import { TanstackQueryProvider } from '@/providers/TanstackQueryProvider'
import PosthogProvider from '@/providers/posthog'
import { LockNavigationProvider } from '@/hooks/use-lock-navigation-context'
import { RecordingDbProvider } from '@/providers/transcription-db-provider'
import { CaseCacheProvider } from '@/providers/case-cache-provider'
import { ApiProvider } from '@/providers/ApiProvider'
import { useAccessToken } from '@/hooks/use-access-token'
import { DevPreviewProvider } from '@/lib/dev-preview-provider'
import { ResilienceProvider } from '@/providers/ResilienceProvider'
import { PersonaProvider } from '@/providers/PersonaProvider'

export const ProviderShell = ({ children }: { children: ReactNode }) => {
  const { accessToken } = useAccessToken()

  return (
    <ThemeProvider attribute="class" defaultTheme="theme-wcc" themes={['theme-wcc', 'theme-rbkc']}>
      <OrgThemeSetter />
      <ApiProvider token={accessToken}>
        <TanstackQueryProvider>
          <ResilienceProvider token={accessToken}>
            <PersonaProvider>
              <PosthogProvider>
                <LockNavigationProvider>
                  <RecordingDbProvider>
                    <CaseCacheProvider>
                      <DevPreviewProvider>
                        {children}
                      </DevPreviewProvider>
                    </CaseCacheProvider>
                  </RecordingDbProvider>
                </LockNavigationProvider>
              </PosthogProvider>
            </PersonaProvider>
          </ResilienceProvider>
        </TanstackQueryProvider>
      </ApiProvider>
    </ThemeProvider>
  )
}
