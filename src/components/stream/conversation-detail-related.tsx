import Link from 'next/link'
import type { ConversationListItem, Memory } from '@/types/api'
import { formatRelativeTime, truncate } from '@/lib/format'

interface ConversationDetailRelatedProps {
  readonly notes: string
  readonly relatedMemories: readonly Memory[]
  readonly relatedConversations: readonly ConversationListItem[]
  readonly onNotesChange: (value: string) => void
  readonly onNotesBlur: () => void
}

export function ConversationDetailRelated({
  notes,
  relatedMemories,
  relatedConversations,
  onNotesChange,
  onNotesBlur,
}: ConversationDetailRelatedProps) {
  return (
    <>
      <section className="mt-10 border-t border-border/20 pt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted/60">Notes</h2>
        </div>
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          onBlur={onNotesBlur}
          placeholder="Add your notes about this conversation..."
          rows={4}
          className="w-full resize-y rounded-xl border border-border/20 bg-surface/10 px-4 py-3 text-[13px] leading-[1.7] text-text placeholder:text-muted/30 outline-none transition-colors focus:border-accent/30 focus:bg-surface/20"
          spellCheck={false}
        />
      </section>

      {relatedMemories.length > 0 && (
        <section className="mt-10 border-t border-border/20 pt-8">
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-memory/70">
            Memories from this day
          </h2>
          <div className="space-y-2">
            {relatedMemories.map((memory) => (
              <div key={memory.id} className="rounded-lg border border-memory/10 bg-memory/[0.02] px-4 py-2.5">
                <p className="text-[12px] leading-relaxed text-sub/80">{truncate(memory.content, 200)}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  {memory.sourceApp && (
                    <span className="text-[9px] text-muted/50">{memory.sourceApp}</span>
                  )}
                  <time className="text-[9px] text-muted/40 font-[family-name:var(--font-mono)]">
                    {formatRelativeTime(memory.createdAt)}
                  </time>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {relatedConversations.length > 0 && (
        <section className="mt-8 border-t border-border/20 pt-8">
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-serendipity/70">
            Related conversations
          </h2>
          <div className="space-y-2">
            {relatedConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/conversation/${conversation.id}`}
                className="group flex items-center justify-between rounded-lg border border-border/20 bg-surface/20 px-4 py-3 transition-all hover:border-border/40 hover:bg-surface/40"
              >
                <div>
                  <p className="text-[13px] font-medium text-text group-hover:text-accent transition-colors">
                    {conversation.title ?? 'Untitled'}
                  </p>
                  {conversation.overview && (
                    <p className="mt-0.5 text-[11px] text-sub/50">{truncate(conversation.overview, 80)}</p>
                  )}
                </div>
                <time className="shrink-0 ml-3 text-[10px] text-muted/40 font-[family-name:var(--font-mono)]">
                  {formatRelativeTime(conversation.startedAt)}
                </time>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
