'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Person } from '@/types/api'
import { getPeople } from '@/lib/api'
import { Avatar } from '@/components/ui/avatar'

interface PeopleDirectoryProps {
  readonly initialPeople: readonly Person[]
}

type SortMode = 'alpha' | 'conversations'

const RELATIONSHIP_FILTERS = [
  { value: '', label: 'All' },
  { value: 'family', label: 'Family' },
  { value: 'contact', label: 'Contacts' },
  { value: 'professional', label: 'Professional' },
  { value: 'friend', label: 'Friends' },
] as const

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  gedcom: { label: 'Family Tree', color: 'bg-memory/15 text-memory' },
  clay: { label: 'Clay', color: 'bg-serendipity/15 text-serendipity' },
  contact: { label: 'Contact', color: 'bg-accent/15 text-accent' },
}

function getSource(person: Person): string {
  if (person.gedcom_id) return 'gedcom'
  if (person.clay_contact_id) return 'clay'
  return 'contact'
}

function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter((p) => p.length > 0 && !p.startsWith('+'))
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function PeopleDirectory({ initialPeople }: PeopleDirectoryProps) {
  const searchParams = useSearchParams()
  const [people, setPeople] = useState<readonly Person[]>(initialPeople)
  const [query, setQuery] = useState('')
  const [relationship, setRelationship] = useState('')
  const [loading, setLoading] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('alpha')

  // Auto-populate and trigger search from ?q= URL param on mount
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && q.trim().length > 0) {
      void handleSearch(q.trim())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSearch(q: string) {
    setQuery(q)
    if (q.length < 2 && !relationship) {
      setPeople(initialPeople)
      return
    }

    setLoading(true)
    try {
      const results = await getPeople({
        query: q || undefined,
        relationship: relationship || undefined,
        limit: 100,
      })
      setPeople(results)
    } catch {
      // keep existing results
    } finally {
      setLoading(false)
    }
  }

  async function handleFilterChange(rel: string) {
    setRelationship(rel)
    setLoading(true)
    try {
      const results = await getPeople({
        query: query || undefined,
        relationship: rel || undefined,
        limit: 100,
      })
      setPeople(results)
    } catch {
      // keep existing
    } finally {
      setLoading(false)
    }
  }

  // Group by first letter (alpha mode) or flat sorted list (conversations mode)
  const grouped = useMemo(() => {
    const phonePattern = /^[\d\s\-().+]+$/

    const filtered = people.filter((person) => {
      const name = person.display_name ?? person.name
      if (name.startsWith('+')) return false
      if (/^\d/.test(name) && phonePattern.test(name)) return false
      return true
    })

    if (sortMode === 'conversations') {
      const sorted = [...filtered].sort((a, b) => {
        const ca = a.conversation_count ?? 0
        const cb = b.conversation_count ?? 0
        if (cb !== ca) return cb - ca
        return (a.display_name ?? a.name).localeCompare(b.display_name ?? b.name)
      })
      return [['—', sorted]] as [string, Person[]][]
    }

    const groups = new Map<string, Person[]>()
    for (const person of filtered) {
      const name = person.display_name ?? person.name
      const letter = name[0]?.toUpperCase() ?? '#'
      const existing = groups.get(letter)
      if (existing) {
        existing.push(person)
      } else {
        groups.set(letter, [person])
      }
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [people, sortMode])

  const totalShown = grouped.reduce((sum, [, items]) => sum + items.length, 0)

  return (
    <div>
      {/* Header */}
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-serif)] text-[length:var(--text-3xl)] italic text-text">
          People
        </h1>
        <p className="mt-1 text-xs text-muted font-[family-name:var(--font-mono)]">
          {totalShown} people from Family Tree, Clay, and conversations
        </p>
      </header>

      {/* Search + Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          >
            <circle cx="9" cy="9" r="5" />
            <path d="M13 13l4 4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search people..."
            className="w-full rounded-lg border border-border/50 bg-surface/40 py-2 pl-10 pr-4 text-sm text-text placeholder:text-muted outline-none transition-colors focus:border-accent"
          />
        </div>

        <div className="flex gap-1.5">
          {RELATIONSHIP_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                relationship === f.value
                  ? 'bg-accent text-void'
                  : 'bg-surface text-sub hover:bg-elevated hover:text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 border-l border-border/30 pl-3">
          <button
            onClick={() => setSortMode('alpha')}
            className={`px-2 py-1 text-xs font-medium transition-colors ${
              sortMode === 'alpha' ? 'text-accent' : 'text-sub hover:text-text'
            }`}
          >
            A-Z
          </button>
          <button
            onClick={() => setSortMode('conversations')}
            className={`px-2 py-1 text-xs font-medium transition-colors ${
              sortMode === 'conversations' ? 'text-accent' : 'text-sub hover:text-text'
            }`}
          >
            Most conversations
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mb-4 flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          <span className="text-sm text-sub">Searching...</span>
        </div>
      )}

      {/* People list grouped alphabetically or sorted by conversations */}
      <div className="space-y-6">
        {grouped.map(([letter, items]) => (
          <section key={letter}>
            {sortMode === 'alpha' && (
              <h2 className="sticky top-0 z-10 mb-2 border-b border-border/30 bg-void/80 pb-1 text-xs font-bold uppercase tracking-widest text-accent backdrop-blur-sm">
                {letter}
              </h2>
            )}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((person) => {
                const source = getSource(person)
                const badge = SOURCE_BADGES[source]
                const name = person.display_name ?? person.name

                return (
                  <Link
                    key={person.id}
                    href={`/people/${person.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-border/30 bg-surface/40 p-3 transition-all duration-200 hover:border-border hover:bg-surface"
                  >
                    {/* Avatar */}
                    <Avatar name={name} size="lg" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text group-hover:text-accent transition-colors">
                        {name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {badge && (
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${badge.color}`}>
                            {badge.label}
                          </span>
                        )}
                        {person.birthday && (
                          <span className="text-[10px] text-muted truncate">
                            b. {person.birthday}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Empty state */}
      {grouped.length === 0 && !loading && (
        <div className="py-16 text-center">
          <p className="font-[family-name:var(--font-serif)] text-xl italic text-sub">
            No people found
          </p>
        </div>
      )}
    </div>
  )
}
