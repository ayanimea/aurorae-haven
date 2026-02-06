/**
 * Environment detection utilities
 * 
 * Provides cross-environment checks that work in both Vite (import.meta) 
 * and Jest (process.env) environments.
 */

/**
 * Check if running in development mode
 * 
 * Uses Vite's compile-time constant injection for secure, zero-overhead detection.
 * No eval(), no runtime checks in production builds.
 * 
 * How it works:
 * 1. Vite's `define` config injects __DEV__ = true/false at build time
 * 2. In production, Vite replaces `__DEV__` with `false` and tree-shakes dead code
 * 3. In Jest, __DEV__ is undefined, so we fall back to process.env.NODE_ENV
 * 
 * Security benefits over eval approach:
 * - No eval() or dynamic code execution
 * - No CSP bypass
 * - Fully static, auditable code
 * - Standard Vite feature (well-documented, secure)
 * 
 * @returns {boolean} True if in development mode
 */
export const isDevelopment = () => {
  // Vite build: __DEV__ is injected as compile-time constant
  // Production build: This entire block is replaced with `return false`
  // Development build: This entire block is replaced with `return true`
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__
  }
  
  // Jest/Node environment (when __DEV__ is not defined)
  return process.env.NODE_ENV !== 'production'
}

/**
 * Check if running in production mode
 * @returns {boolean} True if in production mode
 */
export const isProduction = () => {
  return !isDevelopment()
}
