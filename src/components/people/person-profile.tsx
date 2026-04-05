'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/format'
import type { PersonDetailResponse } from '@/lib/api'
import { getEnrichment, getIdentityGraph } from '@/lib/api'
import type { IdentityPerson } from '@/lib/api'
import { Avatar } from '@/components/ui/avatar'
import { Breadcrumb } from '@/components/ui/breadcrumb'

interface PersonProfileProps {
  readonly data: PersonDetailResponse
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  parent_of: 'text-pattern',
  child_of: 'text-serendipity',
  sibling_of: 'text-memory',
  spouse_of: 'text-accent',
  related_to: 'text-sub',
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  parent_of: 'Parent',
  child_of: 'Child',
  sibling_of: 'Sibling',
  spouse_of: 'Spouse',
  related_to: 'Related',
}

function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter((p) => p.length > 0)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function PersonProfile({ data }: PersonProfileProps) {
  const { person, conversations, relationships } = data
  const name = person.display_name ?? person.name
  const [enrichment, setEnrichment] = useState<string | null>(null)
  const [enrichLoading, setEnrichLoading] = useState(false)
  const [identity, setIdentity] = useState<IdentityPerson | null>(null)

  // Fetch identity stats (iMessage count, etc.)
  useEffect(() => {
    getIdentityGraph(200)
      .then((data: { people: readonly IdentityPerson[] }) => {
        const match = data.people.find(p => p.id === person.id)
        if (match) setIdentity(match)
      })
      .catch(() => {})
  }, [person.id])

  const lookUp = useCallback(async () => {
    setEnrichLoading(true)
    try {
      const result = await getEnrichment(name, 'person')
      setEnrichment(result.content)
    } catch {
      setEnrichment('Could not look up this person.')
    } finally {
      setEnrichLoading(false)
    }
  }, [name])

  // Group relationships by type
  const groupedRelationships = new Map<string, string[]>()
  for (const rel of relationships) {
    const existing = groupedRelationships.get(rel.label)
    if (existing) {
      // Avoid duplicates
      if (!existing.includes(rel.target)) {
        existing.push(rel.target)
      }
    } else {
      groupedRelationships.set(rel.label, [rel.target])
    }
  }

  return (
    <article>
      <Breadcrumb items={[
        { label: 'People', href: '/people' },
        { label: name },
      ]} />

      {/* Header */}
      <header className="mb-8 flex items-start gap-5">
        <Avatar name={name} size="xl" />
        <div>
          <h1 className="text-lg font-semibold text-text">
            {name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted font-[family-name:var(--font-mono)]">
            {person.relationship && (
              <span className="rounded-full bg-elevated px-2 py-0.5 capitalize">
                {person.relationship}
              </span>
            )}
            {person.gedcom_id && (
              <span className="rounded-full bg-memory/15 px-2 py-0.5 text-memory">
                Family Tree
              </span>
            )}
            {person.clay_contact_id && (
              <span className="rounded-full bg-serendipity/15 px-2 py-0.5 text-serendipity">
                Clay
              </span>
            )}
          </div>

          {/* Stats row */}
          {(identity || conversations.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px]">
              {identity && identity.imessage_count > 0 && (
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-serendipity">
                    <path d="M3 5c0-1.1.9-2 2-2h10a2 2 0 012 2v7a2 2 0 01-2 2H7l-4 3V5z" />
                  </svg>
                  <span className="font-[family-name:var(--font-mono)] text-sub">
                    {identity.imessage_count.toLocaleString()} messages
                  </span>
                </div>
              )}
              {identity && identity.last_message_date && (
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted/50">
                    <circle cx="10" cy="10" r="7" />
                    <path d="M10 6v4l3 2" />
                  </svg>
                  <span className="font-[family-name:var(--font-mono)] text-muted/60">
                    last texted {new Date(identity.last_message_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {conversations.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent/60">
                    <path d="M3 4h14M3 8h10M3 12h14" />
                  </svg>
                  <span className="font-[family-name:var(--font-mono)] text-muted/60">
                    {conversations.length} conversations
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Info cards */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {person.birthday && (
          <InfoCard label="Birthday" value={person.birthday} />
        )}
        {person.phone && (
          <InfoCard label="Phone" value={person.phone} />
        )}
        {person.email && (
          <InfoCard label="Email" value={person.email} />
        )}
        {person.notes && (
          <InfoCard label="Notes" value={person.notes} />
        )}
      </div>

      {/* Perplexity Enrichment */}
      <div className="mb-8">
        {enrichment ? (
          <div className="rounded-xl border border-serendipity/15 bg-serendipity/[0.02] p-5">
            <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-serendipity/70">
              About {name}
            </h2>
            <div className="text-[13px] leading-[1.7] text-sub/80 whitespace-pre-wrap">{enrichment}</div>
          </div>
        ) : (
          <button
            onClick={lookUp}
            disabled={enrichLoading}
            className="flex items-center gap-2 rounded-lg bg-serendipity/10 px-4 py-2 text-[12px] font-medium text-serendipity transition-colors hover:bg-serendipity/20 disabled:opacity-50"
          >
            {enrichLoading ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border border-serendipity/30 border-t-serendipity" />
                Looking up...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="9" cy="9" r="5" />
                  <path d="M13 13l4 4" />
                </svg>
                Look up with Perplexity
              </>
            )}
          </button>
        )}
      </div>

      {/* Family Relationships */}
      {groupedRelationships.size > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">
            Relationships
          </h2>
          <div className="space-y-3">
            {Array.from(groupedRelationships.entries()).map(([label, targets]) => (
              <div key={label} className="rounded-xl border border-border/50 bg-surface/40 p-4">
                <p className={`mb-2 text-[10px] font-medium uppercase tracking-wider ${RELATIONSHIP_COLORS[label] ?? 'text-sub'}`}>
                  {RELATIONSHIP_LABELS[label] ?? label.replace(/_/g, ' ')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {targets.map((target) => (
                    <Link
                      key={target}
                      href={`/people?q=${encodeURIComponent(target)}`}
                      className="inline-flex items-center gap-2 rounded-full bg-elevated px-2 py-1 text-xs text-text transition-colors hover:bg-accent/15 hover:text-accent"
                    >
                      <Avatar name={target} size="sm" />
                      {target}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Conversations */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
          Conversations
          <span className="font-[family-name:var(--font-mono)] text-[10px] normal-case">
            ({conversations.length})
          </span>
        </h2>

        {conversations.length > 0 ? (
          <div className="space-y-2">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/conversation/${c.id}`}
                className="group flex items-center justify-between rounded-lg border border-border/30 bg-surface/40 px-4 py-3 transition-all hover:border-border hover:bg-surface"
              >
                <div>
                  <p className="text-sm font-medium text-text group-hover:text-accent transition-colors">
                    {c.title ?? 'Untitled'}
                  </p>
                  {c.category && (
                    <span className="mt-0.5 inline-block text-[10px] text-muted uppercase">
                      {c.category}
                    </span>
                  )}
                </div>
                <time className="shrink-0 text-[10px] text-muted font-[family-name:var(--font-mono)]">
                  {formatRelativeTime(c.startedAt)}
                </time>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm italic text-muted">
            No conversations recorded with this person
          </p>
        )}
      </section>
    </article>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/30 bg-surface/40 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 text-sm text-text">{value}</p>
    </div>
  )
}
