/**
 * Event Adapter - Transform EventService data to React Big Calendar format
 * Converts between our event data model and RBC's expected format
 */

import { parseISO, parse, format, addDays } from 'date-fns'
import { createLogger } from './logger'

const logger = createLogger('EventAdapter')

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

    // Parse the day (YYYY-MM-DD format)
    const dayDate = parseISO(event.day)
    
    // Validate the parsed date
    if (Number.isNaN(dayDate.getTime())) {
      return null
    }
    
    // Parse start and end times (HH:mm format)
    const startTime = parse(event.startTime, 'HH:mm', dayDate)
    let endTime = parse(event.endTime, 'HH:mm', dayDate)
    
    // Validate parsed times
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
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
 * Convert multiple events to RBC format
 * @param {Array} events - Array of events from EventService
 * @returns {Array} Array of events in RBC format
 */
export const toRBCEvents = (events) => {
  if (!Array.isArray(events)) {
    logger.error('toRBCEvents: events is not an array', events)
    return []
  }

  return events
    .map(toRBCEvent)
    .filter(Boolean) // Remove any null results from conversion errors
}

/**
 * Create a new event from date/time selection
 * @param {Object} slotInfo - Slot info from RBC
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
      type: 'task',
      travelTime: 0,
      preparationTime: 0
    }
  } catch (error) {
    logger.error('Error creating event from slot:', error, slotInfo)
    return null
  }
}
