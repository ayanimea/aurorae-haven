/**
 * Utilities for filtering and organizing notes in Brain Dump
 */

import { FILTER_RECENT_DAYS } from '../scheduleConstants'

// Number of days for "latest" filter
const LATEST_FILTER_DAYS = 7

// Month/year date indices
const MONTH_START_DAY = 1
const YEAR_START_MONTH = 0

/**
 * Apply date filter to a note
 * @param {Object} note - Note object with updatedAt property
 * @param {Object} filterOptions - Filter options object
 * @returns {boolean} - Whether the note matches the filter
 */
export function applyDateFilter(note, filterOptions) {
  const { dateFilter, customStart, customEnd } = filterOptions
  if (dateFilter === 'all') return true

  const noteDate = new Date(note.updatedAt)
  const now = new Date()

  switch (dateFilter) {
    case 'latest': {
      // Last 7 days
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - LATEST_FILTER_DAYS)
      return noteDate >= sevenDaysAgo
    }
    case 'oldest': {
      // Older than 30 days
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(now.getDate() - FILTER_RECENT_DAYS)
      return noteDate < thirtyDaysAgo
    }
    case 'year': {
      const startOfYear = new Date(
        now.getFullYear(),
        YEAR_START_MONTH,
        MONTH_START_DAY
      )
      return noteDate >= startOfYear
    }
    case 'month': {
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        MONTH_START_DAY
      )
      return noteDate >= startOfMonth
    }
    case 'day': {
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )
      return noteDate >= startOfDay
    }
    case 'custom': {
      if (!customStart && !customEnd) return true
      const start = customStart ? new Date(customStart) : new Date(0)
      const end = customEnd
        ? new Date(new Date(customEnd).setHours(23, 59, 59, 999))
        : new Date()
      return noteDate >= start && noteDate <= end
    }
    default:
      return true
  }
}

/**
 * Filter notes based on search query and date
 * @param {Array} notes - Array of note objects
 * @param {string} searchQuery - Text to search for
 * @param {Object} filterOptions - Filter options object
 * @returns {Array} - Filtered notes
 */
export function filterNotes(notes, searchQuery, filterOptions) {
  return notes.filter((note) => {
    // Search filter
    const query = searchQuery.toLowerCase()
    if (query) {
      const titleMatch = (note.title || '').toLowerCase().includes(query)
      const contentMatch = (note.content || '').toLowerCase().includes(query)
      if (!titleMatch && !contentMatch) return false
    }

    // Date filter
    return applyDateFilter(note, filterOptions)
  })
}
