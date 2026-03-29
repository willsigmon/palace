'use client'

import Link from 'next/link'
import type { ConversationListItem } from '@/types/api'
import { formatRelativeTime, formatTime, formatDuration, calcDuration, truncate } from '@/lib/format'

interface ConversationCardProps {
  readonly conversation: ConversationListItem
  readonly index: number
}

export function ConversationCard({ conversation, index }: ConversationCardProps) {
  const title = conversation.title ?? 'Untitled Conversation'
  const overview = conversation.overview ?? ''
  const duration = calcDuration(conversation.startedAt, conversation.finishedAt)

  // Parse people_mentioned — API returns it as JSON string or null
  const people: readonly string[] = (() => {
    if (!conversation.people_mentioned) return []
    if (typeof conversation.people_mentioned === 'string') {
      try {
        const parsed = JSON.parse(conversation.people_mentioned)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  })()

  return (
    <Link
      href={`/conversation/${conversation.id}`}
      className="group relative block rounded-xl border border-border/50 bg-surface/60 p-5 transition-all duration-300 hover:border-border hover:bg-surface hover:shadow-elevated"
      style={{
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Top row: time + category badge */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {conversation.emoji && (
            <span className="text-base">{conversation.emoji}</span>
          )}
          <time
            className="text-xs text-muted font-[family-name:var(--font-mono)]"
            dateTime={conversation.startedAt}
          >
            {formatTime(conversation.startedAt)}
          </time>
          {duration && (
            <span className="text-xs text-muted">
              {formatDuration(duration)}
            </span>
          )}
        </div>

        {conversation.category && (
          <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-sub">
            {conversation.category}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="mb-1.5 text-base font-medium text-text group-hover:text-accent transition-colors duration-200">
        {truncate(title, 80)}
      </h3>

      {/* Overview */}
      {overview && (
        <p className="mb-3 text-sm leading-relaxed text-sub">
          {truncate(overview, 180)}
        </p>
      )}

      {/* Bottom row: people + relative time */}
      <div className="flex flex-wrap items-center gap-2">
        {people.slice(0, 3).map((person) => (
          <span
            key={person}
            className="inline-flex items-center gap-1 rounded-full bg-elevated px-2 py-0.5 text-xs text-sub"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-from" />
            {person}
          </span>
        ))}
        {people.length > 3 && (
          <span className="text-xs text-muted">+{people.length - 3}</span>
        )}

        <span className="flex-1" />

        {conversation.segmentCount > 0 && (
          <span className="text-[10px] text-muted font-[family-name:var(--font-mono)]">
            {conversation.segmentCount} segments
          </span>
        )}

        <time className="text-xs text-muted" dateTime={conversation.startedAt}>
          {formatRelativeTime(conversation.startedAt)}
        </time>
      </div>
    </Link>
  )
}
