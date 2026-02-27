/**
 * Load Computation
 *
 * Computes the scheduling load for a given day as a ratio of used minutes
 * to total day minutes.
 *
 * Rules:
 *  - Snapped event duration (start snapped down, end snapped up) is used.
 *  - Prep time and travel time are included in used minutes.
 *  - Day duration is computed dynamically from date boundaries (DST-safe).
 *  - `computeDayLoad` is a pure function; side-effects live only in
 *    the memoisation wrapper `getMemoizedDayLoad`.
 *  - The memoised cache must NOT be used during scroll or hover events.
 */

import { timeToMinutes } from '../utils/timeUtils'
import { snapEventTime } from './timeUtils'

/**
 * Compute the total number of minutes in a calendar day (DST-safe).
 * On DST transition days this returns 23×60 or 25×60 instead of 24×60.
 *
 * @param {Date} date - Any Date within the target day (local timezone)
 * @returns {number} Minutes in the day
 */
export function getDayDurationMinutes(date) {
  const y = date.getFullYear()
  const m = date.getMonth()
  const d = date.getDate()
  const start = new Date(y, m, d, 0, 0, 0, 0)
  const end = new Date(y, m, d + 1, 0, 0, 0, 0)
  return (end.getTime() - start.getTime()) / 60000
}

/**
 * Compute the load ratio for a day.
 * Returns a value between 0 and (potentially above) 1.0 when overloaded.
 *
 * @param {Array<{startTime: string, endTime: string, preparationTime?: number, travelTime?: number}>} events
 *   Events for the day. startTime / endTime are "HH:MM" strings.
 * @param {Date} date - The calendar day being evaluated
 * @returns {number} Load ratio (usedMinutes / totalDayMinutes)
 */
export function computeDayLoad(events, date) {
  const totalDayMinutes = getDayDurationMinutes(date)
  let usedMinutes = 0

  for (const event of events) {
    const rawStart = timeToMinutes(event.startTime)
    const rawEnd = timeToMinutes(event.endTime)
    const { start, end } = snapEventTime(rawStart, rawEnd)
    const mainDuration = Math.max(0, end - start)
    const prep = typeof event.preparationTime === 'number' ? event.preparationTime : 0
    const travel = typeof event.travelTime === 'number' ? event.travelTime : 0
    usedMinutes += mainDuration + prep + travel
  }

  return totalDayMinutes > 0 ? usedMinutes / totalDayMinutes : 0
}

/** @type {Map<string, number>} */
const _loadCache = new Map()

/**
 * Build the memoisation key for a set of events on a date string.
 *
 * @param {Array<object>} events
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {string}
 */
function buildCacheKey(events, dateStr) {
  const evtSig = events
    .map(
      (e) =>
        `${e.startTime}|${e.endTime}|${e.preparationTime ?? 0}|${e.travelTime ?? 0}`
    )
    .join(',')
  return `${dateStr}::${evtSig}`
}

/**
 * Memoised variant of `computeDayLoad`.
 * Results are cached by (dateStr + event fingerprint).
 * Safe to call on initial load and date navigation; must NOT be called
 * during scroll or hover handlers.
 *
 * @param {Array<object>} events - Same signature as `computeDayLoad`
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {number} Load ratio
 */
export function getMemoizedDayLoad(events, dateStr) {
  const key = buildCacheKey(events, dateStr)
  if (_loadCache.has(key)) {
    return _loadCache.get(key)
  }
  const date = new Date(`${dateStr}T00:00:00`)
  const load = computeDayLoad(events, date)
  _loadCache.set(key, load)
  return load
}

/**
 * Clear the load computation cache.
 * Call after bulk event mutations to avoid serving stale data.
 */
export function clearLoadCache() {
  _loadCache.clear()
}
