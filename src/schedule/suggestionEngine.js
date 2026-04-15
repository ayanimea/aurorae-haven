/**
 * Suggestion Engine
 *
 * Generates a bounded, deterministic list of available time slots for a given
 * day, honouring all structural constraints and snap alignment.
 *
 * Rules:
 *  - Slots start from current local time (snapped UP to interval) unless `fromMinutes` is provided.
 *  - Slots stay within the visible schedule range [rangeStart, rangeEnd).
 *  - Each candidate slot is checked for simultaneous-event violations.
 *  - Prep + travel time of existing events are included in overlap checks.
 *  - Results are sorted by: (1) lowest projected load, (2) longest free block,
 *    (3) earliest start. No randomness.
 *  - A hard cap on returned suggestions prevents unbounded computation.
 */

import { SCHEDULING_CONFIG } from './config'
import { snapUp } from './timeUtils'
import { computeDayLoad } from './loadComputation'
import { validateStructural, getEffectiveWindow } from './structuralConstraints'

/** Maximum number of suggestions returned (performance guard) */
const MAX_SUGGESTIONS = 5

/** Default visible range (minutes from midnight) */
const DEFAULT_RANGE_START = 7 * 60 // 07:00
const DEFAULT_RANGE_END = 24 * 60 // 24:00

/**
 * @typedef {Object} Suggestion
 * @property {number} startMinutes - Slot start in minutes from midnight
 * @property {number} endMinutes   - Slot end in minutes from midnight
 * @property {number} load         - Projected day load if this slot is taken
 * @property {number} freeBlock    - Length of the free block this slot falls in
 */

/**
 * Generate deterministic slot suggestions for a given day.
 *
 * @param {object}   params
 * @param {import('./structuralConstraints').ScheduleEvent[]} params.existingEvents
 *   Events already scheduled for the day.
 * @param {number}   params.durationMinutes   - Required duration for the new event
 * @param {Date}     params.date              - Calendar day (for load computation)
 * @param {number}   [params.preparationTime] - Prep buffer (minutes) for the candidate event
 * @param {number}   [params.travelTime]      - Travel buffer (minutes) for the candidate event
 * @param {number}   [params.fromMinutes]     - Earliest start (default: current local time, snapped up)
 * @param {number}   [params.rangeStartMinutes] - Visible range start (default 07:00)
 * @param {number}   [params.rangeEndMinutes]   - Visible range end (default 24:00)
 * @param {number}   [params.nowMinutes]        - Override for "current time" in tests (minutes from midnight)
 * @returns {Suggestion[]} Up to MAX_SUGGESTIONS sorted suggestions
 */
export function generateSuggestions({
  existingEvents,
  durationMinutes,
  date,
  preparationTime,
  travelTime,
  fromMinutes,
  rangeStartMinutes = DEFAULT_RANGE_START,
  rangeEndMinutes = DEFAULT_RANGE_END,
  nowMinutes
}) {
  const interval = SCHEDULING_CONFIG.snapIntervalMinutes

  // Determine earliest start: snap up from `fromMinutes` (default: current local time)
  const computedNow = nowMinutes ?? (() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })()
  const rawFrom = typeof fromMinutes === 'number' ? fromMinutes : computedNow
  const startFrom = Math.max(rangeStartMinutes, snapUp(rawFrom))

  const suggestions = []

  // Iterate over every possible snapped start within range
  let start = startFrom
  while (start + durationMinutes <= rangeEndMinutes) {
    // Snap the end time up to the nearest interval boundary
    const rawEnd = start + durationMinutes
    const end = rawEnd === rangeEndMinutes ? rawEnd : snapUp(rawEnd)

    // If snapping end pushed it beyond the range, skip this slot
    if (end <= rangeEndMinutes) {
      const candidate = {
        startTime: minutesToHHMM(start),
        endTime: minutesToHHMM(end),
        ...(typeof preparationTime === 'number' && { preparationTime }),
        ...(typeof travelTime === 'number' && { travelTime })
      }

      const { valid } = validateStructural(candidate, existingEvents)
      if (valid) {
        // Compute projected load if this slot is added
        const projectedEvents = [...existingEvents, candidate]
        const load = computeDayLoad(projectedEvents, date)

        // Measure the free block this slot sits within
        const freeBlock = measureFreeBlock(start, end, existingEvents, rangeStartMinutes, rangeEndMinutes)

        suggestions.push({ startMinutes: start, endMinutes: end, load, freeBlock })
      }
    }

    start += interval
  }

  // Sort: lowest load → longest free block → earliest start
  suggestions.sort((a, b) => {
    if (a.load !== b.load) return a.load - b.load
    if (b.freeBlock !== a.freeBlock) return b.freeBlock - a.freeBlock
    return a.startMinutes - b.startMinutes
  })

  return suggestions.slice(0, MAX_SUGGESTIONS)
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Convert minutes-from-midnight to "HH:MM".
 * Handles 1440 (end-of-day) as "24:00" instead of wrapping to "00:00".
 * @param {number} minutes
 * @returns {string}
 */
function minutesToHHMM(minutes) {
  // Preserve end-of-day marker without wrapping
  if (minutes === 24 * 60) return '24:00'
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Measure the length (minutes) of the capacity-available block that contains
 * [slotStart, slotEnd).  A "free block" is a contiguous interval where the
 * number of concurrent existing events stays below the configured maximum —
 * i.e. there is room for at least one more event.
 * Prep + travel of existing events are included in their effective windows.
 *
 * The result is clamped to [rangeStart, rangeEnd] so that only the visible
 * schedule range is counted, preventing inflated values when rangeStart > 0.
 *
 * @param {number} slotStart
 * @param {number} slotEnd
 * @param {import('./structuralConstraints').ScheduleEvent[]} existingEvents
 * @param {number} rangeStart
 * @param {number} rangeEnd
 * @returns {number}
 */
function measureFreeBlock(slotStart, slotEnd, existingEvents, rangeStart, rangeEnd) {
  // Use getEffectiveWindow so that events with missing startTime/endTime are
  // treated as all-day (consistent with validateStructural and getEffectiveWindow).
  const hasAllDayEvent = existingEvents.some((evt) => getEffectiveWindow(evt).isAllDay)
  const limit = hasAllDayEvent
    ? SCHEDULING_CONFIG.maxSimultaneousWithAllDay
    : SCHEDULING_CONFIG.maxSimultaneousEvents

  // Build sweep-line boundaries from each event's effective window
  const boundaries = []
  for (const evt of existingEvents) {
    const w = getEffectiveWindow(evt)
    boundaries.push({ time: w.start, delta: 1 })
    boundaries.push({ time: w.end, delta: -1 })
  }
  // Sort: ascending time; endings before starts at the same time
  boundaries.sort((a, b) => (a.time !== b.time ? a.time - b.time : a.delta - b.delta))

  // Collect all relevant time points (clamped to visible range)
  const timePoints = [
    ...new Set([rangeStart, slotStart, slotEnd, rangeEnd, ...boundaries.map((b) => b.time)])
  ].sort((a, b) => a - b)

  // Sweep to find the capacity-available segment containing slotStart
  let concurrency = 0
  let bIdx = 0
  let segStart = null
  let blockStart = rangeStart
  let blockEnd = rangeEnd

  for (let i = 0; i < timePoints.length; i++) {
    const t = timePoints[i]

    // Apply all boundary events at this time point
    while (bIdx < boundaries.length && boundaries[bIdx].time <= t) {
      concurrency += boundaries[bIdx].delta
      bIdx++
    }

    const hasCap = concurrency < limit

    if (hasCap && segStart === null) {
      segStart = t
    } else if (!hasCap && segStart !== null) {
      // This segment ends here — check if slotStart is inside it
      if (slotStart >= segStart && slotStart < t) {
        blockStart = Math.max(segStart, rangeStart)
        blockEnd = Math.min(t, rangeEnd)
        break
      }
      segStart = null
    }

    // Last point: close any still-open segment
    if (i === timePoints.length - 1 && segStart !== null && slotStart >= segStart) {
      blockStart = Math.max(segStart, rangeStart)
      blockEnd = Math.min(t, rangeEnd)
    }
  }

  return Math.max(0, blockEnd - blockStart)
}
