'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useTimeOfDay } from '@/hooks/use-time-of-day'
import { useAppStore } from '@/stores/app-store'
import { ROOM_TINTS, CATEGORY_HUES } from '@/lib/constants'

/**
 * Ambient background — drifting radial gradient orbs + paper grain
 * Creates the "warm noir living depth" atmosphere
 *
 * Layers:
 * 1. Time-of-day: CSS attribute selectors shift orb base colors (see globals.css)
 * 2. Room tints: pathname-driven hue shifts on orb gradients
 * 3. Activity pulse: active conversation category overrides hues temporarily
 * 4. Breathing: CSS animation layered on drift for living pulse
 */
export function AmbientBackground() {
  useTimeOfDay() // sets data-time on <html>

  const pathname = usePathname()
  const activeCategory = useAppStore((s) => s.activeCategory)

  // Resolve room tint — find the matching route prefix
  const roomTint = useMemo(() => {
    // Exact match first, then prefix match for nested routes like /people/[id]
    if (ROOM_TINTS[pathname]) return ROOM_TINTS[pathname]
    const prefix = Object.keys(ROOM_TINTS).find(
      (key) => key !== '/' && pathname.startsWith(key),
    )
    return prefix ? ROOM_TINTS[prefix] : ROOM_TINTS['/']
  }, [pathname])

  // If viewing a conversation with a category, pulse toward that hue
  const hues = useMemo(() => {
    if (activeCategory && CATEGORY_HUES[activeCategory]) {
      const catHue = CATEGORY_HUES[activeCategory]
      return { warm: catHue, cool: roomTint.cool, accent: catHue }
    }
    return roomTint
  }, [activeCategory, roomTint])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Primary warm orb — top right, drifts slowly */}
      <div
        className="absolute -top-[20%] -right-[10%] h-[60vh] w-[60vh] rounded-full animate-drift-1"
        style={{
          background: `radial-gradient(circle, oklch(0.30 0.08 ${hues.warm} / var(--orb-warm-alpha, 0.15)), transparent 70%)`,
          transition: 'background 1.5s ease',
        }}
      />
      {/* Secondary cool orb — bottom left */}
      <div
        className="absolute -bottom-[15%] -left-[10%] h-[50vh] w-[50vh] rounded-full animate-drift-2"
        style={{
          background: `radial-gradient(circle, oklch(0.25 0.06 ${hues.cool} / var(--orb-cool-alpha, 0.12)), transparent 70%)`,
          transition: 'background 1.5s ease',
        }}
      />
      {/* Accent orb — center */}
      <div
        className="absolute top-[40%] left-[50%] h-[40vh] w-[40vh] -translate-x-1/2 rounded-full animate-drift-3"
        style={{
          background: `radial-gradient(circle, oklch(0.25 0.05 ${hues.accent} / var(--orb-accent-alpha, 0.08)), transparent 70%)`,
          transition: 'background 1.5s ease',
        }}
      />

      {/* Paper grain texture overlay */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.03]">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Vignette overlay */}
      <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 200px var(--color-vignette)', transition: 'box-shadow 1.5s ease' }} />
    </div>
  )
}
