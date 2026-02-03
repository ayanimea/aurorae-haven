/**
 * EventService - Centralized event data access layer
 * Single source of truth for all schedule event operations
 */

import {
  createEvent as createEventDB,
  getEventsForDay,
  getEventsForRange,
  updateEvent as updateEventDB,
  deleteEvent as deleteEventDB
} from '../utils/scheduleManager'
import { STORES, getAll, deleteById } from '../utils/indexedDBManager'

/**
 * EventService class - Manages all event data operations
 * Provides consistent API for event CRUD operations across the application
 */
class EventService {
  /**
   * Get events for a specific date
   * @param {string|Date} date - Date to get events for
   * @returns {Promise<Array>} Array of events for the date
   */
  async getEventsForDate(date) {
    try {
      const dateStr = this._normalizeDateString(date)
      const events = await getEventsForDay(dateStr)
      return Array.isArray(events) ? events : []
    } catch (error) {
      console.error('EventService.getEventsForDate error:', error)
      return []
    }
  }

  /**
   * Get events for a week containing the reference date
   * @param {string|Date} referenceDate - Date within the desired week (defaults to today)
   * @returns {Promise<Array>} Array of events for the week
   */
  async getEventsForWeek(referenceDate = new Date()) {
    try {
      const { startDate, endDate } = this._getWeekRange(referenceDate)
      const events = await getEventsForRange(startDate, endDate)
      return Array.isArray(events) ? events : []
    } catch (error) {
      console.error('EventService.getEventsForWeek error:', error)
      return []
    }
  }

  /**
   * Get events for a custom date range
   * @param {string|Date} startDate - Start date (inclusive)
   * @param {string|Date} endDate - End date (inclusive)
   * @returns {Promise<Array>} Array of events in the range
   */
  async getEventsForRange(startDate, endDate) {
    try {
      const start = this._normalizeDateString(startDate)
      const end = this._normalizeDateString(endDate)
      const events = await getEventsForRange(start, end)
      return Array.isArray(events) ? events : []
    } catch (error) {
      console.error('EventService.getEventsForRange error:', error)
      return []
    }
  }

  /**
   * Get events for N days starting from a date
   * @param {string|Date} startDate - Starting date
   * @param {number} days - Number of days
   * @returns {Promise<Array>} Array of events
   */
  async getEventsForDays(startDate, days) {
    try {
      // Use dayjs or manual date manipulation to avoid timezone issues
      const startStr = this._normalizeDateString(startDate)
      const start = new Date(startStr + 'T00:00:00') // Add time to ensure local timezone
      const end = new Date(start)
      end.setDate(start.getDate() + days - 1)
      
      return await this.getEventsForRange(start, end)
    } catch (error) {
      console.error('EventService.getEventsForDays error:', error)
      return []
    }
  }

  /**
   * Create a new event
   * @param {object} event - Event data
   * @returns {Promise<number>} Event ID
   */
  async createEvent(event) {
    return await createEventDB(event)
  }

  /**
   * Update an existing event
   * @param {object} event - Updated event data (must include id)
   * @returns {Promise<number>} Event ID
   */
  async updateEvent(event) {
    if (!event.id) {
      throw new Error('Event ID is required for update')
    }
    return await updateEventDB(event)
  }

  /**
   * Delete an event by ID
   * @param {number} eventId - Event ID to delete
   * @returns {Promise<void>}
   */
  async deleteEvent(eventId) {
    return await deleteEventDB(eventId)
  }

  /**
   * Clear all test data events
   * @returns {Promise<number>} Number of events deleted
   */
  async clearTestData() {
    try {
      const allEvents = await getAll(STORES.SCHEDULE)
      const safeEvents = Array.isArray(allEvents) ? allEvents : []
      const testEvents = safeEvents.filter(event => event && event.isTestData === true)
      
      // Delete in parallel for better performance
      await Promise.all(
        testEvents
          .filter(event => event && typeof event.id !== 'undefined')
          .map(event => deleteById(STORES.SCHEDULE, event.id))
      )
      
      return testEvents.length
    } catch (error) {
      console.error('EventService.clearTestData error:', error)
      return 0
    }
  }

  /**
   * Get all events (use sparingly, prefer filtered methods)
   * @returns {Promise<Array>} All events
   */
  async getAllEvents() {
    return await getAll(STORES.SCHEDULE)
  }

  // ========== Private Helper Methods ==========

  /**
   * Normalize date to YYYY-MM-DD string format
   * @private
   * @param {string|Date} date - Date to normalize
   * @returns {string} Date string in YYYY-MM-DD format
   */
  _normalizeDateString(date) {
    if (typeof date === 'string') {
      // Already a string, validate format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`)
      }
      return date
    }
    
    // Convert Date object to string
    const d = date instanceof Date ? date : new Date(date)
    return d.toISOString().split('T')[0]
  }

  /**
   * Get start and end dates for week containing reference date
   * Uses ISO 8601 standard: weeks start on Monday
   * @private
   * @param {string|Date} referenceDate - Date within the week
   * @returns {{startDate: string, endDate: string}} Week range
   */
  _getWeekRange(referenceDate) {
    const date = new Date(referenceDate)
    
    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = date.getDay()
    
    // Convert to ISO 8601 (Monday = 0, Sunday = 6)
    const isoDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    
    // Get start of week (Monday)
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - isoDay)
    
    // Get end of week (Sunday)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    
    return {
      startDate: this._normalizeDateString(startOfWeek),
      endDate: this._normalizeDateString(endOfWeek)
    }
  }
}

// Export singleton instance
export default new EventService()
