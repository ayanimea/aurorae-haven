/**
 * @jest-environment jsdom
 */

import { isDevelopment, isProduction } from '../utils/environment'

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
})
