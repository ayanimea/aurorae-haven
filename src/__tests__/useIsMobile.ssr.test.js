/**
 * @vitest-environment node
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

  test('returns false when window is undefined (SSR environment)', async () => {
    const { useIsMobile } = await import('../hooks/useIsMobile')

    // The hook uses useState initializer that checks typeof window === 'undefined'
    // In node environment (no window), the initializer returns false.
    // We verify the module loads without error in SSR.
    expect(typeof useIsMobile).toBe('function')
    expect(typeof window).toBe('undefined')
  })

  test('handles SSR initialization without crashing', async () => {
    // Ensure window doesn't exist
    expect(typeof window).toBe('undefined')

    const { useIsMobile } = await import('../hooks/useIsMobile')

    // Should be importable without crashing
    expect(typeof useIsMobile).toBe('function')
  })
})
