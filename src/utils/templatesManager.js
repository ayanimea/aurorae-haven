/**
 * Template Management Utility
 * Handles CRUD operations for Task and Routine templates using IndexedDB
 */

import { openDB, isIndexedDBAvailable } from './indexedDBManager'
import { v4 as generateSecureUUID } from 'uuid'
import { validateTemplateData } from './validation'
import semver from 'semver'
import { createLogger } from './logger'
import { updateMetadata, getCurrentTimestamp } from './idGenerator'

const logger = createLogger('Templates')

const TEMPLATES_STORE = 'templates'

// Supported template export version range (semver)
const SUPPORTED_VERSION_RANGE = '>=1.0 <2.0'
const CURRENT_VERSION = '1.0'

// Database connection management encapsulated in a class
class TemplatesDBManager {
  constructor() {
    this.dbConnection = null
    this.connectionPromise = null
  }

  /**
   * Get or create database connection
   * Reuses existing connection to avoid frequent open/close cycles
   * @returns {Promise<IDBDatabase>}
   */
  async getDBConnection() {
    if (this.dbConnection) {
      return this.dbConnection
    }

    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = openDB()
      .then((db) => {
        this.dbConnection = db
        this.connectionPromise = null

        // Handle connection close/error events with proper cleanup
        const handleDisconnect = () => {
          // Remove event handlers to prevent memory leaks
          if (this.dbConnection) {
            this.dbConnection.onclose = null
            this.dbConnection.onerror = null
          }
          this.dbConnection = null
        }

        db.onclose = handleDisconnect
        db.onerror = handleDisconnect

        return db
      })
      .catch((error) => {
        this.connectionPromise = null
        throw error
      })

    return this.connectionPromise
  }

  /**
   * Close database connection
   * Should only be called when application unloads or no longer needs DB access
   */
  closeDBConnection() {
    if (this.dbConnection) {
      // Clean up event handlers before closing
      this.dbConnection.onclose = null
      this.dbConnection.onerror = null
      this.dbConnection.close()
      this.dbConnection = null
    }
  }

  /**
   * Reset connection state (for testing)
   */
  resetConnectionState() {
    this.dbConnection = null
    this.connectionPromise = null
  }
}

// Export a singleton instance for default use
export const templatesDBManager = new TemplatesDBManager()
// Export the class for testing/multi-instance scenarios
export { TemplatesDBManager }

// Export convenience functions for backward compatibility
const getDBConnection = () => templatesDBManager.getDBConnection()
const closeDBConnection = () => templatesDBManager.closeDBConnection()

export { getDBConnection, closeDBConnection }

/**
 * Check if a template version is supported
 * @param {string} version
 * @returns {boolean}
 */
function isSupportedVersion(version) {
  const coercedVersion = semver.coerce(version)
  return (
    coercedVersion && semver.satisfies(coercedVersion, SUPPORTED_VERSION_RANGE)
  )
}

/**
 * Initialize templates in IndexedDB
 * @returns {Promise<void>}
 */
export async function initializeTemplates() {
  if (!isIndexedDBAvailable()) return

  const db = await getDBConnection()
  if (!db.objectStoreNames.contains(TEMPLATES_STORE)) {
    logger.warn('Templates store not found in IndexedDB')
  }
}

/**
 * Get all templates
 * @returns {Promise<Array>} Array of template objects
 */
export async function getAllTemplates() {
  if (!isIndexedDBAvailable()) return []

  try {
    const db = await getDBConnection()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TEMPLATES_STORE, 'readonly')
      const store = transaction.objectStore(TEMPLATES_STORE)
      const request = store.getAll()

      request.onerror = () => {
        logger.error('Error loading templates:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        const templates = request.result || []

        // Ensure we always return an array
        if (!Array.isArray(templates)) {
          logger.warn(
            'getAllTemplates: store.getAll() did not return an array, returning empty array'
          )
          resolve([])
        } else {
          resolve(templates)
        }
      }

      // Note: DB connection is kept open for reuse, not closed after transaction
    })
  } catch (error) {
    logger.error('Error loading templates:', error)
    return []
  }
}

/**
 * Get a single template by ID
 * @param {string} templateId - Template ID
 * @returns {Promise<Object|null>} Template object or null
 */
export async function getTemplate(templateId) {
  if (!isIndexedDBAvailable()) return null

  try {
    const db = await getDBConnection()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TEMPLATES_STORE, 'readonly')
      const store = transaction.objectStore(TEMPLATES_STORE)
      const request = store.get(templateId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)

      // Note: DB connection is kept open for reuse
    })
  } catch (error) {
    logger.error('Error loading template:', error)
    return null
  }
}

/**
 * Save a new template
 * @param {Object} template - Template data
 * @returns {Promise<string>} Template ID
 */
export async function saveTemplate(template) {
  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB not available')
  }

  // Validate template data
  const validation = validateTemplateData(template)
  if (!validation.valid) {
    throw new Error(`Invalid template data: ${validation.errors.join('; ')}`)
  }

  try {
    const db = await getDBConnection()

    const templateData = {
      id: template.id || generateSecureUUID(),
      type: template.type, // 'task' or 'routine'
      title: template.title,
      tags: template.tags || [],
      version: template.version || 1,
      createdAt: template.createdAt || new Date().toISOString(),
      lastUsed: template.lastUsed || null,
      // Task-specific fields
      category: template.category || null,
      quadrant: template.quadrant || null,
      dueOffset: template.dueOffset || null,
      // Routine-specific fields
      steps: template.steps || [],
      energyTag: template.energyTag || null,
      estimatedDuration: template.estimatedDuration || null,
      // Metadata
      pinned: template.pinned || false
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TEMPLATES_STORE, 'readwrite')
      const store = transaction.objectStore(TEMPLATES_STORE)
      const request = store.put(templateData)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(templateData.id)

      // Note: DB connection is kept open for reuse
    })
  } catch (error) {
    logger.error('Error saving template:', error)
    throw error
  }
}

/**
 * Update an existing template
 * @param {string} templateId - Template ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateTemplate(templateId, updates) {
  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB not available')
  }

  logger.log(`Updating template ${templateId}`, { updates })

  try {
    const db = await getDBConnection()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TEMPLATES_STORE, 'readwrite')
      const store = transaction.objectStore(TEMPLATES_STORE)

      const getRequest = store.get(templateId)

      getRequest.onerror = () => {
        logger.error(`Failed to get template ${templateId}:`, getRequest.error)
        reject(getRequest.error)
      }
      getRequest.onsuccess = () => {
        const existing = getRequest.result
        if (!existing) {
          logger.error(`Template ${templateId} not found in IndexedDB`)
          reject(new Error('Template not found'))
          return
        }

        logger.log(`Existing template:`, existing)

        const updated = updateMetadata({
          ...existing,
          ...updates,
          id: templateId // Ensure ID doesn't change
        })

        logger.log(`Updated template (before validation):`, updated)

        // Validate the updated template data
        const validation = validateTemplateData(updated)
        if (!validation.valid) {
          logger.error(
            `Validation failed for template ${templateId}:`,
            validation.errors
          )
          logger.log(`Template data that failed validation:`, updated)
          reject(
            new Error(`Invalid template data: ${validation.errors.join('; ')}`)
          )
          return
        }

        logger.log(`Validation passed, saving template ${templateId}`)

        const putRequest = store.put(updated)
        putRequest.onerror = () => {
          logger.error(
            `Failed to save template ${templateId}:`,
            putRequest.error
          )
          reject(putRequest.error)
        }
        putRequest.onsuccess = () => {
          logger.log(`Successfully updated template ${templateId}`)
          resolve()
        }
      }

      // Note: DB connection is kept open for reuse
    })
  } catch (error) {
    logger.error('Error updating template:', error)
    throw error
  }
}

/**
 * Delete a template
 * @param {string} templateId - Template ID
 * @returns {Promise<void>}
 */
export async function deleteTemplate(templateId) {
  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB not available')
  }

  try {
    const db = await getDBConnection()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TEMPLATES_STORE, 'readwrite')
      const store = transaction.objectStore(TEMPLATES_STORE)
      const request = store.delete(templateId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()

      // Note: DB connection is kept open for reuse
    })
  } catch (error) {
    logger.error('Error deleting template:', error)
    throw error
  }
}

/**
 * Duplicate a template
 * @param {string} templateId - Template ID to duplicate
 * @returns {Promise<string>} New template ID
 */
export async function duplicateTemplate(templateId) {
  const template = await getTemplate(templateId)
  if (!template) {
    throw new Error('Template not found')
  }

  const duplicate = {
    ...template,
    id: generateSecureUUID(),
    title: `${template.title} (Copy)`,
    createdAt: new Date().toISOString(),
    lastUsed: null
  }

  return await saveTemplate(duplicate)
}

/**
 * Update last used timestamp
 * @param {string} templateId - Template ID
 * @returns {Promise<void>}
 */
export async function markTemplateUsed(templateId) {
  await updateTemplate(templateId, {
    lastUsed: getCurrentTimestamp()
  })
}

/**
 * Filter templates by criteria
 * @param {Array} templates - All templates
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered templates
 */
export function filterTemplates(templates, filters) {
  return templates.filter((template) => {
    // Type filter
    if (filters.type && template.type !== filters.type) {
      return false
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasAllTags = filters.tags.every((tag) =>
        template.tags.includes(tag)
      )
      if (!hasAllTags) return false
    }

    // Duration range (for routines)
    if (
      filters.durationMin !== undefined &&
      filters.durationMin !== null &&
      template.estimatedDuration < filters.durationMin
    ) {
      return false
    }
    if (
      filters.durationMax !== undefined &&
      filters.durationMax !== null &&
      template.estimatedDuration > filters.durationMax
    ) {
      return false
    }

    // Search query
    if (filters.query) {
      const query = filters.query.toLowerCase()
      const matchesTitle = template.title.toLowerCase().includes(query)
      const matchesTags = template.tags.some((tag) =>
        tag.toLowerCase().includes(query)
      )
      const matchesType = template.type.toLowerCase().includes(query)
      if (!matchesTitle && !matchesTags && !matchesType) {
        return false
      }
    }

    return true
  })
}

/**
 * Sort templates by criteria
 * @param {Array} templates - Templates to sort
 * @param {string} sortBy - Sort field
 * @returns {Array} Sorted templates
 */
export function sortTemplates(templates, sortBy) {
  const sorted = [...templates]

  switch (sortBy) {
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))

    case 'lastUsed':
      return sorted.sort((a, b) => {
        if (!a.lastUsed) return 1
        if (!b.lastUsed) return -1
        return new Date(b.lastUsed) - new Date(a.lastUsed)
      })

    case 'duration':
      return sorted.sort((a, b) => {
        const aDur = a.estimatedDuration || 0
        const bDur = b.estimatedDuration || 0
        return aDur - bDur
      })

    case 'dateCreated':
      return sorted.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt)
      })

    default:
      return sorted
  }
}

/**
 * Export templates to JSON
 * @param {Array<string>} templateIds - Template IDs to export (empty = all)
 * @returns {Promise<Object>} Export data
 */
export async function exportTemplates(templateIds = []) {
  const allTemplates = await getAllTemplates()
  const templatesToExport =
    templateIds.length > 0
      ? allTemplates.filter((t) => templateIds.includes(t.id))
      : allTemplates

  return {
    version: CURRENT_VERSION,
    exportDate: new Date().toISOString(),
    templates: templatesToExport
  }
}

/**
 * Import templates from JSON
 * @param {Object} data - Import data
 * @returns {Promise<Object>} Import results
 */
export async function importTemplates(data) {
  // Validate data structure
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid import data: data must be an object')
  }

  // Validate version field
  if (!data.version) {
    throw new Error('Invalid import data: missing version field')
  }

  // Check version compatibility
  if (!isSupportedVersion(data.version)) {
    throw new Error(
      `Incompatible version: ${data.version}. Supported version range: ${SUPPORTED_VERSION_RANGE}`
    )
  }

  // Validate templates array
  if (!data.templates || !Array.isArray(data.templates)) {
    throw new Error('Invalid import data: missing templates array')
  }

  const results = {
    imported: 0,
    skipped: 0,
    errors: []
  }

  for (const template of data.templates) {
    try {
      // Validate template structure before import
      const validation = validateTemplateData(template)
      if (!validation.valid) {
        throw new Error(validation.errors.join('; '))
      }

      // Re-ID on collision
      const existing = await getTemplate(template.id)
      let templateToSave = template
      if (existing) {
        templateToSave = { ...template, id: generateSecureUUID() }
      }

      await saveTemplate(templateToSave)
      results.imported++
    } catch (error) {
      results.errors.push({
        template: template.title || 'Unknown',
        error: error.message
      })
      results.skipped++
    }
  }

  return results
}
