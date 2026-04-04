'use client'

import { useEffect, useState } from 'react'

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'latenight'

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'latenight'
}

/**
 * Returns the current time-of-day period and sets `data-time` on <html>.
 * Checks every 60s for period transitions.
 */
export function useTimeOfDay(): TimeOfDay {
  const [period, setPeriod] = useState<TimeOfDay>(getTimeOfDay)

  useEffect(() => {
    function update() {
      const next = getTimeOfDay()
      setPeriod((prev) => {
        if (prev !== next) {
          document.documentElement.setAttribute('data-time', next)
        }
        return next
      })
    }

    // Set initial attribute
    document.documentElement.setAttribute('data-time', getTimeOfDay())

    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [])

  return period
}
