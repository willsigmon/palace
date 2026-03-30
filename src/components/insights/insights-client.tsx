'use client'

import Link from 'next/link'
import type { PatternsResponse, OnThisDayResponse, SerendipityResponse, DigestResponse } from '@/lib/api'
import { formatNumber, formatRelativeTime, truncate } from '@/lib/format'

interface InsightsClientProps {
  readonly patterns: PatternsResponse | null
  readonly onThisDay: OnThisDayResponse | null
  readonly serendipity: SerendipityResponse | null
  readonly digest: DigestResponse | null
}

export function InsightsClient({ patterns, onThisDay, serendipity, digest }: InsightsClientProps) {
  return (
    <div>
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
          Insights
        </h1>
        <p className="mt-1.5 text-sm text-sub">
          Patterns, serendipity, and synthesis from your life data.
        </p>
      </header>

      <div className="space-y-8">
        {/* Weekly Digest */}
        {digest && <WeeklyDigest digest={digest} />}

        {/* On This Day */}
        {onThisDay && onThisDay.memories.length > 0 && <OnThisDay data={onThisDay} />}

        {/* Serendipity */}
        {serendipity && serendipity.connections.length > 0 && <Serendipity data={serendipity} />}

        {/* Patterns */}
        {patterns && <Patterns data={patterns} />}
      </div>
    </div>
  )
}

function WeeklyDigest({ digest }: { digest: DigestResponse }) {
  return (
    <section className="rounded-xl border border-accent/15 bg-accent/[0.02] p-6">
      <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-accent/70">
        This Week
      </h2>

      {/* Stats row */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat value={formatNumber(digest.conversationCount)} label="conversations" />
        <MiniStat value={formatNumber(digest.memoryCount)} label="memories" />
        <MiniStat
          value={digest.topCategories[0]?.category ?? '-'}
          label="top category"
        />
        <MiniStat
          value={digest.topPeople?.[0]?.name?.split(' ')[0] ?? '-'}
          label="most talked to"
        />
      </div>

      {/* Top people */}
      {digest.topPeople && digest.topPeople.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted/60">People this week</p>
          <div className="flex flex-wrap gap-2">
            {digest.topPeople.map((p) => (
              <span key={p.name} className="rounded-full bg-elevated/60 px-2.5 py-1 text-[11px] text-sub">
                {p.name} <span className="text-muted/50">({p.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Highlights */}
      {digest.highlights.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted/60">Highlights</p>
          <div className="space-y-2">
            {digest.highlights.map((h) => (
              <Link
                key={h.id}
                href={`/conversation/${h.id}`}
                className="group block rounded-lg border border-border/20 bg-surface/20 px-4 py-2.5 transition-all hover:border-border/40 hover:bg-surface/40"
              >
                <p className="text-[13px] font-medium text-text group-hover:text-accent transition-colors">
                  {h.title}
                </p>
                <p className="mt-0.5 text-[11px] text-sub/50">{truncate(h.overview, 100)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function OnThisDay({ data }: { data: OnThisDayResponse }) {
  return (
    <section className="rounded-xl border border-memory/15 bg-memory/[0.02] p-6">
      <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-memory/70">
        On This Day
      </h2>

      <div className="space-y-5">
        {data.memories.map((period) => (
          <div key={period.period}>
            <p className="mb-2 text-xs font-medium text-memory/50">{period.period}</p>
            {period.conversations.length > 0 ? (
              <div className="space-y-1.5">
                {period.conversations.slice(0, 3).map((c) => (
                  <Link
                    key={c.id}
                    href={`/conversation/${c.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-border/20 bg-surface/20 px-4 py-2.5 transition-all hover:border-memory/30 hover:bg-surface/40"
                  >
                    {c.emoji && <span className="text-sm">{c.emoji}</span>}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-text group-hover:text-memory transition-colors truncate">
                        {c.title ?? 'Untitled'}
                      </p>
                      {c.category && (
                        <span className="text-[10px] text-muted/40">{c.category}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted/40 italic">
                {period.memoryCount} memories recorded, no titled conversations
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function Serendipity({ data }: { data: SerendipityResponse }) {
  return (
    <section className="rounded-xl border border-serendipity/15 bg-serendipity/[0.02] p-6">
      <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-serendipity/70">
        Serendipity
      </h2>
      <p className="mb-4 text-[12px] text-sub/60">
        Surprising connections between your conversations.
      </p>

      <div className="space-y-4">
        {data.connections.slice(0, 6).map((conn, i) => (
          <div key={i} className="rounded-lg border border-border/20 bg-surface/20 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider ${
                conn.type === 'cross_category'
                  ? 'bg-serendipity/15 text-serendipity'
                  : 'bg-pattern/15 text-pattern'
              }`}>
                {conn.type === 'cross_category' ? 'Bridge' : 'Echo'}
              </span>
            </div>
            <p className="text-[12px] leading-relaxed text-sub/80">{conn.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {conn.conversations.slice(0, 3).map((c) => (
                <Link
                  key={c.id}
                  href={`/conversation/${c.id}`}
                  className="rounded-md bg-elevated/40 px-2 py-1 text-[10px] text-muted hover:text-accent transition-colors"
                >
                  {truncate(c.title ?? 'Untitled', 40)}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Patterns({ data }: { data: PatternsResponse }) {
  return (
    <section className="rounded-xl border border-pattern/15 bg-pattern/[0.02] p-6">
      <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-pattern/70">
        Patterns
      </h2>

      {/* Top people */}
      {data.topPeople.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted/60">
            People in your conversations (90 days)
          </p>
          <div className="space-y-1.5">
            {data.topPeople.filter(p => p.name !== 'William Justin Sigmon').slice(0, 8).map((p) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-28 text-[12px] text-text truncate">{p.name}</span>
                <div className="flex-1 h-2 rounded-full bg-elevated/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-pattern/40"
                    style={{ width: `${Math.min(100, (p.conversation_count / (data.topPeople[1]?.conversation_count || 1)) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[10px] text-muted font-[family-name:var(--font-mono)]">
                  {p.conversation_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly energy */}
      {data.hourlyEnergy.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted/60">
            When you talk most
          </p>
          <div className="flex items-end gap-[2px] h-24">
            {Array.from({ length: 24 }, (_, h) => {
              const entry = data.hourlyEnergy.find(e => e.hour === h)
              const count = entry?.count ?? 0
              const max = Math.max(...data.hourlyEnergy.map(e => e.count))
              const height = max > 0 ? (count / max) * 100 : 0
              return (
                <div key={h} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t-sm bg-pattern/50 transition-all"
                    style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                    title={`${h}:00 — ${count} conversations`}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-muted/30">12am</span>
            <span className="text-[8px] text-muted/30">6am</span>
            <span className="text-[8px] text-muted/30">12pm</span>
            <span className="text-[8px] text-muted/30">6pm</span>
            <span className="text-[8px] text-muted/30">12am</span>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {data.recurringTopics.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted/60">
            Recurring categories
          </p>
          <div className="flex flex-wrap gap-2">
            {data.recurringTopics.slice(0, 10).map((t) => (
              <span key={t.category} className="rounded-full bg-elevated/40 px-2.5 py-1 text-[11px] text-sub">
                {t.category} <span className="text-muted/40">{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-accent">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted/50">{label}</p>
    </div>
  )
}
