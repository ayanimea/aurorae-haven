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
    
    // Parse start and end times (HH:mm format)
    const startTime = parse(event.startTime, 'HH:mm', dayDate)
    let endTime = parse(event.endTime, 'HH:mm', dayDate)
    
    // Handle events that span midnight (endTime < startTime)
    if (endTime <= startTime) {
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
 * Convert RBC event back to our event format
 * @param {Object} rbcEvent - Event from React Big Calendar
 * @returns {Object} Event in our format
 */
export const fromRBCEvent = (rbcEvent) => {
  try {
    if (!rbcEvent) {
      logger.error('fromRBCEvent: event is null or undefined')
      return null
    }

    // Extract date in YYYY-MM-DD format
    const day = format(rbcEvent.start, 'yyyy-MM-dd')
    
    // Extract times in HH:mm format
    const startTime = format(rbcEvent.start, 'HH:mm')
    const endTime = format(rbcEvent.end, 'HH:mm')

    return {
      id: rbcEvent.id,
      title: rbcEvent.title,
      day,
      startTime,
      endTime,
      type: rbcEvent.resource?.type || 'task',
      travelTime: rbcEvent.resource?.travelTime || 0,
      preparationTime: rbcEvent.resource?.preparationTime || 0
    }
  } catch (error) {
    logger.error('Error converting RBC event to our format:', error, rbcEvent)
    return null
  }
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
