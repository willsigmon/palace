'use client'

import Link from 'next/link'
import { parseTimestamp, formatTime, truncate } from '@/lib/format'

interface TimelineEvent {
  readonly time: string
  readonly type: string
  readonly data: {
    readonly id?: number
    readonly title?: string | null
    readonly overview?: string | null
    readonly content?: string | null
    readonly category?: string | null
    readonly startedAt?: string
    readonly label?: string
  }
}

interface DayTimelineProps {
  readonly date: string
  readonly events: readonly TimelineEvent[]
}

const TYPE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  conversation: { color: 'text-accent', icon: 'C', label: 'Conversation' },
  memory: { color: 'text-memory', icon: 'M', label: 'Memory' },
  location: { color: 'text-serendipity', icon: 'L', label: 'Location' },
  action_item: { color: 'text-pattern', icon: 'A', label: 'Action' },
}

function getHourLabel(timeStr: string): string {
  const date = parseTimestamp(timeStr)
  const hour = date.getHours()
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

function formatDateHeading(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year!, month! - 1, day!)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getPrevDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y!, m! - 1, d!)
  date.setDate(date.getDate() - 1)
  return date.toISOString().slice(0, 10)
}

function getNextDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y!, m! - 1, d!)
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

export function DayTimeline({ date, events }: DayTimelineProps) {
  // Group events by hour
  const hourGroups = new Map<string, TimelineEvent[]>()
  for (const event of events) {
    const hour = getHourLabel(event.time)
    const existing = hourGroups.get(hour)
    if (existing) {
      existing.push(event)
    } else {
      hourGroups.set(hour, [event])
    }
  }

  return (
    <article>
      {/* Navigation */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href={`/day/${getPrevDate(date)}`}
          className="flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-text"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Previous
        </Link>

        <Link href="/" className="text-[11px] text-muted hover:text-text transition-colors font-[family-name:var(--font-mono)]">
          Stream
        </Link>

        <Link
          href={`/day/${getNextDate(date)}`}
          className="flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-text"
        >
          Next
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {/* Header */}
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-2xl)] italic text-text">
          {formatDateHeading(date)}
        </h1>
        <p className="mt-1 text-xs text-muted font-[family-name:var(--font-mono)]">
          {events.length} events
        </p>
      </header>

      {/* Timeline */}
      {events.length > 0 ? (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[59px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border/40 to-transparent" />

          <div className="space-y-1">
            {Array.from(hourGroups.entries()).map(([hour, hourEvents]) => (
              <div key={hour} className="flex gap-4">
                {/* Hour label */}
                <div className="w-14 shrink-0 pt-2 text-right">
                  <span className="text-[11px] text-muted/50 font-[family-name:var(--font-mono)]">
                    {hour}
                  </span>
                </div>

                {/* Events */}
                <div className="flex-1 space-y-1.5 py-1">
                  {hourEvents.map((event, i) => {
                    const config = TYPE_CONFIG[event.type] ?? { color: 'text-sub', icon: '?', label: event.type }
                    const title = event.data.title ?? event.data.content ?? event.data.label ?? 'Untitled'
                    const isConversation = event.type === 'conversation' && event.data.id

                    const content = (
                      <div className="group flex items-start gap-3 rounded-lg border border-border/20 bg-surface/30 px-4 py-3 transition-all hover:border-border/40 hover:bg-surface/50">
                        {/* Type indicator */}
                        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevated text-[10px] font-bold ${config.color}`}>
                          {config.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-semibold uppercase tracking-widest ${config.color}`}>
                              {config.label}
                            </span>
                            <time className="text-[10px] text-muted/50 font-[family-name:var(--font-mono)]">
                              {formatTime(event.time)}
                            </time>
                          </div>
                          <p className="mt-0.5 text-sm text-text group-hover:text-accent transition-colors">
                            {truncate(typeof title === 'string' ? title : '', 100)}
                          </p>
                          {event.data.overview && (
                            <p className="mt-1 text-[12px] leading-relaxed text-sub/60">
                              {truncate(event.data.overview, 150)}
                            </p>
                          )}
                        </div>
                      </div>
                    )

                    if (isConversation) {
                      return (
                        <Link key={`${event.type}-${event.data.id}-${i}`} href={`/conversation/${event.data.id}`}>
                          {content}
                        </Link>
                      )
                    }

                    return <div key={`${event.type}-${i}`}>{content}</div>
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="font-[family-name:var(--font-serif)] text-xl italic text-sub">
            No events recorded
          </p>
          <p className="mt-1 text-sm text-muted">Nothing captured on this day</p>
        </div>
      )}
    </article>
  )
}
