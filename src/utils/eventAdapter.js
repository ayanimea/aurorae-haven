/**
 * Event Adapter - Transform EventService data to calendar format
 * Converts between our event data model and calendar libraries' expected formats.
 *
 * Calendar library strategy:
 * - Historically supported both React Big Calendar (RBC) and FullCalendar.
 * - FullCalendar is now the primary and sole calendar library used by Schedule
 *   and other production views.
 * - RBC-specific adapters (toRBCEvent, toRBCEvents, and related helpers) are kept
 *   only for test coverage and potential short-term rollback during migration and
 *   are considered deprecated and candidates for eventual removal.
 */

import { parse, format, addDays } from 'date-fns'
import { createLogger } from './logger'
import { VALID_EVENT_TYPES } from './scheduleConstants'
import { clusterEvents, assignColumns } from './scheduleHelpers'
import { timeToMinutes } from './timeUtils'

const logger = createLogger('EventAdapter')

const MILLISECONDS_PER_MINUTE = 60000
const HHMM_24H_PATTERN = /^(?:24:00|(?:[01]\d|2[0-3]):[0-5]\d)$/

const toDateAtStartOfDay = (date) => {
  const normalizedDate = new Date(date)
  normalizedDate.setHours(0, 0, 0, 0)
  return normalizedDate
}

const parseEventTime = (dayDate, timeString, { allowEndOfDay = false } = {}) => {
  if (timeString === '24:00') {
    return allowEndOfDay ? addDays(dayDate, 1) : null
  }

  if (!HHMM_24H_PATTERN.test(timeString)) {
    return null
  }

  return new Date(dayDate.getTime() + timeToMinutes(timeString) * MILLISECONDS_PER_MINUTE)
}

const isSingleDayForClustering = (startDate, endDate) => {
  const startDay = format(startDate, 'yyyy-MM-dd')
  const endDay = format(endDate, 'yyyy-MM-dd')
  if (startDay === endDay) {
    return true
  }

  const nextDayStart = addDays(toDateAtStartOfDay(startDate), 1)
  return endDate.getTime() === nextDayStart.getTime()
}

/**
 * Convert our event format to React Big Calendar format
 * @param {Object} event - Event from EventService
 * @returns {Object} Event in RBC format
 */
export const toRBCEvent = (event) => {
  try {
    if (!event) {
      logger.error('toRBCEvent: event is null or undefined')
      return null
    }

    // Parse the day (YYYY-MM-DD format) as local date to avoid UTC timezone shifts
    // parseISO treats date-only strings as UTC, which can shift the day in non-UTC zones
    const dayDate = toDateAtStartOfDay(parse(event.day, 'yyyy-MM-dd', new Date()))

    // Validate the parsed date
    if (Number.isNaN(dayDate.getTime())) {
      return null
    }

    // Parse start and end times (HH:mm format)
    const startTime = parseEventTime(dayDate, event.startTime)
    let endTime = parseEventTime(dayDate, event.endTime, { allowEndOfDay: true })

    // Validate parsed times
    if (
      !startTime ||
      !endTime ||
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime())
    ) {
      return null
    }

    // Handle events that span midnight (endTime < startTime)
    // Use strict less-than to only handle true midnight-spanning events
    // Zero-duration events (start === end) are valid (e.g., reminders, bookmarks)
    if (endTime < startTime) {
      endTime = addDays(endTime, 1)
    }

    return {
      id: event.id,
      title: event.title,
      start: startTime,
      end: endTime,
      resource: {
        type: event.type,
        travelTime: event.travelTime || 0,
        preparationTime: event.preparationTime || 0,
        originalEvent: event
      }
    }
  } catch (error) {
    logger.error('Error converting event to RBC format:', error, event)
    return null
  }
}

/**
 * Convert our event format to FullCalendar format
 * @param {Object} event - Event from EventService
 * @returns {Object} Event in FullCalendar format
 */
export const toFullCalendarEvent = (event) => {
  try {
    if (!event) {
      logger.error('toFullCalendarEvent: event is null or undefined')
      return null
    }

    // Parse the day (YYYY-MM-DD format) as local date to avoid UTC timezone shifts
    // parseISO treats date-only strings as UTC, which can shift the day in non-UTC zones
    const dayDate = toDateAtStartOfDay(parse(event.day, 'yyyy-MM-dd', new Date()))

    // Validate the parsed date
    if (Number.isNaN(dayDate.getTime())) {
      return null
    }

    // Parse start and end times (HH:mm format)
    const startTime = parseEventTime(dayDate, event.startTime)
    let endTime = parseEventTime(dayDate, event.endTime, { allowEndOfDay: true })

    // Validate parsed times
    if (
      !startTime ||
      !endTime ||
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime())
    ) {
      return null
    }

    // Handle events that span midnight (endTime < startTime)
    if (endTime < startTime) {
      endTime = addDays(endTime, 1)
    }

    // Whitelist valid event types to prevent CSS class injection
    // Only allow known types from VALID_EVENT_TYPES; fallback to 'task' for safety
    const eventType = VALID_EVENT_TYPES.includes(event.type)
      ? event.type
      : 'task'

    // Canonical data model — mainStart/mainEnd are source of truth.
    // renderStart expands backwards to accommodate prep + travel buffers so
    // the FC event's visual span covers the full block.
    // Guard: if the buffer would push renderStart into the previous calendar day,
    // clamp to dayDate (midnight) so that day-based clustering stays correct.
    const mainStart = startTime
    const mainEnd = endTime
    const prepDuration = event.preparationTime || 0
    const travelDuration = event.travelTime || 0
    const totalBuffer = prepDuration + travelDuration

    let renderStart = mainStart
    if (totalBuffer > 0) {
      const bufferedStart = new Date(mainStart.getTime() - totalBuffer * MILLISECONDS_PER_MINUTE)
      renderStart = bufferedStart < dayDate ? dayDate : bufferedStart
    }

    // FullCalendar event format
    return {
      id: event.id,
      title: event.title,
      start: renderStart,
      end: mainEnd,
      classNames: [`event-${eventType}`],
      extendedProps: {
        type: eventType,
        // Legacy fields — kept for backward compatibility with consumers that
        // still read travelTime / preparationTime. Canonical names are
        // travelDuration / prepDuration below. Remove legacy fields once all
        // consumers have migrated to the canonical names.
        travelTime: travelDuration,
        preparationTime: prepDuration,
        mainStart,
        mainEnd,
        prepDuration,
        travelDuration,
        originalEvent: event
      }
    }
  } catch (error) {
    logger.error('Error converting event to FullCalendar format:', error, event)
    return null
  }
}

/**
 * Convert multiple events to RBC format
 * @param {Array} events - Array of events from EventService
 * @returns {Array} Array of events in RBC format
 */
export const toRBCEvents = (events) => {
  if (!Array.isArray(events)) {
    logger.error('toRBCEvents: events is not an array', events)
    return []
  }

  return events.map(toRBCEvent).filter(Boolean) // Remove any null results from conversion errors
}

/**
 * Convert multiple events to FullCalendar format
 * @param {Array} events - Array of events from EventService
 * @returns {Array} Array of events in FullCalendar format
 */
export const toFullCalendarEvents = (events) => {
  if (!Array.isArray(events)) {
    logger.error('toFullCalendarEvents: events is not an array', events)
    return []
  }

  const fcEvents = events.map(toFullCalendarEvent).filter(Boolean)

  // Compute overlap columns using the deterministic engine.
  // Column metadata (column, totalColumns) is stored in extendedProps as prep work
  // for future side-by-side overlap rendering. To wire it into the UI:
  //   1. Schedule.jsx eventContent: forward extendedProps.column / .totalColumns into the
  //      `resource` object passed to SolidEventCard.
  //   2. SolidEventCard: accept column / totalColumns props and apply CSS `left` / `width`
  //      (e.g. left = (column/totalColumns)*100+'%', width = (1/totalColumns)*100+'%').
  // Until that rendering path is implemented, the values are precomputed but unused by CSS.
  // Multi-day/midnight-spanning events are excluded from clustering — FullCalendar
  // handles their layout separately and minute offsets would be incorrect for them.
  try {
    const MINUTES_PER_DAY = 24 * 60
    const singleDayEvents = fcEvents.filter((e) => isSingleDayForClustering(e.start, e.end))
    const eventSlots = singleDayEvents.map((e) => ({
      id: e.id,
      start: Math.min(e.start.getHours() * 60 + e.start.getMinutes(), MINUTES_PER_DAY - 1),
      end: (() => {
        const spansDayBoundary =
          format(e.start, 'yyyy-MM-dd') !== format(e.end, 'yyyy-MM-dd')
        return spansDayBoundary
          ? MINUTES_PER_DAY
          : Math.min(e.end.getHours() * 60 + e.end.getMinutes(), MINUTES_PER_DAY)
      })()
    }))
    const clusters = clusterEvents(eventSlots)
    for (const cluster of clusters) assignColumns(cluster)
    const columnMap = Object.fromEntries(
      eventSlots.map((s) => [s.id, { column: s.column ?? 0, totalColumns: s.totalColumns ?? 1 }])
    )
    return fcEvents.map((e) => ({
      ...e,
      extendedProps: { ...e.extendedProps, ...(columnMap[e.id] ?? {}) }
    }))
  } catch (_err) {
    logger.error('Failed to compute overlap columns:', _err)
    return fcEvents
  }
}

/**
 * Create a new event from date/time selection
 * @param {Object} slotInfo - Slot/selection info from the calendar (React Big Calendar or FullCalendar)
 * @returns {Object} Event data for EventModal
 */
export const createEventFromSlot = (slotInfo) => {
  try {
    const day = format(slotInfo.start, 'yyyy-MM-dd')
    const startTime = format(slotInfo.start, 'HH:mm')
    const endTime = format(slotInfo.end, 'HH:mm')

    return {
      day,
      startTime,
      endTime,
      title: '',
      type: null, // Let EventModal determine type based on user selection
      travelTime: 0,
      preparationTime: 0
    }
  } catch (error) {
    logger.error('Error creating event from slot:', error, slotInfo)
    return null
  }
}
