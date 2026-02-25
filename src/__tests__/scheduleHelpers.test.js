import { vi } from 'vitest'
import {
  getAllTasks,
  searchRoutinesAndTasks,
  getAllRoutinesAndTasks,
  instantiateRoutineFromTemplate,
  clusterEvents,
  assignColumns,
  addTaskToStorage
} from '../utils/scheduleHelpers'
import { getRoutines, createRoutine } from '../utils/routinesManager'
import { getAllTemplates } from '../utils/templatesManager'
import { getPredefinedTemplates } from '../utils/predefinedTemplates'

// Mock dependencies
vi.mock('../utils/routinesManager', () => ({
  getRoutines: vi.fn(),
  createRoutine: vi.fn()
}))

vi.mock('../utils/templatesManager', () => ({
  getAllTemplates: vi.fn()
}))

vi.mock('../utils/predefinedTemplates', () => ({
  getPredefinedTemplates: vi.fn()
}))

vi.mock('../utils/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    log: vi.fn(),
    info: vi.fn()
  })
}))

describe('scheduleHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('getAllTasks', () => {
    it('should return empty array when no tasks in localStorage', () => {
      const tasks = getAllTasks()
      expect(tasks).toEqual([])
    })

    it('should return all incomplete tasks from all quadrants', () => {
      const mockTasks = {
        urgent_important: [
          {
            id: '1',
            text: 'Task 1',
            completed: false,
            createdAt: '2025-01-01'
          },
          { id: '2', text: 'Task 2', completed: true, createdAt: '2025-01-01' }
        ],
        not_urgent_important: [
          { id: '3', text: 'Task 3', completed: false, createdAt: '2025-01-01' }
        ],
        urgent_not_important: [],
        not_urgent_not_important: [
          { id: '4', text: 'Task 4', completed: false, createdAt: '2025-01-01' }
        ]
      }

      localStorage.setItem('aurorae_tasks', JSON.stringify(mockTasks))

      const tasks = getAllTasks()
      expect(tasks).toHaveLength(3)
      expect(tasks.map((t) => t.id)).toEqual(['1', '3', '4'])
    })

    it('should prioritize important tasks', () => {
      const mockTasks = {
        urgent_important: [
          { id: '1', text: 'Urgent Important', completed: false }
        ],
        not_urgent_important: [
          { id: '2', text: 'Not Urgent Important', completed: false }
        ],
        urgent_not_important: [
          { id: '3', text: 'Urgent Not Important', completed: false }
        ],
        not_urgent_not_important: []
      }

      localStorage.setItem('aurorae_tasks', JSON.stringify(mockTasks))

      const tasks = getAllTasks()
      expect(tasks[0].isImportant).toBe(true)
      expect(tasks[0].priority).toBe(1)
      expect(tasks[1].isImportant).toBe(true)
      expect(tasks[1].priority).toBe(2)
      expect(tasks[2].isImportant).toBe(false)
    })

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('aurorae_tasks', 'invalid json')
      const tasks = getAllTasks()
      expect(tasks).toEqual([])
    })

    it('should include completed tasks when includeCompleted is true', () => {
      const mockTasks = {
        urgent_important: [
          {
            id: '1',
            text: 'Task 1',
            completed: false,
            createdAt: '2025-01-01'
          },
          { id: '2', text: 'Task 2', completed: true, createdAt: '2025-01-01' }
        ],
        not_urgent_important: [
          { id: '3', text: 'Task 3', completed: true, createdAt: '2025-01-01' }
        ],
        urgent_not_important: [],
        not_urgent_not_important: []
      }

      localStorage.setItem('aurorae_tasks', JSON.stringify(mockTasks))

      const tasks = getAllTasks({ includeCompleted: true })
      expect(tasks).toHaveLength(3)
      expect(tasks.map((t) => t.id)).toEqual(['1', '2', '3'])
    })

    it('should exclude completed tasks by default', () => {
      const mockTasks = {
        urgent_important: [
          {
            id: '1',
            text: 'Task 1',
            completed: false,
            createdAt: '2025-01-01'
          },
          { id: '2', text: 'Task 2', completed: true, createdAt: '2025-01-01' }
        ],
        not_urgent_important: [],
        urgent_not_important: [],
        not_urgent_not_important: []
      }

      localStorage.setItem('aurorae_tasks', JSON.stringify(mockTasks))

      const tasks = getAllTasks()
      expect(tasks).toHaveLength(1)
      expect(tasks[0].id).toBe('1')
    })
  })

  describe('searchRoutinesAndTasks', () => {
    beforeEach(() => {
      const mockTasks = {
        urgent_important: [
          { id: '1', text: 'Buy groceries', completed: false }
        ],
        not_urgent_important: [
          { id: '2', text: 'Plan vacation', completed: false }
        ],
        urgent_not_important: [],
        not_urgent_not_important: []
      }
      localStorage.setItem('aurorae_tasks', JSON.stringify(mockTasks))
    })

    it('should search routines by title', async () => {
      getRoutines.mockResolvedValue([
        { id: 'r1', title: 'Morning Routine', totalDuration: 1800 },
        { id: 'r2', title: 'Evening Routine', totalDuration: 900 }
      ])

      const results = await searchRoutinesAndTasks('morning', 'routine')
      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Morning Routine')
      expect(results[0].type).toBe('routine')
    })

    it('should search tasks by text', async () => {
      const results = await searchRoutinesAndTasks('groceries', 'task')
      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Buy groceries')
      expect(results[0].type).toBe('task')
    })

    it('should prioritize important tasks in results', async () => {
      getRoutines.mockResolvedValue([])
      const results = await searchRoutinesAndTasks('plan', null)
      expect(results[0].isImportant).toBe(true)
    })

    it('should be case-insensitive', async () => {
      getRoutines.mockResolvedValue([])
      const results = await searchRoutinesAndTasks('GROCERIES', 'task')
      expect(results).toHaveLength(1)
    })

    it('should search both routines and tasks when eventType is null', async () => {
      getRoutines.mockResolvedValue([
        { id: 'r1', name: 'Morning Launch', totalDuration: 1800 }
      ])

      const mockTasks = {
        urgent_important: [
          { id: '1', text: 'Launch product', completed: false }
        ],
        not_urgent_important: [],
        urgent_not_important: [],
        not_urgent_not_important: []
      }
      localStorage.setItem('aurorae_tasks', JSON.stringify(mockTasks))

      const results = await searchRoutinesAndTasks('launch', null)
      expect(results).toHaveLength(2)
      expect(results.some((r) => r.type === 'routine')).toBe(true)
      expect(results.some((r) => r.type === 'task')).toBe(true)
    })
  })

  describe('getAllRoutinesAndTasks', () => {
    it('should get all routines and tasks sorted by priority', async () => {
      getRoutines.mockResolvedValue([
        { id: 'r1', title: 'Routine 1', totalDuration: 1800 }
      ])

      const mockTasks = {
        urgent_important: [
          { id: '1', text: 'Important task', completed: false }
        ],
        not_urgent_important: [],
        urgent_not_important: [],
        not_urgent_not_important: [
          { id: '2', text: 'Low priority task', completed: false }
        ]
      }
      localStorage.setItem('aurorae_tasks', JSON.stringify(mockTasks))

      const results = await getAllRoutinesAndTasks(null)
      // Important task should be first
      expect(results[0].isImportant).toBe(true)
      expect(results[0].title).toBe('Important task')
      // Then low priority tasks
      expect(results[1].isImportant).toBe(false)
      // Then routines
      expect(results[2].type).toBe('routine')
    })

    it('should filter by eventType when specified', async () => {
      getRoutines.mockResolvedValue([
        { id: 'r1', title: 'Routine 1', totalDuration: 1800 }
      ])

      const results = await getAllRoutinesAndTasks('routine')
      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('routine')
    })
  })

  describe('Template search and instantiation', () => {
    beforeEach(() => {
      getAllTemplates.mockResolvedValue([])
      getPredefinedTemplates.mockReturnValue([])
    })

    it('should search templates when no routines found', async () => {
      getRoutines.mockResolvedValue([])
      getAllTemplates.mockResolvedValue([
        {
          id: 'template-1',
          type: 'routine',
          title: 'Morning Launch',
          estimatedDuration: 30,
          tags: ['morning'],
          steps: [{ label: 'Step 1', duration: 300 }]
        }
      ])
      getPredefinedTemplates.mockReturnValue([])

      const results = await searchRoutinesAndTasks('morning', 'routine')
      expect(results).toHaveLength(1)
      expect(results[0].isTemplate).toBe(true)
      expect(results[0].sourceType).toBe('template')
      expect(results[0].title).toBe('Morning Launch')
    })

    it('should search predefined templates when no routines found', async () => {
      getRoutines.mockResolvedValue([])
      getAllTemplates.mockResolvedValue([])
      getPredefinedTemplates.mockReturnValue([
        {
          id: 'predefined-1',
          type: 'routine',
          title: 'Quick Reset',
          estimatedDuration: 15,
          tags: ['break'],
          steps: []
        }
      ])

      const results = await searchRoutinesAndTasks('quick', 'routine')
      expect(results).toHaveLength(1)
      expect(results[0].isTemplate).toBe(true)
      expect(results[0].isPredefined).toBe(true)
      expect(results[0].sourceType).toBe('predefined-template')
    })

    it('should not search templates when routines are found', async () => {
      getRoutines.mockResolvedValue([
        { id: 'r1', title: 'Morning Routine', totalDuration: 1800 }
      ])

      const results = await searchRoutinesAndTasks('morning', 'routine')
      expect(results).toHaveLength(1)
      expect(results[0].isTemplate).toBeUndefined()
      // Templates should not be called if routines were found
      expect(getAllTemplates).not.toHaveBeenCalled()
    })

    it('should include templates in getAllRoutinesAndTasks when no routines', async () => {
      getRoutines.mockResolvedValue([])
      getAllTemplates.mockResolvedValue([
        {
          id: 'template-1',
          type: 'routine',
          title: 'Template Routine',
          estimatedDuration: 30,
          steps: []
        }
      ])
      getPredefinedTemplates.mockReturnValue([
        {
          id: 'predefined-1',
          type: 'routine',
          title: 'Predefined Routine',
          estimatedDuration: 20,
          steps: []
        }
      ])

      const results = await getAllRoutinesAndTasks('routine')
      expect(results.length).toBeGreaterThan(0)
      expect(results.some((r) => r.isTemplate)).toBe(true)
    })
  })

  describe('instantiateRoutineFromTemplate', () => {
    it('should create a routine from template', async () => {
      createRoutine.mockResolvedValue('new-routine-id')

      const template = {
        id: 'template-1',
        title: 'Morning Launch',
        steps: [
          { label: 'Wake up', duration: 300 },
          { label: 'Exercise', duration: 900 }
        ],
        tags: ['morning', 'energy'],
        energyTag: 'high',
        estimatedDuration: 1200
      }

      const result = await instantiateRoutineFromTemplate(template)

      expect(createRoutine).toHaveBeenCalledWith({
        title: 'Morning Launch',
        steps: template.steps,
        tags: ['morning', 'energy'],
        energyTag: 'high',
        estimatedDuration: 1200
      })
      expect(result.id).toBe('new-routine-id')
      expect(result.title).toBe('Morning Launch')
    })

    it('should handle errors during routine creation', async () => {
      createRoutine.mockRejectedValue(new Error('Database error'))

      const template = {
        id: 'template-1',
        title: 'Test Template',
        steps: []
      }

      await expect(instantiateRoutineFromTemplate(template)).rejects.toThrow(
        'Database error'
      )
    })
  })

  describe('clusterEvents', () => {
    it('returns empty array for no events', () => {
      expect(clusterEvents([])).toEqual([])
    })

    it('puts a single event in its own cluster', () => {
      const events = [{ start: 60, end: 120 }]
      const clusters = clusterEvents(events)
      expect(clusters).toHaveLength(1)
      expect(clusters[0]).toHaveLength(1)
    })

    it('groups overlapping events into one cluster', () => {
      const events = [
        { start: 60, end: 120 },
        { start: 90, end: 150 }
      ]
      const clusters = clusterEvents(events)
      expect(clusters).toHaveLength(1)
      expect(clusters[0]).toHaveLength(2)
    })

    it('creates separate clusters for non-overlapping events', () => {
      const events = [
        { start: 60, end: 120 },
        { start: 180, end: 240 }
      ]
      const clusters = clusterEvents(events)
      expect(clusters).toHaveLength(2)
    })

    it('does not treat touching boundaries as overlap', () => {
      const events = [
        { start: 60, end: 120 },
        { start: 120, end: 180 }
      ]
      const clusters = clusterEvents(events)
      expect(clusters).toHaveLength(2)
    })

    it('sorts events by start time before clustering', () => {
      const events = [
        { start: 180, end: 240 },
        { start: 60, end: 120 }
      ]
      const clusters = clusterEvents(events)
      expect(clusters).toHaveLength(2)
      expect(clusters[0][0].start).toBe(60)
    })

    it('does not mutate the original array', () => {
      const events = [
        { start: 90, end: 150 },
        { start: 60, end: 120 }
      ]
      const original = [...events]
      clusterEvents(events)
      expect(events[0].start).toBe(original[0].start)
    })

    it('handles transitive overlap spanning more than two events', () => {
      // A overlaps B, B overlaps C → all in one cluster even if A and C don't directly overlap
      const events = [
        { start: 0, end: 60 },
        { start: 30, end: 90 },
        { start: 70, end: 120 }
      ]
      const clusters = clusterEvents(events)
      expect(clusters).toHaveLength(1)
      expect(clusters[0]).toHaveLength(3)
    })
  })

  describe('assignColumns', () => {
    it('assigns column 0 and totalColumns 1 to a single event', () => {
      const cluster = [{ start: 60, end: 120 }]
      assignColumns(cluster)
      expect(cluster[0].column).toBe(0)
      expect(cluster[0].totalColumns).toBe(1)
    })

    it('places two overlapping events in separate columns', () => {
      const cluster = [
        { start: 60, end: 120 },
        { start: 90, end: 150 }
      ]
      assignColumns(cluster)
      expect(cluster[0].column).toBe(0)
      expect(cluster[1].column).toBe(1)
      expect(cluster[0].totalColumns).toBe(2)
      expect(cluster[1].totalColumns).toBe(2)
    })

    it('reuses a column when the previous occupant has ended', () => {
      // event0 ends at 120; event1 starts at 90 (overlap); event2 starts at 120 (touching, no overlap)
      const cluster = [
        { start: 0, end: 60 },
        { start: 30, end: 90 },
        { start: 60, end: 120 }
      ]
      assignColumns(cluster)
      // event2 starts at 60 which equals event0.end (60) → can reuse column 0
      expect(cluster[2].column).toBe(0)
      expect(cluster[0].totalColumns).toBe(2)
    })

    it('assigns totalColumns consistently to all events in cluster', () => {
      const cluster = [
        { start: 0, end: 120 },
        { start: 30, end: 90 },
        { start: 60, end: 150 }
      ]
      assignColumns(cluster)
      const totals = cluster.map((e) => e.totalColumns)
      expect(new Set(totals).size).toBe(1)
    })

    it('handles an empty cluster without error', () => {
      expect(() => assignColumns([])).not.toThrow()
    })
  })

  describe('addTaskToStorage', () => {
    it('adds a task to not_urgent_not_important quadrant in localStorage', () => {
      const task = addTaskToStorage('Write unit tests')
      expect(task.text).toBe('Write unit tests')
      expect(task.completed).toBe(false)
      expect(task.id).toBeTruthy()

      const saved = JSON.parse(localStorage.getItem('aurorae_tasks'))
      expect(saved.not_urgent_not_important).toHaveLength(1)
      expect(saved.not_urgent_not_important[0].text).toBe('Write unit tests')
    })

    it('trims whitespace from the title', () => {
      addTaskToStorage('  Trimmed Task  ')
      const saved = JSON.parse(localStorage.getItem('aurorae_tasks'))
      expect(saved.not_urgent_not_important[0].text).toBe('Trimmed Task')
    })

    it('preserves existing tasks when adding a new one', () => {
      localStorage.setItem(
        'aurorae_tasks',
        JSON.stringify({
          urgent_important: [{ id: 'existing', text: 'Existing', completed: false }],
          not_urgent_important: [],
          urgent_not_important: [],
          not_urgent_not_important: []
        })
      )
      addTaskToStorage('New Task')
      const saved = JSON.parse(localStorage.getItem('aurorae_tasks'))
      expect(saved.urgent_important).toHaveLength(1)
      expect(saved.not_urgent_not_important).toHaveLength(1)
      expect(saved.not_urgent_not_important[0].text).toBe('New Task')
    })

    it('initialises empty storage structure when localStorage is empty', () => {
      addTaskToStorage('First Task')
      const saved = JSON.parse(localStorage.getItem('aurorae_tasks'))
      expect(saved.urgent_important).toEqual([])
      expect(saved.not_urgent_important).toEqual([])
      expect(saved.urgent_not_important).toEqual([])
      expect(saved.not_urgent_not_important).toHaveLength(1)
    })
  })
})
