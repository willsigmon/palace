interface EmptyStateProps {
  readonly icon?: 'search' | 'data' | 'error' | 'offline'
  readonly title: string
  readonly description?: string
  readonly action?: {
    readonly label: string
    readonly onClick: () => void
  }
}

const ICONS = {
  search: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/20">
      <circle cx="22" cy="22" r="12" />
      <path d="M31 31l9 9" strokeLinecap="round" />
      <path d="M18 18l8 8M26 18l-8 8" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  data: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/20">
      <rect x="8" y="8" width="32" height="32" rx="4" />
      <path d="M16 20h16M16 28h10" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/20">
      <circle cx="24" cy="24" r="16" />
      <path d="M24 16v10M24 30v2" strokeLinecap="round" />
    </svg>
  ),
  offline: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/20">
      <path d="M8 28c0-6 5-10 10-10a10 10 0 0 1 12 0c5 0 10 4 10 10" strokeLinecap="round" />
      <path d="M14 38l20-20" strokeLinecap="round" />
    </svg>
  ),
} as const

export function EmptyState({ icon = 'data', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {ICONS[icon]}
      <h3 className="mt-4 text-[15px] font-medium text-sub">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-[13px] text-muted/60">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-accent/10 px-4 py-2 text-[13px] font-medium text-accent transition-colors hover:bg-accent/20"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
