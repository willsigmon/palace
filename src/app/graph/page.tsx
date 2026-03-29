import { getGraph, getStats } from '@/lib/api'
import { GraphPageClient } from '@/components/graph/graph-page-client'
import { formatNumber } from '@/lib/format'

export const metadata = { title: 'Graph' }

export default async function GraphPage() {
  let graphData
  let stats

  try {
    ;[graphData, stats] = await Promise.all([
      getGraph({ related_to: 'William Justin Sigmon', limit: 50 }),
      getStats(),
    ])
  } catch {
    graphData = { nodes: [], edges: [] }
    stats = null
  }

  return (
    <div className="mx-auto max-w-6xl px-[var(--space-page)] py-8">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
          The Graph
        </h1>
        <p className="mt-1.5 text-sm text-sub">
          Explore the hidden connections in your life.
        </p>
      </header>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard label="People" value={formatNumber(stats.enrichment.people)} color="text-accent" />
          <StatCard label="Graph Nodes" value={formatNumber(stats.enrichment.kgNodes)} color="text-serendipity" />
          <StatCard label="Conversations" value={formatNumber(stats.conversations)} color="text-pattern" />
          <StatCard label="Locations" value={formatNumber(stats.enrichment.locations)} color="text-memory" />
        </div>
      )}

      <GraphPageClient
        initialNodes={graphData.nodes}
        initialEdges={graphData.edges}
      />
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border/30 bg-surface/30 p-3 text-center">
      <p className={`text-xl font-semibold ${color}`}>{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  )
}
