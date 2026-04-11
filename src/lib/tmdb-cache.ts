/**
 * TMDB poster cache (localStorage)
 *
 * Media page fetches ~50 TMDB posters on every mount. This cache persists
 * results across navigations so a warm session only pays the cost once per
 * TTL window (7 days). Null results are cached too so misses aren't re-tried.
 */

import type { TmdbResult } from './api'

const STORAGE_KEY = 'palace:tmdb-cache:v1'
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface Entry {
  readonly value: TmdbResult | null
  readonly fetchedAt: number
}

type CacheShape = Record<string, Entry>

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readAll(): CacheShape {
  if (!isBrowser()) return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as CacheShape) : {}
  } catch {
    return {}
  }
}

function writeAll(cache: CacheShape): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // Quota exceeded or storage disabled — silently drop.
  }
}

export function getCached(key: string): TmdbResult | null | undefined {
  const cache = readAll()
  const entry = cache[key]
  if (!entry) return undefined
  if (Date.now() - entry.fetchedAt > TTL_MS) return undefined
  return entry.value
}

export function setCached(key: string, value: TmdbResult | null): void {
  const cache = readAll()
  cache[key] = { value, fetchedAt: Date.now() }
  writeAll(cache)
}

export function hydrateKnownKeys(keys: readonly string[]): Record<string, TmdbResult | null> {
  if (keys.length === 0) return {}
  const cache = readAll()
  const now = Date.now()
  const out: Record<string, TmdbResult | null> = {}
  for (const key of keys) {
    const entry = cache[key]
    if (entry && now - entry.fetchedAt <= TTL_MS) {
      out[key] = entry.value
    }
  }
  return out
}
