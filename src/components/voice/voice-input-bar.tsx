'use client'

import { useRef, useEffect, useState } from 'react'
import type { VoiceState } from '@/hooks/use-marlin-voice'

interface VoiceInputBarProps {
  state: VoiceState
  audioLevel: number
  onStop: () => void
  onCancel?: () => void
}

const BAR_COUNT = 7
const SPEAKING_BAR_HEIGHTS = [12, 18, 24, 16, 14] as const

export function VoiceInputBar({ state, audioLevel, onStop, onCancel }: VoiceInputBarProps) {
  // Animated bar heights via rAF — not from render cycle
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(4))
  const rafRef = useRef<number>(0)
  const audioLevelRef = useRef(audioLevel)

  useEffect(() => {
    audioLevelRef.current = audioLevel
  }, [audioLevel])

  useEffect(() => {
    if (state !== 'listening') {
      cancelAnimationFrame(rafRef.current)
      return
    }

    let t = 0
    function animate() {
      t += 1
      const level = audioLevelRef.current
      const next = Array.from({ length: BAR_COUNT }, (_, i) => {
        const phase = Math.sin(t * 0.12 + i * 0.8) * 0.4 + 0.6
        return 4 + level * 32 * phase
      })
      setBars(next)
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [state])

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Cancel button */}
      {onCancel && (state === 'listening' || state === 'processing') && (
        <button
          onClick={onCancel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted/60 transition-colors hover:text-text active:scale-95"
          aria-label="Cancel"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}

      {/* Waveform / status */}
      <div className="flex flex-1 items-center justify-center gap-[3px] h-12">
        {state === 'listening' && bars.map((h, i) => (
          <div
            key={i}
            className="w-[3px] rounded-full bg-accent"
            style={{
              height: `${h}px`,
              opacity: 0.6 + (h / 36) * 0.4,
              transition: 'height 60ms ease-out',
            }}
          />
        ))}
        {state === 'processing' && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full bg-accent animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
            <span className="text-sm text-sub">Marlin is thinking...</span>
          </div>
        )}
        {state === 'speaking' && (
          <div className="flex items-center gap-2">
            <div className="flex gap-[2px]">
              {SPEAKING_BAR_HEIGHTS.map((height, i) => (
                <div
                  key={i}
                  className="w-[2px] rounded-full bg-serendipity animate-pulse"
                  style={{
                    height: `${height}px`,
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-sub">Marlin is speaking...</span>
          </div>
        )}
      </div>

      {/* Stop recording button */}
      {state === 'listening' && (
        <button
          onClick={onStop}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-void transition-all hover:bg-accent/90 active:scale-90"
          aria-label="Stop recording"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="10" height="10" rx="2" />
          </svg>
        </button>
      )}
    </div>
  )
}
