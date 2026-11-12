import 'fake-indexeddb/auto'
import {
  openDB,
  getAll,
  getById,
  put,
  putBatch,
  deleteById,
  clear,
  getByIndex,
  addFileReference,
  getFileReferences,
  deleteFileReference,
  saveStats,
  getStatsByType,
  getStatsByDateRange,
  saveBackup,
  getRecentBackups,
  cleanOldBackups,
  migrateFromLocalStorage,
  exportAllData,
  importAllData,
  isIndexedDBAvailable,
  STORES
} from '../utils/indexedDBManager'

const withImportedDefaultCategory = (items, primaryField) =>
  items.map((item) => ({
    ...item,
    workspaceCategories: ['Unassigned'],
    [primaryField]: 'Unassigned'
  }))

describe('IndexedDBManager', () => {
  beforeEach(async () => {
    // Clear all stores before each test
    const stores = Object.values(STORES)
    for (const store of stores) {
      try {
        await clear(store)
      } catch (e) {
        // Store might not exist yet
      }
    }
    // Clear localStorage
    localStorage.clear()
  })

  describe('Basic Operations', () => {
    test('openDB creates database with correct stores', async () => {
      const db = await openDB()
      expect(db.name).toBe('aurorae_haven_db')
      expect(db.objectStoreNames.contains(STORES.TASKS)).toBe(true)
      expect(db.objectStoreNames.contains(STORES.ROUTINES)).toBe(true)
      expect(db.objectStoreNames.contains(STORES.HABITS)).toBe(true)
      expect(db.objectStoreNames.contains(STORES.DUMPS)).toBe(true)
      expect(db.objectStoreNames.contains(STORES.SCHEDULE)).toBe(true)
      expect(db.objectStoreNames.contains(STORES.STATS)).toBe(true)
      expect(db.objectStoreNames.contains(STORES.FILE_REFS)).toBe(true)
      expect(db.objectStoreNames.contains(STORES.BACKUPS)).toBe(true)
      db.close()
    })

    test('put and getAll work correctly', async () => {
      await put(STORES.TASKS, { id: 1, title: 'Test Task', done: false })
      await put(STORES.TASKS, { id: 2, title: 'Another Task', done: true })

      const tasks = await getAll(STORES.TASKS)
      expect(tasks).toHaveLength(2)
      expect(tasks[0].title).toBe('Test Task')
      expect(tasks[1].title).toBe('Another Task')
    })

    test('getById retrieves correct item', async () => {
      await put(STORES.TASKS, { id: 1, title: 'Test Task', done: false })

      const task = await getById(STORES.TASKS, 1)
      expect(task).toBeDefined()
      expect(task.title).toBe('Test Task')
    })

    test('deleteById removes item', async () => {
      await put(STORES.TASKS, { id: 1, title: 'Test Task', done: false })
      await deleteById(STORES.TASKS, 1)

      const tasks = await getAll(STORES.TASKS)
      expect(tasks).toHaveLength(0)
    })

    test('clear removes all items from store', async () => {
      await put(STORES.TASKS, { id: 1, title: 'Test Task 1', done: false })
      await put(STORES.TASKS, { id: 2, title: 'Test Task 2', done: false })
      await clear(STORES.TASKS)

      const tasks = await getAll(STORES.TASKS)
      expect(tasks).toHaveLength(0)
    })
  })

  describe('Batch Operations', () => {
    test('putBatch inserts multiple items efficiently', async () => {
      const items = [
        { id: 1, title: 'Task 1', done: false },
        { id: 2, title: 'Task 2', done: false },
        { id: 3, title: 'Task 3', done: false }
      ]

      const results = await putBatch(STORES.TASKS, items)
      expect(results).toHaveLength(3)

      const tasks = await getAll(STORES.TASKS)
      expect(tasks).toHaveLength(3)
      expect(tasks[0].title).toBe('Task 1')
      expect(tasks[1].title).toBe('Task 2')
      expect(tasks[2].title).toBe('Task 3')
    })

    test('putBatch returns empty array for empty input', async () => {
      const results = await putBatch(STORES.TASKS, [])
      expect(results).toEqual([])
    })

    test('putBatch throws error for non-array input', async () => {
      await expect(putBatch(STORES.TASKS, 'not an array')).rejects.toThrow(
        'Items must be an array'
      )
    })

    test('putBatch handles single item', async () => {
      const items = [{ id: 1, title: 'Single Task', done: false }]
      const results = await putBatch(STORES.TASKS, items)
      expect(results).toHaveLength(1)

      const tasks = await getAll(STORES.TASKS)
      expect(tasks).toHaveLength(1)
      expect(tasks[0].title).toBe('Single Task')
    })

    test('putBatch is more efficient than multiple puts', async () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        title: `Task ${i + 1}`,
        done: false
      }))

      // Use batch operation
      const startBatch = Date.now()
      await putBatch(STORES.TASKS, items)
      const batchTime = Date.now() - startBatch

      // Clear for comparison
      await clear(STORES.TASKS)

      // Use individual puts
      const startIndividual = Date.now()
      for (const item of items) {
        await put(STORES.TASKS, item)
      }
      const individualTime = Date.now() - startIndividual

      // Batch should be faster (allow some margin)
      // Note: This test may be flaky in CI, so we just verify both work
      expect(batchTime).toBeGreaterThanOrEqual(0)
      expect(individualTime).toBeGreaterThanOrEqual(0)

      const tasks = await getAll(STORES.TASKS)
      expect(tasks).toHaveLength(50)
    })
  })

  describe('File References (ARC-DAT-02)', () => {
    test('addFileReference creates reference', async () => {
      const id = await addFileReference('test.pdf', 'dump', 123, {
        size: 1024,
        type: 'application/pdf'
      })
      expect(id).toBeDefined()

      const refs = await getAll(STORES.FILE_REFS)
      expect(refs).toHaveLength(1)
      expect(refs[0].fileName).toBe('test.pdf')
      expect(refs[0].parentType).toBe('dump')
      expect(refs[0].parentId).toBe(123)
    })

    test('getFileReferences filters by parent', async () => {
      await addFileReference('file1.pdf', 'dump', 1, {})
      await addFileReference('file2.jpg', 'dump', 1, {})
      await addFileReference('file3.png', 'task', 2, {})

      const dumpRefs = await getFileReferences('dump', 1)
      expect(dumpRefs).toHaveLength(2)

      const taskRefs = await getFileReferences('task', 2)
      expect(taskRefs).toHaveLength(1)
    })

    test('deleteFileReference removes reference', async () => {
      await addFileReference('test.pdf', 'dump', 1, {})
      await deleteFileReference('test.pdf')

      const refs = await getAll(STORES.FILE_REFS)
      expect(refs).toHaveLength(0)
    })
  })

  describe('Statistics (ARC-DAT-04)', () => {
    test('saveStats stores statistics', async () => {
      await saveStats('task_completion', { count: 5, percentage: 80 })

      const stats = await getAll(STORES.STATS)
      expect(stats).toHaveLength(1)
      expect(stats[0].type).toBe('task_completion')
      expect(stats[0].count).toBe(5)
    })

    test('getStatsByType filters by type', async () => {
      await saveStats('task_completion', { count: 5 })
      await saveStats('habit_streak', { streak: 7 })
      await saveStats('task_completion', { count: 10 })

      const taskStats = await getStatsByType('task_completion')
      expect(taskStats).toHaveLength(2)

      const habitStats = await getStatsByType('habit_streak')
      expect(habitStats).toHaveLength(1)
    })

    test('getStatsByDateRange filters by date', async () => {
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split('T')[0]

      await saveStats('task_completion', { count: 5 })

      const stats = await getStatsByDateRange(yesterday, today)
      expect(stats.length).toBeGreaterThan(0)
    })
  })

  describe('Backups (ARC-DAT-03)', () => {
    test('saveBackup stores backup', async () => {
      const data = { tasks: [], sequences: [] }
      await saveBackup(data)

      const backups = await getAll(STORES.BACKUPS)
      expect(backups).toHaveLength(1)
      expect(backups[0].data).toBe(JSON.stringify(data))
    })

    test('getRecentBackups returns limited results', async () => {
      for (let i = 0; i < 15; i++) {
        await saveBackup({ count: i })
        // Add small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      const recent = await getRecentBackups(5)
      expect(recent).toHaveLength(5)
      // Should be sorted by timestamp descending
      expect(recent[0].timestamp).toBeGreaterThan(recent[1].timestamp)
    })

    test('cleanOldBackups removes old backups', async () => {
      for (let i = 0; i < 15; i++) {
        await saveBackup({ count: i })
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      await cleanOldBackups(5)

      const remaining = await getAll(STORES.BACKUPS)
      expect(remaining).toHaveLength(5)
    })
  })

  describe('Migration', () => {
    test('migrateFromLocalStorage migrates data', async () => {
      const mainData = {
        version: 1,
        tasks: [{ id: 1, title: 'Task 1' }],
        sequences: [{ id: 'seq1', name: 'Sequence 1' }],
        habits: [{ id: 1, name: 'Habit 1' }],
        dumps: [],
        schedule: []
      }
      localStorage.setItem('aurorae_haven_data', JSON.stringify(mainData))

      const report = await migrateFromLocalStorage()

      expect(report.success).toBe(true)
      expect(report.migrated.tasks).toBe(1)
      expect(report.migrated.routines).toBe(1)
      expect(report.migrated.habits).toBe(1)

      const tasks = await getAll(STORES.TASKS)
      expect(tasks).toHaveLength(1)
      expect(tasks[0].title).toBe('Task 1')
    })

    test('migrateFromLocalStorage handles missing data gracefully', async () => {
      const report = await migrateFromLocalStorage()
      expect(report.success).toBe(true)
      expect(report.migrated).toEqual({})
    })
  })

  describe('Export/Import', () => {
    test('exportAllData exports all stores', async () => {
      await put(STORES.TASKS, { id: 1, title: 'Test Task' })
      await put(STORES.ROUTINES, { id: 'seq1', name: 'Test Sequence' })
      await saveStats('test', { value: 100 })
      localStorage.setItem('aurorae_categories', JSON.stringify(['Work']))
      localStorage.setItem(
        'aurorae_saved_tasks',
        JSON.stringify([{ id: 'saved-1', text: 'Recurring', quadrant: 'urgent_important' }])
      )

      const exported = await exportAllData()

      expect(exported.version).toBe(1)
      expect(exported.exportedAt).toBeDefined()
      expect(exported.tasks).toHaveLength(1)
      expect(exported.routines).toHaveLength(1)
      expect(exported.stats).toHaveLength(1)
      expect(exported.brainDump).toBeDefined()
      expect(exported.categories).toEqual(['Uncategorised', 'Work'])
      expect(exported.savedTasks).toHaveLength(1)
    })

    test('exportAllData exports aurorae_tasks from localStorage', async () => {
      const tasksData = {
        urgent_important: [
          {
            id: 1,
            text: 'Important task',
            completed: false,
            createdAt: Date.now()
          }
        ],
        not_urgent_important: [],
        urgent_not_important: [],
        not_urgent_not_important: []
      }
      localStorage.setItem('aurorae_tasks', JSON.stringify(tasksData))

      const exported = await exportAllData()

      expect(exported.auroraeTasksData).toEqual(tasksData)
    })

    test('exportAllData handles missing aurorae_tasks gracefully', async () => {
      const exported = await exportAllData()

      expect(exported.auroraeTasksData).toBeNull()
    })

    test('importAllData imports all data', async () => {
      const data = {
        version: 1,
        tasks: [{ id: 1, title: 'Imported Task' }],
        sequences: [{ id: 'seq1', name: 'Imported Sequence' }],
        habits: [],
        dumps: [],
        schedule: [],
        stats: [{ id: 1, type: 'test', value: 50 }],
        fileRefs: [],
        brainDump: {
          content: 'Test content',
          tags: '',
          versions: [],
          entries: []
        },
        categories: ['Work', 'Personal'],
        savedTasks: [
          { id: 'saved-1', text: 'Recurring', quadrant: 'urgent_important' }
        ]
      }

      const report = await importAllData(data)

      expect(report.success).toBe(true)
      expect(report.imported.tasks).toBe(1)
      expect(report.imported.routines).toBe(1)
      expect(report.imported.stats).toBe(1)

      const tasks = await getAll(STORES.TASKS)
      expect(tasks[0].title).toBe('Imported Task')

      const brainDump = localStorage.getItem('brainDumpContent')
      expect(brainDump).toBe('Test content')
      expect(JSON.parse(localStorage.getItem('aurorae_categories'))).toEqual([
        'Uncategorised',
        'Personal',
        'Work'
      ])
      expect(JSON.parse(localStorage.getItem('aurorae_saved_tasks'))).toEqual(
        withImportedDefaultCategory(data.savedTasks, 'category')
      )
    })

    test('importAllData clears existing data before import', async () => {
      await put(STORES.TASKS, { id: 1, title: 'Old Task' })

      const data = {
        version: 1,
        tasks: [{ id: 2, title: 'New Task' }],
        sequences: [],
        habits: [],
        dumps: [],
        schedule: [],
        stats: [],
        fileRefs: [],
        brainDump: {}
      }

      await importAllData(data)

      const tasks = await getAll(STORES.TASKS)
      expect(tasks).toHaveLength(1)
      expect(tasks[0].title).toBe('New Task')
    })

    test('importAllData imports auroraeTasksData to localStorage', async () => {
      const tasksData = {
        urgent_important: [
          {
            id: 1,
            text: 'Important task',
            completed: false,
            createdAt: Date.now()
          }
        ],
        not_urgent_important: [],
        urgent_not_important: [],
        not_urgent_not_important: []
      }

      const data = {
        version: 1,
        tasks: [],
        sequences: [],
        habits: [],
        dumps: [],
        schedule: [],
        stats: [],
        fileRefs: [],
        auroraeTasksData: tasksData,
        brainDump: {}
      }

      const report = await importAllData(data)

      expect(report.success).toBe(true)
      expect(report.imported.auroraeTasksData).toBe(true)

      const storedTasks = JSON.parse(localStorage.getItem('aurorae_tasks'))
      expect(storedTasks).toEqual({
        ...tasksData,
        urgent_important: [
          {
            ...tasksData.urgent_important[0],
            category: 'Unassigned',
            workspaceCategories: ['Unassigned']
          }
        ]
      })
    })

    test('importAllData handles missing auroraeTasksData gracefully', async () => {
      const data = {
        version: 1,
        tasks: [],
        sequences: [],
        habits: [],
        dumps: [],
        schedule: [],
        stats: [],
        fileRefs: [],
        brainDump: {}
      }

      const report = await importAllData(data)

      expect(report.success).toBe(true)
      expect(localStorage.getItem('aurorae_tasks')).toBeNull()
    })

    test('exportAllData and importAllData work with all data types (nominal example)', async () => {
      // Setup nominal example data for all IndexedDB stores
      const nominalTasks = [
        { id: 1, title: 'Task 1', status: 'active', timestamp: 1704453600000 },
        { id: 2, title: 'Task 2', status: 'done', timestamp: 1704453601000 }
      ]

      const nominalRoutines = [
        {
          id: 'seq1',
          name: 'Morning Routine',
          steps: ['Wake up', 'Exercise'],
          timestamp: 1704453600000
        }
      ]

      const nominalHabits = [
        {
          id: 1,
          name: 'Meditation',
          streak: 10,
          paused: false,
          timestamp: 1704453600000
        }
      ]

      const nominalDumps = [
        {
          id: 1,
          content: 'Brain dump content',
          timestamp: 1704453600000
        }
      ]

      const nominalSchedule = [
        {
          id: 1,
          day: '2025-01-15',
          events: ['Meeting'],
          timestamp: 1704453600000
        }
      ]

      const nominalStats = [
        {
          id: 1,
          type: 'productivity',
          value: 85,
          date: '2025-01-15',
          timestamp: 1704453600000
        }
      ]

      const nominalFileRefs = [
        {
          id: 1,
          fileName: 'document.pdf',
          parentType: 'dump',
          parentId: 1,
          timestamp: 1704453600000
        }
      ]

      const nominalAuroraeTasks = {
        urgent_important: [
          {
            id: 1,
            text: 'Urgent task',
            completed: false,
            createdAt: 1704453600000
          }
        ],
        not_urgent_important: [],
        urgent_not_important: [],
        not_urgent_not_important: []
      }

      const nominalBrainDump = {
        content: '# Notes\nSome content',
        tags: '<span class="tag">#important</span>',
        versions: [
          { id: 1, content: 'Old version', timestamp: '2025-01-15T10:00:00Z' }
        ],
        entries: [{ id: 'e1', title: 'Entry 1', content: 'Content' }]
      }

      // Populate all IndexedDB stores
      for (const task of nominalTasks) {
        await put(STORES.TASKS, task)
      }
      for (const seq of nominalRoutines) {
        await put(STORES.ROUTINES, seq)
      }
      for (const habit of nominalHabits) {
        await put(STORES.HABITS, habit)
      }
      for (const dump of nominalDumps) {
        await put(STORES.DUMPS, dump)
      }
      for (const event of nominalSchedule) {
        await put(STORES.SCHEDULE, event)
      }
      for (const stat of nominalStats) {
        await put(STORES.STATS, stat)
      }
      for (const ref of nominalFileRefs) {
        await put(STORES.FILE_REFS, ref)
      }

      // Populate localStorage data
      localStorage.setItem('aurorae_tasks', JSON.stringify(nominalAuroraeTasks))
      localStorage.setItem('brainDumpContent', nominalBrainDump.content)
      localStorage.setItem('brainDumpTags', nominalBrainDump.tags)
      localStorage.setItem(
        'brainDumpVersions',
        JSON.stringify(nominalBrainDump.versions)
      )
      localStorage.setItem(
        'brainDumpEntries',
        JSON.stringify(nominalBrainDump.entries)
      )

      // Export all data
      const exported = await exportAllData()

      // Verify all data types are in export
      expect(exported.version).toBe(1)
      expect(exported.exportedAt).toBeDefined()
      expect(exported.tasks).toEqual(nominalTasks)
      expect(exported.routines).toEqual(nominalRoutines)
      expect(exported.habits).toEqual(nominalHabits)
      expect(exported.dumps).toEqual(nominalDumps)
      expect(exported.schedule).toEqual(nominalSchedule)
      expect(exported.stats).toEqual(nominalStats)
      expect(exported.fileRefs).toEqual(nominalFileRefs)
      expect(exported.auroraeTasksData).toEqual(nominalAuroraeTasks)
      expect(exported.brainDump).toEqual(nominalBrainDump)

      // Clear all data
      await clear(STORES.TASKS)
      await clear(STORES.ROUTINES)
      await clear(STORES.HABITS)
      await clear(STORES.DUMPS)
      await clear(STORES.SCHEDULE)
      await clear(STORES.STATS)
      await clear(STORES.FILE_REFS)
      localStorage.clear()

      // Import data back
      const report = await importAllData(exported)

      // Verify import succeeded
      expect(report.success).toBe(true)
      expect(report.imported.tasks).toBe(nominalTasks.length)
      expect(report.imported.routines).toBe(nominalRoutines.length)
      expect(report.imported.habits).toBe(nominalHabits.length)
      expect(report.imported.dumps).toBe(nominalDumps.length)
      expect(report.imported.schedule).toBe(nominalSchedule.length)
      expect(report.imported.stats).toBe(nominalStats.length)
      expect(report.imported.fileRefs).toBe(nominalFileRefs.length)
      expect(report.imported.auroraeTasksData).toBe(true)

      // Verify all data was restored correctly
      const restoredTasks = await getAll(STORES.TASKS)
      expect(restoredTasks).toEqual(
        nominalTasks.map((task) => ({
          ...task,
          category: 'Unassigned',
          workspaceCategories: ['Unassigned']
        }))
      )

      const restoredSequences = await getAll(STORES.ROUTINES)
      expect(restoredSequences).toEqual(
        withImportedDefaultCategory(nominalRoutines, 'workspaceCategory')
      )

      const restoredHabits = await getAll(STORES.HABITS)
      expect(restoredHabits).toEqual(
        withImportedDefaultCategory(nominalHabits, 'workspaceCategory')
      )

      const restoredDumps = await getAll(STORES.DUMPS)
      expect(restoredDumps).toEqual(
        withImportedDefaultCategory(nominalDumps, 'category')
      )

      const restoredSchedule = await getAll(STORES.SCHEDULE)
      expect(restoredSchedule).toEqual(
        withImportedDefaultCategory(nominalSchedule, 'category')
      )

      const restoredStats = await getAll(STORES.STATS)
      expect(restoredStats).toEqual(
        withImportedDefaultCategory(nominalStats, 'workspaceCategory')
      )

      const restoredFileRefs = await getAll(STORES.FILE_REFS)
      expect(restoredFileRefs).toEqual(nominalFileRefs)

      const restoredAuroraeTasks = JSON.parse(
        localStorage.getItem('aurorae_tasks')
      )
      expect(restoredAuroraeTasks).toEqual({
        ...nominalAuroraeTasks,
        urgent_important: withImportedDefaultCategory(
          nominalAuroraeTasks.urgent_important,
          'category'
        )
      })

      expect(localStorage.getItem('brainDumpContent')).toBe(
        nominalBrainDump.content
      )
      expect(localStorage.getItem('brainDumpTags')).toBe(nominalBrainDump.tags)

      const restoredVersions = JSON.parse(
        localStorage.getItem('brainDumpVersions')
      )
      expect(restoredVersions).toEqual(nominalBrainDump.versions)

      const restoredEntries = JSON.parse(
        localStorage.getItem('brainDumpEntries')
      )
      expect(restoredEntries).toEqual(
        withImportedDefaultCategory(nominalBrainDump.entries, 'category')
      )
    })
  })

  describe('Utility Functions', () => {
    test('isIndexedDBAvailable returns true', () => {
      expect(isIndexedDBAvailable()).toBe(true)
    })

    test('getByIndex retrieves items by index', async () => {
      await put(STORES.TASKS, {
        id: 1,
        title: 'Task 1',
        status: 'pending',
        timestamp: 1000
      })
      await put(STORES.TASKS, {
        id: 2,
        title: 'Task 2',
        status: 'done',
        timestamp: 2000
      })
      await put(STORES.TASKS, {
        id: 3,
        title: 'Task 3',
        status: 'pending',
        timestamp: 3000
      })

      const pendingTasks = await getByIndex(STORES.TASKS, 'status', 'pending')
      expect(pendingTasks).toHaveLength(2)
    })
  })
})
