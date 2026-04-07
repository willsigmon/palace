'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { sendVoiceToMarlin, type VoiceResultPayload } from '@/lib/marlin'
import { hapticImpact, hapticNotification } from '@/lib/haptics'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

export type VoiceResult = VoiceResultPayload

interface UseMarlinVoiceOptions {
  sessionId?: string
  voice?: string
  onResult?: (result: VoiceResult) => void
}

export function useMarlinVoice(options: UseMarlinVoiceOptions = {}) {
  const { voice = 'am_adam', onResult } = options
  const reactId = useId()
  const sessionId = useMemo(
    () => options.sessionId ?? `palace-${reactId.replace(/[:]/g, '')}`,
    [options.sessionId, reactId],
  )

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

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

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
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
      const blob = new Blob([bytes], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioElRef.current = audio
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

      const audioContext = new AudioContext()
      audioCtxRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
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

      const monitorAudio = () => {
        if (!analyserRef.current) return
        const data = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(data)
        const averageLevel = data.reduce((sum, value) => sum + value, 0) / data.length
        setAudioLevel(averageLevel / 255)
        animFrameRef.current = requestAnimationFrame(monitorAudio)
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        cancelAnimationFrame(animFrameRef.current)
        setAudioLevel(0)
        stream.getTracks().forEach((track) => track.stop())
        audioContext.close().catch(() => {})
        hapticImpact('light')

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size < 1000) {
          setState('idle')
          return
        }

        setState('processing')
        try {
          const result = await sendVoiceToMarlin({ blob, sessionId, voice })
          onResultRef.current?.(result)
          hapticNotification('success')

          setState('speaking')
          await playAudio(result.audioBase64)
          setState('idle')
        } catch (requestError) {
          setError(requestError instanceof Error ? requestError.message : 'Voice request failed')
          hapticNotification('error')
          setState('error')
          window.setTimeout(() => setState('idle'), 3000)
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
      window.setTimeout(() => setState('idle'), 3000)
    }
  }, [playAudio, sessionId, voice])

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
    streamRef.current?.getTracks().forEach((track) => track.stop())
    audioCtxRef.current?.close().catch(() => {})
    hapticImpact('light')
    setState('idle')
    setError('')
  }, [stopAudio, stopListening])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
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
