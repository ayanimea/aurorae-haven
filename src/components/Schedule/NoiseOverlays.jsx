/**
 * Noise SVG overlays used on event cards and grid cells.
 * Uses useId() so multiple instances on the same page get unique filter IDs.
 */
import { useId } from 'react'

/** Subtle noise texture overlay for event cards (12% opacity, overlay blend). */
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
        opacity: 0.12,
        mixBlendMode: 'overlay',
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

/** Subtle noise texture overlay for grid cells (8% opacity, overlay blend). */
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
        opacity: 0.08,
        mixBlendMode: 'overlay'
      }}
      aria-hidden='true'
    >
      <filter id={filterId}>
        <feTurbulence
          type='fractalNoise'
          baseFrequency='0.65'
          numOctaves='3'
          stitchTiles='stitch'
        />
      </filter>
      <rect width='100%' height='100%' filter={`url(#${filterId})`} />
    </svg>
  )
}
