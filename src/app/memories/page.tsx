'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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

const SOURCE_APP_PILLS = [
  { value: '', label: 'All Sources' },
  { value: 'Comet', label: 'Comet' },
  { value: 'Claude Code', label: 'Claude Code' },
  { value: 'cmux', label: 'cmux' },
  { value: 'Slack', label: 'Slack' },
  { value: 'Perplexity AI', label: 'Perplexity AI' },
  { value: 'desktop', label: 'desktop' },
] as const

const SOURCE_COLORS: Record<string, string> = {
  Comet: 'bg-amber-500/15 text-amber-400',
  Claude: 'bg-purple-400/15 text-purple-400',
  'Claude Code': 'bg-purple-400/15 text-purple-400',
  Mimestream: 'bg-blue-400/15 text-blue-400',
  cmux: 'bg-cyan-400/15 text-cyan-400',
  desktop: 'bg-emerald-400/15 text-emerald-400',
  google_calendar: 'bg-rose-400/15 text-rose-400',
  Slack: 'bg-rose-400/15 text-rose-400',
  'Perplexity AI': 'bg-sky-400/15 text-sky-400',
}

export default function MemoriesPage() {
  const [memories, setMemories] = useState<readonly Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [sourceApp, setSourceApp] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const initialFetch = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  // Stable ref to loadMore so the observer callback stays current
  const loadMoreRef = useRef<() => void>(() => undefined)

  const fetchMemories = useCallback(async (cat: string, reset = false, currentOffset = 0) => {
    setLoading(true)
    try {
      const data = await getMemories({
        category: cat || undefined,
        limit: API_DEFAULTS.PAGE_SIZE,
        offset: reset ? 0 : currentOffset,
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
  }, [])

  // Load on mount
  if (!initialFetch.current) {
    initialFetch.current = true
    fetchMemories('', true, 0)
  }

  function handleCategoryChange(cat: string) {
    setCategory(cat)
    setOffset(0)
    fetchMemories(cat, true, 0)
  }

  function handleSourceChange(src: string) {
    setSourceApp(src)
  }

  // Keep loadMore ref current so observer always has correct closure
  useEffect(() => {
    loadMoreRef.current = () => {
      if (loading || !hasMore) return
      fetchMemories(category, false, offset)
    }
  })

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasMore) {
          loadMoreRef.current()
        }
      })

      if (node) observerRef.current.observe(node)
    },
    [loading, hasMore],
  )

  // Client-side source app filter
  const visibleMemories = sourceApp
    ? memories.filter((m) =>
        m.sourceApp?.toLowerCase().includes(sourceApp.toLowerCase()),
      )
    : memories

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
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
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

      {/* Source app filter pills */}
      <div className="mb-6 flex flex-wrap items-center gap-1">
        {SOURCE_APP_PILLS.map((pill) => (
          <button
            key={pill.value}
            onClick={() => handleSourceChange(pill.value)}
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all ${
              sourceApp === pill.value
                ? 'border-sub/20 bg-sub/10 text-sub'
                : 'border-transparent text-muted/40 hover:text-muted/70 hover:bg-surface/30'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Memory list */}
      <div className="space-y-2">
        {visibleMemories.map((memory, i) => {
          const isLast = i === visibleMemories.length - 1
          return (
            <div
              key={memory.id}
              ref={isLast ? lastItemRef : undefined}
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
          )
        })}
      </div>

      {loading && (
        <div className="mt-6 flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        </div>
      )}
    </div>
  )
}
