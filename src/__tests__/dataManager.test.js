// Tests for data import/export functionality
import {
  getDataTemplate,
  exportJSON,
  importJSON,
  SCHEDULE_EVENT_TYPES
} from '../utils/dataManager'

describe('Data Manager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url')
    global.URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getDataTemplate', () => {
    it('should return a valid data structure with all required fields', async () => {
      const data = await getDataTemplate()

      // Data should include metadata
      expect(data.version).toBe(1)
      expect(typeof data.exportedAt).toBe('string')
      expect(data.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)

      // Data should include all data fields as arrays
      expect(Array.isArray(data.tasks)).toBe(true)
      expect(Array.isArray(data.sequences)).toBe(true)
      expect(Array.isArray(data.habits)).toBe(true)
      expect(Array.isArray(data.dumps)).toBe(true)
      expect(Array.isArray(data.schedule)).toBe(true)
      expect(Array.isArray(data.categories)).toBe(true)
    })

    it('should include the shared categories in exported data', async () => {
      localStorage.setItem(
        'aurorae_categories',
        JSON.stringify(['Work', 'Personal'])
      )

      const data = await getDataTemplate()

      expect(data.categories).toEqual(['Personal', 'Work'])
    })

    it('should include saved tasks in exported data', async () => {
      const savedTasks = [
        { id: 'saved-1', text: 'Recurring', quadrant: 'urgent_important' }
      ]
      localStorage.setItem('aurorae_saved_tasks', JSON.stringify(savedTasks))

      const data = await getDataTemplate()

      expect(data.savedTasks).toEqual(savedTasks)
    })

    it('should collect dumps (Brain Dump notes) from localStorage', async () => {
      const dumps = [
        {
          id: 'note_1',
          title: 'My Note',
          content: '# My Brain Dump\n\nSome notes here',
          category: 'ideas',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        }
      ]
      localStorage.setItem('dumps', JSON.stringify(dumps))

      const data = await getDataTemplate()

      expect(data.dumps).toEqual(dumps)
    })

    it('should handle invalid JSON in localStorage gracefully', async () => {
      localStorage.setItem('dumps', 'invalid json{')
      localStorage.setItem('tasks', 'also invalid')

      const data = await getDataTemplate()

      expect(Array.isArray(data.dumps)).toBe(true)
      expect(data.dumps).toHaveLength(0)
      expect(Array.isArray(data.tasks)).toBe(true)
      expect(data.tasks).toHaveLength(0)
    })

    it('should collect schedule data from localStorage', async () => {
      const schedule = [
        {
          day: '2025-01-15',
          blocks: [{ type: SCHEDULE_EVENT_TYPES.TASK, start: '09:00' }]
        }
      ]
      localStorage.setItem('schedule', JSON.stringify(schedule))

      const data = await getDataTemplate()

      expect(data.schedule).toEqual(schedule)
    })

    it('should collect tasks from localStorage', async () => {
      const tasksData = [
        {
          id: 1,
          text: 'Important task',
          quadrant: 'urgent_important',
          completed: false,
          createdAt: Date.now()
        }
      ]
      localStorage.setItem('tasks', JSON.stringify(tasksData))

      const data = await getDataTemplate()

      expect(data.tasks).toEqual(tasksData)
    })

    it('should collect sequences from localStorage', async () => {
      const sequences = [
        {
          id: 'seq-1',
          name: 'Morning Routine',
          steps: [{ id: 1, text: 'Wake up', duration: 5 }]
        }
      ]
      localStorage.setItem('sequences', JSON.stringify(sequences))

      const data = await getDataTemplate()

      expect(data.sequences).toEqual(sequences)
    })

    it('should collect habits from localStorage', async () => {
      const habits = [
        {
          id: 1,
          name: 'Exercise',
          streak: 5,
          paused: false
        }
      ]
      localStorage.setItem('habits', JSON.stringify(habits))

      const data = await getDataTemplate()

      expect(data.habits).toEqual(habits)
    })

    it('should include version and exportedAt metadata in exports', async () => {
      // Setup some test data
      localStorage.setItem('tasks', JSON.stringify([{ id: 1, text: 'Test' }]))
      localStorage.setItem('sequences', JSON.stringify([]))
      localStorage.setItem('habits', JSON.stringify([]))
      localStorage.setItem('dumps', JSON.stringify([]))
      localStorage.setItem('schedule', JSON.stringify([]))

      const data = await getDataTemplate()

      // Verify metadata is present
      expect(data).toHaveProperty('version')
      expect(data.version).toBe(1)
      expect(data).toHaveProperty('exportedAt')
      expect(typeof data.exportedAt).toBe('string')
      // Verify it's a valid ISO 8601 timestamp
      expect(new Date(data.exportedAt).toISOString()).toBe(data.exportedAt)

      // Verify data is still present
      expect(data.tasks).toEqual([{ id: 1, text: 'Test' }])
    })

    it('should include metadata even when no data exists', async () => {
      // Clear all localStorage
      localStorage.clear()

      const data = await getDataTemplate()

      // Metadata should still be present
      expect(data.version).toBe(1)
      expect(typeof data.exportedAt).toBe('string')

      // All data arrays should be empty
      expect(data.tasks).toEqual([])
      expect(data.sequences).toEqual([])
      expect(data.habits).toEqual([])
      expect(data.dumps).toEqual([])
      expect(data.schedule).toEqual([])
    })

    it('should export aurorae_tasks (Eisenhower matrix format)', async () => {
      // Setup tasks in Eisenhower matrix format (actual storage format)
      const auroraeTasksData = {
        urgent_important: [
          {
            id: '1',
            text: 'Important task',
            completed: false,
            createdAt: Date.now()
          }
        ],
        not_urgent_important: [
          {
            id: '2',
            text: 'Plan ahead',
            completed: false,
            createdAt: Date.now()
          }
        ],
        urgent_not_important: [],
        not_urgent_not_important: []
      }
      localStorage.setItem('aurorae_tasks', JSON.stringify(auroraeTasksData))

      const data = await getDataTemplate()

      // Should include the original Eisenhower format
      expect(data.auroraeTasksData).toEqual(auroraeTasksData)

      // Should also flatten to tasks array
      expect(data.tasks).toHaveLength(2)
      expect(data.tasks[0].text).toBe('Important task')
      expect(data.tasks[1].text).toBe('Plan ahead')
    })

    it('should export brainDumpEntries as dumps', async () => {
      // Setup brain dump entries (actual storage format for notes)
      const entries = [
        {
          id: 'note_1',
          title: 'My Note',
          content: '# Test Content',
          category: 'ideas',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(entries))

      const data = await getDataTemplate()

      // Should export as dumps
      expect(data.dumps).toEqual(entries)

      // Should also include brainDump metadata
      expect(data.brainDump).toHaveProperty('entries')
      expect(data.brainDump.entries).toEqual(entries)
    })

    it('should roundtrip aurorae_tasks through export and import', async () => {
      // Setup tasks in Eisenhower matrix format (actual storage)
      const auroraeTasksData = {
        urgent_important: [
          {
            id: '1',
            text: 'Critical task',
            completed: false,
            createdAt: Date.now()
          }
        ],
        not_urgent_important: [
          {
            id: '2',
            text: 'Important task',
            completed: false,
            createdAt: Date.now()
          }
        ],
        urgent_not_important: [],
        not_urgent_not_important: []
      }
      localStorage.setItem('aurorae_tasks', JSON.stringify(auroraeTasksData))

      // Export
      const exportedData = await getDataTemplate()

      // Verify export includes both formats
      expect(exportedData.auroraeTasksData).toEqual(auroraeTasksData)
      expect(exportedData.tasks).toHaveLength(2)

      // Clear and import
      localStorage.clear()
      const mockFile = new Blob([JSON.stringify(exportedData)], {
        type: 'application/json'
      })
      await importJSON(mockFile)

      // Verify import - should restore to dumps (not aurorae_tasks)
      // Note: Import stores to 'tasks' key, not 'aurorae_tasks'
      const importedTasks = JSON.parse(localStorage.getItem('tasks'))
      expect(importedTasks).toHaveLength(2)
    })
  })

  describe('exportJSON', () => {
    it('should create a blob and trigger download', async () => {
      const mockAppendChild = jest.fn()
      const mockRemove = jest.fn()
      const mockClick = jest.fn()

      document.body.appendChild = mockAppendChild
      global.document.createElement = jest.fn((tag) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: mockClick,
            remove: mockRemove,
            appendChild: jest.fn(),
            style: {}
          }
        }
        return {}
      })

      const result = await exportJSON()

      expect(result).toBe(true)
      expect(mockClick).toHaveBeenCalled()
      expect(mockRemove).toHaveBeenCalled()
      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalled()
    })

    it('should validate data before export', async () => {
      // Store some valid data
      const testData = {
        version: 1,
        tasks: [{ id: 1, title: 'Test' }],
        routines: [],
        habits: [],
        dumps: [],
        schedule: []
      }
      localStorage.setItem('aurorae_haven_data', JSON.stringify(testData))

      const mockAppendChild = jest.fn()
      const mockRemove = jest.fn()
      const mockClick = jest.fn()

      document.body.appendChild = mockAppendChild
      global.document.createElement = jest.fn((tag) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: mockClick,
            remove: mockRemove,
            appendChild: jest.fn(),
            style: {}
          }
        }
        return {}
      })

      // Should succeed with valid data
      const result = await exportJSON()
      expect(result).toBe(true)
    })
  })

  describe('importJSON', () => {
    it('should import valid JSON data', async () => {
      const testData = {
        tasks: [],
        routines: [],
        habits: [],
        dumps: [
          {
            id: 'note_1',
            title: 'Test Note',
            content: '# Test Content',
            category: 'ideas',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
          }
        ],
        schedule: []
      }

      // Mock FileReader for JSDOM
      const mockFile = new Blob([JSON.stringify(testData)], {
        type: 'application/json'
      })

      const result = await importJSON(mockFile)

      expect(result).toBe(true)
      const storedDumps = JSON.parse(localStorage.getItem('dumps'))
      expect(storedDumps).toEqual(testData.dumps)
    })

    it('should import dumps (Brain Dump notes)', async () => {
      const dumps = [
        {
          id: 'note_1',
          title: 'My Note',
          content: 'Version 1',
          category: 'ideas',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        }
      ]
      const testData = {
        tasks: [],
        routines: [],
        habits: [],
        dumps: dumps,
        schedule: []
      }

      const mockFile = new Blob([JSON.stringify(testData)], {
        type: 'application/json'
      })

      await importJSON(mockFile)

      const storedDumps = JSON.parse(localStorage.getItem('dumps'))
      expect(storedDumps).toEqual(dumps)
    })

    it('should import all data types successfully', async () => {
      const testData = {
        tasks: [{ id: 1, text: 'Task 1' }],
        routines: [{ id: 'seq-1', name: 'Sequence 1' }],
        habits: [{ id: 1, name: 'Habit 1' }],
        dumps: [{ id: 'note_1', title: 'Note 1', content: 'Content 1' }],
        schedule: [{ day: '2025-01-15', blocks: [] }]
      }

      const mockFile = new Blob([JSON.stringify(testData)], {
        type: 'application/json'
      })

      const result = await importJSON(mockFile)

      expect(result).toBe(true)
      expect(JSON.parse(localStorage.getItem('tasks'))).toEqual(testData.tasks)
      expect(JSON.parse(localStorage.getItem('routines'))).toEqual(
        testData.routines
      )
      expect(JSON.parse(localStorage.getItem('habits'))).toEqual(
        testData.habits
      )
      expect(JSON.parse(localStorage.getItem('dumps'))).toEqual(testData.dumps)
      expect(JSON.parse(localStorage.getItem('schedule'))).toEqual(
        testData.schedule
      )
    })

    it('should handle invalid JSON', async () => {
      const mockFile = new Blob(['invalid json{'], { type: 'application/json' })

      await expect(importJSON(mockFile)).rejects.toThrow('Import failed')
    })

    it('should handle missing data fields gracefully', async () => {
      const testData = {
        tasks: [],
        routines: []
        // Missing habits, dumps, schedule - should be fine as they're optional
      }

      const mockFile = new Blob([JSON.stringify(testData)], {
        type: 'application/json'
      })

      const result = await importJSON(mockFile)

      expect(result).toBe(true)
      // Data should be imported for provided fields
      expect(JSON.parse(localStorage.getItem('tasks'))).toEqual([])
      expect(JSON.parse(localStorage.getItem('routines'))).toEqual([])
    })

    it('should import schedule data', async () => {
      const schedule = [
        {
          day: '2025-01-15',
          blocks: [{ type: SCHEDULE_EVENT_TYPES.TASK, start: '09:00' }]
        }
      ]
      const testData = {
        tasks: [],
        routines: [],
        habits: [],
        dumps: [],
        schedule: schedule
      }

      const mockFile = new Blob([JSON.stringify(testData)], {
        type: 'application/json'
      })

      await importJSON(mockFile)

      const storedSchedule = JSON.parse(localStorage.getItem('schedule'))
      expect(storedSchedule).toEqual(schedule)
    })

    it('should import tasks array', async () => {
      const tasksData = [
        {
          id: 1,
          text: 'Important task',
          quadrant: 'urgent_important',
          completed: false,
          createdAt: Date.now()
        }
      ]
      const testData = {
        tasks: tasksData,
        routines: [],
        habits: [],
        dumps: [],
        schedule: []
      }

      const mockFile = new Blob([JSON.stringify(testData)], {
        type: 'application/json'
      })

      await importJSON(mockFile)

      const storedTasks = JSON.parse(localStorage.getItem('tasks'))
      expect(storedTasks).toEqual(tasksData)
    })

    it('should roundtrip export and import tasks correctly', async () => {
      const tasksData = [
        {
          id: 1,
          text: 'Do this now',
          quadrant: 'urgent_important',
          completed: false,
          createdAt: 1234567890
        },
        {
          id: 2,
          text: 'Plan this',
          quadrant: 'not_urgent_important',
          completed: false,
          createdAt: 1234567891
        }
      ]
      localStorage.setItem('tasks', JSON.stringify(tasksData))

      // Export
      const exportedData = await getDataTemplate()
      expect(exportedData.tasks).toEqual(tasksData)

      // Clear and import
      localStorage.clear()
      const mockFile = new Blob([JSON.stringify(exportedData)], {
        type: 'application/json'
      })
      await importJSON(mockFile)

      // Verify
      const importedTasks = JSON.parse(localStorage.getItem('tasks'))
      expect(importedTasks).toEqual(tasksData)
    })

    it('should export and import all data types with nominal example', async () => {
      // Setup nominal example data for all data types using new simple structure
      const nominalData = {
        tasks: [
          {
            id: 1,
            title: 'Sample task',
            quadrant: 'urgent_important',
            done: false,
            createdAt: 1704453600000
          }
        ],
        routines: [
          {
            id: 'seq1',
            name: 'Morning Routine',
            steps: [
              { id: 1, text: 'Wake up', duration: 5 },
              { id: 2, text: 'Exercise', duration: 20 }
            ]
          }
        ],
        habits: [
          {
            id: 1,
            name: 'Read daily',
            streak: 7,
            paused: false
          }
        ],
        dumps: [
          {
            id: 'note_1',
            title: 'Quick thought',
            content: '# My Notes',
            category: 'ideas',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
          }
        ],
        schedule: [
          {
            id: 1,
            day: '2025-01-15',
            blocks: [
              { type: SCHEDULE_EVENT_TYPES.TASK, start: '09:00', end: '10:00' }
            ]
          }
        ]
      }

      // Populate localStorage with all data types
      for (const [key, value] of Object.entries(nominalData)) {
        localStorage.setItem(key, JSON.stringify(value))
      }

      // Export all data
      const exportedData = await getDataTemplate()

      // Verify all data types are present in export
      expect(exportedData.tasks).toEqual(nominalData.tasks)
      expect(exportedData.routines).toEqual(nominalData.routines)
      expect(exportedData.habits).toEqual(nominalData.habits)
      expect(exportedData.dumps).toEqual(nominalData.dumps)
      expect(exportedData.schedule).toEqual(nominalData.schedule)

      // Clear all localStorage
      localStorage.clear()

      // Import the data back
      const mockFile = new Blob([JSON.stringify(exportedData)], {
        type: 'application/json'
      })
      const result = await importJSON(mockFile)

      // Verify import succeeded
      expect(result).toBe(true)

      // Verify all data types were restored
      expect(JSON.parse(localStorage.getItem('tasks'))).toEqual(
        nominalData.tasks
      )
      expect(JSON.parse(localStorage.getItem('routines'))).toEqual(
        nominalData.routines
      )
      expect(JSON.parse(localStorage.getItem('habits'))).toEqual(
        nominalData.habits
      )
      expect(JSON.parse(localStorage.getItem('dumps'))).toEqual(
        nominalData.dumps
      )
      expect(JSON.parse(localStorage.getItem('schedule'))).toEqual(
        nominalData.schedule
      )
    })

    describe('Export-Delete-Import sequences for all tabs', () => {
      it('should restore deleted dumps (Brain Dump notes) after import', async () => {
        // Setup initial data with multiple dump entries
        const initialDumps = [
          {
            id: 'note-1',
            title: 'Entry 1',
            content: 'Content 1',
            category: 'ideas',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
          },
          {
            id: 'note-2',
            title: 'Entry 2',
            content: 'Content 2',
            category: 'tasks',
            createdAt: '2025-01-02T00:00:00Z',
            updatedAt: '2025-01-02T00:00:00Z'
          },
          {
            id: 'note-3',
            title: 'Entry 3',
            content: 'Content 3',
            category: 'notes',
            createdAt: '2025-01-03T00:00:00Z',
            updatedAt: '2025-01-03T00:00:00Z'
          }
        ]
        localStorage.setItem('dumps', JSON.stringify(initialDumps))

        // Export
        const exportedData = await getDataTemplate()
        expect(exportedData.dumps).toEqual(initialDumps)

        // Delete note-2
        const afterDelete = initialDumps.filter((e) => e.id !== 'note-2')
        localStorage.setItem('dumps', JSON.stringify(afterDelete))
        expect(JSON.parse(localStorage.getItem('dumps') || '[]').length).toBe(2)

        // Import
        const mockFile = new Blob([JSON.stringify(exportedData)], {
          type: 'application/json'
        })
        await importJSON(mockFile)

        // Verify restoration
        const restored = JSON.parse(localStorage.getItem('dumps'))
        expect(restored.length).toBe(3)
        expect(restored.find((e) => e.id === 'note-2')).toEqual(initialDumps[1])
      })

      it('should restore deleted Tasks after import', async () => {
        // Setup initial tasks
        const initialTasks = [
          {
            id: 1,
            text: 'Task 1',
            quadrant: 'urgent_important',
            completed: false,
            createdAt: 1000
          },
          {
            id: 2,
            text: 'Task 2',
            quadrant: 'urgent_important',
            completed: false,
            createdAt: 2000
          },
          {
            id: 3,
            text: 'Task 3',
            quadrant: 'not_urgent_important',
            completed: false,
            createdAt: 3000
          },
          {
            id: 4,
            text: 'Task 4',
            quadrant: 'not_urgent_not_important',
            completed: true,
            createdAt: 4000
          }
        ]
        localStorage.setItem('tasks', JSON.stringify(initialTasks))

        // Export
        const exportedData = await getDataTemplate()
        expect(exportedData.tasks).toEqual(initialTasks)

        // Delete task 2
        const afterDelete = initialTasks.filter((t) => t.id !== 2)
        localStorage.setItem('tasks', JSON.stringify(afterDelete))

        // Import
        const mockFile = new Blob([JSON.stringify(exportedData)], {
          type: 'application/json'
        })
        await importJSON(mockFile)

        // Verify restoration
        const restored = JSON.parse(localStorage.getItem('tasks'))
        expect(restored.length).toBe(4)
        expect(restored.find((t) => t.id === 2)).toEqual(initialTasks[1])
      })

      it('should restore deleted Sequences after import', async () => {
        // Setup initial sequences
        const initialSequences = [
          {
            id: 'seq-1',
            name: 'Morning',
            steps: [
              { id: 1, text: 'Wake up', duration: 5 },
              { id: 2, text: 'Shower', duration: 10 }
            ]
          },
          {
            id: 'seq-2',
            name: 'Evening',
            steps: [{ id: 1, text: 'Dinner', duration: 30 }]
          }
        ]
        localStorage.setItem('sequences', JSON.stringify(initialSequences))

        // Export
        const exportedData = await getDataTemplate()
        expect(exportedData.sequences).toEqual(initialSequences)

        // Delete seq-1
        const afterDelete = [initialSequences[1]]
        localStorage.setItem('sequences', JSON.stringify(afterDelete))

        // Import
        const mockFile = new Blob([JSON.stringify(exportedData)], {
          type: 'application/json'
        })
        await importJSON(mockFile)

        // Verify restoration
        const restored = JSON.parse(localStorage.getItem('routines'))
        expect(restored.length).toBe(2)
        expect(restored.find((s) => s.id === 'seq-1')).toEqual(
          initialSequences[0]
        )
      })

      it('should restore deleted Habits after import', async () => {
        // Setup initial habits
        const initialHabits = [
          { id: 1, name: 'Exercise', streak: 5, paused: false },
          { id: 2, name: 'Read', streak: 10, paused: false },
          { id: 3, name: 'Meditate', streak: 3, paused: true }
        ]
        localStorage.setItem('habits', JSON.stringify(initialHabits))

        // Export
        const exportedData = await getDataTemplate()
        expect(exportedData.habits).toEqual(initialHabits)

        // Delete habit with id 2
        const afterDelete = initialHabits.filter((h) => h.id !== 2)
        localStorage.setItem('habits', JSON.stringify(afterDelete))

        // Import
        const mockFile = new Blob([JSON.stringify(exportedData)], {
          type: 'application/json'
        })
        await importJSON(mockFile)

        // Verify restoration
        const restored = JSON.parse(localStorage.getItem('habits'))
        expect(restored.length).toBe(3)
        expect(restored.find((h) => h.id === 2)).toEqual(initialHabits[1])
      })

      it('should restore deleted Schedule events after import', async () => {
        // Setup initial schedule
        const initialSchedule = [
          {
            id: 1,
            day: '2025-01-15',
            blocks: [
              { type: SCHEDULE_EVENT_TYPES.TASK, start: '09:00', end: '10:00' }
            ]
          },
          {
            id: 2,
            day: '2025-01-16',
            blocks: [
              {
                type: SCHEDULE_EVENT_TYPES.SEQUENCE,
                start: '10:00',
                end: '11:00'
              }
            ]
          }
        ]
        localStorage.setItem('schedule', JSON.stringify(initialSchedule))

        // Export
        const exportedData = await getDataTemplate()
        expect(exportedData.schedule).toEqual(initialSchedule)

        // Delete schedule event with id 1
        const afterDelete = [initialSchedule[1]]
        localStorage.setItem('schedule', JSON.stringify(afterDelete))

        // Import
        const mockFile = new Blob([JSON.stringify(exportedData)], {
          type: 'application/json'
        })
        await importJSON(mockFile)

        // Verify restoration
        const restored = JSON.parse(localStorage.getItem('schedule'))
        expect(restored.length).toBe(2)
        expect(restored.find((s) => s.id === 1)).toEqual(initialSchedule[0])
      })

      it('should restore all data types after deleting items from multiple tabs', async () => {
        // Setup comprehensive initial data using new simple structure
        const initialData = {
          tasks: [{ id: 1, text: 'Task 1', quadrant: 'urgent_important' }],
          routines: [{ id: 'seq-1', name: 'Sequence 1', steps: [] }],
          habits: [{ id: 1, name: 'Habit 1', streak: 5 }],
          dumps: [
            {
              id: 'note-1',
              title: 'Note 1',
              content: 'Content 1',
              category: 'ideas'
            }
          ],
          schedule: [{ id: 1, day: '2025-01-15', blocks: [] }]
        }

        // Set up localStorage with all data
        for (const [key, value] of Object.entries(initialData)) {
          localStorage.setItem(key, JSON.stringify(value))
        }

        // Export
        const exportedData = await getDataTemplate()

        // Delete items from all tabs
        for (const key of Object.keys(initialData)) {
          localStorage.setItem(key, JSON.stringify([]))
        }

        // Verify deletions
        expect(JSON.parse(localStorage.getItem('tasks'))).toHaveLength(0)
        expect(JSON.parse(localStorage.getItem('routines'))).toHaveLength(0)
        expect(JSON.parse(localStorage.getItem('dumps'))).toHaveLength(0)

        // Import
        const mockFile = new Blob([JSON.stringify(exportedData)], {
          type: 'application/json'
        })
        const result = await importJSON(mockFile)

        // Verify success
        expect(result).toBe(true)

        // Verify all data restored
        expect(JSON.parse(localStorage.getItem('tasks'))).toEqual(
          initialData.tasks
        )
        expect(JSON.parse(localStorage.getItem('routines'))).toEqual(
          initialData.routines
        )
        expect(JSON.parse(localStorage.getItem('habits'))).toEqual(
          initialData.habits
        )
        expect(JSON.parse(localStorage.getItem('dumps'))).toEqual(
          initialData.dumps
        )
        expect(JSON.parse(localStorage.getItem('schedule'))).toEqual(
          initialData.schedule
        )
      })
    })
  })
})
