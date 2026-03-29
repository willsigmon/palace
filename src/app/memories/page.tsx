'use client'

import { useState, useCallback, useRef } from 'react'
import { getMemories } from '@/lib/api'
import type { Memory } from '@/types/api'
import { formatRelativeTime, truncate } from '@/lib/format'
import { API_DEFAULTS } from '@/lib/constants'

const CATEGORY_PILLS = [
  { value: '', label: 'All' },
  { value: 'interesting', label: 'Interesting', color: 'text-accent' },
  { value: 'system', label: 'System', color: 'text-sub' },
  { value: 'manual', label: 'Manual', color: 'text-serendipity' },
] as const

const SOURCE_COLORS: Record<string, string> = {
  Comet: 'bg-amber-500/15 text-amber-400',
  Claude: 'bg-purple-400/15 text-purple-400',
  Mimestream: 'bg-blue-400/15 text-blue-400',
  cmux: 'bg-cyan-400/15 text-cyan-400',
  desktop: 'bg-emerald-400/15 text-emerald-400',
  google_calendar: 'bg-rose-400/15 text-rose-400',
}

export default function MemoriesPage() {
  const [memories, setMemories] = useState<readonly Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const initialFetch = useRef(false)

  // Initial + category change fetch
  const fetchMemories = useCallback(async (cat: string, reset = false) => {
    setLoading(true)
    try {
      const data = await getMemories({
        category: cat || undefined,
        limit: API_DEFAULTS.PAGE_SIZE,
        offset: reset ? 0 : offset,
      })
      if (reset) {
        setMemories(data)
        setOffset(data.length)
      } else {
        setMemories((prev) => [...prev, ...data])
        setOffset((prev) => prev + data.length)
      }
      setHasMore(data.length >= API_DEFAULTS.PAGE_SIZE)
    } catch {
      // keep existing
    } finally {
      setLoading(false)
    }
  }, [offset])

  // Load on mount
  if (!initialFetch.current) {
    initialFetch.current = true
    fetchMemories('', true)
  }

  function handleCategoryChange(cat: string) {
    setCategory(cat)
    setOffset(0)
    fetchMemories(cat, true)
  }

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
          Memories
        </h1>
        <p className="mt-1.5 text-sm text-sub">
          125,000+ extracted insights from your conversations.
        </p>
      </header>

      {/* Category pills */}
      <div className="mb-6 flex flex-wrap items-center gap-1.5">
        {CATEGORY_PILLS.map((pill) => (
          <button
            key={pill.value}
            onClick={() => handleCategoryChange(pill.value)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
              category === pill.value
                ? 'border-accent/20 bg-accent/15 text-accent'
                : 'border-transparent text-muted/60 hover:text-muted hover:bg-surface/40'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Memory list */}
      <div className="space-y-2">
        {memories.map((memory) => (
          <div
            key={memory.id}
            className="rounded-lg border border-border/30 bg-surface/30 px-4 py-3 transition-colors hover:bg-surface/50"
          >
            <p className="text-[13px] leading-relaxed text-text/90">
              {truncate(memory.content, 300)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {memory.category && (
                <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted">
                  {memory.category}
                </span>
              )}
              {memory.sourceApp && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${SOURCE_COLORS[memory.sourceApp] ?? 'bg-elevated text-muted'}`}>
                  {memory.sourceApp}
                </span>
              )}
              {memory.confidence != null && memory.confidence > 0 && (
                <span className="text-[9px] text-muted/50 font-[family-name:var(--font-mono)]">
                  {Math.round(memory.confidence * 100)}% conf
                </span>
              )}
              <span className="flex-1" />
              <time className="text-[10px] text-muted/50 font-[family-name:var(--font-mono)]">
                {formatRelativeTime(memory.createdAt)}
              </time>
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasMore && !loading && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => fetchMemories(category)}
            className="rounded-lg bg-surface/50 px-5 py-2 text-sm text-sub transition-colors hover:bg-surface hover:text-text"
          >
            Load more
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-6 flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        </div>
      )}
    </div>
  )
}
