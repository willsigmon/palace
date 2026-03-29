'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Global keyboard navigation for the Stream.
 * J/K to move between cards, Enter to open, / to focus search.
 */
export function KeyboardNav() {
  const router = useRouter()

  useEffect(() => {
    let selectedIndex = -1

    function getCards(): HTMLAnchorElement[] {
      return Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-card-index]'))
    }

    function highlightCard(index: number) {
      const cards = getCards()
      // Remove previous highlight
      for (const card of cards) {
        card.classList.remove('ring-1', 'ring-accent/40')
      }
      // Add new highlight
      if (index >= 0 && index < cards.length) {
        const card = cards[index]!
        card.classList.add('ring-1', 'ring-accent/40')
        card.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      // Don't capture when search overlay is open
      if (document.querySelector('[data-search-overlay]')) return

      const cards = getCards()
      if (cards.length === 0) return

      switch (e.key) {
        case 'j':
          e.preventDefault()
          selectedIndex = Math.min(selectedIndex + 1, cards.length - 1)
          highlightCard(selectedIndex)
          break
        case 'k':
          e.preventDefault()
          selectedIndex = Math.max(selectedIndex - 1, 0)
          highlightCard(selectedIndex)
          break
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < cards.length) {
            e.preventDefault()
            const href = cards[selectedIndex]!.getAttribute('href')
            if (href) router.push(href)
          }
          break
        case '/':
          e.preventDefault()
          useAppStore.getState().openSearch()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  return null
}

// Need to import for the / shortcut
import { useAppStore } from '@/stores/app-store'
