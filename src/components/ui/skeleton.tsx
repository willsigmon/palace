/**
 * Skeleton loading components for PALACE
 */

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border/20 bg-surface/20 p-5">
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
  )
}

export function SkeletonCompactCard() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/20 bg-surface/20 px-4 py-3">
      <div className="skeleton h-3 w-20" />
      <span className="flex-1" />
      <div className="skeleton h-3 w-12" />
    </div>
  )
}

export function SkeletonPersonCard() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/20 bg-surface/20 p-3">
      <div className="skeleton h-10 w-10 rounded-full" />
      <div>
        <div className="skeleton h-3.5 w-28 mb-1.5" />
        <div className="skeleton h-2.5 w-16" />
      </div>
    </div>
  )
}

export function SkeletonStream() {
  return (
    <div className="space-y-3">
      <SkeletonCard />
      <SkeletonCompactCard />
      <SkeletonCompactCard />
      <SkeletonCard />
      <SkeletonCompactCard />
      <SkeletonCard />
    </div>
  )
}
