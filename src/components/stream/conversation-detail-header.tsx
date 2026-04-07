import type { ConversationSession } from '@/types/api'
import { formatDate, formatDuration, formatTime, truncate } from '@/lib/format'
import type { SpeakerSuggestionsResponse } from '@/lib/api'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import Link from 'next/link'

interface ConversationDetailHeaderProps {
  readonly session: ConversationSession
  readonly title: string
  readonly duration: number | null
  readonly wordCount: number
  readonly uniqueSpeakers: number
  readonly readMinutes: number
  readonly speakerSuggestions?: SpeakerSuggestionsResponse | null
  readonly onShare: () => void
}

export function ConversationDetailHeader({
  session,
  title,
  duration,
  wordCount,
  uniqueSpeakers,
  readMinutes,
  speakerSuggestions,
  onShare,
}: ConversationDetailHeaderProps) {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Stream', href: '/' },
        ...(session.category ? [{ label: session.category, href: `/?category=${session.category}` }] : []),
        { label: truncate(title, 40) },
      ]} />

      <header className="group mb-8">
        <div className="flex items-start gap-3">
          {session.emoji && (
            <span className="mt-1 text-2xl">{session.emoji}</span>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-text">{title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted font-[family-name:var(--font-mono)]">
              <time dateTime={session.startedAt}>
                {formatDate(session.startedAt)} at {formatTime(session.startedAt)}
              </time>
              {session.category && (
                <>
                  <span className="text-border">·</span>
                  <span className="rounded-full bg-elevated px-2 py-0.5 capitalize text-sub">{session.category}</span>
                </>
              )}
              <span className="text-border">·</span>
              <span className="text-muted/60">{session.source}</span>
              <button
                onClick={onShare}
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
          <span className="text-[15px] font-medium text-sub/80 tabular-nums">{duration ? formatDuration(duration) : '—'}</span>
          <span className="mt-0.5 text-[9px] uppercase tracking-widest">duration</span>
        </div>
        <div className="w-px self-stretch bg-border/20" />
        <div className="flex flex-col items-center px-4 py-2.5 flex-1">
          <span className="text-[15px] font-medium text-sub/80 tabular-nums">{readMinutes}</span>
          <span className="mt-0.5 text-[9px] uppercase tracking-widest">min read</span>
        </div>
      </div>

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
                {speakerSuggestions.suggestions.map((suggestion) => (
                  <Link
                    key={suggestion.person_id}
                    href={`/people/${suggestion.person_id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-pattern/8 px-3 py-1 text-[11px] text-pattern/70 transition-colors hover:bg-pattern/15 hover:text-pattern"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-pattern/40" />
                    {suggestion.name}
                    <span className="text-[9px] text-muted/30">{Math.round(suggestion.confidence * 100)}%</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
