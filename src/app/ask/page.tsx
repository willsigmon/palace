'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { useMarlinVoice, type VoiceResult } from '@/hooks/use-marlin-voice'
import { VoiceInputBar } from '@/components/voice/voice-input-bar'
import { VoiceMessage } from '@/components/voice/voice-message'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.wsig.me'

interface ThreadMessage {
  id: string
  mode: 'text' | 'voice'
  question: string
  answer: string
  sources?: {
    conversations: { id: number; title: string; date: string }[]
    memories: number
    people: string[]
  }
  audioBase64?: string
  timings?: { stt: number; llm: number; tts: number; total: number }
  model?: string
}

const EXAMPLE_QUESTIONS = [
  "Who is Carter and what do we work on together?",
  "What have I been doing with HubZone lately?",
  "Tell me about my family",
  "What's the status of the Kyndred project?",
  "Who do I talk to the most?",
  "What happened last Tuesday?",
]

const CHARS_PER_FRAME = 2
const FRAME_INTERVAL = 16

function useTypewriter(fullText: string, active: boolean) {
  const [revealed, setRevealed] = useState('')
  const [done, setDone] = useState(false)
  const rafRef = useRef<number>(0)
  const indexRef = useRef(0)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    if (!active || !fullText) {
      setRevealed(active ? '' : fullText)
      setDone(!active)
      indexRef.current = 0
      return
    }

    setRevealed('')
    setDone(false)
    indexRef.current = 0
    lastTimeRef.current = 0

    function step(timestamp: number) {
      if (timestamp - lastTimeRef.current >= FRAME_INTERVAL) {
        lastTimeRef.current = timestamp
        indexRef.current = Math.min(indexRef.current + CHARS_PER_FRAME, fullText.length)
        setRevealed(fullText.slice(0, indexRef.current))

        if (indexRef.current >= fullText.length) {
          setDone(true)
          return
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [fullText, active])

  const skip = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setRevealed(fullText)
    setDone(true)
  }, [fullText])

  return { revealed, done, skip }
}

function AskPageInner() {
  const searchParams = useSearchParams()
  const [question, setQuestion] = useState('')
  const [thread, setThread] = useState<ThreadMessage[]>([])
  const [activeAnswer, setActiveAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [pendingTranscript, setPendingTranscript] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const threadEndRef = useRef<HTMLDivElement>(null)
  const voiceStartedRef = useRef(false)

  const { revealed, done, skip } = useTypewriter(activeAnswer, typing)

  const scrollToBottom = useCallback(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Voice hook with result callback
  const voice = useMarlinVoice({
    onResult: useCallback((result: VoiceResult) => {
      const msg: ThreadMessage = {
        id: `voice-${Date.now()}`,
        mode: 'voice',
        question: result.transcript,
        answer: result.response,
        audioBase64: result.audioBase64,
        timings: result.timings,
        model: result.model,
      }
      setThread((prev) => [...prev, msg])
      setPendingTranscript('')
      setActiveAnswer(result.response)
      setTyping(true)
      scrollToBottom()
    }, [scrollToBottom]),
  })

  // When voice starts processing, show the transcript immediately
  useEffect(() => {
    if (voice.state === 'processing') {
      setPendingTranscript('Processing...')
    }
    if (voice.state === 'idle' || voice.state === 'error') {
      setPendingTranscript('')
    }
  }, [voice.state])

  // When typing finishes
  useEffect(() => {
    if (done && typing) {
      setTyping(false)
      setActiveAnswer('')
    }
  }, [done, typing])

  // Auto-start voice from ?voice=1
  useEffect(() => {
    if (searchParams.get('voice') === '1' && !voiceStartedRef.current) {
      voiceStartedRef.current = true
      setVoiceMode(true)
    }
  }, [searchParams])

  // Scroll on new thread messages
  useEffect(() => {
    scrollToBottom()
  }, [thread.length, scrollToBottom])

  // Text ask
  async function ask(q: string) {
    const query = q || question
    if (!query.trim()) return
    setLoading(true)
    setActiveAnswer('')
    setTyping(false)
    setQuestion('')

    try {
      const res = await fetch(`${API_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      })
      const data = await res.json()
      const msg: ThreadMessage = {
        id: `text-${Date.now()}`,
        mode: 'text',
        question: query,
        answer: data.answer,
        sources: data.sources,
      }
      setThread((prev) => [...prev, msg])
      setActiveAnswer(data.answer)
      setTyping(true)
    } catch {
      const msg: ThreadMessage = {
        id: `text-${Date.now()}`,
        mode: 'text',
        question: query,
        answer: 'Failed to reach PALACE. Check API connection.',
      }
      setThread((prev) => [...prev, msg])
    } finally {
      setLoading(false)
    }
  }

  // Mic button handler
  function toggleVoice() {
    if (voice.state === 'idle') {
      setVoiceMode(true)
      voice.startListening()
    } else if (voice.state === 'listening') {
      voice.stopListening()
    }
  }

  // Keyboard: M toggles voice mode, Space hold-to-talk
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === 'm' && voice.state === 'idle') {
        e.preventDefault()
        setVoiceMode(true)
        voice.startListening()
      }
      if (e.code === 'Space' && !e.repeat && voice.state === 'idle' && voiceMode) {
        e.preventDefault()
        voice.startListening()
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space' && voice.state === 'listening') {
        e.preventDefault()
        voice.stopListening()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [voice])

  const showEmpty = thread.length === 0 && !loading && !voice.isActive

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-[var(--space-page)] py-8" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
          The Oracle
        </h1>
        <p className="mt-1.5 text-sm text-sub">
          Ask anything about your life. Type or talk.
        </p>
      </header>

      {/* Example questions — only when empty */}
      {showEmpty && (
        <div className="mb-8">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted/40">
            {voiceMode ? 'Try saying' : 'Try asking'}
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => { setQuestion(q); ask(q); }}
                className="rounded-full border border-border/30 bg-surface/20 px-3 py-1.5 text-[11px] text-sub/60 transition-all hover:border-accent/30 hover:text-accent"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Thread */}
      <div className="flex-1 space-y-6 pb-4">
        {thread.map((msg, i) => {
          const isLatest = i === thread.length - 1
          const showTypewriter = isLatest && typing

          return (
            <div key={msg.id} className="space-y-4">
              {/* User message */}
              <div className="flex gap-3">
                <div className="mt-1 shrink-0">
                  <Avatar name="Will Sigmon" size="sm" />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {msg.mode === 'voice' && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-muted/40 shrink-0">
                      <path d="M6 1a1.5 1.5 0 0 0-1.5 1.5v3a1.5 1.5 0 0 0 3 0v-3A1.5 1.5 0 0 0 6 1Z" />
                      <path d="M9.5 5v.5a3.5 3.5 0 0 1-7 0V5" />
                    </svg>
                  )}
                  <p className="text-[14px] font-medium text-text">{msg.question}</p>
                </div>
              </div>

              {/* Oracle/Marlin response */}
              <div className="flex gap-3">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-accent">
                  <span className="text-[10px] font-bold text-void font-[family-name:var(--font-serif)] italic">
                    {msg.mode === 'voice' ? 'M' : 'P'}
                  </span>
                </div>

                {msg.mode === 'voice' ? (
                  <VoiceMessage
                    response={showTypewriter ? revealed : msg.answer}
                    model={msg.model ?? ''}
                    audioBase64={msg.audioBase64}
                    timings={msg.timings}
                  />
                ) : (
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[14px] leading-[1.8] text-text/90 whitespace-pre-wrap cursor-pointer"
                      onClick={showTypewriter ? skip : undefined}
                    >
                      {showTypewriter ? revealed : msg.answer}
                      {showTypewriter && <span className="inline-block w-[2px] h-[1em] bg-accent/70 ml-0.5 align-text-bottom animate-pulse" />}
                    </div>

                    {/* Sources */}
                    {(!showTypewriter || done) && msg.sources &&
                      (msg.sources.conversations.length > 0 || msg.sources.memories > 0 || msg.sources.people.length > 0) && (
                      <div className="mt-4 rounded-lg border border-border/20 bg-surface/20 p-3 animate-fade-in">
                        <p className="mb-2 text-[9px] font-medium uppercase tracking-widest text-muted/40">Sources</p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.conversations.map((c) => (
                            <Link
                              key={c.id}
                              href={`/conversation/${c.id}`}
                              className="rounded-md bg-elevated/40 px-2 py-0.5 text-[10px] text-muted/60 hover:text-accent transition-colors"
                            >
                              {c.title?.slice(0, 35) ?? 'Untitled'}
                            </Link>
                          ))}
                          {msg.sources.memories > 0 && (
                            <span className="rounded-md bg-memory/10 px-2 py-0.5 text-[10px] text-memory/50">
                              {msg.sources.memories} memories
                            </span>
                          )}
                          {msg.sources.people.map((p) => (
                            <span key={p} className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] text-accent/50">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Pending voice transcript */}
        {pendingTranscript && voice.state === 'processing' && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-accent animate-pulse">
              <span className="text-[10px] font-bold text-void font-[family-name:var(--font-serif)] italic">M</span>
            </div>
            <span className="text-sm text-sub">Marlin is thinking...</span>
          </div>
        )}

        {/* Text loading */}
        {loading && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-accent animate-pulse">
              <span className="text-[10px] font-bold text-void font-[family-name:var(--font-serif)] italic">P</span>
            </div>
            <span className="text-sm text-sub">Searching your memories...</span>
          </div>
        )}

        {/* Voice error */}
        {voice.error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400">
            {voice.error}
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* Input bar — sticky bottom */}
      <div className="sticky bottom-0 bg-void/80 backdrop-blur-sm pb-4 pt-2 -mx-[var(--space-page)] px-[var(--space-page)] border-t border-border/10">
        {voice.isActive ? (
          <div className="rounded-xl border border-accent/30 bg-surface/20 px-4">
            <VoiceInputBar
              state={voice.state}
              audioLevel={voice.audioLevel}
              onStop={voice.stopListening}
            />
          </div>
        ) : (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask('')}
              placeholder={voiceMode ? 'Type or press M to talk...' : 'What would you like to know?'}
              className="w-full rounded-xl border border-border/40 bg-surface/30 py-4 pl-5 pr-28 text-base text-text placeholder:text-muted/50 outline-none transition-all focus:border-accent/40 focus:shadow-[0_0_24px_var(--color-glow)]"
              autoFocus
              disabled={loading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {/* Mic button */}
              <button
                onClick={toggleVoice}
                disabled={loading || voice.isActive}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-all hover:bg-surface/40 hover:text-accent disabled:opacity-30"
                aria-label="Voice mode"
                title="Press M to talk"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M9 2a2 2 0 0 0-2 2v4.5a2 2 0 0 0 4 0V4a2 2 0 0 0-2-2Z" />
                  <path d="M14 7.5v1a5 5 0 0 1-10 0v-1" />
                  <line x1="9" y1="13.5" x2="9" y2="16" />
                </svg>
              </button>

              {/* Ask button */}
              <button
                onClick={() => ask('')}
                disabled={loading || !question.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-void transition-all hover:bg-accent/90 disabled:opacity-40"
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

export default function AskPage() {
  return (
    <Suspense>
      <AskPageInner />
    </Suspense>
  )
}
