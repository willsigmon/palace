'use client'

import { useState, useEffect, useCallback } from 'react'

interface RecordingStatus {
  recording: boolean
  file_path: string | null
  duration_seconds: number
}

/**
 * Floating record button — only visible in Tauri desktop app.
 * Captures ambient (microphone) or system audio, saves as WAV.
 */
export function RecordButton() {
  const [isTauri, setIsTauri] = useState(false)
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [source, setSource] = useState<'ambient' | 'system'>('ambient')
  const [showMenu, setShowMenu] = useState(false)

  // Detect Tauri environment
  useEffect(() => {
    setIsTauri(typeof window !== 'undefined' && '__TAURI__' in window)
  }, [])

  // Update duration while recording
  useEffect(() => {
    if (!recording) return
    const interval = setInterval(() => {
      setDuration((d) => d + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [recording])

  const startRecording = useCallback(async (src: 'ambient' | 'system') => {
    if (!isTauri) return
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('start_recording', { source: src })
      setRecording(true)
      setDuration(0)
      setSource(src)
      setShowMenu(false)
    } catch (err) {
      console.error('Failed to start recording:', err)
    }
  }, [isTauri])

  const stopRecording = useCallback(async () => {
    if (!isTauri) return
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const status = await invoke<RecordingStatus>('stop_recording')
      setRecording(false)
      setDuration(0)
      // TODO: Send to wsigomi for transcription
      console.log('Recording saved:', status.file_path)
    } catch (err) {
      console.error('Failed to stop recording:', err)
    }
  }, [isTauri])

  // Don't render in browser
  if (!isTauri) return null

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 md:bottom-8 md:right-8">
      {/* Source menu */}
      {showMenu && !recording && (
        <div className="rounded-xl border border-border/40 bg-surface/95 p-2 shadow-glass backdrop-blur-sm">
          <button
            onClick={() => startRecording('ambient')}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-text transition-colors hover:bg-elevated"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="7" y="2" width="6" height="10" rx="3" />
              <path d="M4 10a6 6 0 0012 0M10 16v2" strokeLinecap="round" />
            </svg>
            Ambient (Microphone)
          </button>
          <button
            onClick={() => startRecording('system')}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-text transition-colors hover:bg-elevated"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="16" height="11" rx="2" />
              <path d="M6 17h8" strokeLinecap="round" />
            </svg>
            System Audio
          </button>
        </div>
      )}

      {/* Recording indicator */}
      {recording && (
        <div className="flex items-center gap-2 rounded-full bg-red-500/15 px-4 py-1.5 border border-red-500/30">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium text-red-400 font-[family-name:var(--font-mono)]">
            {formatDuration(duration)}
          </span>
          <span className="text-[10px] text-red-400/60 capitalize">{source}</span>
        </div>
      )}

      {/* Main button */}
      <button
        onClick={recording ? stopRecording : () => setShowMenu(!showMenu)}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-elevated transition-all duration-200 ${
          recording
            ? 'bg-red-500 hover:bg-red-600 active:scale-95'
            : 'bg-accent hover:bg-accent/90 active:scale-95'
        }`}
        title={recording ? 'Stop recording' : 'Start recording'}
      >
        {recording ? (
          // Stop icon
          <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
            <rect x="5" y="5" width="10" height="10" rx="2" />
          </svg>
        ) : (
          // Mic icon
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.5">
            <rect x="7" y="2" width="6" height="10" rx="3" />
            <path d="M4 10a6 6 0 0012 0M10 16v2" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  )
}
