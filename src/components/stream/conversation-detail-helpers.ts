import type { TranscriptSegment } from '@/types/api'

export interface SpeakerPaletteEntry {
  readonly text: string
  readonly bg: string
  readonly dot: string
}

export const SPEAKER_PALETTE: readonly SpeakerPaletteEntry[] = [
  { text: 'text-accent', bg: 'bg-accent/8', dot: 'bg-accent' },
  { text: 'text-serendipity', bg: 'bg-serendipity/8', dot: 'bg-serendipity' },
  { text: 'text-pattern', bg: 'bg-pattern/8', dot: 'bg-pattern' },
  { text: 'text-memory', bg: 'bg-memory/8', dot: 'bg-memory' },
  { text: 'text-emerald-400', bg: 'bg-emerald-400/8', dot: 'bg-emerald-400' },
  { text: 'text-pink-400', bg: 'bg-pink-400/8', dot: 'bg-pink-400' },
] as const

export interface MergedTranscriptSegment {
  readonly speaker: number
  readonly speakerLabel: string
  readonly isUser: number
  readonly text: string
  readonly startTime: number
  readonly endTime: number
  readonly speakerName: string | null
}

export function mergeConsecutive(segments: readonly TranscriptSegment[]): MergedTranscriptSegment[] {
  if (segments.length === 0) {
    return []
  }

  const merged: MergedTranscriptSegment[] = []
  let current: MergedTranscriptSegment = { ...segments[0]! }

  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index]!
    if (segment.speaker === current.speaker) {
      current = {
        ...current,
        text: `${current.text} ${segment.text}`,
        endTime: segment.endTime,
      }
      continue
    }

    merged.push(current)
    current = { ...segment }
  }

  merged.push(current)
  return merged
}
