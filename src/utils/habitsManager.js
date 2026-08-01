/**
 * Habits Manager - Full implementation for TAB-HAB specifications
 * Manages habit tracking, streaks, XP, and persistence
 */

import { put, getAll, getById, deleteById, STORES } from './indexedDBManager'
import { normalizeEntity, updateMetadata } from './idGenerator'
import { createLogger } from './logger'
import dayjs from 'dayjs'
import { publishCrossTabEvent } from './crossTabSync'

const logger = createLogger('HabitsManager')
const EMPTY_DATE = '0000-00-00'

function notifyHabitsChanged(action) {
  publishCrossTabEvent({
    domain: 'habits',
    action,
    payload: { source: 'habitsManager' }
  })
}

/**
 * Create a new habit
 * TAB-HAB-06: New Habit modal fields
 * @param {object} habitData - Habit data
 * @returns {Promise<number>} Habit ID
 */
export async function createHabit(habitData) {
  // Validate required fields
  if (!habitData.name || habitData.name.trim() === '') {
    throw new Error('Habit name is required')
  }

  const newHabit = normalizeEntity({
    name: habitData.name,
    description: habitData.description || '',
    category: habitData.category || 'default',
    tags: habitData.tags || [],
    schedule: habitData.schedule || 'daily', // daily, weekly, custom
    customDays: habitData.customDays || [], // [0,1,2,3,4,5,6] for custom schedule
    startDate: habitData.startDate || dayjs().format('YYYY-MM-DD'),
    motivation: habitData.motivation || '',
    brainDumpLink: habitData.brainDumpLink || null,
    streak: habitData.streak ?? 0,
    longestStreak: habitData.longestStreak ?? 0,
    completions: habitData.completions || [], // Array of {date, timestamp}
    vacationDates: habitData.vacationDates || [],
    paused: habitData.paused ?? false,
    lastCompleted: habitData.lastCompleted || null
  })
  const id = await put(STORES.HABITS, newHabit)
  notifyHabitsChanged('created')
  return id
}

/**
 * Get all habits
 * @param {object} options - Filter and sort options
 * @returns {Promise<Array>} Array of habits
 */
export async function getHabits(options = {}) {
  const habits = filterHabits(await getAll(STORES.HABITS), options)
  return options.sortBy ? sortHabits(habits, options.sortBy) : sortByCreatedTime(habits)
}

/**
 * Get a single habit by ID
 * @param {number} id - Habit ID
 * @returns {Promise<object|null>} Habit or null
 */
export async function getHabit(id) {
  return await getById(STORES.HABITS, id)
}

/**
 * Update habit
 * @param {object} habit - Updated habit data
 * @returns {Promise<number>} Habit ID
 */
export async function updateHabit(habit) {
  const updatedHabit = updateMetadata(habit)
  const id = await put(STORES.HABITS, updatedHabit)
  notifyHabitsChanged('updated')
  return id
}

/**
 * Delete habit and its completion history
 * @param {number} id - Habit ID
 * @returns {Promise<void>}
 */
export async function deleteHabit(id) {
  await deleteById(STORES.HABITS, id)
  notifyHabitsChanged('deleted')
}

/**
 * Toggle habit completion for today
 * TAB-HAB-16: Tick animation and state updates
 * @param {number} id - Habit ID
 * @returns {Promise<object>} Result with XP and streak
 */
export async function toggleHabitToday(id) {
  const habit = await getHabitOrThrow(id)

  const today = dayjs().format('YYYY-MM-DD')
  const isCompletedToday = habit.lastCompleted === today

  if (isCompletedToday) {
    // Undo completion
    return await uncompleteHabit(id)
  } else {
    // Complete habit
    return await completeHabit(id)
  }
}

/**
 * Complete habit for today
 * TAB-HAB-20, TAB-HAB-21, TAB-HAB-22: XP calculation
 * @param {number} id - Habit ID
 * @returns {Promise<object>} Updated habit with XP and streak info
 */
export async function completeHabit(id) {
  const habit = await getHabitOrThrow(id)

  const today = dayjs().format('YYYY-MM-DD')

  // Don't complete if already done today
  if (habit.lastCompleted === today) {
    return {
      ...habit,
      xpEarned: 0,
      streak: habit.streak,
      message: 'Already completed today'
    }
  }

  // Calculate new streak
  const newStreak = calculateStreak(habit, today, true)

  // Update completions array
  const completions = habit.completions || []
  completions.push({
    date: today,
    timestamp: Date.now()
  })

  // Calculate XP earned
  const xpData = calculateXP(newStreak, habit.streak || 0)

  // Update habit
  const updatedHabit = await saveHabit({
    ...habit,
    streak: newStreak,
    longestStreak: Math.max(newStreak, habit.longestStreak || 0),
    lastCompleted: today,
    completions
  })

  return {
    ...updatedHabit,
    xpEarned: xpData.total,
    streak: newStreak,
    milestone: xpData.milestone,
    message: xpData.message
  }
}

/**
 * Undo habit completion for today
 * TAB-HAB-17: Undo functionality
 * @param {number} id - Habit ID
 * @returns {Promise<object>} Updated habit
 */
export async function uncompleteHabit(id) {
  const habit = await getHabitOrThrow(id)

  const today = dayjs().format('YYYY-MM-DD')

  // Remove today's completion
  const completions = (habit.completions || []).filter((c) => {
    const dateStr = typeof c === 'string' ? c : c.date
    return dateStr !== today
  })

  // Create updated habit for recalculation
  const habitForCalc = { ...habit, completions }

  // Recalculate streak
  const newStreak = calculateStreak(habitForCalc, null, false)

  const updatedHabit = await saveHabit({
    ...habit,
    streak: newStreak,
    lastCompleted:
      completions.length > 0
        ? typeof completions[completions.length - 1] === 'string'
          ? completions[completions.length - 1]
          : completions[completions.length - 1].date
        : null,
    completions
  })

  return {
    ...updatedHabit,
    streak: newStreak,
    message: 'Completion undone'
  }
}

/**
 * Calculate streak for a habit
 * @param {object} habit - Habit object
 * @param {string|null} includeDate - Date to include in calculation
 * @param {boolean} isNewCompletion - Whether this is a new completion
 * @returns {number} Current streak
 */
export function calculateStreak(
  habit,
  includeDate = null,
  isNewCompletion = false
) {
  const completions = habit.completions || []
  const vacationDates = habit.vacationDates || habit.vacationDays || []

  // Normalize completions to be date strings
  let datesToCheck = completions
    .map((c) => {
      if (typeof c === 'string') {
        return c
      } else if (c && c.date) {
        return c.date
      }
      return null
    })
    .filter((d) => d !== null)

  // If including new date, temporarily add it
  if (includeDate && isNewCompletion) {
    datesToCheck.push(includeDate)
  }

  // Sort by date descending
  datesToCheck.sort((a, b) => b.localeCompare(a))

  if (datesToCheck.length === 0) return 0

  let streak = 0
  let checkDate = dayjs()

  // Start from today and count backwards
  for (let i = 0; i < 365; i++) {
    // Max 365 days lookback
    const dateStr = checkDate.format('YYYY-MM-DD')
    const hasCompletion = datesToCheck.includes(dateStr)
    const isVacation = vacationDates.includes(dateStr)

    if (hasCompletion) {
      streak++
    } else if (isVacation) {
      // Vacation day - streak continues
    } else {
      // Streak broken
      break
    }

    checkDate = checkDate.subtract(1, 'day')
  }

  return streak
}

/**
 * Calculate XP earned for habit completion
 * TAB-HAB-20: Base XP (+1)
 * TAB-HAB-21: New streak threshold (+3 at 3 days)
 * TAB-HAB-22: Milestones (+2 at 7, 14, 28, 50, 100, 250, 500, 1000)
 * @param {number} newStreak - New streak count
 * @param {number} oldStreak - Previous streak count
 * @returns {object} XP breakdown
 */
export function calculateXP(newStreak, oldStreak) {
  let total = 1 // Base XP
  let milestone = null
  let message = 'Habit done. +1 XP' // TAB-HAB-23

  // New streak threshold (first time hitting 3 days)
  if (newStreak === 3 && oldStreak < 3) {
    total += 3
    message = 'Streak started! +4 XP'
  }

  // Milestone bonuses
  const milestones = [7, 14, 28, 50, 100, 250, 500, 1000]
  if (milestones.includes(newStreak)) {
    total += 2
    milestone = `${newStreak} Day Streak!`
    message = `Milestone reached! +${total} XP`
  }

  return { total, milestone, message }
}

/**
 * Pause/unpause habit
 * TAB-HAB-18: Pause functionality
 * @param {number} id - Habit ID
 * @param {boolean} paused - Pause state
 * @returns {Promise<object>} Updated habit
 */
export async function pauseHabit(id, paused) {
  return await saveHabit({
    ...(await getHabitOrThrow(id)),
    paused
  })
}

/**
 * Get today's stats for all active habits
 * TAB-HAB-10: Today panel stats
 * @returns {Promise<object>} Today's completion stats
 */
export async function getTodayStats() {
  const habits = await getHabits({ status: 'active' })
  const today = dayjs().format('YYYY-MM-DD')

  const completed = habits.filter((h) => h.lastCompleted === today).length
  const total = habits.length
  const percentage =
    total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0

  return {
    total,
    completed,
    percentage,
    remaining: total - completed
  }
}

/**
 * Get habit statistics
 * TAB-HAB-26: Detail drawer statistics
 * @param {number} id - Habit ID
 * @returns {Promise<object>} Habit statistics
 */
export async function getHabitStats(id) {
  const habit = await getHabitOrThrow(id)
  const completions = habit.completions || []
  const totalCompletions = completions.length

  // Calculate completion rate (last 30 days)
  const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
  const recentCompletions = completions.filter(
    (c) => c.date >= thirtyDaysAgo
  ).length
  const completionRate =
    recentCompletions > 0 ? Math.round((recentCompletions / 30) * 100) : 0

  return {
    id: habit.id,
    name: habit.name,
    streak: habit.streak || 0,
    longestStreak: habit.longestStreak || 0,
    totalCompletions,
    completionRate,
    lastCompleted: habit.lastCompleted,
    paused: habit.paused,
    createdAt: habit.createdAt,
    startDate: habit.startDate
  }
}

/**
 * Export habits data
 * TAB-HAB-42: Import/Export functionality
 * @returns {Promise<string>} Exported data as JSON string
 */
export async function exportHabits() {
  const habits = await getAll(STORES.HABITS)
  const exportData = {
    habits,
    exportDate: new Date().toISOString(),
    version: '1.0'
  }
  return JSON.stringify(exportData)
}

/**
 * Import habits data
 * TAB-HAB-43: Round-trip import/export
 * @param {string} jsonData - Import data as JSON string
 * @returns {Promise<object>} Import result
 */
export async function importHabits(jsonData) {
  let data
  try {
    data = JSON.parse(jsonData)
  } catch (error) {
    logger.error('Failed to parse import JSON:', error)
    throw new Error('Invalid JSON data')
  }

  if (!data.habits || !Array.isArray(data.habits)) {
    throw new Error('Invalid import data')
  }

  let imported = 0
  let skipped = 0
  const errors = []

  for (const habit of data.habits) {
    try {
      // Check if habit has an ID and if it already exists
      if (habit.id) {
        const existing = await getById(STORES.HABITS, habit.id)
        if (existing) {
          skipped++
          continue
        }
      }
      // Normalize the imported habit (generates new ID if needed)
      const normalized = normalizeEntity(habit)
      await put(STORES.HABITS, normalized)
      imported++
    } catch (error) {
      // If validation fails or other error, skip this habit
      errors.push({ habit: habit.name || 'unnamed', error: error.message })
      skipped++
    }
  }

  if (errors.length > 0) {
    logger.error('Import errors:', errors)
  }

  return { imported, skipped }
}

/**
 * Sort habits by a given field
 * @param {Array} habits - Array of habits
 * @param {string} sortBy - Field to sort by
 * @returns {Array} Sorted array of habits
 */
export function sortHabits(habits, sortBy) {
  const sorted = [...habits]

  switch (sortBy) {
    case 'title':
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'currentStreak':
    case 'streak':
      sorted.sort((a, b) => (b.streak || 0) - (a.streak || 0))
      break
    case 'longestStreak':
      sorted.sort((a, b) => (b.longestStreak || 0) - (a.longestStreak || 0))
      break
    case 'lastCompleted':
      sorted.sort((a, b) => {
        const dateA = a.lastCompleted || EMPTY_DATE
        const dateB = b.lastCompleted || EMPTY_DATE
        return dateB.localeCompare(dateA)
      })
      break
    case 'createdAt':
      sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      break
    default:
      break
  }

  return sorted
}

/**
 * Filter habits by criteria
 * @param {Array} habits - Array of habits
 * @param {object} filters - Filter criteria
 * @returns {Array} Filtered array of habits
 */
export function filterHabits(habits, filters = {}) {
  let filtered = [...habits]
  const today = filters.missedToday ? dayjs().format('YYYY-MM-DD') : null

  if (filters.category) {
    filtered = filtered.filter((h) => h.category === filters.category)
  }

  if (filters.tag) {
    filtered = filtered.filter((h) => h.tags && h.tags.includes(filters.tag))
  }

  if (filters.status === 'active') {
    filtered = filtered.filter((h) => !h.paused)
  } else if (filters.status === 'paused') {
    filtered = filtered.filter((h) => h.paused)
  }

  if (filters.minStreak) {
    filtered = filtered.filter((h) => h.streak >= filters.minStreak)
  }

  if (today) {
    filtered = filtered.filter((h) => h.lastCompleted !== today)
  }

  return filtered
}

/**
 * Toggle habit completion for today (alias for toggleHabitToday)
 * @param {number} id - Habit ID
 * @returns {Promise<object>} Result with XP and streak
 */
export function toggleCompletion(id) {
  return toggleHabitToday(id)
}

async function getHabitOrThrow(id) {
  const habit = await getById(STORES.HABITS, id)
  if (!habit) {
    throw new Error('Habit not found')
  }
  return habit
}

async function saveHabit(habit) {
  const updatedHabit = updateMetadata(habit)
  await put(STORES.HABITS, updatedHabit)
  notifyHabitsChanged('updated')
  return updatedHabit
}

function getHabitTime(habit) {
  if (Number.isFinite(habit.timestamp)) {
    return habit.timestamp
  }
  const createdTime = new Date(habit.createdAt).getTime()
  return Number.isFinite(createdTime) ? createdTime : 0
}

function sortByCreatedTime(habits) {
  return [...habits].sort((a, b) => getHabitTime(a) - getHabitTime(b))
}
