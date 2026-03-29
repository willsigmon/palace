'use client'

/**
 * Ambient background — drifting radial gradient orbs
 * Creates the "living depth" atmosphere described in the design doc
 */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Primary warm orb — top right */}
      <div
        className="ambient-glow absolute -top-[20%] -right-[10%] h-[60vh] w-[60vh] rounded-full"
        style={{
          background: 'radial-gradient(circle, oklch(0.30 0.08 30 / 0.15), transparent 70%)',
        }}
      />
      {/* Secondary cool orb — bottom left */}
      <div
        className="ambient-glow absolute -bottom-[15%] -left-[10%] h-[50vh] w-[50vh] rounded-full"
        style={{
          background: 'radial-gradient(circle, oklch(0.25 0.06 260 / 0.12), transparent 70%)',
          animationDelay: '2s',
        }}
      />
      {/* Accent orb — center, very subtle */}
      <div
        className="ambient-glow absolute top-[40%] left-[50%] h-[40vh] w-[40vh] -translate-x-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, oklch(0.25 0.05 350 / 0.08), transparent 70%)',
          animationDelay: '3s',
        }}
      />
      {/* Vignette overlay */}
      <div className="vignette absolute inset-0" />
    </div>
  )
}
