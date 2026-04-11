'use client'

/**
 * Ambient gradient orbs — Warm Noir atmosphere.
 *
 * WKWebView safety notes:
 * - Pure CSS radial-gradients on plain divs. No SVG `filter:`, no `box-shadow`.
 *   Those were what broke `backdrop-filter` on `.glass` surfaces in the v1 build.
 * - Animated with transform only (CSS keyframes in globals.css).
 * - Sits at z-index:-1; body background is transparent so the orbs are visible
 *   above the html-level void color.
 * - Orb hue tracks `activeCategory` from the Zustand store for subtle mood shift.
 */

import { useAppStore } from '@/stores/app-store'

// Category → hue angle. Matches the spirit of the conversation-card palette
// without locking to exact tokens (these are ambient tints, not UI chrome).
const CATEGORY_HUE: Record<string, number> = {
  family: 40,
  work: 220,
  music: 290,
  personal: 150,
  health: 0,
  technology: 200,
  finance: 150,
  social: 330,
  education: 260,
  real_estate: 30,
}

const DEFAULT_HUE = 30 // Warm Noir orange

export function AmbientBackground() {
  const activeCategory = useAppStore((s) => s.activeCategory)

  const hue = activeCategory
    ? CATEGORY_HUE[activeCategory.toLowerCase()] ?? DEFAULT_HUE
    : DEFAULT_HUE

  return (
    <div aria-hidden="true" className="ambient-bg">
      <div
        className="ambient-orb ambient-orb-a"
        style={{ ['--orb-hue' as string]: hue }}
      />
      <div
        className="ambient-orb ambient-orb-b"
        style={{ ['--orb-hue' as string]: (hue + 60) % 360 }}
      />
      <div
        className="ambient-orb ambient-orb-c"
        style={{ ['--orb-hue' as string]: (hue + 180) % 360 }}
      />
    </div>
  )
}
