import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { OfflineIndicator } from '@/components/offline-indicator'
import { ProviderShell } from '@/components/provider-shell'
import { AuthProvider } from '@/providers/AuthProvider'
import { AppShell } from '@/components/layout/app-shell'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CareMinutes',
  description: 'Social Care Transcription & Minutes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CareMinutes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#004B65',
}



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.className} theme-wcc`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ProviderShell>
          <AuthProvider>
            <AppShell>
              {children}
            </AppShell>
            <OfflineIndicator />
            <Toaster />
          </AuthProvider>
        </ProviderShell>
      </body>
    </html>
  )
}
