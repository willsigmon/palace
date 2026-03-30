'use client'

import { useEffect } from 'react'
import { initNative } from '@/lib/native'

/**
 * Initializes Capacitor native capabilities.
 * No-ops gracefully in browser.
 */
export function NativeInit() {
  useEffect(() => {
    initNative()
  }, [])

  return null
}
