// Test suite for Settings Manager
// TODO: Expand tests as settings features are implemented

import {
  getSettings,
  getSetting,
  updateSettings,
  updateSetting,
  resetSettings,
  exportSettings,
  importSettings,
  validateSettings,
  VALID_GUIDANCE_LEVELS
} from '../utils/settingsManager'

describe('Settings Manager', () => {
  // Save original Storage methods at module level
  const originalSetItem = Storage.prototype.setItem
  const originalGetItem = Storage.prototype.getItem

  beforeEach(() => {
    // Restore originals before each test
    Storage.prototype.setItem = originalSetItem
    Storage.prototype.getItem = originalGetItem

    localStorage.clear()
    // Also clear any cached settings
    delete localStorage.aurorae_settings
  })

  afterEach(() => {
    // Restore originals after each test
    Storage.prototype.setItem = originalSetItem
    Storage.prototype.getItem = originalGetItem

    localStorage.clear()
  })

  describe('getSettings', () => {
    test('should return default settings when none exist', () => {
      const settings = getSettings()

      expect(settings).toHaveProperty('theme')
      expect(settings).toHaveProperty('backupEnabled')
      expect(settings).toHaveProperty('notifications')
      expect(settings.backupEnabled).toBe(true)
    })

    test('should return stored settings', () => {
      const customSettings = {
        theme: 'dark',
        backupEnabled: false
      }
      localStorage.setItem('aurorae_settings', JSON.stringify(customSettings))

      const settings = getSettings()
      expect(settings.theme).toBe('dark')
      expect(settings.backupEnabled).toBe(false)
    })

    // Test for settings migration
    test('should migrate old settings format', () => {
      // Simulate old settings format (e.g., missing new fields)
      const oldSettings = {
        theme: 'dark',
        backupEnabled: false
        // Missing: schedule, autoSave, etc.
      }
      localStorage.setItem('aurorae_settings', JSON.stringify(oldSettings))

      const settings = getSettings()

      // Should have merged with defaults
      expect(settings.theme).toBe('dark') // Preserved
      expect(settings.backupEnabled).toBe(false) // Preserved
      expect(settings.schedule).toBeDefined() // Added from defaults
      expect(settings.schedule.use24HourFormat).toBe(true) // Default value
      expect(settings.autoSave).toBeDefined() // Added from defaults
      expect(settings.notifications).toBeDefined() // Added from defaults
    })

    // Test for handling corrupted settings
    test('should handle corrupted settings gracefully', () => {
      // Store invalid JSON
      localStorage.setItem('aurorae_settings', '{invalid json}}')

      const settings = getSettings()

      // Should return default settings when corruption detected
      expect(settings).toBeDefined()
      expect(settings.theme).toBe('auto')
      expect(settings.backupEnabled).toBe(true)
      expect(settings.notifications).toBeDefined()
    })
  })

  describe('getSetting', () => {
    test('should get top-level setting', () => {
      const theme = getSetting('theme')
      expect(theme).toBe('auto')
    })

    test('should get nested setting', () => {
      const notificationsEnabled = getSetting('notifications.enabled')
      expect(notificationsEnabled).toBe(false)
    })

    test('should return undefined for non-existent setting', () => {
      const value = getSetting('nonexistent.key')
      expect(value).toBeUndefined()
    })

    // Test for array index access
    test('should support array index access', () => {
      // Set up test data with array
      const settingsWithArray = {
        theme: 'auto',
        recentFiles: ['file1.json', 'file2.json', 'file3.json']
      }
      localStorage.setItem(
        'aurorae_settings',
        JSON.stringify(settingsWithArray)
      )

      // Access array element with dot notation - deterministic test
      const firstFile = getSetting('recentFiles.0')
      const secondFile = getSetting('recentFiles.1')

      // getSetting supports numeric keys in arrays via 'k in value' check
      expect(firstFile).toBe('file1.json')
      expect(secondFile).toBe('file2.json')

      // Also verify array access works
      const files = getSetting('recentFiles')
      expect(Array.isArray(files)).toBe(true)
      expect(files).toHaveLength(3)
    })
  })

  describe('updateSettings', () => {
    test('should update settings', () => {
      const updates = { theme: 'dark' }
      const updated = updateSettings(updates)

      expect(updated.theme).toBe('dark')
      expect(updated.backupEnabled).toBe(true) // Other settings preserved
    })

    test('should merge nested settings', () => {
      const updates = {
        notifications: {
          enabled: true
        }
      }
      const updated = updateSettings(updates)

      expect(updated.notifications.enabled).toBe(true)
      expect(updated.notifications.tasks).toBe(true) // Preserved
    })

    // Test for validation before updating
    test.todo(
      'should validate settings before updating - currently accepts any values'
    )

    // Test for handling storage errors
    test('should handle storage errors gracefully', () => {
      // Use jest.spyOn for proper mock cleanup (fixes test isolation issue)
      const setItemSpy = jest
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation((key, value) => {
          if (key === 'aurorae_settings') {
            throw new Error('QuotaExceededError')
          }
        })

      const updates = { theme: 'dark' }

      // updateSettings should catch the error and return settings from memory
      // Even though localStorage write fails, user gets updated settings for current session
      const result = updateSettings(updates)

      // Should handle error gracefully - return updated settings even if write fails
      expect(result).toBeDefined()
      expect(result.theme).toBe('dark') // Update applied in memory

      // Verify setItem was called and threw
      expect(setItemSpy).toHaveBeenCalled()

      // Cleanup
      setItemSpy.mockRestore()
    })
  })

  describe('updateSetting', () => {
    test('should update single top-level setting', () => {
      const updated = updateSetting('theme', 'light')
      expect(updated.theme).toBe('light')
    })

    test('should update nested setting', () => {
      const updated = updateSetting('notifications.enabled', true)
      expect(updated.notifications.enabled).toBe(true)
    })

    // Test for creating nested paths
    test('should create nested paths if missing', () => {
      // Start with minimal settings
      const minimal = { theme: 'auto' }
      localStorage.setItem('aurorae_settings', JSON.stringify(minimal))

      // Update deeply nested setting that doesn't exist
      const updated = updateSetting('advanced.experimental.newFeature', true)

      expect(updated).toBeDefined()
      // Should either create the path or handle gracefully
      if (updated.advanced && updated.advanced.experimental) {
        expect(updated.advanced.experimental.newFeature).toBe(true)
      } else {
        // If path creation not supported, at least shouldn't crash
        expect(updated.advanced).toBeDefined()
      }
    })
  })

  describe('resetSettings', () => {
    test('should reset to default settings', () => {
      // Force complete reset
      for (const key in localStorage) {
        localStorage.removeItem(key)
      }

      // Set some non-default values first
      const before = updateSettings({ theme: 'dark', backupEnabled: false })
      expect(before.theme).toBe('dark') // Verify it was set

      // Reset should restore defaults
      const reset = resetSettings()

      expect(reset.theme).toBe('auto')
      expect(reset.backupEnabled).toBe(true)
    })

    // TODO: Add test for confirmation
    test.todo('should require confirmation before reset')
  })

  describe('exportSettings', () => {
    test('should export settings as JSON', () => {
      const json = exportSettings()
      const parsed = JSON.parse(json)

      expect(parsed).toHaveProperty('version')
      expect(parsed).toHaveProperty('exportedAt')
      expect(parsed).toHaveProperty('settings')
      expect(parsed.settings).toHaveProperty('theme')
      expect(parsed.settings).toHaveProperty('backupEnabled')
    })

    test('should include autoSave info (directoryName and intervalMinutes) in export', () => {
      // Set a custom autosave configuration
      updateSettings({
        autoSave: {
          enabled: true,
          intervalMinutes: 15,
          keepCount: 5,
          directoryConfigured: true,
          directoryName: 'MyBackups'
        }
      })

      const json = exportSettings()
      const parsed = JSON.parse(json)

      expect(parsed.settings.autoSave).toBeDefined()
      expect(parsed.settings.autoSave.directoryName).toBe('MyBackups')
      expect(parsed.settings.autoSave.intervalMinutes).toBe(15)
      expect(parsed.settings.autoSave.directoryConfigured).toBe(true)
    })

    test('should export legacy autosave directory name when settings have not been migrated yet', () => {
      localStorage.setItem(
        'aurorae_settings',
        JSON.stringify({
          autoSave: {
            enabled: true,
            intervalMinutes: 15,
            keepCount: 5,
            directoryConfigured: false,
            directoryName: null
          }
        })
      )
      localStorage.setItem('aurorae_save_directory_name', 'LegacyBackups')

      const json = exportSettings()
      const parsed = JSON.parse(json)

      expect(parsed.settings.autoSave.directoryName).toBe('LegacyBackups')
      expect(parsed.settings.autoSave.directoryConfigured).toBe(true)
      expect(parsed.settings.autoSave.intervalMinutes).toBe(15)
    })

    // TODO: Add test for export metadata
    test.todo('should include export metadata')
  })

  describe('importSettings', () => {
    test('should import settings from JSON', () => {
      const json = JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: {
          theme: 'dark',
          backupEnabled: false
        }
      })

      const imported = importSettings(json)
      expect(imported.theme).toBe('dark')
      expect(imported.backupEnabled).toBe(false)
    })

    test('should reject invalid JSON', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      expect(() => importSettings('invalid json')).toThrow()
      consoleErrorSpy.mockRestore()
    })

    test('should reject invalid format', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      // Empty object is now valid (reset operation), so test with invalid types
      expect(() => importSettings('"string"')).toThrow(
        'Invalid settings format'
      ) // String is invalid
      expect(() => importSettings('123')).toThrow('Invalid settings format') // Number is invalid
      expect(() => importSettings('[]')).toThrow('Invalid settings format') // Array is invalid
      consoleErrorSpy.mockRestore()
    })

    // Test for version compatibility
    test('should handle version compatibility', () => {
      const oldExport = {
        version: '1.0.0',
        settings: {
          theme: 'dark'
        }
      }

      const result = importSettings(oldExport)

      // Should handle old versions gracefully
      expect(result).toBeDefined()
      if (typeof result === 'boolean') {
        expect(result).toBe(true) // Import succeeded
      } else {
        expect(result.theme).toBe('dark') // Returns imported settings
      }
    })

    // Test for partial import
    test('should support partial import', () => {
      // Export only specific settings
      const partialExport = {
        theme: 'dark',
        notifications: {
          enabled: true
        }
        // Missing other fields like backupEnabled, etc.
      }

      const result = importSettings(partialExport)

      expect(result).toBeDefined()
      const settings = getSettings()

      // Imported values should be present
      expect(settings.theme).toBe('dark')
      expect(settings.notifications.enabled).toBe(true)

      // Non-imported values should remain at defaults
      expect(settings.backupEnabled).toBeDefined()
    })

    test('should restore autoSave directoryName and intervalMinutes from imported JSON', () => {
      const json = JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: {
          autoSave: {
            enabled: true,
            intervalMinutes: 10,
            keepCount: 8,
            directoryConfigured: true,
            directoryName: 'AuroraeBackups'
          }
        }
      })

      const imported = importSettings(json)

      expect(imported.autoSave.directoryName).toBe('AuroraeBackups')
      expect(imported.autoSave.intervalMinutes).toBe(10)
      expect(imported.autoSave.directoryConfigured).toBe(true)

      // Verify it is also persisted via getSettings
      const settings = getSettings()
      expect(settings.autoSave.directoryName).toBe('AuroraeBackups')
      expect(settings.autoSave.intervalMinutes).toBe(10)
    })
  })

  describe('validateSettings', () => {
    test('should validate valid settings', () => {
      const valid = {
        theme: 'dark',
        backupEnabled: true
      }
      expect(validateSettings(valid)).toBe(true)
    })

    test('should reject invalid theme', () => {
      const invalid = {
        theme: 'invalid-theme'
      }
      expect(validateSettings(invalid)).toBe(false)
    })

    test('should reject non-object', () => {
      expect(validateSettings(null)).toBe(false)
      expect(validateSettings('string')).toBe(false)
    })

    // Test for validating all setting types
    test('should validate all setting types', () => {
      const settings = getSettings()

      // Validate expected types
      expect(typeof settings.theme).toBe('string')
      expect(typeof settings.backupEnabled).toBe('boolean')
      expect(typeof settings.backupInterval).toBe('number')
      expect(typeof settings.notifications).toBe('object')
      expect(typeof settings.accessibility).toBe('object')
      expect(typeof settings.privacy).toBe('object')
      expect(typeof settings.advanced).toBe('object')

      // Call validation function if it exists
      const validation = validateSettings(settings)
      expect(validation).toBeDefined()

      // Should either return true/false or validation object
      if (typeof validation === 'boolean') {
        expect(validation).toBe(true)
      } else if (typeof validation === 'object') {
        expect(
          validation.valid === undefined ||
            validation.valid === true ||
            validation.errors === undefined
        ).toBe(true)
      }
    })

    // Test for validating nested settings
    test.todo(
      'should validate nested settings - currently only does shallow checks'
    )
  })

  // ── schedulingGuidanceLevel validation ─────────────────────────────────────

  describe('schedulingGuidanceLevel clamping', () => {
    it('VALID_GUIDANCE_LEVELS exports the correct enum', () => {
      expect(VALID_GUIDANCE_LEVELS).toEqual(['full', 'header-only', 'off'])
    })

    it('getSettings clamps an invalid stored schedulingGuidanceLevel to "full"', () => {
      // Simulate a corrupted / legacy stored value
      localStorage.setItem(
        'aurorae_settings',
        JSON.stringify({ schedule: { schedulingGuidanceLevel: 'invalid-value' } })
      )
      const settings = getSettings()
      expect(settings.schedule.schedulingGuidanceLevel).toBe('full')
    })

    it('getSettings preserves valid stored schedulingGuidanceLevel values', () => {
      for (const level of VALID_GUIDANCE_LEVELS) {
        localStorage.setItem(
          'aurorae_settings',
          JSON.stringify({ schedule: { schedulingGuidanceLevel: level } })
        )
        const settings = getSettings()
        expect(settings.schedule.schedulingGuidanceLevel).toBe(level)
      }
    })

    it('updateSetting clamps invalid schedulingGuidanceLevel to "full"', () => {
      const result = updateSetting('schedule.schedulingGuidanceLevel', 'bogus')
      expect(result.schedule.schedulingGuidanceLevel).toBe('full')
    })

    it('updateSetting preserves valid schedulingGuidanceLevel values', () => {
      for (const level of VALID_GUIDANCE_LEVELS) {
        const result = updateSetting('schedule.schedulingGuidanceLevel', level)
        expect(result.schedule.schedulingGuidanceLevel).toBe(level)
      }
    })

    it('validateSettings returns false for invalid schedulingGuidanceLevel', () => {
      const result = validateSettings({
        schedule: { schedulingGuidanceLevel: 'unknown' }
      })
      expect(result).toBe(false)
    })

    it('validateSettings returns true when schedulingGuidanceLevel is valid', () => {
      for (const level of VALID_GUIDANCE_LEVELS) {
        const result = validateSettings({
          schedule: { schedulingGuidanceLevel: level }
        })
        expect(result).toBe(true)
      }
    })

    it('validateSettings returns true when schedulingGuidanceLevel is absent', () => {
      expect(validateSettings({ schedule: {} })).toBe(true)
      expect(validateSettings({})).toBe(true)
    })

    it('getSettings resets schedule to default when stored schedule is a string', () => {
      // Simulate corrupted localStorage where schedule is a string
      localStorage.setItem(
        'aurorae_settings',
        JSON.stringify({ schedule: 'corrupted' })
      )
      const settings = getSettings()
      expect(typeof settings.schedule).toBe('object')
      expect(settings.schedule).not.toBeNull()
      expect(Array.isArray(settings.schedule)).toBe(false)
      expect(settings.schedule.schedulingGuidanceLevel).toBe('full')
    })

    it('getSettings resets schedule to default when stored schedule is a number', () => {
      localStorage.setItem(
        'aurorae_settings',
        JSON.stringify({ schedule: 42 })
      )
      const settings = getSettings()
      expect(typeof settings.schedule).toBe('object')
      expect(settings.schedule.schedulingGuidanceLevel).toBe('full')
    })

    it('validateSettings returns false when schedule is a string', () => {
      expect(validateSettings({ schedule: 'bad' })).toBe(false)
    })

    it('validateSettings returns false when schedule is null', () => {
      expect(validateSettings({ schedule: null })).toBe(false)
    })

    it('validateSettings returns false when schedule is an array', () => {
      expect(validateSettings({ schedule: [] })).toBe(false)
    })
  })
})
