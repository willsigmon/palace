'use client'

import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { VoiceMessage } from '@/components/voice/voice-message'
import { TypewriterText } from '@/components/ask/typewriter-text'
import type { ThreadMessage } from '@/components/ask/types'

interface ThreadMessageListProps {
  readonly thread: readonly ThreadMessage[]
}

export function ThreadMessageList({ thread }: ThreadMessageListProps) {
  return (
    <div className="space-y-6 pb-4">
      {thread.map((message, index) => {
        const isLatest = index === thread.length - 1

        return (
          <div key={message.id} className="animate-fade-in space-y-4">
            <div className="flex gap-3">
              <div className="mt-1 shrink-0">
                <Avatar name="Will Sigmon" size="sm" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                {message.mode === 'voice' && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="shrink-0 text-muted/40">
                    <path d="M6 1a1.5 1.5 0 0 0-1.5 1.5v3a1.5 1.5 0 0 0 3 0v-3A1.5 1.5 0 0 0 6 1Z" />
                    <path d="M9.5 5v.5a3.5 3.5 0 0 1-7 0V5" />
                  </svg>
                )}
                <p className="text-[14px] font-medium text-text">{message.question}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-accent">
                <span className="font-[family-name:var(--font-serif)] text-[10px] font-bold italic text-void">
                  {message.mode === 'voice' ? 'M' : 'P'}
                </span>
              </div>

              {message.mode === 'voice' ? (
                <VoiceMessage
                  response={message.answer}
                  model={message.model ?? ''}
                  audioBase64={message.audioBase64}
                  timings={message.timings}
                />
              ) : (
                <div className="min-w-0 flex-1">
                  {isLatest ? (
                    <TypewriterText
                      text={message.answer}
                      className="cursor-pointer whitespace-pre-wrap text-[14px] leading-[1.8] text-text/90"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-[14px] leading-[1.8] text-text/90">{message.answer}</div>
                  )}
                  <SourcesPanel message={message} show={message.mode === 'text'} />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SourcesPanel({ message, show }: { message: ThreadMessage; show: boolean }) {
  const sources = message.sources
  const hasSources = Boolean(
    sources && (sources.conversations.length > 0 || sources.memories > 0 || sources.people.length > 0),
  )

  if (!show || !sources || !hasSources) {
    return null
  }

  return (
    <div className="mt-4 animate-fade-in rounded-lg border border-border/20 bg-surface/20 p-3">
      <p className="mb-2 text-[9px] font-medium uppercase tracking-widest text-muted/40">Sources</p>
      <div className="flex flex-wrap gap-1.5">
        {sources.conversations.map((conversation) => (
          <Link
            key={conversation.id}
            href={`/conversation/${conversation.id}`}
            className="rounded-md bg-elevated/40 px-2 py-0.5 text-[10px] text-muted/60 transition-colors hover:text-accent"
          >
            {(conversation.title ?? 'Untitled').slice(0, 35)}
          </Link>
        ))}
        {sources.memories > 0 && (
          <span className="rounded-md bg-memory/10 px-2 py-0.5 text-[10px] text-memory/50">
            {sources.memories} memories
          </span>
        )}
        {sources.people.map((person) => (
          <span key={person} className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] text-accent/50">
            {person}
          </span>
        ))}
      </div>
    </div>
  )
}
