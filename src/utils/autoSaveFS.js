// Auto-save utility for saving data to File System Access API
// Implements automatic periodic saves to a user-configured directory
import { getDataTemplate } from './exportData'
import { generateUniqueId as generateSecureUUID } from './idGenerator'
import { createLogger } from './logger'
import { validateImportData } from './validation'
import {
  isIndexedDBAvailable,
  importAllData as importToIndexedDB
} from './indexedDBManager'
import { importToLocalStorage } from './importData'
import { getSetting, updateSetting } from './settingsManager'

const logger = createLogger('AutoSave')

// Storage keys
const LAST_SAVE_KEY = 'aurorae_last_save'
const LAST_SAVE_HASH_KEY = 'aurorae_last_save_hash'
const DIRECTORY_NAME_KEY = 'aurorae_save_directory_name'

// IndexedDB config for persisting the directory handle (full-path reference)
const HANDLE_IDB_NAME = 'aurorae_fs_handles'
const HANDLE_IDB_STORE = 'directory_handles'
const HANDLE_IDB_KEY = 'save_directory'

function syncDirectoryNameBestEffort(directoryName) {
  try {
    localStorage.setItem(DIRECTORY_NAME_KEY, directoryName)
  } catch (error) {
    logger.warn('Failed to persist directory name to localStorage:', error)
  }

  try {
    updateSetting('autoSave.directoryName', directoryName)
  } catch (error) {
    logger.warn('Failed to persist directory name to settings:', error)
  }
}

/**
 * Open the IndexedDB used to persist FileSystemDirectoryHandle objects.
 * @returns {Promise<IDBDatabase>}
 */
function openHandleDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }
    const request = indexedDB.open(HANDLE_IDB_NAME, 1)
    request.onupgradeneeded = (event) => {
      event.target.result.createObjectStore(HANDLE_IDB_STORE)
    }
    request.onsuccess = (event) => resolve(event.target.result)
    request.onerror = (event) => reject(event.target.error)
  })
}

/**
 * Persist a FileSystemDirectoryHandle to IndexedDB so it survives page reloads.
 * @param {FileSystemDirectoryHandle} handle
 * @returns {Promise<void>}
 */
async function storeHandleInIDB(handle) {
  try {
    const db = await openHandleDB()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_IDB_STORE, 'readwrite')
      const store = tx.objectStore(HANDLE_IDB_STORE)
      store.put(handle, HANDLE_IDB_KEY)
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = (e) => { db.close(); reject(e.target.error) }
    })
  } catch (error) {
    logger.warn('Failed to persist directory handle to IndexedDB:', error)
  }
}

/**
 * Retrieve the persisted FileSystemDirectoryHandle from IndexedDB.
 * Returns null when nothing is stored or IndexedDB is unavailable.
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
export async function getStoredDirectoryHandle() {
  try {
    const db = await openHandleDB()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_IDB_STORE, 'readonly')
      const store = tx.objectStore(HANDLE_IDB_STORE)
      const req = store.get(HANDLE_IDB_KEY)
      let result = null
      req.onsuccess = (e) => { result = e.target.result ?? null }
      tx.oncomplete = () => { db.close(); resolve(result) }
      tx.onerror = (e) => { db.close(); reject(e.target.error) }
    })
  } catch (error) {
    logger.warn('Failed to load directory handle from IndexedDB:', error)
    return null
  }
}

/**
 * Remove the persisted FileSystemDirectoryHandle from IndexedDB.
 * @returns {Promise<void>}
 */
async function clearHandleFromIDB() {
  try {
    const db = await openHandleDB()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_IDB_STORE, 'readwrite')
      const store = tx.objectStore(HANDLE_IDB_STORE)
      store.delete(HANDLE_IDB_KEY)
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = (e) => { db.close(); reject(e.target.error) }
    })
  } catch (error) {
    logger.warn('Failed to clear directory handle from IndexedDB:', error)
  }
}

/**
 * Re-request permission for the persisted directory handle without showing the
 * directory picker again.  Must be called from a user-gesture handler.
 * Returns the handle on success, or null if permission was denied or no handle
 * was stored.
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
export async function requestStoredDirectoryPermission() {
  const handle = currentDirectoryHandle ?? (await getStoredDirectoryHandle())
  if (!handle) return null

  try {
    const permission = await handle.requestPermission({ mode: 'readwrite' })
    if (permission === 'granted') {
      currentDirectoryHandle = handle
      syncDirectoryNameBestEffort(handle.name)
      logger.log('Permission re-granted for stored directory:', handle.name)
      return handle
    }
    logger.log('Permission denied for stored directory')
    return null
  } catch (error) {
    logger.error('Failed to request permission for stored directory:', error)
    return null
  }
}

// Time constants
const MS_PER_MINUTE = 60 * 1000 // 60 seconds * 1000 milliseconds

// Default configuration
const DEFAULT_SAVE_INTERVAL = 5 * MS_PER_MINUTE // 5 minutes default
const SAVE_FILE_PREFIX = 'aurorae_save_'
const SAVE_FILE_EXTENSION = '.json'

// Multi-tab coordination
let autoSaveTimer = null
let currentDirectoryHandle = null
let autoSaveChannel = null
let autoSaveTabId = null
let isAutoSaveLeader = true
let lastAutoSaveInterval = null
let visibilityListenerAttached = false

/**
 * Check if File System Access API is supported
 * @returns {boolean}
 */
export function isFileSystemAccessSupported() {
  return (
    typeof window !== 'undefined' &&
    'showDirectoryPicker' in window &&
    'showSaveFilePicker' in window
  )
}

/**
 * Request directory access from user
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
export async function requestDirectoryAccess() {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser')
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents'
    })
    currentDirectoryHandle = handle
    syncDirectoryNameBestEffort(handle.name)
    // Persist handle to IndexedDB so permission can be re-requested without picker
    await storeHandleInIDB(handle)
    logger.log('Directory access granted:', handle.name)
    return handle
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.log('User cancelled directory picker')
      return null
    }
    logger.error('Failed to get directory access:', error)
    throw error
  }
}

/**
 * Get current directory handle
 * @returns {FileSystemDirectoryHandle|null}
 */
export function getCurrentDirectoryHandle() {
  return currentDirectoryHandle
}

/**
 * Get stored directory name (persists across reloads even when handle is lost)
 * @returns {string|null}
 */
export function getStoredDirectoryName() {
  return localStorage.getItem(DIRECTORY_NAME_KEY)
}

/**
 * Clear stored directory name
 */
export async function clearStoredDirectoryName() {
  try {
    localStorage.removeItem(DIRECTORY_NAME_KEY)
  } catch (error) {
    logger.warn('Failed to clear directory name from localStorage:', error)
  }

  try {
    updateSetting('autoSave.directoryName', null)
    updateSetting('autoSave.directoryConfigured', false)
  } catch (error) {
    logger.warn('Failed to clear directory settings:', error)
  }

  // Remove persisted handle from IndexedDB
  await clearHandleFromIDB()
}

/**
 * Set directory handle (used for restoring after page load)
 * @param {FileSystemDirectoryHandle} handle
 */
export async function setDirectoryHandle(handle) {
  currentDirectoryHandle = handle
  if (handle) {
    syncDirectoryNameBestEffort(handle.name)
    // Persist handle to IndexedDB so permission can be re-requested without picker
    await storeHandleInIDB(handle)
  }
}

/**
 * Verify directory handle is still valid
 * @param {FileSystemDirectoryHandle} handle
 * @returns {Promise<boolean>}
 */
export async function verifyDirectoryHandle(handle) {
  if (!handle) return false

  try {
    // Request permission to check if handle is still valid
    const permission = await handle.queryPermission({ mode: 'readwrite' })
    if (permission === 'granted') {
      return true
    }

    // Try to request permission again
    const newPermission = await handle.requestPermission({ mode: 'readwrite' })
    return newPermission === 'granted'
  } catch (error) {
    logger.warn('Directory handle no longer valid:', error)
    return false
  }
}

/**
 * Save data to file in the configured directory
 * @param {object} data - Data to save
 * @param {string} filename - Optional filename (will be generated if not provided)
 * @returns {Promise<string>} - Saved filename
 */
export async function saveToFile(data, filename = null) {
  if (!currentDirectoryHandle) {
    throw new Error('No directory configured. Please select a save directory.')
  }

  // Verify directory handle is still valid
  const isValid = await verifyDirectoryHandle(currentDirectoryHandle)
  if (!isValid) {
    currentDirectoryHandle = null
    throw new Error(
      'Directory access expired. Please select the directory again.'
    )
  }

  // Generate filename if not provided
  if (!filename) {
    const isoTimestamp = new Date().toISOString()
    const [date, timeWithMs] = isoTimestamp.split('T')
    const time = timeWithMs.split('.')[0].replace(/:/g, '')
    const uuid = generateSecureUUID().slice(0, 8) // Short UUID
    filename = `${SAVE_FILE_PREFIX}${date}_${time}_${uuid}${SAVE_FILE_EXTENSION}`
  }

  try {
    // Create/get file handle
    const fileHandle = await currentDirectoryHandle.getFileHandle(filename, {
      create: true
    })

    // Create writable stream
    const writable = await fileHandle.createWritable()

    // Write data
    const jsonData = JSON.stringify(data, null, 2)
    await writable.write(jsonData)
    await writable.close()

    logger.log('Data saved to:', filename)
    return filename
  } catch (error) {
    logger.error('Failed to save file:', error)
    throw new Error('Failed to save file: ' + error.message)
  }
}

/**
 * Generate a simple hash from data for change detection
 * @param {object} data - Data to hash
 * @returns {string} Hash string
 */
function generateDataHash(data) {
  const jsonString = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

/**
 * Perform automatic save
 * @returns {Promise<object>} Save result with filename and timestamp
 */
export async function performAutoSave() {
  try {
    if (!currentDirectoryHandle) {
      logger.log('Auto-save skipped: No directory configured')
      return { success: false, error: 'No directory configured' }
    }

    // Get current data
    const data = await getDataTemplate()

    // Generate hash of current data
    const currentHash = generateDataHash(data)
    const lastHash = localStorage.getItem(LAST_SAVE_HASH_KEY)

    // Check if data has changed since last save
    if (lastHash && currentHash === lastHash) {
      logger.log('Auto-save skipped: No changes detected')
      // Update timestamp to show we checked
      const timestamp = Date.now()
      localStorage.setItem(LAST_SAVE_KEY, timestamp.toString())
      return {
        success: true,
        skipped: true,
        reason: 'No changes detected',
        timestamp
      }
    }

    // Save to file
    const filename = await saveToFile(data)

    // Update last save timestamp and hash
    const timestamp = Date.now()
    localStorage.setItem(LAST_SAVE_KEY, timestamp.toString())
    localStorage.setItem(LAST_SAVE_HASH_KEY, currentHash)

    logger.log('Auto-save completed:', filename)

    // Automatically clean up old files
    try {
      const keepCount = getSetting('autoSave.keepCount') || 10
      await cleanOldSaveFiles(keepCount)
    } catch (cleanupError) {
      // Log but don't fail the save operation if cleanup fails
      logger.warn('Automatic cleanup failed:', cleanupError)
    }

    return {
      success: true,
      filename,
      timestamp
    }
  } catch (error) {
    logger.error('Auto-save failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get metadata for the most recent save file from the directory
 * @returns {Promise<object|null>} File metadata with handle, name, and modified timestamp
 */
export async function getMostRecentSaveFileInfo() {
  if (!currentDirectoryHandle) {
    throw new Error('No directory configured')
  }

  try {
    const files = []

    // Iterate through directory entries
    for await (const entry of currentDirectoryHandle.values()) {
      if (entry.kind === 'file' && entry.name.startsWith(SAVE_FILE_PREFIX)) {
        const file = await entry.getFile()
        files.push({
          name: entry.name,
          handle: entry,
          modified: file.lastModified
        })
      }
    }

    // Sort by modification time (newest first)
    files.sort((a, b) => b.modified - a.modified)

    // Return the most recent file
    return files.length > 0 ? files[0] : null
  } catch (error) {
    logger.error('Failed to get recent save files:', error)
    throw error
  }
}

/**
 * Load data from a save file
 * @param {FileSystemFileHandle} fileHandle - File handle to load from
 * @returns {Promise<object>} Loaded data
 */
export async function loadFromFile(fileHandle) {
  try {
    const file = await fileHandle.getFile()
    const text = await file.text()
    const data = JSON.parse(text)

    logger.log('Data loaded from:', fileHandle.name)
    return data
  } catch (error) {
    logger.error('Failed to load file:', error)
    throw new Error('Failed to load file: ' + error.message)
  }
}

/**
 * Load the most recent save file
 * @returns {Promise<object>} Result with loaded data
 */
export async function loadLastSave() {
  try {
    if (!currentDirectoryHandle) {
      return {
        success: false,
        error: 'No directory configured. Please select a save directory.'
      }
    }

    // Verify directory handle is still valid
    const isValid = await verifyDirectoryHandle(currentDirectoryHandle)
    if (!isValid) {
      currentDirectoryHandle = null
      return {
        success: false,
        error: 'Directory access expired. Please select the directory again.'
      }
    }

    // Get the most recent save file
    const fileInfo = await getMostRecentSaveFileInfo()
    if (!fileInfo) {
      return {
        success: false,
        error: 'No save files found in the directory'
      }
    }

    // Load the data
    const data = await loadFromFile(fileInfo.handle)

    logger.log('Last save loaded successfully:', fileInfo.name)
    return {
      success: true,
      data,
      filename: fileInfo.name,
      timestamp: fileInfo.modified
    }
  } catch (error) {
    logger.error('Failed to load last save:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Load and import the most recent save file
 * This combines loading the file and importing the data into the app
 * @returns {Promise<object>} Result with success status
 */
export async function loadAndImportLastSave() {
  try {
    // Load the last save file
    const loadResult = await loadLastSave()
    if (!loadResult.success) {
      return loadResult
    }

    // Validate the loaded data
    const validation = validateImportData(loadResult.data)
    if (!validation.valid) {
      return {
        success: false,
        error: `Import validation failed: ${validation.errors.join(', ')}`
      }
    }

    // Import the data (try IndexedDB first, fallback to localStorage)
    if (isIndexedDBAvailable()) {
      try {
        await importToIndexedDB(loadResult.data)
      } catch (e) {
        logger.warn('IndexedDB import failed, falling back to localStorage:', e)
        importToLocalStorage(loadResult.data)
      }
    } else {
      importToLocalStorage(loadResult.data)
    }

    logger.log('Last save imported successfully:', loadResult.filename)
    return {
      success: true,
      filename: loadResult.filename,
      timestamp: loadResult.timestamp
    }
  } catch (error) {
    logger.error('Failed to load and import last save:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Ensure auto-save tab ID exists
 */
function ensureAutoSaveTabId() {
  if (!autoSaveTabId) {
    autoSaveTabId = generateSecureUUID()
  }
}

/**
 * Initialize BroadcastChannel for multi-tab coordination
 */
function initAutoSaveChannel() {
  if (
    typeof window === 'undefined' ||
    typeof BroadcastChannel === 'undefined'
  ) {
    return
  }

  if (autoSaveChannel) {
    return
  }

  ensureAutoSaveTabId()

  autoSaveChannel = new window.BroadcastChannel('aurorae_autosave')
  autoSaveChannel.onmessage = (event) => {
    const data = event?.data
    if (!data || typeof data.type !== 'string') {
      return
    }

    if (data.type === 'autosave-leader' && data.tabId !== autoSaveTabId) {
      if (isAutoSaveLeader) {
        isAutoSaveLeader = false
        internalStopAutoSaveTimer()
        logger.log('Auto-save leadership transferred to another tab')
      }
    } else if (data.type === 'autosave-request-leader' && isAutoSaveLeader) {
      autoSaveChannel.postMessage({
        type: 'autosave-leader',
        tabId: autoSaveTabId
      })
    }
  }
}

/**
 * Schedule auto-save work using requestIdleCallback if available
 */
function scheduleAutoSaveWork() {
  const run = async () => {
    try {
      await performAutoSave()
    } catch (error) {
      logger.error('Auto-save failed:', error)
    }
  }

  if (
    typeof window !== 'undefined' &&
    typeof window.requestIdleCallback === 'function'
  ) {
    window.requestIdleCallback(() => {
      void run()
    })
  } else {
    void run()
  }
}

/**
 * Internal function to start auto-save timer
 * @param {number} intervalMs - Interval in milliseconds
 */
function internalStartAutoSaveTimer(intervalMs) {
  internalStopAutoSaveTimer()
  lastAutoSaveInterval = intervalMs

  logger.log(`Starting auto-save with interval: ${intervalMs / 1000}s`)

  autoSaveTimer = setInterval(() => {
    if (!isAutoSaveLeader) {
      return
    }

    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'hidden'
    ) {
      return
    }

    scheduleAutoSaveWork()
  }, intervalMs)
}

/**
 * Internal function to stop auto-save timer
 */
function internalStopAutoSaveTimer() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
    logger.log('Auto-save timer stopped')
  }
}

/**
 * Ensure visibility listener is attached
 */
function ensureVisibilityListener() {
  if (visibilityListenerAttached || typeof document === 'undefined') {
    return
  }

  document.addEventListener('visibilitychange', () => {
    if (!lastAutoSaveInterval) {
      return
    }

    if (document.visibilityState === 'visible') {
      if (isAutoSaveLeader && !autoSaveTimer) {
        internalStartAutoSaveTimer(lastAutoSaveInterval)
      }
    } else if (document.visibilityState === 'hidden') {
      internalStopAutoSaveTimer()
    }
  })

  visibilityListenerAttached = true
}

/**
 * Start automatic save timer with multi-tab coordination
 * @param {number} intervalMs - Interval in milliseconds
 */
export function startAutoSave(intervalMs = DEFAULT_SAVE_INTERVAL) {
  // Only start if we have a valid directory
  if (!currentDirectoryHandle) {
    logger.warn('Cannot start auto-save: No directory configured')
    return
  }

  ensureAutoSaveTabId()
  initAutoSaveChannel()
  ensureVisibilityListener()

  // This tab becomes the leader and informs other tabs, if coordination is available
  isAutoSaveLeader = true
  if (autoSaveChannel) {
    autoSaveChannel.postMessage({
      type: 'autosave-leader',
      tabId: autoSaveTabId
    })
  }

  internalStartAutoSaveTimer(intervalMs)

  // Perform initial save if we're the leader and the tab is visible
  if (
    isAutoSaveLeader &&
    currentDirectoryHandle &&
    (typeof document === 'undefined' || document.visibilityState === 'visible')
  ) {
    scheduleAutoSaveWork()
  }
}

/**
 * Stop automatic save timer
 */
export function stopAutoSave() {
  isAutoSaveLeader = false
  internalStopAutoSaveTimer()
}

/**
 * Get last save timestamp
 * @returns {number|null}
 */
export function getLastSaveTimestamp() {
  const timestamp = localStorage.getItem(LAST_SAVE_KEY)
  return timestamp ? parseInt(timestamp, 10) : null
}

/**
 * Initialize auto-save system
 * @param {object} settings - Auto-save settings
 * @returns {Promise<void>}
 */
export async function initAutoSave(settings = {}) {
  if (!isFileSystemAccessSupported()) {
    logger.warn('File System Access API not supported - auto-save disabled')
    return
  }

  // Check if auto-save is enabled
  if (settings.enabled === false) {
    logger.log('Auto-save is disabled in settings')
    return
  }

  // Check if we have a valid directory handle
  if (currentDirectoryHandle) {
    const isValid = await verifyDirectoryHandle(currentDirectoryHandle)
    if (isValid) {
      // Start auto-save with configured interval
      const interval = settings.intervalMinutes
        ? settings.intervalMinutes * MS_PER_MINUTE
        : DEFAULT_SAVE_INTERVAL
      startAutoSave(interval)
    } else {
      currentDirectoryHandle = null
      logger.log('Directory handle invalid - user needs to configure')
    }
  } else {
    logger.log('No directory configured - user needs to set up auto-save')
  }
}

/**
 * Clean up old save files (keep only N most recent)
 * @param {number} keepCount - Number of files to keep
 * @returns {Promise<number>} Number of files deleted
 */
export async function cleanOldSaveFiles(keepCount = 10) {
  if (!currentDirectoryHandle) {
    throw new Error('No directory configured')
  }

  try {
    const files = []

    // Iterate through directory entries
    for await (const entry of currentDirectoryHandle.values()) {
      if (entry.kind === 'file' && entry.name.startsWith(SAVE_FILE_PREFIX)) {
        const file = await entry.getFile()
        files.push({
          name: entry.name,
          handle: entry,
          modified: file.lastModified
        })
      }
    }

    // Sort by modification time (newest first)
    files.sort((a, b) => b.modified - a.modified)

    // Delete old files
    let deletedCount = 0
    for (let i = keepCount; i < files.length; i++) {
      try {
        await currentDirectoryHandle.removeEntry(files[i].name)
        deletedCount++
        logger.log('Deleted old save file:', files[i].name)
      } catch (error) {
        logger.error('Failed to delete file:', files[i].name, error)
      }
    }

    return deletedCount
  } catch (error) {
    logger.error('Failed to clean old save files:', error)
    throw error
  }
}
