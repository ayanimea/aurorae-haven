import { validateTemplateData } from '../utils/validation'

describe('validateTemplateData', () => {
  describe('valid templates', () => {
    test('accepts valid task template', () => {
      const template = {
        type: 'task',
        title: 'Test Task',
        tags: ['work'],
        category: 'Development',
        quadrant: 'urgent_important'
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('accepts valid routine template', () => {
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

      const result = validateTemplateData(template)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('accepts template with minimal required fields', () => {
      const template = {
        type: 'task',
        title: 'Minimal Task'
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('accepts routine template without steps', () => {
      const template = {
        type: 'routine',
        title: 'Empty Routine'
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('accepts routine template with empty steps array', () => {
      const template = {
        type: 'routine',
        title: 'Empty Steps Routine',
        steps: []
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('accepts step without duration', () => {
      const template = {
        type: 'routine',
        title: 'Flexible Routine',
        steps: [{ label: 'Step without duration' }]
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('invalid templates', () => {
    test('rejects null template', () => {
      const result = validateTemplateData(null)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template must be an object')
    })

    test('rejects undefined template', () => {
      const result = validateTemplateData(undefined)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template must be an object')
    })

    test('rejects non-object template', () => {
      const result = validateTemplateData('not an object')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template must be an object')
    })
  })

  describe('type validation', () => {
    test('rejects template without type', () => {
      const template = {
        title: 'Test Task'
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template type is required')
    })

    test('rejects invalid type', () => {
      const template = {
        type: 'invalid-type',
        title: 'Test Task'
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Template type must be one of: task, routine (found: invalid-type)'
      )
    })

    test('rejects numeric type', () => {
      const template = {
        type: 123,
        title: 'Test Task'
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template type must be a string')
    })

    test('accepts uppercase type values', () => {
      const template = {
        type: 'TASK',
        title: 'Test Task'
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('accepts mixed case type values', () => {
      const template = {
        type: 'Routine',
        title: 'Test Routine'
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('accepts type values with surrounding whitespace', () => {
      const template = {
        type: '  task  ',
        title: 'Test Task'
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })

  describe('title validation', () => {
    test('rejects template without title', () => {
      const template = {
        type: 'task'
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template title is required')
    })

    test('rejects null title', () => {
      const template = {
        type: 'task',
        title: null
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template title is required')
    })

    test('rejects empty string title', () => {
      const template = {
        type: 'task',
        title: ''
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template title cannot be empty')
    })

    test('rejects whitespace-only title', () => {
      const template = {
        type: 'task',
        title: '   '
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template title cannot be empty')
    })

    test('rejects non-string title', () => {
      const template = {
        type: 'task',
        title: 123
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Template title must be a string (found: number)'
      )
    })
  })

  describe('routine-specific validation', () => {
    test('rejects non-array steps', () => {
      const template = {
        type: 'routine',
        title: 'Test Routine',
        steps: 'not an array'
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Routine template steps must be an array (found: string)'
      )
    })

    test('rejects step without label', () => {
      const template = {
        type: 'routine',
        title: 'Test Routine',
        steps: [{ duration: 60 }]
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Template step 0 must have a label (string) property'
      )
    })

    test('rejects step with non-string label', () => {
      const template = {
        type: 'routine',
        title: 'Test Routine',
        steps: [{ label: 123, duration: 60 }]
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Template step 0 must have a label (string) property'
      )
    })

    test('rejects step with non-number duration', () => {
      const template = {
        type: 'routine',
        title: 'Test Routine',
        steps: [{ label: 'Step 1', duration: 'not a number' }]
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Template step 0 duration must be a number (found: string)'
      )
    })

    test('rejects non-object step', () => {
      const template = {
        type: 'routine',
        title: 'Test Routine',
        steps: ['string step']
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template step 0 must be an object')
    })

    test('rejects non-number estimatedDuration', () => {
      const template = {
        type: 'routine',
        title: 'Test Routine',
        estimatedDuration: 'not a number'
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Routine estimatedDuration must be a number (found: string)'
      )
    })

    test('rejects negative estimatedDuration', () => {
      const template = {
        type: 'routine',
        title: 'Test Routine',
        estimatedDuration: -100
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Template estimatedDuration must be non-negative'
      )
    })

    test('accepts zero estimatedDuration', () => {
      const template = {
        type: 'routine',
        title: 'Test Routine',
        estimatedDuration: 0
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('tags validation', () => {
    test('rejects non-array tags', () => {
      const template = {
        type: 'task',
        title: 'Test Task',
        tags: 'not an array'
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Template tags must be an array (found: string)'
      )
    })

    test('rejects non-string tag', () => {
      const template = {
        type: 'task',
        title: 'Test Task',
        tags: ['valid', 123, 'another valid']
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Template tag 1 must be a string (found: number)'
      )
    })

    test('accepts empty tags array', () => {
      const template = {
        type: 'task',
        title: 'Test Task',
        tags: []
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('multiple errors', () => {
    test('reports all validation errors', () => {
      const template = {
        type: 'invalid',
        title: '',
        tags: 'not an array',
        steps: 'not an array'
      }

      const result = validateTemplateData(template)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors).toContain(
        'Template type must be one of: task, routine (found: invalid)'
      )
      expect(result.errors).toContain('Template title cannot be empty')
      expect(result.errors).toContain(
        'Template tags must be an array (found: string)'
      )
    })
  })
})
