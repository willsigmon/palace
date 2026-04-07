'use client'

import { useEffect, useRef, useState } from 'react'
import { getActionItems, type ActionItem } from '@/lib/api'
import { formatRelativeTime } from '@/lib/format'

export default function ActionsPage() {
  const [items, setItems] = useState<ActionItem[]>([])
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('open')
  const [loading, setLoading] = useState(true)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    void fetchItems('open')
  }, [])

  async function fetchItems(nextFilter: 'all' | 'open' | 'done') {
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
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-border/30 bg-surface/30 px-4 py-3 transition-colors hover:bg-surface/50"
            >
              <span className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                item.completed ? 'border-accent/40 bg-accent/20' : 'border-muted/40'
              }`}>
                {item.completed ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                    <path d="M2 5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[13px] leading-relaxed ${item.completed ? 'text-sub/50 line-through' : 'text-text'}`}>
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
          ))}
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
