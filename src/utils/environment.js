/**
 * Environment detection utilities
 * 
 * Provides cross-environment checks that work in both Vite (import.meta) 
 * and Jest (process.env) environments.
 */

/**
 * Check if running in development mode
 * @returns {boolean} True if in development mode
 */
export const isDevelopment = () => {
  // Vite environment (production/dev builds)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.DEV
  }
  
  // Jest/Node environment  
  return process.env.NODE_ENV !== 'production'
}

/**
 * Check if running in production mode
 * @returns {boolean} True if in production mode
 */
export const isProduction = () => {
  return !isDevelopment()
}
