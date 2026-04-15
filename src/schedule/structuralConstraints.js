/**
 * Structural Constraints
 *
 * Validates scheduling rules that apply regardless of guidance level:
 *  - Maximum simultaneous overlapping events (prep + travel included in overlap window)
 *  - All-day event exception for the simultaneous limit
 *
 * These checks run on create, edit, drag, and resize operations.
 * They are independent of `schedulingGuidanceLevel`.
 */

import { SCHEDULING_CONFIG } from './config'
import { timeToMinutes } from '../utils/timeUtils'
import { snapDown, snapUp } from './timeUtils'

/**
 * @typedef {Object} ScheduleEvent
 * @property {string}  startTime       - "HH:MM"
 * @property {string}  endTime         - "HH:MM"
 * @property {number}  [preparationTime] - minutes, default 0
 * @property {number}  [travelTime]      - minutes, default 0
 * @property {boolean} [allDay]          - true for all-day events
 * @property {string}  [id]              - optional ID for exclusion during edits
 */

/**
 * Get the effective start and end in minutes for an event, expanding by prep time.
 * Prep time shifts the window earlier; travel time shifts the window later.
 *
 * Special cases:
 *  - All-day events (allDay === true, or missing startTime, or missing endTime)
 *    occupy the full day [0, 1440) so they always trigger the all-day simultaneous
 *    limit but never block creation of timed events by themselves.
 *  - Midnight-spanning events (endTime parses to < startTime) have 1440 added
 *    to their end so overlap checks work across the day boundary; equal
 *    start/end times remain zero-duration events.
 *
 * @param {ScheduleEvent} event
 * @returns {{ start: number, end: number, isAllDay: boolean }}
 */
export function getEffectiveWindow(event) {
  // All-day events: treat as occupying [0, 1440) with no buffer
  if (event.allDay === true || !event.startTime || !event.endTime) {
    return { start: 0, end: 1440, isAllDay: true }
  }

  const rawStart = timeToMinutes(event.startTime)
  const rawEnd = timeToMinutes(event.endTime)
  const prep = typeof event.preparationTime === 'number' ? event.preparationTime : 0
  const travel = typeof event.travelTime === 'number' ? event.travelTime : 0

  // Midnight-spanning: end wraps past midnight (e.g. 23:00–01:00).
  // Equal start/end times remain valid zero-duration events (not 24-hour blocks).
  const normalEnd = rawEnd < rawStart ? rawEnd + 1440 : rawEnd

  // Snap main start/end to stay consistent with computeDayLoad() which also snaps
  // before computing the used-minute tally (start snapped down, end snapped up).
  const snappedStart = snapDown(rawStart)
  const snappedEnd = snapUp(normalEnd)

  return {
    start: snappedStart - prep,
    end: snappedEnd + travel,
    isAllDay: false
  }
}

/**
 * Check whether two events' effective windows overlap.
 * Touching at boundaries (a.end === b.start) is NOT overlap.
 *
 * @param {ScheduleEvent} a
 * @param {ScheduleEvent} b
 * @returns {boolean}
 */
export function eventsOverlap(a, b) {
  const wa = getEffectiveWindow(a)
  const wb = getEffectiveWindow(b)
  return wa.start < wb.end && wa.end > wb.start
}

/**
 * Validate structural constraints for a candidate event against a set of
 * existing events on the same day.
 *
 * Uses a sweep-line algorithm over (start, end) boundary points to find the
 * actual maximum number of concurrent events within the candidate's effective
 * window. This correctly handles disjoint-in-time overlapping sets that a
 * simple count would over-reject.
 *
 * Returns an object describing whether the candidate is valid, along with
 * how many simultaneous events would exist at the busiest point.
 *
 * @param {ScheduleEvent}   candidate      - The event being created / edited
 * @param {ScheduleEvent[]} existingEvents - Events already scheduled that day
 *   (should NOT include the candidate itself; callers must filter out the
 *    candidate's own ID when editing)
 * @returns {{ valid: boolean, simultaneousCount: number, reason?: string }}
 */
export function validateStructural(candidate, existingEvents) {
  const overlapping = existingEvents.filter((e) => eventsOverlap(candidate, e))

  // Derive all-day status from getEffectiveWindow so that events with missing
  // startTime/endTime are recognised as all-day (consistent with getEffectiveWindow).
  const candidateWindow = getEffectiveWindow(candidate)
  const hasAllDay =
    candidateWindow.isAllDay || overlapping.some((e) => getEffectiveWindow(e).isAllDay)

  const limit = hasAllDay
    ? SCHEDULING_CONFIG.maxSimultaneousWithAllDay
    : SCHEDULING_CONFIG.maxSimultaneousEvents

  // Sweep-line: find max concurrency within the candidate's effective window
  const boundaries = []

  for (const event of overlapping) {
    const w = getEffectiveWindow(event)
    const start = Math.max(w.start, candidateWindow.start)
    const end = Math.min(w.end, candidateWindow.end)

    // Only count events that actually overlap (not just touch at boundary)
    if (start < end) {
      boundaries.push({ time: start, delta: 1 })
      boundaries.push({ time: end, delta: -1 })
    }
  }

  let simultaneousCount
  if (boundaries.length === 0) {
    // Only the candidate itself within its window
    simultaneousCount = 1
  } else {
    // Sort: ascending time; at tie, endings (-1) before starts (+1) so that
    // events touching at boundary are not counted as concurrent
    boundaries.sort((a, b) =>
      a.time !== b.time ? a.time - b.time : a.delta - b.delta
    )

    let current = 0
    let maxExisting = 0
    for (const point of boundaries) {
      current += point.delta
      if (current > maxExisting) maxExisting = current
    }

    // +1 for the candidate itself
    simultaneousCount = maxExisting + 1
  }

  if (simultaneousCount > limit) {
    return {
      valid: false,
      simultaneousCount,
      reason: `Maximum simultaneous events (${limit}) exceeded`
    }
  }

  return { valid: true, simultaneousCount }
}
