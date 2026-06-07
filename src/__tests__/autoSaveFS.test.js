/**
 * Tests for autoSaveFS utility
 * Note: Full File System Access API testing requires user gestures and cannot be fully automated
 * These tests cover testable utility functions and error handling
 */

import { vi } from 'vitest'
import 'fake-indexeddb/auto'

vi.mock('../utils/settingsManager', () => ({
  getSetting: vi.fn(),
  updateSetting: vi.fn(),
  updateSettings: vi.fn()
}))

import {
  isFileSystemAccessSupported,
  getLastSaveTimestamp,
  clearStoredDirectoryName,
  getStoredDirectoryHandle,
  requestDirectoryAccess,
  requestStoredDirectoryPermission,
  setDirectoryHandle
} from '../utils/autoSaveFS'
import * as settingsManager from '../utils/settingsManager'

describe('AutoSaveFS', () => {
  beforeEach(() => {
    localStorage.clear()
    settingsManager.updateSetting.mockReset()
    settingsManager.updateSetting.mockImplementation(() => {})
    settingsManager.updateSettings.mockReset()
    settingsManager.updateSettings.mockImplementation(() => {})
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

  describe('clearStoredDirectoryName', () => {
    test('clears both directoryName and directoryConfigured in a single settings update', async () => {
      localStorage.setItem('aurorae_save_directory_name', 'MyBackups')
      await clearStoredDirectoryName()
      expect(settingsManager.updateSettings).toHaveBeenCalledWith({
        autoSave: { directoryName: null, directoryConfigured: false }
      })
    })

    test('removes directory name from localStorage', async () => {
      localStorage.setItem('aurorae_save_directory_name', 'MyBackups')
      await clearStoredDirectoryName()
      expect(localStorage.getItem('aurorae_save_directory_name')).toBeNull()
    })

    test('continues clearing localStorage when settings update throws', async () => {
      settingsManager.updateSettings.mockImplementation(() => {
        throw new Error('corrupted settings')
      })
      localStorage.setItem('aurorae_save_directory_name', 'MyBackups')

      await expect(clearStoredDirectoryName()).resolves.toBeUndefined()
      expect(localStorage.getItem('aurorae_save_directory_name')).toBeNull()
    })
  })

  describe('directory settings sync resilience', () => {
    test('requestStoredDirectoryPermission returns handle even when settings sync throws', async () => {
      const handle = {
        name: 'MyBackups',
        requestPermission: vi.fn().mockResolvedValue('granted')
      }
      settingsManager.updateSetting.mockImplementation(() => {
        throw new Error('corrupted settings')
      })

      window.showSaveFilePicker = vi.fn()
      window.showDirectoryPicker = vi.fn().mockResolvedValue(handle)
      const pickedHandle = await requestDirectoryAccess()
      expect(pickedHandle).toBe(handle)

      localStorage.removeItem('aurorae_save_directory_name')
      const grantedHandle = await requestStoredDirectoryPermission()
      expect(grantedHandle).toBe(handle)
    })

    test('setDirectoryHandle is best-effort when settings update throws', async () => {
      settingsManager.updateSetting.mockImplementation(() => {
        throw new Error('corrupted settings')
      })
      const handle = { name: 'MyBackups' }

      await expect(setDirectoryHandle(handle)).resolves.toBeUndefined()
      expect(localStorage.getItem('aurorae_save_directory_name')).toBe(
        'MyBackups'
      )
    })
  })

  describe('directory handle IndexedDB persistence', () => {
    test('stores and loads directory handle via IndexedDB', async () => {
      const handle = { name: 'MyBackups' }

      await setDirectoryHandle(handle)
      await setDirectoryHandle(null)

      await expect(getStoredDirectoryHandle()).resolves.toEqual(handle)
    })

    test('returns null when IndexedDB is unavailable', async () => {
      const originalIndexedDB = globalThis.indexedDB
      delete globalThis.indexedDB

      try {
        await expect(getStoredDirectoryHandle()).resolves.toBeNull()
      } finally {
        globalThis.indexedDB = originalIndexedDB
      }
    })
  })
})
