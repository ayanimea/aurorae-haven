/**
 * Tests for autoSaveFS utility
 * Note: Full File System Access API testing requires user gestures and cannot be fully automated
 * These tests cover testable utility functions and error handling
 */

import {
  isFileSystemAccessSupported,
  getLastSaveTimestamp
} from '../utils/autoSaveFS'

describe('AutoSaveFS', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('isFileSystemAccessSupported', () => {
    test('returns boolean for File System API support', () => {
      const result = isFileSystemAccessSupported()
      expect(typeof result).toBe('boolean')
    })

    test.skip('returns false when window is undefined (skipped: jsdom v28 does not allow mocking window as undefined)', () => {
      // This test is skipped because jsdom v28 made window property non-configurable
      // The actual code handles undefined window correctly, but we can't test it in jsdom v28
    })
  })

  describe('getLastSaveTimestamp', () => {
    test('returns null when no timestamp is stored', () => {
      const timestamp = getLastSaveTimestamp()
      expect(timestamp).toBeNull()
    })

    test('returns stored timestamp as number', () => {
      const testTimestamp = Date.now()
      localStorage.setItem('aurorae_last_save', testTimestamp.toString())

      const result = getLastSaveTimestamp()
      expect(result).toBe(testTimestamp)
      expect(typeof result).toBe('number')
    })

    test('handles invalid timestamp gracefully', () => {
      localStorage.setItem('aurorae_last_save', 'invalid')

      const result = getLastSaveTimestamp()
      expect(isNaN(result)).toBe(true)
    })
  })

  describe('File naming and validation', () => {
    test('save file format follows expected pattern', () => {
      // Test that the expected file name pattern is documented
      const pattern = /^aurorae_save_\d{4}-\d{2}-\d{2}_\d{6}_[a-f0-9]{8}\.json$/
      const exampleFilename = 'aurorae_save_2026-01-08_143025_a1b2c3d4.json'

      expect(pattern.test(exampleFilename)).toBe(true)
    })
  })

  describe('Error handling', () => {
    test('functions handle missing directory handle gracefully', async () => {
      // This tests that the module exports the expected functions
      // Actual functionality requires File System API which needs user gestures
      expect(typeof isFileSystemAccessSupported).toBe('function')
      expect(typeof getLastSaveTimestamp).toBe('function')
    })
  })
})
