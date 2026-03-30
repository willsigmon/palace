'use client'

import { useAppStore } from '@/stores/app-store'

export function ThemeToggle() {
  const { theme, cycleTheme } = useAppStore()

  const label = theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'

  return (
    <button
      onClick={cycleTheme}
      className="fixed right-4 top-4 z-30 flex items-center gap-2 rounded-full border border-border/40 bg-surface/60 px-3 py-1.5 text-[11px] font-medium text-sub backdrop-blur-sm transition-all hover:border-border/60 hover:bg-surface/80 hover:text-text md:right-6 md:top-5"
      title={`Theme: ${label} — press T to toggle`}
      aria-label={`Switch theme (currently ${label})`}
    >
      {theme === 'light' ? (
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="10" cy="10" r="4" />
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" />
        </svg>
      ) : theme === 'system' ? (
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="14" height="10" rx="2" />
          <path d="M7 17h6" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M17.5 10.5a7.5 7.5 0 0 1-10-10 7.5 7.5 0 1 0 10 10z" />
        </svg>
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
