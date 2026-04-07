export interface RuntimeConfig {
  readonly webOrigin: string
  readonly apiBaseUrl: string
  readonly marlinBaseUrl: string
  readonly apiToken: string
  readonly healthUrls: {
    readonly api: string
    readonly marlin: string
  }
}

const DEFAULT_WEB_ORIGIN = 'http://localhost:3000'
const DEFAULT_API_BASE_URL = 'https://api.wsig.me'
const DEFAULT_MARLIN_BASE_URL = 'https://marlin.sigflix.stream'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function getEnv(name: keyof NodeJS.ProcessEnv): string | undefined {
  const value = process.env[name]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

export function getRuntimeConfig(): RuntimeConfig {
  const webOrigin = trimTrailingSlash(getEnv('NEXT_PUBLIC_WEB_ORIGIN') ?? DEFAULT_WEB_ORIGIN)
  const apiBaseUrl = trimTrailingSlash(getEnv('NEXT_PUBLIC_API_URL') ?? DEFAULT_API_BASE_URL)
  const marlinBaseUrl = trimTrailingSlash(getEnv('NEXT_PUBLIC_MARLIN_URL') ?? DEFAULT_MARLIN_BASE_URL)
  const apiToken = getEnv('API_TOKEN') ?? getEnv('NEXT_PUBLIC_API_TOKEN') ?? ''

  return {
    webOrigin,
    apiBaseUrl,
    marlinBaseUrl,
    apiToken,
    healthUrls: {
      api: `${apiBaseUrl}/health`,
      marlin: `${marlinBaseUrl}/health`,
    },
  }
}

export function resolveRuntimeUrl(baseUrl: string, path: string): string {
  return new URL(path, `${trimTrailingSlash(baseUrl)}/`).toString()
}
