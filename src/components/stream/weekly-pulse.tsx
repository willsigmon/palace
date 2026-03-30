'use client'

import type { DigestResponse } from '@/lib/api'
import { formatNumber } from '@/lib/format'
import { Avatar } from '@/components/ui/avatar'

interface WeeklyPulseProps {
  readonly digest: DigestResponse
}

export function WeeklyPulse({ digest }: WeeklyPulseProps) {
  const topPerson = digest.topPeople?.[0]
  const topCategory = digest.topCategories?.[0]

  return (
    <div className="mb-6 rounded-xl border border-accent/10 bg-accent/[0.02] px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent/50">This week</span>
        <div className="h-px flex-1 bg-accent/10" />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-[20px] font-semibold text-accent">{formatNumber(digest.conversationCount)}</span>
          <span className="text-sub/50">conversations</span>
        </div>
        <div className="h-5 w-px bg-border/20" />
        <div className="flex items-center gap-2">
          <span className="text-[20px] font-semibold text-memory">{formatNumber(digest.memoryCount)}</span>
          <span className="text-sub/50">memories</span>
        </div>
        {topPerson && (
          <>
            <div className="h-5 w-px bg-border/20" />
            <div className="flex items-center gap-2">
              <Avatar name={topPerson.name} size="sm" />
              <div>
                <span className="text-[11px] font-medium text-text/80">{topPerson.name.split(' ')[0]}</span>
                <span className="ml-1 text-[10px] text-muted/40 font-[family-name:var(--font-mono)]">{topPerson.count}x</span>
              </div>
            </div>
          </>
        )}
        {topCategory && (
          <>
            <div className="h-5 w-px bg-border/20" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-sub/50">top:</span>
              <span className="rounded-full bg-elevated/40 px-2 py-0.5 text-[10px] font-medium text-text/60 capitalize">
                {topCategory.category}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
