'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/stores/app-store'

// Mobile: 5 tabs, Marlin first
const MOBILE_NAV = [
  { id: 'marlin', label: 'Marlin', href: '/', icon: 'voice' },
  { id: 'timeline', label: 'Timeline', href: '/timeline', icon: 'stream' },
  { id: 'people', label: 'People', href: '/people', icon: 'people' },
  { id: 'memories', label: 'Memories', href: '/memories', icon: 'memories' },
  { id: 'search', label: 'Search', href: '/search', icon: 'search' },
] as const

const ICONS: Record<string, React.ReactNode> = {
  stream: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 4h14M3 8h10M3 12h14M3 16h8" />
    </svg>
  ),
  people: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="6" r="2.5" />
      <path d="M2 16c0-2.5 2-4.5 5-4.5s5 2 5 4.5" />
      <circle cx="14" cy="7" r="2" />
      <path d="M14 11c2.5 0 4 1.5 4 3.5" strokeLinecap="round" />
    </svg>
  ),
  memories: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M3 7h14M7 3v14" />
    </svg>
  ),
  search: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="9" r="5" />
      <path d="M13 13l4 4" />
    </svg>
  ),
  graph: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="5" r="2" />
      <circle cx="5" cy="15" r="2" />
      <circle cx="15" cy="15" r="2" />
      <path d="M10 7v2M8.5 11l-2 2M11.5 11l2 2" />
    </svg>
  ),
  insights: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M10 2v3M10 15v3M2 10h3M15 10h3" />
      <circle cx="10" cy="10" r="4" />
    </svg>
  ),
  ask: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7l-4 3V5z" />
      <path d="M10 7v.5M10 10.5h.01" strokeWidth="2" />
    </svg>
  ),
  voice: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10c2-3 5-5 9-5 2 0 3.5.8 4.5 2l2 1.5-2 1.5c-1 1.2-2.5 2-4.5 2-4 0-7-2-9-5z" />
      <path d="M11 5c.5-1.5 1.5-2.5 2.5-3" />
      <circle cx="14" cy="9" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
}

export function MobileNav() {
  const pathname = usePathname()
  const { theme, cycleTheme } = useAppStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 glass-heavy md:hidden">
      <div className="flex items-center justify-around px-1">
        {MOBILE_NAV.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg
                transition-colors duration-200
                ${isActive ? 'text-accent' : 'text-muted'}
              `}
            >
              {ICONS[item.icon]}
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          )
        })}
        {/* Theme toggle removed — use the toggle in top-right corner instead */}
      </div>
      {/* Safe area for iOS notch/home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
