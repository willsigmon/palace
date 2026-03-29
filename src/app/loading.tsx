export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <div className="mb-10">
        <div className="skeleton h-10 w-48 mb-3" />
        <div className="skeleton h-4 w-72" />
      </div>
      <div className="skeleton h-12 w-full rounded-xl mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/20 bg-surface/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="skeleton h-3 w-16" />
              <div className="skeleton h-3 w-10" />
              <span className="flex-1" />
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
            <div className="skeleton h-4 w-3/4 mb-2" />
            <div className="skeleton h-3 w-full mb-1" />
            <div className="skeleton h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
