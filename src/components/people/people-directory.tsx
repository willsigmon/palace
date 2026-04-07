'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Person } from '@/types/api'
import { getPeople, getIdentityGraph } from '@/lib/api'
import type { IdentityPerson } from '@/lib/api'
import { Avatar } from '@/components/ui/avatar'

interface PeopleDirectoryProps {
  readonly initialPeople: readonly Person[]
}

type SortMode = 'alpha' | 'conversations' | 'closest'

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

type DirectoryPerson = Person & {
  readonly imessage_count?: number
  readonly last_message_date?: string | null
}

function getDirectoryPersonScore(person: DirectoryPerson): number {
  return [
    person.conversation_count ?? 0,
    person.imessage_count ?? 0,
    person.display_name ? 1 : 0,
    person.email ? 1 : 0,
    person.phone ? 1 : 0,
  ].reduce((sum, value) => sum + value, 0)
}

function dedupePeopleById(people: readonly DirectoryPerson[]): DirectoryPerson[] {
  const unique = new Map<number, DirectoryPerson>()

  for (const person of people) {
    const existing = unique.get(person.id)
    if (!existing || getDirectoryPersonScore(person) >= getDirectoryPersonScore(existing)) {
      unique.set(person.id, person)
    }
  }

  return Array.from(unique.values())
}

export function PeopleDirectory({ initialPeople }: PeopleDirectoryProps) {
  const searchParams = useSearchParams()
  const [people, setPeople] = useState<readonly DirectoryPerson[]>(initialPeople)
  const [query, setQuery] = useState('')
  const [relationship, setRelationship] = useState('')
  const [loading, setLoading] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('closest')
  const [identityPeople, setIdentityPeople] = useState<readonly IdentityPerson[]>([])
  const identityFetched = useRef(false)

  // Fetch identity graph for closeness sort
  useEffect(() => {
    if (identityFetched.current) return
    identityFetched.current = true
    getIdentityGraph(200).then((data: { people: readonly IdentityPerson[] }) => setIdentityPeople(data.people)).catch(() => {})
  }, [])

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

    const filtered = dedupePeopleById(people).filter((person) => {
      const name = person.display_name ?? person.name
      if (name.startsWith('+')) return false
      if (/^\d/.test(name) && phonePattern.test(name)) return false
      return true
    })

    if (sortMode === 'closest' && identityPeople.length > 0) {
      // Use identity graph data — sorted by combined iMessage + conversation signal
      const idPeople = dedupePeopleById(identityPeople
        .filter(ip => {
          const name = ip.display_name ?? ip.name
          if (name.startsWith('+')) return false
          if (/^\d/.test(name) && phonePattern.test(name)) return false
          return (ip.imessage_count > 0 || ip.conversation_count > 0)
        })
        .map(ip => ({
          id: ip.id, name: ip.name, display_name: ip.display_name,
          relationship: ip.relationship, phone: ip.phone, email: ip.email,
          birthday: ip.birthday, gedcom_id: ip.gedcom_id, clay_contact_id: null,
          conversation_count: ip.conversation_count,
          imessage_count: ip.imessage_count,
          last_message_date: ip.last_message_date,
        }) as DirectoryPerson)
      )
      return [['—', idPeople]] as [string, DirectoryPerson[]][]
    }

    if (sortMode === 'conversations') {
      const sorted = [...filtered].sort((a, b) => {
        const ca = a.conversation_count ?? 0
        const cb = b.conversation_count ?? 0
        if (cb !== ca) return cb - ca
        return (a.display_name ?? a.name).localeCompare(b.display_name ?? b.name)
      })
      return [['—', sorted]] as [string, DirectoryPerson[]][]
    }

    const groups = new Map<string, DirectoryPerson[]>()
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
  }, [people, sortMode, identityPeople])

  const totalShown = grouped.reduce((sum, [, items]) => sum + items.length, 0)

  return (
    <div>
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-lg font-semibold text-text">
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
          {(['closest', 'alpha', 'conversations'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`px-2 py-1 text-xs font-medium transition-colors ${
                sortMode === mode ? 'text-accent' : 'text-sub hover:text-text'
              }`}
            >
              {mode === 'closest' ? 'Closest' : mode === 'alpha' ? 'A-Z' : 'Convos'}
            </button>
          ))}
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
                        {person.imessage_count && person.imessage_count > 0 && (
                          <span className="text-[10px] text-muted/50 font-[family-name:var(--font-mono)]">
                            {person.imessage_count.toLocaleString()} msgs
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/15 mb-4">
            <circle cx="18" cy="16" r="6" />
            <path d="M6 38c0-5 4-9 12-9s12 4 12 9" />
            <circle cx="34" cy="18" r="5" />
            <path d="M34 26c5 0 8 3 8 7" strokeLinecap="round" />
          </svg>
          <p className="text-[15px] font-medium text-sub">No people found</p>
          <p className="mt-1 text-[12px] text-muted/40">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
