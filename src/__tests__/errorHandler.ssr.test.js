/**
 * @jest-environment node
 */

// SSR (Server-Side Rendering) tests for errorHandler utility
// These tests run in a pure Node.js environment without jsdom

describe('errorHandler - SSR Tests', () => {
  beforeEach(() => {
    // Clean up global environment
    if (typeof global.window !== 'undefined') {
      delete global.window
    }
    if (typeof global.document !== 'undefined') {
      delete global.document
    }
    // Clear module cache to get fresh imports
    jest.resetModules()
  })

  test('handleError works without window object (SSR)', () => {
    // Import in Node environment where window is undefined
    const { handleError } = require('../utils/errorHandler')

    // Verify SSR environment
    expect(typeof window).toBe('undefined')

    const error = new Error('Test error in SSR')

    // Should not crash in SSR environment
    expect(() => {
      handleError(error, 'SSR Test Operation', {
        showToast: true // This should be safely ignored in SSR
      })
    }).not.toThrow()
  })

  test('handleError with custom callback works in SSR', () => {
    const { handleError } = require('../utils/errorHandler')

    const mockCallback = jest.fn()
    const error = new Error('Custom callback test')
    const context = 'SSR Callback Test'

    handleError(error, context, {
      showToast: false,
      onError: mockCallback
    })

    // Custom callback should be called with error and context
    expect(mockCallback).toHaveBeenCalledWith(error, context)
  })

  test('handleError can rethrow errors in SSR', () => {
    const { handleError } = require('../utils/errorHandler')

    const error = new Error('Rethrow test')

    expect(() => {
      handleError(error, 'SSR Rethrow Test', {
        showToast: false,
        rethrow: true
      })
    }).toThrow('Rethrow test')
  })

  test('handleError respects all options in SSR environment', () => {
    const { handleError } = require('../utils/errorHandler')

    const mockCallback = jest.fn()
    const error = new Error('Options test')
    const context = 'SSR Options Test'

    const result = handleError(error, context, {
      showToast: true, // Should be ignored without window
      toastMessage: 'Custom message',
      onError: mockCallback,
      rethrow: false
    })

    expect(result).toBe(error)
    expect(mockCallback).toHaveBeenCalledWith(error, context)
  })

  test('handleError does not crash when trying to show toast in SSR', () => {
    const { handleError } = require('../utils/errorHandler')

    const error = new Error('Toast test')

    // Even with showToast: true, should not crash in SSR
    expect(() => {
      handleError(error, 'SSR Toast Test', {
        showToast: true,
        toastMessage: 'This should be ignored in SSR'
      })
    }).not.toThrow()
  })

  test('handleError returns error object for inspection', () => {
    const { handleError } = require('../utils/errorHandler')

    const error = new Error('Return test')
    const result = handleError(error, 'SSR Return Test', {
      showToast: false
    })

    expect(result).toBe(error)
    expect(result.message).toBe('Return test')
  })
})
