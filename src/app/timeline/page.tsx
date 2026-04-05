import { getConversations, getStats, getOnThisDay, getDigest } from '@/lib/api'
import { StreamList } from '@/components/stream/stream-list'
import { StreamHeader } from '@/components/stream/stream-header'
import { IntelligenceSection } from '@/components/stream/intelligence-section'
import { DailyRitualWrapper } from '@/components/stream/daily-ritual-wrapper'

export default async function TimelinePage() {
  let conversations, stats, onThisDay, digest

  try {
    ;[conversations, stats, onThisDay, digest] = await Promise.all([
      getConversations({ limit: 25 }),
      getStats(),
      getOnThisDay().catch(() => null),
      getDigest().catch(() => null),
    ])
  } catch {
    conversations = []
    stats = null
    onThisDay = null
    digest = null
  }

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <DailyRitualWrapper digest={digest} onThisDay={onThisDay} />
      <StreamHeader stats={stats} />
      <IntelligenceSection digest={digest} onThisDay={onThisDay} />
      <StreamList initialConversations={conversations} />
    </div>
  )
}
