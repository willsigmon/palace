/**
 * PALACE API Client
 * Typed fetch wrapper for wsigomi REST API (api.wsig.me)
 */

import type {
  Conversation,
  ConversationListParams,
  GraphParams,
  HealthResponse,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  Person,
  PeopleListParams,
  SearchParams,
  SearchResult,
  StatsResponse,
  TimelineEvent,
  Memory,
  ActionItem,
} from '@/types/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.wsig.me'
const API_TOKEN = process.env.API_TOKEN ?? process.env.NEXT_PUBLIC_API_TOKEN ?? ''

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: { server?: boolean },
): Promise<T> {
  const url = new URL(path, API_BASE)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Use server-side token for RSC, public token for client
  const token = options?.server ? (process.env.API_TOKEN ?? API_TOKEN) : API_TOKEN
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url.toString(), {
    headers,
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new ApiError(response.status, `API error: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

// === Health ===

export function getHealth() {
  return request<HealthResponse>('/health')
}

// === Stats ===

export function getStats() {
  return request<StatsResponse>('/api/stats')
}

// === Conversations ===

export function getConversations(params?: ConversationListParams) {
  return request<readonly Conversation[]>('/api/conversations', {
    query: params?.query,
    category: params?.category,
    session_type: params?.session_type,
    since: params?.since,
    until: params?.until,
    limit: params?.limit ?? 25,
    offset: params?.offset ?? 0,
  })
}

export function getConversation(id: string) {
  return request<Conversation>(`/api/conversations/${id}`, undefined, { server: true })
}

// === Search ===

export function search(params: SearchParams) {
  return request<readonly SearchResult[]>('/api/search', {
    query: params.query,
    limit: params.limit ?? 25,
    offset: params.offset ?? 0,
  })
}

// === People ===

export function getPeople(params?: PeopleListParams) {
  return request<readonly Person[]>('/api/people', {
    query: params?.query,
    relationship: params?.relationship,
    limit: params?.limit ?? 25,
    offset: params?.offset ?? 0,
  })
}

export function getPerson(id: string) {
  return request<Person & { conversations: readonly Conversation[] }>(`/api/people/${id}`)
}

// === Knowledge Graph ===

export function getGraph(params?: GraphParams) {
  return request<{
    readonly nodes: readonly KnowledgeGraphNode[]
    readonly edges: readonly KnowledgeGraphEdge[]
  }>('/api/graph', {
    type: params?.type,
    query: params?.query,
    related_to: params?.related_to,
    limit: params?.limit,
  })
}

// === Timeline ===

export function getTimeline(date: string) {
  return request<readonly TimelineEvent[]>('/api/timeline', { date })
}

// === Memories ===

export function getMemories(params?: {
  query?: string
  category?: string
  since?: string
  limit?: number
  offset?: number
}) {
  return request<readonly Memory[]>('/api/memories', {
    query: params?.query,
    category: params?.category,
    since: params?.since,
    limit: params?.limit ?? 25,
    offset: params?.offset ?? 0,
  })
}

// === Action Items ===

export function getActionItems(params?: {
  query?: string
  completed?: boolean
  limit?: number
}) {
  return request<readonly ActionItem[]>('/api/action-items', {
    query: params?.query,
    completed: params?.completed,
    limit: params?.limit ?? 25,
  })
}

// === Locations ===

export function getLocations(params?: {
  label?: string
  since?: string
  until?: string
  limit?: number
}) {
  return request<readonly Location[]>('/api/locations', {
    label: params?.label,
    since: params?.since,
    until: params?.until,
    limit: params?.limit ?? 25,
  })
}

// Re-export types for convenience
export { ApiError }
export type { HealthResponse, StatsResponse, SearchResult }

// Missing import — Location is used above but defined in types
import type { Location } from '@/types/api'
