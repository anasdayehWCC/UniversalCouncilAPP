import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { LockNavigationProvider } from '@/hooks/use-lock-navigation-context'
import { TanstackQueryProvider } from '@/providers/TanstackQueryProvider'
import PosthogProvider from '@/providers/posthog'
import { RecordingDbProvider } from '@/providers/transcription-db-provider'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { OfflineIndicator } from '@/components/offline-indicator'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Minute',
  description: 'Minutes and transcriptions',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CareMinutes',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="theme-wcc"
          themes={['theme-wcc', 'theme-rbkc']}
        >
          <TanstackQueryProvider>
            <PosthogProvider>
              <LockNavigationProvider>
                <RecordingDbProvider>
                  <div className="flex min-h-screen flex-col justify-between">
                    <div>
                      <Header />
                      <main>{children}</main>
                    </div>
                    <Footer />
                  </div>
                  <OfflineIndicator />
                  <Toaster />
                </RecordingDbProvider>
              </LockNavigationProvider>
            </PosthogProvider>
          </TanstackQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
