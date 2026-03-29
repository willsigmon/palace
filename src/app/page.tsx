import { getConversations, getStats } from '@/lib/api'
import { StreamList } from '@/components/stream/stream-list'
import { StreamHeader } from '@/components/stream/stream-header'

export default async function StreamPage() {
  let conversations
  let stats

  try {
    ;[conversations, stats] = await Promise.all([
      getConversations({ limit: 25 }),
      getStats(),
    ])
  } catch {
    conversations = []
    stats = null
  }

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <StreamHeader stats={stats} />
      <StreamList initialConversations={conversations} />
    </div>
  )
}
