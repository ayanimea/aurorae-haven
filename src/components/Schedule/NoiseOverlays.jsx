/**
 * Noise SVG overlays used on event cards and grid cells.
 * Shared SVG filter definitions are mounted once into the DOM body and reused
 * by all overlay instances, avoiding one feTurbulence filter per event card.
 *
 * The shared defs element is intentionally never removed: the filters are a
 * static, zero-cost resource and keeping them alive across SPA navigation
 * avoids the cost of re-injecting them each time the schedule view mounts.
 * This is the same pattern used for SVG icon sprites.
 */
import { useEffect } from 'react'

/* ── Stable, page-global filter IDs ─────────────────────────── */
const NOISE_DEFS_ID = 'ah-shared-noise-defs'
export const EVENT_NOISE_FILTER_ID = 'ah-event-noise-filter'
export const CELL_NOISE_FILTER_ID = 'ah-cell-noise-filter'

/**
 * Injects a hidden SVG element containing both noise filter defs into
 * `document.body` exactly once.  Safe to call multiple times.
 */
export function ensureSharedNoiseFilters() {
  if (typeof document === 'undefined') return
  if (document.getElementById(NOISE_DEFS_ID)) return

  const svgNS = 'http://www.w3.org/2000/svg'

  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('id', NOISE_DEFS_ID)
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  Object.assign(svg.style, {
    position: 'absolute',
    width: '0',
    height: '0',
    pointerEvents: 'none',
    overflow: 'hidden'
  })

  const defs = document.createElementNS(svgNS, 'defs')

  // Event-card noise (opacity 22%, baseFrequency 0.85)
  const eventFilter = document.createElementNS(svgNS, 'filter')
  eventFilter.setAttribute('id', EVENT_NOISE_FILTER_ID)
  const eventTurb = document.createElementNS(svgNS, 'feTurbulence')
  eventTurb.setAttribute('type', 'fractalNoise')
  eventTurb.setAttribute('baseFrequency', '0.85')
  eventTurb.setAttribute('numOctaves', '4')
  eventTurb.setAttribute('stitchTiles', 'stitch')
  eventFilter.appendChild(eventTurb)
  defs.appendChild(eventFilter)

  // Grid-cell noise (opacity 18%, baseFrequency 0.80)
  const cellFilter = document.createElementNS(svgNS, 'filter')
  cellFilter.setAttribute('id', CELL_NOISE_FILTER_ID)
  const cellTurb = document.createElementNS(svgNS, 'feTurbulence')
  cellTurb.setAttribute('type', 'fractalNoise')
  cellTurb.setAttribute('baseFrequency', '0.80')
  cellTurb.setAttribute('numOctaves', '4')
  cellTurb.setAttribute('stitchTiles', 'stitch')
  cellFilter.appendChild(cellTurb)
  defs.appendChild(cellFilter)

  svg.appendChild(defs)
  document.body.appendChild(svg)
}

/** Paper-grain noise texture overlay for event cards (soft-light, 22% opacity). */
export function NoiseOverlay() {
  useEffect(() => {
    ensureSharedNoiseFilters()
  }, [])
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.22,
        mixBlendMode: 'soft-light',
        borderRadius: 'inherit'
      }}
      aria-hidden='true'
    >
      <rect
        width='100%'
        height='100%'
        filter={`url(#${EVENT_NOISE_FILTER_ID})`}
      />
    </svg>
  )
}

/** Paper-grain noise texture overlay for grid cells (soft-light, 18% opacity). */
export function CellNoise() {
  useEffect(() => {
    ensureSharedNoiseFilters()
  }, [])
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.18,
        mixBlendMode: 'soft-light'
      }}
      aria-hidden='true'
    >
      <rect
        width='100%'
        height='100%'
        filter={`url(#${CELL_NOISE_FILTER_ID})`}
      />
    </svg>
  )
}
