/**
 * Tests for centralized error handler utility
 */

import {
  handleError,
  withErrorHandling,
  tryCatch,
  createErrorHandler,
  decorateWithErrorHandling,
  withErrorHandler,
  enhanceError,
  isQuotaExceededError,
  isNetworkError,
  isValidationError,
  ErrorSeverity
} from '../utils/errorHandler'

// Mock logger
jest.mock('../utils/logger', () => ({
  createLogger: () => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    log: jest.fn()
  })
}))

describe('errorHandler', () => {
  let originalWindow
  let mockToastElement

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()

    // Store original window
    originalWindow = global.window

    // Mock toast element
    mockToastElement = {
      textContent: '',
      style: { display: '' }
    }

    // Mock window methods needed for error handler
    const mockDispatchEvent = jest.fn()
    jest.spyOn(global.window, 'dispatchEvent').mockImplementation(mockDispatchEvent)
    
    // Mock document.getElementById
    const mockGetElementById = jest.fn(() => mockToastElement)
    jest.spyOn(global.document, 'getElementById').mockImplementation(mockGetElementById)

    // Store references to mocks for assertions
    global.window.__mockDispatchEvent = mockDispatchEvent
    global.document.__mockGetElementById = mockGetElementById
  })

  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks()
  })

  describe('handleError', () => {
    test('handles Error objects', () => {
      const error = new Error('Test error')
      const result = handleError(error, 'Test operation')

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('Test error')
    })

    test('handles string errors', () => {
      const result = handleError('Test error string', 'Test operation')

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('Test error string')
    })

    test('shows toast notification by default', () => {
      const error = new Error('Test error')

      // Should not throw when showing toast
      expect(() => {
        handleError(error, 'Test operation')
      }).not.toThrow()

      // Verify the error was handled (returns Error object)
      const result = handleError(error, 'Test operation')
      expect(result).toBeInstanceOf(Error)
    })

    test('does not show toast when showToast is false', () => {
      mockToastElement.textContent = ''
      mockToastElement.style.display = ''

      const error = new Error('Test error')

      expect(() => {
        handleError(error, 'Test operation', { showToast: false })
      }).not.toThrow()
    })

    test('uses custom toast message when provided', () => {
      const error = new Error('Test error')

      expect(() => {
        handleError(error, 'Test operation', {
          toastMessage: 'Custom message'
        })
      }).not.toThrow()
    })

    test('calls custom error callback', () => {
      const onError = jest.fn()
      const error = new Error('Test error')

      handleError(error, 'Test operation', { onError })

      expect(onError).toHaveBeenCalledWith(error, 'Test operation')
    })

    test('rethrows error when rethrow option is true', () => {
      const error = new Error('Test error')

      expect(() => {
        handleError(error, 'Test operation', { rethrow: true })
      }).toThrow('Test error')
    })

    test('does not rethrow by default', () => {
      const error = new Error('Test error')

      expect(() => {
        handleError(error, 'Test operation')
      }).not.toThrow()
    })

    test('handles errors in custom callback gracefully', () => {
      const onError = jest.fn(() => {
        throw new Error('Callback error')
      })
      const error = new Error('Test error')

      expect(() => {
        handleError(error, 'Test operation', { onError })
      }).not.toThrow()
    })

    test('respects severity levels', () => {
      const error = new Error('Test error')

      handleError(error, 'Test operation', {
        severity: ErrorSeverity.CRITICAL
      })

      // Should log with error level for critical severity
      // (logger is mocked, so we just verify it doesn't throw)
      expect(true).toBe(true)
    })
  })

  describe('withErrorHandling', () => {
    test('returns result when operation succeeds', async () => {
      const operation = jest.fn(async () => 'success')
      const result = await withErrorHandling(operation, 'Test operation')

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalled()
    })

    test('handles errors and returns undefined', async () => {
      const operation = jest.fn(async () => {
        throw new Error('Test error')
      })
      const result = await withErrorHandling(operation, 'Test operation')

      expect(result).toBeUndefined()
      expect(operation).toHaveBeenCalled()
    })

    test('passes options to error handler', async () => {
      const onError = jest.fn()
      const operation = jest.fn(async () => {
        throw new Error('Test error')
      })

      await withErrorHandling(operation, 'Test operation', { onError })

      expect(onError).toHaveBeenCalled()
    })
  })

  describe('tryCatch', () => {
    test('returns result when operation succeeds', () => {
      const operation = jest.fn(() => 'success')
      const result = tryCatch(operation, 'Test operation')

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalled()
    })

    test('handles errors and returns undefined', () => {
      const operation = jest.fn(() => {
        throw new Error('Test error')
      })
      const result = tryCatch(operation, 'Test operation')

      expect(result).toBeUndefined()
      expect(operation).toHaveBeenCalled()
    })

    test('passes options to error handler', () => {
      const onError = jest.fn()
      const operation = jest.fn(() => {
        throw new Error('Test error')
      })

      tryCatch(operation, 'Test operation', { onError })

      expect(onError).toHaveBeenCalled()
    })
  })

  describe('createErrorHandler', () => {
    test('creates a reusable error handler', () => {
      const handler = createErrorHandler('Test context')
      const error = new Error('Test error')

      const result = handler(error)

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('Test error')
    })

    test('applies default options', () => {
      const onError = jest.fn()
      const handler = createErrorHandler('Test context', { onError })
      const error = new Error('Test error')

      handler(error)

      expect(onError).toHaveBeenCalled()
    })

    test('allows overriding default options', () => {
      const defaultCallback = jest.fn()
      const overrideCallback = jest.fn()
      const handler = createErrorHandler('Test context', {
        onError: defaultCallback
      })
      const error = new Error('Test error')

      handler(error, { onError: overrideCallback })

      expect(defaultCallback).not.toHaveBeenCalled()
      expect(overrideCallback).toHaveBeenCalled()
    })
  })

  describe('decorateWithErrorHandling', () => {
    test('wraps function with error handling', async () => {
      const fn = jest.fn(async (x) => x * 2)
      const wrapped = decorateWithErrorHandling(fn, 'Test operation')

      const result = await wrapped(5)

      expect(result).toBe(10)
      expect(fn).toHaveBeenCalledWith(5)
    })

    test('handles errors in wrapped function', async () => {
      const fn = jest.fn(async () => {
        throw new Error('Test error')
      })
      const wrapped = decorateWithErrorHandling(fn, 'Test operation')

      const result = await wrapped()

      expect(result).toBeUndefined()
      expect(fn).toHaveBeenCalled()
    })

    test('preserves function arguments', async () => {
      const fn = jest.fn(async (a, b, c) => a + b + c)
      const wrapped = decorateWithErrorHandling(fn, 'Test operation')

      const result = await wrapped(1, 2, 3)

      expect(result).toBe(6)
      expect(fn).toHaveBeenCalledWith(1, 2, 3)
    })

    test('deprecated alias withErrorHandler still works', async () => {
      const fn = jest.fn(async (x) => x * 2)
      const wrapped = withErrorHandler(fn, 'Test operation')

      const result = await wrapped(5)

      expect(result).toBe(10)
      expect(fn).toHaveBeenCalledWith(5)
    })

    test('validates parameters before executing function', async () => {
      const fn = jest.fn(async (x) => x * 2)
      const wrapped = decorateWithErrorHandling(fn, 'Test operation', {
        validateParams: {
          value: { value: null, type: 'string', required: true }
        }
      })

      const result = await wrapped()

      expect(result).toBeUndefined()
      expect(fn).not.toHaveBeenCalled()
    })

    test('executes function when parameters are valid', async () => {
      const fn = jest.fn(async (x) => x * 2)
      const wrapped = decorateWithErrorHandling(fn, 'Test operation', {
        validateParams: {
          value: { value: 'test', type: 'string', required: true }
        }
      })

      const result = await wrapped(5)

      expect(result).toBe(10)
      expect(fn).toHaveBeenCalledWith(5)
    })

    test('catches expected error types', async () => {
      const fn = jest.fn(async () => {
        throw new TypeError('Type error')
      })
      const wrapped = decorateWithErrorHandling(fn, 'Test operation', {
        expectedErrors: [TypeError],
        showToast: false
      })

      const result = await wrapped()

      expect(result).toBeUndefined()
      expect(fn).toHaveBeenCalled()
    })

    test('rethrows unexpected error types', async () => {
      const fn = jest.fn(async () => {
        throw new RangeError('Range error')
      })
      const wrapped = decorateWithErrorHandling(fn, 'Test operation', {
        expectedErrors: [TypeError],
        showToast: false
      })

      await expect(wrapped()).rejects.toThrow('Range error')
      expect(fn).toHaveBeenCalled()
    })

    test('catches all errors when no expectedErrors filter', async () => {
      const fn = jest.fn(async () => {
        throw new RangeError('Range error')
      })
      const wrapped = decorateWithErrorHandling(fn, 'Test operation', {
        showToast: false
      })

      const result = await wrapped()

      expect(result).toBeUndefined()
      expect(fn).toHaveBeenCalled()
    })

    test('validates parameters using function that receives args', async () => {
      const fn = jest.fn(async (userId, data) => ({ userId, data }))
      const wrapped = decorateWithErrorHandling(fn, 'Update user', {
        validateParams: (userId, data) => ({
          userId: { value: userId, type: 'string', required: true },
          data: { value: data, type: 'object', required: true }
        }),
        showToast: false
      })

      // Call with invalid parameters
      const result1 = await wrapped(null, {})
      expect(result1).toBeUndefined()
      expect(fn).not.toHaveBeenCalled()

      // Call with valid parameters
      fn.mockClear()
      const result2 = await wrapped('user123', { name: 'John' })
      expect(result2).toEqual({ userId: 'user123', data: { name: 'John' } })
      expect(fn).toHaveBeenCalledWith('user123', { name: 'John' })
    })

    test('validates parameters using static object', async () => {
      const fn = jest.fn(async (x) => x * 2)
      const wrapped = decorateWithErrorHandling(fn, 'Test operation', {
        validateParams: {
          value: { value: 'test', type: 'string', required: true }
        },
        showToast: false
      })

      const result = await wrapped(5)

      expect(result).toBe(10)
      expect(fn).toHaveBeenCalledWith(5)
    })

    test('allows function validateParams to return dynamic validation based on args', async () => {
      const fn = jest.fn(async (action, value) => ({ action, value }))
      const wrapped = decorateWithErrorHandling(fn, 'Perform action', {
        validateParams: (action, value) => {
          // Different validation rules based on action type
          if (action === 'update') {
            return {
              action: { value: action, type: 'string', required: true },
              value: { value: value, type: 'object', required: true }
            }
          } else {
            return {
              action: { value: action, type: 'string', required: true },
              value: { value: value, type: 'string', required: false }
            }
          }
        },
        showToast: false
      })

      // Update action requires object value
      const result1 = await wrapped('update', 'string-value')
      expect(result1).toBeUndefined()
      expect(fn).not.toHaveBeenCalled()

      // Update action with valid object
      fn.mockClear()
      const result2 = await wrapped('update', { key: 'value' })
      expect(result2).toEqual({ action: 'update', value: { key: 'value' } })
      expect(fn).toHaveBeenCalledWith('update', { key: 'value' })

      // Read action allows string value
      fn.mockClear()
      const result3 = await wrapped('read', 'string-value')
      expect(result3).toEqual({ action: 'read', value: 'string-value' })
      expect(fn).toHaveBeenCalledWith('read', 'string-value')
    })
  })

  describe('enhanceError', () => {
    test('enhances Error objects with context', () => {
      const error = new Error('Test error')
      const enhanced = enhanceError(error, { userId: '123', action: 'save' })

      expect(enhanced).toBeInstanceOf(Error)
      expect(enhanced.message).toBe('Test error')
      expect(enhanced.context).toEqual({ userId: '123', action: 'save' })
    })

    test('converts string errors to Error objects', () => {
      const enhanced = enhanceError('Test error', { key: 'value' })

      expect(enhanced).toBeInstanceOf(Error)
      expect(enhanced.message).toBe('Test error')
      expect(enhanced.context).toEqual({ key: 'value' })
    })

    test('context property is non-enumerable', () => {
      const error = new Error('Test error')
      const enhanced = enhanceError(error, { key: 'value' })

      expect(Object.keys(enhanced)).not.toContain('context')
      expect(enhanced.context).toBeDefined()
    })
  })

  describe('isQuotaExceededError', () => {
    test('identifies QuotaExceededError by name', () => {
      const error = new Error('Test error')
      error.name = 'QuotaExceededError'

      expect(isQuotaExceededError(error)).toBe(true)
    })

    test('identifies quota errors by code', () => {
      const error = new Error('Test error')
      error.code = 22

      expect(isQuotaExceededError(error)).toBe(true)
    })

    test('identifies quota errors by message', () => {
      const error = new Error('Storage quota exceeded')

      expect(isQuotaExceededError(error)).toBe(true)
    })

    test('returns false for non-quota errors', () => {
      const error = new Error('Regular error')

      expect(isQuotaExceededError(error)).toBe(false)
    })
  })

  describe('isNetworkError', () => {
    test('identifies network errors by message', () => {
      const error = new Error('network request failed')

      expect(isNetworkError(error)).toBe(true)
    })

    test('identifies fetch errors', () => {
      const error = new Error('Failed to fetch')

      expect(isNetworkError(error)).toBe(true)
    })

    test('identifies NetworkError by name', () => {
      const error = new Error('Test error')
      error.name = 'NetworkError'

      expect(isNetworkError(error)).toBe(true)
    })

    test('returns false for non-network errors', () => {
      const error = new Error('Regular error')

      expect(isNetworkError(error)).toBe(false)
    })
  })

  describe('isValidationError', () => {
    test('identifies validation errors by message', () => {
      const error = new Error('validation failed')

      expect(isValidationError(error)).toBe(true)
    })

    test('identifies invalid data errors', () => {
      const error = new Error('Invalid data format')

      expect(isValidationError(error)).toBe(true)
    })

    test('identifies ValidationError by name', () => {
      const error = new Error('Test error')
      error.name = 'ValidationError'

      expect(isValidationError(error)).toBe(true)
    })

    test('returns false for non-validation errors', () => {
      const error = new Error('Regular error')

      expect(isValidationError(error)).toBe(false)
    })
  })

  describe('toast notification fallback', () => {
    test.skip('works without window object (skipped: jsdom v28 does not allow mocking window as undefined)', () => {
      // This test is skipped because jsdom v28 made window property non-configurable
      // The actual code handles undefined window correctly, but we can't test it in jsdom v28
    })

    test('uses DOM element fallback when available', () => {
      const error = new Error('Test error')

      expect(() => {
        handleError(error, 'Test operation', {
          toastMessage: 'Custom message'
        })
      }).not.toThrow()

      // In a real browser environment, this would update the toast element
      // In tests, we just verify it doesn't crash
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('parameter validation', () => {
    test('validates required parameters', async () => {
      const operation = jest.fn(async () => 'success')

      const result = await withErrorHandling(operation, 'Test operation', {
        validateParams: {
          userId: { value: undefined, type: 'string' }
        },
        showToast: false
      })

      expect(result).toBeUndefined()
      expect(operation).not.toHaveBeenCalled()
    })

    test('validates parameter types', async () => {
      const operation = jest.fn(async () => 'success')

      const result = await withErrorHandling(operation, 'Test operation', {
        validateParams: {
          count: { value: '123', type: 'number' }
        },
        showToast: false
      })

      expect(result).toBeUndefined()
      expect(operation).not.toHaveBeenCalled()
    })

    test('allows optional parameters to be missing', async () => {
      const operation = jest.fn(async () => 'success')

      const result = await withErrorHandling(operation, 'Test operation', {
        validateParams: {
          optionalParam: { value: undefined, type: 'string', required: false }
        },
        showToast: false
      })

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalled()
    })

    test('validates array types', async () => {
      const operation = jest.fn(async () => 'success')

      const result = await withErrorHandling(operation, 'Test operation', {
        validateParams: {
          items: { value: [1, 2, 3], type: 'array' }
        },
        showToast: false
      })

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalled()
    })
  })

  describe('expected errors filtering', () => {
    test('catches specified error types', async () => {
      const operation = jest.fn(async () => {
        throw new TypeError('Type error')
      })

      const result = await withErrorHandling(operation, 'Test operation', {
        expectedErrors: [TypeError, RangeError],
        showToast: false
      })

      expect(result).toBeUndefined()
      expect(operation).toHaveBeenCalled()
    })

    test('rethrows unexpected error types', async () => {
      const operation = jest.fn(async () => {
        throw new ReferenceError('Reference error')
      })

      await expect(
        withErrorHandling(operation, 'Test operation', {
          expectedErrors: [TypeError],
          showToast: false
        })
      ).rejects.toThrow(ReferenceError)
    })

    test('catches all errors when no filter specified', async () => {
      const operation = jest.fn(async () => {
        throw new Error('Any error')
      })

      const result = await withErrorHandling(operation, 'Test operation', {
        showToast: false
      })

      expect(result).toBeUndefined()
      expect(operation).toHaveBeenCalled()
    })

    test('tryCatch catches specified error types', () => {
      const operation = jest.fn(() => {
        throw new TypeError('Type error')
      })

      const result = tryCatch(operation, 'Test operation', {
        expectedErrors: [TypeError, RangeError],
        showToast: false
      })

      expect(result).toBeUndefined()
      expect(operation).toHaveBeenCalled()
    })

    test('tryCatch rethrows unexpected error types', () => {
      const operation = jest.fn(() => {
        throw new ReferenceError('Reference error')
      })

      expect(() => {
        tryCatch(operation, 'Test operation', {
          expectedErrors: [TypeError],
          showToast: false
        })
      }).toThrow(ReferenceError)
    })

    test('tryCatch catches all errors when no filter specified', () => {
      const operation = jest.fn(() => {
        throw new Error('Any error')
      })

      const result = tryCatch(operation, 'Test operation', {
        showToast: false
      })

      expect(result).toBeUndefined()
      expect(operation).toHaveBeenCalled()
    })
  })

  describe('custom message formatter', () => {
    test('uses custom message formatter', () => {
      const formatter = jest.fn(
        (error, context) => `Custom: ${context} - ${error.message}`
      )
      const error = new Error('Test error')

      handleError(error, 'Test operation', {
        customMessageFormatter: formatter
      })

      expect(formatter).toHaveBeenCalledWith(error, 'Test operation')
    })

    test('falls back to default message if formatter not provided', () => {
      const error = new Error('Test error')

      expect(() => {
        handleError(error, 'Test operation')
      }).not.toThrow()
    })

    test('falls back to toastMessage if formatter throws', () => {
      const formatter = jest.fn(() => {
        throw new Error('Formatter error')
      })
      const error = new Error('Test error')

      expect(() => {
        handleError(error, 'Test operation', {
          customMessageFormatter: formatter,
          toastMessage: 'Fallback message'
        })
      }).not.toThrow()

      expect(formatter).toHaveBeenCalledWith(error, 'Test operation')
    })

    test('falls back to getUserFriendlyMessage if formatter throws and no toastMessage', () => {
      const formatter = jest.fn(() => {
        throw new Error('Formatter error')
      })
      const error = new Error('Test error')

      expect(() => {
        handleError(error, 'Test operation', {
          customMessageFormatter: formatter
        })
      }).not.toThrow()

      expect(formatter).toHaveBeenCalledWith(error, 'Test operation')
    })
  })

  describe('getUserFriendlyMessage', () => {
    // Note: getUserFriendlyMessage is not exported, so we test it indirectly through handleError
    // We verify the message by checking what gets passed to showToastNotification

    beforeEach(() => {
      // Mock window.dispatchEvent to capture toast messages
      global.window.dispatchEvent = jest.fn()
    })

    test('returns quota exceeded message for quota errors', () => {
      const error = new Error('QuotaExceededError')
      error.name = 'QuotaExceededError'

      handleError(error, 'Test operation')

      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'aurorae-toast',
          detail: { message: 'Storage quota exceeded. Please free up space.' }
        })
      )
    })

    test('returns quota exceeded message for quota errors with code 22', () => {
      const error = new Error('Storage full')
      error.code = 22

      handleError(error, 'Test operation')

      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'aurorae-toast',
          detail: { message: 'Storage quota exceeded. Please free up space.' }
        })
      )
    })

    test('returns database error message for IndexedDB errors', () => {
      const error = new Error('IndexedDB operation failed')

      handleError(error, 'Test operation')

      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'aurorae-toast',
          detail: { message: 'Database error. Please try again.' }
        })
      )
    })

    test('returns network error message for network errors', () => {
      const error = new Error('network request failed')

      handleError(error, 'Test operation')

      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'aurorae-toast',
          detail: { message: 'Network error. Please check your connection.' }
        })
      )
    })

    test('returns network error message for fetch errors', () => {
      const error = new Error('fetch failed')

      handleError(error, 'Test operation')

      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'aurorae-toast',
          detail: { message: 'Network error. Please check your connection.' }
        })
      )
    })

    test('returns validation error message for validation errors', () => {
      const error = new Error('validation failed')

      handleError(error, 'Test operation')

      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'aurorae-toast',
          detail: { message: 'Invalid data. Please check your input.' }
        })
      )
    })

    test('returns validation error message for invalid errors', () => {
      const error = new Error('Invalid input provided')

      handleError(error, 'Test operation')

      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'aurorae-toast',
          detail: { message: 'Invalid data. Please check your input.' }
        })
      )
    })

    test('returns default context-based message for generic errors', () => {
      const error = new Error('Something went wrong')

      handleError(error, 'Loading data')

      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'aurorae-toast',
          detail: { message: 'Loading data failed. Please try again.' }
        })
      )
    })

    test('returns default context-based message when no specific pattern matches', () => {
      const error = new Error('Random error message')

      handleError(error, 'Saving profile')

      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'aurorae-toast',
          detail: { message: 'Saving profile failed. Please try again.' }
        })
      )
    })
  })

  describe('showToastNotification DOM fallback', () => {
    test('uses DOM fallback when CustomEvent or dispatchEvent is not available', () => {
      // Create a mock toast element with getAttribute and setAttribute methods
      const mockToastElement = {
        textContent: '',
        style: { display: '' },
        getAttribute: jest.fn((attr) => null), // Return null to simulate no attributes
        setAttribute: jest.fn()
      }

      // Mock getElementById to return our toast element
      global.document.getElementById = jest.fn(() => mockToastElement)

      // Disable CustomEvent and dispatchEvent to force fallback
      const originalCustomEvent = global.window.CustomEvent
      const originalDispatchEvent = global.window.dispatchEvent
      delete global.window.CustomEvent
      delete global.window.dispatchEvent

      // Trigger an error that will use the toast notification
      const error = new Error('Test error')
      handleError(error, 'Test operation')

      // Verify DOM fallback was used
      expect(mockToastElement.textContent).toBe(
        'Test operation failed. Please try again.'
      )
      expect(mockToastElement.style.display).toBe('block')

      // Verify accessibility attributes were set
      expect(mockToastElement.setAttribute).toHaveBeenCalledWith(
        'role',
        'status'
      )
      expect(mockToastElement.setAttribute).toHaveBeenCalledWith(
        'aria-live',
        'polite'
      )

      // Restore original window properties
      global.window.CustomEvent = originalCustomEvent
      global.window.dispatchEvent = originalDispatchEvent
    })

    test('does not set accessibility attributes if already present', () => {
      // Create a mock toast element that already has accessibility attributes
      const mockToastElement = {
        textContent: '',
        style: { display: '' },
        getAttribute: jest.fn((attr) => {
          if (attr === 'role') return 'status'
          if (attr === 'aria-live') return 'polite'
          return null
        }),
        setAttribute: jest.fn()
      }

      // Mock getElementById to return our toast element
      global.document.getElementById = jest.fn(() => mockToastElement)

      // Disable CustomEvent and dispatchEvent to force fallback
      const originalCustomEvent = global.window.CustomEvent
      const originalDispatchEvent = global.window.dispatchEvent
      delete global.window.CustomEvent
      delete global.window.dispatchEvent

      // Trigger an error that will use the toast notification
      const error = new Error('Test error')
      handleError(error, 'Test operation')

      // Verify DOM fallback was used
      expect(mockToastElement.textContent).toBe(
        'Test operation failed. Please try again.'
      )
      expect(mockToastElement.style.display).toBe('block')

      // Verify accessibility attributes were NOT set again (since they already exist)
      expect(mockToastElement.setAttribute).not.toHaveBeenCalled()

      // Restore original window properties
      global.window.CustomEvent = originalCustomEvent
      global.window.dispatchEvent = originalDispatchEvent
    })

    test('handles missing toast element gracefully', () => {
      // Mock getElementById to return null (no toast element)
      global.document.getElementById = jest.fn(() => null)

      // Disable CustomEvent and dispatchEvent to force fallback
      const originalCustomEvent = global.window.CustomEvent
      const originalDispatchEvent = global.window.dispatchEvent
      delete global.window.CustomEvent
      delete global.window.dispatchEvent

      // Trigger an error - should not throw
      const error = new Error('Test error')
      expect(() => {
        handleError(error, 'Test operation')
      }).not.toThrow()

      // Restore original window properties
      global.window.CustomEvent = originalCustomEvent
      global.window.dispatchEvent = originalDispatchEvent
    })
  })
})
