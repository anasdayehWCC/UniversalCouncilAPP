import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { OfflineIndicator } from '@/components/offline-indicator'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { ProviderShell } from '@/components/provider-shell'
import { AuthProvider } from '@/providers/AuthProvider'
import { ServiceWorkerRegistration } from '@/components/service-worker-registration'
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} theme-wcc`}>
      <body>
        <AuthProvider>
          <ProviderShell>
            <div className="flex min-h-screen flex-col justify-between bg-page">
              <div>
                <Header userTemplatesEnabled={true} />
                <main className="px-4 pb-8 sm:px-8">
                  {children}
                </main>
              </div>
              <Footer />
            </div>
            <ServiceWorkerRegistration />
            <OfflineIndicator />
            <Toaster />
          </ProviderShell>
        </AuthProvider>
      </body>
    </html>
  )
}
