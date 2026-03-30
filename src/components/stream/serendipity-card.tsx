'use client'

import Link from 'next/link'
import type { SerendipityResponse } from '@/lib/api'
import { truncate } from '@/lib/format'

interface SerendipityCardProps {
  readonly data: SerendipityResponse
}

export function SerendipityCard({ data }: SerendipityCardProps) {
  if (data.connections.length === 0) return null

  // Pick one random connection to show as the daily card
  const conn = data.connections[Math.floor(Math.random() * Math.min(data.connections.length, 5))]!

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
    </div>
  )
}
