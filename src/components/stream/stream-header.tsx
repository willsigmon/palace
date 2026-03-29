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
    <header className="mb-8">
      <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
        The Stream
      </h1>

      {stats && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted font-[family-name:var(--font-mono)]">
          <span>{formatNumber(stats.conversations)} conversations</span>
          <span>{formatNumber(stats.memories)} memories</span>
          <span>{formatNumber(stats.enrichment.people)} people</span>
        </div>
      )}

      <button
        onClick={openSearch}
        className="mt-4 flex w-full items-center gap-3 rounded-lg border border-border/50 bg-surface/40 px-4 py-2.5 text-sm text-muted transition-colors duration-200 hover:border-border hover:bg-surface"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="9" r="5" />
          <path d="M13 13l4 4" strokeLinecap="round" />
        </svg>
        <span>Search your memories...</span>
        <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 text-[10px] sm:inline">
          <span className="text-[9px]">&#8984;</span>K
        </kbd>
      </button>
    </header>
  )
}
