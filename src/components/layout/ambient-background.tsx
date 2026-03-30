'use client'

/**
 * Ambient background — drifting radial gradient orbs + paper grain
 * Creates the "warm noir living depth" atmosphere
 * Colors adapt to theme via CSS custom properties
 */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Primary warm orb — top right, drifts slowly */}
      <div
        className="absolute -top-[20%] -right-[10%] h-[60vh] w-[60vh] rounded-full animate-drift-1"
        style={{
          background: 'radial-gradient(circle, var(--color-orb-warm), transparent 70%)',
        }}
      />
      {/* Secondary cool orb — bottom left */}
      <div
        className="absolute -bottom-[15%] -left-[10%] h-[50vh] w-[50vh] rounded-full animate-drift-2"
        style={{
          background: 'radial-gradient(circle, var(--color-orb-cool), transparent 70%)',
        }}
      />
      {/* Accent orb — center */}
      <div
        className="absolute top-[40%] left-[50%] h-[40vh] w-[40vh] -translate-x-1/2 rounded-full animate-drift-3"
        style={{
          background: 'radial-gradient(circle, var(--color-orb-accent), transparent 70%)',
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
      <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 200px var(--color-vignette)' }} />
    </div>
  )
}
