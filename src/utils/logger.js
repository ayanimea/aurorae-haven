// Logger utility for Aurorae Haven
// Provides conditional logging based on environment and user settings
//
// DESIGN NOTE: This module has no imports to avoid circular dependencies.
// It reads settings directly from localStorage on each call, making it stateless
// and avoiding tight coupling with other modules. This approach eliminates race
// conditions during initialization and follows clean architecture principles.
// This file is the logger utility itself, so it intentionally uses console methods.

/**
 * Check if logging should be enabled
 * Logs are shown when debugMode is enabled in settings or in development
 * @returns {boolean} True if logging is enabled
 */
function isLoggingEnabled() {
  // Enable in development mode
  if (
    typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV === 'development'
  ) {
    return true
  }

  // Check debug mode from settings in localStorage (avoids circular dependency)
  if (typeof localStorage !== 'undefined') {
    try {
      const settings = localStorage.getItem('aurorae_settings')
      if (settings) {
        const parsed = JSON.parse(settings)
        return parsed.advanced?.debugMode === true
      }
    } catch {
      // Silently fail if localStorage is unavailable or settings are corrupted
    }
  }

  return false
}

/**
 * Log an informational message
 * Only outputs in development or when debugMode is enabled
 * @param {...any} args - Arguments to log
 */
export function log(...args) {
  if (isLoggingEnabled()) {
  }
}

/**
 * Log a warning message
 * Only outputs in development or when debugMode is enabled
 * @param {...any} args - Arguments to log
 */
export function warn(...args) {
  if (isLoggingEnabled()) {
  }
}

/**
 * Log an error message
 * Always outputs regardless of debug mode (errors are critical)
 * @param {...any} args - Arguments to log
 */
export function error(...args) {
}

/**
 * Log an info message
 * Only outputs in development or when debugMode is enabled
 * @param {...any} args - Arguments to log
 */
export function info(...args) {
  if (isLoggingEnabled()) {
  }
}

/**
 * Create a namespaced logger for a specific module
 * @param {string} namespace - Module namespace (e.g., 'ServiceWorker', 'PWA')
 * @returns {object} Logger object with namespaced methods
 */
export function createLogger(namespace) {
  const prefix = `[${namespace}]`

  return {
    log: (...args) => log(prefix, ...args),
    warn: (...args) => warn(prefix, ...args),
    error: (...args) => error(prefix, ...args),
    info: (...args) => info(prefix, ...args)
  }
}

// Default export for convenience
export default {
  log,
  warn,
  error,
  info,
  createLogger
}
