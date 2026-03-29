'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'

const ICONS: Record<string, React.ReactNode> = {
  stream: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4h14M3 8h10M3 12h14M3 16h8" strokeLinecap="round" />
    </svg>
  ),
  memories: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 4h12M4 8h8M4 12h10M4 16h6" />
      <circle cx="16" cy="12" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  search: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="5" />
      <path d="M13 13l4 4" strokeLinecap="round" />
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
  people: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="6" r="2.5" />
      <path d="M2 16c0-2.5 2-4.5 5-4.5s5 2 5 4.5" />
      <circle cx="14" cy="7" r="2" />
      <path d="M14 11c2.5 0 4 1.5 4 3.5" strokeLinecap="round" />
    </svg>
  ),
  insights: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 2v3M10 15v3M2 10h3M15 10h3" strokeLinecap="round" />
      <circle cx="10" cy="10" r="4" />
    </svg>
  ),
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg
                transition-colors duration-200
                ${isActive ? 'text-accent' : 'text-sub'}
              `}
            >
              {ICONS[item.icon]}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
