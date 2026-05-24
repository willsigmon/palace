import Link from 'next/link'
import type { ReactNode } from 'react'
import { EXPLORE_ITEMS } from '@/lib/constants'

export const metadata = { title: 'More' }

const ICONS: Record<string, ReactNode> = {
  people: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="6" r="2.5" />
      <path d="M2 16c0-2.5 2-4.5 5-4.5s5 2 5 4.5" />
      <circle cx="14" cy="7" r="2" />
      <path d="M14 11c2.5 0 4 1.5 4 3.5" strokeLinecap="round" />
    </svg>
  ),
  insights: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M10 2v3M10 15v3M2 10h3M15 10h3" />
      <circle cx="10" cy="10" r="4" />
    </svg>
  ),
  media: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7" />
      <path d="M8.5 7.5l5 2.5-5 2.5V7.5z" fill="currentColor" stroke="none" />
    </svg>
  ),
  locations: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17s-6-4.35-6-8.5a6 6 0 1 1 12 0C16 12.65 10 17 10 17z" />
      <circle cx="10" cy="8.5" r="2" />
    </svg>
  ),
  graph: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="5" r="2" />
      <circle cx="5" cy="15" r="2" />
      <circle cx="15" cy="15" r="2" />
      <path d="M10 7v2M8.5 11l-2 2M11.5 11l2 2" />
    </svg>
  ),
  verticals: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="13" width="14" height="3" rx="1" />
      <rect x="3" y="8.5" width="11" height="3" rx="1" />
      <rect x="3" y="4" width="8" height="3" rx="1" />
    </svg>
  ),
}

export default function MorePage() {
  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <header className="mb-7">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-accent/70">
          Explore
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-text">Everything else, tucked away.</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-sub">
          The daily app stays simple: ask WSIG, search, review the timeline, and clear actions.
          These deeper surfaces are still here when you want to wander.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {EXPLORE_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group rounded-2xl border border-border/30 bg-surface/30 p-4 transition-all hover:-translate-y-0.5 hover:border-accent/25 hover:bg-surface/50 hover:shadow-card"
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/30 bg-elevated/30 text-sub transition-colors group-hover:border-accent/25 group-hover:text-accent">
                {ICONS[item.icon]}
              </span>
              <span className="text-muted/35 transition-transform group-hover:translate-x-1 group-hover:text-accent">
                →
              </span>
            </div>
            <h2 className="text-[15px] font-medium text-text">{item.label}</h2>
            <p className="mt-1.5 text-[12px] leading-5 text-muted/70">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
