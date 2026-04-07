'use client'

import { useState, useCallback } from 'react'
import { ForceGraph } from './force-graph'
import { getGraph } from '@/lib/api'
import type { KnowledgeGraphEdge, KnowledgeGraphNode } from '@/types/api'

type GraphNode = KnowledgeGraphNode
type GraphEdge = KnowledgeGraphEdge

interface GraphPageClientProps {
  readonly initialNodes: readonly GraphNode[]
  readonly initialEdges: readonly GraphEdge[]
}

const WILL_NODE_ID = '@I12079222780@'

function parseMeta(metadata: string | null): Record<string, string> {
  if (!metadata) return {}
  try { return JSON.parse(metadata) } catch { return {} }
}

export function GraphPageClient({ initialNodes, initialEdges }: GraphPageClientProps) {
  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [centerNodeId, setCenterNodeId] = useState(WILL_NODE_ID)
  const [loading, setLoading] = useState(false)
  const [constellation, setConstellation] = useState(false)

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node)
  }, [])

  async function explorePerson(name: string) {
    setLoading(true)
    try {
      const data = await getGraph({ related_to: name, limit: 50 })
      if (data.nodes.length > 0) {
        setNodes(data.nodes)
        setEdges(data.edges)
        const clicked = data.nodes.find(n => n.label === name)
        if (clicked) setCenterNodeId(clicked.node_id)
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false)
    }
    setSelectedNode(null)
  }

  function resetToWill() {
    explorePerson('William Justin Sigmon')
    setCenterNodeId(WILL_NODE_ID)
  }

  const meta = selectedNode ? parseMeta(selectedNode.metadata) : {}

  return (
    <div className="relative">
      {/* Controls */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={resetToWill}
          className="rounded-lg bg-accent/10 px-3 py-1.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent/20"
        >
          Center on Will
        </button>
        <button
          onClick={() => setConstellation((prev) => !prev)}
          className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
            constellation
              ? 'bg-memory/15 text-memory hover:bg-memory/25'
              : 'bg-surface/30 text-muted hover:bg-surface/50 hover:text-sub'
          }`}
        >
          {constellation ? 'Constellation' : 'Network'}
        </button>
        {loading && (
          <div className="flex items-center gap-1.5 text-[11px] text-sub">
            <div className="h-3 w-3 animate-spin rounded-full border border-accent/30 border-t-accent" />
            Loading...
          </div>
        )}
        <span className="flex-1" />
        <span className="text-[10px] text-muted/50 font-[family-name:var(--font-mono)]">
          {nodes.length} nodes · {edges.length} edges · scroll to zoom · drag to pan
        </span>
      </div>

      {/* Graph */}
      <div className="relative" style={{ height: '60vh' }}>
        <ForceGraph
          nodes={nodes}
          edges={edges}
          centerNodeId={centerNodeId}
          onNodeClick={handleNodeClick}
          constellation={constellation}
        />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 flex gap-3 rounded-lg bg-void/80 px-3 py-2 backdrop-blur-sm">
          <LegendItem color="#f59e0b" label="parent" />
          <LegendItem color="#22d3ee" label="child" />
          <LegendItem color="#f472b6" label="married" />
          <LegendItem color="#a78bfa" label="sibling" />
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <div className="absolute top-3 right-3 w-64 rounded-xl border border-border/40 bg-surface/95 p-4 shadow-glass backdrop-blur-sm">
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-2 right-2 text-muted hover:text-text"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>

            <h3 className="text-sm font-medium text-text pr-4">{selectedNode.label}</h3>

            <div className="mt-2 space-y-1 text-[11px]">
              {meta.birth_date && (
                <p className="text-sub">Born: <span className="text-text">{meta.birth_date}</span></p>
              )}
              {meta.death_date && (
                <p className="text-sub">Died: <span className="text-text">{meta.death_date}</span></p>
              )}
              {meta.sex && (
                <p className="text-sub">Sex: <span className="text-text">{meta.sex}</span></p>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => explorePerson(selectedNode.label)}
                className="rounded-md bg-accent/10 px-2.5 py-1 text-[10px] font-medium text-accent transition-colors hover:bg-accent/20"
              >
                Explore connections
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[9px] text-muted">
      <span className="h-2 w-4 rounded-sm" style={{ backgroundColor: color, opacity: 0.6 }} />
      {label}
    </span>
  )
}
