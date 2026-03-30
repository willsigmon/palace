'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.wsig.me'

interface AskResponse {
  question: string
  answer: string
  sources: {
    conversations: { id: number; title: string; date: string }[]
    memories: number
    people: string[]
  }
}

const EXAMPLE_QUESTIONS = [
  "Who is Carter and what do we work on together?",
  "What have I been doing with HubZone lately?",
  "Tell me about my family",
  "What's the status of the Kyndred project?",
  "Who do I talk to the most?",
  "What happened last Tuesday?",
]

export default function AskPage() {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState<AskResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<AskResponse[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  async function ask(q: string) {
    const query = q || question
    if (!query.trim()) return
    setLoading(true)
    setResponse(null)

    try {
      const res = await fetch(`${API_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      })
      const data: AskResponse = await res.json()
      setResponse(data)
      setHistory((prev) => [data, ...prev].slice(0, 10))
    } catch {
      setResponse({ question: query, answer: 'Failed to reach PALACE. Check API connection.', sources: { conversations: [], memories: 0, people: [] } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
          Ask PALACE
        </h1>
        <p className="mt-1.5 text-sm text-sub">
          Ask anything about your life. Powered by your conversations, memories, and relationships.
        </p>
      </header>

      {/* Input */}
      <div className="mb-6">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask('')}
            placeholder="What would you like to know?"
            className="w-full rounded-xl border border-border/40 bg-surface/30 py-4 pl-5 pr-24 text-base text-text placeholder:text-muted/50 outline-none transition-all focus:border-accent/40 focus:shadow-[0_0_24px_oklch(0.73_0.20_30_/_0.08)]"
            autoFocus
            disabled={loading}
          />
          <button
            onClick={() => ask('')}
            disabled={loading || !question.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-void transition-all hover:bg-accent/90 disabled:opacity-40"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-void/30 border-t-void" />
            ) : (
              'Ask'
            )}
          </button>
        </div>
      </div>

      {/* Example questions */}
      {!response && !loading && (
        <div className="mb-8">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted/40">Try asking</p>
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          <span className="text-sm text-sub">Searching your memories...</span>
        </div>
      )}

      {/* Response */}
      {response && !loading && (
        <div className="space-y-6">
          {/* Question */}
          <div className="flex gap-3">
            <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold text-accent">
              W
            </div>
            <p className="pt-1 text-[14px] font-medium text-text">{response.question}</p>
          </div>

          {/* Answer */}
          <div className="flex gap-3">
            <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-serendipity/15 text-[11px] font-bold text-serendipity">
              P
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] leading-[1.8] text-text/90 whitespace-pre-wrap">
                {response.answer}
              </div>

              {/* Sources */}
              {(response.sources.conversations.length > 0 || response.sources.memories > 0 || response.sources.people.length > 0) && (
                <div className="mt-4 rounded-lg border border-border/20 bg-surface/20 p-3">
                  <p className="mb-2 text-[9px] font-medium uppercase tracking-widest text-muted/40">Sources</p>
                  <div className="flex flex-wrap gap-1.5">
                    {response.sources.conversations.map((c) => (
                      <Link
                        key={c.id}
                        href={`/conversation/${c.id}`}
                        className="rounded-md bg-elevated/40 px-2 py-0.5 text-[10px] text-muted/60 hover:text-accent transition-colors"
                      >
                        {c.title?.slice(0, 35) ?? 'Untitled'}
                      </Link>
                    ))}
                    {response.sources.memories > 0 && (
                      <span className="rounded-md bg-memory/10 px-2 py-0.5 text-[10px] text-memory/50">
                        {response.sources.memories} memories
                      </span>
                    )}
                    {response.sources.people.map((p) => (
                      <span key={p} className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] text-accent/50">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Follow-up */}
          <button
            onClick={() => { setResponse(null); setQuestion(''); inputRef.current?.focus(); }}
            className="rounded-lg bg-surface/30 px-4 py-2 text-[12px] text-sub transition-colors hover:bg-surface/50 hover:text-text"
          >
            Ask another question
          </button>
        </div>
      )}

      {/* History */}
      {history.length > 1 && !loading && (
        <div className="mt-10 border-t border-border/20 pt-6">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted/30">Previous questions</p>
          <div className="space-y-2">
            {history.slice(1).map((h, i) => (
              <button
                key={i}
                onClick={() => { setQuestion(h.question); ask(h.question); }}
                className="block w-full text-left rounded-lg border border-border/15 bg-surface/10 px-4 py-2 text-[12px] text-sub/50 transition-all hover:bg-surface/30 hover:text-text"
              >
                {h.question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
