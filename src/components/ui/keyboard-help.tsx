'use client'

import { useEffect, useState } from 'react'

interface Shortcut {
  readonly keys: readonly string[]
  readonly description: string
}

const SHORTCUTS_LIST: readonly Shortcut[] = [
  { keys: ['J'], description: 'Next card' },
  { keys: ['K'], description: 'Previous card' },
  { keys: ['Enter'], description: 'Open selected' },
  { keys: ['/'], description: 'Focus search' },
  { keys: ['⌘', 'K'], description: 'Quick search' },
  { keys: ['Esc'], description: 'Close / dismiss' },
  { keys: ['T'], description: 'Toggle theme' },
  { keys: ['?'], description: 'Show this help' },
]

export function KeyboardHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement).isContentEditable) {
        return
      }

      if (e.key === '?') {
        e.preventDefault()
        setOpen((prev) => !prev)
        return
      }

      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 glass-heavy"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md mx-4 rounded-xl border border-border/40 bg-elevated shadow-glass">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/20 px-5 py-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted/70">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-muted/40 transition-colors hover:text-muted hover:bg-surface/50"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>
        </div>

        {/* Shortcut grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-5">
          {SHORTCUTS_LIST.map((shortcut) => (
            <div
              key={shortcut.description}
              className="flex items-center justify-between gap-3"
            >
              <span className="text-[12px] text-sub/80">{shortcut.description}</span>
              <div className="flex items-center gap-1 shrink-0">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-border/40 bg-surface/60 px-1.5 font-[family-name:var(--font-mono)] text-[10px] text-muted"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border/20 px-5 py-3">
          <p className="text-[10px] text-muted/40 text-center">
            Press <kbd className="inline rounded border border-border/30 bg-surface/40 px-1 font-[family-name:var(--font-mono)] text-[9px] text-muted/60">?</kbd> or <kbd className="inline rounded border border-border/30 bg-surface/40 px-1 font-[family-name:var(--font-mono)] text-[9px] text-muted/60">Esc</kbd> to dismiss
          </p>
        </div>
      </div>
    </div>
  )
}
