'use client'

/**
 * Color-coded initials avatar
 * Hues loosely based on grapheme-color synesthesia mapping.
 * The user has synesthesia — these color-letter associations are meaningful.
 */

// Hue per letter (0-360, oklch hue angle)
// Tuned for visual distinctness + common synesthesia patterns
const LETTER_HUE: Record<string, number> = {
  A: 25,   // warm red-orange
  B: 250,  // blue
  C: 65,   // yellow
  D: 145,  // green
  E: 15,   // red
  F: 290,  // purple
  G: 170,  // teal
  H: 40,   // amber
  I: 310,  // magenta
  J: 200,  // sky blue
  K: 80,   // lime
  L: 55,   // gold
  M: 350,  // rose
  N: 120,  // emerald
  O: 30,   // orange
  P: 270,  // violet
  Q: 180,  // cyan
  R: 0,    // red
  S: 220,  // steel blue
  T: 100,  // green-yellow
  U: 160,  // sea green
  V: 300,  // fuschia
  W: 240,  // indigo
  X: 50,   // dark gold
  Y: 90,   // chartreuse
  Z: 330,  // hot pink
}

function getHue(letter: string): number {
  return LETTER_HUE[letter.toUpperCase()] ?? 200
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface AvatarProps {
  readonly name: string
  readonly size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-[11px]',
  lg: 'h-10 w-10 text-[13px]',
} as const

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const initials = getInitials(name)
  const hue = getHue(initials[0])

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${SIZE_CLASSES[size]}`}
      style={{
        backgroundColor: `oklch(0.35 0.12 ${hue} / 0.2)`,
        color: `oklch(0.70 0.15 ${hue})`,
      }}
      title={name}
    >
      {initials}
    </span>
  )
}

/**
 * Light-theme aware variant — adjusts lightness for readability.
 * Uses the same component; CSS handles the adaptation since
 * oklch lightness 0.70 works on dark bg and oklch 0.45 on light bg.
 * We use a CSS variable approach to adapt.
 */
export function AvatarLight({ name, size = 'md' }: AvatarProps) {
  const initials = getInitials(name)
  const hue = getHue(initials[0])

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold avatar-adaptive ${SIZE_CLASSES[size]}`}
      style={{
        '--avatar-hue': `${hue}`,
      } as React.CSSProperties}
      title={name}
    >
      {initials}
    </span>
  )
}
