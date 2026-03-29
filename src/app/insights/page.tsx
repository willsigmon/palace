export default function InsightsPage() {
  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
        Insights
      </h1>
      <p className="mt-2 text-sm text-sub">
        Patterns, serendipity connections, and synthesis. Coming in Phase 2.
      </p>
      <div className="mt-8 space-y-4">
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-pattern">Patterns</p>
          <p className="mt-1 text-sm text-muted">Recurring themes and idea evolution</p>
        </div>
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-serendipity">Serendipity</p>
          <p className="mt-1 text-sm text-muted">Surprising connections between memories</p>
        </div>
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-memory">Synthesis</p>
          <p className="mt-1 text-sm text-muted">Ask questions about your life data</p>
        </div>
      </div>
    </div>
  )
}
