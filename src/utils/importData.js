// Data import utilities
import { validateImportData } from './validation'
import {
  isIndexedDBAvailable,
  importAllData as importToIndexedDB
} from './indexedDBManager'
import { createLogger } from './logger'
import { PAGE_RELOAD_DELAY_MS } from './uiConstants'
import { saveCategories, setDefaultCategory } from './categoryStorage'
import { saveSavedTasks } from './savedTasks'
import { normalizeImportedCategories } from './categoryImport'

const logger = createLogger('ImportData')

// Data schema field names
const DATA_FIELDS = {
  TASKS: 'tasks',
  ROUTINES: 'routines',
  HABITS: 'habits',
  DUMPS: 'dumps',
  SCHEDULE: 'schedule'
}

/**
 * Import data to localStorage
 * @param {Object} data - Data object to import
 * @returns {void}
 */
export function importToLocalStorage(data) {
  data = normalizeImportedCategories(data)
  if (typeof data.defaultCategory === 'string') {
    setDefaultCategory(data.defaultCategory)
  }
  for (const field of Object.values(DATA_FIELDS)) {
    if (data[field]) {
      localStorage.setItem(field, JSON.stringify(data[field]))
    }
  }
  if (
    data.auroraeTasksData &&
    typeof data.auroraeTasksData === 'object' &&
    !Array.isArray(data.auroraeTasksData)
  ) {
    localStorage.setItem('aurorae_tasks', JSON.stringify(data.auroraeTasksData))
  }
  const brainDumpEntries = Array.isArray(data.brainDump?.entries)
    ? data.brainDump.entries
    : data.dumps
  if (Array.isArray(brainDumpEntries)) {
    localStorage.setItem('brainDumpEntries', JSON.stringify(brainDumpEntries))
  }
  if (Array.isArray(data.categories)) {
    saveCategories(data.categories)
  }
  if (Array.isArray(data.savedTasks)) {
    saveSavedTasks(data.savedTasks)
  }
}

// Import success message constant
export const IMPORT_SUCCESS_MESSAGE =
  'Data imported successfully. Page will reload...'

/**
 * Reload page after a delay
 * @param {number} [delay=PAGE_RELOAD_DELAY_MS] - Delay in milliseconds (default: PAGE_RELOAD_DELAY_MS)
 * @param {Window|undefined} [windowObj=globalThis.window] - Injectable window object (defaults to globalThis.window). No action is taken when no window is available.
 * @returns {void}
 */
export function reloadPageAfterDelay(
  delay = PAGE_RELOAD_DELAY_MS,
  windowObj = typeof globalThis !== 'undefined' ? globalThis.window : undefined
) {
  // Early return if no window object available
  if (!windowObj) return

  // Early return if location is not available
  if (!windowObj.location) return

  // Early return if reload function is not available
  if (typeof windowObj.location.reload !== 'function') return

  const setTimeoutFn = windowObj.setTimeout || globalThis.setTimeout
  setTimeoutFn(() => windowObj.location.reload(), delay)
}

/**
 * Import data from JSON file
 * @param {File} file - JSON file to import
 * @returns {Promise<boolean>} True if import succeeded
 * @throws {Error} If import fails
 */
export async function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const obj = JSON.parse(e.target.result)

        // Validate import data
        const validation = validateImportData(obj)
        if (!validation.valid) {
          throw new Error(
            `Import validation failed: ${validation.errors.join(', ')}`
          )
        }
        const normalizedData = normalizeImportedCategories(obj)

        // Try IndexedDB first if available, fallback to localStorage
        if (isIndexedDBAvailable()) {
          try {
            await importToIndexedDB(normalizedData)
            resolve(true)
            return
          } catch (e) {
            logger.warn(
              'IndexedDB import failed, falling back to localStorage:',
              e
            )
            // Use localStorage as fallback when IndexedDB fails
            importToLocalStorage(normalizedData)
            resolve(true)
          }
        } else {
          // Use localStorage when IndexedDB is not available
          importToLocalStorage(normalizedData)
          resolve(true)
        }
      } catch (e) {
        logger.error('Import failed:', e)
        reject(new Error('Import failed: ' + e.message))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}
