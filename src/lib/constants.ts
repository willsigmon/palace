/**
 * PALACE constants and configuration
 */

// Navigation items — room names give PALACE a spatial identity
export const NAV_ITEMS = [
  { id: 'stream', label: 'The Stream', href: '/', icon: 'stream' },
  { id: 'people', label: 'The Gallery', href: '/people', icon: 'people' },
  { id: 'memories', label: 'The Archive', href: '/memories', icon: 'memories' },
  { id: 'search', label: 'The Stacks', href: '/search', icon: 'search' },
  { id: 'graph', label: 'The Observatory', href: '/graph', icon: 'graph' },
  { id: 'insights', label: 'The Nexus', href: '/insights', icon: 'insights' },
  { id: 'ask', label: 'The Oracle', href: '/ask', icon: 'ask' },
  { id: 'verticals', label: 'Verticals', href: '/verticals', icon: 'verticals' },
  { id: 'media', label: 'The Theater', href: '/media', icon: 'media' },
  { id: 'locations', label: 'The Atlas', href: '/locations', icon: 'locations' },
  { id: 'actions', label: 'Actions', href: '/actions', icon: 'actions' },
] as const

// Room ambient tints — hue values for orb color shifting per route
// Each room subtly shifts the background atmosphere
export const ROOM_TINTS: Record<string, { readonly warm: number; readonly cool: number; readonly accent: number }> = {
  '/': { warm: 30, cool: 260, accent: 350 },
  '/people': { warm: 350, cool: 290, accent: 330 },
  '/memories': { warm: 290, cool: 260, accent: 310 },
  '/search': { warm: 180, cool: 200, accent: 170 },
  '/graph': { warm: 240, cool: 260, accent: 220 },
  '/ask': { warm: 40, cool: 30, accent: 50 },
  '/locations': { warm: 140, cool: 160, accent: 120 },
  '/insights': { warm: 180, cool: 200, accent: 160 },
  '/media': { warm: 50, cool: 30, accent: 60 },
  '/verticals': { warm: 30, cool: 260, accent: 350 },
  '/actions': { warm: 30, cool: 260, accent: 350 },
} as const

// Category hue overrides for activity pulse
export const CATEGORY_HUES: Record<string, number> = {
  family: 50,
  work: 230,
  music: 290,
  personal: 160,
  health: 350,
  technology: 195,
  finance: 155,
  social: 330,
  education: 250,
  real_estate: 30,
} as const

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
