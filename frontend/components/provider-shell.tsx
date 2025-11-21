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

export const ProviderShell = ({ children }: { children: ReactNode }) => {
  const { accessToken } = useAccessToken()

  return (
    <ThemeProvider attribute="class" defaultTheme="theme-wcc" themes={['theme-wcc', 'theme-rbkc']}>
      <OrgThemeSetter />
      <ApiProvider token={accessToken}>
        <TanstackQueryProvider>
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
        </TanstackQueryProvider>
      </ApiProvider>
    </ThemeProvider>
  )
}
