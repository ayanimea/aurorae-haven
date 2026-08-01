// Test suite for Routines Manager
// TODO: Expand tests as timer and execution features are implemented

import 'fake-indexeddb/auto'
import {
  createRoutine,
  createRoutineBatch,
  getRoutines,
  getRoutine,
  updateRoutine,
  deleteRoutine,
  addStep,
  removeStep,
  reorderStep,
  cloneRoutine,
  startRoutine,
  exportRoutines,
  importRoutines
} from '../utils/routinesManager'
import { clear, STORES } from '../utils/indexedDBManager'

const SHORT_DELAY_MS = 10
const waitForUniqueTimestamp = () =>
  new Promise((resolve) => setTimeout(resolve, SHORT_DELAY_MS))
const expectGeneratedRoutineId = (id) => {
  expect(id).toBeDefined()
  expect(id).toContain('routine_')
}
const createRoutineWithNoSteps = (name, fields = {}) =>
  createRoutine({ name, steps: [], ...fields })
const expectImportValidationFailure = async (data, messageFragment) => {
  await expect(importRoutines(data)).rejects.toThrow(messageFragment)
}

describe('Routines Manager', () => {
  beforeEach(async () => {
    await clear(STORES.ROUTINES)
  })

  describe('createRoutine', () => {
    test('should create a new routine', async () => {
      const routine = {
        name: 'Morning Routine',
        steps: [
          { name: 'Wake up', duration: 60 },
          { name: 'Stretch', duration: 300 }
        ]
      }

      const id = await createRoutine(routine)
      expectGeneratedRoutineId(id)

      const routines = await getRoutines()
      expect(routines).toHaveLength(1)
      expect(routines[0].name).toBe('Morning Routine')
      expect(routines[0].totalDuration).toBe(360)
    })

    test('should create routine with no steps', async () => {
      const routine = {
        name: 'Empty Routine'
      }

      const id = await createRoutine(routine)
      expectGeneratedRoutineId(id)

      const created = await getRoutine(id)
      expect(created.name).toBe('Empty Routine')
      expect(created.steps).toEqual([])
      expect(created.totalDuration).toBe(0)
    })

    test('should validate routine data', async () => {
      const routine = {
        name: 'Test Routine',
        steps: [
          { name: 'Step 1', duration: 60 },
          { name: 'Step 2', duration: -10 } // Invalid: negative duration
        ]
      }

      // Should still create the routine (validation happens at UI level)
      const id = await createRoutine(routine)
      expectGeneratedRoutineId(id)

      const created = await getRoutine(id)
      expect(created).toBeDefined()
      expect(created.steps).toHaveLength(2)
    })
  })

  describe('getRoutines', () => {
    test('should return empty array when no routines exist', async () => {
      const routines = await getRoutines()
      expect(routines).toEqual([])
    })

    test('should return all routines', async () => {
      await createRoutineWithNoSteps('Routine 1')
      await waitForUniqueTimestamp()
      await createRoutineWithNoSteps('Routine 2')

      const routines = await getRoutines()
      expect(routines).toHaveLength(2)
    })

    test('should sort routines by name', async () => {
      await createRoutineWithNoSteps('Zebra Routine')
      await waitForUniqueTimestamp()
      await createRoutineWithNoSteps('Alpha Routine')
      await waitForUniqueTimestamp()
      await createRoutineWithNoSteps('Middle Routine')

      const routines = await getRoutines({ sortBy: 'name', order: 'asc' })
      expect(routines).toHaveLength(3)
      expect(routines[0].name).toBe('Alpha Routine')
      expect(routines[1].name).toBe('Middle Routine')
      expect(routines[2].name).toBe('Zebra Routine')
    })

    test('should filter routines by recently used', async () => {
      const now = Date.now()
      const recentTime = new Date(now - 1000).toISOString()
      const oldTime = new Date(now - 10000000).toISOString()

      // Create routines with different lastUsed timestamps
      await createRoutineWithNoSteps('Recent Routine', { lastUsed: recentTime })
      await waitForUniqueTimestamp()
      await createRoutineWithNoSteps('Old Routine', { lastUsed: oldTime })

      // Get routines sorted by lastUsed (most recent first)
      const routines = await getRoutines({ sortBy: 'lastUsed', order: 'desc' })
      expect(routines).toHaveLength(2)
      expect(routines[0].name).toBe('Recent Routine')
      expect(routines[1].name).toBe('Old Routine')
    })
  })

  describe('getRoutine', () => {
    test('should get routine by ID', async () => {
      const id = await createRoutineWithNoSteps('Test Routine')
      const routine = await getRoutine(id)

      expect(routine).toBeDefined()
      expect(routine.id).toBe(id)
      expect(routine.name).toBe('Test Routine')
    })

    test('should handle missing routine gracefully', async () => {
      const routine = await getRoutine('non-existent-id')
      expect(routine).toBeUndefined()
    })
  })

  describe('updateRoutine', () => {
    test('should update existing routine', async () => {
      const id = await createRoutineWithNoSteps('Old Name')
      const routine = await getRoutine(id)

      routine.name = 'New Name'
      await updateRoutine(routine)

      const updated = await getRoutine(id)
      expect(updated.name).toBe('New Name')
    })

    // TODO: Add test for updating steps
    test.todo('should recalculate duration when steps change')
  })

  describe('deleteRoutine', () => {
    test('should delete routine by ID', async () => {
      const id = await createRoutineWithNoSteps('To Delete')
      await deleteRoutine(id)

      const routines = await getRoutines()
      expect(routines).toHaveLength(0)
    })
  })

  describe('addStep', () => {
    test('should add step to routine', async () => {
      const id = await createRoutineWithNoSteps('Test')
      const updated = await addStep(id, { name: 'New Step', duration: 120 })

      expect(updated.steps).toHaveLength(1)
      expect(updated.steps[0].name).toBe('New Step')
      expect(updated.totalDuration).toBe(120)
    })

    // TODO: Add test for step ordering
    test.todo('should maintain step order when adding')

    // TODO: Add test for step validation
    test.todo('should validate step data')
  })

  describe('removeStep', () => {
    test('should remove step from routine', async () => {
      const id = await createRoutine({
        name: 'Test',
        steps: [
          { id: 'step1', name: 'Step 1', duration: 60 },
          { id: 'step2', name: 'Step 2', duration: 120 }
        ]
      })

      const updated = await removeStep(id, 'step1')
      expect(updated.steps).toHaveLength(1)
      expect(updated.steps[0].id).toBe('step2')
      expect(updated.totalDuration).toBe(120)
    })

    // TODO: Add test for reordering after removal
    test.todo('should reorder remaining steps after removal')
  })

  describe('reorderStep', () => {
    test('should reorder steps in routine', async () => {
      const id = await createRoutine({
        name: 'Test',
        steps: [
          { id: 'step1', name: 'Step 1', duration: 60, order: 0 },
          { id: 'step2', name: 'Step 2', duration: 120, order: 1 },
          { id: 'step3', name: 'Step 3', duration: 180, order: 2 }
        ]
      })

      const updated = await reorderStep(id, 'step3', 0)
      expect(updated.steps[0].id).toBe('step3')
      expect(updated.steps[0].order).toBe(0)
      expect(updated.steps[1].order).toBe(1)
    })

    // TODO: Add test for invalid reorder
    test.todo('should handle invalid reorder positions')
  })

  describe('cloneRoutine', () => {
    test('should clone routine with new ID', async () => {
      const id = await createRoutine({
        name: 'Original',
        steps: [{ name: 'Step 1', duration: 60 }]
      })

      await waitForUniqueTimestamp()
      const newId = await cloneRoutine(id, 'Cloned')
      expect(newId).not.toBe(id)

      const cloned = await getRoutine(newId)
      expect(cloned.name).toBe('Cloned')
      expect(cloned.steps).toHaveLength(1)
    })

    // TODO: Add test for default clone name
    test.todo('should use default name if not provided')
  })

  describe('startRoutine', () => {
    test('should initialize routine execution state', async () => {
      const id = await createRoutine({
        name: 'Test',
        steps: [{ name: 'Step 1', duration: 60 }]
      })

      const state = await startRoutine(id)
      expect(state.routineId).toBe(id)
      expect(state.isRunning).toBe(true)
      expect(state.isPaused).toBe(false)
      expect(state.currentStepIndex).toBe(0)
    })

    // TODO: Add tests for timer integration
    test.todo('should integrate with timer system')

    // TODO: Add tests for pause/resume
    test.todo('should support pause and resume')

    // TODO: Add tests for step completion
    test.todo('should advance to next step on completion')
  })

  describe('createRoutineBatch', () => {
    test('should create multiple routines in one batch', async () => {
      const routines = [
        {
          name: 'Morning Routine',
          steps: [{ name: 'Wake up', duration: 60 }]
        },
        {
          name: 'Evening Routine',
          steps: [{ name: 'Wind down', duration: 120 }]
        },
        {
          name: 'Workout Routine',
          steps: [
            { name: 'Warm up', duration: 300 },
            { name: 'Exercise', duration: 1800 }
          ]
        }
      ]

      const ids = await createRoutineBatch(routines)
      expect(ids).toHaveLength(3)
      ids.forEach(expectGeneratedRoutineId)

      const allRoutines = await getRoutines()
      expect(allRoutines).toHaveLength(3)
      expect(allRoutines[0].name).toBe('Morning Routine')
      expect(allRoutines[1].name).toBe('Evening Routine')
      expect(allRoutines[2].name).toBe('Workout Routine')
    })

    test('should return empty array for empty input', async () => {
      const ids = await createRoutineBatch([])
      expect(ids).toEqual([])
    })

    test('should throw error for non-array input', async () => {
      await expect(createRoutineBatch('not an array')).rejects.toThrow(
        'Routines must be an array'
      )
    })

    test('should calculate total duration for all routines', async () => {
      const routines = [
        {
          name: 'Routine 1',
          steps: [
            { name: 'Step 1', duration: 60 },
            { name: 'Step 2', duration: 120 }
          ]
        },
        {
          name: 'Routine 2',
          steps: [{ name: 'Step 1', duration: 300 }]
        }
      ]

      const ids = await createRoutineBatch(routines)
      const routine1 = await getRoutine(ids[0])
      const routine2 = await getRoutine(ids[1])

      expect(routine1.totalDuration).toBe(180)
      expect(routine2.totalDuration).toBe(300)
    })

    test('should assign unique IDs to each routine', async () => {
      const routines = [
        { name: 'Routine 1', steps: [] },
        { name: 'Routine 2', steps: [] },
        { name: 'Routine 3', steps: [] }
      ]

      const ids = await createRoutineBatch(routines)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(3)
    })
  })

  describe('exportRoutines', () => {
    test('should export all routines', async () => {
      await createRoutineWithNoSteps('Routine 1')
      await waitForUniqueTimestamp()
      await createRoutineWithNoSteps('Routine 2')

      const exported = await exportRoutines()

      expect(exported).toHaveProperty('version', '1.0')
      expect(exported).toHaveProperty('exportDate')
      expect(exported).toHaveProperty('routines')
      expect(exported.routines).toHaveLength(2)
    })

    test('should export specific routines by ID', async () => {
      const id1 = await createRoutineWithNoSteps('Routine 1')
      await waitForUniqueTimestamp()
      await createRoutineWithNoSteps('Routine 2')

      const exported = await exportRoutines([id1])

      expect(exported.routines).toHaveLength(1)
      expect(exported.routines[0].id).toBe(id1)
      expect(exported.routines[0].name).toBe('Routine 1')
    })
  })

  describe('importRoutines', () => {
    test('should import valid routines', async () => {
      const importData = {
        version: '1.0',
        routines: [
          { name: 'Imported 1', steps: [] },
          { name: 'Imported 2', steps: [{ name: 'Step 1', duration: 60 }] }
        ]
      }

      const results = await importRoutines(importData)

      expect(results.imported).toBe(2)
      expect(results.skipped).toBe(0)
      expect(results.errors).toHaveLength(0)

      const allRoutines = await getRoutines()
      expect(allRoutines).toHaveLength(2)
    })

    test('should handle ID collisions by regenerating IDs', async () => {
      const id = await createRoutineWithNoSteps('Existing')

      const importData = {
        version: '1.0',
        routines: [{ id, name: 'Collision', steps: [] }]
      }

      const results = await importRoutines(importData)

      expect(results.imported).toBe(1)
      const allRoutines = await getRoutines()
      expect(allRoutines).toHaveLength(2)

      // IDs should be different
      const ids = allRoutines.map((r) => r.id)
      expect(new Set(ids).size).toBe(2)
    })

    test.each([
      [{ routines: [] }, 'missing version field'],
      [{ version: '1.0' }, 'missing routines array']
    ])('should validate required import fields', async (invalidData, error) => {
      await expectImportValidationFailure(invalidData, error)
    })

    test('should skip routines without name', async () => {
      const importData = {
        version: '1.0',
        routines: [
          { name: 'Valid', steps: [] },
          { steps: [] } // Missing name
        ]
      }

      const results = await importRoutines(importData)

      expect(results.imported).toBe(1)
      expect(results.skipped).toBe(1)
      expect(results.errors).toHaveLength(1)
    })

    test('should normalize imported routines with totalDuration', async () => {
      const importData = {
        version: '1.0',
        routines: [
          {
            name: 'Test',
            steps: [
              { name: 'Step 1', duration: 60 },
              { name: 'Step 2', duration: 120 }
            ]
          }
        ]
      }

      const results = await importRoutines(importData)

      expect(results.imported).toBe(1)

      const allRoutines = await getRoutines()
      const imported = allRoutines[0]
      expect(imported.totalDuration).toBe(180)
    })
  })
})
