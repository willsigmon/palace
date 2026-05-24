'use client'

import { Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ExampleQuestionList } from '@/components/ask/example-question-list'
import { ThreadMessageList } from '@/components/ask/thread-message-list'
import type { ThreadMessage } from '@/components/ask/types'
import { CommandCenterSnapshot, type CommandCenterSnapshotData } from '@/components/ask/command-center-snapshot'
import { VoiceInputBar } from '@/components/voice/voice-input-bar'
import { useMarlinVoice, type VoiceResult } from '@/hooks/use-marlin-voice'
import { reprocessConversationTranscript } from '@/lib/marlin'
import { hapticImpact, hapticSelection } from '@/lib/haptics'

const EXAMPLE_QUESTIONS = [
  'What do I need to follow up on?',
  'What happened yesterday?',
  'Find recent Carter updates.',
  'What did I promise this week?',
] as const

const QUICK_LINKS = [
  {
    href: '/search',
    label: 'Search archive',
    description: 'Find a person, project, promise, or phrase.',
    icon: '⌕',
  },
  {
    href: '/actions',
    label: 'Open actions',
    description: 'Review what conversations turned into tasks.',
    icon: '✓',
  },
  {
    href: '/timeline',
    label: 'Latest timeline',
    description: 'See what PALACE captured recently.',
    icon: '↕',
  },
  {
    href: '/memories',
    label: 'Memory cards',
    description: 'Browse extracted facts and insights.',
    icon: '◌',
  },
] as const

export function AskPageController({ snapshot }: { readonly snapshot?: CommandCenterSnapshotData | null }) {
  return (
    <Suspense>
      <AskPageControllerInner snapshot={snapshot ?? null} />
    </Suspense>
  )
}

function AskPageControllerInner({ snapshot }: { readonly snapshot: CommandCenterSnapshotData | null }) {
  const searchParams = useSearchParams()
  const reactId = useId()
  const marlinSessionId = useMemo(
    () => `palace-${reactId.replace(/[:]/g, '')}`,
    [reactId],
  )
  const [question, setQuestion] = useState('')
  const [thread, setThread] = useState<ThreadMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [pendingTranscript, setPendingTranscript] = useState('')
  const threadEndRef = useRef<HTMLDivElement>(null)
  const voiceStartedRef = useRef(false)
  const queryStartedRef = useRef(false)

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
    sessionId: marlinSessionId,
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
      const data = await reprocessConversationTranscript({
        transcript: query,
        sessionId: marlinSessionId,
      })
      const nextMessage: ThreadMessage = {
        id: `text-${Date.now()}`,
        mode: 'text',
        question: query,
        answer: data.response,
        model: data.model,
      }
      setThread((previous) => [...previous, nextMessage])
    } catch (error) {
      const fallback = error instanceof Error
        ? `Failed to reach WSIG voice service: ${error.message}`
        : 'Failed to reach WSIG voice service. Check the connection.'

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
  }, [marlinSessionId])

  useEffect(() => {
    const prompt = searchParams.get('q')?.trim()
    if (prompt && !queryStartedRef.current) {
      queryStartedRef.current = true
      void runAsk(prompt)
    }
  }, [runAsk, searchParams])

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
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          WSIG ready
        </div>
        <h1 className="text-[clamp(2.1rem,11vw,4.5rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-text">
          Ask clearly.
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-7 text-sub">
          WSIG is the front door to your archive: quick answers, follow-ups, recent context,
          and search without digging through every surface.
        </p>
      </header>

      {showEmpty && (
        <div className="space-y-5">
          <CommandCenterSnapshot snapshot={snapshot} />

          <div className="hidden grid-cols-2 gap-2 sm:grid">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-border/30 bg-surface/30 p-3 transition-all hover:-translate-y-0.5 hover:border-accent/25 hover:bg-surface/50 hover:shadow-card sm:p-4"
              >
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/30 bg-elevated/30 font-[family-name:var(--font-serif)] text-base italic text-accent sm:h-9 sm:w-9 sm:text-lg">
                    {item.icon}
                  </span>
                  <span className="text-muted/35 transition-transform group-hover:translate-x-1 group-hover:text-accent">→</span>
                </div>
                <p className="text-sm font-medium text-text">{item.label}</p>
                <p className="mt-1 hidden text-[12px] leading-5 text-muted/70 sm:block">{item.description}</p>
              </Link>
            ))}
          </div>

          <ExampleQuestionList
            questions={EXAMPLE_QUESTIONS}
            voiceMode={voiceMode}
            onSelect={handleExampleSelect}
          />
        </div>
      )}

      <div className="flex-1 pb-4">
        <ThreadMessageList thread={thread} />

        {pendingTranscript && voice.state === 'processing' && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-accent animate-pulse">
              <span className="font-[family-name:var(--font-serif)] text-[10px] font-bold italic text-void">M</span>
            </div>
            <span className="text-sm text-sub">WSIG is thinking...</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-accent animate-pulse">
              <span className="font-[family-name:var(--font-serif)] text-[10px] font-bold italic text-void">P</span>
            </div>
            <span className="text-sm text-sub">Asking WSIG...</span>
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
        className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] -mx-[var(--space-page)] border-t border-border/10 bg-void/90 px-[var(--space-page)] pt-2 backdrop-blur-md md:bottom-0 md:mx-0 md:border-t-0 md:bg-transparent md:px-0 md:backdrop-blur-0"
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
              placeholder={voiceMode ? 'Type or press M to talk...' : 'Ask WSIG anything...'}
              className="w-full rounded-2xl border border-border/40 bg-surface/40 py-4 pl-5 pr-32 text-[16px] text-text outline-none transition-all placeholder:text-muted/50 focus:border-accent/40 focus:bg-surface/55 focus:shadow-[0_0_24px_var(--color-glow)]"
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
