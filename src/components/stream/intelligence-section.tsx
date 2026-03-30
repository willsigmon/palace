'use client'

import { useState } from 'react'
import type { DigestResponse, OnThisDayResponse, SerendipityResponse } from '@/lib/api'
import { WeeklyPulse } from './weekly-pulse'
import { OnThisDayCard } from './on-this-day-card'
import { SerendipityCard } from './serendipity-card'

interface IntelligenceSectionProps {
  readonly digest: DigestResponse | null
  readonly onThisDay: OnThisDayResponse | null
  readonly serendipity: SerendipityResponse | null
}

export function IntelligenceSection({ digest, onThisDay, serendipity }: IntelligenceSectionProps) {
  const [expanded, setExpanded] = useState(true)

  const hasContent = digest !== null || onThisDay !== null || serendipity !== null
  if (!hasContent) return null

  return (
    <div className="mb-2">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="mb-3 flex w-full items-center gap-2 text-left group"
        aria-expanded={expanded}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted/50 group-hover:text-sub transition-colors font-[family-name:var(--font-mono)]">
          Intelligence
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-border/20 to-transparent" />
        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-muted/40 transition-transform duration-200 group-hover:text-sub ${expanded ? 'rotate-0' : '-rotate-90'}`}
        >
          <path d="M2 4.5L6 8L10 4.5" />
        </svg>
      </button>

      {/* Collapsible content */}
      {expanded && (
        <div>
          {digest && <WeeklyPulse digest={digest} />}
          {onThisDay && <OnThisDayCard data={onThisDay} />}
          {serendipity && <SerendipityCard data={serendipity} />}
        </div>
      )}
    </div>
  )
}
