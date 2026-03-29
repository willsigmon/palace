import { getPatterns, getOnThisDay, getSerendipity, getDigest } from '@/lib/api'
import { InsightsClient } from '@/components/insights/insights-client'

export const metadata = { title: 'Insights' }

export default async function InsightsPage() {
  let patterns, onThisDay, serendipity, digest

  try {
    ;[patterns, onThisDay, serendipity, digest] = await Promise.all([
      getPatterns(),
      getOnThisDay(),
      getSerendipity(),
      getDigest(),
    ])
  } catch {
    patterns = null
    onThisDay = null
    serendipity = null
    digest = null
  }

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <InsightsClient
        patterns={patterns}
        onThisDay={onThisDay}
        serendipity={serendipity}
        digest={digest}
      />
    </div>
  )
}
