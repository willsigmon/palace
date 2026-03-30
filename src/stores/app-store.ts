/**
 * Global application state (Zustand)
 */

import { create } from 'zustand'

type ThemePreference = 'dark' | 'light' | 'system'
type ResolvedTheme = 'dark' | 'light'

interface FilterState {
  readonly query: string
  readonly sessionType: string | null
  readonly category: string | null
  readonly dateRange: { start: string; end: string } | null
  readonly person: string | null
}

interface AppState {
  // Search overlay
  readonly searchOpen: boolean
  readonly openSearch: () => void
  readonly closeSearch: () => void
  readonly toggleSearch: () => void

  // Sidebar
  readonly sidebarExpanded: boolean
  readonly toggleSidebar: () => void

  // Theme
  readonly theme: ThemePreference
  readonly resolvedTheme: ResolvedTheme
  readonly setTheme: (theme: ThemePreference) => void
  readonly cycleTheme: () => void
  readonly initTheme: () => () => void

  // Stream filters
  readonly filters: FilterState
  readonly setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  readonly clearFilters: () => void
}

const DEFAULT_FILTERS: FilterState = {
  query: '',
  sessionType: null,
  category: null,
  dateRange: null,
  person: null,
}

const THEME_KEY = 'palace-theme'
const CYCLE_ORDER: readonly ThemePreference[] = ['dark', 'light', 'system']

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return
  const html = document.documentElement

  // Add transition class briefly for smooth toggle
  html.classList.add('theme-transitioning')
  requestAnimationFrame(() => {
    if (resolved === 'light') {
      html.classList.add('light')
    } else {
      html.classList.remove('light')
    }
    // Remove transition class after animation completes
    setTimeout(() => html.classList.remove('theme-transitioning'), 350)
  })

  // Update theme-color meta
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', resolved === 'light' ? '#f5f0e8' : '#1a1a2e')
  }
}

function resolveTheme(pref: ThemePreference): ResolvedTheme {
  return pref === 'system' ? getSystemTheme() : pref
}

export const useAppStore = create<AppState>((set, get) => ({
  // Search
  searchOpen: false,
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),

  // Sidebar
  sidebarExpanded: false,
  toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

  // Theme
  theme: 'dark',
  resolvedTheme: 'dark',

  setTheme: (theme) => {
    const resolved = resolveTheme(theme)
    localStorage.setItem(THEME_KEY, theme)
    applyTheme(resolved)
    set({ theme, resolvedTheme: resolved })
  },

  cycleTheme: () => {
    const current = get().theme
    const idx = CYCLE_ORDER.indexOf(current)
    const next = CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length]
    get().setTheme(next)
  },

  initTheme: () => {
    const stored = localStorage.getItem(THEME_KEY) as ThemePreference | null
    const pref = stored ?? 'dark'
    const resolved = resolveTheme(pref)
    applyTheme(resolved)
    set({ theme: pref, resolvedTheme: resolved })

    // Listen for system preference changes
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = () => {
      if (get().theme === 'system') {
        const newResolved = getSystemTheme()
        applyTheme(newResolved)
        set({ resolvedTheme: newResolved })
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  },

  // Filters
  filters: DEFAULT_FILTERS,
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  clearFilters: () => set({ filters: DEFAULT_FILTERS }),
}))
