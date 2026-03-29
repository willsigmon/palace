'use client'

import { useRef, useEffect, useState } from 'react'

interface ScrollRevealProps {
  readonly children: React.ReactNode
  readonly delay?: number
  readonly className?: string
}

/**
 * CSS + IntersectionObserver scroll reveal.
 * Cards fade up as they enter the viewport.
 */
export function ScrollReveal({ children, delay = 0, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setVisible(true)
      return
    }

    // Check if already in viewport on mount — reveal immediately with stagger
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight) {
      const timer = setTimeout(() => setVisible(true), delay * 1000)
      return () => clearTimeout(timer)
    }

    // Below viewport — use intersection observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.02 },
    )

    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: visible
          ? 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
          : 'none',
      }}
    >
      {children}
    </div>
  )
}
