import {
  toRBCEvent,
  toRBCEvents,
  toFullCalendarEvent,
  toFullCalendarEvents,
  createEventFromSlot
} from '../utils/eventAdapter'
import { parseISO } from 'date-fns'

// Mock logger
jest.mock('../utils/logger', () => ({
  createLogger: jest.fn(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }))
}))

describe('eventAdapter', () => {
  describe('toRBCEvent', () => {
    it('should convert a standard event to RBC format', () => {
      const event = {
        id: '1',
        title: 'Test Event',
        day: '2026-02-03',
        startTime: '09:00',
        endTime: '10:00',
        type: 'task',
        travelTime: 0,
        preparationTime: 0
      }

      const rbcEvent = toRBCEvent(event)

      expect(rbcEvent).toBeTruthy()
      expect(rbcEvent.id).toBe('1')
      expect(rbcEvent.title).toBe('Test Event')
      expect(rbcEvent.start).toEqual(parseISO('2026-02-03T09:00:00'))
      expect(rbcEvent.end).toEqual(parseISO('2026-02-03T10:00:00'))
      expect(rbcEvent.resource.type).toBe('task')
    })

    it('should handle events spanning midnight (23:00 to 01:00)', () => {
      const event = {
        id: '2',
        title: 'Late Night Event',
        day: '2026-02-03',
        startTime: '23:00',
        endTime: '01:00',
        type: 'meeting'
      }

      const rbcEvent = toRBCEvent(event)

      expect(rbcEvent).toBeTruthy()
      expect(rbcEvent.start.getHours()).toBe(23)
      expect(rbcEvent.end.getHours()).toBe(1)
      expect(rbcEvent.end.getDate()).toBe(rbcEvent.start.getDate() + 1)
    })

    it('should handle events ending exactly at midnight', () => {
      const event = {
        id: '3',
        title: 'Until Midnight',
        day: '2026-02-03',
        startTime: '22:00',
        endTime: '00:00',
        type: 'routine'
      }

      const rbcEvent = toRBCEvent(event)

      expect(rbcEvent).toBeTruthy()
      expect(rbcEvent.start.getHours()).toBe(22)
      expect(rbcEvent.end.getHours()).toBe(0)
      expect(rbcEvent.end.getDate()).toBe(rbcEvent.start.getDate() + 1)
    })

    it('should include preparation and travel time in resource', () => {
      const event = {
        id: '4',
        title: 'Event with Prep',
        day: '2026-02-03',
        startTime: '14:00',
        endTime: '15:00',
        type: 'meeting',
        preparationTime: 15,
        travelTime: 10
      }

      const rbcEvent = toRBCEvent(event)

      expect(rbcEvent.resource.preparationTime).toBe(15)
      expect(rbcEvent.resource.travelTime).toBe(10)
      expect(rbcEvent.resource.originalEvent).toEqual(event)
    })

    it('should handle missing optional fields', () => {
      const event = {
        id: '5',
        title: 'Minimal Event',
        day: '2026-02-03',
        startTime: '10:00',
        endTime: '11:00',
        type: 'task'
      }

      const rbcEvent = toRBCEvent(event)

      expect(rbcEvent).toBeTruthy()
      expect(rbcEvent.resource.travelTime).toBe(0)
      expect(rbcEvent.resource.preparationTime).toBe(0)
    })

    it('should return null for null input', () => {
      const rbcEvent = toRBCEvent(null)
      expect(rbcEvent).toBeNull()
    })

    it('should return null for undefined input', () => {
      const rbcEvent = toRBCEvent(undefined)
      expect(rbcEvent).toBeNull()
    })

    it('should return null for invalid date format', () => {
      const event = {
        id: '6',
        title: 'Bad Date',
        day: 'invalid-date',
        startTime: '10:00',
        endTime: '11:00',
        type: 'task'
      }

      const rbcEvent = toRBCEvent(event)
      expect(rbcEvent).toBeNull()
    })

    it('should return null for invalid start time format', () => {
      const event = {
        id: '7',
        title: 'Bad Start Time',
        day: '2026-02-03',
        startTime: 'invalid-time',
        endTime: '11:00',
        type: 'task'
      }

      const rbcEvent = toRBCEvent(event)
      expect(rbcEvent).toBeNull()
    })

    it('should return null for invalid end time format', () => {
      const event = {
        id: '8',
        title: 'Bad End Time',
        day: '2026-02-03',
        startTime: '10:00',
        endTime: '25:00',
        type: 'task'
      }

      const rbcEvent = toRBCEvent(event)
      expect(rbcEvent).toBeNull()
    })
  })

  describe('toRBCEvents', () => {
    it('should convert array of events', () => {
      const events = [
        {
          id: '1',
          title: 'Event 1',
          day: '2026-02-03',
          startTime: '09:00',
          endTime: '10:00',
          type: 'task'
        },
        {
          id: '2',
          title: 'Event 2',
          day: '2026-02-03',
          startTime: '11:00',
          endTime: '12:00',
          type: 'meeting'
        }
      ]

      const rbcEvents = toRBCEvents(events)

      expect(rbcEvents).toHaveLength(2)
      expect(rbcEvents[0].id).toBe('1')
      expect(rbcEvents[1].id).toBe('2')
    })

    it('should filter out null results from conversion errors', () => {
      const events = [
        {
          id: '1',
          title: 'Good Event',
          day: '2026-02-03',
          startTime: '09:00',
          endTime: '10:00',
          type: 'task'
        },
        {
          id: '2',
          title: 'Bad Event',
          day: 'invalid-date',
          startTime: '11:00',
          endTime: '12:00',
          type: 'task'
        }
      ]

      const rbcEvents = toRBCEvents(events)

      expect(rbcEvents).toHaveLength(1)
      expect(rbcEvents[0].id).toBe('1')
    })

    it('should return empty array for non-array input', () => {
      expect(toRBCEvents(null)).toEqual([])
      expect(toRBCEvents(undefined)).toEqual([])
      expect(toRBCEvents('not an array')).toEqual([])
    })

    it('should return empty array for empty array', () => {
      expect(toRBCEvents([])).toEqual([])
    })
  })

  describe('createEventFromSlot', () => {
    it('should create event data from slot selection', () => {
      const slotInfo = {
        start: parseISO('2026-02-03T14:00:00'),
        end: parseISO('2026-02-03T15:00:00')
      }

      const eventData = createEventFromSlot(slotInfo)

      expect(eventData).toBeTruthy()
      expect(eventData.day).toBe('2026-02-03')
      expect(eventData.startTime).toBe('14:00')
      expect(eventData.endTime).toBe('15:00')
      expect(eventData.title).toBe('')
      expect(eventData.type).toBe('task')
      expect(eventData.travelTime).toBe(0)
      expect(eventData.preparationTime).toBe(0)
    })

    it('should return null for invalid slot info', () => {
      const eventData = createEventFromSlot(null)
      expect(eventData).toBeNull()
    })
  })

  describe('toFullCalendarEvent', () => {
    it('should convert a standard event to FullCalendar format', () => {
      const event = {
        id: '1',
        title: 'Test Event',
        day: '2026-02-03',
        startTime: '09:00',
        endTime: '10:00',
        type: 'task',
        travelTime: 0,
        preparationTime: 0
      }

      const fcEvent = toFullCalendarEvent(event)

      expect(fcEvent).toBeTruthy()
      expect(fcEvent.id).toBe('1')
      expect(fcEvent.title).toBe('Test Event')
      expect(fcEvent.start).toEqual(parseISO('2026-02-03T09:00:00'))
      expect(fcEvent.end).toEqual(parseISO('2026-02-03T10:00:00'))
      expect(fcEvent.classNames).toEqual(['event-task'])
      expect(fcEvent.extendedProps.type).toBe('task')
      expect(fcEvent.extendedProps.originalEvent).toEqual(event)
    })

    it('should handle events spanning midnight (23:00 to 01:00)', () => {
      const event = {
        id: '2',
        title: 'Late Night Event',
        day: '2026-02-03',
        startTime: '23:00',
        endTime: '01:00',
        type: 'meeting'
      }

      const fcEvent = toFullCalendarEvent(event)

      expect(fcEvent).toBeTruthy()
      expect(fcEvent.start.getHours()).toBe(23)
      expect(fcEvent.end.getHours()).toBe(1)
      expect(fcEvent.end.getDate()).toBe(fcEvent.start.getDate() + 1)
      expect(fcEvent.classNames).toEqual(['event-meeting'])
    })

    it('should handle events ending exactly at midnight', () => {
      const event = {
        id: '3',
        title: 'Until Midnight',
        day: '2026-02-03',
        startTime: '22:00',
        endTime: '00:00',
        type: 'routine'
      }

      const fcEvent = toFullCalendarEvent(event)

      expect(fcEvent).toBeTruthy()
      expect(fcEvent.start.getHours()).toBe(22)
      expect(fcEvent.end.getHours()).toBe(0)
      expect(fcEvent.end.getDate()).toBe(fcEvent.start.getDate() + 1)
      expect(fcEvent.classNames).toEqual(['event-routine'])
    })

    it('should include preparation and travel time in extendedProps', () => {
      const event = {
        id: '4',
        title: 'Event with Prep',
        day: '2026-02-03',
        startTime: '14:00',
        endTime: '15:00',
        type: 'meeting',
        preparationTime: 15,
        travelTime: 10
      }

      const fcEvent = toFullCalendarEvent(event)

      expect(fcEvent.extendedProps.preparationTime).toBe(15)
      expect(fcEvent.extendedProps.travelTime).toBe(10)
      expect(fcEvent.extendedProps.originalEvent).toEqual(event)
    })

    it('should handle missing optional fields', () => {
      const event = {
        id: '5',
        title: 'Minimal Event',
        day: '2026-02-03',
        startTime: '10:00',
        endTime: '11:00',
        type: 'task'
      }

      const fcEvent = toFullCalendarEvent(event)

      expect(fcEvent).toBeTruthy()
      expect(fcEvent.extendedProps.travelTime).toBe(0)
      expect(fcEvent.extendedProps.preparationTime).toBe(0)
    })

    it('should return null for null input', () => {
      const fcEvent = toFullCalendarEvent(null)
      expect(fcEvent).toBeNull()
    })

    it('should return null for undefined input', () => {
      const fcEvent = toFullCalendarEvent(undefined)
      expect(fcEvent).toBeNull()
    })

    it('should return null for invalid date format', () => {
      const event = {
        id: '6',
        title: 'Bad Date',
        day: 'invalid-date',
        startTime: '10:00',
        endTime: '11:00',
        type: 'task'
      }

      const fcEvent = toFullCalendarEvent(event)
      expect(fcEvent).toBeNull()
    })

    it('should return null for invalid start time format', () => {
      const event = {
        id: '7',
        title: 'Bad Start Time',
        day: '2026-02-03',
        startTime: 'invalid-time',
        endTime: '11:00',
        type: 'task'
      }

      const fcEvent = toFullCalendarEvent(event)
      expect(fcEvent).toBeNull()
    })

    it('should return null for invalid end time format', () => {
      const event = {
        id: '8',
        title: 'Bad End Time',
        day: '2026-02-03',
        startTime: '10:00',
        endTime: '25:00',
        type: 'task'
      }

      const fcEvent = toFullCalendarEvent(event)
      expect(fcEvent).toBeNull()
    })

    it('should handle different event types with correct classNames', () => {
      const types = ['task', 'meeting', 'routine', 'habit']
      
      types.forEach((type) => {
        const event = {
          id: `test-${type}`,
          title: `Test ${type}`,
          day: '2026-02-03',
          startTime: '10:00',
          endTime: '11:00',
          type
        }

        const fcEvent = toFullCalendarEvent(event)
        expect(fcEvent.classNames).toEqual([`event-${type}`])
      })
    })
  })

  describe('toFullCalendarEvents', () => {
    it('should convert array of events', () => {
      const events = [
        {
          id: '1',
          title: 'Event 1',
          day: '2026-02-03',
          startTime: '09:00',
          endTime: '10:00',
          type: 'task'
        },
        {
          id: '2',
          title: 'Event 2',
          day: '2026-02-03',
          startTime: '11:00',
          endTime: '12:00',
          type: 'meeting'
        }
      ]

      const fcEvents = toFullCalendarEvents(events)

      expect(fcEvents).toHaveLength(2)
      expect(fcEvents[0].id).toBe('1')
      expect(fcEvents[1].id).toBe('2')
      expect(fcEvents[0].classNames).toEqual(['event-task'])
      expect(fcEvents[1].classNames).toEqual(['event-meeting'])
    })

    it('should filter out null results from conversion errors', () => {
      const events = [
        {
          id: '1',
          title: 'Good Event',
          day: '2026-02-03',
          startTime: '09:00',
          endTime: '10:00',
          type: 'task'
        },
        {
          id: '2',
          title: 'Bad Event',
          day: 'invalid-date',
          startTime: '11:00',
          endTime: '12:00',
          type: 'task'
        }
      ]

      const fcEvents = toFullCalendarEvents(events)

      expect(fcEvents).toHaveLength(1)
      expect(fcEvents[0].id).toBe('1')
    })

    it('should return empty array for non-array input', () => {
      expect(toFullCalendarEvents(null)).toEqual([])
      expect(toFullCalendarEvents(undefined)).toEqual([])
      expect(toFullCalendarEvents('not an array')).toEqual([])
    })

    it('should return empty array for empty array', () => {
      expect(toFullCalendarEvents([])).toEqual([])
    })

    it('should handle events with all edge cases', () => {
      const events = [
        {
          id: '1',
          title: 'Normal Event',
          day: '2026-02-03',
          startTime: '09:00',
          endTime: '10:00',
          type: 'task'
        },
        {
          id: '2',
          title: 'Midnight Span',
          day: '2026-02-03',
          startTime: '23:30',
          endTime: '00:30',
          type: 'meeting'
        },
        null, // Should be filtered
        {
          id: '3',
          title: 'With Prep',
          day: '2026-02-03',
          startTime: '14:00',
          endTime: '15:00',
          type: 'meeting',
          preparationTime: 10,
          travelTime: 5
        }
      ]

      const fcEvents = toFullCalendarEvents(events.filter(e => e !== null))

      expect(fcEvents).toHaveLength(3)
      expect(fcEvents[1].end.getDate()).toBe(fcEvents[1].start.getDate() + 1)
      expect(fcEvents[2].extendedProps.preparationTime).toBe(10)
    })
  })
})
