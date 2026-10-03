// Data export utilities
import { v4 as generateSecureUUID } from 'uuid'
import { validateExportData } from './validation'
import {
  isIndexedDBAvailable,
  exportAllData as exportFromIndexedDB
} from './indexedDBManager'
import { tryCatch, withErrorHandling } from './errorHandler'
import { loadCategories } from './categoryStorage'
import { loadSavedTasks } from './savedTasks'

// Data schema field names - centralized to prevent drift
const DATA_FIELDS = {
  TASKS: 'tasks',
  ROUTINES: 'routines',
  HABITS: 'habits',
  DUMPS: 'dumps',
  SCHEDULE: 'schedule'
}

// Schedule event types - used for type field in schedule blocks
export const SCHEDULE_EVENT_TYPES = {
  TASK: 'task',
  ROUTINE: 'routine',
  BREAK: 'break',
  MEETING: 'meeting'
}

/**
 * Get data template from localStorage or IndexedDB
 * @returns {Promise<object>} Data template object
 */
export async function getDataTemplate() {
  // Check if IndexedDB is available and has data
  if (isIndexedDBAvailable()) {
    const indexedDBData = await withErrorHandling(
      exportFromIndexedDB,
      'IndexedDB export',
      {
        showToast: false
      }
    )

    // Only use IndexedDB if it has actual data
    if (
      indexedDBData &&
      (indexedDBData.tasks?.length > 0 ||
        indexedDBData.routines?.length > 0 ||
        indexedDBData.habits?.length > 0 ||
        indexedDBData.dumps?.length > 0 ||
        indexedDBData.schedule?.length > 0)
    ) {
      return indexedDBData
    }
  }

  // Fallback to localStorage
  const data = {
    version: 1,
    exportedAt: new Date().toISOString()
  }

  // Load all data fields from localStorage
  for (const field of Object.values(DATA_FIELDS)) {
    data[field] =
      tryCatch(
        () => {
          const raw = localStorage.getItem(field)
          return raw ? JSON.parse(raw) : []
        },
        `Loading ${field} from localStorage`,
        {
          showToast: false
        }
      ) || []
  }

  // Backward compatibility: check for old 'sequences' localStorage key
  tryCatch(
    () => {
      if (!data.routines || data.routines.length === 0) {
        const sequencesStr = localStorage.getItem('sequences')
        if (sequencesStr) {
          data.routines = JSON.parse(sequencesStr)
        }
      }
    },
    'Loading legacy sequences from localStorage',
    {
      showToast: false
    }
  )

  // Also check for aurorae_tasks (Eisenhower matrix format)
  tryCatch(
    () => {
      const tasksStr = localStorage.getItem('aurorae_tasks')
      if (tasksStr) {
        const auroraeTasksData = JSON.parse(tasksStr)
        if (auroraeTasksData) {
          data.auroraeTasksData = auroraeTasksData
          // Also flatten to tasks array for backward compatibility
          data.tasks = Object.values(auroraeTasksData).flatMap((quadrant) =>
            Array.isArray(quadrant) ? quadrant : []
          )
        }
      }
    },
    'Loading aurorae_tasks from localStorage',
    {
      showToast: false
    }
  )

  // Parse brainDumpEntries once for both dumps override and brainDump.entries
  const entries =
    tryCatch(
      () => {
        const entriesStr = localStorage.getItem('brainDumpEntries')
        if (entriesStr) {
          const parsed = JSON.parse(entriesStr)
          // Override dumps field with brainDumpEntries if it exists
          if (Array.isArray(parsed)) {
            data.dumps = parsed
          }
          return parsed
        }
        return []
      },
      'Loading brainDumpEntries from localStorage',
      {
        showToast: false
      }
    ) || []

  // Parse brainDumpVersions for backward compatibility
  const versions =
    tryCatch(
      () => {
        const versionsStr = localStorage.getItem('brainDumpVersions')
        return versionsStr ? JSON.parse(versionsStr) : []
      },
      'Loading brainDumpVersions from localStorage',
      {
        showToast: false
      }
    ) || []

  // Include brain dump data for backward compatibility
  data.brainDump = {
    content: localStorage.getItem('brainDumpContent') || '',
    tags: localStorage.getItem('brainDumpTags') || '',
    versions,
    entries
  }
  data.categories = loadCategories()
  data.savedTasks = loadSavedTasks()

  // Backward compatibility: include sequences field as alias for routines
  data.sequences = data.routines || []

  return data
}

/**
 * Export all data as JSON file
 * @returns {Promise<boolean>} True if export succeeded
 * @throws {Error} If export fails
 */
export async function exportJSON() {
  const dataTemplate = await getDataTemplate()

  // Validate data before export (includes serialization test)
  const validation = validateExportData(dataTemplate)
  if (!validation.valid) {
    throw new Error(`Export validation failed: ${validation.errors.join(', ')}`)
  }

  // Serialize data for export (reuse validation.stringified to avoid redundant serialization)
  const data =
    typeof validation.stringified === 'string'
      ? validation.stringified
      : JSON.stringify(dataTemplate)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  // Generate filename: aurorae_YYYY-MM-DD_UUID.json
  const date = new Date().toISOString().split('T')[0]
  const uuid = generateSecureUUID()
  const filename = `aurorae_${date}_${uuid}.json`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return true
}
