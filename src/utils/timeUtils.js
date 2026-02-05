/**
 * Time Utilities using Day.js
 * Migrated from custom implementation to use Day.js library for better date/time handling
 * Supports dates, times, durations, deadlines with battle-tested edge case handling
 */

import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// Enable Day.js plugins
dayjs.extend(duration)
dayjs.extend(customParseFormat)

// Time formatting constants
const TIME_PADDING_LENGTH = 2
const PADDING_CHAR = '0'
const SECONDS_PER_MINUTE = 60

/**
 * Get current date in ISO format (YYYY-MM-DD)
 *
 * Note: This function uses the user's local timezone. When used near midnight,
 * the "current date" may differ from server timezone. For future internationalization,
 * consider adding a timezone parameter or using UTC.
 *
 * @returns {string} Current date in ISO format (YYYY-MM-DD)
 */
export function getCurrentDateISO() {
  return dayjs().format('YYYY-MM-DD')
}

/**
 * Parse time string in HH:MM format to hours and minutes
 * Validates that hours are in range 0-23 and minutes are in range 0-59
 * Returns null for invalid inputs to distinguish from valid '00:00'
 * @param {string} timeString - Time in "HH:MM" format
 * @returns {{hours: number, minutes: number}|null} Object with hours and minutes, or null if invalid
 */
export function parseTime(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return null
  }

  // Trim whitespace before parsing
  const trimmedTimeString = timeString.trim()
  // Use Day.js to parse HH:MM format
  const parsed = dayjs(trimmedTimeString, 'HH:mm', true)

  if (!parsed.isValid()) {
    return null
  }

  const hours = parsed.hour()
  const minutes = parsed.minute()

  // Validate ranges (Day.js should handle this, but double-check)
  if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) {
    return null
  }

  return { hours, minutes }
}

/**
 * Format hours and minutes to HH:MM clock time string
 * Distinct from routineRunner.formatTime which formats seconds to mm:ss
 * @param {number} hours - Hours (0-23)
 * @param {number} minutes - Minutes (0-59)
 * @returns {string} Time in "HH:MM" format
 */
export function formatClockTime(hours, minutes) {
  // Create a Day.js object with today's date and specified time
  const time = dayjs()
    .hour(Math.floor(hours))
    .minute(Math.floor(minutes))
    .second(0)
  return time.format('HH:mm')
}

/**
 * Convert HH:MM time string to total minutes since midnight
 * Returns 0 for invalid time strings
 * @param {string} timeString - Time in "HH:MM" format
 * @returns {number} Total minutes since midnight, or 0 if invalid
 */
export function timeToMinutes(timeString) {
  const parsed = parseTime(timeString)
  if (parsed === null) {
    return 0
  }
  return parsed.hours * 60 + parsed.minutes
}

/**
 * Convert total minutes to HH:MM time string
 * Handles wrapping for negative values (e.g., -60 minutes = 23:00)
 * Returns '00:00' for non-finite values (NaN, Infinity, etc.)
 * @param {number} totalMinutes - Total minutes since midnight
 * @returns {string} Time in "HH:MM" format
 */
export function minutesToTime(totalMinutes) {
  // Guard against non-finite values (NaN, Infinity, etc.)
  if (!Number.isFinite(totalMinutes)) {
    return '00:00'
  }

  // Use Day.js duration to handle the conversion
  const dur = dayjs.duration(Math.floor(totalMinutes), 'minutes')

  // Get hours and minutes, wrapping around 24 hours
  const totalHours = Math.floor(dur.asHours())
  const normalizedHours = ((totalHours % 24) + 24) % 24
  const minutes = dur.minutes()

  return `${String(normalizedHours).padStart(TIME_PADDING_LENGTH, PADDING_CHAR)}:${String(Math.abs(minutes)).padStart(TIME_PADDING_LENGTH, PADDING_CHAR)}`
}

/**
 * Calculate duration in minutes between two times
 * Both times must be in "HH:MM" 24-hour format
 * Returns 0 if either time is invalid
 * If endTime is before startTime, the result will be negative
 * @param {string} startTime - Start time in "HH:MM" format
 * @param {string} endTime - End time in "HH:MM" format
 * @returns {number} Duration in minutes between start and end times, or 0 if either is invalid
 */
export function calculateDuration(startTime, endTime) {
  // Check if inputs are invalid early to avoid misleading results
  const startParsed = parseTime(startTime)
  const endParsed = parseTime(endTime)

  if (startParsed === null || endParsed === null) {
    return 0
  }

  // Create Day.js objects for comparison using a fixed base date
  // This ensures both times are on the same day and avoids DST/timing issues
  const baseDate = dayjs().startOf('day')
  const start = baseDate
    .hour(startParsed.hours)
    .minute(startParsed.minutes)
    .second(0)
  const end = baseDate.hour(endParsed.hours).minute(endParsed.minutes).second(0)

  // Return difference in minutes
  return end.diff(start, 'minute')
}

/**
 * Add minutes to a time
 * If time is invalid, it's treated as 00:00 and minutes are applied
 * @param {string} time - Time in "HH:MM" format
 * @param {number} minutes - Minutes to add (can be negative)
 * @returns {string} New time in "HH:MM" format (e.g., addDuration('', 60) returns '01:00')
 */
export function addDuration(time, minutes) {
  const parsed = parseTime(time)

  // If invalid time provided, treat as 00:00
  const baseTime =
    parsed !== null
      ? dayjs().hour(parsed.hours).minute(parsed.minutes).second(0)
      : dayjs().hour(0).minute(0).second(0)

  // Add minutes and format
  const result = baseTime.add(minutes, 'minute')
  return result.format('HH:mm')
}

/**
 * Subtract minutes from a time
 * @param {string} time - Time in "HH:MM" format
 * @param {number} minutes - Minutes to subtract
 * @returns {string} New time in "HH:MM" format
 */
export function subtractDuration(time, minutes) {
  return addDuration(time, -minutes)
}

/**
 * Format seconds to mm:ss display format
 * Used for timer displays in UI
 * @param {number} seconds - Time in seconds
 * @param {object} options - Formatting options
 * @param {boolean} options.verbose - If true, add "remaining" suffix
 * @returns {string} Formatted time string (e.g., "05:30" or "05:30 remaining")
 */
export function formatDurationDisplay(seconds, options = {}) {
  // Validate input - default to 0 if not a number
  const validSeconds =
    typeof seconds === 'number' && !isNaN(seconds) ? seconds : 0

  const abs = Math.floor(Math.abs(validSeconds))
  const mins = Math.floor(abs / SECONDS_PER_MINUTE)
  const secs = abs % SECONDS_PER_MINUTE
  const sign = validSeconds < 0 ? '-' : ''
  const formatted = `${sign}${String(mins).padStart(TIME_PADDING_LENGTH, PADDING_CHAR)}:${String(secs).padStart(TIME_PADDING_LENGTH, PADDING_CHAR)}`

  // Return with suffix if verbose option is enabled
  return options.verbose ? `${formatted} remaining` : formatted
}

/**
 * Format duration in seconds to verbose human-readable string
 * Used for displaying durations in UI (e.g., "2h 30m" or "45m")
 * @param {number} seconds - Duration in seconds
 * @returns {string|null} Formatted duration string or null if no duration
 */
export function formatDurationVerbose(seconds) {
  if (!seconds) return null

  const dur = dayjs.duration(Math.abs(seconds), 'seconds')
  const sign = seconds < 0 ? '-' : ''

  const hours = Math.floor(dur.asHours())
  const minutes = dur.minutes()

  if (hours === 0) {
    return `${sign}${minutes}m`
  }

  return minutes > 0 ? `${sign}${hours}h ${minutes}m` : `${sign}${hours}h`
}
