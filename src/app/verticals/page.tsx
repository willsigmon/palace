'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { formatRelativeTime, truncate } from '@/lib/format'
import { Avatar } from '@/components/ui/avatar'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.wsig.me'

interface Vertical {
  id: string
  name: string
  color: string
  convoCount: number
  memoryCount: number
  recentConvos: { id: number; title: string; startedAt: string; category: string | null }[]
  recentMemories: { id: number; content: string; createdAt: string }[]
  topPeople: { name: string; person_id: number }[]
}

export default function VerticalsPage() {
  const [verticals, setVerticals] = useState<Vertical[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    fetch(`${API_URL}/api/verticals`)
      .then(r => r.json())
      .then(d => setVerticals(d.verticals || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-[var(--space-page)] py-8">
        <div className="skeleton h-10 w-48 mb-8" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-[var(--space-page)] py-8">
      <header className="mb-8">
        <h1 className="text-lg font-semibold text-text">
          Verticals
        </h1>
        <p className="mt-1.5 text-sm text-sub">
          Your businesses and life — tracked across every conversation.
        </p>
      </header>

      {/* Vertical cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {verticals.map((v) => {
          const isExpanded = expanded === v.id
          return (
            <div
              key={v.id}
              className={`rounded-xl border transition-all duration-300 cursor-pointer ${
                isExpanded
                  ? 'col-span-full border-border/50 bg-surface/50'
                  : 'border-border/30 bg-surface/30 hover:border-border/50 hover:bg-surface/40'
              }`}
              style={{ borderLeftWidth: '3px', borderLeftColor: v.color + '80' }}
              onClick={() => setExpanded(isExpanded ? null : v.id)}
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-[15px] font-medium text-text">{v.name}</h2>
                  <svg
                    width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
                    className={`text-muted/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mb-3">
                  <div>
                    <p className="text-xl font-semibold" style={{ color: v.color }}>{v.convoCount}</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted/50">conversations</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold" style={{ color: v.color }}>{v.memoryCount}</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted/50">memories</p>
                  </div>
                </div>

                {/* People pills */}
                {v.topPeople.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {v.topPeople.slice(0, 3).map((p) => (
                      <Link
                        key={p.person_id}
                        href={`/people/${p.person_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-full bg-elevated/50 px-1.5 py-0.5 text-[10px] text-sub hover:text-accent transition-colors"
                      >
                        <Avatar name={p.name} size="sm" />
                        {p.name.split(' ')[0]}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-5 border-t border-border/20 pt-5 space-y-4" onClick={(e) => e.stopPropagation()}>
                    {/* Recent conversations */}
                    {v.recentConvos.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted/40">Recent conversations</p>
                        <div className="space-y-1.5">
                          {v.recentConvos.map((c) => (
                            <Link
                              key={c.id}
                              href={`/conversation/${c.id}`}
                              className="group flex items-center justify-between rounded-lg border border-border/15 bg-surface/20 px-3 py-2 transition-all hover:bg-surface/40"
                            >
                              <p className="text-[12px] text-text group-hover:text-accent transition-colors truncate pr-2">
                                {c.title}
                              </p>
                              <time className="shrink-0 text-[9px] text-muted/30 font-[family-name:var(--font-mono)]">
                                {formatRelativeTime(c.startedAt)}
                              </time>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent memories */}
                    {v.recentMemories.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted/40">Key memories</p>
                        <div className="space-y-1">
                          {v.recentMemories.slice(0, 3).map((m) => (
                            <p key={m.id} className="text-[11px] leading-relaxed text-sub/50">
                              {truncate(m.content, 120)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ask about this vertical */}
                    <Link
                      href={`/?q=What's+the+latest+with+${encodeURIComponent(v.name)}?`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent/20"
                    >
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <circle cx="10" cy="10" r="8" />
                        <path d="M8 8a2 2 0 114 0c0 1-1.5 1.5-1.5 2.5M10 14v.5" />
                      </svg>
                      Ask about {v.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
