/**
 * Tests for positionUtils module
 * Validates context menu positioning and viewport boundary handling
 */

import { adjustMenuPosition } from '../utils/positionUtils'

describe('positionUtils', () => {
  let originalInnerWidth
  let originalInnerHeight

  beforeEach(() => {
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight

    // Set default viewport size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768
    })
  })

  afterEach(() => {
    // Restore original window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight
    })
  })

  describe('adjustMenuPosition basic functionality', () => {
    test('returns original position when menu fits in viewport', () => {
      const result = adjustMenuPosition(100, 100, 200, 100)

      expect(result).toEqual({ x: 100, y: 100 })
    })

    test('returns position with padding when menu fits with padding', () => {
      const result = adjustMenuPosition(50, 50, 100, 100)

      expect(result).toEqual({ x: 50, y: 50 })
    })

    test('adjusts position for menu that fits well within viewport bounds', () => {
      const result = adjustMenuPosition(500, 300, 200, 150)

      expect(result).toEqual({ x: 500, y: 300 })
    })
  })

  describe('Right edge boundary handling', () => {
    test('adjusts x position when menu overflows right edge', () => {
      // Menu at x=900, width=200 would overflow 1024px viewport
      const result = adjustMenuPosition(900, 100, 200, 100)

      expect(result.x).toBe(814) // 1024 - 200 - 10 (padding)
      expect(result.y).toBe(100)
    })

    test('adjusts x position for menu exactly at right boundary', () => {
      // Menu at x=1024 with width=200 definitely overflows
      const result = adjustMenuPosition(1024, 100, 200, 100)

      expect(result.x).toBe(814)
      expect(result.y).toBe(100)
    })

    test('keeps original x when menu exactly fits with padding', () => {
      // Menu at x=814 with width=200 should fit (814 + 200 + 10 = 1024)
      const result = adjustMenuPosition(814, 100, 200, 100)

      expect(result.x).toBe(814)
    })

    test('adjusts x for wide menu', () => {
      const result = adjustMenuPosition(700, 100, 400, 100)

      expect(result.x).toBe(614) // 1024 - 400 - 10
      expect(result.y).toBe(100)
    })
  })

  describe('Bottom edge boundary handling', () => {
    test('adjusts y position when menu overflows bottom edge', () => {
      // Menu at y=700, height=100 would overflow 768px viewport
      const result = adjustMenuPosition(100, 700, 200, 100)

      expect(result.x).toBe(100)
      expect(result.y).toBe(658) // 768 - 100 - 10 (padding)
    })

    test('adjusts y position for menu exactly at bottom boundary', () => {
      const result = adjustMenuPosition(100, 768, 200, 100)

      expect(result.x).toBe(100)
      expect(result.y).toBe(658)
    })

    test('keeps original y when menu exactly fits with padding', () => {
      // Menu at y=658 with height=100 should fit (658 + 100 + 10 = 768)
      const result = adjustMenuPosition(100, 658, 200, 100)

      expect(result.y).toBe(658)
    })

    test('adjusts y for tall menu', () => {
      const result = adjustMenuPosition(100, 500, 200, 300)

      expect(result.x).toBe(100)
      expect(result.y).toBe(458) // 768 - 300 - 10
    })
  })

  describe('Corner cases', () => {
    test('adjusts both x and y when menu overflows bottom-right corner', () => {
      const result = adjustMenuPosition(900, 700, 200, 100)

      expect(result.x).toBe(814) // 1024 - 200 - 10
      expect(result.y).toBe(658) // 768 - 100 - 10
    })

    test('adjusts both x and y when menu is at bottom-right corner', () => {
      const result = adjustMenuPosition(1024, 768, 200, 100)

      expect(result.x).toBe(814)
      expect(result.y).toBe(658)
    })

    test('adjusts both x and y when large menu is placed near corner', () => {
      const result = adjustMenuPosition(800, 600, 300, 200)

      expect(result.x).toBe(714) // 1024 - 300 - 10
      expect(result.y).toBe(558) // 768 - 200 - 10
    })

    test('handles top-right corner', () => {
      const result = adjustMenuPosition(1024, 0, 200, 100)

      expect(result.x).toBe(814)
      expect(result.y).toBe(10) // Adjusted from 0 to padding
    })

    test('handles bottom-left corner', () => {
      const result = adjustMenuPosition(0, 768, 200, 100)

      expect(result.x).toBe(10) // Adjusted from 0 to padding
      expect(result.y).toBe(658)
    })
  })

  describe('Left edge boundary handling', () => {
    test('adjusts x to padding when negative', () => {
      const result = adjustMenuPosition(-50, 100, 200, 100)

      expect(result.x).toBe(10) // Padding
      expect(result.y).toBe(100)
    })

    test('adjusts x to padding when zero', () => {
      const result = adjustMenuPosition(0, 100, 200, 100)

      expect(result.x).toBe(10)
      expect(result.y).toBe(100)
    })

    test('adjusts x to padding when less than padding value', () => {
      const result = adjustMenuPosition(5, 100, 200, 100)

      expect(result.x).toBe(10)
      expect(result.y).toBe(100)
    })

    test('keeps x when exactly at padding boundary', () => {
      const result = adjustMenuPosition(10, 100, 200, 100)

      expect(result.x).toBe(10)
      expect(result.y).toBe(100)
    })
  })

  describe('Top edge boundary handling', () => {
    test('adjusts y to padding when negative', () => {
      const result = adjustMenuPosition(100, -50, 200, 100)

      expect(result.x).toBe(100)
      expect(result.y).toBe(10) // Padding
    })

    test('adjusts y to padding when zero', () => {
      const result = adjustMenuPosition(100, 0, 200, 100)

      expect(result.x).toBe(100)
      expect(result.y).toBe(10)
    })

    test('adjusts y to padding when less than padding value', () => {
      const result = adjustMenuPosition(100, 5, 200, 100)

      expect(result.x).toBe(100)
      expect(result.y).toBe(10)
    })

    test('keeps y when exactly at padding boundary', () => {
      const result = adjustMenuPosition(100, 10, 200, 100)

      expect(result.x).toBe(100)
      expect(result.y).toBe(10)
    })
  })

  describe('Small viewport scenarios', () => {
    test('handles mobile viewport (375x667)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667
      })

      const result = adjustMenuPosition(300, 600, 200, 100)

      expect(result.x).toBe(165) // 375 - 200 - 10
      expect(result.y).toBe(557) // 667 - 100 - 10
    })

    test('handles small menu in small viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667
      })

      const result = adjustMenuPosition(100, 100, 100, 80)

      expect(result.x).toBe(100)
      expect(result.y).toBe(100)
    })

    test('adjusts menu larger than viewport to fit with padding', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667
      })

      const result = adjustMenuPosition(100, 100, 400, 100)

      expect(result.x).toBe(10) // Menu wider than viewport
      expect(result.y).toBe(100)
    })
  })

  describe('Large viewport scenarios', () => {
    test('handles 4K viewport (3840x2160)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 3840
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 2160
      })

      const result = adjustMenuPosition(3700, 2100, 200, 100)

      expect(result.x).toBe(3630) // 3840 - 200 - 10
      expect(result.y).toBe(2050) // 2160 - 100 - 10
    })

    test('handles large menu in large viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080
      })

      const result = adjustMenuPosition(1000, 500, 500, 300)

      expect(result.x).toBe(1000)
      expect(result.y).toBe(500)
    })
  })

  describe('Edge cases with menu dimensions', () => {
    test('handles zero width menu', () => {
      const result = adjustMenuPosition(500, 300, 0, 100)

      expect(result.x).toBe(500)
      expect(result.y).toBe(300)
    })

    test('handles zero height menu', () => {
      const result = adjustMenuPosition(500, 300, 200, 0)

      expect(result.x).toBe(500)
      expect(result.y).toBe(300)
    })

    test('handles very small menu (1x1)', () => {
      const result = adjustMenuPosition(1020, 760, 1, 1)

      expect(result.x).toBe(1013) // 1024 - 1 - 10
      expect(result.y).toBe(757) // 768 - 1 - 10
    })

    test('handles menu exactly viewport size minus padding', () => {
      const result = adjustMenuPosition(0, 0, 1004, 748) // 1024-20, 768-20

      expect(result.x).toBe(10)
      expect(result.y).toBe(10)
    })
  })

  describe('Padding constant', () => {
    test('uses 10px padding from all edges', () => {
      // Test right edge with padding
      const result1 = adjustMenuPosition(1015, 100, 200, 100)
      expect(result1.x).toBe(814) // 1024 - 200 - 10

      // Test bottom edge with padding
      const result2 = adjustMenuPosition(100, 759, 200, 100)
      expect(result2.y).toBe(658) // 768 - 100 - 10

      // Test left edge with padding
      const result3 = adjustMenuPosition(5, 100, 200, 100)
      expect(result3.x).toBe(10)

      // Test top edge with padding
      const result4 = adjustMenuPosition(100, 5, 200, 100)
      expect(result4.y).toBe(10)
    })
  })

  describe('Typical usage scenarios', () => {
    test('context menu from mouse right-click in center of screen', () => {
      const result = adjustMenuPosition(512, 384, 200, 100)

      expect(result.x).toBe(512)
      expect(result.y).toBe(384)
    })

    test('context menu from right-click near right edge', () => {
      const result = adjustMenuPosition(950, 300, 200, 100)

      expect(result.x).toBe(814) // Adjusted to fit
      expect(result.y).toBe(300)
    })

    test('context menu from right-click near bottom edge', () => {
      const result = adjustMenuPosition(500, 720, 200, 100)

      expect(result.x).toBe(500)
      expect(result.y).toBe(658) // Adjusted to fit
    })

    test('dropdown menu below button near bottom', () => {
      const result = adjustMenuPosition(100, 700, 150, 200)

      expect(result.x).toBe(100)
      expect(result.y).toBe(558) // 768 - 200 - 10
    })

    test('flyout menu to right of button near right edge', () => {
      const result = adjustMenuPosition(900, 200, 250, 300)

      expect(result.x).toBe(764) // 1024 - 250 - 10
      expect(result.y).toBe(200)
    })
  })

  describe('Multiple adjustments', () => {
    test('adjusts x twice (both right overflow and left minimum)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 200
      })

      const result = adjustMenuPosition(1000, 100, 300, 100)

      // First adjustment: 200 - 300 - 10 = -110 (negative)
      // Second adjustment: ensure >= 10
      expect(result.x).toBe(10)
      expect(result.y).toBe(100)
    })

    test('adjusts y twice (both bottom overflow and top minimum)', () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 200
      })

      const result = adjustMenuPosition(100, 1000, 200, 300)

      // First adjustment: 200 - 300 - 10 = -110 (negative)
      // Second adjustment: ensure >= 10
      expect(result.x).toBe(100)
      expect(result.y).toBe(10)
    })
  })

  describe('Boundary precision', () => {
    test('handles position at exact right boundary (no overflow)', () => {
      const result = adjustMenuPosition(814, 100, 200, 100)

      expect(result.x).toBe(814)
    })

    test('handles position 1px beyond right boundary', () => {
      const result = adjustMenuPosition(815, 100, 200, 100)

      expect(result.x).toBe(814)
    })

    test('handles position at exact bottom boundary (no overflow)', () => {
      const result = adjustMenuPosition(100, 658, 200, 100)

      expect(result.y).toBe(658)
    })

    test('handles position 1px beyond bottom boundary', () => {
      const result = adjustMenuPosition(100, 659, 200, 100)

      expect(result.y).toBe(658)
    })
  })
})
