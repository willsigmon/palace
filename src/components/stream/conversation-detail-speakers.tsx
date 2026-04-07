import { Avatar } from '@/components/ui/avatar'
import type { TranscriptSegment } from '@/types/api'
import type { SpeakerPaletteEntry } from './conversation-detail-helpers'

interface ConversationDetailSpeakersProps {
  readonly speakerLegend: readonly [number, number][]
  readonly segments: readonly TranscriptSegment[]
  readonly uniqueSpeakers: number
  readonly editingSpeaker: number | null
  readonly speakerEditValue: string
  readonly reprocessing: boolean
  readonly getSpeakerName: (segment: TranscriptSegment) => string
  readonly getSpeakerStyle: (speaker: number) => SpeakerPaletteEntry
  readonly onStartEditing: (speakerId: number, name: string) => void
  readonly onSpeakerEditChange: (value: string) => void
  readonly onSaveSpeaker: (speakerId: number, value: string) => void
  readonly onCancelEditing: () => void
  readonly onReprocess: () => void
}

export function ConversationDetailSpeakers({
  speakerLegend,
  segments,
  uniqueSpeakers,
  editingSpeaker,
  speakerEditValue,
  reprocessing,
  getSpeakerName,
  getSpeakerStyle,
  onStartEditing,
  onSpeakerEditChange,
  onSaveSpeaker,
  onCancelEditing,
  onReprocess,
}: ConversationDetailSpeakersProps) {
  return (
    <>
      {speakerLegend.length > 1 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {speakerLegend.map(([speaker]) => {
            const style = getSpeakerStyle(speaker)
            const segment = segments.find((item) => item.speaker === speaker)
            const name = segment ? getSpeakerName(segment) : `Speaker ${speaker}`
            return (
              <span key={speaker} className="flex items-center gap-1.5 text-[11px]">
                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                <span className={style.text}>{name}</span>
              </span>
            )
          })}
        </div>
      )}

      {uniqueSpeakers > 1 && (
        <section className="mb-6 rounded-xl border border-border/20 bg-surface/10 p-4">
          <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted/40">
            Speakers — tap to rename
          </h2>
          <div className="flex flex-wrap gap-3">
            {speakerLegend.map(([speakerId]) => {
              const segment = segments.find((item) => item.speaker === speakerId)
              if (!segment) {
                return null
              }

              const name = getSpeakerName(segment)
              const style = getSpeakerStyle(speakerId)
              const isEditing = editingSpeaker === speakerId

              return (
                <div key={speakerId} className="flex items-center gap-2 rounded-lg bg-elevated/30 px-3 py-1.5">
                  <Avatar name={name} size="sm" />
                  {isEditing ? (
                    <input
                      autoFocus
                      value={speakerEditValue}
                      onChange={(event) => onSpeakerEditChange(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') onSaveSpeaker(speakerId, speakerEditValue)
                        if (event.key === 'Escape') onCancelEditing()
                      }}
                      onBlur={() => onSaveSpeaker(speakerId, speakerEditValue)}
                      className="w-24 bg-transparent border-b border-accent/50 text-[12px] font-medium text-text outline-none"
                      placeholder="Name..."
                    />
                  ) : (
                    <button
                      onClick={() => onStartEditing(speakerId, name)}
                      className={`text-[12px] font-medium ${style.text} hover:underline cursor-pointer`}
                      title="Click to rename"
                    >
                      {name}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="mb-4">
        <button
          onClick={onReprocess}
          disabled={reprocessing}
          className="flex items-center gap-2 rounded-lg border border-border/30 bg-surface/20 px-3 py-2 text-[11px] text-sub transition-all hover:border-accent/30 hover:text-accent disabled:opacity-40"
        >
          {reprocessing ? (
            <div className="h-3 w-3 animate-spin rounded-full border border-accent/30 border-t-accent" />
          ) : (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 8a7 7 0 0 1 12.3-4.5M15 8a7 7 0 0 1-12.3 4.5" />
              <path d="M13.3 1v3h-3M2.7 15v-3h3" />
            </svg>
          )}
          {reprocessing ? 'Re-processing with local AI...' : 'Re-process with Marlin'}
        </button>
      </div>
    </>
  )
}
