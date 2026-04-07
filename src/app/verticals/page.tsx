'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { getVerticals, type VerticalSummary } from '@/lib/api'
import { formatRelativeTime, truncate } from '@/lib/format'

export default function VerticalsPage() {
  const [verticals, setVerticals] = useState<VerticalSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true

    getVerticals()
      .then((data) => setVerticals([...data.verticals]))
      .catch(() => setVerticals([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-[var(--space-page)] py-8">
        <div className="mb-8 h-10 w-48 skeleton" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton h-40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-[var(--space-page)] py-8">
      <header className="mb-8">
        <h1 className="text-lg font-semibold text-text">Verticals</h1>
        <p className="mt-1.5 text-sm text-sub">Your businesses and life — tracked across every conversation.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {verticals.map((vertical) => {
          const isExpanded = expanded === vertical.id
          return (
            <div
              key={vertical.id}
              className={`cursor-pointer rounded-xl border transition-all duration-300 ${
                isExpanded
                  ? 'col-span-full border-border/50 bg-surface/50'
                  : 'border-border/30 bg-surface/30 hover:border-border/50 hover:bg-surface/40'
              }`}
              style={{ borderLeftColor: `${vertical.color}80`, borderLeftWidth: '3px' }}
              onClick={() => setExpanded(isExpanded ? null : vertical.id)}
            >
              <div className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <h2 className="text-[15px] font-medium text-text">{vertical.name}</h2>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className={`text-muted/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="mb-3 flex gap-4">
                  <div>
                    <p className="text-xl font-semibold" style={{ color: vertical.color }}>{vertical.convoCount}</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted/50">conversations</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold" style={{ color: vertical.color }}>{vertical.memoryCount}</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted/50">memories</p>
                  </div>
                </div>

                {vertical.topPeople.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {vertical.topPeople.slice(0, 3).map((person) => (
                      <Link
                        key={person.person_id}
                        href={`/people/${person.person_id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-full bg-elevated/50 px-1.5 py-0.5 text-[10px] text-sub transition-colors hover:text-accent"
                      >
                        <Avatar name={person.name} size="sm" />
                        {person.name.split(' ')[0]}
                      </Link>
                    ))}
                  </div>
                )}

                {isExpanded && (
                  <div className="mt-5 space-y-4 border-t border-border/20 pt-5" onClick={(event) => event.stopPropagation()}>
                    {vertical.recentConvos.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted/40">Recent conversations</p>
                        <div className="space-y-1.5">
                          {vertical.recentConvos.map((conversation) => (
                            <Link
                              key={conversation.id}
                              href={`/conversation/${conversation.id}`}
                              className="group flex items-center justify-between rounded-lg border border-border/15 bg-surface/20 px-3 py-2 transition-all hover:bg-surface/40"
                            >
                              <p className="truncate pr-2 text-[12px] text-text transition-colors group-hover:text-accent">
                                {conversation.title}
                              </p>
                              <time className="shrink-0 font-[family-name:var(--font-mono)] text-[9px] text-muted/30">
                                {formatRelativeTime(conversation.startedAt)}
                              </time>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {vertical.recentMemories.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted/40">Key memories</p>
                        <div className="space-y-1">
                          {vertical.recentMemories.slice(0, 3).map((memory) => (
                            <p key={memory.id} className="text-[11px] leading-relaxed text-sub/50">
                              {truncate(memory.content, 120)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    <Link
                      href={`/?q=What's+the+latest+with+${encodeURIComponent(vertical.name)}?`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent/20"
                    >
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <circle cx="10" cy="10" r="8" />
                        <path d="M8 8a2 2 0 114 0c0 1-1.5 1.5-1.5 2.5M10 14v.5" />
                      </svg>
                      Ask about {vertical.name}
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
