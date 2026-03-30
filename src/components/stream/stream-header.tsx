'use client'

import { useAppStore } from '@/stores/app-store'
import { formatNumber } from '@/lib/format'
import type { StatsResponse } from '@/types/api'

interface StreamHeaderProps {
  readonly stats: StatsResponse | null
}

const CATEGORY_FILTERS = [
  { value: '', label: 'All' },
  { value: 'family', label: 'Family', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  { value: 'work', label: 'Work', color: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
  { value: 'music', label: 'Music', color: 'bg-purple-400/15 text-purple-400 border-purple-400/20' },
  { value: 'technology', label: 'Tech', color: 'bg-cyan-400/15 text-cyan-400 border-cyan-400/20' },
  { value: 'personal', label: 'Personal', color: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
  { value: 'health', label: 'Health', color: 'bg-rose-400/15 text-rose-400 border-rose-400/20' },
  { value: 'social', label: 'Social', color: 'bg-pink-400/15 text-pink-400 border-pink-400/20' },
] as const

export function StreamHeader({ stats }: StreamHeaderProps) {
  const { openSearch, filters, setFilter } = useAppStore()
  const activeCategory = filters.category

  return (
    <header className="mb-8">
      {/* Title + subtitle */}
      <div className="mb-5">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-4xl)] italic text-text leading-tight">
          The Stream
        </h1>
        <p className="mt-1.5 text-sm text-sub">
          Your conversations, searchable and connected.
        </p>
      </div>

      {/* Search bar */}
      <button
        onClick={openSearch}
        className="group flex w-full items-center gap-3 rounded-xl border border-border/40 bg-surface/30 px-5 py-3.5 text-sm text-muted transition-all duration-250 hover:border-accent/30 hover:bg-surface/50 hover:shadow-[0_0_20px_var(--color-glow)]"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted group-hover:text-accent transition-colors">
          <circle cx="9" cy="9" r="5" />
          <path d="M13 13l4 4" strokeLinecap="round" />
        </svg>
        <span className="group-hover:text-sub transition-colors">Search your memories...</span>
        <span className="flex-1" />
        <kbd className="hidden rounded-md border border-border/60 bg-elevated/40 px-2 py-0.5 text-[10px] text-muted sm:inline">
          <span className="text-[9px]">&#8984;</span>K
        </kbd>
      </button>

      {/* Filter pills */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {CATEGORY_FILTERS.map((f) => {
          const isActive = activeCategory === (f.value || null)
          return (
            <button
              key={f.value}
              onClick={() => setFilter('category', f.value || null)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                isActive
                  ? f.value
                    ? f.color
                    : 'bg-accent/15 text-accent border-accent/20'
                  : 'border-transparent text-muted/60 hover:text-muted hover:bg-surface/40'
              }`}
            >
              {f.label}
            </button>
          )
        })}

        {/* Stats — inline after filters */}
        {stats && (
          <span className="ml-auto text-[10px] text-muted/40 font-[family-name:var(--font-mono)] hidden sm:inline">
            {formatNumber(stats.conversations)} conversations
          </span>
        )}
      </div>
    </header>
  )
}
