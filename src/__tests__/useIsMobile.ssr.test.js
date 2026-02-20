/**
 * @vitest-environment node
 */

import { vi, describe, test, expect, beforeEach } from 'vitest'

// SSR (Server-Side Rendering) tests for useIsMobile hook
// These tests run in a pure Node.js environment without jsdom

// Capture useState calls to verify SSR-safe initialisation
// vi.hoisted ensures this is available inside the vi.mock factory (which is hoisted)
const mockHookState = vi.hoisted(() => ({
  lastInitialValue: undefined,
  setter: null
}))

// Mock React hooks so the hook can be called outside a component tree
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useState: (initialValue) => {
      const resolved =
        typeof initialValue === 'function' ? initialValue() : initialValue
      mockHookState.lastInitialValue = resolved
      mockHookState.setter = vi.fn()
      return [resolved, mockHookState.setter]
    },
    useEffect: vi.fn()
  }
})

describe('useIsMobile - SSR Tests', () => {
  // Clean up global before each test and reset module cache
  beforeEach(() => {
    // Ensure window is truly undefined in Node environment
    if (typeof global.window !== 'undefined') {
      delete global.window
    }
    vi.resetModules()
  })

  test('returns false when window is undefined (SSR environment)', async () => {
    const { useIsMobile } = await import('../hooks/useIsMobile')

    // The hook's useState initializer checks typeof window === 'undefined' → returns false
    const result = useIsMobile()

    expect(result).toBe(false)
    expect(typeof window).toBe('undefined')
    expect(mockHookState.lastInitialValue).toBe(false)
  })

  test('handles SSR initialization without crashing', async () => {
    // Ensure window doesn't exist
    expect(typeof window).toBe('undefined')

    const { useIsMobile } = await import('../hooks/useIsMobile')

    // Should not throw when called in SSR
    expect(() => {
      useIsMobile()
    }).not.toThrow()
  })
})
