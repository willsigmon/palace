import { getConversation } from '@/lib/api'
import { ConversationDetail } from '@/components/stream/conversation-detail'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface ConversationPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ConversationPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const conversation = await getConversation(id)
    const title = conversation.enrichment?.generated_title ?? conversation.title ?? 'Conversation'
    return { title }
  } catch {
    return { title: 'Conversation' }
  }
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params

  let conversation
  try {
    conversation = await getConversation(id)
  } catch {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <ConversationDetail conversation={conversation} />
    </div>
  )
}
