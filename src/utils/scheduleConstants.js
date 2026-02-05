/**
 * Schedule Constants
 * Centralized constants for schedule and calendar operations
 * Single source of truth for all schedule-related configuration
 */

// Event type constants - avoid magic strings throughout codebase
export const EVENT_TYPES = {
  ROUTINE: 'routine',
  TASK: 'task',
  MEETING: 'meeting',
  HABIT: 'habit',
  BREAK: 'break'
}

// Array of valid event types for validation
export const VALID_EVENT_TYPES = Object.values(EVENT_TYPES)

// Schedule time range constants (in hours, 24-hour format)
export const SCHEDULE_START_HOUR = 7
export const SCHEDULE_END_HOUR = 24 // Exclusive end of day: 24:00 == 00:00 next day. Using 24 (not 0) keeps midnight events at the end of the day's schedule for simpler boundary checks.

// Display constants - each hour occupies 80 pixels in the UI (reduced for better overview)
// NOTE: This hardcoded value conflicts with schedule-ui-spec.md §6 which states
// "Do NOT hardcode pixel heights". This should be refactored to use CSS variables
// and minute-based calculations. Current implementation is a temporary measure
// pending full compliance with the spec's proportional scaling requirements.
export const PIXELS_PER_HOUR = 80
export const SCHEDULE_VERTICAL_OFFSET = 6

// Default event duration (in minutes)
export const DEFAULT_EVENT_DURATION_MINUTES = 60

// Business hours (formatted as HH:MM strings)
export const BUSINESS_HOURS_START = '08:00'
export const BUSINESS_HOURS_END = '22:00'

// Time conversion constants
export const MINUTES_PER_HOUR = 60
export const HOURS_PER_DAY = 24

// Filter time range (in days)
export const FILTER_RECENT_DAYS = 30

// Default travel and preparation times (in minutes)
export const DEFAULT_TRAVEL_TIME_MINUTES = 0
export const DEFAULT_PREPARATION_TIME_MINUTES = 0

// Maximum allowed travel and preparation times (in minutes)
export const MAX_TRAVEL_TIME_MINUTES = 180 // 3 hours
export const MAX_PREPARATION_TIME_MINUTES = 180 // 3 hours
