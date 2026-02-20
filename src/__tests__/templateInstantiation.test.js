import { vi } from 'vitest'
import {
  instantiateTaskFromTemplate,
  instantiateRoutineFromTemplate,
  instantiateTemplate,
  instantiateTemplatesBatch
} from '../utils/templateInstantiation'
import * as routinesManager from '../utils/routinesManager'
import { v4 as uuidv4 } from 'uuid'

// Mock dependencies
vi.mock('uuid')
vi.mock('../utils/routinesManager')

describe('templateInstantiation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    uuidv4.mockReturnValue('test-task-uuid-123')
  })

  describe('instantiateTaskFromTemplate', () => {
    test('creates a task from a task template with default quadrant', () => {
      const template = {
        type: 'task',
        title: 'Review pull request',
        tags: ['work', 'code-review']
      }

      const result = instantiateTaskFromTemplate(template)

      expect(result).toHaveProperty('task')
      expect(result).toHaveProperty('quadrant')
      expect(result.task.id).toBe('test-task-uuid-123')
      expect(result.task.text).toBe('Review pull request')
      expect(result.task.completed).toBe(false)
      expect(result.task.createdAt).toBeDefined()
      expect(result.quadrant).toBe('urgent_important')
    })

    test('creates a task in specified quadrant', () => {
      const template = {
        type: 'task',
        title: 'Plan vacation',
        quadrant: 'not_urgent_important'
      }

      const result = instantiateTaskFromTemplate(template)

      expect(result.quadrant).toBe('not_urgent_important')

      // Verify it was saved to localStorage
      const savedTasks = JSON.parse(localStorage.getItem('aurorae_tasks'))
      expect(savedTasks.not_urgent_important).toHaveLength(1)
      expect(savedTasks.not_urgent_important[0].text).toBe('Plan vacation')
    })

    test('creates a task with due date offset', () => {
      const template = {
        type: 'task',
        title: 'Submit report',
        dueOffset: 1 // 1 day (will be converted to milliseconds)
      }

      const result = instantiateTaskFromTemplate(template)

      expect(result.task.dueDate).toBeDefined()
      // dueDate should be an ISO string
      expect(typeof result.task.dueDate).toBe('string')
      // Verify it's a valid ISO date string and in the future
      const dueDateTime = new Date(result.task.dueDate).getTime()
      expect(dueDateTime).toBeGreaterThan(Date.now())
    })

    test('adds task to existing tasks in localStorage', () => {
      // Pre-populate localStorage with existing tasks
      const existingTasks = {
        urgent_important: [
          { id: 'existing-1', text: 'Existing task', completed: false }
        ],
        not_urgent_important: [],
        urgent_not_important: [],
        not_urgent_not_important: []
      }
      localStorage.setItem('aurorae_tasks', JSON.stringify(existingTasks))

      const template = {
        type: 'task',
        title: 'New task from template'
      }

      instantiateTaskFromTemplate(template)

      const savedTasks = JSON.parse(localStorage.getItem('aurorae_tasks'))
      expect(savedTasks.urgent_important).toHaveLength(2)
      expect(savedTasks.urgent_important[0].id).toBe('existing-1')
      expect(savedTasks.urgent_important[1].text).toBe('New task from template')
    })

    test('initializes tasks structure if localStorage is empty', () => {
      const template = {
        type: 'task',
        title: 'First task',
        quadrant: 'not_urgent_not_important'
      }

      instantiateTaskFromTemplate(template)

      const savedTasks = JSON.parse(localStorage.getItem('aurorae_tasks'))
      expect(savedTasks).toHaveProperty('urgent_important')
      expect(savedTasks).toHaveProperty('not_urgent_important')
      expect(savedTasks).toHaveProperty('urgent_not_important')
      expect(savedTasks).toHaveProperty('not_urgent_not_important')
      expect(savedTasks.not_urgent_not_important).toHaveLength(1)
    })

    test('handles corrupted localStorage data gracefully', () => {
      localStorage.setItem('aurorae_tasks', 'invalid json{')

      const template = {
        type: 'task',
        title: 'Task despite corruption'
      }

      const result = instantiateTaskFromTemplate(template)

      expect(result.task.text).toBe('Task despite corruption')
      const savedTasks = JSON.parse(localStorage.getItem('aurorae_tasks'))
      expect(savedTasks.urgent_important).toHaveLength(1)
    })

    test('throws error for null template', () => {
      expect(() => {
        instantiateTaskFromTemplate(null)
      }).toThrow('Invalid task template')
    })

    test('throws error for non-task template', () => {
      const template = {
        type: 'routine',
        title: 'Not a task'
      }

      expect(() => {
        instantiateTaskFromTemplate(template)
      }).toThrow(/Invalid task template: expected type 'task'/)
    })

    test('handles task template with uppercase type', () => {
      const template = {
        type: 'TASK',
        title: 'Uppercase task'
      }

      const result = instantiateTaskFromTemplate(template)

      expect(result.task.text).toBe('Uppercase task')
      expect(result.quadrant).toBe('urgent_important')
    })

    test('handles task template with mixed case type', () => {
      const template = {
        type: 'Task',
        title: 'Mixed case task'
      }

      const result = instantiateTaskFromTemplate(template)

      expect(result.task.text).toBe('Mixed case task')
    })

    test('handles task template with whitespace in type', () => {
      const template = {
        type: '  task  ',
        title: 'Task with whitespace'
      }

      const result = instantiateTaskFromTemplate(template)

      expect(result.task.text).toBe('Task with whitespace')
    })

    test('throws error for non-string type', () => {
      const template = {
        type: 123,
        title: 'Numeric type'
      }

      expect(() => {
        instantiateTaskFromTemplate(template)
      }).toThrow(/Invalid task template: expected type 'task'/)
    })

    test('creates independent task (not linked to template)', () => {
      const template = {
        type: 'task',
        title: 'Template task',
        id: 'template-id-123'
      }

      const result = instantiateTaskFromTemplate(template)

      // Task should have a different ID than the template
      expect(result.task.id).not.toBe('template-id-123')
      expect(result.task.id).toBe('test-task-uuid-123')
    })

    test('throws error for negative dueOffset', () => {
      const template = {
        type: 'task',
        title: 'Task with invalid offset',
        dueOffset: -1000
      }

      expect(() => {
        instantiateTaskFromTemplate(template)
      }).toThrow('Template dueOffset must be a positive number')
    })

    test('throws error for non-numeric dueOffset', () => {
      const template = {
        type: 'task',
        title: 'Task with invalid offset',
        dueOffset: 'invalid'
      }

      expect(() => {
        instantiateTaskFromTemplate(template)
      }).toThrow('Template dueOffset must be a number')
    })

    test('throws error for invalid task template data', () => {
      const template = {
        type: 'task',
        title: '' // Empty title should fail validation
      }

      expect(() => {
        instantiateTaskFromTemplate(template)
      }).toThrow('Invalid template data')
    })

    test('handles quota exceeded error gracefully', () => {
      // Pre-populate with a task to ensure localStorage works
      const template = {
        type: 'task',
        title: 'Test task'
      }

      // Mock localStorage to throw QuotaExceededError
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = jest.fn(() => {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        error.code = 22
        throw error
      })

      expect(() => {
        instantiateTaskFromTemplate(template)
      }).toThrow('Storage quota exceeded')

      // Restore original
      Storage.prototype.setItem = originalSetItem
    })
  })

  describe('instantiateRoutineFromTemplate', () => {
    beforeEach(() => {
      routinesManager.createRoutine.mockResolvedValue('test-routine-uuid-456')
    })

    test('creates a routine from a routine template', async () => {
      const template = {
        type: 'routine',
        title: 'Morning routine',
        steps: [
          { label: 'Wake up', duration: 60 },
          { label: 'Exercise', duration: 1200 },
          { label: 'Shower', duration: 600 }
        ],
        tags: ['health', 'morning'],
        energyTag: 'high',
        estimatedDuration: 1860
      }

      const routineId = await instantiateRoutineFromTemplate(template)

      expect(routineId).toBe('test-routine-uuid-456')
      expect(routinesManager.createRoutine).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Morning routine',
          steps: template.steps,
          tags: ['health', 'morning'],
          energyTag: 'high',
          estimatedDuration: 1860
        })
      )
    })

    test('creates routine with minimal template data', async () => {
      const template = {
        type: 'routine',
        title: 'Simple routine'
      }

      const routineId = await instantiateRoutineFromTemplate(template)

      expect(routineId).toBe('test-routine-uuid-456')
      expect(routinesManager.createRoutine).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Simple routine',
          steps: [],
          tags: [],
          energyTag: null,
          estimatedDuration: null
        })
      )
    })

    test('throws error for null template', async () => {
      await expect(instantiateRoutineFromTemplate(null)).rejects.toThrow(
        'Invalid routine template'
      )
    })

    test('throws error for non-routine template', async () => {
      const template = {
        type: 'task',
        title: 'Not a routine'
      }

      await expect(instantiateRoutineFromTemplate(template)).rejects.toThrow(
        /Invalid routine template: expected type 'routine'/
      )
    })

    test('handles routine template with uppercase type', async () => {
      const template = {
        type: 'ROUTINE',
        title: 'Uppercase routine',
        steps: [{ label: 'Step 1', duration: 60 }]
      }

      const routineId = await instantiateRoutineFromTemplate(template)

      expect(routineId).toBe('test-routine-uuid-456')
      expect(routinesManager.createRoutine).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Uppercase routine'
        })
      )
    })

    test('handles routine template with mixed case type', async () => {
      const template = {
        type: 'Routine',
        title: 'Mixed case routine',
        steps: [{ label: 'Step 1', duration: 60 }]
      }

      const routineId = await instantiateRoutineFromTemplate(template)

      expect(routineId).toBe('test-routine-uuid-456')
      expect(routinesManager.createRoutine).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Mixed case routine'
        })
      )
    })

    test('handles routine template with whitespace in type', async () => {
      const template = {
        type: '  routine  ',
        title: 'Routine with whitespace',
        steps: [{ label: 'Step 1', duration: 60 }]
      }

      const routineId = await instantiateRoutineFromTemplate(template)

      expect(routineId).toBe('test-routine-uuid-456')
      expect(routinesManager.createRoutine).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Routine with whitespace'
        })
      )
    })

    test('throws error for non-string type', async () => {
      const template = {
        type: true,
        title: 'Boolean type'
      }

      await expect(instantiateRoutineFromTemplate(template)).rejects.toThrow(
        /Invalid routine template: expected type 'routine'/
      )
    })

    test('creates independent sequence (not linked to template)', async () => {
      const template = {
        type: 'routine',
        title: 'Template routine',
        id: 'template-id-789'
      }

      await instantiateRoutineFromTemplate(template)

      // The sequence should not have the template ID
      const createCall = routinesManager.createRoutine.mock.calls[0][0]
      expect(createCall.id).toBeUndefined()
      expect(createCall.name).toBe('Template routine')
    })

    test('throws error for invalid routine template data', async () => {
      const template = {
        type: 'routine',
        title: '' // Empty title should fail validation
      }

      await expect(instantiateRoutineFromTemplate(template)).rejects.toThrow(
        'Invalid template data'
      )
    })

    test('throws error for invalid step structure', async () => {
      const template = {
        type: 'routine',
        title: 'Routine with invalid step',
        steps: [
          { label: 'Valid step', duration: 60 },
          { duration: 120 } // Missing label
        ]
      }

      await expect(instantiateRoutineFromTemplate(template)).rejects.toThrow(
        'Invalid template data'
      )
    })

    test('throws error for invalid step duration', async () => {
      const template = {
        type: 'routine',
        title: 'Routine with invalid duration',
        steps: [
          { label: 'Step 1', duration: 'invalid' } // Non-numeric duration
        ]
      }

      await expect(instantiateRoutineFromTemplate(template)).rejects.toThrow(
        'Invalid template data'
      )
    })

    test('throws error for negative step duration', async () => {
      const template = {
        type: 'routine',
        title: 'Routine with negative duration',
        steps: [
          { label: 'Step 1', duration: -10 } // Negative duration
        ]
      }

      await expect(instantiateRoutineFromTemplate(template)).rejects.toThrow(
        'Step 0 duration must be a non-negative number'
      )
    })

    test('throws error for non-string tags', async () => {
      const template = {
        type: 'routine',
        title: 'Routine with invalid tags',
        tags: ['valid', 123, 'also-valid'] // Numeric tag
      }

      await expect(instantiateRoutineFromTemplate(template)).rejects.toThrow(
        'Invalid template data'
      )
    })

    test('throws error for invalid estimatedDuration', async () => {
      const template = {
        type: 'routine',
        title: 'Routine with invalid duration',
        estimatedDuration: -100 // Negative duration
      }

      await expect(instantiateRoutineFromTemplate(template)).rejects.toThrow(
        'Invalid template data'
      )
    })

    test('throws error for non-numeric estimatedDuration', async () => {
      const template = {
        type: 'routine',
        title: 'Routine with invalid duration',
        estimatedDuration: 'invalid' // String instead of number
      }

      await expect(instantiateRoutineFromTemplate(template)).rejects.toThrow(
        'Invalid template data'
      )
    })
  })

  describe('instantiateTemplate', () => {
    beforeEach(() => {
      routinesManager.createRoutine.mockResolvedValue('test-routine-uuid-456')
    })

    test('instantiates task template', async () => {
      const template = {
        type: 'task',
        title: 'Test task'
      }

      const result = await instantiateTemplate(template)

      expect(result.type).toBe('task')
      expect(result.id).toBe('test-task-uuid-123')
      expect(result.quadrant).toBe('urgent_important')
      expect(result.task).toBeDefined()
    })

    test('instantiates routine template', async () => {
      const template = {
        type: 'routine',
        title: 'Test routine'
      }

      const result = await instantiateTemplate(template)

      expect(result.type).toBe('routine')
      expect(result.id).toBe('test-routine-uuid-456')
    })

    test('throws error for null template', async () => {
      await expect(instantiateTemplate(null)).rejects.toThrow(
        'Template is required'
      )
    })

    test('throws error for unknown template type', async () => {
      const template = {
        type: 'unknown',
        title: 'Invalid type'
      }

      await expect(instantiateTemplate(template)).rejects.toThrow(
        /Unknown template type: unknown/
      )
    })

    test('handles routine template with uppercase type', async () => {
      const template = {
        type: 'ROUTINE',
        title: 'Test routine with uppercase'
      }

      const result = await instantiateTemplate(template)

      expect(result.type).toBe('routine')
      expect(result.id).toBe('test-routine-uuid-456')
    })

    test('handles task template with mixed case type', async () => {
      const template = {
        type: 'Task',
        title: 'Test task with mixed case'
      }

      const result = await instantiateTemplate(template)

      expect(result.type).toBe('task')
      expect(result.id).toBe('test-task-uuid-123')
    })

    test('handles routine template with whitespace in type', async () => {
      const template = {
        type: '  routine  ',
        title: 'Test routine with whitespace'
      }

      const result = await instantiateTemplate(template)

      expect(result.type).toBe('routine')
      expect(result.id).toBe('test-routine-uuid-456')
    })

    test('throws error for invalid type field', async () => {
      const template = {
        type: null,
        title: 'Template with null type'
      }

      await expect(instantiateTemplate(template)).rejects.toThrow(
        'Template must have a valid type field'
      )
    })
  })

  describe('instantiateTemplatesBatch', () => {
    beforeEach(() => {
      let counter = 0
      uuidv4.mockImplementation(() => {
        counter++
        return `test-uuid-${counter}`
      })
      routinesManager.createRoutineBatch.mockImplementation((routines) => {
        return Promise.resolve(
          routines.map((r, i) => `routine_batch_${Date.now()}_${i}`)
        )
      })
    })

    test('creates multiple tasks and routines in batch', async () => {
      const templates = [
        {
          type: 'task',
          title: 'Task 1',
          quadrant: 'urgent_important'
        },
        {
          type: 'task',
          title: 'Task 2',
          quadrant: 'not_urgent_important'
        },
        {
          type: 'routine',
          title: 'Routine 1',
          steps: [{ label: 'Step 1', duration: 60 }]
        },
        {
          type: 'routine',
          title: 'Routine 2',
          steps: [{ label: 'Step 1', duration: 120 }]
        }
      ]

      const results = await instantiateTemplatesBatch(templates)

      expect(results).toHaveLength(4)
      expect(results[0].type).toBe('task')
      expect(results[0].id).toBe('test-uuid-1')
      expect(results[1].type).toBe('task')
      expect(results[1].id).toBe('test-uuid-2')
      expect(results[2].type).toBe('routine')
      expect(results[3].type).toBe('routine')

      // Verify tasks were saved to localStorage
      const savedTasks = JSON.parse(localStorage.getItem('aurorae_tasks'))
      expect(savedTasks.urgent_important).toHaveLength(1)
      expect(savedTasks.not_urgent_important).toHaveLength(1)

      // Verify batch routine creation was called
      expect(routinesManager.createRoutineBatch).toHaveBeenCalledTimes(1)
      expect(routinesManager.createRoutineBatch).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'Routine 1' }),
        expect.objectContaining({ name: 'Routine 2' })
      ])
    })

    test('handles only tasks', async () => {
      const templates = [
        { type: 'task', title: 'Task 1' },
        { type: 'task', title: 'Task 2' },
        { type: 'task', title: 'Task 3' }
      ]

      const results = await instantiateTemplatesBatch(templates)

      expect(results).toHaveLength(3)
      expect(results.every((r) => r.type === 'task')).toBe(true)
      expect(routinesManager.createRoutineBatch).not.toHaveBeenCalled()
    })

    test('handles only routines', async () => {
      const templates = [
        {
          type: 'routine',
          title: 'Routine 1',
          steps: [{ label: 'Step 1', duration: 60 }]
        },
        {
          type: 'routine',
          title: 'Routine 2',
          steps: [{ label: 'Step 1', duration: 120 }]
        }
      ]

      const results = await instantiateTemplatesBatch(templates)

      expect(results).toHaveLength(2)
      expect(results.every((r) => r.type === 'routine')).toBe(true)
      expect(routinesManager.createRoutineBatch).toHaveBeenCalledTimes(1)
    })

    test('returns empty array for empty input', async () => {
      const results = await instantiateTemplatesBatch([])
      expect(results).toEqual([])
    })

    test('throws error for non-array input', async () => {
      await expect(instantiateTemplatesBatch('not an array')).rejects.toThrow(
        'Templates must be an array'
      )
    })

    test('throws error for null template in array', async () => {
      const templates = [
        { type: 'task', title: 'Valid Task' },
        null,
        { type: 'routine', title: 'Valid Routine' }
      ]

      await expect(instantiateTemplatesBatch(templates)).rejects.toThrow(
        'Template is required'
      )
    })

    test('throws error for unknown template type', async () => {
      const templates = [
        { type: 'task', title: 'Valid Task' },
        { type: 'unknown', title: 'Invalid' }
      ]

      await expect(instantiateTemplatesBatch(templates)).rejects.toThrow(
        'Unknown template type: unknown'
      )
    })

    test('saves all tasks in single localStorage write', async () => {
      const templates = Array.from({ length: 10 }, (_, i) => ({
        type: 'task',
        title: `Task ${i + 1}`,
        quadrant: 'urgent_important'
      }))

      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')

      await instantiateTemplatesBatch(templates)

      // Should only call setItem once for all tasks
      expect(setItemSpy).toHaveBeenCalledTimes(1)
      expect(setItemSpy).toHaveBeenCalledWith(
        'aurorae_tasks',
        expect.any(String)
      )

      setItemSpy.mockRestore()
    })

    test('uses batch routine creation for multiple routines', async () => {
      const templates = Array.from({ length: 5 }, (_, i) => ({
        type: 'routine',
        title: `Routine ${i + 1}`,
        steps: [{ label: 'Step 1', duration: 60 }]
      }))

      await instantiateTemplatesBatch(templates)

      // Should call batch creation once with all routines
      expect(routinesManager.createRoutineBatch).toHaveBeenCalledTimes(1)
      expect(routinesManager.createRoutineBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Routine 1' }),
          expect.objectContaining({ name: 'Routine 2' }),
          expect.objectContaining({ name: 'Routine 3' }),
          expect.objectContaining({ name: 'Routine 4' }),
          expect.objectContaining({ name: 'Routine 5' })
        ])
      )
    })

    test('validates all templates before processing', async () => {
      const templates = [
        { type: 'task', title: 'Valid Task' },
        { type: 'routine' } // Missing required title field
      ]

      await expect(instantiateTemplatesBatch(templates)).rejects.toThrow(
        'Invalid template data'
      )

      // Should not have called batch routine creation
      expect(routinesManager.createRoutineBatch).not.toHaveBeenCalled()
    })

    test('handles mixed quadrants for tasks', async () => {
      const templates = [
        { type: 'task', title: 'Task 1', quadrant: 'urgent_important' },
        { type: 'task', title: 'Task 2', quadrant: 'not_urgent_important' },
        { type: 'task', title: 'Task 3', quadrant: 'urgent_not_important' },
        {
          type: 'task',
          title: 'Task 4',
          quadrant: 'not_urgent_not_important'
        }
      ]

      await instantiateTemplatesBatch(templates)

      const savedTasks = JSON.parse(localStorage.getItem('aurorae_tasks'))
      expect(savedTasks.urgent_important).toHaveLength(1)
      expect(savedTasks.not_urgent_important).toHaveLength(1)
      expect(savedTasks.urgent_not_important).toHaveLength(1)
      expect(savedTasks.not_urgent_not_important).toHaveLength(1)
    })

    test('throws error on localStorage quota exceeded', async () => {
      const templates = Array.from({ length: 5 }, (_, i) => ({
        type: 'task',
        title: `Task ${i + 1}`
      }))

      // Mock quota exceeded error
      const setItemSpy = jest
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          const error = new Error('QuotaExceededError')
          error.name = 'QuotaExceededError'
          throw error
        })

      await expect(instantiateTemplatesBatch(templates)).rejects.toThrow(
        'Storage quota exceeded'
      )

      setItemSpy.mockRestore()
    })
  })
})
