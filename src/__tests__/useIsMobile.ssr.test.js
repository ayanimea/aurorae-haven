/**
 * @jest-environment node
 */

// SSR (Server-Side Rendering) tests for useIsMobile hook
// These tests run in a pure Node.js environment without jsdom

describe('useIsMobile - SSR Tests', () => {
  // Clean up global before each test
  beforeEach(() => {
    // Ensure window is truly undefined in Node environment
    if (typeof global.window !== 'undefined') {
      delete global.window
    }
  })

  test('returns false when window is undefined (SSR environment)', () => {
    // Import the hook in Node environment where window is undefined
    const { useIsMobile } = require('../hooks/useIsMobile')

    // Mock useState and useEffect from React
    const React = require('react')
    let stateValue = null
    jest.spyOn(React, 'useState').mockImplementation((initialValue) => {
      // Call the initializer function if provided
      stateValue =
        typeof initialValue === 'function' ? initialValue() : initialValue
      return [stateValue, jest.fn()]
    })
    jest.spyOn(React, 'useEffect').mockImplementation(() => {})

    // Call the hook
    const result = useIsMobile()

    // Should return false in SSR environment (no window)
    expect(result).toBe(false)
    expect(typeof window).toBe('undefined')
  })

  test('handles SSR initialization without crashing', () => {
    // Import the hook
    const { useIsMobile } = require('../hooks/useIsMobile')

    // Ensure window doesn't exist
    expect(typeof window).toBe('undefined')

    // Mock React hooks
    const React = require('react')
    jest.spyOn(React, 'useState').mockImplementation((initialValue) => {
      const value =
        typeof initialValue === 'function' ? initialValue() : initialValue
      return [value, jest.fn()]
    })
    jest.spyOn(React, 'useEffect').mockImplementation(() => {})

    // Should not throw when called in SSR
    expect(() => {
      useIsMobile()
    }).not.toThrow()
  })
})
