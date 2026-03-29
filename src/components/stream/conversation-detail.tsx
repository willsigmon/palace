'use client'

import Link from 'next/link'
import type { ConversationDetail as ConversationDetailType } from '@/types/api'
import { formatDate, formatTime, formatDuration, calcDuration } from '@/lib/format'

interface ConversationDetailProps {
  readonly detail: ConversationDetailType
}

export function ConversationDetail({ detail }: ConversationDetailProps) {
  const { session, segments, speakerNames } = detail
  const title = session.title ?? 'Untitled Conversation'
  const duration = calcDuration(session.startedAt, session.finishedAt)

  // Build speaker color map
  const speakerColors = ['text-accent', 'text-serendipity', 'text-pattern', 'text-memory', 'text-conversation', 'text-voice-note']

  function getSpeakerName(segment: (typeof segments)[number]): string {
    if (segment.speakerName) return segment.speakerName
    if (speakerNames[String(segment.speaker)]) return speakerNames[String(segment.speaker)]
    if (segment.isUser) return 'You'
    return segment.speakerLabel ?? `Speaker ${segment.speaker}`
  }

  function getSpeakerColor(speaker: number, isUser: boolean): string {
    if (isUser) return 'text-accent'
    return speakerColors[speaker % speakerColors.length] ?? 'text-sub'
  }

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
        <div className="flex items-start gap-3">
          {session.emoji && (
            <span className="text-3xl">{session.emoji}</span>
          )}
          <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-2xl)] italic text-text">
            {title}
          </h1>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted font-[family-name:var(--font-mono)]">
          <time dateTime={session.startedAt}>
            {formatDate(session.startedAt)} at {formatTime(session.startedAt)}
          </time>
          {duration && <span>{formatDuration(duration)}</span>}
          {session.category && (
            <span className="rounded-full bg-elevated px-2 py-0.5">
              {session.category}
            </span>
          )}
          <span className="rounded-full bg-elevated px-2 py-0.5">
            {session.source}
          </span>
        </div>
      </header>

      {/* AI Summary */}
      {session.overview && (
        <section className="mb-8 rounded-xl border border-border/50 bg-surface/60 p-5">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-accent">
            Summary
          </h2>
          <p className="text-sm leading-relaxed text-sub">{session.overview}</p>
        </section>
      )}

      {/* Transcript */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
          Transcript
          <span className="font-[family-name:var(--font-mono)] text-[10px] normal-case">
            ({segments.length} segments)
          </span>
        </h2>

        <div className="space-y-2">
          {segments.length > 0 ? (
            segments.map((segment, i) => (
              <div key={i} className="group flex gap-3">
                <div className="w-24 shrink-0 pt-1.5 text-right">
                  <span className={`text-xs font-medium ${getSpeakerColor(segment.speaker, !!segment.isUser)}`}>
                    {getSpeakerName(segment)}
                  </span>
                </div>
                <div className="flex-1 rounded-lg bg-surface/40 px-4 py-2.5 transition-colors group-hover:bg-surface/60">
                  <p className="text-sm leading-relaxed text-text">{segment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm italic text-muted">No transcript available</p>
          )}
        </div>
      </section>
    </article>
  )
}
