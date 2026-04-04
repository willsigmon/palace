'use client'

import { useState, useEffect, useRef } from 'react'
import { formatNumber, formatDuration } from '@/lib/format'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.wsig.me'

interface VaultData {
  readonly longest_conversation: { id: number; title: string; minutes: number } | null
  readonly night_owl: { id: number; title: string; time: string } | null
  readonly most_mentioned_person: { name: string; count: number } | null
  readonly total_conversations: number
  readonly total_hours: number
  readonly random_quote: string | null
  readonly total_people: number
  readonly top_category: { category: string; count: number } | null
}

interface StatCardProps {
  readonly label: string
  readonly value: string
  readonly sublabel?: string
  readonly index: number
  readonly visible: boolean
}

function StatCard({ label, value, sublabel, index, visible }: StatCardProps) {
  return (
    <div
      className="rounded-xl border border-accent/10 bg-accent/[0.02] p-6 text-center transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        transitionDelay: `${index * 150}ms`,
      }}
    >
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted/50 mb-2">
        {label}
      </p>
      <p className="text-[22px] font-semibold text-text font-[family-name:var(--font-serif)] italic">
        {value}
      </p>
      {sublabel && (
        <p className="mt-1 text-[11px] text-sub/50">{sublabel}</p>
      )}
    </div>
  )
}

export function VaultStats() {
  const [data, setData] = useState<VaultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [entering, setEntering] = useState(true)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true

    fetch(`${API_URL}/api/vault`)
      .then((r) => r.json())
      .then((d: VaultData) => {
        setData(d)
        setLoading(false)
        // Entrance animation delay
        setTimeout(() => setEntering(false), 300)
        setTimeout(() => setRevealed(true), 600)
      })
      .catch(() => {
        // Fallback: build partial data from existing endpoints
        buildFallbackData().then((d) => {
          setData(d)
          setLoading(false)
          setTimeout(() => setEntering(false), 300)
          setTimeout(() => setRevealed(true), 600)
        })
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
          <p className="text-[11px] text-muted/40 uppercase tracking-widest">Unlocking the vault...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const stats = buildStats(data)

  return (
    <div>
      {/* Door opening effect */}
      <div
        className="overflow-hidden transition-all duration-700"
        style={{
          maxHeight: entering ? '0px' : '2000px',
          opacity: entering ? 0 : 1,
        }}
      >
        {/* Random self-quote */}
        {data.random_quote && (
          <blockquote
            className="mb-10 text-center text-[15px] leading-relaxed text-sub/60 italic font-[family-name:var(--font-serif)] max-w-lg mx-auto transition-opacity duration-500"
            style={{ opacity: revealed ? 1 : 0, transitionDelay: '200ms' }}
          >
            &ldquo;{data.random_quote.length > 200 ? data.random_quote.slice(0, 200).trimEnd() + '\u2026' : data.random_quote}&rdquo;
            <cite className="mt-2 block text-[10px] text-muted/30 not-italic uppercase tracking-widest">
              &mdash; You, at some point
            </cite>
          </blockquote>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} index={i} visible={revealed} />
          ))}
        </div>
      </div>
    </div>
  )
}

function buildStats(data: VaultData) {
  const stats: { label: string; value: string; sublabel?: string }[] = []

  stats.push({
    label: 'Total conversations',
    value: formatNumber(data.total_conversations),
    sublabel: `${formatNumber(Math.round(data.total_hours))} hours of your life`,
  })

  stats.push({
    label: 'People in your world',
    value: formatNumber(data.total_people),
  })

  if (data.longest_conversation) {
    stats.push({
      label: 'Longest conversation',
      value: formatDuration(data.longest_conversation.minutes * 60) || 'Unknown',
      sublabel: data.longest_conversation.title ?? 'Untitled',
    })
  }

  if (data.night_owl) {
    stats.push({
      label: 'Night owl record',
      value: data.night_owl.time,
      sublabel: data.night_owl.title ?? 'A late-night talk',
    })
  }

  if (data.most_mentioned_person) {
    stats.push({
      label: 'Most mentioned person',
      value: data.most_mentioned_person.name,
      sublabel: `${formatNumber(data.most_mentioned_person.count)} mentions`,
    })
  }

  if (data.top_category) {
    stats.push({
      label: 'You talk most about',
      value: data.top_category.category,
      sublabel: `${formatNumber(data.top_category.count)} conversations`,
    })
  }

  return stats
}

async function buildFallbackData(): Promise<VaultData> {
  try {
    const res = await fetch(`${API_URL}/api/stats`)
    const stats = await res.json()
    return {
      longest_conversation: null,
      night_owl: null,
      most_mentioned_person: null,
      total_conversations: stats.conversations ?? 0,
      total_hours: 0,
      random_quote: null,
      total_people: stats.enrichment?.people ?? 0,
      top_category: null,
    }
  } catch {
    return {
      longest_conversation: null,
      night_owl: null,
      most_mentioned_person: null,
      total_conversations: 0,
      total_hours: 0,
      random_quote: null,
      total_people: 0,
      top_category: null,
    }
  }
}
