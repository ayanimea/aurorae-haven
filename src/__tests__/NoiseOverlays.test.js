/**
 * Unit tests for NoiseOverlays.jsx DOM-singleton filter injection.
 */
import { afterEach, describe, expect, it } from 'vitest'
import {
  CELL_NOISE_FILTER_ID,
  EVENT_NOISE_FILTER_ID,
  ensureSharedNoiseFilters
} from '../components/Schedule/NoiseOverlays.jsx'

const NOISE_DEFS_ID = 'ah-shared-noise-defs'

function cleanup() {
  document.getElementById(NOISE_DEFS_ID)?.remove()
}

afterEach(cleanup)

describe('ensureSharedNoiseFilters', () => {
  it('creates a hidden SVG element in document.body', () => {
    ensureSharedNoiseFilters()
    const el = document.getElementById(NOISE_DEFS_ID)
    expect(el).not.toBeNull()
    expect(el.tagName.toLowerCase()).toBe('svg')
  })

  it('sets aria-hidden and focusable=false on the container SVG', () => {
    ensureSharedNoiseFilters()
    const el = document.getElementById(NOISE_DEFS_ID)
    expect(el.getAttribute('aria-hidden')).toBe('true')
    expect(el.getAttribute('focusable')).toBe('false')
  })

  it('injects an event-card filter with the exported ID', () => {
    ensureSharedNoiseFilters()
    const filter = document.getElementById(EVENT_NOISE_FILTER_ID)
    expect(filter).not.toBeNull()
    const turb = filter.querySelector('feTurbulence')
    expect(turb).not.toBeNull()
    expect(turb.getAttribute('baseFrequency')).toBe('0.85')
  })

  it('injects a cell noise filter with the exported ID', () => {
    ensureSharedNoiseFilters()
    const filter = document.getElementById(CELL_NOISE_FILTER_ID)
    expect(filter).not.toBeNull()
    const turb = filter.querySelector('feTurbulence')
    expect(turb).not.toBeNull()
    expect(turb.getAttribute('baseFrequency')).toBe('0.80')
  })

  it('does not create duplicate elements when called multiple times', () => {
    ensureSharedNoiseFilters()
    ensureSharedNoiseFilters()
    ensureSharedNoiseFilters()
    const all = document.querySelectorAll(`#${NOISE_DEFS_ID}`)
    expect(all.length).toBe(1)
  })

  it('exported filter IDs match the injected filter element IDs', () => {
    ensureSharedNoiseFilters()
    expect(document.getElementById(EVENT_NOISE_FILTER_ID)).not.toBeNull()
    expect(document.getElementById(CELL_NOISE_FILTER_ID)).not.toBeNull()
  })
})
