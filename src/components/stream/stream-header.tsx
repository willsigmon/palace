'use client'

import { useAppStore } from '@/stores/app-store'
import { formatNumber } from '@/lib/format'
import type { StatsResponse } from '@/types/api'

interface StreamHeaderProps {
  readonly stats: StatsResponse | null
}

export function StreamHeader({ stats }: StreamHeaderProps) {
  const { openSearch } = useAppStore()

  return (
    <header className="mb-10">
      {/* Title + subtitle */}
      <div className="mb-5">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-4xl)] italic text-text leading-tight">
          The Stream
        </h1>
        <p className="mt-1.5 text-sm text-sub">
          Your conversations, searchable and connected.
        </p>
      </div>

      {/* Search bar — prominent */}
      <button
        onClick={openSearch}
        className="group flex w-full items-center gap-3 rounded-xl border border-border/40 bg-surface/30 px-5 py-3.5 text-sm text-muted transition-all duration-250 hover:border-accent/30 hover:bg-surface/50 hover:shadow-[0_0_20px_oklch(0.73_0.20_30_/_0.06)]"
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

      {/* Stats — small, underneath */}
      {stats && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 px-1 text-[11px] text-muted/70 font-[family-name:var(--font-mono)]">
          <span><strong className="text-sub font-medium">{formatNumber(stats.conversations)}</strong> conversations</span>
          <span><strong className="text-sub font-medium">{formatNumber(stats.memories)}</strong> memories</span>
          <span><strong className="text-sub font-medium">{formatNumber(stats.enrichment.people)}</strong> people</span>
          <span><strong className="text-sub font-medium">{formatNumber(stats.enrichment.locations)}</strong> locations</span>
        </div>
      )}
    </header>
  )
}
