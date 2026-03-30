import type { Metadata, Viewport } from 'next'
import { Geist_Mono } from 'next/font/google'
import { Instrument_Serif } from 'next/font/google'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { AmbientBackground } from '@/components/layout/ambient-background'
import { SearchOverlay } from '@/components/search/search-overlay'
import { KeyboardNav } from '@/components/stream/keyboard-nav'
import { RecordButton } from '@/components/recording/record-button'
import { NativeInit } from '@/components/layout/native-init'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  variable: '--font-serif',
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'PALACE',
    template: '%s | PALACE',
  },
  description: 'Personal AI Life Archive & Cognitive Explorer',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PALACE',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">
        <AmbientBackground />
        <Sidebar />
        <SearchOverlay />
        <KeyboardNav />

        {/* Main content — offset for sidebar on desktop */}
        <main className="min-h-screen pb-20 md:pl-14 md:pb-0">
          {children}
        </main>

        <MobileNav />
        <RecordButton />
        <NativeInit />
      </body>
    </html>
  )
}
