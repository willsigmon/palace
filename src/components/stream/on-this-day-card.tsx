'use client'

import Link from 'next/link'
import type { OnThisDayResponse } from '@/lib/api'
import { truncate } from '@/lib/format'

interface OnThisDayCardProps {
  readonly data: OnThisDayResponse
}

export function OnThisDayCard({ data }: OnThisDayCardProps) {
  if (data.memories.length === 0) return null

  // Pick the most interesting period (most conversations)
  const best = data.memories.reduce((a, b) =>
    b.conversations.length > a.conversations.length ? b : a
  )

  if (best.conversations.length === 0 && best.memoryCount === 0) return null

  const topConvo = best.conversations[0]

  return (
    <div className="mb-6 rounded-xl border border-memory/20 bg-memory/[0.03] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-memory/70">
          On This Day — {best.period}
        </h2>
        <Link
          href="/insights"
          className="text-[10px] text-muted/40 hover:text-memory transition-colors"
        >
          See all
        </Link>
      </div>

      {topConvo ? (
        <Link
          href={`/conversation/${topConvo.id}`}
          className="group flex items-start gap-3"
        >
          {topConvo.emoji && <span className="mt-0.5 text-lg">{topConvo.emoji}</span>}
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium text-text group-hover:text-memory transition-colors">
              {topConvo.title ?? 'Untitled'}
            </p>
            {topConvo.overview && (
              <p className="mt-1 text-[12px] leading-relaxed text-sub/60">
                {truncate(topConvo.overview, 120)}
              </p>
            )}
          </div>
        </Link>
      ) : (
        <p className="text-[12px] text-sub/50">
          {best.memoryCount} memories were captured on this day
        </p>
      )}

      {best.conversations.length > 1 && (
        <p className="mt-2 text-[10px] text-muted/40">
          +{best.conversations.length - 1} more conversation{best.conversations.length > 2 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
