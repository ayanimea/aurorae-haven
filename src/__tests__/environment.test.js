/**
 * @vitest-environment jsdom
 */

import { isDevelopment, isProduction, getEnvVar } from '../utils/environment'

describe('environment utilities', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('isDevelopment', () => {
    test('returns true in development environment', () => {
      process.env.NODE_ENV = 'development'
      expect(isDevelopment()).toBe(true)
    })

    test('returns false in production environment', () => {
      process.env.NODE_ENV = 'production'
      expect(isDevelopment()).toBe(false)
    })

    test('returns true in test environment (non-production)', () => {
      process.env.NODE_ENV = 'test'
      expect(isDevelopment()).toBe(true)
    })

    test('returns boolean type', () => {
      expect(typeof isDevelopment()).toBe('boolean')
    })
  })

  describe('isProduction', () => {
    test('returns false in development environment', () => {
      process.env.NODE_ENV = 'development'
      expect(isProduction()).toBe(false)
    })

    test('returns true in production environment', () => {
      process.env.NODE_ENV = 'production'
      expect(isProduction()).toBe(true)
    })

    test('returns false in test environment (non-production)', () => {
      process.env.NODE_ENV = 'test'
      expect(isProduction()).toBe(false)
    })

    test('is inverse of isDevelopment', () => {
      expect(isProduction()).toBe(!isDevelopment())
    })

    test('returns boolean type', () => {
      expect(typeof isProduction()).toBe('boolean')
    })
  })

  describe('cross-environment compatibility', () => {
    test('handles missing import.meta gracefully (Jest fallback)', () => {
      // In Jest environment, import.meta is not available
      // The function should fall back to process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      expect(() => isDevelopment()).not.toThrow()
      expect(isDevelopment()).toBe(true)
    })

    test('handles undefined process.env.NODE_ENV', () => {
      delete process.env.NODE_ENV
      // Should default to development (non-production)
      expect(isDevelopment()).toBe(true)
      expect(isProduction()).toBe(false)
    })
  })

  describe('getEnvVar', () => {
    const originalCompileMode = process.env.VITE_COMPILE_MODE

    afterEach(() => {
      if (originalCompileMode === undefined) {
        delete process.env.VITE_COMPILE_MODE
      } else {
        process.env.VITE_COMPILE_MODE = originalCompileMode
      }
    })

    test('reads value from process.env in test environment', () => {
      process.env.VITE_COMPILE_MODE = 'web-online'
      expect(getEnvVar('VITE_COMPILE_MODE')).toBe('web-online')
    })

    test('returns undefined for an unset variable', () => {
      delete process.env.VITE_COMPILE_MODE
      expect(getEnvVar('VITE_COMPILE_MODE')).toBeUndefined()
    })

    test('does not throw for unknown keys', () => {
      expect(() => getEnvVar('VITE_NONEXISTENT_KEY')).not.toThrow()
    })
  })
})
