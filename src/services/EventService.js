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
    const dateStr = this._normalizeDateString(date)
    return await getEventsForDay(dateStr)
  }

  /**
   * Get events for a week containing the reference date
   * @param {string|Date} referenceDate - Date within the desired week (defaults to today)
   * @returns {Promise<Array>} Array of events for the week
   */
  async getEventsForWeek(referenceDate = new Date()) {
    const { startDate, endDate } = this._getWeekRange(referenceDate)
    return await getEventsForRange(startDate, endDate)
  }

  /**
   * Get events for a custom date range
   * @param {string|Date} startDate - Start date (inclusive)
   * @param {string|Date} endDate - End date (inclusive)
   * @returns {Promise<Array>} Array of events in the range
   */
  async getEventsForRange(startDate, endDate) {
    const start = this._normalizeDateString(startDate)
    const end = this._normalizeDateString(endDate)
    return await getEventsForRange(start, end)
  }

  /**
   * Get events for N days starting from a date
   * @param {string|Date} startDate - Starting date
   * @param {number} days - Number of days
   * @returns {Promise<Array>} Array of events
   */
  async getEventsForDays(startDate, days) {
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(start.getDate() + days - 1)
    
    return await this.getEventsForRange(start, end)
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
    const allEvents = await getAll(STORES.SCHEDULE)
    const testEvents = allEvents.filter(event => event.isTestData === true)
    
    // Delete in parallel for better performance
    await Promise.all(testEvents.map(event => deleteById(STORES.SCHEDULE, event.id)))
    
    return testEvents.length
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
   * @private
   * @param {string|Date} referenceDate - Date within the week
   * @returns {{startDate: string, endDate: string}} Week range
   */
  _getWeekRange(referenceDate) {
    const date = new Date(referenceDate)
    
    // Get start of week (Sunday)
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    
    // Get end of week (Saturday)
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
