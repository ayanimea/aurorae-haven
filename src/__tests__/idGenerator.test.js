/**
 * Tests for centralized ID generation utilities
 */

import {
  generateTimestampId,
  generateUniqueId,
  generateRoutineId,
  generateStepId,
  generateHabitId,
  generateScheduleId,
  generateTemplateId,
  generateNoteId,
  shouldRegenerateId,
  ensureId,
  generateMetadata,
  normalizeEntity,
  updateMetadata,
  getCurrentTimestamp
} from '../utils/idGenerator'

describe('idGenerator', () => {
  describe('generateTimestampId', () => {
    test('generates numeric timestamp without prefix', () => {
      const id = generateTimestampId()
      expect(typeof id).toBe('number')
      expect(id).toBeGreaterThan(0)
    })

    test('generates prefixed timestamp string', () => {
      const id = generateTimestampId('test')
      expect(typeof id).toBe('string')
      expect(id).toMatch(/^test_\d+$/)
    })

    test('generates unique IDs on subsequent calls', async () => {
      const id1 = generateTimestampId('item')
      await new Promise((resolve) => setTimeout(resolve, 5))
      const id2 = generateTimestampId('item')
      expect(id1).not.toBe(id2)
    })
  })

  describe('generateUniqueId', () => {
    test('generates prefixed UUID', () => {
      const id = generateUniqueId('entity')
      expect(typeof id).toBe('string')
      expect(id).toMatch(/^entity_/)
    })

    test('generates unique IDs', () => {
      const id1 = generateUniqueId()
      const id2 = generateUniqueId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('specific ID generators', () => {
    test('generateRoutineId returns routine_ prefixed ID', () => {
      const id = generateRoutineId()
      expect(id).toMatch(/^routine_\d+(_\d+)?$/)
    })

    test('generateStepId returns step_ prefixed ID', () => {
      const id = generateStepId()
      expect(id).toMatch(/^step_\d+(_\d+)?$/)
    })

    test('generateRoutineId generates unique IDs for same-millisecond calls', () => {
      const ids = []
      for (let i = 0; i < 5; i++) {
        ids.push(generateRoutineId())
      }
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    test('generateStepId generates unique IDs for same-millisecond calls', () => {
      const ids = []
      for (let i = 0; i < 5; i++) {
        ids.push(generateStepId())
      }
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    test('generateHabitId returns numeric timestamp', () => {
      const id = generateHabitId()
      expect(typeof id).toBe('number')
      expect(id).toBeGreaterThan(0)
    })

    test('generateScheduleId returns numeric timestamp', () => {
      const id = generateScheduleId()
      expect(typeof id).toBe('number')
      expect(id).toBeGreaterThan(0)
    })

    test('generateTemplateId returns numeric timestamp', () => {
      const id = generateTemplateId()
      expect(typeof id).toBe('number')
      expect(id).toBeGreaterThan(0)
    })

    test('generateNoteId returns numeric timestamp', () => {
      const id = generateNoteId()
      expect(typeof id).toBe('number')
      expect(id).toBeGreaterThan(0)
    })
  })

  describe('shouldRegenerateId', () => {
    test('returns true for missing IDs', () => {
      expect(shouldRegenerateId(null)).toBe(true)
      expect(shouldRegenerateId(undefined)).toBe(true)
      expect(shouldRegenerateId('')).toBe(true)
    })

    test('returns false for valid IDs', () => {
      expect(shouldRegenerateId('valid-id')).toBe(false)
      expect(shouldRegenerateId(123)).toBe(false)
      expect(shouldRegenerateId('0')).toBe(false)
    })
  })

  describe('ensureId', () => {
    test('preserves existing valid ID', () => {
      const entity = { id: 'existing-id', name: 'Test' }
      const result = ensureId(entity)
      expect(result.id).toBe('existing-id')
      expect(result.name).toBe('Test')
    })

    test('generates ID when missing', () => {
      const entity = { name: 'Test' }
      const result = ensureId(entity)
      expect(result.id).toBeDefined()
      expect(result.name).toBe('Test')
    })

    test('uses custom ID generator', () => {
      const entity = { name: 'Test' }
      const customGenerator = () => 'custom-id'
      const result = ensureId(entity, customGenerator)
      expect(result.id).toBe('custom-id')
    })

    test('regenerates null ID', () => {
      const entity = { id: null, name: 'Test' }
      const result = ensureId(entity)
      expect(result.id).not.toBeNull()
      expect(result.id).toBeDefined()
    })
  })

  describe('generateMetadata', () => {
    test('generates metadata with timestamp, createdAt, and updatedAt', () => {
      const metadata = generateMetadata()
      expect(metadata).toHaveProperty('timestamp')
      expect(metadata).toHaveProperty('createdAt')
      expect(metadata).toHaveProperty('updatedAt')
    })

    test('timestamp is a number', () => {
      const metadata = generateMetadata()
      expect(typeof metadata.timestamp).toBe('number')
      expect(metadata.timestamp).toBeGreaterThan(0)
    })

    test('createdAt and updatedAt are ISO strings', () => {
      const metadata = generateMetadata()
      expect(typeof metadata.createdAt).toBe('string')
      expect(typeof metadata.updatedAt).toBe('string')
      // Verify ISO 8601 format
      expect(metadata.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
      expect(metadata.updatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
    })

    test('createdAt and updatedAt are initially equal', () => {
      const metadata = generateMetadata()
      expect(metadata.createdAt).toBe(metadata.updatedAt)
    })

    test('timestamp matches createdAt time', () => {
      const metadata = generateMetadata()
      const timestampFromISO = new Date(metadata.createdAt).getTime()
      expect(metadata.timestamp).toBe(timestampFromISO)
    })
  })

  describe('normalizeEntity', () => {
    test('adds ID and metadata to entity without ID', () => {
      const entity = { name: 'Test Entity' }
      const result = normalizeEntity(entity)

      expect(result.name).toBe('Test Entity')
      expect(result.id).toBeDefined()
      expect(result.timestamp).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    test('preserves existing ID', () => {
      const entity = { id: 'existing-123', name: 'Test' }
      const result = normalizeEntity(entity)

      expect(result.id).toBe('existing-123')
      expect(result.timestamp).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    test('generates numeric timestamp ID without prefix', () => {
      const entity = { name: 'Test' }
      const result = normalizeEntity(entity)

      expect(typeof result.id).toBe('number')
      expect(result.id).toBeGreaterThan(0)
    })

    test('generates prefixed timestamp ID with idPrefix option', () => {
      const entity = { name: 'Test Routine' }
      const result = normalizeEntity(entity, { idPrefix: 'routine' })

      expect(typeof result.id).toBe('string')
      expect(result.id).toMatch(/^routine_\d+(_\d+)?$/)
    })

    test('preserves all entity properties', () => {
      const entity = {
        name: 'Test',
        description: 'A test entity',
        tags: ['test', 'sample']
      }
      const result = normalizeEntity(entity)

      expect(result.name).toBe('Test')
      expect(result.description).toBe('A test entity')
      expect(result.tags).toEqual(['test', 'sample'])
    })

    test('metadata fields are consistent with generateMetadata', () => {
      const entity = { name: 'Test' }
      const result = normalizeEntity(entity)

      expect(result.createdAt).toBe(result.updatedAt)
      expect(new Date(result.createdAt).getTime()).toBe(result.timestamp)
    })

    test('generates unique IDs for same-millisecond creates without prefix', async () => {
      // Add delay to ensure clean timestamp for test isolation
      // This prevents contamination from previous tests' module-level counters
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Mock Date.now() to return a fixed timestamp for all entity creations
      // This ensures all entities are created "within the same millisecond" for testing collision prevention
      const fixedTimestamp = 1234567890000
      const originalDateNow = Date.now
      Date.now = jest.fn(() => fixedTimestamp)

      try {
        // Create multiple entities synchronously (within same millisecond)
        const entities = []
        for (let i = 0; i < 5; i++) {
          entities.push(normalizeEntity({ name: `Entity ${i}` }))
        }

        // Verify all IDs are unique
        const ids = entities.map((e) => e.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(ids.length)

        // First ID should be numeric timestamp
        expect(typeof ids[0]).toBe('number')
        expect(ids[0]).toBe(fixedTimestamp)

        // Subsequent IDs should be strings with counter suffix (since created in same ms)
        for (let i = 1; i < ids.length; i++) {
          expect(typeof ids[i]).toBe('string')
          expect(ids[i]).toMatch(/^\d+\.\d{3}$/)
        }
      } finally {
        // Restore original Date.now()
        Date.now = originalDateNow
      }
    })

    test('generates unique IDs for same-millisecond creates with prefix', () => {
      // Create multiple entities synchronously with prefix
      const entities = []
      for (let i = 0; i < 5; i++) {
        entities.push(
          normalizeEntity({ name: `Entity ${i}` }, { idPrefix: 'test' })
        )
      }

      // Verify all IDs are unique
      const ids = entities.map((e) => e.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)

      // Verify IDs match the expected format (with optional counter)
      ids.forEach((id) => {
        expect(typeof id).toBe('string')
        expect(id).toMatch(/^test_\d+(_\d+)?$/)
      })
    })

    test('counter resets when timestamp changes', async () => {
      // Create first entity
      const entity1 = normalizeEntity({ name: 'Entity 1' })

      // Wait for timestamp to change
      await new Promise((resolve) => setTimeout(resolve, 5))

      // Create second entity - should have different timestamp, no counter needed
      const entity2 = normalizeEntity({ name: 'Entity 2' })

      expect(entity1.id).not.toBe(entity2.id)
      expect(entity2.timestamp).toBeGreaterThan(entity1.timestamp)
    })

    test('handles multiple same-millisecond creates with sequential counters', async () => {
      // Add delay to ensure clean timestamp for test isolation
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Create many entities synchronously (within same millisecond)
      const count = 100 // Reduced count to ensure they're created in same ms
      const entities = []
      for (let i = 0; i < count; i++) {
        entities.push(normalizeEntity({ name: `Entity ${i}` }))
      }

      // Verify all IDs are unique
      const ids = entities.map((e) => e.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)

      // First ID should be numeric timestamp
      expect(typeof ids[0]).toBe('number')

      // Count how many IDs were created in the same millisecond (have string format)
      const stringIds = ids.filter((id) => typeof id === 'string')
      
      // If we created multiple IDs in same millisecond, verify format
      if (stringIds.length > 0) {
        stringIds.forEach((id) => {
          expect(id).toMatch(/^\d+\.\d{3}$/)
        })
        
        // Group string IDs by their millisecond timestamp and verify
        // that counters within each group are sequential starting from 1.
        const countersByTimestamp = {}
        stringIds.forEach((id) => {
          const [timestampPart, counterPart] = id.split('.')
          const counterValue = parseInt(counterPart, 10)

          if (!countersByTimestamp[timestampPart]) {
            countersByTimestamp[timestampPart] = []
          }
          countersByTimestamp[timestampPart].push(counterValue)
        })

        Object.values(countersByTimestamp).forEach((counters) => {
          const sortedCounters = counters.slice().sort((a, b) => a - b)

          sortedCounters.forEach((value, index) => {
            // For each millisecond, counters should be 1, 2, 3, ...
            expect(value).toBe(index + 1)
          })
        })
      }
    })
  })

  describe('updateMetadata', () => {
    test('updates updatedAt and timestamp', () => {
      const entity = {
        id: 1,
        name: 'Test',
        createdAt: '2023-01-01T00:00:00.000Z',
        timestamp: 1672531200000
      }

      const result = updateMetadata(entity)

      expect(result.id).toBe(1)
      expect(result.name).toBe('Test')
      expect(result.createdAt).toBe('2023-01-01T00:00:00.000Z')
      expect(result.updatedAt).toBeDefined()
      expect(result.timestamp).toBeDefined()
      expect(result.timestamp).toBeGreaterThan(1672531200000)
    })

    test('preserves createdAt', () => {
      const originalCreatedAt = '2023-01-01T00:00:00.000Z'
      const entity = {
        id: 1,
        name: 'Test',
        createdAt: originalCreatedAt
      }

      const result = updateMetadata(entity)

      expect(result.createdAt).toBe(originalCreatedAt)
    })

    test('updatedAt is an ISO string', () => {
      const entity = { id: 1, name: 'Test' }
      const result = updateMetadata(entity)

      expect(typeof result.updatedAt).toBe('string')
      expect(result.updatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
    })

    test('timestamp is a number', () => {
      const entity = { id: 1, name: 'Test' }
      const result = updateMetadata(entity)

      expect(typeof result.timestamp).toBe('number')
      expect(result.timestamp).toBeGreaterThan(0)
    })

    test('preserves all entity properties', () => {
      const entity = {
        id: 1,
        name: 'Test',
        description: 'Description',
        tags: ['tag1', 'tag2'],
        createdAt: '2023-01-01T00:00:00.000Z'
      }

      const result = updateMetadata(entity)

      expect(result.id).toBe(1)
      expect(result.name).toBe('Test')
      expect(result.description).toBe('Description')
      expect(result.tags).toEqual(['tag1', 'tag2'])
    })

    test('timestamp matches updatedAt time', () => {
      const entity = { id: 1, name: 'Test' }
      const result = updateMetadata(entity)

      const timestampFromISO = new Date(result.updatedAt).getTime()
      expect(result.timestamp).toBe(timestampFromISO)
    })
  })

  describe('getCurrentTimestamp', () => {
    test('returns an ISO string', () => {
      const timestamp = getCurrentTimestamp()
      expect(typeof timestamp).toBe('string')
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    test('returns current time', () => {
      const before = Date.now()
      const timestamp = getCurrentTimestamp()
      const after = Date.now()

      const timestampMs = new Date(timestamp).getTime()
      expect(timestampMs).toBeGreaterThanOrEqual(before)
      expect(timestampMs).toBeLessThanOrEqual(after)
    })

    test('generates different timestamps on subsequent calls', async () => {
      const timestamp1 = getCurrentTimestamp()
      await new Promise((resolve) => setTimeout(resolve, 5))
      const timestamp2 = getCurrentTimestamp()

      expect(timestamp1).not.toBe(timestamp2)
    })
  })
})
