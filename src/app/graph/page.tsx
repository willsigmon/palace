export default function GraphPage() {
  return (
    <div className="mx-auto max-w-5xl px-[var(--space-page)] py-8">
      <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
        The Graph
      </h1>
      <p className="mt-2 text-sm text-sub">
        Explore relationships between people, topics, and ideas. Coming in Phase 3.
      </p>
      <div className="mt-8 flex h-[60vh] items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-muted">Knowledge graph visualization will render here</p>
      </div>
    </div>
  )
}
