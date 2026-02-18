/**
 * @jest-environment jsdom
 */

import {
  diagnoseTemplateTypes,
  fixCorruptedTemplateTypes,
  needsTemplateMigration,
  resetMigrationFlag
} from '../utils/templateMigration'
import * as templatesManager from '../utils/templatesManager'
import * as predefinedTemplates from '../utils/predefinedTemplates'

// Mock dependencies
jest.mock('../utils/templatesManager')
jest.mock('../utils/predefinedTemplates')
jest.mock('../utils/logger', () => ({
  createLogger: () => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}))

describe('templateMigration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('diagnoseTemplateTypes', () => {
    test('should identify corrupted templates with wrong type', async () => {
      // Arrange
      const storedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'task' }, // WRONG!
        { id: 'task-email', title: 'Email Task', type: 'task' }
      ]
      const predefinedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'routine' },
        { id: 'task-email', title: 'Email Task', type: 'task' }
      ]

      templatesManager.getAllTemplates.mockResolvedValue(storedTemplates)
      predefinedTemplates.getPredefinedTemplates.mockReturnValue(predefinedTemplates)

      // Act
      const result = await diagnoseTemplateTypes()

      // Assert
      expect(result.total).toBe(2)
      expect(result.correct).toBe(1)
      expect(result.corrupted).toHaveLength(1)
      expect(result.corrupted[0]).toEqual({
        id: 'routine-morning',
        title: 'Morning Routine',
        storedType: 'task',
        correctType: 'routine'
      })
    })

    test('should treat custom user templates as correct', async () => {
      // Arrange
      const storedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'routine' },
        { id: 'custom-user-template', title: 'My Custom Template', type: 'task' }
      ]
      const predefinedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'routine' }
        // custom-user-template is NOT in predefined list
      ]

      templatesManager.getAllTemplates.mockResolvedValue(storedTemplates)
      predefinedTemplates.getPredefinedTemplates.mockReturnValue(predefinedTemplates)

      // Act
      const result = await diagnoseTemplateTypes()

      // Assert
      expect(result.total).toBe(2)
      expect(result.correct).toBe(2) // Both counted as correct
      expect(result.corrupted).toHaveLength(0)
    })

    test('should identify missing predefined templates', async () => {
      // Arrange
      const storedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'routine' }
      ]
      const predefinedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'routine' },
        { id: 'routine-evening', title: 'Evening Routine', type: 'routine' }
      ]

      templatesManager.getAllTemplates.mockResolvedValue(storedTemplates)
      predefinedTemplates.getPredefinedTemplates.mockReturnValue(predefinedTemplates)

      // Act
      const result = await diagnoseTemplateTypes()

      // Assert
      expect(result.missing).toHaveLength(1)
      expect(result.missing[0]).toEqual({
        id: 'routine-evening',
        title: 'Evening Routine',
        type: 'routine'
      })
    })

    test('should handle empty template lists', async () => {
      // Arrange
      templatesManager.getAllTemplates.mockResolvedValue([])
      predefinedTemplates.getPredefinedTemplates.mockReturnValue([])

      // Act
      const result = await diagnoseTemplateTypes()

      // Assert
      expect(result.total).toBe(0)
      expect(result.correct).toBe(0)
      expect(result.corrupted).toHaveLength(0)
      expect(result.missing).toHaveLength(0)
    })

    test('should handle templates with null or undefined types', async () => {
      // Arrange
      const storedTemplates = [
        { id: 'template-1', title: 'Template 1', type: null },
        { id: 'template-2', title: 'Template 2', type: undefined }
      ]
      const predefinedTemplates = [
        { id: 'template-1', title: 'Template 1', type: 'task' },
        { id: 'template-2', title: 'Template 2', type: 'routine' }
      ]

      templatesManager.getAllTemplates.mockResolvedValue(storedTemplates)
      predefinedTemplates.getPredefinedTemplates.mockReturnValue(predefinedTemplates)

      // Act
      const result = await diagnoseTemplateTypes()

      // Assert
      expect(result.corrupted).toHaveLength(2)
    })

    test('should throw error when getAllTemplates fails', async () => {
      // Arrange
      templatesManager.getAllTemplates.mockRejectedValue(new Error('IndexedDB error'))

      // Act & Assert
      await expect(diagnoseTemplateTypes()).rejects.toThrow('IndexedDB error')
    })
  })

  describe('fixCorruptedTemplateTypes', () => {
    test('should fix corrupted templates and set migration flag', async () => {
      // Arrange
      const storedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'task' }, // WRONG!
        { id: 'routine-evening', title: 'Evening Routine', type: 'task' }  // WRONG!
      ]
      const predefinedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'routine' },
        { id: 'routine-evening', title: 'Evening Routine', type: 'routine' }
      ]

      templatesManager.getAllTemplates.mockResolvedValue(storedTemplates)
      predefinedTemplates.getPredefinedTemplates.mockReturnValue(predefinedTemplates)
      templatesManager.updateTemplate.mockResolvedValue(undefined)

      // Act
      const result = await fixCorruptedTemplateTypes()

      // Assert
      expect(result.fixed).toBe(2)
      expect(result.errors).toHaveLength(0)
      expect(templatesManager.updateTemplate).toHaveBeenCalledTimes(2)
      expect(templatesManager.updateTemplate).toHaveBeenCalledWith('routine-morning', {
        type: 'routine'
      })
      expect(templatesManager.updateTemplate).toHaveBeenCalledWith('routine-evening', {
        type: 'routine'
      })
      // Check migration flag was set
      expect(localStorage.getItem('aurorae_templates_migrated_v1')).toBe('true')
    })

    test('should set migration flag even when no corruption found', async () => {
      // Arrange
      const storedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'routine' }
      ]
      const predefinedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'routine' }
      ]

      templatesManager.getAllTemplates.mockResolvedValue(storedTemplates)
      predefinedTemplates.getPredefinedTemplates.mockReturnValue(predefinedTemplates)

      // Act
      const result = await fixCorruptedTemplateTypes()

      // Assert
      expect(result.fixed).toBe(0)
      expect(result.errors).toHaveLength(0)
      expect(templatesManager.updateTemplate).not.toHaveBeenCalled()
      // Flag should still be set
      expect(localStorage.getItem('aurorae_templates_migrated_v1')).toBe('true')
    })

    test('should handle errors during individual template fixes', async () => {
      // Arrange
      const storedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'task' },
        { id: 'routine-evening', title: 'Evening Routine', type: 'task' }
      ]
      const predefinedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'routine' },
        { id: 'routine-evening', title: 'Evening Routine', type: 'routine' }
      ]

      templatesManager.getAllTemplates.mockResolvedValue(storedTemplates)
      predefinedTemplates.getPredefinedTemplates.mockReturnValue(predefinedTemplates)
      // First update succeeds, second fails
      templatesManager.updateTemplate
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Update failed'))

      // Act
      const result = await fixCorruptedTemplateTypes()

      // Assert
      expect(result.fixed).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        id: 'routine-evening',
        error: 'Update failed'
      })
      // Flag should NOT be set when there are errors
      expect(localStorage.getItem('aurorae_templates_migrated_v1')).toBeNull()
    })

    test('should handle predefined template not found', async () => {
      // Arrange - stored template exists but not in predefined list
      const storedTemplates = [
        { id: 'unknown-template', title: 'Unknown', type: 'task' }
      ]
      const predefinedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'routine' }
      ]

      templatesManager.getAllTemplates.mockResolvedValue(storedTemplates)
      predefinedTemplates.getPredefinedTemplates.mockReturnValue(predefinedTemplates)

      // Act
      const result = await fixCorruptedTemplateTypes()

      // Assert
      expect(result.fixed).toBe(0)
      expect(result.errors).toHaveLength(0) // Custom templates are skipped, not errors
    })

    test('should throw error when diagnosis fails', async () => {
      // Arrange
      templatesManager.getAllTemplates.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(fixCorruptedTemplateTypes()).rejects.toThrow('Database error')
    })
  })

  describe('needsTemplateMigration', () => {
    test('should return false when migration flag is set', async () => {
      // Arrange
      localStorage.setItem('aurorae_templates_migrated_v1', 'true')

      // Act
      const result = await needsTemplateMigration()

      // Assert
      expect(result).toBe(false)
      // Should not query IndexedDB when flag is set
      expect(templatesManager.getAllTemplates).not.toHaveBeenCalled()
    })

    test('should return true when corrupted templates exist and flag not set', async () => {
      // Arrange
      const storedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'task' } // WRONG!
      ]
      const predefinedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'routine' }
      ]

      templatesManager.getAllTemplates.mockResolvedValue(storedTemplates)
      predefinedTemplates.getPredefinedTemplates.mockReturnValue(predefinedTemplates)

      // Act
      const result = await needsTemplateMigration()

      // Assert
      expect(result).toBe(true)
    })

    test('should return false when no corrupted templates and flag not set', async () => {
      // Arrange
      const storedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'routine' }
      ]
      const predefinedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'routine' }
      ]

      templatesManager.getAllTemplates.mockResolvedValue(storedTemplates)
      predefinedTemplates.getPredefinedTemplates.mockReturnValue(predefinedTemplates)

      // Act
      const result = await needsTemplateMigration()

      // Assert
      expect(result).toBe(false)
    })

    test('should return false on error', async () => {
      // Arrange
      templatesManager.getAllTemplates.mockRejectedValue(new Error('Database error'))

      // Act
      const result = await needsTemplateMigration()

      // Assert
      expect(result).toBe(false) // Should not throw, just return false
    })
  })

  describe('resetMigrationFlag', () => {
    test('should remove migration flag from localStorage', () => {
      // Arrange
      localStorage.setItem('aurorae_templates_migrated_v1', 'true')

      // Act
      resetMigrationFlag()

      // Assert
      expect(localStorage.getItem('aurorae_templates_migrated_v1')).toBeNull()
    })
  })

  describe('Integration scenarios', () => {
    test('full migration workflow: check, fix, verify', async () => {
      // Arrange - Start with corrupted templates
      const corruptedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'task' } // WRONG!
      ]
      const predefinedTemplates = [
        { id: 'routine-morning', title: 'Morning Routine', type: 'routine' }
      ]

      templatesManager.getAllTemplates.mockResolvedValue(corruptedTemplates)
      predefinedTemplates.getPredefinedTemplates.mockReturnValue(predefinedTemplates)
      templatesManager.updateTemplate.mockResolvedValue(undefined)

      // Step 1: Check if migration needed
      const needsMigration = await needsTemplateMigration()
      expect(needsMigration).toBe(true)

      // Step 2: Fix templates
      const fixResult = await fixCorruptedTemplateTypes()
      expect(fixResult.fixed).toBe(1)

      // Step 3: Verify flag was set
      expect(localStorage.getItem('aurorae_templates_migrated_v1')).toBe('true')

      // Step 4: Subsequent check should skip (fast path)
      const needsMigrationAgain = await needsTemplateMigration()
      expect(needsMigrationAgain).toBe(false)
      
      // Verify getAllTemplates was only called during diagnosis, not after flag was set
      expect(templatesManager.getAllTemplates).toHaveBeenCalledTimes(1)
    })
  })
})
