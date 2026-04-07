'use client'

import Link from 'next/link'
import type { SerendipityResponse } from '@/lib/api'
import { truncate } from '@/lib/format'

interface SerendipityCardProps {
  readonly data: SerendipityResponse
}

const SELF_NAMES = ['William Justin Sigmon', 'William Sigmon']

export function SerendipityCard({ data }: SerendipityCardProps) {
  const filtered = data.connections.filter(
    (connection) => !SELF_NAMES.some((name) => connection.description.includes(name)),
  )

  if (filtered.length === 0) return null

  const connection = pickFeaturedConnection(filtered)
  const allCategories = connection.conversations
    .map((conversation) => conversation.category)
    .filter((category): category is string => category !== null && category !== '')
  const uniqueCategories = [...new Set(allCategories)]
  const visibleCategories = uniqueCategories.slice(0, 5)
  const hiddenCount = uniqueCategories.length - visibleCategories.length

  return (
    <div className="mb-6 rounded-xl border border-serendipity/15 bg-serendipity/[0.02] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-serendipity/70">
          {connection.type === 'cross_category' ? 'Hidden Connection' : 'Echo Across Time'}
        </h2>
        <Link
          href="/insights"
          className="text-[10px] text-muted/40 transition-colors hover:text-serendipity"
        >
          More
        </Link>
      </div>

      <p className="text-[13px] leading-relaxed text-sub/70">{connection.description}</p>

      {connection.conversations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {connection.conversations.slice(0, 2).map((conversation, index) => (
            <Link
              key={`${conversation.id}-${index}`}
              href={`/conversation/${conversation.id}`}
              className="rounded-md bg-serendipity/8 px-2.5 py-1 text-[11px] text-serendipity/60 transition-colors hover:bg-serendipity/15 hover:text-serendipity"
            >
              {truncate(conversation.title ?? 'Untitled', 45)}
            </Link>
          ))}
        </div>
      )}

      {visibleCategories.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {visibleCategories.map((category) => (
            <span
              key={category}
              className="rounded bg-surface/20 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted/50"
            >
              {category}
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

function pickFeaturedConnection(connections: readonly SerendipityResponse['connections'][number][]) {
  const sample = connections.slice(0, 5)
  const ranked = sample.toSorted((left, right) => {
    const leftScore = stableScore(left.description)
    const rightScore = stableScore(right.description)
    return leftScore - rightScore
  })

  return ranked[0] ?? connections[0]!
}

function stableScore(value: string): number {
  let hash = 0
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % 2147483647
  }
  return hash
}
