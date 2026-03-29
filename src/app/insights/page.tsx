import { getStats } from '@/lib/api'
import { formatNumber } from '@/lib/format'

export const metadata = { title: 'Insights' }

export default async function InsightsPage() {
  let stats
  try {
    stats = await getStats()
  } catch {
    stats = null
  }

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
          Insights
        </h1>
        <p className="mt-1.5 text-sm text-sub">
          Patterns, serendipity, and synthesis from your life data.
        </p>
      </header>

      {/* Feature cards */}
      <div className="space-y-4">
        <InsightCard
          title="Patterns"
          description="Recurring themes across your conversations. Idea evolution tracked over months. Relationship shifts you might not notice."
          color="pattern"
          stats={stats ? `Analyzing ${formatNumber(stats.conversations)} conversations` : undefined}
          phase="Phase 2"
        />
        <InsightCard
          title="Serendipity"
          description="Surprising connections between memories you'd never find yourself. Cross-topic bridges. Ideas resurfacing when newly relevant."
          color="serendipity"
          stats={stats ? `${formatNumber(stats.memories)} memories to connect` : undefined}
          phase="Phase 2"
        />
        <InsightCard
          title="On This Day"
          description="Memories from exactly 1 year, 6 months, 3 months ago. A carousel of moments that shaped where you are now."
          color="memory"
          phase="Phase 2"
        />
        <InsightCard
          title="Synthesis"
          description="Ask questions about your life data and get multi-paragraph analysis with cited sources. 'How has my thinking about AI changed?'"
          color="accent"
          phase="Phase 2"
        />
        <InsightCard
          title="Weekly Digest"
          description="Automated summary of your week's conversations — the 3 most interesting patterns and 1 surprising connection."
          color="sub"
          phase="Phase 2"
        />
      </div>
    </div>
  )
}

function InsightCard({
  title,
  description,
  color,
  stats,
  phase,
}: {
  title: string
  description: string
  color: string
  stats?: string
  phase: string
}) {
  return (
    <div className={`group rounded-xl border border-${color}/15 bg-${color}/[0.02] p-6 transition-all hover:border-${color}/25 hover:bg-${color}/[0.04]`}>
      <div className="flex items-center justify-between">
        <h2 className={`text-[10px] font-semibold uppercase tracking-widest text-${color}`}>
          {title}
        </h2>
        <span className="rounded-full bg-elevated px-2 py-0.5 text-[9px] text-muted">
          {phase}
        </span>
      </div>
      <p className="mt-2.5 text-[13px] leading-relaxed text-sub/80">
        {description}
      </p>
      {stats && (
        <p className="mt-3 text-[10px] text-muted/50 font-[family-name:var(--font-mono)]">
          {stats}
        </p>
      )}
    </div>
  )
}
