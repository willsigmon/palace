'use client'

import { useState, useEffect, useRef } from 'react'
import type { DigestResponse, OnThisDayResponse, SerendipityResponse } from '@/lib/api'
import { getRandomConversation } from '@/lib/api'
import { OnThisDayCard } from './on-this-day-card'
import { SerendipityCard } from './serendipity-card'
import { formatNumber } from '@/lib/format'

interface DailyRitualProps {
  readonly digest: DigestResponse | null
  readonly onThisDay: OnThisDayResponse | null
  readonly serendipity: SerendipityResponse | null
}

/**
 * Daily Ritual — inline intelligence cards shown on Timeline.
 * No gate, no full-screen overlay. Just useful content.
 */
export function DailyRitual({ digest, onThisDay, serendipity }: DailyRitualProps) {
  const [quote, setQuote] = useState<string | null>(null)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    getRandomConversation()
      .then((c) => {
        if (c?.overview) setQuote(c.overview)
      })
      .catch(() => {})
  }, [])

  const hasContent = quote || onThisDay || serendipity || digest

  if (!hasContent) return null

  return (
    <div className="mb-6 space-y-3">
      {/* Random memory quote */}
      {quote && (
        <div className="rounded-xl border border-border/20 bg-surface/10 p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted/40 mb-2">From your past</p>
          <p className="text-[13px] leading-relaxed text-sub/70 italic">
            &ldquo;{quote.length > 200 ? quote.slice(0, 200).trimEnd() + '\u2026' : quote}&rdquo;
          </p>
        </div>
      )}

      {/* Intelligence cards */}
      {onThisDay && <OnThisDayCard data={onThisDay} />}
      {serendipity && <SerendipityCard data={serendipity} />}

      {/* Weekly stat */}
      {digest && (
        <div className="rounded-xl border border-border/20 bg-surface/10 px-4 py-3">
          <p className="text-[12px] text-sub/60">
            <span className="text-accent font-medium">{formatNumber(digest.conversationCount)}</span> conversations this week
            {digest.topPeople?.[0] && <> &middot; Most with {digest.topPeople[0].name.split(' ')[0]}</>}
          </p>
        </div>
      )}
    </div>
  )
}
