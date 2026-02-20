import { vi } from 'vitest'
import {
  getPredefinedTemplates,
  getPredefinedTasks,
  getPredefinedRoutines,
  seedPredefinedTemplates,
  arePredefinedTemplatesSeeded
} from '../utils/predefinedTemplates'
import * as templatesManager from '../utils/templatesManager'

// Mock the templates manager
vi.mock('../utils/templatesManager')

describe('Predefined Templates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPredefinedTemplates', () => {
    test('returns combined array of tasks and routines', () => {
      const templates = getPredefinedTemplates()
      expect(Array.isArray(templates)).toBe(true)
      expect(templates.length).toBeGreaterThan(0)

      // Should have both tasks and routines
      const hasTasks = templates.some((t) => t.type === 'task')
      const hasRoutines = templates.some((t) => t.type === 'routine')
      expect(hasTasks).toBe(true)
      expect(hasRoutines).toBe(true)
    })

    test('all templates have required fields', () => {
      const templates = getPredefinedTemplates()

      templates.forEach((template) => {
        expect(template).toHaveProperty('id')
        expect(template).toHaveProperty('type')
        expect(template).toHaveProperty('title')
        expect(template).toHaveProperty('tags')
        expect(template).toHaveProperty('version')
        expect(template).toHaveProperty('createdAt')
        expect(template.id).toBeTruthy()
        expect(['task', 'routine']).toContain(template.type)
      })
    })
  })

  describe('getPredefinedTasks', () => {
    test('returns only task templates', () => {
      const tasks = getPredefinedTasks()
      expect(Array.isArray(tasks)).toBe(true)
      expect(tasks.length).toBeGreaterThanOrEqual(5)

      tasks.forEach((task) => {
        expect(task.type).toBe('task')
        expect(task).toHaveProperty('quadrant')
      })
    })

    test('tasks have unique IDs', () => {
      const tasks = getPredefinedTasks()
      const ids = tasks.map((t) => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('getPredefinedRoutines', () => {
    test('returns only routine templates', () => {
      const routines = getPredefinedRoutines()
      expect(Array.isArray(routines)).toBe(true)
      expect(routines.length).toBeGreaterThanOrEqual(5)

      routines.forEach((routine) => {
        expect(routine.type).toBe('routine')
        expect(routine).toHaveProperty('steps')
        expect(routine).toHaveProperty('estimatedDuration')
        expect(Array.isArray(routine.steps)).toBe(true)
      })
    })

    test('routines have valid steps', () => {
      const routines = getPredefinedRoutines()

      routines.forEach((routine) => {
        expect(routine.steps.length).toBeGreaterThan(0)

        routine.steps.forEach((step) => {
          expect(step).toHaveProperty('label')
          expect(step).toHaveProperty('duration')
          expect(typeof step.label).toBe('string')
          expect(typeof step.duration).toBe('number')
          expect(step.duration).toBeGreaterThan(0)
        })
      })
    })

    test('estimatedDuration matches sum of step durations', () => {
      const routines = getPredefinedRoutines()

      routines.forEach((routine) => {
        const sum = routine.steps.reduce((acc, step) => acc + step.duration, 0)
        expect(routine.estimatedDuration).toBe(sum)
      })
    })
  })

  describe('seedPredefinedTemplates', () => {
    test('seeds templates when none exist', async () => {
      templatesManager.getAllTemplates.mockResolvedValue([])
      templatesManager.saveTemplate.mockResolvedValue('mock-id')

      const result = await seedPredefinedTemplates()

      expect(result).toHaveProperty('added')
      expect(result).toHaveProperty('skipped')
      expect(result).toHaveProperty('errors')
      expect(result.added).toBeGreaterThan(0)
      expect(result.skipped).toBe(0)
      expect(result.errors).toEqual([])
    })

    test('skips templates that already exist', async () => {
      const existingTemplate = {
        id: 'task-morning-review',
        type: 'task',
        title: 'Existing Template'
      }

      templatesManager.getAllTemplates.mockResolvedValue([existingTemplate])
      templatesManager.saveTemplate.mockResolvedValue('mock-id')

      const result = await seedPredefinedTemplates()

      expect(result.skipped).toBeGreaterThan(0)
      // Should not try to save templates with existing IDs
      const saveCalls = templatesManager.saveTemplate.mock.calls
      const attemptedIds = saveCalls.map((call) => call[0].id)
      expect(attemptedIds).not.toContain('task-morning-review')
    })

    test('handles save errors gracefully', async () => {
      templatesManager.getAllTemplates.mockResolvedValue([])
      templatesManager.saveTemplate.mockRejectedValue(new Error('Save failed'))

      const result = await seedPredefinedTemplates()

      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toHaveProperty('template')
      expect(result.errors[0]).toHaveProperty('error')
    })
  })

  describe('arePredefinedTemplatesSeeded', () => {
    test('returns true when predefined templates exist', async () => {
      // After the fix, arePredefinedTemplatesSeeded() checks that ALL predefined templates exist
      // So we need to mock ALL of them being present
      const allPredefinedTemplates = getPredefinedTemplates()

      templatesManager.getAllTemplates.mockResolvedValue(allPredefinedTemplates)

      const result = await arePredefinedTemplatesSeeded()

      expect(result).toBe(true)
    })

    test('returns false when no predefined templates exist', async () => {
      const customTemplate = {
        id: 'custom-task-123',
        type: 'task',
        title: 'Custom Task'
      }

      templatesManager.getAllTemplates.mockResolvedValue([customTemplate])

      const result = await arePredefinedTemplatesSeeded()

      expect(result).toBe(false)
    })

    test('returns false on empty templates', async () => {
      templatesManager.getAllTemplates.mockResolvedValue([])

      const result = await arePredefinedTemplatesSeeded()

      expect(result).toBe(false)
    })

    test('handles errors gracefully', async () => {
      templatesManager.getAllTemplates.mockRejectedValue(new Error('DB error'))

      const result = await arePredefinedTemplatesSeeded()

      expect(result).toBe(false)
    })
  })

  describe('Template Content Validation', () => {
    test('all task templates have valid quadrants', () => {
      const tasks = getPredefinedTasks()
      const validQuadrants = [
        'urgent_important',
        'not_urgent_important',
        'urgent_not_important',
        'not_urgent_not_important'
      ]

      tasks.forEach((task) => {
        expect(validQuadrants).toContain(task.quadrant)
      })
    })

    test('new default task templates are present', () => {
      const tasks = getPredefinedTasks()
      const taskIds = tasks.map((t) => t.id)

      // Verify all new task templates are included
      expect(taskIds).toContain('task-papers')
      expect(taskIds).toContain('task-laundry')
      expect(taskIds).toContain('task-dishes')
      expect(taskIds).toContain('task-pet-care')
      expect(taskIds).toContain('task-calls')
    })

    test('new default routine templates are present', () => {
      const routines = getPredefinedRoutines()
      const routineIds = routines.map((r) => r.id)

      // Verify all new routine templates are included
      expect(routineIds).toContain('routine-cleaning')
      expect(routineIds).toContain('routine-litter-boxes')
      expect(routineIds).toContain('routine-pomodoro')
    })

    test('all templates have non-empty tags', () => {
      const templates = getPredefinedTemplates()

      templates.forEach((template) => {
        expect(Array.isArray(template.tags)).toBe(true)
        expect(template.tags.length).toBeGreaterThan(0)
        template.tags.forEach((tag) => {
          expect(typeof tag).toBe('string')
          expect(tag.length).toBeGreaterThan(0)
        })
      })
    })

    test('all templates have valid IDs', () => {
      const templates = getPredefinedTemplates()

      templates.forEach((template) => {
        expect(template.id).toMatch(/^(task|routine)-[a-z-]+$/)
      })
    })
  })
})
