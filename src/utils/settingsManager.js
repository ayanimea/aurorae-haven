// Settings Manager - Feature stub for app configuration
// TODO: Implement full settings management with validation
import { tryCatch } from './errorHandler'

/** Allowed values for schedulingGuidanceLevel */
export const VALID_GUIDANCE_LEVELS = ['full', 'header-only', 'off']

/**
 * Returns true if value is a plain (non-null, non-array) object.
 * Used to guard against corrupted localStorage values.
 * @param {*} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const SETTINGS_KEY = 'aurorae_settings'
const LEGACY_AUTO_SAVE_DIRECTORY_NAME_KEY = 'aurorae_save_directory_name'

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
    directoryConfigured: false, // whether user has selected a directory
    directoryName: null // name of the configured save directory
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
    use24HourFormat: true, // Default to 24-hour format (neurodivergent-friendly, clearer)
    // Controls how much scheduling guidance is shown to the user.
    // "full"        — all currently implemented scheduling guidance, including load indicators
    //                 in supported views and structural-blocking toasts with suggestions
    // "header-only" — load indicators only, without structural-blocking toast guidance
    // "off"         — optional scheduling guidance UI disabled; baseline structural enforcement may still apply
    schedulingGuidanceLevel: 'full'
  }
}
const DEFAULT_SCHEDULING_GUIDANCE_LEVEL =
  DEFAULT_SETTINGS.schedule.schedulingGuidanceLevel

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
      // Uses deepMerge utility (defined at bottom of this file) which:
      // - Handles nested objects recursively
      // - Replaces arrays (doesn't merge them)
      // - Blocks prototype pollution keys (__proto__, constructor, prototype)
      const merged = deepMerge(DEFAULT_SETTINGS, parsed)
      // Clamp schedule.schedulingGuidanceLevel to allowed enum at read time
      // so corrupted/old stored values never propagate into the app.
      // Guard against corrupted localStorage where merged.schedule is not a plain
      // object (e.g. stored as a string/number) — reset to default in that case.
      if (!isPlainObject(merged.schedule)) {
        merged.schedule = { ...DEFAULT_SETTINGS.schedule }
      }
      if (!VALID_GUIDANCE_LEVELS.includes(merged.schedule.schedulingGuidanceLevel)) {
        merged.schedule.schedulingGuidanceLevel = DEFAULT_SCHEDULING_GUIDANCE_LEVEL
      }
      return merged
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
 * @returns {object} Updated settings (from memory, even if localStorage write fails)
 */
export function updateSettings(updates) {
  // TODO: Implement validation and merge strategy
  const current = getSettings()
  const updated = deepMerge(current, updates)

  // Try to persist to localStorage, but don't throw if it fails
  // User still gets updated settings in memory for current session
  tryCatch(
    () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
    },
    'Saving settings to localStorage',
    {
      showToast: false,
      rethrow: false // Handle storage errors gracefully
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

  // Clamp schedulingGuidanceLevel to allowed enum before persisting
  if (
    key === 'schedule.schedulingGuidanceLevel' &&
    !VALID_GUIDANCE_LEVELS.includes(value)
  ) {
    target[lastKey] = DEFAULT_SCHEDULING_GUIDANCE_LEVEL
  }

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
  const legacyDirectoryName = tryCatch(
    () => localStorage.getItem(LEGACY_AUTO_SAVE_DIRECTORY_NAME_KEY),
    'Reading legacy directory name from localStorage',
    { showToast: false }
  ) ?? null
  const settingsDirectoryName =
    typeof settings.autoSave?.directoryName === 'string' &&
    settings.autoSave.directoryName.trim() !== ''
      ? settings.autoSave.directoryName
      : null
  const resolvedDirectoryName = settingsDirectoryName ?? legacyDirectoryName
  const hasResolvedDirectoryName =
    typeof resolvedDirectoryName === 'string' &&
    resolvedDirectoryName.trim() !== ''
  const normalizedAutoSave = isPlainObject(settings.autoSave)
    ? settings.autoSave
    : {}
  const exportableSettings = hasResolvedDirectoryName
    ? {
        ...settings,
        autoSave: {
          ...DEFAULT_SETTINGS.autoSave,
          ...normalizedAutoSave,
          directoryConfigured: true,
          directoryName: resolvedDirectoryName
        }
      }
    : {
        ...settings,
        autoSave: {
          ...DEFAULT_SETTINGS.autoSave,
          ...normalizedAutoSave
        }
      }

  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: exportableSettings
    },
    null,
    2
  )
}

/**
 * Import settings from JSON
 * @param {string|object} json - JSON string or settings object to import
 * @returns {object} Result from updateSettings after applying imported settings
 */
export function importSettings(json) {
  // TODO: Implement validation and version checking
  const data = tryCatch(
    () => {
      // Handle both JSON string and object inputs
      const parsed = typeof json === 'string' ? JSON.parse(json) : json

      // Ensure we are working with a non-null, non-array object
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error('Invalid settings format')
      }

      const hasSettingsProp = Object.prototype.hasOwnProperty.call(
        parsed,
        'settings'
      )

      // Wrapped format: { settings: { ... } }
      if (hasSettingsProp) {
        const wrappedSettings = parsed.settings

        // Validate that wrapped settings is a non-null, non-array object
        // Allow empty settings object as valid reset operation
        if (
          typeof wrappedSettings !== 'object' ||
          wrappedSettings === null ||
          Array.isArray(wrappedSettings)
        ) {
          throw new Error(
            "Invalid settings format: 'settings' must be an object"
          )
        }

        // Empty object = user wants to reset all settings to defaults
        return parsed
      }

      // Direct settings object, wrap it for consistency
      // Note: Array.isArray check already done above
      return { settings: parsed }
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
 * Deep merge two objects (with prototype pollution protection)
 * @param {object} target - Target object
 * @param {object} source - Source object
 * @returns {object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target }

  // Dangerous keys that can cause prototype pollution
  const dangerousKeys = new Set(['__proto__', 'constructor', 'prototype'])

  for (const key in source) {
    // Skip dangerous keys to prevent prototype pollution
    if (dangerousKeys.has(key)) {
      continue
    }

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

  // Validate schedule sub-settings
  if (settings.schedule !== undefined) {
    // Reject non-plain-object values (string, number, array, null) that would
    // silently pass through and later break code expecting an object
    if (!isPlainObject(settings.schedule)) {
      return false
    }
    const { schedulingGuidanceLevel } = settings.schedule
    if (
      schedulingGuidanceLevel !== undefined &&
      !VALID_GUIDANCE_LEVELS.includes(schedulingGuidanceLevel)
    ) {
      return false
    }
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
 * Sets data-theme attribute on <html> so CSS [data-theme="..."] overrides can respond.
 * @param {string} theme - 'dark' | 'light' | 'auto'
 */
function applyTheme(theme) {
  const root = document.documentElement

  if (theme === 'dark' || theme === 'light') {
    root.dataset.theme = theme
  } else {
    // Auto — resolve system preference and set explicitly so CSS sees a defined attribute
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.dataset.theme = prefersDark ? 'dark' : 'light'
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
