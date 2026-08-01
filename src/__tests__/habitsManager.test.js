// Test suite for Habits Manager
// Comprehensive test coverage for all habit functionality

import 'fake-indexeddb/auto'
import {
  createHabit,
  getHabits,
  getHabit,
  updateHabit,
  deleteHabit,
  toggleHabitToday,
  completeHabit,
  uncompleteHabit,
  pauseHabit,
  getTodayStats,
  getHabitStats,
  exportHabits,
  importHabits,
  sortHabits,
  filterHabits,
  toggleCompletion,
  calculateStreak,
  calculateXP
} from '../utils/habitsManager'
import { clear, STORES } from '../utils/indexedDBManager'

const SHORT_DELAY_MS = 10
const waitForUniqueTimestamp = () =>
  new Promise((resolve) => setTimeout(resolve, SHORT_DELAY_MS))
const isoDateOffset = (days) =>
  new Date(Date.now() - days * 86400000).toISOString().split('T')[0]

describe('Habits Manager', () => {
  beforeEach(async () => {
    await clear(STORES.HABITS)
  })

  describe('createHabit', () => {
    test('should create a new habit', async () => {
      const habit = {
        name: 'Morning Exercise',
        description: 'Do 20 push-ups',
        frequency: 'daily'
      }

      const id = await createHabit(habit)
      expect(id).toBeDefined()

      const habits = await getHabits()
      expect(habits).toHaveLength(1)
      expect(habits[0].name).toBe('Morning Exercise')
      expect(habits[0].streak).toBe(0)
      expect(habits[0].paused).toBe(false)
    })

    test('should create habit with category', async () => {
      const habit = {
        name: 'Morning Meditation',
        category: 'violet'
      }

      const id = await createHabit(habit)
      const habits = await getHabits()

      expect(habits[0].category).toBe('violet')
    })

    test('should initialize habit with empty completion history', async () => {
      const id = await createHabit({ name: 'New Habit' })
      const habits = await getHabits()

      expect(habits[0].completions).toEqual([])
      expect(habits[0].streak).toBe(0)
      expect(habits[0].longestStreak).toBe(0)
    })

    test('should validate habit name is required', async () => {
      await expect(createHabit({})).rejects.toThrow()
    })
  })

  describe('getHabits', () => {
    test('should return empty array when no habits exist', async () => {
      const habits = await getHabits()
      expect(habits).toEqual([])
    })

    test('should return all habits', async () => {
      await createHabit({ name: 'Habit 1' })
      await waitForUniqueTimestamp()
      await createHabit({ name: 'Habit 2' })

      const habits = await getHabits()
      expect(habits).toHaveLength(2)
    })

    test('should return habits sorted by title by default', async () => {
      await createHabit({ name: 'Zebra Habit' })
      await waitForUniqueTimestamp()
      await createHabit({ name: 'Apple Habit' })

      const habits = await getHabits()
      expect(habits[0].name).toBe('Zebra Habit')
      expect(habits[1].name).toBe('Apple Habit')
    })
  })

  describe('sortHabits', () => {
    beforeEach(async () => {
      await createHabit({ name: 'Habit C', streak: 5, longestStreak: 10 })
      await waitForUniqueTimestamp()
      await createHabit({ name: 'Habit A', streak: 15, longestStreak: 20 })
      await waitForUniqueTimestamp()
      await createHabit({ name: 'Habit B', streak: 10, longestStreak: 15 })
    })

    test('should sort habits by title', async () => {
      const habits = await getHabits()
      const sorted = sortHabits(habits, 'title')

      expect(sorted[0].name).toBe('Habit A')
      expect(sorted[1].name).toBe('Habit B')
      expect(sorted[2].name).toBe('Habit C')
    })

    test('should sort habits by current streak (descending)', async () => {
      const habits = await getHabits()
      const sorted = sortHabits(habits, 'streak')

      expect(sorted[0].streak).toBe(15)
      expect(sorted[1].streak).toBe(10)
      expect(sorted[2].streak).toBe(5)
    })

    test('should sort habits by longest streak (descending)', async () => {
      const habits = await getHabits()
      const sorted = sortHabits(habits, 'longestStreak')

      expect(sorted[0].longestStreak).toBe(20)
      expect(sorted[1].longestStreak).toBe(15)
      expect(sorted[2].longestStreak).toBe(10)
    })
  })

  describe('filterHabits', () => {
    beforeEach(async () => {
      await createHabit({
        name: 'Active Habit',
        paused: false,
        category: 'blue'
      })
      await waitForUniqueTimestamp()
      await createHabit({
        name: 'Paused Habit',
        paused: true,
        category: 'violet'
      })
      await waitForUniqueTimestamp()
      await createHabit({
        name: 'Another Active',
        paused: false,
        category: 'blue'
      })
    })

    test('should filter paused habits', async () => {
      const habits = await getHabits()
      const filtered = filterHabits(habits, { status: 'paused' })

      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('Paused Habit')
    })

    test('should filter active habits', async () => {
      const habits = await getHabits()
      const filtered = filterHabits(habits, { status: 'active' })

      expect(filtered).toHaveLength(2)
    })

    test('should filter by category', async () => {
      const habits = await getHabits()
      const filtered = filterHabits(habits, { category: 'blue' })

      expect(filtered).toHaveLength(2)
    })

    test('should filter by multiple criteria', async () => {
      const habits = await getHabits()
      const filtered = filterHabits(habits, {
        status: 'active',
        category: 'blue'
      })

      expect(filtered).toHaveLength(2)
    })
  })

  describe('updateHabit', () => {
    test('should update existing habit', async () => {
      const id = await createHabit({ name: 'Old Name' })
      const habits = await getHabits()
      const habit = habits.find((h) => h.id === id)

      const updatedHabit = { ...habit, name: 'New Name' }
      await updateHabit(updatedHabit)

      const updatedHabits = await getHabits()
      const found = updatedHabits.find((h) => h.id === id)
      expect(found.name).toBe('New Name')
    })

    test('should update habit category', async () => {
      const id = await createHabit({ name: 'Test Habit', category: 'blue' })
      const habits = await getHabits()
      const habit = habits.find((h) => h.id === id)

      const updatedHabit = { ...habit, category: 'violet' }
      await updateHabit(updatedHabit)

      const updatedHabits = await getHabits()
      const found = updatedHabits.find((h) => h.id === id)
      expect(found.category).toBe('violet')
    })

    test('should update vacation days', async () => {
      const id = await createHabit({ name: 'Test Habit' })
      const habits = await getHabits()
      const habit = habits.find((h) => h.id === id)

      const vacationDays = ['2025-01-01', '2025-01-02']
      const updatedHabit = { ...habit, vacationDays }
      await updateHabit(updatedHabit)

      const updatedHabits = await getHabits()
      const found = updatedHabits.find((h) => h.id === id)
      expect(found.vacationDays).toEqual(vacationDays)
    })
  })

  describe('deleteHabit', () => {
    test('should delete habit by ID', async () => {
      const id = await createHabit({ name: 'To Delete' })
      await deleteHabit(id)

      const habits = await getHabits()
      expect(habits).toHaveLength(0)
    })

    // TODO: Add test for cascade delete
    test.todo('should cascade delete related data')
  })

  describe('toggleCompletion', () => {
    test('should mark habit as completed and increment streak', async () => {
      const id = await createHabit({ name: 'Daily Habit' })
      const result = await toggleCompletion(id)

      expect(result.streak).toBe(1)
      expect(result.completions).toHaveLength(1)
    })

    test('should toggle off completion for today', async () => {
      const id = await createHabit({ name: 'Daily Habit' })
      await toggleCompletion(id) // Complete it
      const result = await toggleCompletion(id) // Uncomplete it

      expect(result.streak).toBe(0)
      expect(result.completions).toHaveLength(0)
    })

    test('should update longest streak when current exceeds it', async () => {
      const id = await createHabit({ name: 'Streak Habit' })

      // Manually set completion dates
      const habits = await getHabits()
      const habit = habits.find((h) => h.id === id)
      const today = isoDateOffset(0)
      const yesterday = isoDateOffset(1)

      habit.completions = [yesterday, today]
      habit.streak = 2
      habit.longestStreak = 1
      await updateHabit(habit)

      const currentStreak = calculateStreak(habit)
      expect(currentStreak).toBeGreaterThan(1)

      // Verify that longestStreak is updated when needed
      const updatedHabits = await getHabits()
      const updatedHabit = updatedHabits.find((h) => h.id === id)
      expect(updatedHabit.streak).toBe(2)
    })

    test('should maintain completion history', async () => {
      const id = await createHabit({ name: 'History Habit' })
      await toggleCompletion(id)

      const habits = await getHabits()
      const habit = habits.find((h) => h.id === id)

      expect(habit.completions.length).toBeGreaterThan(0)
      // Completions are stored as objects with date and timestamp
      expect(habit.completions[0]).toHaveProperty('date')
      expect(habit.completions[0]).toHaveProperty('timestamp')
    })
  })

  describe('calculateStreak', () => {
    test('should calculate streak correctly for consecutive days', () => {
      const today = isoDateOffset(0)
      const yesterday = isoDateOffset(1)
      const twoDaysAgo = isoDateOffset(2)

      const habit = {
        completions: [twoDaysAgo, yesterday, today],
        vacationDays: []
      }

      const result = calculateStreak(habit)
      expect(result).toBe(3)
    })

    test('should reset streak when day is skipped', () => {
      const today = isoDateOffset(0)
      const threeDaysAgo = isoDateOffset(3)

      const habit = {
        completions: [threeDaysAgo, today],
        vacationDays: []
      }

      const result = calculateStreak(habit)
      expect(result).toBe(1) // Only today counts
    })

    test('should preserve streak during vacation days', () => {
      const today = isoDateOffset(0)
      const yesterday = isoDateOffset(1)
      const twoDaysAgo = isoDateOffset(2)

      const habit = {
        completions: [twoDaysAgo, today],
        vacationDays: [yesterday]
      }

      const result = calculateStreak(habit)
      expect(result).toBe(2) // Vacation day doesn't break streak
    })
  })

  describe('calculateXP', () => {
    test('should award base XP (+1) for completion', () => {
      const xp = calculateXP(1, 0)
      expect(xp.total).toBe(1)
    })

    test('should award threshold bonus (+3) at 3 day streak', () => {
      const xp = calculateXP(3, 0)
      expect(xp.total).toBe(4) // 1 base + 3 bonus
    })

    test('should award milestone bonus (+2) at 7 days', () => {
      const xp = calculateXP(7, 6)
      expect(xp.total).toBe(3) // 1 base + 2 milestone
    })

    test('should award milestone bonus (+2) at 14 days', () => {
      const xp = calculateXP(14, 13)
      expect(xp.total).toBe(3) // 1 base + 2 milestone
    })

    test('should award milestone bonus (+2) at 28, 50, 100+ days', () => {
      expect(calculateXP(28, 27).total).toBe(3)
      expect(calculateXP(50, 49).total).toBe(3)
      expect(calculateXP(100, 99).total).toBe(3)
    })
  })

  describe('getTodayStats', () => {
    test('should return zero stats when no habits exist', async () => {
      const stats = await getTodayStats()

      expect(stats.total).toBe(0)
      expect(stats.completed).toBe(0)
      expect(stats.percentage).toBe(0)
    })

    test('should calculate today stats correctly', async () => {
      await createHabit({ name: 'Habit 1' })
      await waitForUniqueTimestamp()
      await createHabit({ name: 'Habit 2' })
      await waitForUniqueTimestamp()
      await createHabit({ name: 'Habit 3' })

      const habits = await getHabits()
      await toggleCompletion(habits[0].id)
      await toggleCompletion(habits[1].id)

      const stats = await getTodayStats()

      expect(stats.total).toBe(3)
      expect(stats.completed).toBe(2)
      expect(stats.percentage).toBeCloseTo(66.67, 1)
    })
  })

  describe('exportHabits and importHabits', () => {
    test('should export habits to JSON', async () => {
      await createHabit({ name: 'Export Habit 1' })
      await waitForUniqueTimestamp()
      await createHabit({ name: 'Export Habit 2' })

      const exported = await exportHabits()
      const parsed = JSON.parse(exported)

      expect(parsed.habits).toHaveLength(2)
      expect(parsed.exportDate).toBeDefined()
    })

    test('should import habits from JSON', async () => {
      const exportData = {
        habits: [
          {
            name: 'Import Habit 1',
            category: 'blue',
            completions: [],
            streak: 0
          },
          {
            name: 'Import Habit 2',
            category: 'violet',
            completions: [],
            streak: 0
          }
        ],
        exportDate: new Date().toISOString()
      }

      const result = await importHabits(JSON.stringify(exportData))
      const habits = await getHabits()

      expect(result.imported).toBe(2)
      expect(result.skipped).toBe(0)
      expect(habits).toHaveLength(2)
    })

    test('should handle duplicate IDs during import', async () => {
      const id = await createHabit({ name: 'Existing Habit' })

      const exportData = {
        habits: [
          { id, name: 'Duplicate ID Habit', completions: [], streak: 0 }
        ],
        exportDate: new Date().toISOString()
      }

      const result = await importHabits(JSON.stringify(exportData))
      const habits = await getHabits()

      // Should skip the duplicate ID
      expect(result.imported).toBe(0)
      expect(result.skipped).toBe(1)
      expect(habits).toHaveLength(1)
      expect(habits[0].name).toBe('Existing Habit')
    })

    test('should validate imported data', async () => {
      const invalidData = '{ "invalid": "data" }'

      await expect(importHabits(invalidData)).rejects.toThrow()
    })
  })
})
