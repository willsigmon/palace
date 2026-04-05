'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/format'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.wsig.me'

interface Location {
  readonly id: number
  readonly source: string
  readonly latitude: number
  readonly longitude: number
  readonly address: string | null
  readonly label: string | null
  readonly timestamp: string
}

interface ClusterPoint {
  readonly lat: number
  readonly lon: number
  readonly count: number
  readonly label: string | null
  readonly latest: string
}

function clusterLocations(locs: readonly Location[], precision = 3): readonly ClusterPoint[] {
  const map = new Map<string, { lat: number; lon: number; count: number; label: string | null; latest: string }>()
  for (const loc of locs) {
    const key = `${loc.latitude.toFixed(precision)},${loc.longitude.toFixed(precision)}`
    const existing = map.get(key)
    if (existing) {
      existing.count++
      if (loc.timestamp > existing.latest) {
        existing.latest = loc.timestamp
        if (loc.label && loc.label !== 'WS' && loc.label !== 'palace-ios') existing.label = loc.label
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

export default function LocationsPage() {
  const [locations, setLocations] = useState<readonly Location[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ClusterPoint | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 })
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    fetch(`${API_URL}/api/locations?limit=5000`)
      .then(r => r.json())
      .then(data => {
        setLocations(Array.isArray(data) ? data : [])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(400, window.innerHeight - 200),
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const clusters = clusterLocations(locations)

  // Find bounds
  const lats = clusters.map(c => c.lat)
  const lons = clusters.map(c => c.lon)
  const minLat = Math.min(...(lats.length ? lats : [35]))
  const maxLat = Math.max(...(lats.length ? lats : [36]))
  const minLon = Math.min(...(lons.length ? lons : [-79]))
  const maxLon = Math.max(...(lons.length ? lons : [-78]))

  const padLat = (maxLat - minLat) * 0.1 || 0.5
  const padLon = (maxLon - minLon) * 0.1 || 0.5

  const project = useCallback((lat: number, lon: number): [number, number] => {
    const x = ((lon - (minLon - padLon)) / ((maxLon + padLon) - (minLon - padLon))) * dimensions.width
    const y = (1 - (lat - (minLat - padLat)) / ((maxLat + padLat) - (minLat - padLat))) * dimensions.height
    return [x, y]
  }, [minLat, maxLat, minLon, maxLon, padLat, padLon, dimensions])

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || clusters.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, dimensions.width, dimensions.height)

    // Draw grid lines
    ctx.strokeStyle = 'oklch(0.25 0.015 260 / 0.3)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * dimensions.width
      const y = (i / 10) * dimensions.height
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, dimensions.height); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(dimensions.width, y); ctx.stroke()
    }

    const maxCount = Math.max(...clusters.map(c => c.count))

    // Draw points
    for (const cluster of clusters) {
      const [x, y] = project(cluster.lat, cluster.lon)
      const intensity = Math.min(1, cluster.count / (maxCount * 0.3))
      const radius = 3 + Math.sqrt(cluster.count) * 1.5

      // Glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3)
      gradient.addColorStop(0, `oklch(0.73 0.20 30 / ${0.3 * intensity})`)
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, radius * 3, 0, Math.PI * 2)
      ctx.fill()

      // Dot
      ctx.fillStyle = `oklch(0.73 0.20 30 / ${0.5 + 0.5 * intensity})`
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // Labels for large clusters
    ctx.font = '9px var(--font-mono)'
    ctx.fillStyle = 'oklch(0.65 0.01 260)'
    ctx.textAlign = 'center'
    for (const cluster of clusters) {
      if (cluster.count > 5 && cluster.label) {
        const [x, y] = project(cluster.lat, cluster.lon)
        ctx.fillText(cluster.label, x, y - 12)
      }
    }
  }, [clusters, dimensions, project])

  // Handle click
  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    let closest: ClusterPoint | null = null
    let closestDist = Infinity
    for (const c of clusters) {
      const [x, y] = project(c.lat, c.lon)
      const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2)
      if (dist < 30 && dist < closestDist) {
        closest = c
        closestDist = dist
      }
    }
    setSelected(closest)
  }

  return (
    <div className="mx-auto max-w-5xl px-[var(--space-page)] py-8">
      <header className="mb-6">
        <h1 className="text-lg font-semibold text-text">
          Map
        </h1>
        <p className="mt-1.5 text-sm text-sub">
          {locations.length.toLocaleString()} GPS points from OwnTracks and conversations.
        </p>
      </header>

      <div ref={containerRef} className="relative rounded-2xl border border-border/30 bg-surface/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: dimensions.height }}>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            style={{ width: dimensions.width, height: dimensions.height }}
            className="cursor-crosshair"
            onClick={handleCanvasClick}
          />
        )}

        {/* Selected cluster info */}
        {selected && (
          <div className="absolute bottom-4 left-4 rounded-xl border border-border/40 bg-surface/90 backdrop-blur-sm p-4 shadow-elevated max-w-xs">
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

      {/* Top locations list */}
      <div className="mt-6">
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted/60">
          Frequent Locations
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {clusters
            .filter(c => c.count > 3)
            .sort((a, b) => b.count - a.count)
            .slice(0, 12)
            .map((c, i) => (
              <button
                key={i}
                onClick={() => setSelected(c)}
                className="flex items-center gap-3 rounded-lg border border-border/20 bg-surface/20 px-4 py-3 text-left transition-all hover:border-border/40 hover:bg-surface/40"
              >
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: `oklch(0.73 0.20 30 / ${Math.min(1, c.count / 100)})` }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-text truncate">
                    {c.label ?? `${c.lat.toFixed(3)}, ${c.lon.toFixed(3)}`}
                  </p>
                  <p className="text-[10px] text-muted/50 font-[family-name:var(--font-mono)]">
                    {c.count} points · {formatRelativeTime(c.latest)}
                  </p>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
