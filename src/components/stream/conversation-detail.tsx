'use client'

import Link from 'next/link'
import type { Conversation } from '@/types/api'
import { formatDate, formatTime, formatDuration } from '@/lib/format'
import { SESSION_TYPE_LABELS } from '@/lib/constants'

interface ConversationDetailProps {
  readonly conversation: Conversation
}

export function ConversationDetail({ conversation }: ConversationDetailProps) {
  const title = conversation.enrichment?.generated_title
    ?? conversation.title
    ?? 'Untitled Conversation'

  const overview = conversation.enrichment?.generated_overview
    ?? conversation.overview

  const people = conversation.enrichment?.people_mentioned
    ?? conversation.people_mentioned
    ?? []

  return (
    <article>
      {/* Back button */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-sub transition-colors hover:text-text"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Stream
      </Link>

      {/* Header */}
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-2xl)] italic text-text">
          {title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted font-[family-name:var(--font-mono)]">
          <time dateTime={conversation.created_at}>
            {formatDate(conversation.created_at)} at {formatTime(conversation.created_at)}
          </time>
          {conversation.duration_seconds && (
            <span>{formatDuration(conversation.duration_seconds)}</span>
          )}
          <span className="rounded-full bg-elevated px-2 py-0.5">
            {SESSION_TYPE_LABELS[conversation.session_type] ?? conversation.session_type}
          </span>
        </div>

        {/* People */}
        {people.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {people.map((person) => (
              <span
                key={person}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3 py-1 text-xs text-sub"
              >
                <span className="h-2 w-2 rounded-full bg-accent-from" />
                {person}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* AI Summary */}
      {overview && (
        <section className="mb-8 rounded-xl border border-border/50 bg-surface/60 p-5">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-accent">
            Summary
          </h2>
          <p className="text-sm leading-relaxed text-sub">{overview}</p>
        </section>
      )}

      {/* Transcript */}
      <section>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">
          Transcript
        </h2>

        <div className="space-y-3">
          {conversation.transcript_segments?.length > 0 ? (
            conversation.transcript_segments.map((segment, i) => (
              <div key={i} className="group flex gap-3">
                {/* Speaker label */}
                <div className="w-20 shrink-0 pt-0.5 text-right">
                  <span
                    className={`text-xs font-medium ${segment.is_user ? 'text-accent' : 'text-sub'}`}
                  >
                    {segment.speaker_label ?? segment.speaker}
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1 rounded-lg bg-surface/40 px-4 py-2.5 group-hover:bg-surface/60 transition-colors">
                  <p className="text-sm leading-relaxed text-text">{segment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted italic">No transcript available</p>
          )}
        </div>
      </section>
    </article>
  )
}
