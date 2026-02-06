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
  // Try Vite environment first (production/dev builds)
  try {
    // Use indirect eval to prevent Jest from trying to parse import.meta
    // eslint-disable-next-line no-eval
    const importMeta = (0, eval)('import.meta')
    if (importMeta && importMeta.env) {
      return importMeta.env.DEV
    }
  } catch (e) {
    // Fall through to Node/Jest environment
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
