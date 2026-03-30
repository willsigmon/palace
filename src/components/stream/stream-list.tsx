'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { ConversationListItem } from '@/types/api'
import { getConversations } from '@/lib/api'
import { useAppStore } from '@/stores/app-store'
import { ConversationCard } from './conversation-card'
import { ScrollReveal } from './scroll-reveal'
import { parseTimestamp } from '@/lib/format'
import { API_DEFAULTS } from '@/lib/constants'

interface StreamListProps {
  readonly initialConversations: readonly ConversationListItem[]
}

function isUntitled(title: string | null | undefined): boolean {
  return !title || title.trim() === '' || title.trim().toLowerCase() === 'untitled'
}

export function StreamList({ initialConversations }: StreamListProps) {
  const [conversations, setConversations] = useState<readonly ConversationListItem[]>(initialConversations)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialConversations.length >= API_DEFAULTS.PAGE_SIZE)
  const [offset, setOffset] = useState(initialConversations.length)
  const [showUntitled, setShowUntitled] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const category = useAppStore((s) => s.filters.category)

  // Re-fetch when category filter changes
  useEffect(() => {
    let cancelled = false

    async function refetch() {
      setLoading(true)
      try {
        const data = await getConversations({
          category: category ?? undefined,
          limit: API_DEFAULTS.PAGE_SIZE,
        })
        if (!cancelled) {
          setConversations(data)
          setOffset(data.length)
          setHasMore(data.length >= API_DEFAULTS.PAGE_SIZE)
        }
      } catch {
        // keep existing
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // Only refetch if category changed from initial (null = show initial data)
    if (category !== null) {
      refetch()
    } else {
      setConversations(initialConversations)
      setOffset(initialConversations.length)
      setHasMore(initialConversations.length >= API_DEFAULTS.PAGE_SIZE)
    }

    return () => { cancelled = true }
  }, [category, initialConversations])

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
        category: category ?? undefined,
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

  const untitledCount = conversations.filter((c) => isUntitled(c.title)).length
  const visibleConversations = showUntitled
    ? conversations
    : conversations.filter((c) => !isUntitled(c.title))
  const grouped = groupByDate(visibleConversations)

  return (
    <div className="relative">
      {/* Timeline thread — subtle vertical line */}
      <div className="absolute left-[11px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border/50 to-transparent md:left-[15px]" />

      {/* Untitled toggle */}
      {untitledCount > 0 && (
        <div className="mb-4 ml-7 md:ml-10">
          <button
            onClick={() => setShowUntitled((prev) => !prev)}
            className="text-[11px] text-muted/50 transition-colors hover:text-sub font-[family-name:var(--font-mono)]"
          >
            {showUntitled ? `Hide untitled (${untitledCount})` : `Show untitled (${untitledCount} hidden)`}
          </button>
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(([dateLabel, isoDate, items], groupIdx) => (
          <section key={dateLabel}>
            {/* Date header — links to day view */}
            <div className="sticky top-0 z-20 mb-3 flex items-center gap-3 py-2 backdrop-blur-sm">
              <div className="relative z-10 flex h-2.5 w-2.5 items-center justify-center rounded-full ring-[3px] ring-void md:ml-[10px]">
                <div className="h-2.5 w-2.5 rounded-full bg-accent" />
              </div>
              <Link
                href={`/day/${isoDate}`}
                className="font-[family-name:var(--font-serif)] text-base italic text-text/70 transition-colors hover:text-accent"
              >
                {dateLabel}
              </Link>
              <div className="h-px flex-1 bg-gradient-to-r from-border/30 to-transparent" />
            </div>

            {/* Conversation cards */}
            <div className="ml-7 space-y-2 md:ml-10">
              {items.map((conversation, i) => {
                const isLast = dateLabel === grouped[grouped.length - 1]?.[0]
                  && i === items.length - 1
                // Only stagger the first group's first few cards
                const staggerDelay = groupIdx === 0 && i < 6 ? i * 0.04 : 0

                return (
                  <div
                    key={conversation.id}
                    ref={isLast ? lastCardRef : undefined}
                  >
                    <ScrollReveal delay={staggerDelay}>
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

      {visibleConversations.length === 0 && !loading && (
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

function groupByDate(conversations: readonly ConversationListItem[]): readonly [string, string, readonly ConversationListItem[]][] {
  // Returns [label, isoDate, conversations][]
  const groups = new Map<string, { isoDate: string; items: ConversationListItem[] }>()
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
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      })
    }

    const isoDate = date.toISOString().slice(0, 10)
    const existing = groups.get(label)
    if (existing) {
      existing.items.push(c)
    } else {
      groups.set(label, { isoDate, items: [c] })
    }
  }

  return Array.from(groups.entries()).map(([label, { isoDate, items }]) => [label, isoDate, items] as const)
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
