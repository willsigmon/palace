'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/stores/app-store'
import { NAV_ITEMS } from '@/lib/constants'

const ICONS: Record<string, React.ReactNode> = {
  stream: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4h14M3 8h10M3 12h14M3 16h8" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="5" />
      <path d="M13 13l4 4" strokeLinecap="round" />
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
  people: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="6" r="2.5" />
      <path d="M2 16c0-2.5 2-4.5 5-4.5s5 2 5 4.5" />
      <circle cx="14" cy="7" r="2" />
      <path d="M14 11c2.5 0 4 1.5 4 3.5" strokeLinecap="round" />
    </svg>
  ),
  insights: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 2v3M10 15v3M2 10h3M15 10h3" strokeLinecap="round" />
      <circle cx="10" cy="10" r="4" />
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
        border-r border-border bg-void
        transition-all duration-300
        md:flex
        ${sidebarExpanded ? 'w-52' : 'w-16'}
      `}
    >
      {/* Logo */}
      <button
        onClick={toggleSidebar}
        className="flex h-16 items-center justify-center border-b border-border"
        aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <span className="gradient-text text-lg font-bold tracking-tight font-[family-name:var(--font-serif)]">
          {sidebarExpanded ? 'PALACE' : 'P'}
        </span>
      </button>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-lg px-3 py-2.5
                transition-colors duration-200
                ${isActive
                  ? 'bg-elevated text-text'
                  : 'text-sub hover:bg-surface hover:text-text'
                }
              `}
              title={item.label}
            >
              <span className={`shrink-0 ${isActive ? 'text-accent' : ''}`}>
                {ICONS[item.icon]}
              </span>
              {sidebarExpanded && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Stats footer (collapsed: hidden, expanded: show) */}
      {sidebarExpanded && (
        <div className="border-t border-border p-3">
          <p className="text-xs text-muted">
            Personal AI Life Archive
          </p>
        </div>
      )}
    </aside>
  )
}
