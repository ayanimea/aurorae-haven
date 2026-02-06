// Schedule Manager - Feature stub for calendar and time blocking
// TODO: Implement full schedule functionality with time blocking

import { put, getAll, getByIndex, deleteById, STORES } from './indexedDBManager'
import {
  DEFAULT_EVENT_DURATION_MINUTES,
  BUSINESS_HOURS_START,
  BUSINESS_HOURS_END,
  DEFAULT_TRAVEL_TIME_MINUTES,
  DEFAULT_PREPARATION_TIME_MINUTES
} from './scheduleConstants'
import { ISO_DATE_START_INDEX, ISO_DATE_END_INDEX } from './timeConstants'
import { normalizeEntity, updateMetadata } from './idGenerator'
import { calculateDuration, addDuration } from './timeUtils'

/**
 * Create a schedule event
 * @param {object} event - Event data
 * @param {string} event.title - Event title
 * @param {string} event.type - Event type ('task', 'routine', 'break', 'meeting')
 * @param {string} event.day - Event day (YYYY-MM-DD)
 * @param {string} event.startTime - Start time (HH:MM)
 * @param {string} event.endTime - End time (HH:MM)
 * @param {number} [event.travelTime] - Travel time in minutes (optional)
 * @param {number} [event.preparationTime] - Preparation time in minutes (optional)
 * @param {boolean} [event.isExternal] - Whether this is an external calendar event (optional)
 * @param {string} [event.externalCalendarId] - ID of external calendar source (optional)
 * @returns {Promise<number>} Event ID
 */
export async function createEvent(event) {
  // TODO: Implement event validation and conflict detection
  const newEvent = normalizeEntity({
    ...event,
    type: event.type || 'task', // 'task', 'routine', 'break', 'meeting'
    day:
      event.day ||
      new Date().toISOString().slice(ISO_DATE_START_INDEX, ISO_DATE_END_INDEX),
    startTime: event.startTime,
    endTime: event.endTime,
    duration:
      event.duration || calculateDuration(event.startTime, event.endTime),
    travelTime: event.travelTime ?? DEFAULT_TRAVEL_TIME_MINUTES,
    preparationTime: event.preparationTime ?? DEFAULT_PREPARATION_TIME_MINUTES,
    isExternal: event.isExternal || false,
    externalCalendarId: event.externalCalendarId || null
  })
  return await put(STORES.SCHEDULE, newEvent)
}

/**
 * Get events for a specific day
 * @param {string} day - ISO date string (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of events
 */
export async function getEventsForDay(day) {
  const events = await getByIndex(STORES.SCHEDULE, 'day', day)
  // Sort events by start time chronologically (handle missing startTime)
  return events.sort((a, b) => {
    if (!a.startTime) return 1
    if (!b.startTime) return -1
    return a.startTime.localeCompare(b.startTime)
  })
}

/**
 * Get events for date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of events
 */
export async function getEventsForRange(startDate, endDate) {
  // TODO: Implement efficient date range query
  const allEvents = await getAll(STORES.SCHEDULE)
  return allEvents.filter(
    (event) => event.day >= startDate && event.day <= endDate
  )
}

/**
 * Get events for current week
 * @returns {Promise<Array>} Array of events
 */
export async function getEventsForWeek() {
  // TODO: Implement week calculation
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const startDate = startOfWeek.toISOString().split('T')[0]
  const endDate = endOfWeek.toISOString().split('T')[0]

  return await getEventsForRange(startDate, endDate)
}

/**
 * Update event
 * @param {object} event - Updated event data
 * @returns {Promise<number>} Event ID
 */
export async function updateEvent(event) {
  // TODO: Add conflict detection and validation
  const updated = updateMetadata({
    ...event,
    duration:
      event.duration || calculateDuration(event.startTime, event.endTime),
    travelTime: event.travelTime ?? DEFAULT_TRAVEL_TIME_MINUTES,
    preparationTime: event.preparationTime ?? DEFAULT_PREPARATION_TIME_MINUTES
  })
  return await put(STORES.SCHEDULE, updated)
}

/**
 * Delete event
 * @param {number} id - Event ID
 * @returns {Promise<void>}
 */
export async function deleteEvent(id) {
  // TODO: Add confirmation for recurring events
  return await deleteById(STORES.SCHEDULE, id)
}

/**
 * Move event to different day/time
 * @param {number} id - Event ID
 * @param {string} newDay - New day (YYYY-MM-DD)
 * @param {string} newStartTime - New start time (HH:MM)
 * @returns {Promise<object>} Updated event
 */
export async function moveEvent(id, newDay, newStartTime) {
  // TODO: Implement drag-and-drop logic with conflict detection
  const events = await getAll(STORES.SCHEDULE)
  const event = events.find((e) => e.id === id)

  if (!event) {
    throw new Error('Event not found')
  }

  const duration = event.duration || DEFAULT_EVENT_DURATION_MINUTES
  const newEndTime = addDuration(newStartTime, duration)

  const updated = updateMetadata({
    ...event,
    day: newDay,
    startTime: newStartTime,
    endTime: newEndTime
  })

  await put(STORES.SCHEDULE, updated)
  return updated
}

/**
 * Check for scheduling conflicts
 * @param {string} day - Day to check (YYYY-MM-DD)
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 * @param {number} excludeEventId - Event ID to exclude from check
 * @returns {Promise<Array>} Array of conflicting events
 */
export async function checkConflicts(
  day,
  startTime,
  endTime,
  excludeEventId = null
) {
  // TODO: Implement comprehensive conflict detection
  const events = await getEventsForDay(day)

  return events.filter((event) => {
    if (excludeEventId && event.id === excludeEventId) {
      return false
    }

    // Check if times overlap
    return (
      (startTime >= event.startTime && startTime < event.endTime) ||
      (endTime > event.startTime && endTime <= event.endTime) ||
      (startTime <= event.startTime && endTime >= event.endTime)
    )
  })
}

/**
 * Get available time slots for a day
 * @param {string} day - Day (YYYY-MM-DD)
 * @param {number} duration - Minimum duration needed (minutes)
 * @returns {Promise<Array>} Array of available slots
 */
export async function getAvailableSlots(
  day,
  duration = DEFAULT_EVENT_DURATION_MINUTES
) {
  // TODO: Implement slot calculation with business hours
  const events = await getEventsForDay(day)
  const slots = []

  // Simple implementation: find gaps between events
  const sortedEvents = events.sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  )

  let currentTime = BUSINESS_HOURS_START
  const endOfDay = BUSINESS_HOURS_END

  for (const event of sortedEvents) {
    const gapDuration = calculateDuration(currentTime, event.startTime)
    if (gapDuration >= duration) {
      slots.push({
        startTime: currentTime,
        endTime: event.startTime,
        duration: gapDuration
      })
    }
    currentTime = event.endTime
  }

  // Check remaining time at end of day
  const finalGap = calculateDuration(currentTime, endOfDay)
  if (finalGap >= duration) {
    slots.push({
      startTime: currentTime,
      endTime: endOfDay,
      duration: finalGap
    })
  }

  return slots
}

/**
 * Get today's schedule summary
 * @returns {Promise<object>} Summary with stats
 */
export async function getTodaySummary() {
  // TODO: Implement comprehensive summary
  const today = new Date().toISOString().split('T')[0]
  const events = await getEventsForDay(today)

  const totalDuration = events.reduce(
    (sum, event) => sum + (event.duration || 0),
    0
  )
  const byType = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1
    return acc
  }, {})

  return {
    day: today,
    totalEvents: events.length,
    totalDuration,
    byType,
    events
  }
}
