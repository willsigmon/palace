'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { hapticImpact, hapticNotification } from '@/lib/haptics'

const MARLIN_API = process.env.NEXT_PUBLIC_MARLIN_URL ?? 'https://marlin.sigflix.stream'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

export interface VoiceResult {
  transcript: string
  response: string
  model: string
  audioBase64: string
  timings: { stt: number; llm: number; tts: number; total: number }
}

interface UseMarlinVoiceOptions {
  sessionId?: string
  voice?: string
  onResult?: (result: VoiceResult) => void
}

export function useMarlinVoice(options: UseMarlinVoiceOptions = {}) {
  const { voice = 'am_adam', onResult } = options
  const sessionId = useRef(options.sessionId ?? `palace-${Date.now()}`)

  const [state, setState] = useState<VoiceState>('idle')
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  const monitorAudio = useCallback(() => {
    if (!analyserRef.current) return
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    const avg = data.reduce((a, b) => a + b, 0) / data.length
    setAudioLevel(avg / 255)
    animFrameRef.current = requestAnimationFrame(monitorAudio)
  }, [])

  const stopAudio = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.pause()
      audioElRef.current.src = ''
      audioElRef.current = null
    }
  }, [])

  const playAudio = useCallback((base64: string): Promise<void> => {
    return new Promise((resolve) => {
      stopAudio()
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioElRef.current = audio
      // iOS WKWebView: set playsinline attribute
      audio.setAttribute('playsinline', 'true')

      audio.onended = () => {
        URL.revokeObjectURL(url)
        audioElRef.current = null
        resolve()
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        audioElRef.current = null
        resolve()
      }
      audio.play().catch(() => resolve())
    })
  }, [stopAudio])

  const sendAudio = useCallback(async (blob: Blob) => {
    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')
    formData.append('session_id', sessionId.current)
    formData.append('voice', voice)

    const res = await fetch(`${MARLIN_API}/api/voice`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) throw new Error(`Marlin API error: ${res.status}`)

    const data = await res.json()
    if (data.error) throw new Error(data.error)
    if (!data.transcript) throw new Error('No speech detected')

    return {
      transcript: data.transcript,
      response: data.response,
      model: data.model,
      audioBase64: data.audio,
      timings: data.timings,
    } as VoiceResult
  }, [voice])

  const startListening = useCallback(async () => {
    setError('')
    hapticImpact('medium')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.4
      source.connect(analyser)
      analyserRef.current = analyser

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
        hapticImpact('light')

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size < 1000) {
          setState('idle')
          return
        }

        setState('processing')
        try {
          const result = await sendAudio(blob)
          onResultRef.current?.(result)
          hapticNotification('success')

          setState('speaking')
          await playAudio(result.audioBase64)
          setState('idle')
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Voice request failed')
          hapticNotification('error')
          setState('error')
          setTimeout(() => setState('idle'), 3000)
        }
      }

      recorder.start(100)
      setState('listening')
      hapticNotification('success')
      monitorAudio()
    } catch {
      setError('Microphone access denied')
      hapticNotification('error')
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }, [monitorAudio, sendAudio, playAudio])

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      hapticImpact('heavy')
      mediaRecorderRef.current.stop()
    }
  }, [])

  const cancel = useCallback(() => {
    stopListening()
    stopAudio()
    cancelAnimationFrame(animFrameRef.current)
    setAudioLevel(0)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close().catch(() => {})
    hapticImpact('light')
    setState('idle')
    setError('')
  }, [stopListening, stopAudio])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtxRef.current?.close().catch(() => {})
      stopAudio()
    }
  }, [stopAudio])

  return {
    state,
    audioLevel,
    error,
    startListening,
    stopListening,
    cancel,
    isActive: state !== 'idle' && state !== 'error',
  }
}
