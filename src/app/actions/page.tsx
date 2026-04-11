'use client'

import { useEffect, useRef, useState } from 'react'
import { getActionItems, updateActionItem, type ActionItem } from '@/lib/api'
import { formatRelativeTime } from '@/lib/format'

type Filter = 'all' | 'open' | 'done'

export default function ActionsPage() {
  const [items, setItems] = useState<ActionItem[]>([])
  const [filter, setFilter] = useState<Filter>('open')
  const [loading, setLoading] = useState(true)
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
    } catch {
      setItems([])
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
      <header className="mb-6">
        <h1 className="text-lg font-semibold text-text">Action Items</h1>
        <p className="mt-1.5 text-sm text-sub">Tasks extracted from your conversations.</p>
      </header>

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
        <span className="ml-auto self-center font-[family-name:var(--font-mono)] text-[10px] text-muted/40">
          {items.length} items
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => {
            const isPending = pendingIds.has(item.id)
            const isDone = !!item.completed
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 rounded-lg border border-border/30 bg-surface/30 px-4 py-3 transition-colors hover:bg-surface/50 ${
                  isPending ? 'opacity-70' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => void toggleItem(item)}
                  disabled={isPending}
                  aria-pressed={isDone}
                  aria-label={isDone ? 'Mark as open' : 'Mark as done'}
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
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
        <div className="py-16 text-center">
          <p className="font-[family-name:var(--font-serif)] text-xl italic text-sub">
            {filter === 'done' ? 'No completed items' : 'All caught up'}
          </p>
        </div>
      )}
    </div>
  )
}
