'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/stores/app-store'
import { search } from '@/lib/api'
import type { SearchResult } from '@/types/api'
import { formatRelativeTime, truncate } from '@/lib/format'
import { SHORTCUTS } from '@/lib/constants'

const RESULT_TYPE_LABELS: Record<string, string> = {
  conversation: 'Conversation',
  memory: 'Memory',
  action_item: 'Action',
  person: 'Person',
  limitless: 'Limitless',
}

const RESULT_TYPE_COLORS: Record<string, string> = {
  conversation: 'text-conversation',
  memory: 'text-memory',
  action_item: 'text-pattern',
  person: 'text-accent',
  limitless: 'text-serendipity',
}

export function SearchOverlay() {
  const { searchOpen, closeSearch } = useAppStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<readonly SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const router = useRouter()

  // Focus input when overlay opens
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

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const data = await search({ query: q, limit: 15 })
      setResults(data)
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

  function handleSelect(result: SearchResult) {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 glass-heavy"
        onClick={closeSearch}
        aria-hidden="true"
      />

      {/* Search panel */}
      <div className="relative w-full max-w-xl mx-4 rounded-xl border border-border bg-surface shadow-glass">
        {/* Search input */}
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

        {/* Results */}
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
                  <span className={`mt-0.5 text-[10px] font-medium uppercase tracking-wider ${RESULT_TYPE_COLORS[result.type] ?? 'text-sub'}`}>
                    {RESULT_TYPE_LABELS[result.type] ?? result.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text">
                      {truncate(result.title, 60)}
                    </p>
                    {result.excerpt && (
                      <p className="mt-0.5 text-xs text-sub leading-relaxed">
                        {truncate(result.excerpt, 120)}
                      </p>
                    )}
                  </div>
                  <time className="shrink-0 text-[10px] text-muted font-[family-name:var(--font-mono)]">
                    {formatRelativeTime(result.created_at)}
                  </time>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
            <span className="text-sm text-sub">Searching...</span>
          </div>
        )}

        {/* Empty state */}
        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-sub">No results for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {/* Hints */}
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
