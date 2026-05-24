import { NextResponse } from 'next/server'
import { getRuntimeConfig } from '@/lib/runtime-config'

const HEALTH_TIMEOUT_MS = 4_000

interface ServiceHealth {
  readonly ok: boolean
  readonly status: number | null
  readonly label: string
}

export async function GET() {
  const runtime = getRuntimeConfig()

  const [api, marlin] = await Promise.all([
    checkService(runtime.healthUrls.api, 'wsigomi', runtime.apiToken),
    checkService(runtime.healthUrls.marlin, 'marlin'),
  ])

  return NextResponse.json(
    {
      ok: api.ok && marlin.ok,
      degraded: api.ok !== marlin.ok,
      services: { api, marlin },
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}

async function checkService(url: string, label: string, token?: string): Promise<ServiceHealth> {
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      cache: 'no-store',
    })

    return {
      ok: response.ok,
      status: response.status,
      label,
    }
  } catch {
    return {
      ok: false,
      status: null,
      label,
    }
  }
}
