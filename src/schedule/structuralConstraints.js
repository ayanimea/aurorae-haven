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
 * @param {ScheduleEvent} event
 * @returns {{ start: number, end: number }}
 */
export function getEffectiveWindow(event) {
  const start = timeToMinutes(event.startTime)
  const end = timeToMinutes(event.endTime)
  const prep = typeof event.preparationTime === 'number' ? event.preparationTime : 0
  const travel = typeof event.travelTime === 'number' ? event.travelTime : 0
  return {
    start: start - prep,
    end: end + travel
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
  // +1 accounts for the candidate itself
  const simultaneousCount = overlapping.length + 1

  const hasAllDay =
    candidate.allDay === true || overlapping.some((e) => e.allDay === true)

  const limit = hasAllDay
    ? SCHEDULING_CONFIG.maxSimultaneousWithAllDay
    : SCHEDULING_CONFIG.maxSimultaneousEvents

  if (simultaneousCount > limit) {
    return {
      valid: false,
      simultaneousCount,
      reason: `Maximum simultaneous events (${limit}) exceeded`
    }
  }

  return { valid: true, simultaneousCount }
}
