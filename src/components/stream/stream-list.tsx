'use client'

import { useState, useCallback, useRef } from 'react'
import type { ConversationListItem } from '@/types/api'
import { getConversations } from '@/lib/api'
import { ConversationCard } from './conversation-card'
import { ScrollReveal } from './scroll-reveal'
import { parseTimestamp } from '@/lib/format'
import { API_DEFAULTS } from '@/lib/constants'

interface StreamListProps {
  readonly initialConversations: readonly ConversationListItem[]
}

export function StreamList({ initialConversations }: StreamListProps) {
  const [conversations, setConversations] = useState<readonly ConversationListItem[]>(initialConversations)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialConversations.length >= API_DEFAULTS.PAGE_SIZE)
  const [offset, setOffset] = useState(initialConversations.length)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const lastCardRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasMore) {
          loadMore()
        }
      })

      if (node) observerRef.current.observe(node)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, hasMore],
  )

  async function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const newConversations = await getConversations({
        limit: API_DEFAULTS.PAGE_SIZE,
        offset,
      })

      setConversations((prev) => [...prev, ...newConversations])
      setOffset((prev) => prev + newConversations.length)
      setHasMore(newConversations.length >= API_DEFAULTS.PAGE_SIZE)
    } catch {
      // Silent fail — user can scroll to retry
    } finally {
      setLoading(false)
    }
  }

  const grouped = groupByDate(conversations)

  return (
    <div className="relative">
      {/* Timeline thread */}
      <div className="timeline-thread absolute left-6 top-0 bottom-0 w-px md:left-8" />

      <div className="space-y-8">
        {grouped.map(([date, items]) => (
          <section key={date}>
            {/* Date header */}
            <div className="sticky top-0 z-10 mb-4 flex items-center gap-3 pb-2">
              <div className="relative z-10 flex h-3 w-3 items-center justify-center rounded-full bg-accent/20 ring-4 ring-void md:ml-[26px]">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              </div>
              <h2 className="font-[family-name:var(--font-serif)] text-lg italic text-sub">
                {date}
              </h2>
            </div>

            {/* Conversation cards */}
            <div className="ml-10 space-y-3 md:ml-16">
              {items.map((conversation, i) => {
                const isLast = date === grouped[grouped.length - 1]?.[0]
                  && i === items.length - 1

                return (
                  <div
                    key={conversation.id}
                    ref={isLast ? lastCardRef : undefined}
                  >
                    <ScrollReveal delay={i < 5 ? i * 0.05 : 0}>
                      <ConversationCard
                        conversation={conversation}
                        index={i}
                      />
                    </ScrollReveal>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {loading && (
        <div className="mt-8 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        </div>
      )}

      {conversations.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-[family-name:var(--font-serif)] text-2xl italic text-sub">
            No conversations yet
          </p>
          <p className="mt-2 text-sm text-muted">
            Connect to your BRAIN API to start exploring
          </p>
        </div>
      )}
    </div>
  )
}

function groupByDate(conversations: readonly ConversationListItem[]): readonly [string, readonly ConversationListItem[]][] {
  const groups = new Map<string, ConversationListItem[]>()
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  for (const c of conversations) {
    const date = parseTimestamp(c.startedAt)
    let label: string

    if (isSameDay(date, today)) {
      label = 'Today'
    } else if (isSameDay(date, yesterday)) {
      label = 'Yesterday'
    } else if (isThisWeek(date, today)) {
      label = date.toLocaleDateString('en-US', { weekday: 'long' })
    } else {
      label = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      })
    }

    const existing = groups.get(label)
    if (existing) {
      existing.push(c)
    } else {
      groups.set(label, [c])
    }
  }

  return Array.from(groups.entries())
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isThisWeek(date: Date, today: Date): boolean {
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  return date >= weekAgo
}
