/**
 * PALACE API client
 * Single typed fetch boundary for wsigomi REST API (api.wsig.me)
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
import { getRuntimeConfig, resolveRuntimeUrl } from '@/lib/runtime-config'

type PrimitiveParam = string | number | boolean | undefined | null

type RequestOptions = {
  readonly params?: Record<string, PrimitiveParam>
  readonly method?: 'GET' | 'POST'
  readonly json?: unknown
  readonly body?: BodyInit
  readonly headers?: HeadersInit
}

export class ApiError extends Error {
  readonly status: number
  readonly path: string
  readonly details: unknown

  constructor(status: number, path: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.path = path
    this.details = details ?? null
  }
}

function buildUrl(path: string, params?: Record<string, PrimitiveParam>): string {
  const { apiBaseUrl } = getRuntimeConfig()
  const url = new URL(resolveRuntimeUrl(apiBaseUrl, path))

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url.toString()
}

async function parseErrorDetails(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  try {
    return await response.text()
  } catch {
    return null
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { apiToken } = getRuntimeConfig()
  const { method = 'GET', json, body, headers, params } = options
  const requestHeaders = new Headers(headers)

  if (json !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }
  if (apiToken && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${apiToken}`)
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers: requestHeaders,
    body: json !== undefined ? JSON.stringify(json) : body,
    ...(method === 'GET' ? { next: { revalidate: 60 } } : {}),
  })

  if (!response.ok) {
    const details = await parseErrorDetails(response)
    const detailMessage =
      typeof details === 'string' && details.trim() !== ''
        ? details.trim()
        : response.statusText || 'Request failed'

    throw new ApiError(response.status, path, `API request failed for ${path}: ${detailMessage}`, details)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

// === Core health + stats ===

export function getHealth() {
  return request<HealthResponse>('/health')
}

export function getStats() {
  return request<StatsResponse>('/api/stats')
}

// === Ask ===

export interface AskResponse {
  readonly answer: string
  readonly sources?: {
    readonly conversations: { id: number; title: string; date: string }[]
    readonly memories: number
    readonly people: string[]
  }
}

export function askQuestion(question: string) {
  return request<AskResponse>('/api/ask', {
    method: 'POST',
    json: { question },
  })
}

// === Conversations ===

export function getConversations(params?: ConversationListParams) {
  return request<readonly ConversationListItem[]>('/api/conversations', {
    params: {
      query: params?.query,
      category: params?.category,
      session_type: params?.session_type,
      since: params?.since,
      until: params?.until,
      limit: params?.limit ?? 25,
      offset: params?.offset ?? 0,
    },
  })
}

export function getConversation(id: string | number) {
  return request<ConversationDetail>(`/api/conversations/${id}`)
}

// === Search ===

export function search(params: SearchParams) {
  return request<SearchResponse>('/api/search', {
    params: {
      query: params.query,
      limit: params.limit ?? 25,
      offset: params.offset ?? 0,
    },
  })
}

// === People ===

export function getPeople(params?: PeopleListParams) {
  return request<readonly Person[]>('/api/people', {
    params: {
      query: params?.query,
      relationship: params?.relationship,
      limit: params?.limit ?? 25,
      offset: params?.offset ?? 0,
    },
  })
}

export function getPerson(id: string | number) {
  return request<PersonDetailResponse>(`/api/people/${id}`)
}

export interface PersonDetailResponse {
  readonly person: {
    readonly id: number
    readonly name: string
    readonly display_name: string | null
    readonly relationship: string | null
    readonly relationship_detail: string | null
    readonly clay_contact_id: number | null
    readonly gedcom_id: string | null
    readonly phone: string | null
    readonly email: string | null
    readonly birthday: string | null
    readonly notes: string | null
    readonly created_at: string
  }
  readonly conversations: readonly {
    readonly id: number
    readonly title: string | null
    readonly startedAt: string
    readonly category: string | null
  }[]
  readonly relationships: readonly {
    readonly label: string
    readonly target: string
    readonly node_type: string
  }[]
}

// === Timeline ===

export async function getTimeline(date: string) {
  const data = await request<{ date: string; events: readonly TimelineEvent[] }>('/api/timeline', {
    params: { date },
  })
  return data.events
}

interface TimelineEvent {
  readonly time: string
  readonly type: string
  readonly data: Record<string, unknown>
}

// === Knowledge graph ===

export function getGraph(params?: GraphParams) {
  return request<GraphResponse>('/api/graph', {
    params: {
      type: params?.type,
      query: params?.query,
      related_to: params?.related_to,
      limit: params?.limit,
    },
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
    params: {
      query: params?.query,
      category: params?.category,
      since: params?.since,
      limit: params?.limit ?? 25,
      offset: params?.offset ?? 0,
    },
  })
}

// === Patterns ===

export interface PatternsResponse {
  readonly categoryTrends: readonly { week: string; category: string; count: number }[]
  readonly topPeople: readonly { name: string; relationship: string; conversation_count: number; last_seen: string }[]
  readonly recurringTopics: readonly { category: string; count: number; first_seen: string; last_seen: string }[]
  readonly hourlyEnergy: readonly { hour: number; count: number }[]
  readonly dailyFrequency: readonly { date: string; count: number }[]
}

export function getPatterns(since?: string) {
  return request<PatternsResponse>('/api/patterns', {
    params: {
      since: since ?? new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
    },
  })
}

// === On this day ===

export interface OnThisDayResponse {
  readonly date: string
  readonly memories: readonly {
    readonly period: string
    readonly conversations: readonly {
      id: number
      title: string | null
      overview: string | null
      category: string | null
      emoji: string | null
      startedAt: string
    }[]
    readonly memoryCount: number
  }[]
}

export function getOnThisDay() {
  return request<OnThisDayResponse>('/api/on-this-day')
}

// === Serendipity ===

export interface SerendipityResponse {
  readonly connections: readonly {
    readonly type: string
    readonly description: string
    readonly conversations: readonly { id: number; title: string | null; startedAt: string; category: string | null }[]
  }[]
}

export function getSerendipity() {
  return request<SerendipityResponse>('/api/serendipity')
}

// === Weekly digest ===

export interface DigestResponse {
  readonly week_starting: string
  readonly conversationCount: number
  readonly memoryCount: number
  readonly topCategories: readonly { category: string; count: number }[]
  readonly topPeople?: readonly { name: string; count: number }[]
  readonly longestConversation: { id: number; title: string | null; startedAt: string; duration_seconds: number } | null
  readonly highlights: readonly { id: number; title: string; overview: string; category: string; startedAt: string }[]
}

export function getDigest() {
  return request<DigestResponse>('/api/digest')
}

// === Enrichment ===

export interface EnrichmentResponse {
  readonly query: string
  readonly type: string
  readonly content: string
  readonly cached: boolean
  readonly cached_at?: string
}

export function getEnrichment(query: string, type: 'person' | 'place' | 'thing' | 'general' = 'general') {
  return request<EnrichmentResponse>('/api/enrich', {
    params: { query, type },
  })
}

// === Speaker suggestions + identity ===

export function getSpeakerSuggestions(conversationId: number) {
  return request<SpeakerSuggestionsResponse>('/api/speaker-suggestions', {
    params: { conversation_id: conversationId },
  })
}

export interface SpeakerSuggestionsResponse {
  readonly conversation_id: number
  readonly location: {
    readonly lat: number
    readonly lon: number
    readonly label: string | null
  } | null
  readonly location_source?: string
  readonly suggestions: readonly {
    readonly name: string
    readonly person_id: number
    readonly relationship: string
    readonly times_seen_here: number
    readonly confidence: number
    readonly reason: string
  }[]
}

export interface IdentityPerson {
  readonly id: number
  readonly name: string
  readonly display_name: string | null
  readonly relationship: string | null
  readonly phone: string | null
  readonly email: string | null
  readonly birthday: string | null
  readonly gedcom_id: string | null
  readonly imessage_count: number
  readonly last_message_date: string | null
  readonly conversation_count: number
  readonly photo_path: string | null
  readonly contact_nickname: string | null
}

export interface IdentityGraphResponse {
  readonly people: readonly IdentityPerson[]
  readonly stats: {
    readonly total_people: number
    readonly mapped_conversations: number
    readonly imessage_linked: number
  }
}

export function getIdentityGraph(limit = 50) {
  return request<IdentityGraphResponse>('/api/identity/graph', {
    params: { limit },
  })
}

export function correctSpeakerName(input: { conversationId: number; speakerId: number; correctName: string }) {
  return request<void>('/api/identity/correct', {
    method: 'POST',
    json: {
      conversation_id: input.conversationId,
      speaker_id: input.speakerId,
      correct_name: input.correctName,
    },
  })
}

// === Actions ===

export interface ActionItem {
  readonly id: number
  readonly description: string
  readonly completed: number
  readonly priority: string | null
  readonly category: string | null
  readonly dueAt: string | null
  readonly createdAt: string
}

export function getActionItems(params?: {
  completed?: boolean
  limit?: number
}) {
  return request<readonly ActionItem[]>('/api/action-items', {
    params: {
      limit: params?.limit ?? 50,
      completed: params?.completed,
    },
  })
}

// === Verticals ===

export interface VerticalSummary {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly convoCount: number
  readonly memoryCount: number
  readonly recentConvos: { id: number; title: string; startedAt: string; category: string | null }[]
  readonly recentMemories: { id: number; content: string; createdAt: string }[]
  readonly topPeople: { name: string; person_id: number }[]
}

export function getVerticals() {
  return request<{ verticals: readonly VerticalSummary[] }>('/api/verticals')
}

// === Media ===

export interface MediaSession {
  readonly id: number
  readonly title: string
  readonly overview: string | null
  readonly media_type: string
  readonly emoji: string | null
  readonly startedAt: string
  readonly finishedAt: string | null
}

export interface MediaMemory {
  readonly id: number
  readonly content: string
  readonly sourceApp: string | null
  readonly createdAt: string
}

export interface MediaStats {
  readonly music: number
  readonly entertainment: number
}

export interface MediaResponse {
  readonly sessions: readonly MediaSession[]
  readonly memories: readonly MediaMemory[]
  readonly stats: MediaStats | null
}

export interface TmdbResult {
  readonly title: string
  readonly poster_url: string | null
  readonly vote_average: number | null
}

export function getMedia(params?: { type?: string; limit?: number }) {
  return request<MediaResponse>('/api/media', {
    params: {
      type: params?.type,
      limit: params?.limit ?? 50,
    },
  })
}

export function searchTmdbMedia(query: string, type: string) {
  return request<{ results: readonly TmdbResult[] }>('/api/media/tmdb', {
    params: { query, type },
  })
}

// === Locations ===

export interface LocationRecord {
  readonly id: number
  readonly source: string
  readonly latitude: number
  readonly longitude: number
  readonly address: string | null
  readonly label: string | null
  readonly timestamp: string
}

export function getLocations(limit = 5000) {
  return request<readonly LocationRecord[]>('/api/locations', {
    params: { limit },
  })
}

export interface OwnTracksPayload {
  readonly _type: 'location'
  readonly tid: string
  readonly lat: number
  readonly lon: number
  readonly alt: number | null
  readonly acc: number | null
  readonly vel: number | null
  readonly batt: number | null
  readonly conn: string
  readonly tst: number
}

export function sendOwnTracksLocation(payload: OwnTracksPayload) {
  return request<void>('/api/owntracks', {
    method: 'POST',
    json: payload,
  })
}

// === Vault ===

export interface VaultData {
  readonly longest_conversation: { id: number; title: string; minutes: number } | null
  readonly night_owl: { id: number; title: string; time: string } | null
  readonly most_mentioned_person: { name: string; count: number } | null
  readonly total_conversations: number
  readonly total_hours: number
  readonly random_quote: string | null
  readonly total_people: number
  readonly top_category: { category: string; count: number } | null
}

export function getVaultStats() {
  return request<VaultData>('/api/vault')
}

// === Random conversation ===

export async function getRandomConversation(): Promise<ConversationListItem | null> {
  const stats = await getStats()
  const total = stats.conversations
  if (total === 0) return null
  const offset = Math.floor(Math.random() * total)
  const items = await getConversations({ limit: 1, offset })
  return items[0] ?? null
}
