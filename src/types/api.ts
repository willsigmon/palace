/**
 * Type definitions for the wsigomi REST API (api.wsig.me)
 * Verified against live API responses 2026-03-29
 */

// === Conversation List Item (GET /api/conversations) ===

export interface ConversationListItem {
  readonly id: number
  readonly title: string | null
  readonly overview: string | null
  readonly emoji: string | null
  readonly category: string | null
  readonly startedAt: string // "2026-03-28 22:48:09.566"
  readonly finishedAt: string | null
  readonly session_type: string | null
  readonly people_mentioned: string | null // JSON string or null
  readonly segmentCount: number
}

// === Conversation Detail (GET /api/conversations/:id) ===

export interface ConversationDetail {
  readonly session: ConversationSession
  readonly speakerNames: Record<string, string>
  readonly segments: readonly TranscriptSegment[]
  readonly enrichment?: ConversationEnrichment | null
}

export interface ConversationSession {
  readonly id: number
  readonly startedAt: string
  readonly finishedAt: string | null
  readonly source: string
  readonly language: string | null
  readonly status: string
  readonly title: string | null
  readonly overview: string | null
  readonly emoji: string | null
  readonly category: string | null
  readonly starred: number
  readonly discarded: number
}

export interface ConversationEnrichment {
  readonly generated_title: string | null
  readonly generated_overview: string | null
  readonly category: string | null
  readonly session_type: string | null
  readonly people_mentioned: readonly string[] | null
  readonly quality_score: number | null
}

export interface TranscriptSegment {
  readonly speaker: number
  readonly speakerLabel: string
  readonly isUser: number // 0 or 1
  readonly text: string
  readonly startTime: number
  readonly endTime: number
  readonly speakerName: string | null
}

// === People ===

export interface Person {
  readonly id: number
  readonly name: string
  readonly display_name: string | null
  readonly relationship: string | null
  readonly relationship_detail: string | null
  readonly phone: string | null
  readonly email: string | null
  readonly birthday: string | null
  readonly clay_contact_id: number | null
  readonly gedcom_id: string | null
  readonly conversation_count?: number
  readonly last_seen?: string | null
}

// === Memories ===

export interface Memory {
  readonly id: number
  readonly content: string
  readonly category: string | null
  readonly tagsJson: string | null
  readonly confidence: number | null
  readonly sourceApp: string | null
  readonly headline: string | null
  readonly createdAt: string
  readonly source: string | null
}

// === Search (GET /api/search?query=) ===

export interface SearchResponse {
  readonly memories: readonly SearchMemory[]
  readonly conversations: readonly SearchConversation[]
  readonly actionItems: readonly SearchActionItem[]
  readonly people: readonly SearchPerson[]
  readonly limitless: readonly SearchLimitless[]
}

export interface SearchMemory {
  readonly id: number
  readonly content: string
  readonly category: string | null
  readonly sourceApp: string | null
  readonly createdAt: string
}

export interface SearchConversation {
  readonly id: number
  readonly title: string | null
  readonly overview: string | null
  readonly category: string | null
  readonly startedAt: string
}

export interface SearchActionItem {
  readonly id: number
  readonly description: string
  readonly completed: number
  readonly createdAt: string
}

export interface SearchPerson {
  readonly id: number
  readonly name: string
  readonly display_name: string | null
  readonly relationship: string | null
}

export interface SearchLimitless {
  readonly id: number
  readonly title: string | null
  readonly markdown: string | null
  readonly startDate: string
}

// === Stats (GET /api/stats) ===

export interface StatsResponse {
  readonly memories: number
  readonly conversations: number
  readonly actionItems: number
  readonly observations: number
  readonly screenshots: number
  readonly enrichment: {
    readonly people: number
    readonly kgNodes: number
    readonly locations: number
    readonly limitless: number
  }
}

// === Knowledge Graph (GET /api/graph) ===

export interface KnowledgeGraphNode {
  readonly node_id: string
  readonly label: string
  readonly node_type: string
  readonly aliases: string | null
  readonly metadata: string | null
}

export interface KnowledgeGraphEdge {
  readonly source_node_id: string
  readonly target_node_id: string
  readonly label: string
}

export interface GraphResponse {
  readonly nodes: readonly KnowledgeGraphNode[]
  readonly edges: readonly KnowledgeGraphEdge[]
}

// === Health ===

export interface HealthResponse {
  readonly ok: boolean
  readonly version: string
  readonly enrichment: boolean
}

// === Query Parameters ===

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
