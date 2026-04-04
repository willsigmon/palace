'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { formatRelativeTime, formatDuration, calcDuration, truncate } from '@/lib/format'

interface MediaSession {
  id: number
  title: string
  overview: string | null
  category: string
  emoji: string | null
  startedAt: string
  finishedAt: string | null
  media_type: string
}

interface MediaMemory {
  id: number
  content: string
  category: string | null
  sourceApp: string | null
  createdAt: string
}

interface TmdbResult {
  title: string
  poster_url: string | null
  vote_average: number | null
  release_date: string | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.wsig.me'

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

// TMDb search type mapping
const TMDB_TYPE: Record<string, string> = {
  movie: 'movie', show: 'tv', music: 'multi', game: 'multi',
  podcast: 'multi', video: 'multi',
}

export default function MediaPage() {
  const [sessions, setSessions] = useState<MediaSession[]>([])
  const [memories, setMemories] = useState<MediaMemory[]>([])
  const [stats, setStats] = useState<{ music: number; entertainment: number } | null>(null)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [posters, setPosters] = useState<Record<string, TmdbResult | null>>({})
  const fetched = useRef(false)
  const posterCache = useRef<Record<string, TmdbResult | null>>({})

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    fetchMedia('')
  }, [])

  async function fetchMedia(type: string) {
    setLoading(true)
    setFilter(type)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (type) params.set('type', type)
      const res = await fetch(`${API_URL}/api/media?${params}`)
      const data = await res.json()
      setSessions(data.sessions || [])
      setMemories(data.memories || [])
      setStats(data.stats || null)
    } catch {} finally {
      setLoading(false)
    }
  }

  // Fetch TMDb posters for movie/show sessions
  const fetchPoster = useCallback(async (title: string, mediaType: string) => {
    const key = `${mediaType}:${title}`
    if (posterCache.current[key] !== undefined) return
    posterCache.current[key] = null // mark as fetching

    const tmdbType = TMDB_TYPE[mediaType] || 'multi'
    // Extract just the media name from conversation titles (often "Discussing X" or "Watching X")
    const cleanTitle = title
      .replace(/^(discussing|watching|listening to|playing|about)\s+/i, '')
      .replace(/\s+(discussion|conversation|chat)$/i, '')
      .trim()

    try {
      const res = await fetch(`${API_URL}/api/media/tmdb?query=${encodeURIComponent(cleanTitle)}&type=${tmdbType}`)
      const data = await res.json()
      if (data.results?.length > 0) {
        const result = data.results[0]
        posterCache.current[key] = result
        setPosters(prev => ({ ...prev, [key]: result }))
      }
    } catch {}
  }, [])

  // Trigger poster fetches for visible sessions
  useEffect(() => {
    for (const s of sessions) {
      if (s.media_type === 'movie' || s.media_type === 'show') {
        fetchPoster(s.title, s.media_type)
      }
    }
  }, [sessions, fetchPoster])

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
          The Theater
        </h1>
        <p className="mt-1.5 text-sm text-sub">
          What you listen to, watch, and play — automatically tracked.
        </p>
        {stats && (
          <p className="mt-1 text-[10px] text-muted/40 font-[family-name:var(--font-mono)]">
            {stats.music} music sessions · {stats.entertainment} entertainment sessions
          </p>
        )}
      </header>

      {/* Type filters */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => fetchMedia(f.value)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
              filter === f.value
                ? f.value ? f.color : 'bg-accent/15 text-accent border-accent/20'
                : 'border-transparent text-muted/60 hover:text-muted hover:bg-surface/40'
            }`}
          >
            {f.icon && <span className="mr-1">{f.icon}</span>}
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Media sessions */}
          {sessions.length > 0 && (
            <section>
              <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted/50">
                Sessions ({sessions.length})
              </h2>
              <div className="space-y-2">
                {sessions.map((s) => {
                  const style = TYPE_STYLES[s.media_type] ?? TYPE_STYLES.other
                  const duration = calcDuration(s.startedAt, s.finishedAt)
                  const posterKey = `${s.media_type}:${s.title}`
                  const poster = posters[posterKey]

                  return (
                    <Link
                      key={s.id}
                      href={`/conversation/${s.id}`}
                      className={`group block rounded-xl border border-border/30 border-l-[3px] ${style.border} bg-surface/40 p-4 transition-all hover:bg-surface/60 hover:border-border/50`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Poster or emoji */}
                        {poster?.poster_url ? (
                          <img
                            src={poster.poster_url}
                            alt={poster.title}
                            className="mt-0.5 h-16 w-11 shrink-0 rounded-md object-cover shadow-sm"
                          />
                        ) : (
                          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-elevated/40 text-lg">
                            {s.emoji || style.icon}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-semibold uppercase tracking-widest ${style.color}`}>
                              {s.media_type}
                            </span>
                            {duration && (
                              <span className="text-[10px] text-muted/40 font-[family-name:var(--font-mono)]">
                                {formatDuration(duration)}
                              </span>
                            )}
                            {poster?.vote_average && poster.vote_average > 0 && (
                              <span className="text-[10px] text-amber-400/60 font-[family-name:var(--font-mono)]">
                                ★ {poster.vote_average.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <p className="text-[14px] font-medium text-text group-hover:text-accent transition-colors">
                            {s.title}
                          </p>
                          {s.overview && (
                            <p className="mt-1 text-[12px] leading-relaxed text-sub/60">
                              {truncate(s.overview, 140)}
                            </p>
                          )}
                          <time className="mt-1.5 block text-[10px] text-muted/30 font-[family-name:var(--font-mono)]">
                            {formatRelativeTime(s.startedAt)}
                          </time>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Media mentions in memories */}
          {memories.length > 0 && (
            <section>
              <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted/50">
                Mentions ({memories.length})
              </h2>
              <div className="space-y-1.5">
                {memories.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg border border-border/20 bg-surface/20 px-4 py-2.5"
                  >
                    <p className="text-[12px] leading-relaxed text-sub/70">{truncate(m.content, 200)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {m.sourceApp && (
                        <span className="text-[9px] text-muted/30">{m.sourceApp}</span>
                      )}
                      <time className="text-[9px] text-muted/20 font-[family-name:var(--font-mono)]">
                        {formatRelativeTime(m.createdAt)}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {sessions.length === 0 && memories.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-[family-name:var(--font-serif)] text-xl italic text-sub">
                No media detected yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
