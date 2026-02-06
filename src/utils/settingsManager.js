// Settings Manager - Feature stub for app configuration
// TODO: Implement full settings management with validation
import { tryCatch } from './errorHandler'

const SETTINGS_KEY = 'aurorae_settings'

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'auto', // 'light', 'dark', 'auto'
  backupEnabled: true,
  backupInterval: 24, // hours
  backupRetention: 10, // number of backups to keep
  autoSave: {
    enabled: false,
    intervalMinutes: 5, // minutes between auto-saves
    keepCount: 10, // number of save files to keep
    directoryConfigured: false // whether user has selected a directory
  },
  notifications: {
    enabled: false,
    tasks: true,
    habits: true,
    routines: true
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeText: false
  },
  privacy: {
    analytics: false,
    crashReports: false
  },
  advanced: {
    useIndexedDB: true,
    debugMode: false
  },
  schedule: {
    use24HourFormat: true // Default to 24-hour format (neurodivergent-friendly, clearer)
  }
}

/**
 * Get all settings
 * @returns {object} Settings object
 */
export function getSettings() {
  // TODO: Implement settings validation
  const result = tryCatch(
    () => {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (!stored) {
        return { ...DEFAULT_SETTINGS }
      }
      const parsed = JSON.parse(stored)
      // Deep merge to preserve nested objects from DEFAULT_SETTINGS
      // Uses deepMerge utility (defined at top of this file) which:
      // - Handles nested objects recursively
      // - Prevents prototype pollution
      // - Replaces arrays (doesn't merge them)
      return deepMerge(DEFAULT_SETTINGS, parsed)
    },
    'Loading settings from localStorage',
    {
      showToast: false
    }
  )
  
  // If tryCatch returned undefined (error occurred), return defaults
  return result || { ...DEFAULT_SETTINGS }
}

/**
 * Get specific setting value
 * @param {string} key - Setting key (dot notation supported)
 * @returns {*} Setting value
 */
export function getSetting(key) {
  // TODO: Implement nested key access
  const settings = getSettings()
  const keys = key.split('.')
  let value = settings

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return undefined
    }
  }

  return value
}

/**
 * Update settings
 * @param {object} updates - Settings updates (partial or full)
 * @returns {object} Updated settings
 */
export function updateSettings(updates) {
  // TODO: Implement validation and merge strategy
  const current = getSettings()
  const updated = deepMerge(current, updates)

  tryCatch(
    () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
    },
    'Saving settings to localStorage',
    {
      showToast: false,
      rethrow: true
    }
  )

  return updated
}

/**
 * Update specific setting
 * @param {string} key - Setting key (dot notation supported)
 * @param {*} value - New value
 * @returns {object} Updated settings
 */
export function updateSetting(key, value) {
  // TODO: Implement nested key update
  const settings = getSettings()
  const keys = key.split('.')
  const lastKey = keys.pop()
  let target = settings

  for (const k of keys) {
    if (!(k in target)) {
      target[k] = {}
    }
    target = target[k]
  }

  target[lastKey] = value

  return updateSettings(settings)
}

/**
 * Reset settings to defaults
 * @returns {object} Default settings
 */
export function resetSettings() {
  // TODO: Implement confirmation dialog
  tryCatch(
    () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS))
    },
    'Resetting settings to defaults',
    {
      showToast: false,
      rethrow: true
    }
  )

  return { ...DEFAULT_SETTINGS }
}

/**
 * Export settings as JSON
 * @returns {string} JSON string of settings
 */
export function exportSettings() {
  // TODO: Implement settings export with metadata
  const settings = getSettings()
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings
    },
    null,
    2
  )
}

/**
 * Import settings from JSON
 * @param {string} json - JSON string of settings
 * @returns {object} Imported settings
 */
export function importSettings(json) {
  // TODO: Implement validation and version checking
  const data = tryCatch(
    () => {
      // Handle both JSON string and object inputs
      const parsed = typeof json === 'string' ? JSON.parse(json) : json
      
      // Check if it's wrapped format { settings: {...} } or direct settings object
      if (parsed.settings) {
        // Allow empty settings object as valid reset operation
        // Empty object = user wants to reset all settings to defaults
        return parsed
      } else if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        // Allow empty settings object as valid reset operation
        // Direct settings object, wrap it for consistency
        // Note: Array.isArray check prevents arrays from being treated as objects
        return { settings: parsed }
      } else {
        throw new Error('Invalid settings format')
      }
    },
    'Parsing imported settings',
    {
      showToast: false,
      rethrow: true
    }
  )

  // The check for !data is redundant with rethrow: true in tryCatch

  return updateSettings(data.settings)
}

/**
 * Deep merge two objects
 * @param {object} target - Target object
 * @param {object} source - Source object
 * @returns {object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target }

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
  }

  return result
}

/**
 * Validate settings object
 * @param {object} settings - Settings to validate
 * @returns {boolean} True if valid
 */
export function validateSettings(settings) {
  // TODO: Implement comprehensive validation
  if (!settings || typeof settings !== 'object') {
    return false
  }

  // Basic validation
  if (settings.theme && !['light', 'dark', 'auto'].includes(settings.theme)) {
    return false
  }

  if (
    typeof settings.backupEnabled !== 'undefined' &&
    typeof settings.backupEnabled !== 'boolean'
  ) {
    return false
  }

  return true
}

/**
 * Apply settings to app
 * @param {object} settings - Settings to apply
 */
export function applySettings(settings) {
  // TODO: Implement settings application logic

  // Theme
  if (settings.theme) {
    applyTheme(settings.theme)
  }

  // Accessibility
  if (settings.accessibility) {
    applyAccessibilitySettings(settings.accessibility)
  }

  // TODO: Apply other settings
}

/**
 * Apply theme setting
 * @param {string} theme - Theme name
 */
function applyTheme(theme) {
  // TODO: Implement theme switching
  const root = document.documentElement

  if (theme === 'dark') {
    root.classList.add('dark-theme')
  } else if (theme === 'light') {
    root.classList.remove('dark-theme')
  } else {
    // Auto - use system preference
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches
    if (prefersDark) {
      root.classList.add('dark-theme')
    } else {
      root.classList.remove('dark-theme')
    }
  }
}

/**
 * Apply accessibility settings
 * @param {object} accessibility - Accessibility settings
 */
function applyAccessibilitySettings(accessibility) {
  // TODO: Implement accessibility settings
  const root = document.documentElement

  if (accessibility.reducedMotion) {
    root.classList.add('reduced-motion')
  } else {
    root.classList.remove('reduced-motion')
  }

  if (accessibility.highContrast) {
    root.classList.add('high-contrast')
  } else {
    root.classList.remove('high-contrast')
  }

  if (accessibility.largeText) {
    root.classList.add('large-text')
  } else {
    root.classList.remove('large-text')
  }
}
