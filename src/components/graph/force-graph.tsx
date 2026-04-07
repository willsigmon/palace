'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { getPhotoPathForName } from '@/lib/photo-manifest'
import type { KnowledgeGraphEdge, KnowledgeGraphNode } from '@/types/api'

type GraphNode = KnowledgeGraphNode
type GraphEdge = KnowledgeGraphEdge

interface MutableGraphNode extends GraphNode, d3.SimulationNodeDatum {}

interface MutableGraphEdge extends GraphEdge, d3.SimulationLinkDatum<MutableGraphNode> {
  source: MutableGraphNode
  target: MutableGraphNode
}

interface ForceGraphProps {
  readonly nodes: readonly GraphNode[]
  readonly edges: readonly GraphEdge[]
  readonly centerNodeId?: string
  readonly onNodeClick?: (node: GraphNode) => void
  readonly constellation?: boolean
}

interface GraphColors {
  readonly nodeFill: string
  readonly nodeStroke: string
  readonly nodeLabel: string
  readonly nodeSublabel: string
  readonly accentColor: string
}

interface GraphModel {
  readonly nodes: MutableGraphNode[]
  readonly edges: MutableGraphEdge[]
  readonly connectedIds: Set<string>
}

interface NetworkSelections {
  readonly nodeGroups: d3.Selection<SVGGElement, MutableGraphNode, SVGGElement, unknown>
  readonly edgeLines: d3.Selection<SVGLineElement, MutableGraphEdge, SVGGElement, unknown>
  readonly edgeLabels: d3.Selection<SVGTextElement, MutableGraphEdge, SVGGElement, unknown>
}

interface ConstellationSelections {
  readonly nodeGroups: d3.Selection<SVGGElement, MutableGraphNode, SVGGElement, unknown>
  readonly edgePaths: d3.Selection<SVGPathElement, MutableGraphEdge, SVGGElement, unknown>
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  parent_of: '#f59e0b',
  child_of: '#22d3ee',
  married_to: '#f472b6',
  sibling_of: '#a78bfa',
}

interface NodeMetadata {
  readonly birth_date?: string
}

function parseMeta(metadata: string | null): NodeMetadata {
  if (!metadata) {
    return {}
  }

  try {
    return JSON.parse(metadata) as NodeMetadata
  } catch {
    return {}
  }
}

function getGraphColors(): GraphColors {
  const styles = getComputedStyle(document.documentElement)

  return {
    nodeFill: styles.getPropertyValue('--color-node-fill').trim() || 'oklch(0.21 0.02 260)',
    nodeStroke: styles.getPropertyValue('--color-node-stroke').trim() || 'oklch(0.35 0.015 260)',
    nodeLabel: styles.getPropertyValue('--color-node-label').trim() || 'oklch(0.75 0.01 80)',
    nodeSublabel: styles.getPropertyValue('--color-node-sublabel').trim() || 'oklch(0.45 0.01 260)',
    accentColor: styles.getPropertyValue('--color-accent').trim() || 'oklch(0.73 0.20 30)',
  }
}

function buildGraphModel(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): GraphModel {
  const nodeMap = new Map<string, MutableGraphNode>()

  for (const node of nodes) {
    nodeMap.set(node.node_id, { ...node })
  }

  const mutableEdges: MutableGraphEdge[] = []
  const connectedIds = new Set<string>()

  for (const edge of edges) {
    const source = nodeMap.get(edge.source_node_id)
    const target = nodeMap.get(edge.target_node_id)
    if (!source || !target) {
      continue
    }

    mutableEdges.push({
      ...edge,
      source,
      target,
    })

    connectedIds.add(source.node_id)
    connectedIds.add(target.node_id)
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: mutableEdges,
    connectedIds,
  }
}

function getNodeRadius(node: GraphNode, centerNodeId?: string): number {
  return node.node_id === centerNodeId ? 22 : 16
}

function getConstellationRadius(node: GraphNode, centerNodeId?: string): number {
  return node.node_id === centerNodeId ? 6 : 3.5
}

function truncateLabel(label: string, limit: number): string {
  return label.length > limit ? `${label.slice(0, limit - 2)}...` : label
}

function getNodeImageHref(node: GraphNode): string | null {
  return getPhotoPathForName(node.label)
}

function sanitizeNodeId(nodeId: string): string {
  return nodeId.replace(/[^a-zA-Z0-9]/g, '_')
}

function createDragBehavior(
  simulation: d3.Simulation<MutableGraphNode, MutableGraphEdge>,
  centerNodeId?: string,
): d3.DragBehavior<SVGGElement, MutableGraphNode, MutableGraphNode | d3.SubjectPosition> {
  return d3.drag<SVGGElement, MutableGraphNode>()
    .on('start', (event, node) => {
      if (!event.active) {
        simulation.alphaTarget(0.2).restart()
      }
      node.fx = node.x
      node.fy = node.y
    })
    .on('drag', (event, node) => {
      node.fx = event.x
      node.fy = event.y
    })
    .on('end', (event, node) => {
      if (!event.active) {
        simulation.alphaTarget(0)
      }
      if (node.node_id !== centerNodeId) {
        node.fx = null
        node.fy = null
      }
    })
}

export function ForceGraph({ nodes, edges, centerNodeId, onNodeClick, constellation = false }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 })

  useEffect(() => {
    function updateSize() {
      const container = svgRef.current?.parentElement
      if (!container) {
        return
      }

      setDimensions({
        width: container.clientWidth,
        height: Math.max(500, container.clientHeight),
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || nodes.length === 0) {
      return
    }

    const { width, height } = dimensions
    const colors = getGraphColors()
    const graph = buildGraphModel(nodes, edges)

    d3.select(svg).selectAll('*').remove()

    const simulation = d3.forceSimulation(graph.nodes)
      .force(
        'link',
        d3.forceLink<MutableGraphNode, MutableGraphEdge>(graph.edges)
          .distance(constellation ? 100 : 80)
          .strength(0.8),
      )
      .force('charge', d3.forceManyBody<MutableGraphNode>().strength(constellation ? -200 : -150))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force(
        'radial',
        d3.forceRadial<MutableGraphNode>(
          (node) => (graph.connectedIds.has(node.node_id) ? 0 : 180),
          width / 2,
          height / 2,
        ).strength((node) => (graph.connectedIds.has(node.node_id) ? 0 : 0.04)),
      )
      .force('collision', d3.forceCollide<MutableGraphNode>().radius(constellation ? 20 : 40))

    if (centerNodeId) {
      const centerNode = graph.nodes.find((node) => node.node_id === centerNodeId)
      if (centerNode) {
        centerNode.fx = width / 2
        centerNode.fy = height / 2
      }
    }

    const svgSelection = d3.select(svg)
      .attr('width', width)
      .attr('height', height)

    const viewport = svgSelection.append('g')
    const scene = viewport.append('g')

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        viewport.attr('transform', event.transform.toString())
      })

    svgSelection.call(zoom)

    const dragBehavior = createDragBehavior(simulation, centerNodeId)

    const networkSelections = constellation
      ? null
      : renderNetwork(scene, graph, centerNodeId, colors, onNodeClick, dragBehavior)

    const constellationSelections = constellation
      ? renderConstellation(scene, graph, centerNodeId, colors, onNodeClick, dragBehavior)
      : null

    simulation.on('tick', () => {
      if (networkSelections) {
        networkSelections.edgeLines
          .attr('x1', ({ source }) => source.x ?? 0)
          .attr('y1', ({ source }) => source.y ?? 0)
          .attr('x2', ({ target }) => target.x ?? 0)
          .attr('y2', ({ target }) => target.y ?? 0)

        networkSelections.edgeLabels
          .attr('x', ({ source, target }) => ((source.x ?? 0) + (target.x ?? 0)) / 2)
          .attr('y', ({ source, target }) => ((source.y ?? 0) + (target.y ?? 0)) / 2)

        networkSelections.nodeGroups
          .attr('transform', (node) => `translate(${node.x ?? width / 2},${node.y ?? height / 2})`)
      }

      if (constellationSelections) {
        constellationSelections.edgePaths.attr('d', ({ source, target }) => {
          const sourceX = source.x ?? 0
          const sourceY = source.y ?? 0
          const targetX = target.x ?? 0
          const targetY = target.y ?? 0
          const dx = targetX - sourceX
          const dy = targetY - sourceY
          const radius = Math.sqrt(dx * dx + dy * dy) * 1.5
          return `M${sourceX},${sourceY}A${radius},${radius} 0 0,1 ${targetX},${targetY}`
        })

        constellationSelections.nodeGroups
          .attr('transform', (node) => `translate(${node.x ?? width / 2},${node.y ?? height / 2})`)
      }
    })

    let rotationTimer: d3.Timer | null = null
    if (constellation && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let angle = 0
      const cx = width / 2
      const cy = height / 2
      rotationTimer = d3.timer(() => {
        angle += 0.0003
        scene.attr('transform', `rotate(${angle * (180 / Math.PI)}, ${cx}, ${cy})`)
      })
    }

    return () => {
      simulation.stop()
      rotationTimer?.stop()
    }
  }, [centerNodeId, constellation, dimensions, edges, nodes, onNodeClick])

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

function renderNetwork(
  scene: d3.Selection<SVGGElement, unknown, null, undefined>,
  graph: GraphModel,
  centerNodeId: string | undefined,
  colors: GraphColors,
  onNodeClick: ForceGraphProps['onNodeClick'],
  dragBehavior: d3.DragBehavior<SVGGElement, MutableGraphNode, MutableGraphNode | d3.SubjectPosition>,
): NetworkSelections {
  const { nodeFill, nodeStroke, nodeLabel, nodeSublabel, accentColor } = colors

  const edgeLines = scene.append('g')
    .selectAll<SVGLineElement, MutableGraphEdge>('line')
    .data(graph.edges)
    .join('line')
    .attr('class', 'edge-line')
    .attr('stroke', (edge) => RELATIONSHIP_COLORS[edge.label] ?? '#333')
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.4)

  const edgeLabels = scene.append('g')
    .selectAll<SVGTextElement, MutableGraphEdge>('text')
    .data(graph.edges)
    .join('text')
    .attr('class', 'edge-label')
    .attr('text-anchor', 'middle')
    .attr('fill', (edge) => RELATIONSHIP_COLORS[edge.label] ?? '#555')
    .attr('font-size', '8px')
    .attr('opacity', 0.5)
    .text((edge) => edge.label.replace(/_/g, ' '))

  const defs = scene.append('defs')
  for (const node of graph.nodes) {
    defs.append('clipPath')
      .attr('id', `clip-${sanitizeNodeId(node.node_id)}`)
      .append('circle')
      .attr('r', getNodeRadius(node, centerNodeId))
  }

  const nodeGroups = scene.append('g')
    .selectAll<SVGGElement, MutableGraphNode>('g')
    .data(graph.nodes)
    .join('g')
    .attr('class', 'node-group')
    .attr('cursor', 'pointer')

  nodeGroups.append('circle')
    .attr('r', (node) => getNodeRadius(node, centerNodeId))
    .attr('fill', (node) => node.node_id === centerNodeId ? `color-mix(in oklch, ${accentColor} 20%, transparent)` : nodeFill)
    .attr('stroke', (node) => node.node_id === centerNodeId ? accentColor : nodeStroke)
    .attr('stroke-width', (node) => node.node_id === centerNodeId ? 2 : 1)

  nodeGroups
    .filter((node) => getNodeImageHref(node) !== null)
    .append('image')
    .attr('href', getNodeImageHref)
    .attr('x', (node) => -getNodeRadius(node, centerNodeId))
    .attr('y', (node) => -getNodeRadius(node, centerNodeId))
    .attr('width', (node) => getNodeRadius(node, centerNodeId) * 2)
    .attr('height', (node) => getNodeRadius(node, centerNodeId) * 2)
    .attr('clip-path', (node) => `url(#clip-${sanitizeNodeId(node.node_id)})`)
    .attr('preserveAspectRatio', 'xMidYMid slice')
    .on('error', function handleImageError() {
      d3.select(this).remove()
    })

  nodeGroups.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', (node) => node.node_id === centerNodeId ? 36 : 28)
    .attr('fill', nodeLabel)
    .attr('font-size', (node) => node.node_id === centerNodeId ? '11px' : '9px')
    .attr('font-weight', (node) => node.node_id === centerNodeId ? '600' : '400')
    .text((node) => truncateLabel(node.label, 20))

  nodeGroups.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', (node) => node.node_id === centerNodeId ? 48 : 38)
    .attr('fill', nodeSublabel)
    .attr('font-size', '8px')
    .attr('font-family', 'var(--font-mono)')
    .text((node) => parseMeta(node.metadata).birth_date ?? '')

  nodeGroups.on('click', (event, node) => {
    event.stopPropagation()
    onNodeClick?.(node)
  })

  nodeGroups.on('mouseenter', (event) => {
    d3.select(event.currentTarget as SVGGElement)
      .select('circle')
      .transition()
      .duration(200)
      .attr('stroke', accentColor)
      .attr('stroke-width', 2)
  })

  nodeGroups.on('mouseleave', (event, node) => {
    d3.select(event.currentTarget as SVGGElement)
      .select('circle')
      .transition()
      .duration(200)
      .attr('stroke', node.node_id === centerNodeId ? accentColor : nodeStroke)
      .attr('stroke-width', node.node_id === centerNodeId ? 2 : 1)
  })

  nodeGroups.call(dragBehavior)

  return {
    nodeGroups,
    edgeLines,
    edgeLabels,
  }
}

function renderConstellation(
  scene: d3.Selection<SVGGElement, unknown, null, undefined>,
  graph: GraphModel,
  centerNodeId: string | undefined,
  colors: GraphColors,
  onNodeClick: ForceGraphProps['onNodeClick'],
  dragBehavior: d3.DragBehavior<SVGGElement, MutableGraphNode, MutableGraphNode | d3.SubjectPosition>,
): ConstellationSelections {
  const { accentColor, nodeLabel } = colors

  const edgePaths = scene.append('g')
    .selectAll<SVGPathElement, MutableGraphEdge>('path')
    .data(graph.edges)
    .join('path')
    .attr('class', 'edge-curve')
    .attr('fill', 'none')
    .attr('stroke', (edge) => RELATIONSHIP_COLORS[edge.label] ?? '#444')
    .attr('stroke-width', 0.8)
    .attr('stroke-opacity', 0.15)
    .attr('stroke-dasharray', '4 4')

  const nodeGroups = scene.append('g')
    .selectAll<SVGGElement, MutableGraphNode>('g')
    .data(graph.nodes)
    .join('g')
    .attr('class', 'node-group')
    .attr('cursor', 'pointer')

  nodeGroups.append('circle')
    .attr('r', (node) => getConstellationRadius(node, centerNodeId))
    .attr('fill', (node) => {
      const linkedEdge = graph.edges.find((edge) => edge.source.node_id === node.node_id || edge.target.node_id === node.node_id)
      return linkedEdge ? (RELATIONSHIP_COLORS[linkedEdge.label] ?? accentColor) : accentColor
    })
    .style('filter', (node) => {
      const linkedEdge = graph.edges.find((edge) => edge.source.node_id === node.node_id || edge.target.node_id === node.node_id)
      const color = linkedEdge ? (RELATIONSHIP_COLORS[linkedEdge.label] ?? accentColor) : accentColor
      return `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`
    })

  nodeGroups.append('text')
    .attr('class', 'constellation-label')
    .attr('text-anchor', 'middle')
    .attr('dy', -12)
    .attr('fill', nodeLabel)
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-serif)')
    .attr('font-style', 'italic')
    .attr('opacity', 0)
    .text((node) => truncateLabel(node.label, 25))

  nodeGroups.on('mouseenter', (event, node) => {
    const group = d3.select(event.currentTarget as SVGGElement)
    group.select<SVGTextElement>('.constellation-label')
      .transition()
      .duration(200)
      .attr('opacity', 1)
    group.select('circle')
      .transition()
      .duration(200)
      .attr('r', node.node_id === centerNodeId ? 8 : 5)
  })

  nodeGroups.on('mouseleave', (event, node) => {
    const group = d3.select(event.currentTarget as SVGGElement)
    group.select<SVGTextElement>('.constellation-label')
      .transition()
      .duration(300)
      .attr('opacity', 0)
    group.select('circle')
      .transition()
      .duration(300)
      .attr('r', node.node_id === centerNodeId ? 6 : 3.5)
  })

  nodeGroups.on('click', (event, node) => {
    event.stopPropagation()
    onNodeClick?.(node)
  })

  nodeGroups.call(dragBehavior)

  return {
    nodeGroups,
    edgePaths,
  }
}
