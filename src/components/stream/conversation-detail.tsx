'use client'

import Link from 'next/link'
import type { ConversationDetail as ConversationDetailType } from '@/types/api'
import { formatDate, formatTime, formatDuration, calcDuration } from '@/lib/format'

interface ConversationDetailProps {
  readonly detail: ConversationDetailType
}

// Distinct colors per speaker for visual differentiation
const SPEAKER_PALETTE = [
  { text: 'text-accent',       bg: 'bg-accent/8',       dot: 'bg-accent' },
  { text: 'text-serendipity',  bg: 'bg-serendipity/8',  dot: 'bg-serendipity' },
  { text: 'text-pattern',      bg: 'bg-pattern/8',      dot: 'bg-pattern' },
  { text: 'text-memory',       bg: 'bg-memory/8',       dot: 'bg-memory' },
  { text: 'text-emerald-400',  bg: 'bg-emerald-400/8',  dot: 'bg-emerald-400' },
  { text: 'text-pink-400',     bg: 'bg-pink-400/8',     dot: 'bg-pink-400' },
]

export function ConversationDetail({ detail }: ConversationDetailProps) {
  const { session, segments, speakerNames } = detail
  const title = session.title ?? 'Untitled Conversation'
  const duration = calcDuration(session.startedAt, session.finishedAt)

  // Build speaker index for consistent coloring
  const speakerIndexMap = new Map<number, number>()
  let nextIndex = 1 // 0 is reserved for user
  for (const seg of segments) {
    if (seg.isUser) {
      speakerIndexMap.set(seg.speaker, 0)
    } else if (!speakerIndexMap.has(seg.speaker)) {
      speakerIndexMap.set(seg.speaker, nextIndex++)
    }
  }

  function getSpeakerName(segment: (typeof segments)[number]): string {
    if (segment.speakerName) return segment.speakerName
    if (speakerNames[String(segment.speaker)]) return speakerNames[String(segment.speaker)]
    if (segment.isUser) return 'You'
    return segment.speakerLabel ?? `Speaker ${segment.speaker}`
  }

  function getSpeakerStyle(speaker: number) {
    const idx = speakerIndexMap.get(speaker) ?? 0
    return SPEAKER_PALETTE[idx % SPEAKER_PALETTE.length]!
  }

  // Merge consecutive same-speaker segments for cleaner reading
  const mergedSegments = mergeConsecutive(segments)

  return (
    <article>
      {/* Back button */}
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-[13px] text-muted transition-colors hover:text-text"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Stream
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start gap-3">
          {session.emoji && (
            <span className="mt-1 text-2xl">{session.emoji}</span>
          )}
          <div>
            <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-2xl)] italic leading-tight text-text">
              {title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted font-[family-name:var(--font-mono)]">
              <time dateTime={session.startedAt}>
                {formatDate(session.startedAt)} at {formatTime(session.startedAt)}
              </time>
              {duration && (
                <>
                  <span className="text-border">·</span>
                  <span>{formatDuration(duration)}</span>
                </>
              )}
              {session.category && (
                <>
                  <span className="text-border">·</span>
                  <span className="rounded-full bg-elevated px-2 py-0.5 capitalize text-sub">
                    {session.category}
                  </span>
                </>
              )}
              <span className="text-border">·</span>
              <span className="text-muted/60">{session.source}</span>
            </div>
          </div>
        </div>
      </header>

      {/* AI Summary */}
      {session.overview && (
        <section className="mb-8 rounded-xl border border-accent/15 bg-accent/[0.03] p-5">
          <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-accent/70">
            Summary
          </h2>
          <p className="text-[13px] leading-[1.7] text-sub">{session.overview}</p>
        </section>
      )}

      {/* Speaker legend */}
      {speakerIndexMap.size > 1 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {Array.from(speakerIndexMap.entries()).map(([speaker, idx]) => {
            const style = SPEAKER_PALETTE[idx % SPEAKER_PALETTE.length]!
            const name = segments.find(s => s.speaker === speaker)
              ? getSpeakerName(segments.find(s => s.speaker === speaker)!)
              : `Speaker ${speaker}`
            return (
              <span key={speaker} className="flex items-center gap-1.5 text-[11px]">
                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                <span className={style.text}>{name}</span>
              </span>
            )
          })}
        </div>
      )}

      {/* Transcript */}
      <section>
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted/60">
          Transcript
          <span className="ml-2 font-normal">({segments.length})</span>
        </h2>

        <div className="space-y-1">
          {mergedSegments.length > 0 ? (
            mergedSegments.map((segment, i) => {
              const style = getSpeakerStyle(segment.speaker)
              const name = getSpeakerName(segment)

              return (
                <div key={i} className={`group flex gap-3 rounded-lg px-3 py-2 transition-colors hover:${style.bg}`}>
                  {/* Speaker */}
                  <div className="w-20 shrink-0 pt-0.5 text-right">
                    <span className={`text-[11px] font-medium ${style.text}`}>
                      {name}
                    </span>
                  </div>

                  {/* Divider dot */}
                  <div className="mt-2 flex shrink-0">
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}/40`} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-[1.7] text-text/90">{segment.text}</p>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="py-8 text-center text-sm italic text-muted">No transcript available</p>
          )}
        </div>
      </section>
    </article>
  )
}

/**
 * Merge consecutive segments from the same speaker for cleaner reading.
 */
function mergeConsecutive(segments: ConversationDetailType['segments']) {
  if (segments.length === 0) return []

  const merged: Array<{
    speaker: number
    speakerLabel: string
    isUser: number
    text: string
    startTime: number
    endTime: number
    speakerName: string | null
  }> = []

  let current = { ...segments[0]! }

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i]!
    if (seg.speaker === current.speaker) {
      current = {
        ...current,
        text: current.text + ' ' + seg.text,
        endTime: seg.endTime,
      }
    } else {
      merged.push(current)
      current = { ...seg }
    }
  }
  merged.push(current)

  return merged
}
