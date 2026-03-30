'use client'

import type { DigestResponse } from '@/lib/api'
import { formatNumber } from '@/lib/format'

interface WeeklyPulseProps {
  readonly digest: DigestResponse
}

export function WeeklyPulse({ digest }: WeeklyPulseProps) {
  return (
    <div className="mb-6 flex items-center gap-4 rounded-xl border border-accent/10 bg-accent/[0.02] px-5 py-3">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent/50">This week</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-sub/60 font-[family-name:var(--font-mono)]">
        <span><strong className="text-text/80">{formatNumber(digest.conversationCount)}</strong> convos</span>
        <span><strong className="text-text/80">{formatNumber(digest.memoryCount)}</strong> memories</span>
        {digest.topPeople?.[0] && (
          <span>top: <strong className="text-text/80">{digest.topPeople[0].name.split(' ')[0]}</strong></span>
        )}
      </div>
    </div>
  )
}
