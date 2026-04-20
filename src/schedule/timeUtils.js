/**
 * Schedule Time Utilities — Snap & Normalization
 *
 * All event times must be normalised through these functions before
 * being stored, displayed, or used in load/conflict computations.
 *
 * Rules:
 *  - Start times are snapped DOWN to the nearest interval boundary.
 *  - End times are snapped UP to the nearest interval boundary.
 *  - The snap interval is read from SCHEDULING_CONFIG so there are no
 *    magic numbers anywhere else.
 */

import { SCHEDULING_CONFIG } from './config'

/**
 * Snap a minute value DOWN to the nearest snap interval boundary.
 *
 * @param {number} minutes - Raw minute value (≥ 0)
 * @returns {number} Snapped minute value
 */
export function snapDown(minutes) {
  const interval = SCHEDULING_CONFIG.snapIntervalMinutes
  return Math.floor(minutes / interval) * interval
}

/**
 * Snap a minute value UP to the nearest snap interval boundary.
 * If the value is already on a boundary, it is left unchanged.
 *
 * @param {number} minutes - Raw minute value (≥ 0)
 * @returns {number} Snapped minute value
 */
export function snapUp(minutes) {
  const interval = SCHEDULING_CONFIG.snapIntervalMinutes
  return Math.ceil(minutes / interval) * interval
}

/**
 * Snap an event's start/end pair:
 *  - start is snapped DOWN
 *  - end is snapped UP
 * Returns a new object; the original values are not mutated.
 *
 * @param {number} startMinutes - Start time in minutes from midnight
 * @param {number} endMinutes   - End time in minutes from midnight
 * @returns {{ start: number, end: number }} Snapped start/end pair
 */
export function snapEventTime(startMinutes, endMinutes) {
  return {
    start: snapDown(startMinutes),
    end: snapUp(endMinutes)
  }
}
