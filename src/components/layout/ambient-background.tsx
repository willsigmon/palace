'use client'

/**
 * Ambient background — removed.
 * The grain SVG filter and vignette box-shadow created compositing layers
 * that blocked backdrop-filter (liquid glass) in WKWebView and caused
 * rendering conflicts with native iOS overlays.
 *
 * Background color is now handled by body { background: var(--color-void) }
 */
export function AmbientBackground() {
  return null
}
