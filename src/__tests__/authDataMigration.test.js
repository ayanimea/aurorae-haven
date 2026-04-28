import { vi } from 'vitest'

vi.mock('../utils/exportData', () => ({
  getDataTemplate: vi.fn()
}))

import {
  collectLocalDataForSync,
  hasLocalDataToMigrate
} from '../utils/authDataMigration'
import { getDataTemplate } from '../utils/exportData'

describe('authDataMigration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('collectLocalDataForSync', () => {
    test('returns all local data with migratedAt timestamp', async () => {
      getDataTemplate.mockResolvedValue({
        tasks: [{ id: '1', title: 'Task 1' }],
        routines: [],
        habits: [],
        dumps: [],
        schedule: []
      })

      const result = await collectLocalDataForSync()

      const parsedMigratedAt = Date.parse(result.migratedAt)

      expect(result.tasks).toHaveLength(1)
      expect(result.migratedAt).toBeDefined()
      expect(typeof result.migratedAt).toBe('string')
      // Should be a valid ISO date
      expect(Number.isNaN(parsedMigratedAt)).toBe(false)
      expect(new Date(parsedMigratedAt).toISOString()).toBe(result.migratedAt)
    })

    test('spreads all fields from getDataTemplate', async () => {
      const mockData = {
        tasks: [{ id: 't1' }],
        routines: [{ id: 'r1' }],
        habits: [{ id: 'h1' }],
        dumps: [{ id: 'd1' }],
        schedule: [{ id: 's1' }],
        version: 1
      }
      getDataTemplate.mockResolvedValue(mockData)

      const result = await collectLocalDataForSync()

      expect(result.tasks).toEqual(mockData.tasks)
      expect(result.routines).toEqual(mockData.routines)
      expect(result.habits).toEqual(mockData.habits)
      expect(result.dumps).toEqual(mockData.dumps)
      expect(result.schedule).toEqual(mockData.schedule)
      expect(result.version).toBe(1)
    })
  })

  describe('hasLocalDataToMigrate', () => {
    test('returns true when tasks exist', async () => {
      getDataTemplate.mockResolvedValue({
        tasks: [{ id: '1' }],
        routines: [],
        habits: [],
        dumps: [],
        schedule: []
      })

      expect(await hasLocalDataToMigrate()).toBe(true)
    })

    test('returns true when any collection has data', async () => {
      getDataTemplate.mockResolvedValue({
        tasks: [],
        routines: [],
        habits: [{ id: 'h1' }],
        dumps: [],
        schedule: []
      })

      expect(await hasLocalDataToMigrate()).toBe(true)
    })

    test('returns false when all collections are empty', async () => {
      getDataTemplate.mockResolvedValue({
        tasks: [],
        routines: [],
        habits: [],
        dumps: [],
        schedule: []
      })

      expect(await hasLocalDataToMigrate()).toBe(false)
    })

    test('returns false when collections are undefined', async () => {
      getDataTemplate.mockResolvedValue({})

      expect(await hasLocalDataToMigrate()).toBe(false)
    })
  })
})
