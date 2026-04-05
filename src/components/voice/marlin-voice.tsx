'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

const MARLIN_API = process.env.NEXT_PUBLIC_MARLIN_URL ?? 'https://marlin.sigflix.stream'

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

interface VoiceResponse {
  transcript: string
  response: string
  model: string
  audio: string
  timings: {
    stt: number
    llm: number
    tts: number
    total: number
  }
}

/**
 * MarlinVoice — ChatGPT-style voice interface for PALACE.
 *
 * Push-to-talk or tap-to-talk. Sends audio to marlin.sigflix.stream,
 * gets back transcript + response + synthesized audio.
 */
export function MarlinVoice() {
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [model, setModel] = useState('')
  const [error, setError] = useState('')
  const [history, setHistory] = useState<Array<{ role: string; text: string }>>([])
  const [sessionId] = useState(() => `palace-${Date.now()}`)
  const [audioLevel, setAudioLevel] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  // Audio level monitoring for waveform
  const monitorAudio = useCallback(() => {
    if (!analyserRef.current) return
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    const avg = data.reduce((a, b) => a + b, 0) / data.length
    setAudioLevel(avg / 255)
    animFrameRef.current = requestAnimationFrame(monitorAudio)
  }, [])

  const startListening = useCallback(async () => {
    setError('')
    setTranscript('')
    setResponse('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      streamRef.current = stream

      // Audio analyser for visual feedback
      const audioCtx = new AudioContext({ sampleRate: 16000 })
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Use webm/opus if supported, fall back to default
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : undefined
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        cancelAnimationFrame(animFrameRef.current)
        setAudioLevel(0)
        stream.getTracks().forEach((t) => t.stop())
        audioCtx.close().catch(() => {})

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size < 1000) {
          setState('idle')
          return
        }

        setState('processing')
        await sendAudio(blob)
      }

      recorder.start(100)
      setState('listening')
      monitorAudio()
    } catch (err) {
      setError('Microphone access denied')
      setState('idle')
    }
  }, [monitorAudio, sessionId])

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const sendAudio = async (blob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      formData.append('session_id', sessionId)
      formData.append('voice', 'am_adam')

      const res = await fetch(`${MARLIN_API}/api/voice`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const data: VoiceResponse = await res.json()

      if (data.transcript) {
        setTranscript(data.transcript)
        setResponse(data.response)
        setModel(data.model)
        setHistory((prev) => [
          ...prev,
          { role: 'user', text: data.transcript },
          { role: 'marlin', text: data.response },
        ].slice(-20))

        // Play audio response
        setState('speaking')
        const audioBytes = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))
        const audioBlob = new Blob([audioBytes], { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          setState('idle')
        }
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          setState('idle')
        }
        await audio.play()
      } else {
        setError('No speech detected — try again')
        setState('idle')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      setState('idle')
    }
  }

  const toggleVoice = useCallback(() => {
    if (state === 'idle') {
      startListening()
    } else if (state === 'listening') {
      stopListening()
    }
  }, [state, startListening, stopListening])

  // Keyboard: hold Space to talk
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' && !e.repeat && state === 'idle' && e.target === document.body) {
        e.preventDefault()
        startListening()
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space' && state === 'listening') {
        e.preventDefault()
        stopListening()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [state, startListening, stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const stateLabel = {
    idle: 'Tap to talk',
    listening: 'Listening...',
    processing: 'Thinking...',
    speaking: 'Marlin',
  }[state]

  const orbScale = state === 'listening' ? 1 + audioLevel * 0.5 : state === 'speaking' ? 1.1 : 1
  const orbOpacity = state === 'idle' ? 0.4 : 0.9

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Conversation history */}
      {history.length > 0 && (
        <div className="w-full max-w-lg space-y-3 mb-4">
          {history.map((msg, i) => (
            <div
              key={i}
              className={`text-sm ${
                msg.role === 'user'
                  ? 'text-sub text-right'
                  : 'text-text'
              }`}
            >
              <span className="text-xs text-muted mr-2">
                {msg.role === 'user' ? 'You' : 'Marlin'}
              </span>
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* Voice orb */}
      <button
        onClick={toggleVoice}
        disabled={state === 'processing' || state === 'speaking'}
        className="group relative flex items-center justify-center w-32 h-32 rounded-full transition-all duration-300 focus:outline-none"
        aria-label={stateLabel}
      >
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-300"
          style={{
            background: `radial-gradient(circle, var(--color-accent) 0%, transparent 70%)`,
            opacity: orbOpacity * 0.3,
            transform: `scale(${orbScale * 1.4})`,
          }}
        />

        {/* Main orb */}
        <div
          className="absolute inset-2 rounded-full border transition-all duration-150"
          style={{
            background: state === 'listening'
              ? `linear-gradient(135deg, var(--color-accent-from), var(--color-accent-to))`
              : state === 'speaking'
              ? `linear-gradient(135deg, var(--color-serendipity), var(--color-memory))`
              : state === 'processing'
              ? `var(--color-elevated)`
              : `var(--color-surface)`,
            borderColor: state === 'idle' ? 'var(--color-border)' : 'transparent',
            opacity: orbOpacity,
            transform: `scale(${orbScale})`,
            boxShadow: state !== 'idle' ? '0 0 40px var(--color-glow)' : 'none',
          }}
        />

        {/* Icon */}
        <div className="relative z-10 text-text">
          {state === 'idle' && (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
          {state === 'listening' && (
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-white rounded-full transition-all duration-75"
                  style={{
                    height: `${8 + audioLevel * 24 * (1 + Math.sin(Date.now() / 200 + i) * 0.5)}px`,
                  }}
                />
              ))}
            </div>
          )}
          {state === 'processing' && (
            <div className="w-6 h-6 border-2 border-text/30 border-t-text rounded-full animate-spin" />
          )}
          {state === 'speaking' && (
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 bg-white rounded-full animate-pulse"
                  style={{
                    height: '16px',
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </button>

      {/* State label */}
      <p className="text-sm text-sub transition-all duration-300">
        {stateLabel}
        {state === 'idle' && (
          <span className="text-muted ml-2">or hold Space</span>
        )}
      </p>

      {/* Current transcript/response */}
      {transcript && state !== 'idle' && (
        <div className="text-center max-w-md">
          <p className="text-xs text-muted mb-1">You said</p>
          <p className="text-sm text-sub">{transcript}</p>
        </div>
      )}

      {response && (state === 'speaking' || state === 'idle') && (
        <div className="text-center max-w-md">
          <p className="text-base text-text leading-relaxed">{response}</p>
          {model && (
            <p className="text-xs text-muted mt-2">
              via {model.replace('gemma4:', 'Gemma 4 ').replace('deepseek-r1:', 'DeepSeek R1 ')}
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
