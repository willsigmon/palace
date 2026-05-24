import { getRuntimeConfig, resolveRuntimeUrl } from '@/lib/runtime-config'

type ProxyContext = {
  readonly params: Promise<{
    readonly path?: string[]
  }>
}

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
])

export async function GET(request: Request, context: ProxyContext) {
  return proxyToWsig(request, context)
}

export async function POST(request: Request, context: ProxyContext) {
  return proxyToWsig(request, context)
}

export async function PATCH(request: Request, context: ProxyContext) {
  return proxyToWsig(request, context)
}

async function proxyToWsig(request: Request, context: ProxyContext): Promise<Response> {
  const runtime = getRuntimeConfig()
  const params = await context.params
  const path = `/${(params.path ?? []).join('/')}`
  const incomingUrl = new URL(request.url)
  const targetUrl = new URL(resolveRuntimeUrl(runtime.apiBaseUrl, path))
  incomingUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value)
  })

  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  const accept = request.headers.get('accept')
  if (contentType) headers.set('content-type', contentType)
  if (accept) headers.set('accept', accept)
  if (runtime.apiToken) headers.set('authorization', `Bearer ${runtime.apiToken}`)

  const method = request.method.toUpperCase()
  const body = method === 'GET' || method === 'HEAD'
    ? undefined
    : await request.arrayBuffer()

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body,
    cache: 'no-store',
  })

  if (!upstream.ok) {
    const errorText = await upstream.text().catch(() => '')
    return Response.json(
      {
        ok: false,
        status: upstream.status,
        error: errorText.trim() || upstream.statusText || 'Upstream request failed',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'x-wsig-upstream-status': String(upstream.status),
        },
      },
    )
  }

  const responseHeaders = new Headers()
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value)
    }
  })
  responseHeaders.set('Cache-Control', 'no-store')

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })
}
