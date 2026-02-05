// IndexedDB Manager for Aurorae Haven
// Implements ARC-DAT-01: Structured data storage in IndexedDB
// Implements ARC-DAT-02: File attachment references
import { createLogger } from './logger'
import { DEFAULT_BACKUP_LIMIT } from './uiConstants'
import { generateMetadata } from './idGenerator'

const logger = createLogger('IndexedDB')

const DB_NAME = 'aurorae_haven_db'
const DB_VERSION = 3

// Object store names
export const STORES = {
  TASKS: 'tasks',
  ROUTINES: 'routines',
  HABITS: 'habits',
  DUMPS: 'dumps',
  SCHEDULE: 'schedule',
  STATS: 'stats',
  FILE_REFS: 'file_refs',
  BACKUPS: 'backups',
  TEMPLATES: 'templates',
  CALENDAR_SUBSCRIPTIONS: 'calendar_subscriptions'
}

/**
 * Open IndexedDB connection
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    /* global indexedDB */
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        const taskStore = db.createObjectStore(STORES.TASKS, {
          keyPath: 'id',
          autoIncrement: true
        })
        taskStore.createIndex('timestamp', 'timestamp', { unique: false })
        taskStore.createIndex('status', 'status', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.ROUTINES)) {
        const routineStore = db.createObjectStore(STORES.ROUTINES, {
          keyPath: 'id'
        })
        routineStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.HABITS)) {
        const habitStore = db.createObjectStore(STORES.HABITS, {
          keyPath: 'id',
          autoIncrement: true
        })
        habitStore.createIndex('timestamp', 'timestamp', { unique: false })
        habitStore.createIndex('paused', 'paused', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.DUMPS)) {
        const dumpStore = db.createObjectStore(STORES.DUMPS, {
          keyPath: 'id',
          autoIncrement: true
        })
        dumpStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.SCHEDULE)) {
        const scheduleStore = db.createObjectStore(STORES.SCHEDULE, {
          keyPath: 'id',
          autoIncrement: true
        })
        scheduleStore.createIndex('day', 'day', { unique: false })
        scheduleStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // ARC-DAT-04: Statistics storage
      if (!db.objectStoreNames.contains(STORES.STATS)) {
        const statsStore = db.createObjectStore(STORES.STATS, {
          keyPath: 'id',
          autoIncrement: true
        })
        statsStore.createIndex('type', 'type', { unique: false })
        statsStore.createIndex('date', 'date', { unique: false })
        statsStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // ARC-DAT-02: File attachment references
      if (!db.objectStoreNames.contains(STORES.FILE_REFS)) {
        const fileStore = db.createObjectStore(STORES.FILE_REFS, {
          keyPath: 'id',
          autoIncrement: true
        })
        fileStore.createIndex('fileName', 'fileName', { unique: true })
        fileStore.createIndex('parentType', 'parentType', { unique: false })
        fileStore.createIndex('parentId', 'parentId', { unique: false })
        fileStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // ARC-DAT-03: Backup storage
      if (!db.objectStoreNames.contains(STORES.BACKUPS)) {
        const backupStore = db.createObjectStore(STORES.BACKUPS, {
          keyPath: 'id',
          autoIncrement: true
        })
        backupStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // TAB-LIB: Template storage
      if (!db.objectStoreNames.contains(STORES.TEMPLATES)) {
        const templateStore = db.createObjectStore(STORES.TEMPLATES, {
          keyPath: 'id'
        })
        templateStore.createIndex('type', 'type', { unique: false })
        templateStore.createIndex('title', 'title', { unique: false })
        templateStore.createIndex('createdAt', 'createdAt', { unique: false })
        templateStore.createIndex('lastUsed', 'lastUsed', { unique: false })
      }

      // Calendar subscriptions storage
      if (!db.objectStoreNames.contains(STORES.CALENDAR_SUBSCRIPTIONS)) {
        const calendarStore = db.createObjectStore(
          STORES.CALENDAR_SUBSCRIPTIONS,
          {
            keyPath: 'id'
          }
        )
        calendarStore.createIndex('enabled', 'enabled', { unique: false })
        calendarStore.createIndex('lastSyncedAt', 'lastSyncedAt', {
          unique: false
        })
      }
    }
  })
}

/**
 * Generic get all items from a store
 * @param {string} storeName
 * @returns {Promise<Array>}
 */
export async function getAll(storeName) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])

    transaction.oncomplete = () => db.close()
  })
}

/**
 * Generic get item by ID
 * @param {string} storeName
 * @param {*} id
 * @returns {Promise<*>}
 */
export async function getById(storeName, id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    transaction.oncomplete = () => db.close()
  })
}

/**
 * Generic add or update item
 * @param {string} storeName
 * @param {*} item
 * @returns {Promise<*>}
 */
export async function put(storeName, item) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(item)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    transaction.oncomplete = () => db.close()
  })
}

/**
 * Generic batch add or update items
 * More efficient than multiple put() calls as it uses a single transaction
 * @param {string} storeName
 * @param {Array} items - Array of items to add/update
 * @returns {Promise<Array>} Array of generated IDs/keys
 */
export async function putBatch(storeName, items) {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array')
  }

  if (items.length === 0) {
    return []
  }

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    // Pre-allocate results array to maintain input order across async operations.
    // This is necessary because IndexedDB requests complete asynchronously and may finish out of order.
    // By assigning each result to its corresponding index, we ensure the output array matches the input order.
    // Using Promise.all or similar would not guarantee this ordering.
    const results = new Array(items.length)

    let completed = 0
    let hasError = false

    items.forEach((item, index) => {
      const request = store.put(item)

      request.onsuccess = () => {
        if (!hasError) {
          // Assign result to specific index to maintain order regardless of completion order
          results[index] = request.result
          completed++

          if (completed === items.length) {
            resolve(results)
          }
        }
      }

      request.onerror = () => {
        if (!hasError) {
          hasError = true
          reject(request.error)
        }
      }
    })

    transaction.oncomplete = () => db.close()
    transaction.onerror = () => {
      db.close()
      if (!hasError) {
        hasError = true
        reject(transaction.error)
      }
    }
  })
}

/**
 * Generic delete item by ID
 * @param {string} storeName
 * @param {*} id
 * @returns {Promise<void>}
 */
export async function deleteById(storeName, id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()

    transaction.oncomplete = () => db.close()
  })
}

/**
 * Generic clear all items from a store
 * @param {string} storeName
 * @returns {Promise<void>}
 */
export async function clear(storeName) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()

    transaction.oncomplete = () => db.close()
  })
}

/**
 * Get items by index
 * @param {string} storeName
 * @param {string} indexName
 * @param {*} value
 * @returns {Promise<Array>}
 */
export async function getByIndex(storeName, indexName, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(value)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])

    transaction.oncomplete = () => db.close()
  })
}

/**
 * ARC-DAT-02: Add file reference with metadata
 * @param {string} fileName
 * @param {string} parentType - e.g., 'dump', 'task'
 * @param {*} parentId
 * @param {object} metadata
 * @returns {Promise<number>}
 */
export async function addFileReference(
  fileName,
  parentType,
  parentId,
  metadata = {}
) {
  const { timestamp } = generateMetadata()
  const fileRef = {
    fileName,
    parentType,
    parentId,
    timestamp,
    size: metadata.size || 0,
    type: metadata.type || '',
    ...metadata
  }
  return put(STORES.FILE_REFS, fileRef)
}

/**
 * ARC-DAT-02: Get file references for a parent
 * @param {string} parentType
 * @param {*} parentId
 * @returns {Promise<Array>}
 */
export async function getFileReferences(parentType, parentId) {
  const allRefs = await getAll(STORES.FILE_REFS)
  return allRefs.filter(
    (ref) => ref.parentType === parentType && ref.parentId === parentId
  )
}

/**
 * ARC-DAT-02: Delete file reference
 * @param {string} fileName
 * @returns {Promise<void>}
 */
export async function deleteFileReference(fileName) {
  const refs = await getByIndex(STORES.FILE_REFS, 'fileName', fileName)
  if (refs.length > 0) {
    await deleteById(STORES.FILE_REFS, refs[0].id)
  }
}

/**
 * ARC-DAT-04: Save statistics
 * @param {string} type - e.g., 'task_completion', 'habit_streak', 'routine_time'
 * @param {object} data
 * @returns {Promise<number>}
 */
export async function saveStats(type, data) {
  const { timestamp } = generateMetadata()
  const stat = {
    type,
    date: new Date().toISOString().split('T')[0],
    timestamp,
    ...data
  }
  return put(STORES.STATS, stat)
}

/**
 * ARC-DAT-04: Get statistics by type
 * @param {string} type
 * @returns {Promise<Array>}
 */
export async function getStatsByType(type) {
  return getByIndex(STORES.STATS, 'type', type)
}

/**
 * ARC-DAT-04: Get statistics by date range
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @returns {Promise<Array>}
 */
export async function getStatsByDateRange(startDate, endDate) {
  const allStats = await getAll(STORES.STATS)
  return allStats.filter(
    (stat) => stat.date >= startDate && stat.date <= endDate
  )
}

/**
 * ARC-DAT-03: Save backup
 * @param {object} data
 * @returns {Promise<number>}
 */
export async function saveBackup(data) {
  const { timestamp } = generateMetadata()
  const backup = {
    timestamp,
    data: JSON.stringify(data),
    size: JSON.stringify(data).length
  }
  return put(STORES.BACKUPS, backup)
}

/**
 * ARC-DAT-03: Get recent backups
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getRecentBackups(limit = DEFAULT_BACKUP_LIMIT) {
  const backups = await getAll(STORES.BACKUPS)
  return backups.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
}

/**
 * ARC-DAT-03: Delete old backups (keep only N most recent)
 * @param {number} keepCount
 * @returns {Promise<void>}
 */
export async function cleanOldBackups(keepCount = DEFAULT_BACKUP_LIMIT) {
  const backups = await getAll(STORES.BACKUPS)
  const sorted = backups.sort((a, b) => b.timestamp - a.timestamp)

  // Delete backups beyond the keep count
  for (let i = keepCount; i < sorted.length; i++) {
    await deleteById(STORES.BACKUPS, sorted[i].id)
  }
}

/**
 * Migrate data from localStorage to IndexedDB
 * @returns {Promise<object>}
 */
export async function migrateFromLocalStorage() {
  const migrationReport = {
    success: false,
    migrated: {},
    errors: []
  }

  try {
    // Migrate main data
    const mainDataStr = localStorage.getItem('aurorae_haven_data')
    if (mainDataStr) {
      const mainData = JSON.parse(mainDataStr)

      // Migrate tasks
      if (Array.isArray(mainData.tasks)) {
        for (const task of mainData.tasks) {
          await put(STORES.TASKS, task)
        }
        migrationReport.migrated.tasks = mainData.tasks.length
      }

      // Migrate routines (previously called sequences)
      if (Array.isArray(mainData.sequences)) {
        for (const routine of mainData.sequences) {
          await put(STORES.ROUTINES, routine)
        }
        migrationReport.migrated.routines = mainData.sequences.length
      }

      // Migrate habits
      if (Array.isArray(mainData.habits)) {
        for (const habit of mainData.habits) {
          await put(STORES.HABITS, habit)
        }
        migrationReport.migrated.habits = mainData.habits.length
      }

      // Migrate dumps
      if (Array.isArray(mainData.dumps)) {
        for (const dump of mainData.dumps) {
          await put(STORES.DUMPS, dump)
        }
        migrationReport.migrated.dumps = mainData.dumps.length
      }

      // Migrate schedule
      if (Array.isArray(mainData.schedule)) {
        for (const event of mainData.schedule) {
          await put(STORES.SCHEDULE, event)
        }
        migrationReport.migrated.schedule = mainData.schedule.length
      }
    }

    // Migrate schedule from separate key
    const scheduleStr = localStorage.getItem('sj.schedule.events')
    if (scheduleStr) {
      const schedule = JSON.parse(scheduleStr)
      if (Array.isArray(schedule)) {
        for (const event of schedule) {
          await put(STORES.SCHEDULE, event)
        }
        migrationReport.migrated.scheduleEvents = schedule.length
      }
    }

    migrationReport.success = true
  } catch (error) {
    migrationReport.errors.push(error.message)
  }

  return migrationReport
}

/**
 * Export all data from IndexedDB
 * @returns {Promise<object>}
 */
export async function exportAllData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: await getAll(STORES.TASKS),
    routines: await getAll(STORES.ROUTINES),
    habits: await getAll(STORES.HABITS),
    dumps: await getAll(STORES.DUMPS),
    schedule: await getAll(STORES.SCHEDULE),
    stats: await getAll(STORES.STATS),
    fileRefs: await getAll(STORES.FILE_REFS)
  }

  // Also include brain dump data from localStorage (for backward compatibility)
  data.brainDump = {
    content: localStorage.getItem('brainDumpContent') || '',
    tags: localStorage.getItem('brainDumpTags') || '',
    versions: JSON.parse(localStorage.getItem('brainDumpVersions') || '[]'),
    entries: JSON.parse(localStorage.getItem('brainDumpEntries') || '[]')
  }

  // Include tasks from aurorae_tasks (Eisenhower matrix format)
  try {
    const tasksStr = localStorage.getItem('aurorae_tasks')
    data.auroraeTasksData = tasksStr ? JSON.parse(tasksStr) : null
  } catch (e) {
    logger.warn('Failed to parse aurorae_tasks during export:', e)
    data.auroraeTasksData = null
  }

  // Backward compatibility: include sequences field as alias for routines
  data.sequences = data.routines || []

  return data
}

/**
 * Import data into IndexedDB
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function importAllData(data) {
  const importReport = {
    success: false,
    imported: {},
    errors: []
  }

  try {
    // Clear existing data
    await clear(STORES.TASKS)
    await clear(STORES.ROUTINES)
    await clear(STORES.HABITS)
    await clear(STORES.DUMPS)
    await clear(STORES.SCHEDULE)
    await clear(STORES.STATS)
    await clear(STORES.FILE_REFS)

    // Import tasks
    if (Array.isArray(data.tasks)) {
      for (const task of data.tasks) {
        await put(STORES.TASKS, task)
      }
      importReport.imported.tasks = data.tasks.length
    }

    // Import routines (also accepts legacy "sequences" field)
    if (Array.isArray(data.routines)) {
      for (const routine of data.routines) {
        await put(STORES.ROUTINES, routine)
      }
      importReport.imported.routines = data.routines.length
    } else if (Array.isArray(data.sequences)) {
      // Legacy support for old exports
      for (const routine of data.sequences) {
        await put(STORES.ROUTINES, routine)
      }
      importReport.imported.routines = data.sequences.length
    }

    // Import habits
    if (Array.isArray(data.habits)) {
      for (const habit of data.habits) {
        await put(STORES.HABITS, habit)
      }
      importReport.imported.habits = data.habits.length
    }

    // Import dumps
    if (Array.isArray(data.dumps)) {
      for (const dump of data.dumps) {
        await put(STORES.DUMPS, dump)
      }
      importReport.imported.dumps = data.dumps.length
    }

    // Import schedule
    if (Array.isArray(data.schedule)) {
      for (const event of data.schedule) {
        await put(STORES.SCHEDULE, event)
      }
      importReport.imported.schedule = data.schedule.length
    }

    // Import stats
    if (Array.isArray(data.stats)) {
      for (const stat of data.stats) {
        await put(STORES.STATS, stat)
      }
      importReport.imported.stats = data.stats.length
    }

    // Import file references
    if (Array.isArray(data.fileRefs)) {
      for (const ref of data.fileRefs) {
        await put(STORES.FILE_REFS, ref)
      }
      importReport.imported.fileRefs = data.fileRefs.length
    }

    // Import brain dump data to localStorage (for backward compatibility)
    if (data.brainDump) {
      if (data.brainDump.content) {
        localStorage.setItem('brainDumpContent', data.brainDump.content)
      }
      if (data.brainDump.tags) {
        localStorage.setItem('brainDumpTags', data.brainDump.tags)
      }
      if (data.brainDump.versions) {
        localStorage.setItem(
          'brainDumpVersions',
          JSON.stringify(data.brainDump.versions)
        )
      }
      if (data.brainDump.entries) {
        localStorage.setItem(
          'brainDumpEntries',
          JSON.stringify(data.brainDump.entries)
        )
      }
    }

    // Import tasks to aurorae_tasks (Eisenhower matrix format)
    if (data.auroraeTasksData && typeof data.auroraeTasksData === 'object') {
      localStorage.setItem(
        'aurorae_tasks',
        JSON.stringify(data.auroraeTasksData)
      )
      importReport.imported.auroraeTasksData = true
    }

    importReport.success = true
  } catch (error) {
    importReport.errors.push(error.message)
  }

  return importReport
}

/**
 * Check if IndexedDB is available
 * @returns {boolean}
 */
export function isIndexedDBAvailable() {
  return (
    typeof window !== 'undefined' &&
    'indexedDB' in window &&
    window.indexedDB !== null
  )
}
