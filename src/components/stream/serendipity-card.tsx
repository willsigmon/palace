'use client'

import Link from 'next/link'
import type { SerendipityResponse } from '@/lib/api'
import { truncate } from '@/lib/format'

interface SerendipityCardProps {
  readonly data: SerendipityResponse
}

const SELF_NAMES = ['William Justin Sigmon', 'William Sigmon']

export function SerendipityCard({ data }: SerendipityCardProps) {
  // Filter out connections that describe the user themselves
  const filtered = data.connections.filter(
    (c) => !SELF_NAMES.some((name) => c.description.includes(name)),
  )

  if (filtered.length === 0) return null

  // Pick one random connection to show as the daily card
  const conn = filtered[Math.floor(Math.random() * Math.min(filtered.length, 5))]!

  // Collect unique non-null categories, capped at 5 with "+N more"
  const allCategories = conn.conversations
    .map((c) => c.category)
    .filter((cat): cat is string => cat !== null && cat !== '')
  const uniqueCategories = [...new Set(allCategories)]
  const visibleCategories = uniqueCategories.slice(0, 5)
  const hiddenCount = uniqueCategories.length - visibleCategories.length

  return (
    <div className="mb-6 rounded-xl border border-serendipity/15 bg-serendipity/[0.02] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-serendipity/70">
          {conn.type === 'cross_category' ? 'Hidden Connection' : 'Echo Across Time'}
        </h2>
        <Link
          href="/insights"
          className="text-[10px] text-muted/40 hover:text-serendipity transition-colors"
        >
          More
        </Link>
      </div>

      <p className="text-[13px] leading-relaxed text-sub/70">{conn.description}</p>

      {conn.conversations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {conn.conversations.slice(0, 2).map((c) => (
            <Link
              key={c.id}
              href={`/conversation/${c.id}`}
              className="rounded-md bg-serendipity/8 px-2.5 py-1 text-[11px] text-serendipity/60 transition-colors hover:bg-serendipity/15 hover:text-serendipity"
            >
              {truncate(c.title ?? 'Untitled', 45)}
            </Link>
          ))}
        </div>
      )}

      {visibleCategories.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {visibleCategories.map((cat) => (
            <span
              key={cat}
              className="rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted/50 bg-surface/20"
            >
              {cat}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="rounded px-1.5 py-0.5 text-[9px] font-medium text-muted/40">
              +{hiddenCount} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
