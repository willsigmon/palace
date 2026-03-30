'use client'

import { useState, useEffect, useRef } from 'react'
import { formatRelativeTime } from '@/lib/format'

interface ActionItem {
  id: number
  description: string
  completed: number
  priority: string | null
  category: string | null
  dueAt: string | null
  createdAt: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.wsig.me'

export default function ActionsPage() {
  const [items, setItems] = useState<ActionItem[]>([])
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('open')
  const [loading, setLoading] = useState(true)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    fetchItems('open')
  }, [])

  async function fetchItems(f: 'all' | 'open' | 'done') {
    setLoading(true)
    setFilter(f)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (f === 'open') params.set('completed', 'false')
      if (f === 'done') params.set('completed', 'true')
      const res = await fetch(`${API_URL}/api/action-items?${params}`)
      const data = await res.json()
      setItems(data)
    } catch {} finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
          Action Items
        </h1>
        <p className="mt-1.5 text-sm text-sub">Tasks extracted from your conversations.</p>
      </header>

      <div className="mb-6 flex gap-1.5">
        {(['open', 'all', 'done'] as const).map((f) => (
          <button
            key={f}
            onClick={() => fetchItems(f)}
            className={`rounded-full border px-3 py-1 text-[11px] font-medium capitalize transition-all ${
              filter === f
                ? 'border-accent/20 bg-accent/15 text-accent'
                : 'border-transparent text-muted/60 hover:text-muted hover:bg-surface/40'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-muted/40 font-[family-name:var(--font-mono)] self-center">
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
                item.completed
                  ? 'border-accent/40 bg-accent/20'
                  : 'border-muted/40'
              }`}>
                {item.completed ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                    <path d="M2 5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] leading-relaxed ${item.completed ? 'text-sub/50 line-through' : 'text-text'}`}>
                  {item.description}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {item.priority && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase ${
                      item.priority === 'high' ? 'bg-red-500/15 text-red-400' :
                      item.priority === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-elevated text-muted'
                    }`}>
                      {item.priority}
                    </span>
                  )}
                  {item.category && (
                    <span className="text-[9px] text-muted/40">{item.category}</span>
                  )}
                  <time className="text-[9px] text-muted/30 font-[family-name:var(--font-mono)]">
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
