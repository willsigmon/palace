'use client'

import Image from 'next/image'
import { useState } from 'react'
import { getPhotoPathForName } from '@/lib/photo-manifest'
import { getRuntimeConfig, resolveRuntimeUrl } from '@/lib/runtime-config'

/**
 * Resolve a photo URL from the API. Absolute URLs pass through;
 * relative paths are resolved against NEXT_PUBLIC_API_URL so next/image
 * receives a fully-qualified https URL.
 */
function resolvePhotoUrl(input: string): string {
  if (/^https?:\/\//i.test(input)) return input
  if (input.startsWith('/photos/')) return input // local manifest
  try {
    const { apiBaseUrl } = getRuntimeConfig()
    return resolveRuntimeUrl(apiBaseUrl, input.startsWith('/') ? input : `/${input}`)
  } catch {
    return input
  }
}

/**
 * Avatar with real contact photo fallback to color-coded initials.
 * Photos served from /photos/{first-last}.jpg
 * Initials use grapheme-color synesthesia hue mapping.
 */

const LETTER_HUE: Record<string, number> = {
  A: 25, B: 250, C: 65, D: 145, E: 15, F: 290, G: 170, H: 40,
  I: 310, J: 200, K: 80, L: 55, M: 350, N: 120, O: 30, P: 270,
  Q: 180, R: 0, S: 220, T: 100, U: 160, V: 300, W: 240, X: 50,
  Y: 90, Z: 330,
}

function getHue(letter: string): number {
  return LETTER_HUE[letter.toUpperCase()] ?? 200
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]?.[0]?.toUpperCase() ?? '?'
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase()
}

interface AvatarProps {
  readonly name: string
  readonly size?: 'sm' | 'md' | 'lg' | 'xl'
  readonly photoUrl?: string
}

const SIZE_CLASSES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-[11px]',
  lg: 'h-10 w-10 text-[13px]',
  xl: 'h-14 w-14 text-[16px]',
} as const

const SIZE_PX = { sm: 24, md: 32, lg: 40, xl: 56 } as const

export function Avatar({ name, size = 'md', photoUrl }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const initials = getInitials(name)
  const hue = getHue(initials[0] ?? 'A')
  const rawSrc = photoUrl ?? getPhotoPathForName(name)
  const src = rawSrc ? resolvePhotoUrl(rawSrc) : null
  const dimension = SIZE_PX[size]

  if (src && !imgFailed) {
    return (
      <Image
        src={src}
        alt={name}
        title={name}
        width={dimension}
        height={dimension}
        className={`shrink-0 rounded-full object-cover ${SIZE_CLASSES[size]}`}
        onError={() => setImgFailed(true)}
      />
    )
  }

  return (
    <span
      className={`avatar-adaptive inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${SIZE_CLASSES[size]}`}
      style={{ '--avatar-hue': `${hue}` } as React.CSSProperties}
      title={name}
    >
      {initials}
    </span>
  )
}
