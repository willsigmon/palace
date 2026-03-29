'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/stores/app-store'
import { search } from '@/lib/api'
import type { SearchResponse } from '@/types/api'
import { formatRelativeTime, truncate } from '@/lib/format'
import { SHORTCUTS } from '@/lib/constants'

interface FlatResult {
  readonly type: 'conversation' | 'memory' | 'action_item' | 'person' | 'limitless'
  readonly id: number
  readonly title: string
  readonly excerpt: string
  readonly date: string
}

const TYPE_LABELS: Record<string, string> = {
  conversation: 'Conversation',
  memory: 'Memory',
  action_item: 'Action',
  person: 'Person',
  limitless: 'Limitless',
}

const TYPE_COLORS: Record<string, string> = {
  conversation: 'text-conversation',
  memory: 'text-memory',
  action_item: 'text-pattern',
  person: 'text-accent',
  limitless: 'text-serendipity',
}

function flattenResults(response: SearchResponse): readonly FlatResult[] {
  const results: FlatResult[] = []

  for (const c of response.conversations ?? []) {
    results.push({
      type: 'conversation',
      id: c.id,
      title: c.title ?? 'Untitled',
      excerpt: c.overview ? truncate(c.overview, 120) : '',
      date: c.startedAt,
    })
  }

  for (const m of response.memories ?? []) {
    results.push({
      type: 'memory',
      id: m.id,
      title: truncate(m.content, 60),
      excerpt: m.category ?? '',
      date: m.createdAt,
    })
  }

  for (const a of response.actionItems ?? []) {
    results.push({
      type: 'action_item',
      id: a.id,
      title: truncate(a.description, 60),
      excerpt: a.completed ? 'Completed' : 'Open',
      date: a.createdAt,
    })
  }

  for (const p of response.people ?? []) {
    results.push({
      type: 'person',
      id: p.id,
      title: p.display_name ?? p.name,
      excerpt: p.relationship ?? '',
      date: '',
    })
  }

  for (const l of response.limitless ?? []) {
    results.push({
      type: 'limitless',
      id: l.id,
      title: l.title ?? 'Limitless Entry',
      excerpt: '',
      date: l.startDate,
    })
  }

  return results
}

export function SearchOverlay() {
  const { searchOpen, closeSearch } = useAppStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<readonly FlatResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const router = useRouter()

  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus()
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [searchOpen])

  // Global keyboard shortcut: Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === SHORTCUTS.SEARCH) {
        e.preventDefault()
        useAppStore.getState().toggleSearch()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const data = await search({ query: q, limit: 15 })
      setResults(flattenResults(data))
      setSelectedIndex(0)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInput(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 200)
  }

  function handleSelect(result: FlatResult) {
    closeSearch()
    if (result.type === 'conversation') {
      router.push(`/conversation/${result.id}`)
    } else if (result.type === 'person') {
      router.push(`/graph?person=${result.id}`)
    } else {
      router.push(`/search?q=${encodeURIComponent(result.title)}`)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        closeSearch()
        break
    }
  }

  if (!searchOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-[15vh]" data-search-overlay>
      <div
        className="absolute inset-0 glass-heavy"
        onClick={closeSearch}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl mx-2 sm:mx-4 rounded-xl border border-border bg-surface shadow-glass max-h-[90vh] sm:max-h-[70vh] flex flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-sub">
            <circle cx="9" cy="9" r="5" />
            <path d="M13 13l4 4" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search conversations, memories, people..."
            className="flex-1 bg-transparent text-base text-text placeholder:text-muted outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted sm:inline">
            ESC
          </kbd>
        </div>

        {results.length > 0 && (
          <ul className="max-h-[50vh] overflow-y-auto p-2">
            {results.map((result, i) => (
              <li key={`${result.type}-${result.id}`}>
                <button
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`
                    flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left
                    transition-colors duration-100
                    ${i === selectedIndex ? 'bg-elevated' : 'hover:bg-elevated/50'}
                  `}
                >
                  <span className={`mt-0.5 text-[10px] font-medium uppercase tracking-wider ${TYPE_COLORS[result.type] ?? 'text-sub'}`}>
                    {TYPE_LABELS[result.type] ?? result.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text">
                      {truncate(result.title, 60)}
                    </p>
                    {result.excerpt && (
                      <p className="mt-0.5 text-xs text-sub leading-relaxed">
                        {result.excerpt}
                      </p>
                    )}
                  </div>
                  {result.date && (
                    <time className="shrink-0 text-[10px] text-muted font-[family-name:var(--font-mono)]">
                      {formatRelativeTime(result.date)}
                    </time>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {loading && (
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
            <span className="text-sm text-sub">Searching...</span>
          </div>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-sub">No results for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {query.length < 2 && (
          <div className="px-4 py-4 text-center">
            <p className="text-xs text-muted">
              Search across conversations, memories, people, and more
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
