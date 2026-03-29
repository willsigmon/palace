'use client'

import Link from 'next/link'
import type { ConversationListItem } from '@/types/api'
import { formatRelativeTime, formatTime, formatDuration, calcDuration, truncate } from '@/lib/format'

interface ConversationCardProps {
  readonly conversation: ConversationListItem
  readonly index: number
}

// Category → accent color mapping (uses design token colors)
const CATEGORY_COLORS: Record<string, { border: string; badge: string; text: string }> = {
  family:       { border: 'border-l-amber-500/60',    badge: 'bg-amber-500/15 text-amber-400',       text: 'text-amber-400' },
  work:         { border: 'border-l-blue-400/60',     badge: 'bg-blue-400/15 text-blue-400',         text: 'text-blue-400' },
  music:        { border: 'border-l-purple-400/60',   badge: 'bg-purple-400/15 text-purple-400',     text: 'text-purple-400' },
  personal:     { border: 'border-l-emerald-400/60',  badge: 'bg-emerald-400/15 text-emerald-400',   text: 'text-emerald-400' },
  health:       { border: 'border-l-rose-400/60',     badge: 'bg-rose-400/15 text-rose-400',         text: 'text-rose-400' },
  technology:   { border: 'border-l-cyan-400/60',     badge: 'bg-cyan-400/15 text-cyan-400',         text: 'text-cyan-400' },
  finance:      { border: 'border-l-emerald-500/60',  badge: 'bg-emerald-500/15 text-emerald-400',   text: 'text-emerald-400' },
  social:       { border: 'border-l-pink-400/60',     badge: 'bg-pink-400/15 text-pink-400',         text: 'text-pink-400' },
  education:    { border: 'border-l-indigo-400/60',   badge: 'bg-indigo-400/15 text-indigo-400',     text: 'text-indigo-400' },
  real_estate:  { border: 'border-l-orange-400/60',   badge: 'bg-orange-400/15 text-orange-400',     text: 'text-orange-400' },
  other:        { border: 'border-l-sub/40',          badge: 'bg-elevated text-sub',                 text: 'text-sub' },
}

const DEFAULT_COLORS = { border: 'border-l-border', badge: 'bg-elevated text-sub', text: 'text-sub' }

function getCategoryColors(category: string | null) {
  if (!category) return DEFAULT_COLORS
  return CATEGORY_COLORS[category.toLowerCase()] ?? DEFAULT_COLORS
}

export function ConversationCard({ conversation }: ConversationCardProps) {
  const title = conversation.title ?? 'Untitled'
  const overview = conversation.overview ?? ''
  const duration = calcDuration(conversation.startedAt, conversation.finishedAt)
  const colors = getCategoryColors(conversation.category)
  const isUntitled = !conversation.title || conversation.title === 'Untitled'
  const isEmpty = isUntitled && !overview

  // Parse people_mentioned
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

  // Compact card for empty/untitled conversations
  if (isEmpty) {
    return (
      <Link
        href={`/conversation/${conversation.id}`}
        className={`group flex items-center gap-4 rounded-lg border border-border/30 border-l-2 ${colors.border} bg-surface/30 px-4 py-2.5 transition-all duration-200 hover:border-border/50 hover:bg-surface/50`}
      >
        {conversation.emoji && <span className="text-sm">{conversation.emoji}</span>}
        <span className="text-sm text-sub group-hover:text-text transition-colors">
          {title}
        </span>
        <span className="flex-1" />
        {duration && (
          <span className="text-[10px] text-muted font-[family-name:var(--font-mono)]">
            {formatDuration(duration)}
          </span>
        )}
        <time className="text-[10px] text-muted font-[family-name:var(--font-mono)]" dateTime={conversation.startedAt}>
          {formatTime(conversation.startedAt)}
        </time>
        {conversation.category && (
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${colors.badge}`}>
            {conversation.category}
          </span>
        )}
      </Link>
    )
  }

  // Rich card for titled conversations with content
  return (
    <Link
      href={`/conversation/${conversation.id}`}
      className={`group relative block rounded-xl border border-border/40 border-l-[3px] ${colors.border} bg-surface/50 p-5 transition-all duration-250 hover:border-border/60 hover:bg-surface/70 hover:shadow-card`}
    >
      {/* Top row: emoji + time + duration + category */}
      <div className="mb-2.5 flex items-center gap-2">
        {conversation.emoji && <span className="text-base">{conversation.emoji}</span>}
        <time
          className="text-[11px] text-muted font-[family-name:var(--font-mono)]"
          dateTime={conversation.startedAt}
        >
          {formatTime(conversation.startedAt)}
        </time>
        {duration && (
          <>
            <span className="text-border">·</span>
            <span className="text-[11px] text-muted font-[family-name:var(--font-mono)]">
              {formatDuration(duration)}
            </span>
          </>
        )}
        <span className="flex-1" />
        {conversation.category && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colors.badge}`}>
            {conversation.category}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="mb-1 text-[15px] font-medium leading-snug text-text group-hover:text-accent transition-colors duration-200">
        {truncate(title, 80)}
      </h3>

      {/* Overview */}
      {overview && (
        <p className="mb-3 text-[13px] leading-relaxed text-sub/80">
          {truncate(overview, 160)}
        </p>
      )}

      {/* Bottom row: people + relative time */}
      <div className="flex flex-wrap items-center gap-2">
        {people.slice(0, 3).map((person) => (
          <span
            key={person}
            className="inline-flex items-center gap-1 rounded-full bg-elevated/60 px-2 py-0.5 text-[11px] text-sub"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}/60`} />
            {person}
          </span>
        ))}
        {people.length > 3 && (
          <span className="text-[10px] text-muted">+{people.length - 3}</span>
        )}

        <span className="flex-1" />

        <time className="text-[11px] text-muted font-[family-name:var(--font-mono)]" dateTime={conversation.startedAt}>
          {formatRelativeTime(conversation.startedAt)}
        </time>
      </div>
    </Link>
  )
}
