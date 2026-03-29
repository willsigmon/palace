/**
 * PALACE API Client
 * Typed fetch wrapper for wsigomi REST API (api.wsig.me)
 */

import type {
  ConversationListItem,
  ConversationDetail,
  ConversationListParams,
  GraphResponse,
  GraphParams,
  HealthResponse,
  Person,
  PeopleListParams,
  SearchParams,
  SearchResponse,
  StatsResponse,
  Memory,
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

  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`
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
  return request<readonly ConversationListItem[]>('/api/conversations', {
    query: params?.query,
    category: params?.category,
    session_type: params?.session_type,
    since: params?.since,
    until: params?.until,
    limit: params?.limit ?? 25,
    offset: params?.offset ?? 0,
  })
}

export function getConversation(id: string | number) {
  return request<ConversationDetail>(`/api/conversations/${id}`)
}

// === Search ===

export function search(params: SearchParams) {
  return request<SearchResponse>('/api/search', {
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

export function getPerson(id: string | number) {
  return request<Person>(`/api/people/${id}`)
}

// === Knowledge Graph ===

export function getGraph(params?: GraphParams) {
  return request<GraphResponse>('/api/graph', {
    type: params?.type,
    query: params?.query,
    related_to: params?.related_to,
    limit: params?.limit,
  })
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

export { ApiError }
