import { vi } from 'vitest'
import {
  getAllTemplates,
  getTemplate,
  saveTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  markTemplateUsed,
  filterTemplates,
  sortTemplates,
  exportTemplates,
  importTemplates,
  templatesDBManager
} from '../utils/templatesManager'
import * as indexedDBManager from '../utils/indexedDBManager'
import { v4 as uuidv4 } from 'uuid'

// Mock dependencies
vi.mock('../utils/indexedDBManager')
vi.mock('uuid')

describe('templatesManager', () => {
  let mockDB
  let createMockRequest
  let mockDataStore // In-memory storage for templates

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset connection manager between tests
    templatesDBManager.resetConnectionState()

    // In-memory store for template data
    mockDataStore = new Map()

    // Helper to create mock IDBRequest
    createMockRequest = (result = null, shouldError = false) => {
      const request = {
        result: null,
        error: null
      }
      // Use Promise.resolve().then() for deterministic async behavior
      Promise.resolve().then(() => {
        if (shouldError) {
          request.error = new Error('Mock error')
          request.onerror && request.onerror()
        } else {
          request.result = result
          request.onsuccess && request.onsuccess()
        }
      })
      return request
    }

    // Mock database with proper IDBRequest-based API and in-memory storage
    const mockStore = {
      getAll: jest.fn(() => {
        const allTemplates = Array.from(mockDataStore.values())
        return createMockRequest(allTemplates)
      }),
      get: jest.fn((id) => {
        const template = mockDataStore.get(id) || null
        return createMockRequest(template)
      }),
      put: jest.fn((template) => {
        mockDataStore.set(template.id, template)
        return createMockRequest()
      }),
      delete: jest.fn((id) => {
        mockDataStore.delete(id)
        return createMockRequest()
      })
    }

    const createMockTransaction = () => {
      const transaction = {
        objectStore: jest.fn().mockReturnValue(mockStore),
        oncomplete: null,
        onerror: null,
        abort: jest.fn()
      }

      // Trigger oncomplete after a brief delay
      // Note: In real IndexedDB, oncomplete fires when all requests succeed
      // We trigger it even on errors for testing simplicity
      setTimeout(() => {
        if (transaction.oncomplete) {
          transaction.oncomplete()
        }
      }, 10)

      return transaction
    }

    const mockTransaction = createMockTransaction()

    mockDB = {
      transaction: jest.fn().mockImplementation(() => createMockTransaction()),
      close: jest.fn(),
      mockStore,
      mockTransaction,
      mockDataStore,
      objectStoreNames: {
        contains: jest.fn().mockReturnValue(true)
      },
      onclose: null,
      onerror: null
    }

    indexedDBManager.isIndexedDBAvailable.mockReturnValue(true)
    indexedDBManager.openDB.mockResolvedValue(mockDB)
    uuidv4.mockReturnValue('test-uuid-123')
  })

  describe('getAllTemplates', () => {
    test('returns empty array when no templates exist', async () => {
      const result = await getAllTemplates()
      expect(result).toEqual([])
    })

    test('returns array of templates', async () => {
      const mockTemplates = [{ id: '1', type: 'task', title: 'Test' }]
      // Store data in mock database
      mockDB.mockDataStore.set('1', mockTemplates[0])

      const result = await getAllTemplates()
      expect(result).toEqual(mockTemplates)
    })

    test('returns empty array when IndexedDB is not available', async () => {
      indexedDBManager.isIndexedDBAvailable.mockReturnValue(false)

      const result = await getAllTemplates()
      expect(result).toEqual([])
    })
  })

  describe('saveTemplate', () => {
    test('saves a new task template', async () => {
      const template = {
        type: 'task',
        title: 'Test Task',
        tags: ['work'],
        category: 'Development',
        quadrant: 'urgent_important'
      }

      const result = await saveTemplate(template)

      expect(result).toBe('test-uuid-123')
      expect(mockDB.transaction).toHaveBeenCalledWith('templates', 'readwrite')
    })

    test('saves a new routine template', async () => {
      const template = {
        type: 'routine',
        title: 'Morning Routine',
        tags: ['health'],
        steps: [
          { label: 'Wake up', duration: 60 },
          { label: 'Shower', duration: 300 }
        ],
        energyTag: 'high',
        estimatedDuration: 360
      }

      const result = await saveTemplate(template)

      expect(result).toBe('test-uuid-123')
    })

    test('throws error when IndexedDB is not available', async () => {
      indexedDBManager.isIndexedDBAvailable.mockReturnValue(false)

      const template = { type: 'task', title: 'Test' }

      await expect(saveTemplate(template)).rejects.toThrow(
        'IndexedDB not available'
      )
    })

    test('throws error when template type is missing', async () => {
      const template = { title: 'Test Task' }

      await expect(saveTemplate(template)).rejects.toThrow(
        'Invalid template data: Template type is required'
      )
    })

    test('throws error when template type is invalid', async () => {
      const template = { type: 'invalid', title: 'Test Task' }

      try {
        await saveTemplate(template)
        // If no error is thrown, fail the test
        throw new Error('Expected saveTemplate to throw')
      } catch (err) {
        expect(err.message).toContain('Invalid template data')
        expect(err.message).toContain('task, routine')
      }
    })

    test('throws error when title is missing', async () => {
      const template = { type: 'task' }

      await expect(saveTemplate(template)).rejects.toThrow(
        'Invalid template data: Template title is required'
      )
    })

    test('throws error when title is empty', async () => {
      const template = { type: 'task', title: '' }

      await expect(saveTemplate(template)).rejects.toThrow(
        'Invalid template data: Template title cannot be empty'
      )
    })

    test('throws error when title is not a string', async () => {
      const template = { type: 'task', title: 123 }

      await expect(saveTemplate(template)).rejects.toThrow(
        'Invalid template data'
      )
      await expect(saveTemplate(template)).rejects.toThrow('must be a string')
    })

    test('throws error when routine steps is not an array', async () => {
      const template = {
        type: 'routine',
        title: 'Test Routine',
        steps: 'not an array'
      }

      await expect(saveTemplate(template)).rejects.toThrow(
        'Invalid template data'
      )
      await expect(saveTemplate(template)).rejects.toThrow('must be an array')
    })

    test('throws error when routine step is invalid', async () => {
      const template = {
        type: 'routine',
        title: 'Test Routine',
        steps: [{ duration: 60 }]
      }

      await expect(saveTemplate(template)).rejects.toThrow(
        'Invalid template data'
      )
      await expect(saveTemplate(template)).rejects.toThrow('must have a label')
    })
  })

  describe('updateTemplate', () => {
    test('updates an existing template', async () => {
      const existingTemplate = {
        id: 'test-id',
        type: 'task',
        title: 'Old Title'
      }

      // Store the template in the mock data store
      mockDB.mockDataStore.set('test-id', existingTemplate)

      await updateTemplate('test-id', { title: 'New Title' })

      expect(mockDB.transaction).toHaveBeenCalledWith('templates', 'readwrite')

      // Verify the update happened
      const updated = mockDB.mockDataStore.get('test-id')
      expect(updated.title).toBe('New Title')
    })

    test('throws error when template not found', async () => {
      // Ensure the template doesn't exist in mock data store
      mockDB.mockDataStore.clear()

      await expect(updateTemplate('non-existent', {})).rejects.toThrow(
        'Template not found'
      )
    })

    test('throws error when update results in invalid template', async () => {
      const existingTemplate = {
        id: 'test-id',
        type: 'task',
        title: 'Old Title'
      }

      mockDB.mockDataStore.set('test-id', existingTemplate)

      await expect(updateTemplate('test-id', { title: '' })).rejects.toThrow(
        'Invalid template data'
      )
    })

    test('throws error when updating to invalid type', async () => {
      const existingTemplate = {
        id: 'test-id',
        type: 'task',
        title: 'Test Title'
      }

      mockDB.mockDataStore.set('test-id', existingTemplate)

      await expect(
        updateTemplate('test-id', { type: 'invalid' })
      ).rejects.toThrow('Invalid template data')
    })
  })

  describe('deleteTemplate', () => {
    test('deletes a template by ID', async () => {
      await deleteTemplate('test-id')

      expect(mockDB.transaction).toHaveBeenCalledWith('templates', 'readwrite')
    })
  })

  describe('duplicateTemplate', () => {
    test('creates a copy of an existing template', async () => {
      const originalTemplate = {
        id: 'original-id',
        type: 'task',
        title: 'Original Template',
        tags: ['work']
      }

      mockDB.mockDataStore.set('original-id', originalTemplate)

      const newId = await duplicateTemplate('original-id')

      expect(newId).toBe('test-uuid-123')
      expect(mockDB.transaction).toHaveBeenCalled()
    })

    test('throws error when template not found', async () => {
      mockDB.mockDataStore.clear()

      await expect(duplicateTemplate('non-existent')).rejects.toThrow(
        'Template not found'
      )
    })
  })

  describe('markTemplateUsed', () => {
    test('updates lastUsed timestamp', async () => {
      const existingTemplate = {
        id: 'test-id',
        type: 'task',
        title: 'Test'
      }

      mockDB.mockDataStore.set('test-id', existingTemplate)

      await markTemplateUsed('test-id')

      expect(mockDB.transaction).toHaveBeenCalled()
    })
  })

  describe('filterTemplates', () => {
    const mockTemplates = [
      {
        id: '1',
        type: 'task',
        title: 'Work Task',
        tags: ['work', 'urgent']
      },
      {
        id: '2',
        type: 'routine',
        title: 'Morning Routine',
        tags: ['health'],
        estimatedDuration: 600
      },
      {
        id: '3',
        type: 'task',
        title: 'Personal Task',
        tags: ['personal']
      }
    ]

    test('filters by type', () => {
      const result = filterTemplates(mockTemplates, { type: 'task' })
      expect(result).toHaveLength(2)
      expect(result.every((t) => t.type === 'task')).toBe(true)
    })

    test('filters by tags', () => {
      const result = filterTemplates(mockTemplates, { tags: ['work'] })
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Work Task')
    })

    test('filters by duration range', () => {
      const result = filterTemplates(mockTemplates, {
        durationMin: 500,
        durationMax: 700,
        type: 'routine' // Filter by routine type as well
      })
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Morning Routine')
    })

    test('filters by search query', () => {
      const result = filterTemplates(mockTemplates, { query: 'routine' })
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Morning Routine')
    })

    test('returns all templates when no filters applied', () => {
      const result = filterTemplates(mockTemplates, {})
      expect(result).toHaveLength(3)
    })
  })

  describe('sortTemplates', () => {
    const mockTemplates = [
      {
        id: '1',
        title: 'B Task',
        lastUsed: '2024-01-01T00:00:00Z',
        estimatedDuration: 300,
        createdAt: '2024-01-03T00:00:00Z'
      },
      {
        id: '2',
        title: 'A Task',
        lastUsed: '2024-01-02T00:00:00Z',
        estimatedDuration: 600,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        title: 'C Task',
        lastUsed: null,
        estimatedDuration: 150,
        createdAt: '2024-01-02T00:00:00Z'
      }
    ]

    test('sorts by title alphabetically', () => {
      const result = sortTemplates(mockTemplates, 'title')
      expect(result[0].title).toBe('A Task')
      expect(result[1].title).toBe('B Task')
      expect(result[2].title).toBe('C Task')
    })

    test('sorts by lastUsed date descending', () => {
      const result = sortTemplates(mockTemplates, 'lastUsed')
      expect(result[0].title).toBe('A Task')
      expect(result[1].title).toBe('B Task')
      expect(result[2].title).toBe('C Task')
    })

    test('sorts by duration ascending', () => {
      const result = sortTemplates(mockTemplates, 'duration')
      expect(result[0].estimatedDuration).toBe(150)
      expect(result[1].estimatedDuration).toBe(300)
      expect(result[2].estimatedDuration).toBe(600)
    })

    test('sorts by creation date descending', () => {
      const result = sortTemplates(mockTemplates, 'dateCreated')
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('3')
      expect(result[2].id).toBe('2')
    })

    test('returns original order for unknown sort field', () => {
      const result = sortTemplates(mockTemplates, 'unknown')
      expect(result).toEqual(mockTemplates)
    })
  })

  describe('exportTemplates', () => {
    test('exports all templates', async () => {
      const mockTemplates = [{ id: '1', type: 'task', title: 'Test' }]

      mockDB.mockDataStore.set('1', mockTemplates[0])

      const result = await exportTemplates()

      expect(result).toHaveProperty('version', '1.0')
      expect(result).toHaveProperty('exportDate')
      expect(result).toHaveProperty('templates')
      expect(result.templates).toEqual(mockTemplates)
    })

    test('exports specific templates by ID', async () => {
      const mockTemplates = [
        { id: '1', type: 'task', title: 'Test 1' },
        { id: '2', type: 'task', title: 'Test 2' }
      ]

      mockDB.mockDataStore.set('1', mockTemplates[0])
      mockDB.mockDataStore.set('2', mockTemplates[1])

      const result = await exportTemplates(['1'])

      expect(result.templates).toHaveLength(1)
      expect(result.templates[0].id).toBe('1')
    })
  })

  describe('importTemplates', () => {
    test('imports valid templates', async () => {
      const importData = {
        version: '1.0',
        templates: [{ id: 'import-1', type: 'task', title: 'Imported Task' }]
      }

      // Ensure no collision by clearing the store
      mockDB.mockDataStore.clear()

      const result = await importTemplates(importData)

      expect(result.imported).toBe(1)
      expect(result.skipped).toBe(0)
      expect(result.errors).toHaveLength(0)
    })

    test('handles ID collisions by generating new IDs', async () => {
      const importData = {
        version: '1.0',
        templates: [{ id: 'existing-id', type: 'task', title: 'Imported Task' }]
      }

      // Mock an existing template with collision
      mockDB.mockDataStore.set('existing-id', {
        id: 'existing-id',
        title: 'Existing',
        type: 'task'
      })

      const result = await importTemplates(importData)

      expect(result.imported).toBe(1)
      expect(uuidv4).toHaveBeenCalled()
    })

    test('throws error for missing version field', async () => {
      const invalidData = { templates: [] }

      await expect(importTemplates(invalidData)).rejects.toThrow(
        'Invalid import data: missing version field'
      )
    })

    test('throws error for incompatible version', async () => {
      const invalidData = {
        version: '2.0',
        templates: []
      }

      await expect(importTemplates(invalidData)).rejects.toThrow(
        'Incompatible version: 2.0'
      )
    })

    test('throws error for null data', async () => {
      await expect(importTemplates(null)).rejects.toThrow(
        'Invalid import data: data must be an object'
      )
    })

    test('throws error for non-object data', async () => {
      await expect(importTemplates('string')).rejects.toThrow(
        'Invalid import data: data must be an object'
      )
    })

    test('throws error for invalid import data without templates', async () => {
      const invalidData = { version: '1.0' }

      await expect(importTemplates(invalidData)).rejects.toThrow(
        'Invalid import data: missing templates array'
      )
    })

    test('throws error when templates is not an array', async () => {
      const invalidData = {
        version: '1.0',
        templates: 'not an array'
      }

      await expect(importTemplates(invalidData)).rejects.toThrow(
        'Invalid import data: missing templates array'
      )
    })

    test('skips templates with invalid structure', async () => {
      const importData = {
        version: '1.0',
        templates: [
          { id: '1', type: 'task', title: 'Valid Task' },
          { id: '2', type: 'invalid-type', title: 'Invalid Task' }
        ]
      }

      mockDB.mockDataStore.clear()

      const result = await importTemplates(importData)

      expect(result.imported).toBe(1)
      expect(result.skipped).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toContain('task, routine')
    })

    test('skips templates with missing required fields', async () => {
      const importData = {
        version: '1.0',
        templates: [
          { id: '1', type: 'task', title: 'Valid Task' },
          { id: '2', type: 'task' } // Missing title
        ]
      }

      mockDB.mockDataStore.clear()

      const result = await importTemplates(importData)

      expect(result.imported).toBe(1)
      expect(result.skipped).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toContain('title is required')
    })

    test('handles errors during import gracefully', async () => {
      const importData = {
        version: '1.0',
        templates: [
          { id: '1', type: 'task', title: 'Task 1' },
          { id: '2', type: 'task', title: 'Task 2' }
        ]
      }

      // Mock get to return null for first template, but throw error for second
      let callCount = 0
      mockDB.mockStore.get.mockImplementation(() => {
        callCount++
        return createMockRequest(null)
      })

      // Mock put to succeed first time
      mockDB.mockStore.put.mockImplementation((template) => {
        if (template.id === '2') {
          // Second template will fail during put
          return createMockRequest(null, true) // Error
        }
        mockDataStore.set(template.id, template)
        return createMockRequest()
      })

      const result = await importTemplates(importData)

      expect(result.imported).toBe(1)
      expect(result.skipped).toBe(1)
      expect(result.errors).toHaveLength(1)
    })

    test('validates template structure before importing', async () => {
      const importData = {
        version: '1.0',
        templates: [
          {
            id: '1',
            type: 'routine',
            title: 'Invalid Routine',
            steps: 'not an array'
          }
        ]
      }

      mockDB.mockStore.get.mockReturnValue(createMockRequest(null))

      const result = await importTemplates(importData)

      expect(result.imported).toBe(0)
      expect(result.skipped).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toContain('must be an array')
    })

    test('throws error for invalid version string that cannot be coerced', async () => {
      const importData = {
        version: 'invalid-version-string',
        templates: [{ id: '1', type: 'task', title: 'Task 1' }]
      }

      await expect(importTemplates(importData)).rejects.toThrow(
        /Incompatible version.*invalid-version-string/
      )
    })
  })
})
