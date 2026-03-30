import { getConversations, getStats, getOnThisDay, getDigest, getSerendipity } from '@/lib/api'
import { StreamList } from '@/components/stream/stream-list'
import { StreamHeader } from '@/components/stream/stream-header'
import { OnThisDayCard } from '@/components/stream/on-this-day-card'
import { WeeklyPulse } from '@/components/stream/weekly-pulse'
import { SerendipityCard } from '@/components/stream/serendipity-card'

export default async function StreamPage() {
  let conversations, stats, onThisDay, digest, serendipity

  try {
    ;[conversations, stats, onThisDay, digest, serendipity] = await Promise.all([
      getConversations({ limit: 25 }),
      getStats(),
      getOnThisDay().catch(() => null),
      getDigest().catch(() => null),
      getSerendipity().catch(() => null),
    ])
  } catch {
    conversations = []
    stats = null
    onThisDay = null
    digest = null
    serendipity = null
  }

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <StreamHeader stats={stats} />
      {digest && <WeeklyPulse digest={digest} />}
      {onThisDay && <OnThisDayCard data={onThisDay} />}
      {serendipity && <SerendipityCard data={serendipity} />}
      <StreamList initialConversations={conversations} />
    </div>
  )
}
