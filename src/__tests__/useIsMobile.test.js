/**
 * Tests for useIsMobile custom hook
 * Validates mobile detection, resize handling, and SSR safety
 */

import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../hooks/useIsMobile'

describe('useIsMobile Hook', () => {
  let originalInnerWidth

  beforeEach(() => {
    originalInnerWidth = window.innerWidth
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Restore original window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    })
  })

  describe('Initial state calculation', () => {
    test('returns true when window width is 768px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })

    test('returns true when window width is below 768px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })

    test('returns true when window width is 375px (mobile)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })

    test('returns false when window width is above 768px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 769
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })

    test('returns false when window width is 1024px (desktop)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })

    test('returns false when window width is 1920px (desktop)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })

    test('returns false when window width is exactly 769px (just above threshold)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 769
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })
  })

  describe('SSR-safe check', () => {
    test('returns false when window is undefined (SSR)', () => {
      const originalWindow = global.window
      delete global.window

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)

      global.window = originalWindow
    })
  })

  describe('Resize event listener', () => {
    test('registers resize event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')

      renderHook(() => useIsMobile())

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )

      addEventListenerSpy.mockRestore()
    })

    test('removes resize event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useIsMobile())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })

    test('cleanup function removes the same listener that was added', () => {
      let addedListener
      const addEventListenerSpy = jest
        .spyOn(window, 'addEventListener')
        .mockImplementation((event, listener) => {
          addedListener = listener
        })

      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useIsMobile())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', addedListener)

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('State updates on window resize', () => {
    test('updates to true when resizing from desktop to mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375
        })
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current).toBe(true)
    })

    test('updates to false when resizing from mobile to desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024
        })
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current).toBe(false)
    })

    test('handles multiple resize events', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      })

      const { result } = renderHook(() => useIsMobile())

      // Desktop to mobile
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375
        })
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current).toBe(true)

      // Mobile to tablet
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 768
        })
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current).toBe(true)

      // Tablet to desktop
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1920
        })
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current).toBe(false)
    })

    test('does not update state unnecessarily when staying mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const { result } = renderHook(() => useIsMobile())

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 600
        })
        window.dispatchEvent(new Event('resize'))
      })

      // State should still be true, React may or may not re-render
      expect(result.current).toBe(true)
    })

    test('does not update state unnecessarily when staying desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      })

      const { result } = renderHook(() => useIsMobile())

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1920
        })
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current).toBe(false)
    })
  })

  describe('Threshold behavior (768px boundary)', () => {
    test('exactly 768px is considered mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })

    test('exactly 769px is considered desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 769
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })

    test('767px is considered mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })

    test('transitions correctly at threshold during resize', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 769
        })
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current).toBe(false)

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 768
        })
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current).toBe(true)
    })
  })

  describe('Edge cases', () => {
    test('handles window width of 0', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 0
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })

    test('handles very small window width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })

    test('handles very large window width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 3840
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })

    test('handles rapid resize events', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      })

      const { result } = renderHook(() => useIsMobile())

      act(() => {
        for (let i = 0; i < 10; i++) {
          const width = i % 2 === 0 ? 375 : 1024
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width
          })
          window.dispatchEvent(new Event('resize'))
        }
      })

      expect(result.current).toBe(false)
    })

    test('maintains consistent state across multiple hook instances', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const { result: result1 } = renderHook(() => useIsMobile())
      const { result: result2 } = renderHook(() => useIsMobile())

      expect(result1.current).toBe(true)
      expect(result2.current).toBe(true)

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024
        })
        window.dispatchEvent(new Event('resize'))
      })

      expect(result1.current).toBe(false)
      expect(result2.current).toBe(false)
    })
  })

  describe('Common breakpoints', () => {
    test.each([
      [320, true, 'iPhone SE'],
      [375, true, 'iPhone 6/7/8'],
      [414, true, 'iPhone 6/7/8 Plus'],
      [768, true, 'iPad portrait'],
      [769, false, 'iPad portrait + 1px'],
      [1024, false, 'iPad landscape'],
      [1280, false, 'Small desktop'],
      [1366, false, 'Common laptop'],
      [1920, false, 'Full HD desktop']
    ])('window width %ipx (%s) returns isMobile=%s', (width, expected, description) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(expected)
    })
  })

  describe('React hooks rules', () => {
    test('can be used in multiple components simultaneously', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const hooks = []
      for (let i = 0; i < 5; i++) {
        hooks.push(renderHook(() => useIsMobile()))
      }

      hooks.forEach(({ result }) => {
        expect(result.current).toBe(true)
      })

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024
        })
        window.dispatchEvent(new Event('resize'))
      })

      hooks.forEach(({ result }) => {
        expect(result.current).toBe(false)
      })
    })

    test('does not break when unmounted during resize', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const { result, unmount } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)

      unmount()

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024
        })
        window.dispatchEvent(new Event('resize'))
      })

      // Should not throw or cause errors
    })
  })
})
