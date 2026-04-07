import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { BandProvider } from '@/contexts/BandContext'
import { LocationsProvider } from '@/contexts/LocationsContext'
import { SongsProvider } from '@/contexts/SongsContext'
import { RehearsalProvider } from '@/contexts/RehearsalContext'
import { ToastProvider } from '@/components/Toast'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Repertoire - Grup Müzik Yöneticisi',
  description: 'Grubunuzun repertuvarını yönetin, şarkıları oylayın ve prova planlayın.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Repertoire',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f0f23',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={`${geist.variable} h-full antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <BandProvider>
            <LocationsProvider>
              <SongsProvider>
                <RehearsalProvider>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </RehearsalProvider>
              </SongsProvider>
            </LocationsProvider>
          </BandProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
