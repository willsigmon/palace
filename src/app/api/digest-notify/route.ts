import { NextResponse } from 'next/server'
import { getRuntimeConfig, resolveRuntimeUrl } from '@/lib/runtime-config'

const NTFY_TOPIC = 'palace-digest'
const NTFY_BASE = 'https://ntfy.sh'

interface DigestResponse {
  readonly week_starting: string
  readonly conversationCount: number
  readonly memoryCount: number
  readonly topCategories: readonly { category: string; count: number }[]
  readonly topPeople?: readonly { name: string; count: number }[]
  readonly longestConversation: { id: number; title: string | null; startedAt: string; duration_seconds: number } | null
  readonly highlights: readonly { id: number; title: string; overview: string; category: string; startedAt: string }[]
}

export async function GET() {
  const runtime = getRuntimeConfig()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (runtime.apiToken) {
    headers.Authorization = `Bearer ${runtime.apiToken}`
  }

  const digestResponse = await fetch(resolveRuntimeUrl(runtime.apiBaseUrl, '/api/digest'), { headers })
  if (!digestResponse.ok) {
    return NextResponse.json(
      { ok: false, error: `Digest fetch failed: ${digestResponse.statusText}` },
      { status: 502 },
    )
  }

  const digest = (await digestResponse.json()) as DigestResponse
  const topPerson = digest.topPeople?.[0]?.name ?? null
  const highlight = digest.highlights[0]?.title ?? null

  const parts: string[] = [
    `PALACE Weekly: ${digest.conversationCount} convos, ${digest.memoryCount} memories.`,
  ]
  if (topPerson) parts.push(`Top: ${topPerson}.`)
  if (highlight) parts.push(`Highlight: ${highlight}`)

  const message = parts.join(' ')

  const ntfyResponse = await fetch(`${NTFY_BASE}/${NTFY_TOPIC}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: message,
  })

  if (!ntfyResponse.ok) {
    return NextResponse.json(
      { ok: false, error: `ntfy delivery failed: ${ntfyResponse.statusText}` },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, message })
}
