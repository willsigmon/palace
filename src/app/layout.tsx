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
import { KeyboardHelp } from '@/components/ui/keyboard-help'
import { ToastContainer } from '@/components/ui/toast'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { WormholeButton } from '@/components/ui/wormhole-button'

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
  icons: {
    icon: '/favicon.png',
    apple: '/icon-192.png',
  },
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
      suppressHydrationWarning
    >
      <head>
        {/* Flash-prevention: apply theme class before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('palace-theme');var r=t==='light'?'light':t==='system'&&window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';if(r==='light')document.documentElement.classList.add('light');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',r==='light'?'#f5f0e8':'#1a1a2e')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full">
        <AmbientBackground />
        <Sidebar />
        <SearchOverlay />
        <KeyboardNav />
        <ThemeToggle />

        {/* Main content — offset for sidebar on desktop */}
        <main className="min-h-screen pb-20 md:pl-14 md:pb-0">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>

        <MobileNav />
        <WormholeButton />
        <RecordButton />
        <NativeInit />
        <KeyboardHelp />
        <ToastContainer />
      </body>
    </html>
  )
}
