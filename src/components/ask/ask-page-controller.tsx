'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ExampleQuestionList } from '@/components/ask/example-question-list'
import { ThreadMessageList } from '@/components/ask/thread-message-list'
import type { ThreadMessage } from '@/components/ask/types'
import { VoiceInputBar } from '@/components/voice/voice-input-bar'
import { useMarlinVoice, type VoiceResult } from '@/hooks/use-marlin-voice'
import { askQuestion, ApiError } from '@/lib/api'
import { hapticImpact, hapticSelection } from '@/lib/haptics'

const EXAMPLE_QUESTIONS = [
  'Who is Carter and what do we work on together?',
  'What have I been doing with HubZone lately?',
  'Tell me about my family',
  "What's the status of the Kyndred project?",
  'Who do I talk to the most?',
  'What happened last Tuesday?',
] as const

export function AskPageController() {
  return (
    <Suspense>
      <AskPageControllerInner />
    </Suspense>
  )
}

function AskPageControllerInner() {
  const searchParams = useSearchParams()
  const [question, setQuestion] = useState('')
  const [thread, setThread] = useState<ThreadMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [pendingTranscript, setPendingTranscript] = useState('')
  const threadEndRef = useRef<HTMLDivElement>(null)
  const voiceStartedRef = useRef(false)

  const scrollToBottom = useCallback(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleVoiceResult = useCallback((result: VoiceResult) => {
    const nextMessage: ThreadMessage = {
      id: `voice-${Date.now()}`,
      mode: 'voice',
      question: result.transcript,
      answer: result.response,
      audioBase64: result.audioBase64,
      timings: result.timings,
      model: result.model,
    }

    setThread((previous) => [...previous, nextMessage])
    setPendingTranscript('')
    scrollToBottom()
  }, [scrollToBottom])

  const voice = useMarlinVoice({
    onResult: handleVoiceResult,
  })

  useEffect(() => {
    if (voice.state === 'processing') {
      setPendingTranscript('Processing...')
      return
    }

    if (voice.state === 'idle' || voice.state === 'error') {
      setPendingTranscript('')
    }
  }, [voice.state])

  useEffect(() => {
    if (searchParams.get('voice') === '1' && !voiceStartedRef.current) {
      voiceStartedRef.current = true
      setVoiceMode(true)
    }
  }, [searchParams])

  useEffect(() => {
    scrollToBottom()
  }, [thread.length, pendingTranscript, loading, scrollToBottom])

  const runAsk = useCallback(async (input: string) => {
    const query = input.trim()
    if (!query) return

    setLoading(true)
    setQuestion('')

    try {
      const data = await askQuestion(query)
      const nextMessage: ThreadMessage = {
        id: `text-${Date.now()}`,
        mode: 'text',
        question: query,
        answer: data.answer,
        sources: data.sources,
      }
      setThread((previous) => [...previous, nextMessage])
    } catch (error) {
      const fallback = error instanceof ApiError
        ? `Failed to reach PALACE (${error.status}). Check the API connection.`
        : 'Failed to reach PALACE. Check API connection.'

      setThread((previous) => [
        ...previous,
        {
          id: `text-${Date.now()}`,
          mode: 'text',
          question: query,
          answer: fallback,
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleExampleSelect = useCallback((nextQuestion: string) => {
    hapticSelection()
    setQuestion(nextQuestion)
    void runAsk(nextQuestion)
  }, [runAsk])

  const handleMicToggle = useCallback(() => {
    hapticImpact('medium')
    if (voice.state === 'idle') {
      setVoiceMode(true)
      void voice.startListening()
      return
    }

    if (voice.state === 'listening') {
      voice.stopListening()
    }
  }, [voice])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (event.key === 'm' && voice.state === 'idle') {
        event.preventDefault()
        setVoiceMode(true)
        void voice.startListening()
      }

      if (event.code === 'Space' && !event.repeat && voice.state === 'idle' && voiceMode) {
        event.preventDefault()
        void voice.startListening()
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.code === 'Space' && voice.state === 'listening') {
        event.preventDefault()
        voice.stopListening()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [voice, voiceMode])

  const showEmpty = thread.length === 0 && !loading && !voice.isActive

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-[var(--space-page)] py-8" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
      <header className="mb-6">
        <h1 className="text-lg font-semibold text-text">Marlin</h1>
        <p className="mt-1 text-sm text-sub">Ask anything about your life. Type or talk.</p>
      </header>

      {showEmpty && (
        <ExampleQuestionList
          questions={EXAMPLE_QUESTIONS}
          voiceMode={voiceMode}
          onSelect={handleExampleSelect}
        />
      )}

      <div className="flex-1 pb-4">
        <ThreadMessageList thread={thread} />

        {pendingTranscript && voice.state === 'processing' && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-accent animate-pulse">
              <span className="font-[family-name:var(--font-serif)] text-[10px] font-bold italic text-void">M</span>
            </div>
            <span className="text-sm text-sub">Marlin is thinking...</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-accent animate-pulse">
              <span className="font-[family-name:var(--font-serif)] text-[10px] font-bold italic text-void">P</span>
            </div>
            <span className="text-sm text-sub">Searching your memories...</span>
          </div>
        )}

        {voice.error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400">
            {voice.error}
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      <div
        className="sticky bottom-0 -mx-[var(--space-page)] border-t border-border/10 bg-void/90 px-[var(--space-page)] pt-2 backdrop-blur-md"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
      >
        {voice.isActive ? (
          <div className="rounded-2xl border border-accent/30 bg-surface/20 px-4 shadow-[0_0_20px_var(--color-glow)]">
            <VoiceInputBar
              state={voice.state}
              audioLevel={voice.audioLevel}
              onStop={voice.stopListening}
              onCancel={voice.cancel}
            />
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void runAsk(question)
                }
              }}
              placeholder={voiceMode ? 'Type or press M to talk...' : 'What would you like to know?'}
              className="w-full rounded-2xl border border-border/40 bg-surface/30 py-4 pl-5 pr-32 text-[16px] text-text outline-none transition-all placeholder:text-muted/50 focus:border-accent/40 focus:shadow-[0_0_24px_var(--color-glow)]"
              enterKeyHint="send"
              disabled={loading}
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <button
                onClick={handleMicToggle}
                disabled={loading || voice.isActive}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-all hover:bg-surface/40 hover:text-accent active:scale-90 disabled:opacity-30"
                aria-label="Voice mode"
                title="Press M to talk"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M10 2a2.5 2.5 0 0 0-2.5 2.5v5a2.5 2.5 0 0 0 5 0v-5A2.5 2.5 0 0 0 10 2Z" />
                  <path d="M16 8.5v1a6 6 0 0 1-12 0v-1" />
                  <line x1="10" y1="15.5" x2="10" y2="18" />
                </svg>
              </button>

              <button
                onClick={() => {
                  hapticImpact('light')
                  void runAsk(question)
                }}
                disabled={loading || !question.trim()}
                className="flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-medium text-void transition-all hover:bg-accent/90 active:scale-95 disabled:opacity-40"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-void/30 border-t-void" />
                ) : (
                  'Ask'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
