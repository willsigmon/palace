'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'

interface GraphNode {
  readonly node_id: string
  readonly label: string
  readonly node_type: string
  readonly metadata: string | null
  // D3 mutable properties
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface GraphEdge {
  readonly source_node_id: string
  readonly target_node_id: string
  readonly label: string
}

interface ForceGraphProps {
  readonly nodes: readonly GraphNode[]
  readonly edges: readonly GraphEdge[]
  readonly centerNodeId?: string
  readonly onNodeClick?: (node: GraphNode) => void
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  parent_of: '#f59e0b',   // amber
  child_of: '#22d3ee',    // cyan
  married_to: '#f472b6',  // pink
  sibling_of: '#a78bfa',  // purple
}

function parseMeta(metadata: string | null): Record<string, string> {
  if (!metadata) return {}
  try { return JSON.parse(metadata) } catch { return {} }
}

export function ForceGraph({ nodes, edges, centerNodeId, onNodeClick }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Responsive sizing
  useEffect(() => {
    function updateSize() {
      const container = svgRef.current?.parentElement
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.max(500, container.clientHeight),
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || nodes.length === 0) return

    const { width, height } = dimensions

    // Clear previous
    d3.select(svg).selectAll('*').remove()

    // Build node map for edge resolution
    const nodeMap = new Map(nodes.map(n => [n.node_id, { ...n }]))
    const mutableNodes = Array.from(nodeMap.values())

    // Resolve edges to node objects
    const mutableEdges = edges
      .filter(e => nodeMap.has(e.source_node_id) && nodeMap.has(e.target_node_id))
      .map(e => ({
        source: e.source_node_id,
        target: e.target_node_id,
        label: e.label,
      }))

    // Show ALL nodes — connected and unconnected alike
    const connectedIds = new Set<string>()
    for (const e of mutableEdges) {
      connectedIds.add(e.source as string)
      connectedIds.add(e.target as string)
    }

    const finalNodes = mutableNodes
    const finalEdges = mutableEdges

    // D3 force simulation
    // Connected nodes cluster tightly; unconnected nodes orbit loosely via weaker radial force
    const simulation = d3.forceSimulation(finalNodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(finalEdges)
        .id((d: any) => d.node_id)
        .distance(80)
        .strength(0.8))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force('radial', d3.forceRadial(
        (d: any) => connectedIds.has(d.node_id) ? 0 : 180,
        width / 2,
        height / 2
      ).strength((d: any) => connectedIds.has(d.node_id) ? 0 : 0.04))
      .force('collision', d3.forceCollide().radius(40))

    // Pin center node
    if (centerNodeId) {
      const centerNode = finalNodes.find(n => n.node_id === centerNodeId)
      if (centerNode) {
        centerNode.fx = width / 2
        centerNode.fy = height / 2
      }
    }

    // SVG setup with zoom
    const svgSelection = d3.select(svg)
      .attr('width', width)
      .attr('height', height)

    const g = svgSelection.append('g')

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svgSelection.call(zoom)

    // Edges
    const link = g.append('g')
      .selectAll('line')
      .data(finalEdges)
      .join('line')
      .attr('stroke', (d: any) => RELATIONSHIP_COLORS[d.label] ?? '#333')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.4)

    // Edge labels
    const linkLabel = g.append('g')
      .selectAll('text')
      .data(finalEdges)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('fill', (d: any) => RELATIONSHIP_COLORS[d.label] ?? '#555')
      .attr('font-size', '8px')
      .attr('opacity', 0.5)
      .text((d: any) => d.label.replace(/_/g, ' '))

    // Node groups
    const node = g.append('g')
      .selectAll('g')
      .data(finalNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          if (d.node_id !== centerNodeId) {
            d.fx = null
            d.fy = null
          }
        }) as any)

    // Node circles
    node.append('circle')
      .attr('r', (d: any) => d.node_id === centerNodeId ? 22 : 16)
      .attr('fill', (d: any) => d.node_id === centerNodeId ? 'oklch(0.73 0.20 30 / 0.2)' : 'oklch(0.21 0.02 260)')
      .attr('stroke', (d: any) => d.node_id === centerNodeId ? 'oklch(0.73 0.20 30)' : 'oklch(0.35 0.015 260)')
      .attr('stroke-width', (d: any) => d.node_id === centerNodeId ? 2 : 1)

    // Node labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => d.node_id === centerNodeId ? 36 : 28)
      .attr('fill', 'oklch(0.75 0.01 80)')
      .attr('font-size', (d: any) => d.node_id === centerNodeId ? '11px' : '9px')
      .attr('font-weight', (d: any) => d.node_id === centerNodeId ? '600' : '400')
      .text((d: any) => {
        const name = d.label as string
        return name.length > 20 ? name.slice(0, 18) + '...' : name
      })

    // Birth year subtitle
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => d.node_id === centerNodeId ? 48 : 38)
      .attr('fill', 'oklch(0.45 0.01 260)')
      .attr('font-size', '8px')
      .attr('font-family', 'var(--font-mono)')
      .text((d: any) => {
        const meta = parseMeta(d.metadata)
        return meta.birth_date ?? ''
      })

    // Click handler
    node.on('click', (event: MouseEvent, d: any) => {
      event.stopPropagation()
      onNodeClick?.(d as GraphNode)
    })

    // Hover effects
    node.on('mouseenter', (event: MouseEvent, d: any) => {
      setHoveredNode(d.node_id)
      d3.select(event.currentTarget as SVGGElement).select('circle')
        .transition().duration(200)
        .attr('stroke', 'oklch(0.73 0.20 30)')
        .attr('stroke-width', 2)
    })
    node.on('mouseleave', (event: MouseEvent, d: any) => {
      setHoveredNode(null)
      d3.select(event.currentTarget as SVGGElement).select('circle')
        .transition().duration(200)
        .attr('stroke', d.node_id === centerNodeId ? 'oklch(0.73 0.20 30)' : 'oklch(0.35 0.015 260)')
        .attr('stroke-width', d.node_id === centerNodeId ? 2 : 1)
    })

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2)

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    return () => { simulation.stop() }
  }, [nodes, edges, dimensions, centerNodeId, onNodeClick])

  return (
    <svg
      ref={svgRef}
      className="w-full rounded-2xl border border-border/30 bg-surface/10"
      style={{ height: dimensions.height }}
    />
  )
}
