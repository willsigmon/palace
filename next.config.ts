import type { NextConfig } from 'next'

// Derive API host from NEXT_PUBLIC_API_URL so photo_path images can be served
// through next/image without a second hardcoded list.
function getApiHost(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL
  if (!raw) return 'api.wsig.me'
  try {
    return new URL(raw).hostname
  } catch {
    return 'api.wsig.me'
  }
}

const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT === 'true' ? { output: 'export' } : {}),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
        search: '',
      },
      {
        protocol: 'https',
        hostname: getApiHost(),
        port: '',
        pathname: '/**',
        search: '',
      },
    ],
  },
}

export default nextConfig
