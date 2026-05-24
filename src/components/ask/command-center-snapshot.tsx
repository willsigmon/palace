import Link from 'next/link'
import { formatNumber, formatRelativeTime, truncate } from '@/lib/format'

export interface CommandCenterSnapshotData {
  readonly stats: {
    readonly conversations: number
    readonly memories: number
    readonly people: number
    readonly openActions: number
  } | null
  readonly latestConversation: {
    readonly id: number
    readonly title: string | null
    readonly overview: string | null
    readonly category: string | null
    readonly startedAt: string
  } | null
  readonly openActions: readonly {
    readonly id: number
    readonly description: string
    readonly priority: string | null
    readonly createdAt: string
  }[]
  readonly digest: {
    readonly conversationCount: number
    readonly memoryCount: number
    readonly topCategory: string | null
    readonly topPerson: string | null
    readonly highlight: string | null
  } | null
}

interface CommandCenterSnapshotProps {
  readonly snapshot: CommandCenterSnapshotData | null
}

export function CommandCenterSnapshot({ snapshot }: CommandCenterSnapshotProps) {
  if (!snapshot) {
    return null
  }

  if (!snapshot.stats && !snapshot.latestConversation && snapshot.openActions.length === 0 && !snapshot.digest) {
    return null
  }

  const latestTitle = snapshot.latestConversation?.title?.trim() || 'Latest capture'
  const weeklySignal = snapshot.digest?.topPerson
    ? `Most with ${snapshot.digest.topPerson.split(' ')[0]}`
    : snapshot.digest?.topCategory
      ? `${snapshot.digest.topCategory} is active`
      : snapshot.digest?.highlight
        ? truncate(snapshot.digest.highlight, 48)
        : 'Archive warming up'

  return (
    <section className="overflow-hidden rounded-[1.4rem] border border-border/30 bg-surface/25 shadow-card">
      <div className="border-b border-border/20 bg-elevated/15 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent/70">
              Command brief
            </p>
            <p className="mt-1 text-sm text-sub/80">
              Live context, not another dashboard.
            </p>
          </div>
          {snapshot.stats && (
            <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-muted/45">
              {formatNumber(snapshot.stats.conversations)} conversations
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border/20">
        <SnapshotLink
          href="/actions"
          eyebrow="Open loops"
          value={formatNumber(snapshot.stats?.openActions ?? snapshot.openActions.length)}
          detail={snapshot.openActions[0] ? truncate(snapshot.openActions[0].description, 64) : 'Nothing urgent is waiting.'}
        />
        <SnapshotLink
          href={snapshot.latestConversation ? `/conversation/${snapshot.latestConversation.id}` : '/timeline'}
          eyebrow="Last heard"
          value={truncate(latestTitle, 30)}
          detail={
            snapshot.latestConversation
              ? `${formatRelativeTime(snapshot.latestConversation.startedAt)}${snapshot.latestConversation.category ? ` · ${snapshot.latestConversation.category}` : ''}`
              : 'Timeline is ready when captures arrive.'
          }
        />
        <SnapshotLink
          href="/memories"
          eyebrow="Memory field"
          value={snapshot.stats ? formatNumber(snapshot.stats.memories) : 'Ready'}
          detail={weeklySignal}
        />
      </div>

      {snapshot.openActions.length > 0 && (
        <div className="px-4 py-3 sm:px-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted/45">Next loops</p>
            <Link href="/actions" className="text-[11px] text-accent/70 transition-colors hover:text-accent">
              Review all
            </Link>
          </div>
          <div className="space-y-1.5">
            {snapshot.openActions.slice(0, 2).map((item) => (
              <Link
                key={item.id}
                href="/actions"
                className="group flex items-center gap-3 rounded-xl border border-border/20 bg-void/20 px-3 py-2 transition-colors hover:border-accent/25 hover:bg-elevated/20"
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.priority === 'high' ? 'bg-red-400' : item.priority === 'medium' ? 'bg-amber-400' : 'bg-accent/70'}`} />
                <span className="min-w-0 flex-1 truncate text-[12px] text-sub/80 group-hover:text-text">
                  {item.description}
                </span>
                <span className="hidden font-[family-name:var(--font-mono)] text-[9px] text-muted/35 sm:inline">
                  {formatRelativeTime(item.createdAt)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function SnapshotLink({
  href,
  eyebrow,
  value,
  detail,
}: {
  readonly href: string
  readonly eyebrow: string
  readonly value: string
  readonly detail: string
}) {
  return (
    <Link
      href={href}
      className="group min-h-[7.25rem] bg-surface/35 p-3 transition-colors hover:bg-elevated/30 sm:min-h-[8.5rem] sm:p-5"
    >
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted/45">{eyebrow}</p>
          <span className="text-muted/35 transition-transform group-hover:translate-x-1 group-hover:text-accent">→</span>
        </div>
        <div>
          <p className="truncate text-[0.95rem] font-semibold tracking-[-0.04em] text-text sm:text-[clamp(1.05rem,3vw,1.35rem)]">
            {value}
          </p>
          <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-muted/65 group-hover:text-sub/80">
            {detail}
          </p>
        </div>
      </div>
    </Link>
  )
}
