'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface ClusterPoint {
  readonly lat: number
  readonly lon: number
  readonly count: number
  readonly label: string | null
  readonly latest: string
}

interface LocationMapProps {
  clusters: readonly ClusterPoint[]
  onSelect?: (cluster: ClusterPoint) => void
}

// Auto-fit bounds when clusters change
function FitBounds({ clusters }: { clusters: readonly ClusterPoint[] }) {
  const map = useMap()

  useEffect(() => {
    if (clusters.length === 0) return
    const bounds = clusters.map(c => [c.lat, c.lon] as [number, number])
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [clusters, map])

  return null
}

export default function LocationMap({ clusters, onSelect }: LocationMapProps) {
  const maxCount = useMemo(
    () => Math.max(...clusters.map(c => c.count), 1),
    [clusters],
  )

  // Default center (Raleigh NC area) — will be overridden by FitBounds
  const center: [number, number] = clusters.length > 0
    ? [clusters[0].lat, clusters[0].lon]
    : [35.78, -78.64]

  return (
    <MapContainer
      center={center}
      zoom={10}
      style={{ height: '500px', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      {/* Dark map tiles — CartoDB dark matter */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <FitBounds clusters={clusters} />

      {clusters.map((c, i) => {
        const intensity = Math.min(1, c.count / (maxCount * 0.3))
        const radius = 4 + Math.sqrt(c.count) * 2

        return (
          <CircleMarker
            key={`${c.lat}-${c.lon}-${i}`}
            center={[c.lat, c.lon]}
            radius={radius}
            pathOptions={{
              fillColor: `rgb(${200 + 55 * intensity}, ${130 * (1 - intensity * 0.3)}, ${80 * (1 - intensity * 0.5)})`,
              fillOpacity: 0.5 + 0.4 * intensity,
              stroke: true,
              color: `rgba(230, 150, 80, ${0.3 + 0.4 * intensity})`,
              weight: 1,
            }}
            eventHandlers={{
              click: () => onSelect?.(c),
            }}
          >
            {c.label && c.count > 3 && (
              <Tooltip
                direction="top"
                offset={[0, -radius]}
                className="palace-tooltip"
                permanent={c.count > 20}
              >
                <span className="text-[10px] font-medium">{c.label}</span>
                <span className="text-[9px] text-gray-400 ml-1.5">{c.count}</span>
              </Tooltip>
            )}
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
