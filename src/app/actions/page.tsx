'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getActionItems, updateActionItem, type ActionItem } from '@/lib/api'
import { formatRelativeTime } from '@/lib/format'

type Filter = 'all' | 'open' | 'done'

export default function ActionsPage() {
  const [items, setItems] = useState<ActionItem[]>([])
  const [filter, setFilter] = useState<Filter>('open')
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(() => new Set())
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    void fetchItems('open')
  }, [])

  async function fetchItems(nextFilter: Filter) {
    setLoading(true)
    setFilter(nextFilter)

    try {
      const completed = nextFilter === 'all' ? undefined : nextFilter === 'done'
      const data = await getActionItems({ completed, limit: 50 })
      setItems([...data])
      setFailed(false)
    } catch {
      setItems([])
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  async function toggleItem(item: ActionItem) {
    if (pendingIds.has(item.id)) return

    const nextCompleted = item.completed ? 0 : 1
    const optimistic: ActionItem = { ...item, completed: nextCompleted }

    // Optimistic update: flip locally, then drop from list if it no longer matches the filter
    setItems((prev) => {
      const updated = prev.map((x) => (x.id === item.id ? optimistic : x))
      if (filter === 'open' && nextCompleted === 1) return updated.filter((x) => x.id !== item.id)
      if (filter === 'done' && nextCompleted === 0) return updated.filter((x) => x.id !== item.id)
      return updated
    })
    setPendingIds((prev) => {
      const next = new Set(prev)
      next.add(item.id)
      return next
    })

    try {
      await updateActionItem(item.id, nextCompleted === 1)
    } catch {
      // Rollback on failure
      setItems((prev) => {
        const withOriginal = prev.some((x) => x.id === item.id)
          ? prev.map((x) => (x.id === item.id ? item : x))
          : [...prev, item]
        return withOriginal
      })
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <header className="mb-7">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-accent/70">
          Follow-through
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-text">Actions</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-sub">
          A calmer list of the promises, tasks, and next steps PALACE heard in conversation.
        </p>
      </header>

      <section className="mb-5 rounded-2xl border border-border/30 bg-surface/25 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted/45">
              Current view
            </p>
            <p className="mt-1 text-sm text-text">
              {filter === 'open' ? 'Open loops only' : filter === 'done' ? 'Completed items' : 'All extracted actions'}
            </p>
          </div>
          <div className="rounded-2xl border border-accent/15 bg-accent/10 px-4 py-2 text-right">
            <p className="font-[family-name:var(--font-mono)] text-lg font-semibold text-accent">{loading ? '…' : items.length}</p>
            <p className="text-[9px] uppercase tracking-wider text-accent/55">items</p>
          </div>
        </div>
      </section>

      <div className="mb-6 flex gap-1.5">
        {(['open', 'all', 'done'] as const).map((option) => (
          <button
            key={option}
            onClick={() => void fetchItems(option)}
            className={`rounded-full border px-3 py-1 text-[11px] font-medium capitalize transition-all ${
              filter === option
                ? 'border-accent/20 bg-accent/15 text-accent'
                : 'border-transparent text-muted/60 hover:bg-surface/40 hover:text-muted'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        </div>
      ) : failed ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-8 text-center">
          <p className="font-[family-name:var(--font-serif)] text-xl italic text-red-300/90">
            Actions are temporarily unavailable.
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-red-100/55">
            The follow-through list could not load. You can retry, or ask WSIG to reconstruct likely next steps from recent context.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => void fetchItems(filter)}
              className="rounded-full border border-red-300/20 bg-red-300/10 px-3.5 py-2 text-[12px] font-medium text-red-200/80 transition-colors hover:text-red-100"
            >
              Retry actions
            </button>
            <Link
              href="/?q=What%20do%20I%20need%20to%20follow%20up%20on%3F"
              className="rounded-full border border-accent/20 bg-accent/10 px-3.5 py-2 text-[12px] font-medium text-accent/80 transition-colors hover:text-accent"
            >
              Ask WSIG
            </Link>
          </div>
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => {
            const isPending = pendingIds.has(item.id)
            const isDone = !!item.completed
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 rounded-xl border border-border/30 bg-surface/30 px-4 py-3.5 transition-colors hover:bg-surface/50 ${
                  isPending ? 'opacity-70' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => void toggleItem(item)}
                  disabled={isPending}
                  aria-pressed={isDone}
                  aria-label={isDone ? 'Mark as open' : 'Mark as done'}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    isDone
                      ? 'border-accent/40 bg-accent/20 hover:bg-accent/30'
                      : 'border-muted/40 hover:border-accent/50 hover:bg-accent/5'
                  } ${isPending ? 'cursor-wait' : 'cursor-pointer'}`}
                >
                  {isDone ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                      <path d="M2 5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] leading-relaxed ${isDone ? 'text-sub/50 line-through' : 'text-text'}`}>
                    {item.description}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {item.priority && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase ${
                        item.priority === 'high'
                          ? 'bg-red-500/15 text-red-400'
                          : item.priority === 'medium'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-elevated text-muted'
                      }`}>
                        {item.priority}
                      </span>
                    )}
                    {item.category && <span className="text-[9px] text-muted/40">{item.category}</span>}
                    <time className="font-[family-name:var(--font-mono)] text-[9px] text-muted/30">
                      {formatRelativeTime(item.createdAt)}
                    </time>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/20 bg-surface/15 px-5 py-10 text-center">
          <p className="font-[family-name:var(--font-serif)] text-xl italic text-sub">
            {filter === 'done' ? 'No completed items' : 'All caught up'}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted/60">
            {filter === 'done'
              ? 'Completed work will appear here after you check items off.'
              : 'Clean state. If something feels missing, ask WSIG to scan recent context for loose ends.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/?q=What%20did%20I%20promise%20this%20week%3F"
              className="rounded-full border border-accent/20 bg-accent/10 px-3.5 py-2 text-[12px] font-medium text-accent/80 transition-colors hover:text-accent"
            >
              Ask about promises
            </Link>
            <Link
              href="/search?q=follow%20up"
              className="rounded-full border border-border/30 bg-surface/20 px-3.5 py-2 text-[12px] font-medium text-sub/70 transition-colors hover:border-accent/30 hover:text-accent"
            >
              Search follow-ups
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
