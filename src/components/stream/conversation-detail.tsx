'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { ConversationDetail as ConversationDetailType, ConversationListItem, Memory } from '@/types/api'
import { formatDate, formatTime, formatDuration, formatRelativeTime, calcDuration, truncate } from '@/lib/format'
import { getEnrichment } from '@/lib/api'
import type { SpeakerSuggestionsResponse } from '@/lib/api'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/toast'

interface ConversationDetailProps {
  readonly detail: ConversationDetailType
  readonly relatedConversations?: readonly ConversationListItem[]
  readonly relatedMemories?: readonly Memory[]
  readonly speakerSuggestions?: SpeakerSuggestionsResponse | null
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

export function ConversationDetail({ detail, relatedConversations = [], relatedMemories = [], speakerSuggestions }: ConversationDetailProps) {
  const { session, segments, speakerNames } = detail
  const title = session.title ?? 'Untitled Conversation'
  const duration = calcDuration(session.startedAt, session.finishedAt)
  const [topicInfo, setTopicInfo] = useState<string | null>(null)
  const [topicLoading, setTopicLoading] = useState(false)
  const [transcriptSearch, setTranscriptSearch] = useState('')
  const { addToast } = useToast()

  // Notes state
  const NOTES_KEY = `palace-note-${session.id}`
  const [notes, setNotes] = useState('')
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(NOTES_KEY)
    if (stored !== null) setNotes(stored)
  }, [NOTES_KEY])

  const saveNotes = useCallback((value: string) => {
    localStorage.setItem(NOTES_KEY, value)
    addToast('Notes saved', 'info')
  }, [NOTES_KEY, addToast])

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value)
    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current)
    notesDebounceRef.current = setTimeout(() => saveNotes(value), 1000)
  }, [saveNotes])

  const handleNotesBlur = useCallback(() => {
    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current)
    saveNotes(notes)
  }, [notes, saveNotes])

  const lookUpTopic = useCallback(async () => {
    if (!session.title) return
    setTopicLoading(true)
    try {
      const result = await getEnrichment(session.title, 'thing')
      setTopicInfo(result.content)
    } catch {
      setTopicInfo('Could not look up this topic.')
    } finally {
      setTopicLoading(false)
    }
  }, [session.title])

  // Derived stats
  const wordCount = segments.reduce((acc, seg) => acc + seg.text.split(/\s+/).filter(Boolean).length, 0)
  const uniqueSpeakers = new Set(segments.map((s) => s.speaker)).size
  const readMinutes = Math.max(1, Math.round(wordCount / 200))

  const handleCopyTranscript = useCallback(async () => {
    const text = segments
      .map((seg) => {
        const name = seg.speakerName ?? speakerNames[String(seg.speaker)] ?? (seg.isUser ? 'You' : (seg.speakerLabel ?? `Speaker ${seg.speaker}`))
        return `${name}: ${seg.text}`
      })
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      addToast('Transcript copied to clipboard')
    } catch {
      addToast('Failed to copy', 'error')
    }
  }, [segments, speakerNames, addToast])

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      addToast('Link copied')
    } catch {
      addToast('Failed to copy link', 'error')
    }
  }, [addToast])

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

  // Transcript search derived values
  const searchTerm = transcriptSearch.trim().toLowerCase()
  const matchCount = searchTerm
    ? mergedSegments.reduce((acc, seg) => {
        const text = seg.text.toLowerCase()
        let count = 0
        let pos = 0
        while ((pos = text.indexOf(searchTerm, pos)) !== -1) {
          count++
          pos += searchTerm.length
        }
        return acc + count
      }, 0)
    : 0

  function highlightText(text: string): React.ReactNode {
    if (!searchTerm) return text
    const parts: React.ReactNode[] = []
    const lower = text.toLowerCase()
    let last = 0
    let pos = 0
    let key = 0
    while ((pos = lower.indexOf(searchTerm, last)) !== -1) {
      if (pos > last) parts.push(text.slice(last, pos))
      parts.push(
        <mark key={key++} className="bg-accent/30 text-text rounded-sm px-0.5">
          {text.slice(pos, pos + searchTerm.length)}
        </mark>
      )
      last = pos + searchTerm.length
    }
    if (last < text.length) parts.push(text.slice(last))
    return <>{parts}</>
  }

  return (
    <article>
      {/* Back button */}
      <Breadcrumb items={[
        { label: 'Stream', href: '/' },
        ...(session.category ? [{ label: session.category, href: `/?category=${session.category}` }] : []),
        { label: truncate(title, 40) },
      ]} />

      {/* Header */}
      <header className="group mb-8">
        <div className="flex items-start gap-3">
          {session.emoji && (
            <span className="mt-1 text-2xl">{session.emoji}</span>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-2xl)] italic leading-tight text-text">
              {title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted font-[family-name:var(--font-mono)]">
              <time dateTime={session.startedAt}>
                {formatDate(session.startedAt)} at {formatTime(session.startedAt)}
              </time>
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

              {/* Share button — visible on header hover */}
              <button
                onClick={handleShare}
                className="ml-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted/40 opacity-0 transition-all group-hover:opacity-100 hover:text-muted hover:bg-elevated"
                aria-label="Copy link"
              >
                <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 7H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2z" />
                  <path d="M9 7V5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-2" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="mb-6 flex items-center gap-0 rounded-lg border border-border/20 bg-surface/10 text-[11px] font-[family-name:var(--font-mono)] text-muted/60 overflow-hidden">
        <div className="flex flex-col items-center px-4 py-2.5 flex-1">
          <span className="text-[15px] font-medium text-sub/80 tabular-nums">{wordCount.toLocaleString()}</span>
          <span className="mt-0.5 text-[9px] uppercase tracking-widest">words</span>
        </div>
        <div className="w-px self-stretch bg-border/20" />
        <div className="flex flex-col items-center px-4 py-2.5 flex-1">
          <span className="text-[15px] font-medium text-sub/80 tabular-nums">{uniqueSpeakers}</span>
          <span className="mt-0.5 text-[9px] uppercase tracking-widest">{uniqueSpeakers === 1 ? 'speaker' : 'speakers'}</span>
        </div>
        <div className="w-px self-stretch bg-border/20" />
        <div className="flex flex-col items-center px-4 py-2.5 flex-1">
          <span className="text-[15px] font-medium text-sub/80 tabular-nums">
            {duration ? formatDuration(duration) : '—'}
          </span>
          <span className="mt-0.5 text-[9px] uppercase tracking-widest">duration</span>
        </div>
        <div className="w-px self-stretch bg-border/20" />
        <div className="flex flex-col items-center px-4 py-2.5 flex-1">
          <span className="text-[15px] font-medium text-sub/80 tabular-nums">{readMinutes}</span>
          <span className="mt-0.5 text-[9px] uppercase tracking-widest">min read</span>
        </div>
      </div>

      {/* Location + Speaker Suggestions */}
      {speakerSuggestions?.location && (
        <div className="mb-6 rounded-xl border border-pattern/15 bg-pattern/[0.02] p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-pattern/60">
              <path d="M10 2C7 2 4 5 4 8.5C4 13 10 18 10 18S16 13 16 8.5C16 5 13 2 10 2Z" />
              <circle cx="10" cy="8.5" r="2" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-pattern/60">
              {speakerSuggestions.location.label ?? 'Unknown Location'}
            </span>
            <span className="text-[9px] text-muted/30 font-[family-name:var(--font-mono)]">
              {speakerSuggestions.location.lat.toFixed(4)}, {speakerSuggestions.location.lon.toFixed(4)}
            </span>
          </div>
          {speakerSuggestions.suggestions.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] text-muted/40">Who might be here:</p>
              <div className="flex flex-wrap gap-2">
                {speakerSuggestions.suggestions.map((s) => (
                  <Link
                    key={s.person_id}
                    href={`/people/${s.person_id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-pattern/8 px-3 py-1 text-[11px] text-pattern/70 transition-colors hover:bg-pattern/15 hover:text-pattern"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-pattern/40" />
                    {s.name}
                    <span className="text-[9px] text-muted/30">{Math.round(s.confidence * 100)}%</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Summary */}
      {session.overview && (
        <section className="mb-8 rounded-xl border border-accent/15 bg-accent/[0.03] p-5">
          <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-accent/70">
            Summary
          </h2>
          <p className="text-[13px] leading-[1.7] text-sub">{session.overview}</p>
        </section>
      )}

      {/* Topic enrichment */}
      {session.title && session.title !== 'Untitled' && (
        <div className="mb-6">
          {topicInfo ? (
            <div className="rounded-xl border border-serendipity/15 bg-serendipity/[0.02] p-5">
              <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-serendipity/70">
                Context
              </h2>
              <div className="text-[12px] leading-[1.7] text-sub/70 whitespace-pre-wrap">{topicInfo}</div>
            </div>
          ) : (
            <button
              onClick={lookUpTopic}
              disabled={topicLoading}
              className="flex items-center gap-2 rounded-lg bg-serendipity/8 px-3 py-1.5 text-[11px] font-medium text-serendipity/70 transition-colors hover:bg-serendipity/15 disabled:opacity-50"
            >
              {topicLoading ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border border-serendipity/30 border-t-serendipity" />
                  Looking up...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="9" cy="9" r="5" />
                    <path d="M13 13l4 4" />
                  </svg>
                  Look up topic with Perplexity
                </>
              )}
            </button>
          )}
        </div>
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
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted/60">
            Transcript
            <span className="ml-2 font-normal">({segments.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            {searchTerm && (
              <span className="text-[10px] text-muted/40 font-[family-name:var(--font-mono)] shrink-0">
                {matchCount} {matchCount === 1 ? 'match' : 'matches'}
              </span>
            )}
            <input
              type="search"
              value={transcriptSearch}
              onChange={(e) => setTranscriptSearch(e.target.value)}
              placeholder="Search transcript…"
              className="w-36 rounded-lg border border-border/30 bg-surface/20 px-2.5 py-1 text-[11px] text-text placeholder:text-muted/40 outline-none transition-all focus:border-accent/40 focus:w-48"
            />
            <div className="relative shrink-0">
              <button
                onClick={handleCopyTranscript}
                title="Copy transcript"
                className="flex items-center justify-center rounded-lg border border-border/30 bg-surface/20 p-1.5 text-muted/50 transition-colors hover:border-border/50 hover:text-muted"
              >
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="7" y="4" width="10" height="13" rx="1.5" />
                  <path d="M7 7H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {mergedSegments.length > 0 ? (
            mergedSegments.map((segment, i) => {
              const style = getSpeakerStyle(segment.speaker)
              const name = getSpeakerName(segment)
              const isLinkableSpeaker = !!segment.speakerName && segment.speakerName !== 'You'

              return (
                <div key={i} className={`group flex gap-3 rounded-lg px-3 py-2.5 transition-colors hover:${style.bg}`}>
                  {/* Speaker avatar + name */}
                  <div className="flex shrink-0 flex-col items-center gap-1 w-16 pt-0.5">
                    <Avatar name={name} size="sm" />
                    {isLinkableSpeaker ? (
                      <Link
                        href={`/people?q=${encodeURIComponent(segment.speakerName!)}`}
                        className={`text-[10px] font-medium ${style.text} hover:underline text-center leading-tight`}
                      >
                        {name.split(' ')[0]}
                      </Link>
                    ) : (
                      <span className={`text-[10px] font-medium ${style.text} text-center leading-tight`}>
                        {name.split(' ')[0]}
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[13px] leading-[1.7] text-text/90">{highlightText(segment.text)}</p>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="py-8 text-center text-sm italic text-muted">No transcript available</p>
          )}
        </div>
      </section>

      {/* Notes */}
      <section className="mt-10 border-t border-border/20 pt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted/60">
            Notes
          </h2>
        </div>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Add your notes about this conversation..."
          rows={4}
          className="w-full resize-y rounded-xl border border-border/20 bg-surface/10 px-4 py-3 text-[13px] leading-[1.7] text-text placeholder:text-muted/30 outline-none transition-colors focus:border-accent/30 focus:bg-surface/20"
          spellCheck={false}
        />
      </section>

      {/* Related Memories */}
      {relatedMemories.length > 0 && (
        <section className="mt-10 border-t border-border/20 pt-8">
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-memory/70">
            Memories from this day
          </h2>
          <div className="space-y-2">
            {relatedMemories.map((m) => (
              <div key={m.id} className="rounded-lg border border-memory/10 bg-memory/[0.02] px-4 py-2.5">
                <p className="text-[12px] leading-relaxed text-sub/80">{truncate(m.content, 200)}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  {m.sourceApp && (
                    <span className="text-[9px] text-muted/50">{m.sourceApp}</span>
                  )}
                  <time className="text-[9px] text-muted/40 font-[family-name:var(--font-mono)]">
                    {formatRelativeTime(m.createdAt)}
                  </time>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Conversations */}
      {relatedConversations.length > 0 && (
        <section className="mt-8 border-t border-border/20 pt-8">
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-serendipity/70">
            Related conversations
          </h2>
          <div className="space-y-2">
            {relatedConversations.map((c) => (
              <Link
                key={c.id}
                href={`/conversation/${c.id}`}
                className="group flex items-center justify-between rounded-lg border border-border/20 bg-surface/20 px-4 py-3 transition-all hover:border-border/40 hover:bg-surface/40"
              >
                <div>
                  <p className="text-[13px] font-medium text-text group-hover:text-accent transition-colors">
                    {c.title ?? 'Untitled'}
                  </p>
                  {c.overview && (
                    <p className="mt-0.5 text-[11px] text-sub/50">{truncate(c.overview, 80)}</p>
                  )}
                </div>
                <time className="shrink-0 ml-3 text-[10px] text-muted/40 font-[family-name:var(--font-mono)]">
                  {formatRelativeTime(c.startedAt)}
                </time>
              </Link>
            ))}
          </div>
        </section>
      )}
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
