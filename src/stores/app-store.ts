/**
 * Global application state (Zustand)
 */

import { create } from 'zustand'

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

export const useAppStore = create<AppState>((set) => ({
  // Search
  searchOpen: false,
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),

  // Sidebar
  sidebarExpanded: false,
  toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

  // Filters
  filters: DEFAULT_FILTERS,
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  clearFilters: () => set({ filters: DEFAULT_FILTERS }),
}))
