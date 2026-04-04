'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getRandomConversation } from '@/lib/api'

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

/**
 * Wormhole — floating button that teleports you to a random memory.
 * Keyboard shortcut: W (when no input focused)
 * Also handles Konami code -> The Vault
 */
export function WormholeButton() {
  const router = useRouter()
  const [traveling, setTraveling] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const konamiRef = useRef<string[]>([])

  const travel = useCallback(async () => {
    if (traveling) return
    setTraveling(true)

    try {
      const conversation = await getRandomConversation()
      if (!conversation) {
        setTraveling(false)
        return
      }

      // Animate the wormhole overlay
      const overlay = overlayRef.current
      if (overlay) {
        overlay.classList.add('wormhole-active')
      }

      // Navigate after the transition peak
      setTimeout(() => {
        router.push(`/conversation/${conversation.id}`)
        // Reset after navigation
        setTimeout(() => {
          setTraveling(false)
          if (overlay) overlay.classList.remove('wormhole-active')
        }, 300)
      }, 500)
    } catch {
      setTraveling(false)
    }
  }, [traveling, router])

  // Keyboard shortcut: W when no input focused + Konami code -> Vault
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable

      // Konami code tracking (works even in inputs)
      konamiRef.current = [...konamiRef.current, e.key].slice(-KONAMI.length)
      if (konamiRef.current.length === KONAMI.length && konamiRef.current.every((k, i) => k === KONAMI[i])) {
        konamiRef.current = []
        localStorage.setItem('palace-vault-discovered', 'true')
        router.push('/vault')
        return
      }

      // W shortcut — skip if in input or search overlay open
      if ((e.key === 'w' || e.key === 'W') && !isInput) {
        if (e.metaKey || e.ctrlKey || e.altKey) return
        if (document.querySelector('[data-search-overlay]')) return
        e.preventDefault()
        travel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [travel, router])

  return (
    <>
      {/* Wormhole transition overlay */}
      <div
        ref={overlayRef}
        className="wormhole-overlay pointer-events-none fixed inset-0 z-50"
        aria-hidden="true"
      />

      {/* Floating button */}
      <button
        onClick={travel}
        disabled={traveling}
        className="fixed bottom-24 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-border/30 bg-surface/60 backdrop-blur-sm text-muted transition-all duration-300 hover:border-accent/40 hover:text-accent hover:shadow-[0_0_20px_var(--color-glow)] hover:scale-105 active:scale-95 disabled:opacity-50 md:bottom-6 md:right-6"
        aria-label="Travel to random memory"
        title="Wormhole — random memory (W)"
      >
        {traveling ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="10" cy="10" r="7" opacity="0.4" />
            <circle cx="10" cy="10" r="4" opacity="0.7" />
            <circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none" />
            <path d="M10 3v2M10 15v2M3 10h2M15 10h2" opacity="0.3" />
          </svg>
        )}
      </button>
    </>
  )
}
