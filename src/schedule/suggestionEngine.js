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
    const end = start + durationMinutes

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
 * @param {number} minutes
 * @returns {string}
 */
function minutesToHHMM(minutes) {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Measure the length (minutes) of the free block that contains [slotStart, slotEnd).
 * A "free block" is a contiguous interval not occupied by any existing event's
 * effective window (prep + travel included).
 *
 * @param {number} slotStart
 * @param {number} slotEnd
 * @param {import('./structuralConstraints').ScheduleEvent[]} existingEvents
 * @param {number} rangeEnd
 * @returns {number}
 */
function measureFreeBlock(slotStart, slotEnd, existingEvents, rangeEnd) {
  // Collect occupied windows sorted by start
  const occupied = existingEvents
    .map((e) => {
      const s = timeToMinutesLocal(e.startTime) - (e.preparationTime ?? 0)
      const en = timeToMinutesLocal(e.endTime) + (e.travelTime ?? 0)
      return { start: s, end: en }
    })
    .sort((a, b) => a.start - b.start)

  // Find the free block containing slotStart
  let blockStart = 0
  let blockEnd = rangeEnd

  for (const w of occupied) {
    if (w.end <= slotStart) {
      // This window ends before our slot — advance block start
      blockStart = Math.max(blockStart, w.end)
    } else if (w.start >= slotEnd) {
      // This window starts after our slot — it caps the block end
      blockEnd = Math.min(blockEnd, w.start)
      break
    }
    // Overlapping windows are already filtered out by validateStructural
  }

  return Math.max(0, blockEnd - blockStart)
}

/**
 * Simple local helper — avoids importing the full timeUtils module.
 * @param {string} hhmm
 * @returns {number}
 */
function timeToMinutesLocal(hhmm) {
  if (!hhmm) return 0
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
