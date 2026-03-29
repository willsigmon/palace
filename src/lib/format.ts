/**
 * Formatting utilities for PALACE
 */

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
  const date = new Date(dateString)
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
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format as "Mar 15"
 */
export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format as "9:42 AM"
 */
export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
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
