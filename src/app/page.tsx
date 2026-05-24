import { AskPageController } from '@/components/ask/ask-page-controller'
import { getActionItems, getConversations, getDigest, getStats } from '@/lib/api'
import type { CommandCenterSnapshotData } from '@/components/ask/command-center-snapshot'

export default async function AskPage() {
  const [statsResult, latestResult, actionsResult, digestResult] = await Promise.allSettled([
    getStats(),
    getConversations({ limit: 1 }),
    getActionItems({ completed: false, limit: 3 }),
    getDigest(),
  ])

  const stats = statsResult.status === 'fulfilled' ? statsResult.value : null
  const latest = latestResult.status === 'fulfilled' ? latestResult.value[0] : null
  const openActions = actionsResult.status === 'fulfilled' ? actionsResult.value : []
  const digest = digestResult.status === 'fulfilled' ? digestResult.value : null

  const snapshot: CommandCenterSnapshotData = {
    stats: stats
      ? {
          conversations: stats.conversations,
          memories: stats.memories,
          people: stats.enrichment?.people ?? 0,
          openActions: openActions.length,
        }
      : null,
    latestConversation: latest
      ? {
          id: latest.id,
          title: latest.title,
          overview: latest.overview,
          category: latest.category,
          startedAt: latest.startedAt,
        }
      : null,
    openActions: openActions.map((item) => ({
      id: item.id,
      description: item.description,
      priority: item.priority,
      createdAt: item.createdAt,
    })),
    digest: digest
      ? {
          conversationCount: digest.conversationCount,
          memoryCount: digest.memoryCount,
          topCategory: digest.topCategories[0]?.category ?? null,
          topPerson: digest.topPeople?.[0]?.name ?? null,
          highlight: digest.highlights[0]?.title ?? null,
        }
      : null,
  }

  return <AskPageController snapshot={snapshot} />
}
