'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getMedia, searchTmdbMedia, type MediaMemory, type MediaSession, type MediaStats, type TmdbResult } from '@/lib/api'
import { getCached, hydrateKnownKeys, setCached } from '@/lib/tmdb-cache'
import { calcDuration, formatDuration, formatRelativeTime, truncate } from '@/lib/format'

const TYPE_FILTERS = [
  { value: '', label: 'All', icon: '', color: '' },
  { value: 'music', label: 'Music', icon: '🎵', color: 'bg-purple-400/15 text-purple-400 border-purple-400/20' },
  { value: 'show', label: 'Shows', icon: '📺', color: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
  { value: 'game', label: 'Games', icon: '🎮', color: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
  { value: 'podcast', label: 'Podcasts', icon: '🎙', color: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
  { value: 'video', label: 'Videos', icon: '📱', color: 'bg-red-400/15 text-red-400 border-red-400/20' },
  { value: 'movie', label: 'Movies', icon: '🎬', color: 'bg-rose-400/15 text-rose-400 border-rose-400/20' },
] as const

const TYPE_STYLES: Record<string, { icon: string; color: string; border: string }> = {
  music: { icon: '🎵', color: 'text-purple-400', border: 'border-l-purple-400/50' },
  show: { icon: '📺', color: 'text-blue-400', border: 'border-l-blue-400/50' },
  game: { icon: '🎮', color: 'text-emerald-400', border: 'border-l-emerald-400/50' },
  podcast: { icon: '🎙', color: 'text-amber-400', border: 'border-l-amber-400/50' },
  movie: { icon: '🎬', color: 'text-rose-400', border: 'border-l-rose-400/50' },
  video: { icon: '📱', color: 'text-red-400', border: 'border-l-red-400/50' },
  other: { icon: '📱', color: 'text-sub', border: 'border-l-border' },
}

const TMDB_TYPE: Record<string, string> = {
  movie: 'movie',
  show: 'tv',
  music: 'multi',
  game: 'multi',
  podcast: 'multi',
  video: 'multi',
}

export default function MediaPage() {
  const [sessions, setSessions] = useState<MediaSession[]>([])
  const [memories, setMemories] = useState<MediaMemory[]>([])
  const [stats, setStats] = useState<MediaStats | null>(null)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [posters, setPosters] = useState<Record<string, TmdbResult | null>>({})
  const fetched = useRef(false)
  const posterCache = useRef<Record<string, TmdbResult | null>>({})

  const fetchMedia = useCallback(async (type: string) => {
    setLoading(true)
    setFilter(type)

    try {
      const data = await getMedia({ type: type || undefined, limit: 50 })
      setSessions([...data.sessions])
      setMemories([...data.memories])
      setStats(data.stats)
    } catch {
      setSessions([])
      setMemories([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    void fetchMedia('')
  }, [fetchMedia])

  const fetchPoster = useCallback(async (title: string, mediaType: string) => {
    const key = `${mediaType}:${title}`
    if (posterCache.current[key] !== undefined) return

    // localStorage hit — skip the network.
    const stored = getCached(key)
    if (stored !== undefined) {
      posterCache.current[key] = stored
      if (stored) {
        setPosters((previous) => (previous[key] ? previous : { ...previous, [key]: stored }))
      }
      return
    }

    posterCache.current[key] = null

    const tmdbType = TMDB_TYPE[mediaType] || 'multi'
    const cleanTitle = title
      .replace(/^(discussing|watching|listening to|playing|about)\s+/i, '')
      .replace(/\s+(discussion|conversation|chat)$/i, '')
      .trim()

    try {
      const data = await searchTmdbMedia(cleanTitle, tmdbType)
      const result = data.results[0] ?? null
      posterCache.current[key] = result
      setCached(key, result)
      if (result) {
        setPosters((previous) => ({ ...previous, [key]: result }))
      }
    } catch {
      posterCache.current[key] = null
    }
  }, [])

  // Hydrate known poster keys from localStorage whenever session list changes.
  useEffect(() => {
    const keys = sessions
      .filter((s) => s.media_type === 'movie' || s.media_type === 'show')
      .map((s) => `${s.media_type}:${s.title}`)
    if (keys.length === 0) return

    const hydrated = hydrateKnownKeys(keys)
    if (Object.keys(hydrated).length > 0) {
      for (const [key, value] of Object.entries(hydrated)) {
        posterCache.current[key] = value
      }
      setPosters((previous) => ({ ...hydrated, ...previous }))
    }

    for (const session of sessions) {
      if (session.media_type === 'movie' || session.media_type === 'show') {
        void fetchPoster(session.title, session.media_type)
      }
    }
  }, [fetchPoster, sessions])

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <header className="mb-6">
        <h1 className="text-lg font-semibold text-text">Media</h1>
        <p className="mt-1.5 text-sm text-sub">What you listen to, watch, and play — automatically tracked.</p>
        {stats && (
          <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] text-muted/40">
            {stats.music} music sessions · {stats.entertainment} entertainment sessions
          </p>
        )}
      </header>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {TYPE_FILTERS.map((typeFilter) => (
          <button
            key={typeFilter.value}
            onClick={() => void fetchMedia(typeFilter.value)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
              filter === typeFilter.value
                ? typeFilter.value
                  ? typeFilter.color
                  : 'border-accent/20 bg-accent/15 text-accent'
                : 'border-transparent text-muted/60 hover:bg-surface/40 hover:text-muted'
            }`}
          >
            {typeFilter.icon && <span className="mr-1">{typeFilter.icon}</span>}
            {typeFilter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        </div>
      ) : (
        <div className="space-y-6">
          {sessions.length > 0 && (
            <section>
              <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted/50">
                Sessions ({sessions.length})
              </h2>
              <div className="space-y-2">
                {sessions.map((session) => {
                  const style = TYPE_STYLES[session.media_type] ?? TYPE_STYLES.other
                  const duration = calcDuration(session.startedAt, session.finishedAt)
                  const posterKey = `${session.media_type}:${session.title}`
                  const poster = posters[posterKey]

                  return (
                    <Link
                      key={session.id}
                      href={`/conversation/${session.id}`}
                      className={`group block rounded-xl border border-border/30 border-l-[3px] ${style.border} bg-surface/40 p-4 transition-all hover:border-border/50 hover:bg-surface/60`}
                    >
                      <div className="flex items-start gap-3">
                        {poster?.poster_url ? (
                          <Image
                            src={poster.poster_url}
                            alt={poster.title}
                            width={44}
                            height={64}
                            className="mt-0.5 h-16 w-11 shrink-0 rounded-md object-cover shadow-sm"
                          />
                        ) : (
                          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-elevated/40 text-lg">
                            {session.emoji || style.icon}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className={`text-[9px] font-semibold uppercase tracking-widest ${style.color}`}>
                              {session.media_type}
                            </span>
                            {duration && (
                              <span className="font-[family-name:var(--font-mono)] text-[10px] text-muted/40">
                                {formatDuration(duration)}
                              </span>
                            )}
                            {poster?.vote_average && poster.vote_average > 0 && (
                              <span className="font-[family-name:var(--font-mono)] text-[10px] text-amber-400/60">
                                ★ {poster.vote_average.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <p className="text-[14px] font-medium text-text transition-colors group-hover:text-accent">
                            {session.title}
                          </p>
                          {session.overview && (
                            <p className="mt-1 text-[12px] leading-relaxed text-sub/60">
                              {truncate(session.overview, 140)}
                            </p>
                          )}
                          <time className="mt-1.5 block font-[family-name:var(--font-mono)] text-[10px] text-muted/30">
                            {formatRelativeTime(session.startedAt)}
                          </time>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {memories.length > 0 && (
            <section>
              <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted/50">
                Mentions ({memories.length})
              </h2>
              <div className="space-y-1.5">
                {memories.map((memory) => (
                  <div key={memory.id} className="rounded-lg border border-border/20 bg-surface/20 px-4 py-2.5">
                    <p className="text-[12px] leading-relaxed text-sub/70">{truncate(memory.content, 200)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {memory.sourceApp && <span className="text-[9px] text-muted/30">{memory.sourceApp}</span>}
                      <time className="font-[family-name:var(--font-mono)] text-[9px] text-muted/20">
                        {formatRelativeTime(memory.createdAt)}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
