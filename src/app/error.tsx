'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-border/40">
        <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
          <circle cx="10" cy="10" r="8" />
          <path d="M10 6v4M10 13v.5" strokeLinecap="round" />
        </svg>
      </div>
      <h1 className="text-lg font-semibold text-text mb-2">
        Can&apos;t reach your PALACE
      </h1>
      <p className="max-w-sm text-sm text-sub mb-6">
        The connection to your memory archive failed. Check that the API is running at api.wsig.me.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-accent/15 px-5 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/25"
      >
        Try Again
      </button>
    </div>
  )
}
