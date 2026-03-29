import { getStats } from '@/lib/api'
import { formatNumber } from '@/lib/format'

export const metadata = { title: 'Graph' }

export default async function GraphPage() {
  let stats
  try {
    stats = await getStats()
  } catch {
    stats = null
  }

  return (
    <div className="mx-auto max-w-5xl px-[var(--space-page)] py-8">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
          The Graph
        </h1>
        <p className="mt-1.5 text-sm text-sub">
          Explore the hidden connections in your life.
        </p>
      </header>

      {/* Preview stats */}
      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="People" value={formatNumber(stats.enrichment.people)} color="text-accent" />
          <StatCard label="Graph Nodes" value={formatNumber(stats.enrichment.kgNodes)} color="text-serendipity" />
          <StatCard label="Conversations" value={formatNumber(stats.conversations)} color="text-pattern" />
          <StatCard label="Locations" value={formatNumber(stats.enrichment.locations)} color="text-memory" />
        </div>
      )}

      {/* Graph placeholder */}
      <div className="relative flex h-[55vh] items-center justify-center overflow-hidden rounded-2xl border border-border/30 bg-surface/20">
        {/* Decorative nodes */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="150" r="40" stroke="currentColor" strokeWidth="0.5" className="text-accent" />
            <circle cx="400" cy="250" r="60" stroke="currentColor" strokeWidth="0.5" className="text-serendipity" />
            <circle cx="600" cy="180" r="35" stroke="currentColor" strokeWidth="0.5" className="text-pattern" />
            <circle cx="300" cy="350" r="45" stroke="currentColor" strokeWidth="0.5" className="text-memory" />
            <circle cx="550" cy="370" r="30" stroke="currentColor" strokeWidth="0.5" className="text-accent" />
            <line x1="200" y1="150" x2="400" y2="250" stroke="currentColor" strokeWidth="0.3" className="text-border" />
            <line x1="400" y1="250" x2="600" y2="180" stroke="currentColor" strokeWidth="0.3" className="text-border" />
            <line x1="400" y1="250" x2="300" y2="350" stroke="currentColor" strokeWidth="0.3" className="text-border" />
            <line x1="400" y1="250" x2="550" y2="370" stroke="currentColor" strokeWidth="0.3" className="text-border" />
            <line x1="200" y1="150" x2="300" y2="350" stroke="currentColor" strokeWidth="0.3" className="text-border" />
          </svg>
        </div>

        <div className="relative text-center">
          <p className="font-[family-name:var(--font-serif)] text-2xl italic text-text/50">
            Coming in Phase 3
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted/60">
            D3.js force-directed visualization of your people, topics, and ideas — with a time slider to watch your network evolve.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border/30 bg-surface/30 p-4 text-center">
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  )
}
