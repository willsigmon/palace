'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { getLocations, type LocationRecord } from '@/lib/api'
import { formatRelativeTime } from '@/lib/format'

interface ClusterPoint {
  readonly lat: number
  readonly lon: number
  readonly count: number
  readonly label: string | null
  readonly latest: string
}

function clusterLocations(locs: readonly LocationRecord[], precision = 3): readonly ClusterPoint[] {
  const map = new Map<string, { lat: number; lon: number; count: number; label: string | null; latest: string }>()
  for (const loc of locs) {
    const key = `${loc.latitude.toFixed(precision)},${loc.longitude.toFixed(precision)}`
    const existing = map.get(key)
    if (existing) {
      existing.count += 1
      if (loc.timestamp > existing.latest) {
        existing.latest = loc.timestamp
        if (loc.label && loc.label !== 'WS' && loc.label !== 'palace-ios') {
          existing.label = loc.label
        }
      }
    } else {
      map.set(key, {
        lat: loc.latitude,
        lon: loc.longitude,
        count: 1,
        label: loc.label && loc.label !== 'WS' && loc.label !== 'palace-ios' ? loc.label : null,
        latest: loc.timestamp,
      })
    }
  }
  return Array.from(map.values())
}

const LocationMap = dynamic(() => import('@/components/map/location-map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] rounded-2xl border border-border/30 bg-surface/10">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
    </div>
  ),
})

export default function LocationsPage() {
  const [locations, setLocations] = useState<readonly LocationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ClusterPoint | null>(null)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) {
      return
    }
    fetched.current = true

    getLocations(5000)
      .then((data) => setLocations(data))
      .catch(() => setLocations([]))
      .finally(() => setLoading(false))
  }, [])

  const clusters = useMemo(() => clusterLocations(locations), [locations])

  return (
    <div className="mx-auto max-w-5xl px-[var(--space-page)] py-8">
      <header className="mb-6">
        <h1 className="text-lg font-semibold text-text">Map</h1>
        <p className="mt-1 text-sm text-sub">
          {locations.length.toLocaleString()} GPS points from OwnTracks and conversations.
        </p>
      </header>

      <div className="relative rounded-2xl border border-border/30 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-[500px] bg-surface/10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          </div>
        ) : (
          <LocationMap
            clusters={clusters}
            onSelect={setSelected}
          />
        )}

        {selected && (
          <div className="absolute bottom-4 left-4 z-[1000] rounded-xl glass p-4 shadow-elevated max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-accent">
                {selected.label ?? `${selected.lat.toFixed(4)}, ${selected.lon.toFixed(4)}`}
              </span>
              <button onClick={() => setSelected(null)} className="text-muted/40 hover:text-muted">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l12 12M16 4L4 16" />
                </svg>
              </button>
            </div>
            <div className="space-y-1 text-[11px]">
              <p className="text-sub">{selected.count} data points</p>
              <p className="text-muted/50 font-[family-name:var(--font-mono)]">
                Last seen {formatRelativeTime(selected.latest)}
              </p>
              <p className="text-muted/40 font-[family-name:var(--font-mono)]">
                {selected.lat.toFixed(5)}, {selected.lon.toFixed(5)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted/60">
          Frequent Locations
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {clusters
            .filter((cluster) => cluster.count > 3)
            .sort((left, right) => right.count - left.count)
            .slice(0, 12)
            .map((cluster) => (
              <button
                key={`${cluster.lat}-${cluster.lon}`}
                onClick={() => setSelected(cluster)}
                className="flex items-center gap-3 rounded-lg border border-border/20 bg-surface/20 px-4 py-3 text-left transition-all hover:border-border/40 hover:bg-surface/40"
              >
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: `oklch(0.73 0.20 30 / ${Math.min(1, cluster.count / 100)})` }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-text truncate">
                    {cluster.label ?? `${cluster.lat.toFixed(3)}, ${cluster.lon.toFixed(3)}`}
                  </p>
                  <p className="text-[10px] text-muted/50 font-[family-name:var(--font-mono)]">
                    {cluster.count} points · {formatRelativeTime(cluster.latest)}
                  </p>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
