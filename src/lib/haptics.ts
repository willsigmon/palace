/**
 * Haptic feedback for native iOS/Android via Capacitor.
 * Falls back to no-op on web browsers.
 */

let hapticsModule: typeof import('@capacitor/haptics') | null = null
let loadAttempted = false

async function getHaptics() {
  if (loadAttempted) return hapticsModule
  loadAttempted = true
  try {
    hapticsModule = await import('@capacitor/haptics')
    return hapticsModule
  } catch {
    return null
  }
}

export async function hapticImpact(style: 'heavy' | 'medium' | 'light' = 'medium') {
  const mod = await getHaptics()
  if (!mod) return
  const styleMap = { heavy: mod.ImpactStyle.Heavy, medium: mod.ImpactStyle.Medium, light: mod.ImpactStyle.Light }
  mod.Haptics.impact({ style: styleMap[style] }).catch(() => {})
}

export async function hapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
  const mod = await getHaptics()
  if (!mod) return
  const typeMap = { success: mod.NotificationType.Success, warning: mod.NotificationType.Warning, error: mod.NotificationType.Error }
  mod.Haptics.notification({ type: typeMap[type] }).catch(() => {})
}

export async function hapticSelection() {
  const mod = await getHaptics()
  if (!mod) return
  mod.Haptics.selectionChanged().catch(() => {})
}
