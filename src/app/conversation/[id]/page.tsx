import { getConversation, getConversations, getMemories, getSpeakerSuggestions } from '@/lib/api'
import { ConversationDetail } from '@/components/stream/conversation-detail'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface ConversationPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ConversationPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const detail = await getConversation(id)
    const title = detail.session.title ?? 'Conversation'
    return { title }
  } catch {
    return { title: 'Conversation' }
  }
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params

  let detail
  try {
    detail = await getConversation(id)
  } catch {
    notFound()
  }

  const category = detail.session.category
  const dateStr = detail.session.startedAt?.split(' ')[0]

  let relatedConversations: Awaited<ReturnType<typeof getConversations>> = []
  let relatedMemories: Awaited<ReturnType<typeof getMemories>> = []
  let speakerSuggestions: Awaited<ReturnType<typeof getSpeakerSuggestions>> | null = null

  try {
    const [convos, mems, speakers] = await Promise.all([
      category ? getConversations({ category, limit: 5 }) : Promise.resolve([]),
      dateStr ? getMemories({ since: dateStr, limit: 8 }) : Promise.resolve([]),
      getSpeakerSuggestions(parseInt(id)).catch(() => null),
    ])
    relatedConversations = convos.filter(c => String(c.id) !== String(id))?.slice(0, 4) ?? []
    relatedMemories = mems.slice(0, 6)
    speakerSuggestions = speakers
  } catch {
    relatedConversations = []
    relatedMemories = []
  }

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <ConversationDetail
        detail={detail}
        relatedConversations={relatedConversations}
        relatedMemories={relatedMemories}
        speakerSuggestions={speakerSuggestions}
      />
    </div>
  )
}
