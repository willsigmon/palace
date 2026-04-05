'use client'

/**
 * Ambient background — subtle grain texture + vignette.
 * Clean, app-appropriate. No drifting orbs.
 */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Paper grain texture */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.025]">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Subtle vignette */}
      <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 150px oklch(0 0 0 / 0.3)' }} />
    </div>
  )
}
