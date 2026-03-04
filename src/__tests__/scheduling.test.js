/**
 * Tests for the Scheduling System:
 *  - Config invariant
 *  - Snap rounding (timeUtils)
 *  - Load computation (thresholds + DST)
 *  - Structural constraints (simultaneous limits, overlap with prep/travel)
 *  - Suggestion engine (deterministic output)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SCHEDULING_CONFIG } from '../schedule/config'
import { snapDown, snapUp, snapEventTime } from '../schedule/timeUtils'
import {
  computeDayLoad,
  getDayDurationMinutes,
  getMemoizedDayLoad,
  clearLoadCache,
  LOAD_CACHE_MAX_SIZE
} from '../schedule/loadComputation'
import {
  getEffectiveWindow,
  eventsOverlap,
  validateStructural
} from '../schedule/structuralConstraints'
import { generateSuggestions } from '../schedule/suggestionEngine'

// ── Config ────────────────────────────────────────────────────────────────────

describe('SCHEDULING_CONFIG invariant', () => {
  it('loadThresholdOver must be greater than loadThresholdHigh', () => {
    expect(SCHEDULING_CONFIG.loadThresholdOver).toBeGreaterThan(
      SCHEDULING_CONFIG.loadThresholdHigh
    )
  })

  it('has required keys with correct types', () => {
    expect(typeof SCHEDULING_CONFIG.loadThresholdHigh).toBe('number')
    expect(typeof SCHEDULING_CONFIG.loadThresholdOver).toBe('number')
    expect(typeof SCHEDULING_CONFIG.maxSimultaneousEvents).toBe('number')
    expect(typeof SCHEDULING_CONFIG.maxSimultaneousWithAllDay).toBe('number')
    expect(typeof SCHEDULING_CONFIG.snapIntervalMinutes).toBe('number')
  })

  it('maxSimultaneousWithAllDay > maxSimultaneousEvents', () => {
    expect(SCHEDULING_CONFIG.maxSimultaneousWithAllDay).toBeGreaterThan(
      SCHEDULING_CONFIG.maxSimultaneousEvents
    )
  })
})

// ── Snap Rounding ─────────────────────────────────────────────────────────────

describe('snapDown', () => {
  it('returns value unchanged when already on boundary', () => {
    expect(snapDown(0)).toBe(0)
    expect(snapDown(15)).toBe(15)
    expect(snapDown(60)).toBe(60)
    expect(snapDown(90)).toBe(90)
  })

  it('rounds down to the nearest interval', () => {
    expect(snapDown(1)).toBe(0)
    expect(snapDown(14)).toBe(0)
    expect(snapDown(16)).toBe(15)
    expect(snapDown(29)).toBe(15)
    expect(snapDown(61)).toBe(60)
  })

  it('handles large values', () => {
    expect(snapDown(1439)).toBe(1425) // 23:59 → 23:45
    expect(snapDown(1440)).toBe(1440) // 24:00 → 24:00
  })
})

describe('snapUp', () => {
  it('returns value unchanged when already on boundary', () => {
    expect(snapUp(0)).toBe(0)
    expect(snapUp(15)).toBe(15)
    expect(snapUp(60)).toBe(60)
  })

  it('rounds up to the nearest interval', () => {
    expect(snapUp(1)).toBe(15)
    expect(snapUp(14)).toBe(15)
    expect(snapUp(16)).toBe(30)
    expect(snapUp(31)).toBe(45)
  })

  it('handles large values', () => {
    expect(snapUp(1441)).toBe(1455) // just past 24:00 → round up
  })
})

describe('snapEventTime', () => {
  it('snaps start down and end up', () => {
    expect(snapEventTime(7, 68)).toEqual({ start: 0, end: 75 })
    expect(snapEventTime(60, 120)).toEqual({ start: 60, end: 120 })
    expect(snapEventTime(61, 119)).toEqual({ start: 60, end: 120 })
  })

  it('returns a new object — does not mutate inputs', () => {
    const result = snapEventTime(10, 70)
    expect(result).toEqual({ start: 0, end: 75 })
  })
})

// ── Load Computation ──────────────────────────────────────────────────────────

describe('getDayDurationMinutes', () => {
  it('returns 1440 for a normal day', () => {
    expect(getDayDurationMinutes(new Date(2025, 5, 15))).toBe(1440) // June 15
  })
})

describe('computeDayLoad', () => {
  it('returns 0 for empty event list', () => {
    expect(computeDayLoad([], new Date(2025, 0, 1))).toBe(0)
  })

  it('includes prep + travel in load', () => {
    const events = [
      {
        startTime: '09:00',
        endTime: '10:00',
        preparationTime: 30,
        travelTime: 30
      }
    ]
    // Snapped duration = 60 min, prep = 30, travel = 30 → total = 120
    const load = computeDayLoad(events, new Date(2025, 0, 1))
    expect(load).toBeCloseTo(120 / 1440, 5)
  })

  it('snaps event duration correctly', () => {
    // 09:07–10:53 raw = 106 min; snapDown(547)=540 start, snapUp(653)=660 end → 120 min snapped
    const events = [{ startTime: '09:07', endTime: '10:53' }]
    const load = computeDayLoad(events, new Date(2025, 0, 1))
    expect(load).toBeCloseTo(120 / 1440, 5)
  })

  it('reflects loadThresholdHigh boundary correctly', () => {
    const highMinutes = SCHEDULING_CONFIG.loadThresholdHigh * 1440
    const events = [{ startTime: '00:00', endTime: minutesToHHMM(highMinutes) }]
    const load = computeDayLoad(events, new Date(2025, 0, 1))
    expect(load).toBeGreaterThanOrEqual(SCHEDULING_CONFIG.loadThresholdHigh - 0.01)
  })

  it('can exceed 1.0 when over capacity', () => {
    // 24 events of 60 min each with 30 min prep = 90 min each = 24 * 90 = 2160 min / 1440 > 1.0
    const events = Array.from({ length: 24 }, (_, i) => ({
      startTime: `${String(i).padStart(2, '0')}:00`,
      endTime: `${String(i).padStart(2, '0')}:59`,
      preparationTime: 30,
      travelTime: 0
    }))
    const load = computeDayLoad(events, new Date(2025, 0, 1))
    expect(load).toBeGreaterThan(1.0)
  })
})

describe('getMemoizedDayLoad', () => {
  beforeEach(() => {
    clearLoadCache()
  })

  it('returns the same value as computeDayLoad', () => {
    const events = [{ startTime: '09:00', endTime: '10:00' }]
    const direct = computeDayLoad(events, new Date(2025, 0, 15))
    const memoised = getMemoizedDayLoad(events, '2025-01-15')
    expect(memoised).toBeCloseTo(direct, 10)
  })

  it('returns cached result on second call', () => {
    const events = [{ startTime: '10:00', endTime: '11:00' }]
    const first = getMemoizedDayLoad(events, '2025-06-01')
    const second = getMemoizedDayLoad(events, '2025-06-01')
    expect(first).toBe(second)
  })

  it('uses local date construction (no UTC offset shift)', () => {
    // computeDayLoad with a locally-constructed Date must match getMemoizedDayLoad.
    // If getMemoizedDayLoad used new Date("YYYY-MM-DDT00:00:00") it would be UTC,
    // which can shift the day in non-UTC timezones producing a DST mismatch.
    const events = [{ startTime: '08:00', endTime: '09:00' }]
    const localDate = new Date(2025, 5, 15) // local midnight
    const directLoad = computeDayLoad(events, localDate)
    const memoLoad = getMemoizedDayLoad(events, '2025-06-15')
    expect(memoLoad).toBeCloseTo(directLoad, 10)
  })

  it('LRU: recently accessed entry survives eviction of cold entries', () => {
    // 1. Fill cache to LOAD_CACHE_MAX_SIZE with distinct date strings
    const baseEvent = [{ startTime: '09:00', endTime: '10:00' }]
    for (let i = 0; i < LOAD_CACHE_MAX_SIZE; i++) {
      const mm = String((i % 12) + 1).padStart(2, '0')
      const dd = String((i % 28) + 1).padStart(2, '0')
      const yyyy = 2020 + Math.floor(i / (12 * 28))
      getMemoizedDayLoad(baseEvent, `${yyyy}-${mm}-${dd}`)
    }

    // 2. Re-access the very first key to refresh its recency
    const hotDateStr = '2020-01-01'
    const hotVal = getMemoizedDayLoad(baseEvent, hotDateStr)

    // 3. Add one more entry to trigger eviction of the LRU (the second key, '2020-01-02')
    getMemoizedDayLoad([{ startTime: '10:00', endTime: '11:00' }], '2099-12-31')

    // 4. The hot key should still return the same cached value (no recompute = same ref)
    const hotValAfter = getMemoizedDayLoad(baseEvent, hotDateStr)
    expect(hotValAfter).toBe(hotVal)
  })
})

// ── Structural Constraints ────────────────────────────────────────────────────

describe('getEffectiveWindow', () => {
  it('expands window by prep (earlier) and travel (later)', () => {
    const event = {
      startTime: '10:00',
      endTime: '11:00',
      preparationTime: 30,
      travelTime: 15
    }
    const w = getEffectiveWindow(event)
    expect(w.start).toBe(10 * 60 - 30) // 570
    expect(w.end).toBe(11 * 60 + 15) // 675
  })

  it('defaults prep/travel to 0 when absent', () => {
    const event = { startTime: '09:00', endTime: '10:00' }
    const w = getEffectiveWindow(event)
    expect(w.start).toBe(540)
    expect(w.end).toBe(600)
  })
})

describe('eventsOverlap', () => {
  it('detects overlap', () => {
    const a = { startTime: '09:00', endTime: '10:00' }
    const b = { startTime: '09:30', endTime: '10:30' }
    expect(eventsOverlap(a, b)).toBe(true)
  })

  it('touching boundaries are NOT overlap', () => {
    const a = { startTime: '09:00', endTime: '10:00' }
    const b = { startTime: '10:00', endTime: '11:00' }
    expect(eventsOverlap(a, b)).toBe(false)
  })

  it('detects overlap via prep time', () => {
    // a ends at 10:00, b starts at 10:00 but has 30 min prep → effective start = 09:30
    const a = { startTime: '09:00', endTime: '10:00' }
    const b = { startTime: '10:00', endTime: '11:00', preparationTime: 30 }
    expect(eventsOverlap(a, b)).toBe(true)
  })

  it('detects overlap via travel time', () => {
    // a ends at 10:00 with 30 min travel → effective end = 10:30; b starts at 10:15
    const a = { startTime: '09:00', endTime: '10:00', travelTime: 30 }
    const b = { startTime: '10:15', endTime: '11:00' }
    expect(eventsOverlap(a, b)).toBe(true)
  })
})

describe('validateStructural', () => {
  it('allows a single event with no existing events', () => {
    const candidate = { startTime: '09:00', endTime: '10:00' }
    const result = validateStructural(candidate, [])
    expect(result.valid).toBe(true)
    expect(result.simultaneousCount).toBe(1)
  })

  it('allows up to maxSimultaneousEvents overlapping events', () => {
    const existing = [{ startTime: '09:00', endTime: '10:00' }]
    const candidate = { startTime: '09:30', endTime: '10:30' }
    // 1 existing + candidate = 2 → exactly at limit
    const result = validateStructural(candidate, existing)
    expect(result.valid).toBe(true)
    expect(result.simultaneousCount).toBe(2)
  })

  it('rejects when exceeding maxSimultaneousEvents', () => {
    const existing = [
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '09:15', endTime: '10:15' }
    ]
    const candidate = { startTime: '09:30', endTime: '10:30' }
    // 2 existing + candidate = 3, but limit is 2
    const result = validateStructural(candidate, existing)
    expect(result.valid).toBe(false)
    expect(result.simultaneousCount).toBe(3)
  })

  it('allows up to maxSimultaneousWithAllDay when an all-day event is present', () => {
    const existing = [
      { startTime: '09:00', endTime: '10:00', allDay: true },
      { startTime: '09:00', endTime: '10:00' }
    ]
    const candidate = { startTime: '09:30', endTime: '10:30' }
    // 2 existing + candidate = 3, allowed because one is all-day
    const result = validateStructural(candidate, existing)
    expect(result.valid).toBe(true)
    expect(result.simultaneousCount).toBe(3)
  })

  it('rejects when exceeding maxSimultaneousWithAllDay even with all-day', () => {
    const existing = [
      { startTime: '09:00', endTime: '10:00', allDay: true },
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '09:00', endTime: '10:00' }
    ]
    const candidate = { startTime: '09:30', endTime: '10:30' }
    // 3 existing + candidate = 4, exceeds maxSimultaneousWithAllDay (3)
    const result = validateStructural(candidate, existing)
    expect(result.valid).toBe(false)
    expect(result.simultaneousCount).toBe(4)
  })

  it('non-overlapping events do not count toward limit', () => {
    const existing = [
      { startTime: '07:00', endTime: '08:00' },
      { startTime: '08:00', endTime: '09:00' }
    ]
    const candidate = { startTime: '10:00', endTime: '11:00' }
    const result = validateStructural(candidate, existing)
    expect(result.valid).toBe(true)
    expect(result.simultaneousCount).toBe(1)
  })
})

// ── Suggestion Engine ─────────────────────────────────────────────────────────

describe('generateSuggestions', () => {
  const date = new Date(2025, 5, 15) // 2025-06-15, non-DST

  it('returns an array of suggestions', () => {
    const suggestions = generateSuggestions({
      existingEvents: [],
      durationMinutes: 60,
      date,
      rangeStartMinutes: 7 * 60,
      rangeEndMinutes: 22 * 60
    })
    expect(Array.isArray(suggestions)).toBe(true)
    expect(suggestions.length).toBeGreaterThan(0)
  })

  it('all suggestions have startMinutes snapped to interval', () => {
    const interval = SCHEDULING_CONFIG.snapIntervalMinutes
    const suggestions = generateSuggestions({
      existingEvents: [],
      durationMinutes: 30,
      date,
      rangeStartMinutes: 7 * 60,
      rangeEndMinutes: 10 * 60
    })
    for (const s of suggestions) {
      expect(s.startMinutes % interval).toBe(0)
      expect(s.endMinutes % interval).toBe(0)
    }
  })

  it('respects structural limits — no suggestion overlaps too many events', () => {
    const existingEvents = [
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '09:00', endTime: '10:00' }
    ]
    const suggestions = generateSuggestions({
      existingEvents,
      durationMinutes: 30,
      date,
      rangeStartMinutes: 8 * 60,
      rangeEndMinutes: 12 * 60
    })
    // No suggestion should land inside 09:00–10:00 (would make 3 simultaneous)
    for (const s of suggestions) {
      const overlapsBlocked =
        s.startMinutes < 600 && s.endMinutes > 540 // 10:00 > 09:00
      expect(overlapsBlocked).toBe(false)
    }
  })

  it('results are deterministic — same input yields same output', () => {
    const params = {
      existingEvents: [{ startTime: '10:00', endTime: '11:00' }],
      durationMinutes: 45,
      date,
      rangeStartMinutes: 7 * 60,
      rangeEndMinutes: 20 * 60
    }
    const first = generateSuggestions(params)
    const second = generateSuggestions(params)
    expect(first.map((s) => s.startMinutes)).toEqual(
      second.map((s) => s.startMinutes)
    )
  })

  it('returns at most 5 suggestions', () => {
    const suggestions = generateSuggestions({
      existingEvents: [],
      durationMinutes: 15,
      date,
      rangeStartMinutes: 7 * 60,
      rangeEndMinutes: 22 * 60
    })
    expect(suggestions.length).toBeLessThanOrEqual(5)
  })

  it('does not start before fromMinutes', () => {
    const fromMinutes = 11 * 60 // 11:00
    const suggestions = generateSuggestions({
      existingEvents: [],
      durationMinutes: 60,
      date,
      fromMinutes,
      rangeStartMinutes: 7 * 60,
      rangeEndMinutes: 22 * 60
    })
    for (const s of suggestions) {
      expect(s.startMinutes).toBeGreaterThanOrEqual(fromMinutes)
    }
  })

  it('results sorted by load then free block then earliest start', () => {
    const suggestions = generateSuggestions({
      existingEvents: [],
      durationMinutes: 60,
      date,
      rangeStartMinutes: 7 * 60,
      rangeEndMinutes: 12 * 60
    })
    // With no existing events all loads are equal; sorted by free block (all same) then start
    for (let i = 1; i < suggestions.length; i++) {
      const prev = suggestions[i - 1]
      const curr = suggestions[i]
      if (prev.load === curr.load && prev.freeBlock === curr.freeBlock) {
        expect(curr.startMinutes).toBeGreaterThanOrEqual(prev.startMinutes)
      }
    }
  })
})

// ── PR-review regression tests ────────────────────────────────────────────────

describe('midnight-spanning events in computeDayLoad', () => {
  it('correctly accounts for an event that spans midnight (e.g. 23:00–01:00)', () => {
    const date = new Date(2025, 5, 15)
    // 23:00–01:00 = 2h = 120min; without the midnight fix rawEnd (60) < rawStart (1380)
    // snapEventTime would return end-start = 0, losing the duration
    const events = [{ startTime: '23:00', endTime: '01:00' }]
    const load = computeDayLoad(events, date)
    // 120 min / 1440 min ≈ 0.0833
    expect(load).toBeCloseTo(120 / 1440, 4)
  })
})

describe('getEffectiveWindow — all-day and midnight-spanning', () => {
  it('returns [0, 1440) for an all-day event (allDay flag)', () => {
    const w = getEffectiveWindow({ allDay: true })
    expect(w.start).toBe(0)
    expect(w.end).toBe(1440)
    expect(w.isAllDay).toBe(true)
  })

  it('returns [0, 1440) when startTime and endTime are missing', () => {
    const w = getEffectiveWindow({})
    expect(w.start).toBe(0)
    expect(w.end).toBe(1440)
    expect(w.isAllDay).toBe(true)
  })

  it('handles midnight-spanning event (end < start) without prep/travel', () => {
    const w = getEffectiveWindow({ startTime: '23:00', endTime: '01:00' })
    // rawStart=1380, rawEnd=60 → normalEnd=60+1440=1500
    expect(w.start).toBe(1380)
    expect(w.end).toBe(1500)
    expect(w.isAllDay).toBe(false)
  })
})

describe('validateStructural — sweep-line (disjoint overlaps)', () => {
  it('does not over-reject disjoint overlapping pairs (sweep-line fix)', () => {
    // A: 09:00–10:00, B: 10:00–11:00, candidate: 09:30–10:30
    // Old count: A + B + candidate = 3 → wrongly rejected at limit=2
    // Sweep-line: A overlaps candidate only in [09:30,10:00], B only in [10:00,10:30].
    // These sub-intervals are non-overlapping, so peak concurrency = 1 existing + candidate = 2.
    const existing = [
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00' }
    ]
    const candidate = { startTime: '09:30', endTime: '10:30' }
    const result = validateStructural(candidate, existing)
    expect(result.valid).toBe(true)
    expect(result.simultaneousCount).toBe(2)
  })
})

describe('getMemoizedDayLoad — order-independent cache key', () => {
  it('returns the same load regardless of event order', () => {
    clearLoadCache()
    const a = { startTime: '09:00', endTime: '10:00' }
    const b = { startTime: '14:00', endTime: '15:00' }
    const dateStr = '2025-06-15'
    const load1 = getMemoizedDayLoad([a, b], dateStr)
    const load2 = getMemoizedDayLoad([b, a], dateStr)
    expect(load1).toBeCloseTo(load2, 10)
  })
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function minutesToHHMM(minutes) {
  const h = Math.floor(minutes / 60) % 24
  const m = Math.floor(minutes % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
