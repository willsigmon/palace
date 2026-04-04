/**
 * Formatting utilities for PALACE
 */

/**
 * Parse wsigomi's timestamp format ("2026-03-28 22:48:09.566") into a Date.
 * The API returns timestamps without timezone — they're UTC.
 */
export function parseTimestamp(dateString: string | null | undefined): Date {
  if (!dateString) return new Date(0)
  // Replace space with T and append Z for UTC
  const iso = dateString.replace(' ', 'T') + (dateString.includes('Z') ? '' : 'Z')
  const date = new Date(iso)
  return isNaN(date.getTime()) ? new Date(0) : date
}

/**
 * Calculate duration between two timestamps in seconds
 */
export function calcDuration(start: string, end: string | null): number | null {
  if (!end) return null
  const startDate = parseTimestamp(start)
  const endDate = parseTimestamp(end)
  const diff = Math.floor((endDate.getTime() - startDate.getTime()) / 1000)
  return diff > 0 ? diff : null
}

const RELATIVE_THRESHOLDS = [
  { max: 60, unit: 'second' },
  { max: 3600, unit: 'minute', divisor: 60 },
  { max: 86400, unit: 'hour', divisor: 3600 },
  { max: 604800, unit: 'day', divisor: 86400 },
  { max: 2592000, unit: 'week', divisor: 604800 },
  { max: 31536000, unit: 'month', divisor: 2592000 },
] as const

/**
 * Format a date string as relative time ("3 months ago", "last Tuesday")
 * Falls back to absolute date for >1 year
 */
export function formatRelativeTime(dateString: string): string {
  const date = parseTimestamp(dateString)
  const now = new Date()
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffSeconds < 0) return 'just now'
  if (diffSeconds < 10) return 'just now'

  for (const threshold of RELATIVE_THRESHOLDS) {
    if (diffSeconds < threshold.max) {
      const value = 'divisor' in threshold
        ? Math.floor(diffSeconds / threshold.divisor)
        : diffSeconds
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      return rtf.format(-value, threshold.unit as Intl.RelativeTimeFormatUnit)
    }
  }

  // > 1 year: show absolute
  return formatDate(dateString)
}

/**
 * Format as "March 15, 2026"
 */
export function formatDate(dateString: string): string {
  return parseTimestamp(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format as "Mar 15"
 */
export function formatDateShort(dateString: string): string {
  return parseTimestamp(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format as "9:42 AM"
 */
export function formatTime(dateString: string): string {
  return parseTimestamp(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Format duration in seconds to "12m" or "1h 23m"
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return ''
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

/**
 * Format a number with commas: 125765 -> "125,765"
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

/**
 * Truncate text to maxLength with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 1).trimEnd() + '\u2026'
}

/**
 * Memory patina — returns an age bucket for visual aging of conversation cards.
 * fresh: < 7 days, recent: 7d-6mo, aged: 6mo-1yr, vintage: 1yr+
 */
export type Patina = 'fresh' | 'recent' | 'aged' | 'vintage'

const DAY_MS = 86_400_000
const PATINA_THRESHOLDS = [
  { max: 7 * DAY_MS, value: 'fresh' as const },
  { max: 180 * DAY_MS, value: 'recent' as const },
  { max: 365 * DAY_MS, value: 'aged' as const },
] as const

export function getPatina(startedAt: string): Patina {
  const age = Date.now() - parseTimestamp(startedAt).getTime()
  for (const t of PATINA_THRESHOLDS) {
    if (age < t.max) return t.value
  }
  return 'vintage'
}
