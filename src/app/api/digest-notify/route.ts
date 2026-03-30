import { NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.wsig.me'
const API_TOKEN = process.env.API_TOKEN ?? process.env.NEXT_PUBLIC_API_TOKEN ?? ''
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
  // Fetch digest from wsigomi
  const digestUrl = new URL('/api/digest', API_BASE)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`
  }

  const digestRes = await fetch(digestUrl.toString(), { headers })
  if (!digestRes.ok) {
    return NextResponse.json(
      { ok: false, error: `Digest fetch failed: ${digestRes.statusText}` },
      { status: 502 }
    )
  }

  const digest = (await digestRes.json()) as DigestResponse

  // Build summary message
  const topPerson = digest.topPeople?.[0]?.name ?? null
  const highlight = digest.highlights[0]?.title ?? null

  const parts: string[] = [
    `PALACE Weekly: ${digest.conversationCount} convos, ${digest.memoryCount} memories.`,
  ]
  if (topPerson) parts.push(`Top: ${topPerson}.`)
  if (highlight) parts.push(`Highlight: ${highlight}`)

  const message = parts.join(' ')

  // Send to ntfy
  const ntfyRes = await fetch(`${NTFY_BASE}/${NTFY_TOPIC}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: message,
  })

  if (!ntfyRes.ok) {
    return NextResponse.json(
      { ok: false, error: `ntfy delivery failed: ${ntfyRes.statusText}` },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true, message })
}
