/**
 * Type definitions for the wsigomi REST API (api.wsig.me)
 * Maps to enrichment.db + omi.db schema
 */

// === Core Entities ===

export interface Conversation {
  readonly id: string
  readonly title: string
  readonly overview: string | null
  readonly category: string | null
  readonly session_type: 'conversation' | 'media' | 'ambient' | 'voice_note'
  readonly emoji: string | null
  readonly created_at: string
  readonly finished_at: string | null
  readonly duration_seconds: number | null
  readonly source: string
  readonly starred: boolean
  readonly people_mentioned: readonly string[]
  readonly topics: readonly string[]
  readonly quality_score: number | null
  readonly transcript_segments: readonly TranscriptSegment[]
  readonly enrichment: ConversationEnrichment | null
}

export interface ConversationEnrichment {
  readonly generated_title: string | null
  readonly generated_overview: string | null
  readonly category: string | null
  readonly session_type: string | null
  readonly people_mentioned: readonly string[]
  readonly quality_score: number | null
}

export interface TranscriptSegment {
  readonly text: string
  readonly speaker: string
  readonly speaker_label: string | null
  readonly is_user: boolean
  readonly start_time: number
  readonly end_time: number
}

export interface Person {
  readonly id: string
  readonly name: string
  readonly display_name: string | null
  readonly relationship: string | null
  readonly phone: string | null
  readonly email: string | null
  readonly birthday: string | null
  readonly conversation_count: number
  readonly last_seen: string | null
}

export interface Memory {
  readonly id: string
  readonly content: string
  readonly category: string | null
  readonly tags: readonly string[]
  readonly confidence: number | null
  readonly source_app: string | null
  readonly created_at: string
}

export interface ActionItem {
  readonly id: string
  readonly description: string
  readonly completed: boolean
  readonly priority: string | null
  readonly category: string | null
  readonly due_at: string | null
  readonly created_at: string
}

export interface KnowledgeGraphNode {
  readonly id: string
  readonly name: string
  readonly type: 'person' | 'organization' | 'project' | 'tool' | 'location'
  readonly properties: Record<string, unknown>
}

export interface KnowledgeGraphEdge {
  readonly source: string
  readonly target: string
  readonly relationship: string
  readonly weight: number
}

export interface Location {
  readonly id: string
  readonly latitude: number
  readonly longitude: number
  readonly address: string | null
  readonly label: string | null
  readonly people_present: readonly string[]
  readonly created_at: string
}

export interface TimelineEvent {
  readonly type: 'conversation' | 'memory' | 'action_item' | 'location'
  readonly timestamp: string
  readonly data: Conversation | Memory | ActionItem | Location
}

// === API Responses ===

export interface StatsResponse {
  readonly memories: number
  readonly conversations: number
  readonly action_items: number
  readonly observations: number
  readonly screenshots: number
  readonly people: number
  readonly kg_nodes: number
  readonly locations: number
  readonly limitless_lifelogs: number
}

export interface SearchResult {
  readonly type: 'memory' | 'conversation' | 'action_item' | 'person' | 'limitless'
  readonly id: string
  readonly title: string
  readonly excerpt: string
  readonly created_at: string
  readonly score: number
}

export interface HealthResponse {
  readonly ok: boolean
  readonly version: string
  readonly enrichment: boolean
}

// === API Query Parameters ===

export interface ConversationListParams {
  readonly query?: string
  readonly category?: string
  readonly session_type?: string
  readonly since?: string
  readonly until?: string
  readonly limit?: number
  readonly offset?: number
}

export interface SearchParams {
  readonly query: string
  readonly limit?: number
  readonly offset?: number
}

export interface PeopleListParams {
  readonly query?: string
  readonly relationship?: string
  readonly limit?: number
  readonly offset?: number
}

export interface GraphParams {
  readonly type?: string
  readonly query?: string
  readonly related_to?: string
  readonly limit?: number
}

// === Paginated Response ===

export interface PaginatedResponse<T> {
  readonly data: readonly T[]
  readonly total: number
  readonly limit: number
  readonly offset: number
}
