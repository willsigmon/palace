'use client'

import type { VoiceState } from '@/hooks/use-marlin-voice'

interface VoiceInputBarProps {
  state: VoiceState
  audioLevel: number
  onStop: () => void
}

export function VoiceInputBar({ state, audioLevel, onStop }: VoiceInputBarProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      {/* Waveform bars */}
      <div className="flex flex-1 items-center justify-center gap-[3px] h-10">
        {state === 'listening' && Array.from({ length: 7 }).map((_, i) => {
          const phase = Math.sin(Date.now() / 180 + i * 0.9) * 0.4 + 0.6
          const h = 6 + audioLevel * 28 * phase
          return (
            <div
              key={i}
              className="w-[3px] rounded-full bg-accent transition-[height] duration-75"
              style={{ height: `${h}px` }}
            />
          )
        })}
        {state === 'processing' && (
          <span className="text-sm text-sub animate-pulse">Marlin is thinking...</span>
        )}
      </div>

      {/* Stop button */}
      {state === 'listening' && (
        <button
          onClick={onStop}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent transition-colors hover:bg-accent/30"
          aria-label="Stop recording"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="1" y="1" width="12" height="12" rx="2" />
          </svg>
        </button>
      )}
    </div>
  )
}
