import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import type { SpeakerPaletteEntry, MergedTranscriptSegment } from './conversation-detail-helpers'

interface ConversationDetailTranscriptProps {
  readonly segmentsCount: number
  readonly mergedSegments: readonly MergedTranscriptSegment[]
  readonly transcriptSearch: string
  readonly searchTerm: string
  readonly matchCount: number
  readonly onSearchChange: (value: string) => void
  readonly onCopyTranscript: () => void
  readonly highlightText: (text: string) => React.ReactNode
  readonly getSpeakerStyle: (speaker: number) => SpeakerPaletteEntry
  readonly getSpeakerName: (segment: MergedTranscriptSegment) => string
}

export function ConversationDetailTranscript({
  segmentsCount,
  mergedSegments,
  transcriptSearch,
  searchTerm,
  matchCount,
  onSearchChange,
  onCopyTranscript,
  highlightText,
  getSpeakerStyle,
  getSpeakerName,
}: ConversationDetailTranscriptProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted/60">
          Transcript
          <span className="ml-2 font-normal">({segmentsCount})</span>
        </h2>
        <div className="flex items-center gap-2">
          {searchTerm && (
            <span className="text-[10px] text-muted/40 font-[family-name:var(--font-mono)] shrink-0">
              {matchCount} {matchCount === 1 ? 'match' : 'matches'}
            </span>
          )}
          <input
            type="search"
            value={transcriptSearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search transcript…"
            className="w-36 rounded-lg border border-border/30 bg-surface/20 px-2.5 py-1 text-[11px] text-text placeholder:text-muted/40 outline-none transition-all focus:border-accent/40 focus:w-48"
          />
          <div className="relative shrink-0">
            <button
              onClick={onCopyTranscript}
              title="Copy transcript"
              className="flex items-center justify-center rounded-lg border border-border/30 bg-surface/20 p-1.5 text-muted/50 transition-colors hover:border-border/50 hover:text-muted"
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="7" y="4" width="10" height="13" rx="1.5" />
                <path d="M7 7H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {mergedSegments.length > 0 ? (
          mergedSegments.map((segment, index) => {
            const style = getSpeakerStyle(segment.speaker)
            const name = getSpeakerName(segment)
            const isLinkableSpeaker = Boolean(segment.speakerName) && segment.speakerName !== 'You'

            return (
              <div key={index} className={`group flex gap-3 rounded-lg px-3 py-2.5 transition-colors hover:${style.bg}`}>
                <div className="flex shrink-0 flex-col items-center gap-1 w-16 pt-0.5">
                  <Avatar name={name} size="sm" />
                  {isLinkableSpeaker ? (
                    <Link
                      href={`/people?q=${encodeURIComponent(segment.speakerName!)}`}
                      className={`text-[10px] font-medium ${style.text} hover:underline text-center leading-tight`}
                    >
                      {name.split(' ')[0]}
                    </Link>
                  ) : (
                    <span className={`text-[10px] font-medium ${style.text} text-center leading-tight`}>
                      {name.split(' ')[0]}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[13px] leading-[1.7] text-text/90">{highlightText(segment.text)}</p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/15 mb-3">
              <rect x="8" y="8" width="32" height="32" rx="4" />
              <path d="M16 20h16M16 28h10" strokeLinecap="round" />
            </svg>
            <p className="text-[13px] text-sub/60">No transcript available</p>
            <p className="mt-1 text-[11px] text-muted/30">This conversation may not have been transcribed</p>
          </div>
        )}
      </div>
    </section>
  )
}
