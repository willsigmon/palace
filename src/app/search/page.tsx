'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { search } from '@/lib/api'
import type { SearchResponse } from '@/types/api'
import { formatRelativeTime, truncate } from '@/lib/format'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    try {
      const data = await search({ query: q, limit: 50 })
      setResults(data)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInput(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 250)
  }

  const totalResults = results
    ? (results.conversations?.length ?? 0)
      + (results.memories?.length ?? 0)
      + (results.actionItems?.length ?? 0)
      + (results.people?.length ?? 0)
      + (results.limitless?.length ?? 0)
    : 0

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
          Search
        </h1>
        <p className="mt-1.5 text-sm text-sub">
          Deep search across your entire life archive.
        </p>
      </header>

      {/* Search input */}
      <div className="mb-8">
        <div className="relative">
          <svg
            width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          >
            <circle cx="9" cy="9" r="5" />
            <path d="M13 13l4 4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="What are you looking for?"
            className="w-full rounded-xl border border-border/40 bg-surface/30 py-4 pl-12 pr-4 text-base text-text placeholder:text-muted/60 outline-none transition-all focus:border-accent/40 focus:shadow-[0_0_24px_var(--color-glow)]"
            autoFocus
          />
        </div>
        {results && (
          <p className="mt-2 px-1 text-xs text-muted font-[family-name:var(--font-mono)]">
            {totalResults} results for &ldquo;{query}&rdquo;
          </p>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          <span className="text-sm text-sub">Searching...</span>
        </div>
      )}

      {results && !loading && (
        <div className="space-y-8">
          {/* Conversations */}
          {(results.conversations?.length ?? 0) > 0 && (
            <ResultSection title="Conversations" count={results.conversations.length} color="text-conversation">
              {results.conversations.map((c) => (
                <Link
                  key={c.id}
                  href={`/conversation/${c.id}`}
                  className="group block rounded-lg border border-border/30 bg-surface/30 p-4 transition-all hover:border-border/50 hover:bg-surface/50"
                >
                  <h3 className="text-sm font-medium text-text group-hover:text-accent transition-colors">
                    {c.title ?? 'Untitled'}
                  </h3>
                  {c.overview && (
                    <p className="mt-1 text-xs leading-relaxed text-sub/70">
                      {truncate(c.overview, 200)}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    {c.category && (
                      <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[9px] uppercase text-muted">
                        {c.category}
                      </span>
                    )}
                    <time className="text-[10px] text-muted font-[family-name:var(--font-mono)]">
                      {formatRelativeTime(c.startedAt)}
                    </time>
                  </div>
                </Link>
              ))}
            </ResultSection>
          )}

          {/* Memories */}
          {(results.memories?.length ?? 0) > 0 && (
            <ResultSection title="Memories" count={results.memories.length} color="text-memory">
              {results.memories.map((m) => (
                <div key={m.id} className="rounded-lg border border-border/30 bg-surface/30 p-4">
                  <p className="text-sm text-text">{truncate(m.content, 200)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {m.category && (
                      <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[9px] uppercase text-muted">
                        {m.category}
                      </span>
                    )}
                    {m.sourceApp && (
                      <span className="text-[10px] text-muted">{m.sourceApp}</span>
                    )}
                    <time className="text-[10px] text-muted font-[family-name:var(--font-mono)]">
                      {formatRelativeTime(m.createdAt)}
                    </time>
                  </div>
                </div>
              ))}
            </ResultSection>
          )}

          {/* People */}
          {(results.people?.length ?? 0) > 0 && (
            <ResultSection title="People" count={results.people.length} color="text-accent">
              <div className="grid gap-2 sm:grid-cols-2">
                {results.people.map((p) => (
                  <Link
                    key={p.id}
                    href={`/people/${p.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-border/30 bg-surface/30 p-3 transition-all hover:border-border/50 hover:bg-surface/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated text-xs font-medium text-sub group-hover:text-accent transition-colors">
                      {(p.display_name ?? p.name).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text group-hover:text-accent transition-colors">
                        {p.display_name ?? p.name}
                      </p>
                      {p.relationship && (
                        <p className="text-[10px] text-muted capitalize">{p.relationship}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </ResultSection>
          )}

          {/* Action Items */}
          {(results.actionItems?.length ?? 0) > 0 && (
            <ResultSection title="Action Items" count={results.actionItems.length} color="text-pattern">
              {results.actionItems.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border/30 bg-surface/30 p-4">
                  <span className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${a.completed ? 'border-accent bg-accent/20' : 'border-muted'}`} />
                  <div>
                    <p className={`text-sm ${a.completed ? 'text-sub line-through' : 'text-text'}`}>
                      {a.description}
                    </p>
                    <time className="mt-1 block text-[10px] text-muted font-[family-name:var(--font-mono)]">
                      {formatRelativeTime(a.createdAt)}
                    </time>
                  </div>
                </div>
              ))}
            </ResultSection>
          )}

          {totalResults === 0 && (
            <div className="py-12 text-center">
              <p className="font-[family-name:var(--font-serif)] text-xl italic text-sub">
                No results found
              </p>
              <p className="mt-1 text-sm text-muted">Try a different search term</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!results && !loading && (
        <div className="py-12 text-center">
          <p className="text-sm text-muted/60">
            Start typing to search across conversations, memories, people, and more
          </p>
        </div>
      )}
    </div>
  )
}

function ResultSection({
  title,
  count,
  color,
  children,
}: {
  title: string
  count: number
  color: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2">
        <span className={`text-[10px] font-semibold uppercase tracking-widest ${color}`}>
          {title}
        </span>
        <span className="text-[10px] text-muted font-[family-name:var(--font-mono)]">
          ({count})
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-border/30 to-transparent" />
      </h2>
      <div className="space-y-2">
        {children}
      </div>
    </section>
  )
}
