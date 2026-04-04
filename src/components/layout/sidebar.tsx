'use client'

import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/stores/app-store'
import { NAV_ITEMS } from '@/lib/constants'
import { ApiStatus } from './api-status'

const THEME_ICONS = {
  dark: (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M17.5 10.5a7.5 7.5 0 0 1-10-10 7.5 7.5 0 1 0 10 10z" />
    </svg>
  ),
  light: (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="10" cy="10" r="4" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" />
    </svg>
  ),
  system: (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="14" height="10" rx="2" />
      <path d="M7 17h6" />
    </svg>
  ),
} as const

function ThemeToggle({ expanded }: { expanded: boolean }) {
  const { theme, cycleTheme } = useAppStore()
  const label = theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'

  return (
    <button
      onClick={cycleTheme}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-muted transition-colors hover:bg-surface/40 hover:text-sub"
      title={`Theme: ${label}`}
    >
      <span className="shrink-0">{THEME_ICONS[theme]}</span>
      {expanded && <span className="text-[11px] font-medium">{label}</span>}
    </button>
  )
}

const ICONS: Record<string, React.ReactNode> = {
  stream: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 4h14M3 8h10M3 12h14M3 16h8" />
    </svg>
  ),
  people: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="6" r="2.5" />
      <path d="M2 16c0-2.5 2-4.5 5-4.5s5 2 5 4.5" />
      <circle cx="14" cy="7" r="2" />
      <path d="M14 11c2.5 0 4 1.5 4 3.5" strokeLinecap="round" />
    </svg>
  ),
  memories: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 4h12M4 8h8M4 12h10M4 16h6" />
      <circle cx="16" cy="12" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="9" r="5" />
      <path d="M13 13l4 4" />
    </svg>
  ),
  graph: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="5" r="2" />
      <circle cx="5" cy="15" r="2" />
      <circle cx="15" cy="15" r="2" />
      <path d="M10 7v2M8.5 11l-2 2M11.5 11l2 2" />
    </svg>
  ),
  insights: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M10 2v3M10 15v3M2 10h3M15 10h3" />
      <circle cx="10" cy="10" r="4" />
    </svg>
  ),
  ask: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7l-4 3V5z" />
      <path d="M10 7v.5M10 10.5h.01" strokeWidth="2" />
    </svg>
  ),
  verticals: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="13" width="14" height="3" rx="1" />
      <rect x="3" y="8.5" width="11" height="3" rx="1" />
      <rect x="3" y="4" width="8" height="3" rx="1" />
    </svg>
  ),
  media: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7" />
      <path d="M8.5 7.5l5 2.5-5 2.5V7.5z" fill="currentColor" stroke="none" />
    </svg>
  ),
  locations: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17s-6-4.35-6-8.5a6 6 0 1 1 12 0C16 12.65 10 17 10 17z" />
      <circle cx="10" cy="8.5" r="2" />
    </svg>
  ),
  actions: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="5" height="5" rx="1" />
      <path d="M9 6.5h7M9 13.5h7" />
      <path d="M4 11.5l1.5 1.5L8 10" />
    </svg>
  ),
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarExpanded, toggleSidebar, initTheme } = useAppStore()
  const vaultDiscovered = useRef(false)

  // Initialize theme on mount (reads localStorage, sets up system listener)
  useEffect(() => {
    const cleanup = initTheme()
    // Check if vault was previously discovered
    vaultDiscovered.current = localStorage.getItem('palace-vault-discovered') === 'true'
    return cleanup
  }, [initTheme])

  // Triple-click detection for vault easter egg
  const clickTimesRef = useRef<number[]>([])
  const handleLogoClick = useCallback(() => {
    const now = Date.now()
    clickTimesRef.current = [...clickTimesRef.current.filter((t) => now - t < 600), now]

    if (clickTimesRef.current.length >= 3) {
      clickTimesRef.current = []
      localStorage.setItem('palace-vault-discovered', 'true')
      vaultDiscovered.current = true
      router.push('/vault')
      return
    }

    toggleSidebar()
  }, [toggleSidebar, router])

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 hidden h-full flex-col
        border-r border-border/40 bg-void/95 backdrop-blur-sm
        transition-all duration-300
        md:flex
        ${sidebarExpanded ? 'w-52' : 'w-14'}
      `}
    >
      {/* Logo — triple-click opens The Vault */}
      <button
        onClick={handleLogoClick}
        className="flex h-14 items-center justify-center border-b border-border/30 transition-colors hover:bg-surface/30"
        aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <span className="gradient-text text-xl font-bold tracking-tight font-[family-name:var(--font-serif)] italic">
          {sidebarExpanded ? 'PALACE' : 'P'}
        </span>
      </button>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-1.5 pt-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                group relative flex items-center gap-3 rounded-lg px-2.5 py-2
                transition-all duration-200
                ${isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:bg-surface/40 hover:text-sub'
                }
              `}
              title={item.label}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute -left-1.5 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
              )}
              <span className="shrink-0">
                {ICONS[item.icon]}
              </span>
              {sidebarExpanded && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          )
        })}

        {/* Ghost vault link — appears after discovery */}
        {vaultDiscovered.current && (
          <Link
            href="/vault"
            className={`
              group relative flex items-center gap-3 rounded-lg px-2.5 py-2
              transition-all duration-200 mt-1
              ${pathname === '/vault'
                ? 'bg-accent/10 text-accent'
                : 'text-muted/25 hover:text-muted/50 hover:bg-surface/20'
              }
            `}
            title="The Vault"
          >
            {pathname === '/vault' && (
              <div className="absolute -left-1.5 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
            )}
            <span className="shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="14" height="14" rx="2" />
                <circle cx="10" cy="10" r="2" />
                <path d="M10 8v-2M10 14v-2" />
              </svg>
            </span>
            {sidebarExpanded && (
              <span className="text-sm font-medium font-[family-name:var(--font-serif)] italic">The Vault</span>
            )}
          </Link>
        )}
      </nav>

      {/* Footer with theme toggle + API status */}
      <div className="border-t border-border/30 px-3 py-2.5 space-y-2">
        <ThemeToggle expanded={sidebarExpanded} />
        <ApiStatus expanded={sidebarExpanded} />
      </div>
    </aside>
  )
}
