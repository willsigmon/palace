'use client'

import { useState, useRef, useCallback } from 'react'
import { hapticImpact } from '@/lib/haptics'

interface VoiceMessageProps {
  response: string
  model: string
  audioBase64?: string
  timings?: { stt: number; llm: number; tts: number; total: number }
}

export function VoiceMessage({ response, model, audioBase64, timings }: VoiceMessageProps) {
  const [playing, setPlaying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const togglePlay = useCallback(() => {
    if (!audioBase64) return

    if (playing && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
      setPlaying(false)
      return
    }

    const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audioRef.current = audio
    setPlaying(true)

    audio.onended = () => {
      URL.revokeObjectURL(url)
      audioRef.current = null
      setPlaying(false)
    }
    audio.play().catch(() => setPlaying(false))
  }, [audioBase64, playing])

  const modelLabel = model
    .replace('gemma4:', 'Gemma 4 ')
    .replace('deepseek-r1:', 'DeepSeek R1 ')

  return (
    <div className="flex-1 min-w-0">
      <div className="text-[14px] leading-[1.8] text-text/90 whitespace-pre-wrap">
        {response}
      </div>

      {/* Controls row */}
      <div className="mt-2 flex items-center gap-2">
        {audioBase64 && (
          <button
            onClick={() => { hapticImpact('light'); togglePlay(); }}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-surface/30 px-3 py-1 text-[11px] text-muted transition-colors hover:bg-surface/50 hover:text-sub active:scale-95"
            aria-label={playing ? 'Stop playback' : 'Replay audio'}
          >
            {playing ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <rect x="1" y="1" width="8" height="8" rx="1" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M2 1l7 4-7 4V1z" />
              </svg>
            )}
            {playing ? 'Stop' : 'Replay'}
          </button>
        )}

        {timings && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 rounded-md bg-surface/20 px-2 py-1 text-[10px] text-muted/50 transition-colors hover:text-muted"
          >
            <span>{timings.total.toFixed(1)}s</span>
            <svg
              width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5"
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <path d="M1 3l3 2 3-2" />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded details */}
      {expanded && timings && (
        <div className="mt-2 rounded-md border border-border/15 bg-surface/10 px-3 py-2 text-[10px] text-muted/50 animate-fade-in">
          <div className="flex gap-4">
            <span>STT: {timings.stt.toFixed(2)}s</span>
            <span>LLM: {timings.llm.toFixed(1)}s</span>
            <span>TTS: {timings.tts.toFixed(2)}s</span>
          </div>
          <div className="mt-1 text-muted/40">via {modelLabel}</div>
        </div>
      )}
    </div>
  )
}
