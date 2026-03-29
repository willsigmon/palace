'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface ScrollRevealProps {
  readonly children: React.ReactNode
  readonly delay?: number
  readonly className?: string
}

/**
 * Wraps children in a GSAP-powered scroll reveal animation.
 * Cards fade in and slide up as they enter the viewport.
 */
export function ScrollReveal({ children, delay = 0, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Check for reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    gsap.set(el, { opacity: 0, y: 24 })

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay,
          ease: 'power2.out',
        })
      },
    })

    return () => trigger.kill()
  }, [delay])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
