/**
 * Native capabilities — only available in Capacitor iOS app.
 * Falls back gracefully in browser.
 */

import { sendOwnTracksLocation } from '@/lib/api'

let isNative = false

export async function initNative() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    isNative = Capacitor.isNativePlatform()

    if (isNative) {
      await configureStatusBar()
      await startLocationTracking()
    }
  } catch {
    // Not in Capacitor — browser mode
  }
}

export function getIsNative() {
  return isNative
}

async function configureStatusBar() {
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#1a1a2e' })
  } catch {
    // Status bar plugin unavailable.
  }
}

async function startLocationTracking() {
  try {
    const { Geolocation } = await import('@capacitor/geolocation')
    const permissions = await Geolocation.requestPermissions()
    if (permissions.location !== 'granted') {
      return
    }

    Geolocation.watchPosition(
      { enableHighAccuracy: false, timeout: 60000, maximumAge: 120000 },
      (position, error) => {
        if (error || !position) {
          return
        }

        void sendOwnTracksLocation({
          _type: 'location',
          tid: 'palace-ios',
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          alt: position.coords.altitude,
          acc: position.coords.accuracy,
          vel: position.coords.speed,
          batt: null,
          conn: 'w',
          tst: Math.floor(position.timestamp / 1000),
        }).catch(() => {
          // Best-effort sync.
        })
      },
    )
  } catch {
    // Geolocation plugin unavailable.
  }
}

export async function shareConversation(title: string, url: string) {
  try {
    const { Share } = await import('@capacitor/share')
    await Share.share({ title, url, dialogTitle: 'Share from PALACE' })
  } catch {
    navigator.clipboard?.writeText(url)
  }
}

export async function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }
    await Haptics.impact({ style: map[style] })
  } catch {
    // Haptics plugin unavailable.
  }
}
