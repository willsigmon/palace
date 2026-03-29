'use client'

import Link from 'next/link'
import type { Conversation } from '@/types/api'
import { formatRelativeTime, formatTime, formatDuration, truncate } from '@/lib/format'
import { SESSION_TYPE_LABELS } from '@/lib/constants'

interface ConversationCardProps {
  readonly conversation: Conversation
  readonly index: number
}

const SESSION_TYPE_COLORS: Record<string, string> = {
  conversation: 'bg-conversation/15 text-conversation',
  media: 'bg-media/15 text-media',
  ambient: 'bg-ambient/15 text-ambient',
  voice_note: 'bg-voice-note/15 text-voice-note',
}

export function ConversationCard({ conversation, index }: ConversationCardProps) {
  const title = conversation.enrichment?.generated_title
    ?? conversation.title
    ?? 'Untitled Conversation'

  const overview = conversation.enrichment?.generated_overview
    ?? conversation.overview
    ?? ''

  const sessionType = conversation.enrichment?.session_type
    ?? conversation.session_type

  const people = conversation.enrichment?.people_mentioned
    ?? conversation.people_mentioned
    ?? []

  return (
    <Link
      href={`/conversation/${conversation.id}`}
      className="group relative block rounded-xl border border-border/50 bg-surface/60 p-5 transition-all duration-300 hover:border-border hover:bg-surface hover:shadow-elevated"
      style={{
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Top row: time + type badge */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <time
            className="text-xs text-muted font-[family-name:var(--font-mono)]"
            dateTime={conversation.created_at}
            title={new Date(conversation.created_at).toLocaleString()}
          >
            {formatTime(conversation.created_at)}
          </time>
          {conversation.duration_seconds && (
            <span className="text-xs text-muted">
              {formatDuration(conversation.duration_seconds)}
            </span>
          )}
        </div>

        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${SESSION_TYPE_COLORS[sessionType] ?? 'bg-elevated text-sub'}`}
        >
          {SESSION_TYPE_LABELS[sessionType] ?? sessionType}
        </span>
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

      {/* Bottom row: people + topics */}
      <div className="flex flex-wrap items-center gap-2">
        {/* People badges */}
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

        {/* Spacer */}
        <span className="flex-1" />

        {/* Relative time */}
        <time className="text-xs text-muted" dateTime={conversation.created_at}>
          {formatRelativeTime(conversation.created_at)}
        </time>
      </div>
    </Link>
  )
}
