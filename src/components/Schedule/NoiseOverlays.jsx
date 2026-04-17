/**
 * Noise SVG overlays used on event cards and grid cells.
 * Uses useId() so multiple instances on the same page get unique filter IDs.
 */
import { useId } from 'react'

/** Paper-grain noise texture overlay for event cards (soft-light, 22% opacity). */
export function NoiseOverlay() {
  const uid = useId()
  const filterId = `figmaEventNoise-${uid.replace(/:/g, '')}`
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
      <filter id={filterId}>
        <feTurbulence
          type='fractalNoise'
          baseFrequency='0.85'
          numOctaves='4'
          stitchTiles='stitch'
        />
      </filter>
      <rect width='100%' height='100%' filter={`url(#${filterId})`} />
    </svg>
  )
}

/** Paper-grain noise texture overlay for grid cells (soft-light, 18% opacity). */
export function CellNoise() {
  const uid = useId()
  const filterId = `figmaCellNoise-${uid.replace(/:/g, '')}`
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
      <filter id={filterId}>
        <feTurbulence
          type='fractalNoise'
          baseFrequency='0.80'
          numOctaves='4'
          stitchTiles='stitch'
        />
      </filter>
      <rect width='100%' height='100%' filter={`url(#${filterId})`} />
    </svg>
  )
}
