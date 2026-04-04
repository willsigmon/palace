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
  readonly constellation?: boolean
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

export function ForceGraph({ nodes, edges, centerNodeId, onNodeClick, constellation = false }: ForceGraphProps) {
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

    // Read theme-aware colors from CSS custom properties
    const cs = getComputedStyle(document.documentElement)
    const nodeFill = cs.getPropertyValue('--color-node-fill').trim() || 'oklch(0.21 0.02 260)'
    const nodeStroke = cs.getPropertyValue('--color-node-stroke').trim() || 'oklch(0.35 0.015 260)'
    const nodeLabel = cs.getPropertyValue('--color-node-label').trim() || 'oklch(0.75 0.01 80)'
    const nodeSublabel = cs.getPropertyValue('--color-node-sublabel').trim() || 'oklch(0.45 0.01 260)'
    const accentColor = cs.getPropertyValue('--color-accent').trim() || 'oklch(0.73 0.20 30)'

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

    const connectedIds = new Set<string>()
    for (const e of mutableEdges) {
      connectedIds.add(e.source as string)
      connectedIds.add(e.target as string)
    }

    const finalNodes = mutableNodes
    const finalEdges = mutableEdges

    // D3 force simulation
    const simulation = d3.forceSimulation(finalNodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(finalEdges)
        .id((d: any) => d.node_id)
        .distance(constellation ? 100 : 80)
        .strength(0.8))
      .force('charge', d3.forceManyBody().strength(constellation ? -200 : -150))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force('radial', d3.forceRadial(
        (d: any) => connectedIds.has(d.node_id) ? 0 : 180,
        width / 2,
        height / 2
      ).strength((d: any) => connectedIds.has(d.node_id) ? 0 : 0.04))
      .force('collision', d3.forceCollide().radius(constellation ? 20 : 40))

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

    if (constellation) {
      renderConstellation(g, finalNodes, finalEdges, connectedIds, centerNodeId, {
        width, height, accentColor, nodeLabel,
        onNodeClick, setHoveredNode,
      })
    } else {
      renderNetwork(g, finalNodes, finalEdges, connectedIds, centerNodeId, {
        width, height, nodeFill, nodeStroke, nodeLabel, nodeSublabel, accentColor,
        onNodeClick, setHoveredNode,
      })
    }

    // Tick
    simulation.on('tick', () => {
      g.selectAll<SVGLineElement, any>('.edge-line')
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      g.selectAll<SVGPathElement, any>('.edge-curve')
        .attr('d', (d: any) => {
          const dx = d.target.x - d.source.x
          const dy = d.target.y - d.source.y
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`
        })

      g.selectAll<SVGTextElement, any>('.edge-label')
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2)

      g.selectAll<SVGGElement, any>('.node-group')
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    // Constellation: idle rotation
    let rotationTimer: d3.Timer | null = null
    if (constellation) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!prefersReduced) {
        let angle = 0
        rotationTimer = d3.timer(() => {
          angle += 0.0003
          const cx = width / 2
          const cy = height / 2
          g.attr('transform', `rotate(${angle * (180 / Math.PI)}, ${cx}, ${cy})`)
        })
      }
    }

    return () => {
      simulation.stop()
      rotationTimer?.stop()
    }
  }, [nodes, edges, dimensions, centerNodeId, onNodeClick, constellation])

  return (
    <svg
      ref={svgRef}
      className={constellation
        ? 'w-full rounded-2xl'
        : 'w-full rounded-2xl border border-border/30 bg-surface/10'
      }
      style={{
        height: dimensions.height,
        background: constellation ? 'transparent' : undefined,
      }}
    />
  )
}

// === Network Mode (original) ===

function renderNetwork(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodes: any[],
  edges: any[],
  connectedIds: Set<string>,
  centerNodeId: string | undefined,
  opts: any,
) {
  const { nodeFill, nodeStroke, nodeLabel, nodeSublabel, accentColor, onNodeClick, setHoveredNode } = opts

  // Edges
  g.append('g')
    .selectAll('line')
    .data(edges)
    .join('line')
    .attr('class', 'edge-line')
    .attr('stroke', (d: any) => RELATIONSHIP_COLORS[d.label] ?? '#333')
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.4)

  // Edge labels
  g.append('g')
    .selectAll('text')
    .data(edges)
    .join('text')
    .attr('class', 'edge-label')
    .attr('text-anchor', 'middle')
    .attr('fill', (d: any) => RELATIONSHIP_COLORS[d.label] ?? '#555')
    .attr('font-size', '8px')
    .attr('opacity', 0.5)
    .text((d: any) => d.label.replace(/_/g, ' '))

  // Clip paths
  const defs = g.append('defs')
  nodes.forEach((d: any) => {
    const r = d.node_id === centerNodeId ? 22 : 16
    defs.append('clipPath')
      .attr('id', `clip-${d.node_id.replace(/[^a-zA-Z0-9]/g, '_')}`)
      .append('circle')
      .attr('r', r)
  })

  // Node groups
  const node = g.append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', 'node-group')
    .attr('cursor', 'pointer')

  // Node circles
  node.append('circle')
    .attr('r', (d: any) => d.node_id === centerNodeId ? 22 : 16)
    .attr('fill', (d: any) => d.node_id === centerNodeId ? `color-mix(in oklch, ${accentColor} 20%, transparent)` : nodeFill)
    .attr('stroke', (d: any) => d.node_id === centerNodeId ? accentColor : nodeStroke)
    .attr('stroke-width', (d: any) => d.node_id === centerNodeId ? 2 : 1)

  // Photos
  node.append('image')
    .attr('href', (d: any) => `/photos/${(d.label as string).toLowerCase().replace(/\s+/g, '-')}.jpg`)
    .attr('x', (d: any) => d.node_id === centerNodeId ? -22 : -16)
    .attr('y', (d: any) => d.node_id === centerNodeId ? -22 : -16)
    .attr('width', (d: any) => d.node_id === centerNodeId ? 44 : 32)
    .attr('height', (d: any) => d.node_id === centerNodeId ? 44 : 32)
    .attr('clip-path', (d: any) => `url(#clip-${d.node_id.replace(/[^a-zA-Z0-9]/g, '_')})`)
    .attr('preserveAspectRatio', 'xMidYMid slice')
    .on('error', function() { d3.select(this).remove() })

  // Labels
  node.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', (d: any) => d.node_id === centerNodeId ? 36 : 28)
    .attr('fill', nodeLabel)
    .attr('font-size', (d: any) => d.node_id === centerNodeId ? '11px' : '9px')
    .attr('font-weight', (d: any) => d.node_id === centerNodeId ? '600' : '400')
    .text((d: any) => {
      const name = d.label as string
      return name.length > 20 ? name.slice(0, 18) + '...' : name
    })

  // Birth year
  node.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', (d: any) => d.node_id === centerNodeId ? 48 : 38)
    .attr('fill', nodeSublabel)
    .attr('font-size', '8px')
    .attr('font-family', 'var(--font-mono)')
    .text((d: any) => {
      const meta = parseMeta(d.metadata)
      return meta.birth_date ?? ''
    })

  // Interactions
  node.on('click', (event: MouseEvent, d: any) => {
    event.stopPropagation()
    onNodeClick?.(d as GraphNode)
  })

  node.on('mouseenter', (event: MouseEvent, d: any) => {
    setHoveredNode(d.node_id)
    d3.select(event.currentTarget as SVGGElement).select('circle')
      .transition().duration(200)
      .attr('stroke', accentColor)
      .attr('stroke-width', 2)
  })
  node.on('mouseleave', (event: MouseEvent, d: any) => {
    setHoveredNode(null)
    d3.select(event.currentTarget as SVGGElement).select('circle')
      .transition().duration(200)
      .attr('stroke', d.node_id === centerNodeId ? accentColor : nodeStroke)
      .attr('stroke-width', d.node_id === centerNodeId ? 2 : 1)
  })

  // Drag — note: simulation restart is handled by the parent effect's tick handler
  node.call(d3.drag<SVGGElement, any>()
    .on('start', (event, d) => {
      d.fx = d.x
      d.fy = d.y
    })
    .on('drag', (event, d) => {
      d.fx = event.x
      d.fy = event.y
    })
    .on('end', (event, d) => {
      if (d.node_id !== centerNodeId) {
        d.fx = null
        d.fy = null
      }
    }) as any)
}

// === Constellation Mode ===

function renderConstellation(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodes: any[],
  edges: any[],
  connectedIds: Set<string>,
  centerNodeId: string | undefined,
  opts: any,
) {
  const { accentColor, nodeLabel, onNodeClick, setHoveredNode } = opts

  // Curved edges — faint, ethereal lines
  g.append('g')
    .selectAll('path')
    .data(edges)
    .join('path')
    .attr('class', 'edge-curve')
    .attr('fill', 'none')
    .attr('stroke', (d: any) => RELATIONSHIP_COLORS[d.label] ?? '#444')
    .attr('stroke-width', 0.8)
    .attr('stroke-opacity', 0.15)
    .attr('stroke-dasharray', '4 4')

  // Node groups
  const node = g.append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', 'node-group')
    .attr('cursor', 'pointer')

  // Glowing star nodes
  node.append('circle')
    .attr('r', (d: any) => d.node_id === centerNodeId ? 6 : 3.5)
    .attr('fill', (d: any) => {
      // Find relationship color from edges
      const edge = edges.find((e: any) => e.source === d.node_id || e.target === d.node_id)
      return edge ? (RELATIONSHIP_COLORS[edge.label] ?? accentColor) : accentColor
    })
    .style('filter', (d: any) => {
      const edge = edges.find((e: any) => e.source === d.node_id || e.target === d.node_id)
      const color = edge ? (RELATIONSHIP_COLORS[edge.label] ?? accentColor) : accentColor
      return `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`
    })

  // Labels — hidden by default, shown on hover via CSS
  node.append('text')
    .attr('class', 'constellation-label')
    .attr('text-anchor', 'middle')
    .attr('dy', -12)
    .attr('fill', nodeLabel)
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-serif)')
    .attr('font-style', 'italic')
    .attr('opacity', 0)
    .text((d: any) => {
      const name = d.label as string
      return name.length > 25 ? name.slice(0, 23) + '...' : name
    })

  // Hover: show label + brighten star
  node.on('mouseenter', (event: MouseEvent, d: any) => {
    setHoveredNode(d.node_id)
    const group = d3.select(event.currentTarget as SVGGElement)
    group.select('.constellation-label')
      .transition().duration(200)
      .attr('opacity', 1)
    group.select('circle')
      .transition().duration(200)
      .attr('r', d.node_id === centerNodeId ? 8 : 5)
  })

  node.on('mouseleave', (event: MouseEvent, d: any) => {
    setHoveredNode(null)
    const group = d3.select(event.currentTarget as SVGGElement)
    group.select('.constellation-label')
      .transition().duration(300)
      .attr('opacity', 0)
    group.select('circle')
      .transition().duration(300)
      .attr('r', d.node_id === centerNodeId ? 6 : 3.5)
  })

  // Click
  node.on('click', (event: MouseEvent, d: any) => {
    event.stopPropagation()
    onNodeClick?.(d as GraphNode)
  })

  // Drag
  node.call(d3.drag<SVGGElement, any>()
    .on('start', (event, d) => {
      d.fx = d.x
      d.fy = d.y
    })
    .on('drag', (event, d) => {
      d.fx = event.x
      d.fy = event.y
    })
    .on('end', (event, d) => {
      if (d.node_id !== centerNodeId) {
        d.fx = null
        d.fy = null
      }
    }) as any)
}
