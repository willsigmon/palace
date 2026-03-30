'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/stores/app-store'
import { NAV_ITEMS } from '@/lib/constants'
import { ApiStatus } from './api-status'

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
  const { sidebarExpanded, toggleSidebar } = useAppStore()

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
      {/* Logo */}
      <button
        onClick={toggleSidebar}
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
      </nav>

      {/* Footer with API status */}
      <div className="border-t border-border/30 px-3 py-2.5">
        <ApiStatus expanded={sidebarExpanded} />
      </div>
    </aside>
  )
}
