export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
        Search
      </h1>
      <p className="mt-2 text-sm text-sub">
        Deep search across your entire life archive. Use the search bar above or press <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted"><span className="text-[9px]">&#8984;</span>K</kbd> for quick search.
      </p>
    </div>
  )
}
