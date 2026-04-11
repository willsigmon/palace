'use client'

import Link from 'next/link'
import type { ConversationListItem } from '@/types/api'
import { formatRelativeTime, formatTime, formatDuration, calcDuration, truncate, getPatina } from '@/lib/format'
import { Avatar } from '@/components/ui/avatar'

interface ConversationCardProps {
  readonly conversation: ConversationListItem & { source?: string }
  readonly index: number
}

// Category → CSS variable. All colors live in globals.css `@theme` so light mode
// recolors automatically. We apply them via inline styles + color-mix() since
// Tailwind's opacity modifier doesn't compose with var() arbitrary values.
const CATEGORY_TOKEN: Record<string, string> = {
  family:      '--color-cat-family',
  work:        '--color-cat-work',
  music:       '--color-cat-music',
  personal:    '--color-cat-personal',
  health:      '--color-cat-health',
  technology:  '--color-cat-technology',
  finance:     '--color-cat-finance',
  social:      '--color-cat-social',
  education:   '--color-cat-education',
  real_estate: '--color-cat-real-estate',
}

interface CategoryStyle {
  readonly border: React.CSSProperties | undefined
  readonly badge: React.CSSProperties | undefined
  readonly hasToken: boolean
}

function getCategoryStyle(category: string | null): CategoryStyle {
  if (!category) return { border: undefined, badge: undefined, hasToken: false }
  const token = CATEGORY_TOKEN[category.toLowerCase()]
  if (!token) return { border: undefined, badge: undefined, hasToken: false }
  const color = `var(${token})`
  return {
    border: { borderLeftColor: `color-mix(in oklch, ${color} 60%, transparent)` },
    badge: {
      backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
      color,
    },
    hasToken: true,
  }
}

export function ConversationCard({ conversation, index }: ConversationCardProps) {
  const title = conversation.title ?? 'Untitled'
  const overview = conversation.overview ?? ''
  const duration = calcDuration(conversation.startedAt, conversation.finishedAt)
  const catStyle = getCategoryStyle(conversation.category)
  const isUntitled = !conversation.title || conversation.title === 'Untitled'
  const isEmpty = isUntitled && !overview
  const patina = getPatina(conversation.startedAt)
  const patinaClass = patina === 'fresh' ? '' : `patina-${patina}`

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

  const borderClass = catStyle.hasToken ? '' : 'border-l-border'
  const badgeClass = catStyle.hasToken ? '' : 'bg-elevated text-sub'

  // Compact card for empty/untitled conversations
  if (isEmpty) {
    return (
      <Link
        href={`/conversation/${conversation.id}`}
        data-card-index={index}
        style={catStyle.border}
        className={`group flex items-center gap-4 rounded-lg border border-border/30 border-l-2 ${borderClass} bg-surface/30 px-4 py-2.5 transition-all duration-200 hover:border-border/50 hover:bg-surface/50 ${patinaClass}`}
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
          <span
            style={catStyle.badge}
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${badgeClass}`}
          >
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
      data-card-index={index}
      style={catStyle.border}
      className={`group relative block rounded-xl border border-border/40 border-l-[3px] ${borderClass} bg-surface/50 p-5 transition-all duration-250 hover:border-border/60 hover:bg-surface/70 hover:shadow-card ${patinaClass}`}
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
          <span
            style={catStyle.badge}
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeClass}`}
          >
            {conversation.category}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="patina-title mb-1 text-[15px] font-medium leading-snug text-text group-hover:text-accent transition-colors duration-200">
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
            className="inline-flex items-center gap-1.5 rounded-full bg-elevated/60 px-1.5 py-0.5 text-[11px] text-sub"
          >
            <Avatar name={person} size="sm" />
            {person.split(' ')[0]}
          </span>
        ))}
        {people.length > 3 && (
          <span className="text-[10px] text-muted">+{people.length - 3}</span>
        )}

        <span className="flex-1" />

        {conversation.source === 'limitless' && (
          <span className="rounded-full bg-indigo-400/10 px-1.5 py-0.5 text-[8px] font-medium text-indigo-400/60">L</span>
        )}
        <time className="patina-time text-[11px] text-muted font-[family-name:var(--font-mono)]" dateTime={conversation.startedAt}>
          {formatRelativeTime(conversation.startedAt)}
        </time>
      </div>
    </Link>
  )
}
