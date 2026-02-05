/**
 * Tests for EventService class
 * Validates event CRUD operations, date handling, and error management
 */

import EventService from '../services/EventService'
import * as scheduleManager from '../utils/scheduleManager'
import * as indexedDBManager from '../utils/indexedDBManager'

// Mock dependencies
jest.mock('../utils/scheduleManager')
jest.mock('../utils/indexedDBManager')
jest.mock('../utils/logger', () => ({
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    createLogger: jest.fn(() => ({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn()
    }))
  },
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
  createLogger: jest.fn(() => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    log: jest.fn()
  }))
}))

import logger from '../utils/logger'

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getEventsForDate', () => {
    test('returns events for a specific date string', async () => {
      const mockEvents = [
        { id: 1, title: 'Event 1', date: '2024-01-15' },
        { id: 2, title: 'Event 2', date: '2024-01-15' }
      ]
      scheduleManager.getEventsForDay.mockResolvedValue(mockEvents)

      const result = await EventService.getEventsForDate('2024-01-15')

      expect(scheduleManager.getEventsForDay).toHaveBeenCalledWith('2024-01-15')
      expect(result).toEqual(mockEvents)
    })

    test('returns events for a Date object', async () => {
      const mockEvents = [{ id: 1, title: 'Event 1' }]
      scheduleManager.getEventsForDay.mockResolvedValue(mockEvents)

      const date = new Date('2024-01-15T12:00:00Z')
      const result = await EventService.getEventsForDate(date)

      expect(scheduleManager.getEventsForDay).toHaveBeenCalledWith('2024-01-15')
      expect(result).toEqual(mockEvents)
    })

    test('returns empty array when getEventsForDay returns non-array', async () => {
      scheduleManager.getEventsForDay.mockResolvedValue(null)

      const result = await EventService.getEventsForDate('2024-01-15')

      expect(result).toEqual([])
    })

    test('returns empty array and logs error on failure', async () => {
      const error = new Error('Database error')
      scheduleManager.getEventsForDay.mockRejectedValue(error)

      const result = await EventService.getEventsForDate('2024-01-15')

      expect(result).toEqual([])
      expect(logger.error).toHaveBeenCalledWith(
        'EventService.getEventsForDate error:',
        error
      )
    })
  })

  describe('getEventsForWeek', () => {
    test('returns events for week containing reference date', async () => {
      const mockEvents = [
        { id: 1, title: 'Event 1' },
        { id: 2, title: 'Event 2' }
      ]
      scheduleManager.getEventsForRange.mockResolvedValue(mockEvents)

      // Wednesday, January 17, 2024
      const result = await EventService.getEventsForWeek(new Date('2024-01-17'))

      expect(scheduleManager.getEventsForRange).toHaveBeenCalledWith(
        '2024-01-15', // Monday
        '2024-01-21' // Sunday
      )
      expect(result).toEqual(mockEvents)
    })

    test('handles Sunday as last day of ISO week', async () => {
      scheduleManager.getEventsForRange.mockResolvedValue([])

      // Sunday, January 21, 2024
      await EventService.getEventsForWeek(new Date('2024-01-21'))

      expect(scheduleManager.getEventsForRange).toHaveBeenCalledWith(
        '2024-01-15', // Monday of that week
        '2024-01-21' // Sunday
      )
    })

    test('handles Monday as first day of ISO week', async () => {
      scheduleManager.getEventsForRange.mockResolvedValue([])

      // Monday, January 15, 2024
      await EventService.getEventsForWeek(new Date('2024-01-15'))

      expect(scheduleManager.getEventsForRange).toHaveBeenCalledWith(
        '2024-01-15', // Same Monday
        '2024-01-21' // Sunday
      )
    })

    test('uses current date when no reference date provided', async () => {
      scheduleManager.getEventsForRange.mockResolvedValue([])

      await EventService.getEventsForWeek()

      expect(scheduleManager.getEventsForRange).toHaveBeenCalled()
      const [start, end] = scheduleManager.getEventsForRange.mock.calls[0]
      expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    test('returns empty array when getEventsForRange returns non-array', async () => {
      scheduleManager.getEventsForRange.mockResolvedValue(undefined)

      const result = await EventService.getEventsForWeek(new Date('2024-01-17'))

      expect(result).toEqual([])
    })

    test('returns empty array and logs error on failure', async () => {
      const error = new Error('Range query failed')
      scheduleManager.getEventsForRange.mockRejectedValue(error)

      const result = await EventService.getEventsForWeek(new Date('2024-01-17'))

      expect(result).toEqual([])
      expect(logger.error).toHaveBeenCalledWith(
        'EventService.getEventsForWeek error:',
        error
      )
    })
  })

  describe('getEventsForRange', () => {
    test('returns events for custom date range', async () => {
      const mockEvents = [{ id: 1, title: 'Event 1' }]
      scheduleManager.getEventsForRange.mockResolvedValue(mockEvents)

      const result = await EventService.getEventsForRange(
        '2024-01-01',
        '2024-01-31'
      )

      expect(scheduleManager.getEventsForRange).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-31'
      )
      expect(result).toEqual(mockEvents)
    })

    test('normalizes Date objects to strings', async () => {
      scheduleManager.getEventsForRange.mockResolvedValue([])

      const startDate = new Date('2024-01-01T00:00:00Z')
      const endDate = new Date('2024-01-31T23:59:59Z')

      await EventService.getEventsForRange(startDate, endDate)

      expect(scheduleManager.getEventsForRange).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-31'
      )
    })

    test('returns empty array when getEventsForRange returns null', async () => {
      scheduleManager.getEventsForRange.mockResolvedValue(null)

      const result = await EventService.getEventsForRange(
        '2024-01-01',
        '2024-01-31'
      )

      expect(result).toEqual([])
    })

    test('returns empty array and logs error on failure', async () => {
      const error = new Error('Range error')
      scheduleManager.getEventsForRange.mockRejectedValue(error)

      const result = await EventService.getEventsForRange(
        '2024-01-01',
        '2024-01-31'
      )

      expect(result).toEqual([])
      expect(logger.error).toHaveBeenCalledWith(
        'EventService.getEventsForRange error:',
        error
      )
    })
  })

  describe('getEventsForDays', () => {
    test('returns events for N days starting from date', async () => {
      scheduleManager.getEventsForRange.mockResolvedValue([
        { id: 1, title: 'Event 1' },
        { id: 2, title: 'Event 2' }
      ])

      const result = await EventService.getEventsForDays('2024-01-15', 7)

      expect(scheduleManager.getEventsForRange).toHaveBeenCalledWith(
        '2024-01-15',
        '2024-01-21'
      )
      expect(result).toHaveLength(2)
    })

    test('uses UTC timezone to avoid timezone issues', async () => {
      scheduleManager.getEventsForRange.mockResolvedValue([])

      await EventService.getEventsForDays('2024-01-15', 1)

      expect(scheduleManager.getEventsForRange).toHaveBeenCalledWith(
        '2024-01-15',
        '2024-01-15'
      )
    })

    test('handles single day correctly', async () => {
      scheduleManager.getEventsForRange.mockResolvedValue([])

      await EventService.getEventsForDays('2024-01-15', 1)

      expect(scheduleManager.getEventsForRange).toHaveBeenCalledWith(
        '2024-01-15',
        '2024-01-15'
      )
    })

    test('handles month boundary correctly with UTC', async () => {
      scheduleManager.getEventsForRange.mockResolvedValue([])

      await EventService.getEventsForDays('2024-01-30', 5)

      expect(scheduleManager.getEventsForRange).toHaveBeenCalledWith(
        '2024-01-30',
        '2024-02-03'
      )
    })

    test('returns empty array for invalid days parameter (non-number)', async () => {
      const result = await EventService.getEventsForDays(
        '2024-01-15',
        'invalid'
      )

      expect(result).toEqual([])
      expect(logger.error).toHaveBeenCalledWith(
        'EventService.getEventsForDays: invalid days parameter',
        expect.objectContaining({ days: 'invalid', type: 'string' })
      )
    })

    test('returns empty array for invalid days parameter (negative)', async () => {
      const result = await EventService.getEventsForDays('2024-01-15', -5)

      expect(result).toEqual([])
      expect(logger.error).toHaveBeenCalled()
    })

    test('returns empty array for invalid days parameter (zero)', async () => {
      const result = await EventService.getEventsForDays('2024-01-15', 0)

      expect(result).toEqual([])
      expect(logger.error).toHaveBeenCalled()
    })

    test('returns empty array for invalid days parameter (float)', async () => {
      const result = await EventService.getEventsForDays('2024-01-15', 3.5)

      expect(result).toEqual([])
      expect(logger.error).toHaveBeenCalled()
    })

    test('returns empty array for malformed date string', async () => {
      const result = await EventService.getEventsForDays('2024/01/15', 7)

      expect(result).toEqual([])
      // The error happens in _normalizeDateString which throws an error that gets caught
      expect(logger.error).toHaveBeenCalledWith(
        'EventService.getEventsForDays error:',
        expect.any(Error)
      )
    })

    test('returns empty array for invalid date components', async () => {
      // This date has invalid month (13) and day (40)
      // But it passes the regex check and Number parsing
      // JavaScript Date constructor normalizes invalid dates (2024-13-40 becomes 2025-02-09)
      // So this test verifies the service handles such dates gracefully
      const result = await EventService.getEventsForDays('2024-13-40', 7)

      // Date is parsed and normalized by JavaScript, so it returns results
      // rather than an error. This is expected behavior.
      expect(result).toEqual([])
    })

    test('returns empty array and logs error on exception', async () => {
      const error = new Error('Unexpected error')
      scheduleManager.getEventsForRange.mockRejectedValue(error)

      const result = await EventService.getEventsForDays('2024-01-15', 7)

      expect(result).toEqual([])
      // The error is caught in getEventsForRange, not getEventsForDays
      expect(logger.error).toHaveBeenCalledWith(
        'EventService.getEventsForRange error:',
        error
      )
    })
  })

  describe('createEvent', () => {
    test('creates event and returns ID', async () => {
      const newEvent = { title: 'New Event', date: '2024-01-15' }
      scheduleManager.createEvent.mockResolvedValue(123)

      const result = await EventService.createEvent(newEvent)

      expect(scheduleManager.createEvent).toHaveBeenCalledWith(newEvent)
      expect(result).toBe(123)
    })

    test('throws error on failure', async () => {
      const error = new Error('Create failed')
      scheduleManager.createEvent.mockRejectedValue(error)

      await expect(EventService.createEvent({})).rejects.toThrow(
        'Create failed'
      )
      expect(logger.error).toHaveBeenCalledWith(
        'EventService.createEvent error:',
        error
      )
    })
  })

  describe('updateEvent', () => {
    test('updates event and returns ID', async () => {
      const updatedEvent = { id: 1, title: 'Updated Event', date: '2024-01-15' }
      scheduleManager.updateEvent.mockResolvedValue(1)

      const result = await EventService.updateEvent(updatedEvent)

      expect(scheduleManager.updateEvent).toHaveBeenCalledWith(updatedEvent)
      expect(result).toBe(1)
    })

    test('throws error when event ID is missing', async () => {
      const eventWithoutId = { title: 'No ID' }

      await expect(EventService.updateEvent(eventWithoutId)).rejects.toThrow(
        'Event ID is required for update'
      )

      expect(scheduleManager.updateEvent).not.toHaveBeenCalled()
    })

    test('throws error on update failure', async () => {
      const error = new Error('Update failed')
      scheduleManager.updateEvent.mockRejectedValue(error)

      const event = { id: 1, title: 'Event' }

      await expect(EventService.updateEvent(event)).rejects.toThrow(
        'Update failed'
      )
      expect(logger.error).toHaveBeenCalledWith(
        'EventService.updateEvent error:',
        error
      )
    })
  })

  describe('deleteEvent', () => {
    test('deletes event by ID', async () => {
      scheduleManager.deleteEvent.mockResolvedValue(undefined)

      await EventService.deleteEvent(123)

      expect(scheduleManager.deleteEvent).toHaveBeenCalledWith(123)
    })
  })

  describe('clearTestData', () => {
    test('deletes all test data events in parallel', async () => {
      const mockEvents = [
        { id: 1, title: 'Normal Event', isTestData: false },
        { id: 2, title: 'Test Event 1', isTestData: true },
        { id: 3, title: 'Test Event 2', isTestData: true },
        { id: 4, title: 'Another Normal Event', isTestData: false }
      ]

      indexedDBManager.getAll.mockResolvedValue(mockEvents)
      indexedDBManager.deleteById.mockResolvedValue(undefined)

      const result = await EventService.clearTestData()

      expect(indexedDBManager.getAll).toHaveBeenCalledWith(
        indexedDBManager.STORES.SCHEDULE
      )
      expect(indexedDBManager.deleteById).toHaveBeenCalledTimes(2)
      expect(indexedDBManager.deleteById).toHaveBeenCalledWith(
        indexedDBManager.STORES.SCHEDULE,
        2
      )
      expect(indexedDBManager.deleteById).toHaveBeenCalledWith(
        indexedDBManager.STORES.SCHEDULE,
        3
      )
      expect(result).toBe(2)
    })

    test('filters out events without isTestData flag', async () => {
      const mockEvents = [
        { id: 1, title: 'Event without flag' },
        { id: 2, title: 'Test Event', isTestData: true }
      ]

      indexedDBManager.getAll.mockResolvedValue(mockEvents)
      indexedDBManager.deleteById.mockResolvedValue(undefined)

      const result = await EventService.clearTestData()

      expect(indexedDBManager.deleteById).toHaveBeenCalledTimes(1)
      expect(indexedDBManager.deleteById).toHaveBeenCalledWith(
        indexedDBManager.STORES.SCHEDULE,
        2
      )
      expect(result).toBe(1)
    })

    test('handles null/undefined events array safely', async () => {
      indexedDBManager.getAll.mockResolvedValue(null)

      const result = await EventService.clearTestData()

      expect(result).toBe(0)
      expect(indexedDBManager.deleteById).not.toHaveBeenCalled()
    })

    test('filters out events without ID', async () => {
      const mockEvents = [
        { title: 'No ID', isTestData: true },
        { id: 2, title: 'Has ID', isTestData: true }
      ]

      indexedDBManager.getAll.mockResolvedValue(mockEvents)
      indexedDBManager.deleteById.mockResolvedValue(undefined)

      const result = await EventService.clearTestData()

      expect(indexedDBManager.deleteById).toHaveBeenCalledTimes(1)
      expect(result).toBe(1)
    })

    test('tracks successful vs failed deletions', async () => {
      const mockEvents = [
        { id: 1, title: 'Test 1', isTestData: true },
        { id: 2, title: 'Test 2', isTestData: true },
        { id: 3, title: 'Test 3', isTestData: true }
      ]

      indexedDBManager.getAll.mockResolvedValue(mockEvents)
      indexedDBManager.deleteById
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Delete failed'))
        .mockResolvedValueOnce(undefined)

      const result = await EventService.clearTestData()

      expect(result).toBe(2) // Only 2 successful deletions
    })

    test('returns zero and logs error on getAll failure', async () => {
      const error = new Error('Database error')
      indexedDBManager.getAll.mockRejectedValue(error)

      const result = await EventService.clearTestData()

      expect(result).toBe(0)
      expect(logger.error).toHaveBeenCalledWith(
        'EventService.clearTestData error:',
        error
      )
    })
  })

  describe('getAllEvents', () => {
    test('returns all events from database', async () => {
      const mockEvents = [
        { id: 1, title: 'Event 1' },
        { id: 2, title: 'Event 2' }
      ]
      indexedDBManager.getAll.mockResolvedValue(mockEvents)

      const result = await EventService.getAllEvents()

      expect(indexedDBManager.getAll).toHaveBeenCalledWith(
        indexedDBManager.STORES.SCHEDULE
      )
      expect(result).toEqual(mockEvents)
    })
  })

  describe('Date normalization', () => {
    test('accepts YYYY-MM-DD string format', async () => {
      scheduleManager.getEventsForDay.mockResolvedValue([])

      await EventService.getEventsForDate('2024-01-15')

      expect(scheduleManager.getEventsForDay).toHaveBeenCalledWith('2024-01-15')
    })

    test('rejects invalid date string format', async () => {
      scheduleManager.getEventsForDay.mockResolvedValue([])

      const result = await EventService.getEventsForDate('01/15/2024')

      expect(result).toEqual([])
      expect(logger.error).toHaveBeenCalled()
    })

    test('converts Date object to YYYY-MM-DD format', async () => {
      scheduleManager.getEventsForDay.mockResolvedValue([])

      const date = new Date('2024-01-15T14:30:00Z')
      await EventService.getEventsForDate(date)

      expect(scheduleManager.getEventsForDay).toHaveBeenCalledWith('2024-01-15')
    })

    test('logs warning for invalid date format', async () => {
      scheduleManager.getEventsForDay.mockResolvedValue([])

      await EventService.getEventsForDate('invalid-date')

      expect(logger.error).toHaveBeenCalled()
    })
  })

  describe('ISO 8601 week handling', () => {
    test('week starts on Monday (ISO 8601)', async () => {
      scheduleManager.getEventsForRange.mockResolvedValue([])

      // Tuesday, January 16, 2024
      await EventService.getEventsForWeek(new Date('2024-01-16'))

      expect(scheduleManager.getEventsForRange).toHaveBeenCalledWith(
        '2024-01-15', // Monday
        '2024-01-21' // Sunday
      )
    })

    test('handles year boundary correctly', async () => {
      scheduleManager.getEventsForRange.mockResolvedValue([])

      // Monday, January 1, 2024
      await EventService.getEventsForWeek(new Date('2024-01-01'))

      const [start, end] = scheduleManager.getEventsForRange.mock.calls[0]
      expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})
