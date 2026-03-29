/**
 * PALACE constants and configuration
 */

// Navigation items
export const NAV_ITEMS = [
  { id: 'stream', label: 'Stream', href: '/', icon: 'stream' },
  { id: 'people', label: 'People', href: '/people', icon: 'people' },
  { id: 'memories', label: 'Memories', href: '/memories', icon: 'memories' },
  { id: 'search', label: 'Search', href: '/search', icon: 'search' },
  { id: 'graph', label: 'Graph', href: '/graph', icon: 'graph' },
  { id: 'insights', label: 'Insights', href: '/insights', icon: 'insights' },
] as const

// API defaults
export const API_DEFAULTS = {
  PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  REVALIDATE_CONVERSATIONS: 60,
  REVALIDATE_PATTERNS: 3600,
  REVALIDATE_GRAPH: 300,
} as const

// Conversation type labels
export const SESSION_TYPE_LABELS: Record<string, string> = {
  conversation: 'Conversation',
  media: 'Media',
  ambient: 'Ambient',
  voice_note: 'Voice Note',
} as const

// Keyboard shortcuts
export const SHORTCUTS = {
  SEARCH: 'k',
  HOME: 'h',
  GRAPH: 'g',
} as const

// Animation durations (seconds)
export const ANIMATION = {
  CARD_ENTER: 0.4,
  CARD_STAGGER: 0.08,
  PAGE_TRANSITION: 0.3,
  SEARCH_OVERLAY: 0.25,
  GRAPH_SETTLE: 2,
} as const

// Breakpoints (must match Tailwind)
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 1024,
  DESKTOP: 1440,
} as const
