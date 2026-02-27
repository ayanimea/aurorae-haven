/**
 * Suggestion Engine
 *
 * Generates a bounded, deterministic list of available time slots for a given
 * day, honouring all structural constraints and snap alignment.
 *
 * Rules:
 *  - Slots start from `fromMinutes` (default: now), snapped UP to interval.
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
import { validateStructural } from './structuralConstraints'
import { timeToMinutes } from '../utils/timeUtils'

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
 * @param {number}   [params.fromMinutes]     - Earliest start (default: now, snapped up)
 * @param {number}   [params.rangeStartMinutes] - Visible range start (default 07:00)
 * @param {number}   [params.rangeEndMinutes]   - Visible range end (default 24:00)
 * @returns {Suggestion[]} Up to MAX_SUGGESTIONS sorted suggestions
 */
export function generateSuggestions({
  existingEvents,
  durationMinutes,
  date,
  fromMinutes,
  rangeStartMinutes = DEFAULT_RANGE_START,
  rangeEndMinutes = DEFAULT_RANGE_END
}) {
  const interval = SCHEDULING_CONFIG.snapIntervalMinutes

  // Determine earliest start: snap up from `fromMinutes` or range start
  const rawFrom =
    typeof fromMinutes === 'number' ? fromMinutes : rangeStartMinutes
  const startFrom = Math.max(rangeStartMinutes, snapUp(rawFrom))

  const suggestions = []

  // Iterate over every possible snapped start within range
  for (
    let start = startFrom;
    start + durationMinutes <= rangeEndMinutes;
    start += interval
  ) {
    // Snap the end time up to the nearest interval boundary
    const rawEnd = start + durationMinutes
    const end = rawEnd === rangeEndMinutes ? rawEnd : snapUp(rawEnd)

    // If snapping end pushed it beyond the range, skip this slot
    if (end > rangeEndMinutes) continue

    const candidate = {
      startTime: minutesToHHMM(start),
      endTime: minutesToHHMM(end)
    }

    const { valid } = validateStructural(candidate, existingEvents)
    if (!valid) continue

    // Compute projected load if this slot is added
    const projectedEvents = [...existingEvents, candidate]
    const load = computeDayLoad(projectedEvents, date)

    // Measure the free block this slot sits within
    const freeBlock = measureFreeBlock(start, end, existingEvents, rangeEndMinutes)

    suggestions.push({ startMinutes: start, endMinutes: end, load, freeBlock })

    if (suggestions.length >= MAX_SUGGESTIONS * 10) break // inner scan cap
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
 * @param {number} slotStart
 * @param {number} slotEnd
 * @param {import('./structuralConstraints').ScheduleEvent[]} existingEvents
 * @param {number} rangeEnd
 * @returns {number}
 */
function measureFreeBlock(slotStart, slotEnd, existingEvents, rangeEnd) {
  const limit = SCHEDULING_CONFIG.maxSimultaneousEvents

  // Build sweep-line boundaries from each event's effective window
  const boundaries = []
  for (const evt of existingEvents) {
    const evtStart = timeToMinutes(evt.startTime)
    const s = evtStart - (evt.preparationTime ?? 0)
    const rawEnd = timeToMinutes(evt.endTime)
    const en = evt.allDay
      ? 1440
      : rawEnd <= evtStart
        ? rawEnd + 1440 + (evt.travelTime ?? 0)
        : rawEnd + (evt.travelTime ?? 0)
    boundaries.push({ time: s, delta: 1 })
    boundaries.push({ time: en, delta: -1 })
  }
  // Sort: ascending time; endings before starts at the same time
  boundaries.sort((a, b) => (a.time !== b.time ? a.time - b.time : a.delta - b.delta))

  // Collect all relevant time points (including range boundaries)
  const timePoints = [
    ...new Set([0, slotStart, slotEnd, rangeEnd, ...boundaries.map((b) => b.time)])
  ].sort((a, b) => a - b)

  // Sweep to find the capacity-available segment containing slotStart
  let concurrency = 0
  let bIdx = 0
  let segStart = null
  let blockStart = 0
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
        blockStart = segStart
        blockEnd = t
        break
      }
      segStart = null
    }

    // Last point: close any still-open segment
    if (i === timePoints.length - 1 && segStart !== null && slotStart >= segStart) {
      blockStart = segStart
      blockEnd = t
    }
  }

  return Math.max(0, blockEnd - blockStart)
}
