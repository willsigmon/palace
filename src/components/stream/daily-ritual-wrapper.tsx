'use client'

import { useState, useEffect, useRef } from 'react'
import type { DigestResponse, OnThisDayResponse, SerendipityResponse } from '@/lib/api'
import { getSerendipity } from '@/lib/api'
import { DailyRitual } from './daily-ritual'

interface DailyRitualWrapperProps {
  readonly digest: DigestResponse | null
  readonly onThisDay: OnThisDayResponse | null
}

/**
 * Client wrapper that fetches serendipity and renders the daily ritual.
 * Separated so the parent server component stays async.
 */
export function DailyRitualWrapper({ digest, onThisDay }: DailyRitualWrapperProps) {
  const [serendipity, setSerendipity] = useState<SerendipityResponse | null>(null)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    getSerendipity().then(setSerendipity).catch(() => {})
  }, [])

  return (
    <DailyRitual
      digest={digest}
      onThisDay={onThisDay}
      serendipity={serendipity}
    />
  )
}
