/**
 * Environment detection utilities
 * 
 * Provides cross-environment checks that work in both Vite (import.meta) 
 * and Jest (process.env) environments.
 */

/**
 * Check if running in development mode
 * 
 * SECURITY NOTE: Uses indirect eval to access import.meta
 * 
 * Why eval is used:
 * - Jest's code coverage instrumentation parses `typeof import.meta` during
 *   static analysis, causing "Cannot use 'import.meta' outside a module" errors
 * - Direct typeof checks fail even when wrapped in try-catch
 * - Indirect eval `(0, eval)('import.meta')` prevents Jest from parsing it
 * - This is a known limitation of Jest's CommonJS environment
 * 
 * Security considerations:
 * - The eval only executes a fixed string literal 'import.meta'
 * - No user input or dynamic code execution
 * - Falls back safely to process.env.NODE_ENV in Jest/Node
 * - Only affects dev/test environments, not production builds
 * 
 * Alternative approaches tried:
 * - `typeof import.meta` → Jest parse error
 * - Dynamic import() → Not supported in Jest CommonJS
 * - @ts-ignore comments → Doesn't prevent Jest instrumentation
 * 
 * @returns {boolean} True if in development mode
 */
export const isDevelopment = () => {
  // Try Vite environment first (production/dev builds)
  try {
    // Use indirect eval to prevent Jest from trying to parse import.meta
    const importMeta = (0, eval)('import.meta')
    if (importMeta && importMeta.env) {
      return importMeta.env.DEV
    }
  } catch {
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
