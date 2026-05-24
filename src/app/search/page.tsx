'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { search } from '@/lib/api'
import type { SearchResponse } from '@/types/api'
import { formatRelativeTime, truncate } from '@/lib/format'
import { Avatar } from '@/components/ui/avatar'

const SUGGESTED_SEARCHES = [
  'Carter',
  'follow up',
  'HubZone',
  'yesterday',
  'meeting',
] as const

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const initializedRef = useRef(false)
  const searchRunRef = useRef(0)

  const doSearch = useCallback(async (q: string) => {
    const term = q.trim()
    const runId = searchRunRef.current + 1
    searchRunRef.current = runId

    if (term.length < 2) {
      setResults(null)
      setFailed(false)
      setLoading(false)
      return
    }

    setLoading(true)
    setFailed(false)
    try {
      const data = await search({ query: term, limit: 50 })
      if (runId !== searchRunRef.current) return
      setResults(data)
    } catch {
      if (runId !== searchRunRef.current) return
      setResults(null)
      setFailed(true)
    } finally {
      if (runId === searchRunRef.current) setLoading(false)
    }
  }, [])

  function handleInput(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 250)
  }

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const initialQuery = new URLSearchParams(window.location.search).get('q')?.trim()
    if (initialQuery) {
      setQuery(initialQuery)
      void doSearch(initialQuery)
    }
  }, [doSearch])

  const fieldyCaptures = results?.fieldy ?? []
  const totalResults = results
    ? (results.conversations?.length ?? 0)
      + (results.memories?.length ?? 0)
      + (results.actionItems?.length ?? 0)
      + (results.people?.length ?? 0)
      + (results.limitless?.length ?? 0)
      + fieldyCaptures.length
    : 0

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <header className="mb-7">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-accent/70">
          Lookup
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-text">
          Find the thing, fast.
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-sub">
          Search conversations, memories, actions, and captured context from one clean command surface.
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
            className="w-full rounded-2xl border border-border/40 bg-surface/40 py-4 pl-12 pr-4 text-base text-text placeholder:text-muted/60 outline-none transition-all focus:border-accent/40 focus:bg-surface/55 focus:shadow-[0_0_24px_var(--color-glow)]"
            autoFocus
          />
        </div>
        {results && (
          <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
            <p className="text-xs text-muted font-[family-name:var(--font-mono)]">
              {totalResults} results for &ldquo;{query}&rdquo;
            </p>
            {query.trim().length >= 2 && (
              <Link
                href={`/?q=${encodeURIComponent(`What should I know about ${query.trim()}?`)}`}
                className="rounded-full border border-accent/15 bg-accent/10 px-2.5 py-1 text-[10px] font-medium text-accent/80 transition-colors hover:border-accent/30 hover:text-accent"
              >
                Ask WSIG about this
              </Link>
            )}
          </div>
        )}
      </div>

      {!results && !loading && (
        <div className="mb-8">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted/40">Try searching</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setQuery(term)
                  void doSearch(term)
                }}
                className="rounded-full border border-border/30 bg-surface/20 px-3.5 py-2 text-[12px] text-sub/70 transition-all hover:border-accent/30 hover:text-accent active:scale-95"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          <span className="text-sm text-sub">Searching...</span>
        </div>
      )}

      {failed && !loading && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-6">
          <p className="font-[family-name:var(--font-serif)] text-xl italic text-red-300/90">
            Search is temporarily out of reach.
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-red-100/55">
            The archive may still be available through WSIG voice/chat. Try again or ask WSIG directly.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void doSearch(query)}
              className="rounded-full border border-red-300/20 bg-red-300/10 px-3.5 py-2 text-[12px] font-medium text-red-200/80 transition-colors hover:text-red-100"
            >
              Retry search
            </button>
            <Link
              href={`/?q=${encodeURIComponent(query.trim() ? `Search my archive for ${query.trim()}` : 'What should I follow up on?')}`}
              className="rounded-full border border-accent/20 bg-accent/10 px-3.5 py-2 text-[12px] font-medium text-accent/80 transition-colors hover:text-accent"
            >
              Ask WSIG instead
            </Link>
          </div>
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
                    <Avatar name={p.display_name ?? p.name} size="lg" />
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
                <Link key={a.id} href="/actions" className="group flex items-start gap-3 rounded-lg border border-border/30 bg-surface/30 p-4 transition-all hover:border-border/50 hover:bg-surface/50">
                  <span className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${a.completed ? 'border-accent bg-accent/20' : 'border-muted'}`} />
                  <div>
                    <p className={`text-sm transition-colors group-hover:text-accent ${a.completed ? 'text-sub line-through' : 'text-text'}`}>
                      {a.description}
                    </p>
                    <time className="mt-1 block text-[10px] text-muted font-[family-name:var(--font-mono)]">
                      {formatRelativeTime(a.createdAt)}
                    </time>
                  </div>
                </Link>
              ))}
            </ResultSection>
          )}

          {/* Fieldy captures */}
          {fieldyCaptures.length > 0 && (
            <ResultSection title="Fieldy Captures" count={fieldyCaptures.length} color="text-serendipity">
              {fieldyCaptures.map((capture) => (
                <div key={capture.id} className="rounded-lg border border-border/30 bg-surface/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-text">
                        {capture.title ?? 'Fieldy capture'}
                      </h3>
                      {capture.overview && (
                        <p className="mt-1 text-xs leading-relaxed text-sub/70">
                          {truncate(capture.overview, 220)}
                        </p>
                      )}
                    </div>
                    {capture.quality_score != null && (
                      <span className="shrink-0 rounded-full border border-serendipity/20 bg-serendipity/10 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[9px] text-serendipity/70">
                        {Math.round(capture.quality_score * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {capture.session_type && (
                      <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[9px] uppercase text-muted">
                        {capture.session_type}
                      </span>
                    )}
                    <time className="text-[10px] text-muted font-[family-name:var(--font-mono)]">
                      {formatRelativeTime(capture.date)}
                    </time>
                  </div>
                </div>
              ))}
            </ResultSection>
          )}

          {/* Limitless / capture notes */}
          {(results.limitless?.length ?? 0) > 0 && (
            <ResultSection title="Captured Notes" count={results.limitless.length} color="text-serendipity">
              {results.limitless.map((capture) => (
                <div key={capture.id} className="rounded-lg border border-border/30 bg-surface/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium text-text">{capture.title ?? 'Untitled capture'}</h3>
                    <time className="shrink-0 text-[10px] text-muted font-[family-name:var(--font-mono)]">
                      {formatRelativeTime(capture.startDate)}
                    </time>
                  </div>
                  {capture.markdown && (
                    <p className="mt-1 text-xs leading-relaxed text-sub/70">
                      {truncate(capture.markdown.replace(/[#*_`>-]/g, '').replace(/\s+/g, ' ').trim(), 220)}
                    </p>
                  )}
                </div>
              ))}
            </ResultSection>
          )}

          {totalResults === 0 && (
            <div className="rounded-2xl border border-border/20 bg-surface/15 px-5 py-10 text-center">
              <p className="font-[family-name:var(--font-serif)] text-xl italic text-sub">
                No results found
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                Try a broader name, project, or date — or ask WSIG to reason from nearby context.
              </p>
              <Link
                href={`/?q=${encodeURIComponent(`What do you know about ${query.trim()}?`)}`}
                className="mt-4 inline-flex rounded-full border border-accent/20 bg-accent/10 px-3.5 py-2 text-[12px] font-medium text-accent/80 transition-colors hover:text-accent"
              >
                Ask WSIG anyway
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!results && !loading && (
        <div className="rounded-2xl border border-border/20 bg-surface/15 px-5 py-8 text-center">
          <p className="font-[family-name:var(--font-serif)] text-xl italic text-sub/80">
            Start with a name, project, promise, or phrase.
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted/60">
            The goal is simple: type what you remember, get the nearest useful context.
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
