'use client'

import { useState, useEffect } from 'react'

type Status = 'connected' | 'degraded' | 'disconnected' | 'checking'

interface RuntimeHealthResponse {
  readonly ok: boolean
  readonly degraded?: boolean
  readonly services?: {
    readonly api?: { readonly ok: boolean }
    readonly marlin?: { readonly ok: boolean }
  }
}

const STATUS_CONFIG: Record<Status, { color: string; label: string }> = {
  connected: { color: 'bg-emerald-400', label: 'Connected' },
  degraded: { color: 'bg-amber-400', label: 'Degraded' },
  disconnected: { color: 'bg-red-400', label: 'Offline' },
  checking: { color: 'bg-muted animate-pulse', label: 'Checking...' },
}

export function ApiStatus({ expanded }: { expanded: boolean }) {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    async function check() {
      try {
        const response = await fetch('/api/runtime-health', { cache: 'no-store' })
        if (!response.ok) {
          setStatus('disconnected')
          return
        }

        const health = (await response.json()) as RuntimeHealthResponse
        const serviceStates = Object.values(health.services ?? {}).map((service) => service?.ok)
        const anyConnected = serviceStates.some(Boolean)

        if (health.ok) {
          setStatus('connected')
        } else if (anyConnected || health.degraded) {
          setStatus('degraded')
        } else {
          setStatus('disconnected')
        }
      } catch {
        setStatus('disconnected')
      }
    }

    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  const config = STATUS_CONFIG[status]

  return (
    <div className="flex items-center gap-2 px-1" title={`API: ${config.label}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.color}`} />
      {expanded && (
        <span className="text-[9px] text-muted/50 font-[family-name:var(--font-mono)]">
          {config.label}
        </span>
      )}
    </div>
  )
}
