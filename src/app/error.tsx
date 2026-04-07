'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const detail = error.message && error.message !== 'Failed to fetch' ? error.message : null

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border/40 bg-surface">
        <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
          <circle cx="10" cy="10" r="8" />
          <path d="M10 6v4M10 13v.5" strokeLinecap="round" />
        </svg>
      </div>
      <h1 className="mb-2 text-lg font-semibold text-text">Can&apos;t reach your PALACE</h1>
      <p className="mb-6 max-w-sm text-sm text-sub">
        The connection to your memory archive failed. Check that the API is running at api.wsig.me.
      </p>
      {detail && <p className="mb-6 max-w-sm text-xs text-muted/50">{detail}</p>}
      <button
        onClick={reset}
        className="rounded-lg bg-accent/15 px-5 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/25"
      >
        Try Again
      </button>
    </div>
  )
}
