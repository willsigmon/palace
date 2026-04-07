import type { ConversationSession } from '@/types/api'

interface ConversationDetailSummaryProps {
  readonly session: ConversationSession
  readonly topicInfo: string | null
  readonly topicLoading: boolean
  readonly onLookUpTopic: () => void
}

export function ConversationDetailSummary({
  session,
  topicInfo,
  topicLoading,
  onLookUpTopic,
}: ConversationDetailSummaryProps) {
  return (
    <>
      {session.overview && (
        <section className="mb-8 rounded-xl border border-accent/15 bg-accent/[0.03] p-5">
          <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-accent/70">Summary</h2>
          <p className="text-[13px] leading-[1.7] text-sub">{session.overview}</p>
        </section>
      )}

      {session.title && session.title !== 'Untitled' && (
        <div className="mb-6">
          {topicInfo ? (
            <div className="rounded-xl border border-serendipity/15 bg-serendipity/[0.02] p-5">
              <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-serendipity/70">Context</h2>
              <div className="text-[12px] leading-[1.7] text-sub/70 whitespace-pre-wrap">{topicInfo}</div>
            </div>
          ) : (
            <button
              onClick={onLookUpTopic}
              disabled={topicLoading}
              className="flex items-center gap-2 rounded-lg bg-serendipity/8 px-3 py-1.5 text-[11px] font-medium text-serendipity/70 transition-colors hover:bg-serendipity/15 disabled:opacity-50"
            >
              {topicLoading ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border border-serendipity/30 border-t-serendipity" />
                  Looking up...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="9" cy="9" r="5" />
                    <path d="M13 13l4 4" />
                  </svg>
                  Look up topic with Perplexity
                </>
              )}
            </button>
          )}
        </div>
      )}
    </>
  )
}
