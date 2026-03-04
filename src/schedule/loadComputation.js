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
    let rawEnd = timeToMinutes(event.endTime)

    // Midnight-spanning event: end wraps past midnight (e.g. 23:00–01:00)
    if (rawEnd <= rawStart) rawEnd += 1440

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

/** Maximum number of entries in the load cache to prevent unbounded memory growth */
export const LOAD_CACHE_MAX_SIZE = 200

/**
 * Build the memoisation key for a set of events on a date string.
 * Signatures are sorted so that the same set in different orders produces
 * the same key (preventing unnecessary cache misses during navigation).
 *
 * @param {Array<object>} events
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {string}
 */
function buildCacheKey(events, dateStr) {
  const signatures = events.map(
    (e) => `${e.id ?? ''}|${e.startTime}|${e.endTime}|${e.preparationTime ?? 0}|${e.travelTime ?? 0}`
  )
  signatures.sort()
  return `${dateStr}::${signatures.join(',')}`
}

/**
 * Memoised variant of `computeDayLoad`.
 * Results are cached by (dateStr + event fingerprint) with LRU eviction.
 * Cache hits refresh key recency; the least-recently-used entry is evicted
 * when the cache exceeds LOAD_CACHE_MAX_SIZE.
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
    // Refresh recency for LRU behaviour: move hit entry to the end
    const cached = _loadCache.get(key)
    _loadCache.delete(key)
    _loadCache.set(key, cached)
    return cached
  }
  // Parse dateStr into local components to avoid ISO UTC-shift (DST-safe).
  // Guards against malformed input by falling back to the ISO constructor.
  const parts = dateStr.split('-').map(Number)
  const date =
    parts.length === 3 && parts.every((n) => !Number.isNaN(n))
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date(dateStr)
  const load = computeDayLoad(events, date)
  // Evict least-recently-used entry when the cache reaches its size limit
  if (_loadCache.size >= LOAD_CACHE_MAX_SIZE) {
    const firstKey = _loadCache.keys().next().value
    _loadCache.delete(firstKey)
  }
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
