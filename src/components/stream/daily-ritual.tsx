'use client'

import { useState, useEffect, useRef } from 'react'
import type { DigestResponse, OnThisDayResponse, SerendipityResponse } from '@/lib/api'
import { getRandomConversation } from '@/lib/api'
import { OnThisDayCard } from './on-this-day-card'
import { SerendipityCard } from './serendipity-card'
import { formatNumber } from '@/lib/format'

const RITUAL_KEY = 'palace-last-ritual'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

interface DailyRitualProps {
  readonly digest: DigestResponse | null
  readonly onThisDay: OnThisDayResponse | null
  readonly serendipity: SerendipityResponse | null
}

/**
 * Daily Ritual — a reflective "front door" shown once per day.
 * Displays a random quote, on-this-day, serendipity, and a weekly stat
 * before dissolving to reveal the stream.
 */
export function DailyRitual({ digest, onThisDay, serendipity }: DailyRitualProps) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [quote, setQuote] = useState<string | null>(null)
  const fetched = useRef(false)

  // Check if ritual should show (once per day)
  useEffect(() => {
    const last = localStorage.getItem(RITUAL_KEY)
    if (last === todayStr()) return
    setVisible(true)
  }, [])

  // Fetch a random quote from a conversation overview
  useEffect(() => {
    if (!visible || fetched.current) return
    fetched.current = true

    getRandomConversation()
      .then((c) => {
        if (c?.overview) setQuote(c.overview)
      })
      .catch(() => {})
  }, [visible])

  function enter() {
    setExiting(true)
    localStorage.setItem(RITUAL_KEY, todayStr())
    setTimeout(() => setVisible(false), 600)
  }

  function skip() {
    localStorage.setItem(RITUAL_KEY, todayStr())
    setVisible(false)
  }

  if (!visible) return null

  const hasContent = quote || onThisDay || serendipity || digest

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center glass-heavy transition-all duration-500 ${
        exiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Skip button */}
      <button
        onClick={skip}
        className="absolute top-6 right-6 text-[11px] text-muted/40 hover:text-sub transition-colors"
      >
        Skip
      </button>

      <div className="mx-auto max-w-lg px-6 text-center space-y-8">
        {/* Title */}
        <div>
          <h1 className="gradient-text text-[length:var(--text-4xl)] font-bold font-[family-name:var(--font-serif)] italic mb-2">
            PALACE
          </h1>
          <p className="text-[11px] text-muted/50 uppercase tracking-widest">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Random quote from your past */}
        {quote && (
          <blockquote className="text-[14px] leading-relaxed text-sub/70 italic font-[family-name:var(--font-serif)] max-w-md mx-auto">
            &ldquo;{quote.length > 200 ? quote.slice(0, 200).trimEnd() + '\u2026' : quote}&rdquo;
          </blockquote>
        )}

        {/* Intelligence cards — reuse existing components */}
        <div className="text-left space-y-3">
          {onThisDay && <OnThisDayCard data={onThisDay} />}
          {serendipity && <SerendipityCard data={serendipity} />}
        </div>

        {/* Weekly stat */}
        {digest && (
          <p className="text-[12px] text-muted/50">
            {formatNumber(digest.conversationCount)} conversations this week
            {digest.topPeople?.[0] && <> &middot; Most with {digest.topPeople[0].name.split(' ')[0]}</>}
          </p>
        )}

        {/* Enter button */}
        {hasContent && (
          <button
            onClick={enter}
            className="mx-auto block rounded-xl border border-accent/20 bg-accent/5 px-8 py-3 text-[13px] font-medium text-accent transition-all duration-300 hover:bg-accent/10 hover:border-accent/40 hover:shadow-[0_0_30px_var(--color-glow)]"
          >
            Enter the Palace
          </button>
        )}

        {/* Auto-enter if no content */}
        {!hasContent && (
          <button
            onClick={enter}
            className="mx-auto block rounded-xl border border-border/20 bg-surface/10 px-8 py-3 text-[13px] text-sub transition-all hover:bg-surface/30"
          >
            Begin
          </button>
        )}
      </div>
    </div>
  )
}
